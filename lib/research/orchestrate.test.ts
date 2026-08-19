import { beforeEach, describe, expect, it } from "vitest";
import { clearResearchCache } from "@/lib/research/cache";
import { resetEvidenceIds } from "@/lib/research/extract";
import { ResearchProviderError } from "@/lib/research/errors";
import { assertSafeHttpsUrl } from "@/lib/research/fetch-page";
import { namesEqual } from "@/lib/research/names";
import { runResearch } from "@/lib/research/orchestrate";
import { parseWebSearchOutput } from "@/lib/research/parse-web-search";
import { visionResult } from "@/lib/research/test-fixtures";
import type { SearchHit, SearchProvider } from "@/lib/research/types";

beforeEach(() => {
  clearResearchCache();
  resetEvidenceIds();
});

function hit(
  query: string,
  url: string,
  title: string,
  snippet: string,
): SearchHit {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  return {
    url,
    title,
    snippet,
    image_urls: [],
    provider: "web",
    query,
    domain,
  };
}

function provider(map: Record<string, SearchHit[]>): SearchProvider {
  return {
    async search(request) {
      return map[request.query] ?? [];
    },
  };
}

const runtime = (search: SearchProvider) => ({
  search,
  fetchExcerpt: async () => null,
  useCache: false,
});

describe("research orchestration", () => {
  it("discovers Blue Fontaine candidates without forcing a winner", async () => {
    const vision = visionResult({
      status: "identified",
      object_type: "card_back",
      identification_level: "brand",
      brand: "Fontaine",
      deck_name: "Fontaine",
      observation: {
        visible_text: [],
        visible_logos_or_marks: ["mirrored white stylized Fontaine mark"],
        visual_features: ["deep blue background", "white border"],
        possible_logo_description: "stylized white Fontaine mark",
      },
    });

    const result = await runResearch(
      vision,
      runtime(
        provider({
          "Fontaine blue playing cards": [
            hit(
              "Fontaine blue playing cards",
              "https://fontainecards.com/blue",
              "Blue Fontaine",
              "Blue Fontaine is a distinct Fontaine playing cards colorway with a deep blue card back.",
            ),
            hit(
              "Fontaine blue playing cards",
              "https://artofplay.com/products/sleight",
              "Sleight Playing Cards",
              "Sleight is a Fontaine deck of playing cards with a blue-adjacent back design.",
            ),
            hit(
              "Fontaine blue playing cards",
              "https://wopc.co.uk/cards/fontaine-sky-blue",
              "Fontaine Sky Blue Playing Cards",
              "Sky Blue Fontaine is another documented blue playing cards colorway.",
            ),
            hit(
              "Fontaine blue playing cards",
              "https://math.example/fontaine-mazur",
              "The Fontaine-Mazur conjecture",
              "A mathematics paper about Galois representations.",
            ),
          ],
        }),
      ),
    );

    expect(result.merged_identity.brand).toBe("Fontaine");
    expect(result.merged_identity.series).toBeNull();
    expect(result.evidence.every((item) => !/mazur|math\.example/i.test(`${item.source_url} ${item.source_title}`))).toBe(
      true,
    );
    expect(result.candidates.filter((item) => item.existence === "documented").length).toBeGreaterThan(1);
    expect(["ambiguous", "candidates_found", "resolved"]).toContain(result.status);
    if (result.resolution_status === "resolved") {
      expect(result.merged_identity.identification_level).not.toBe("edition");
    }
  });

  it("preserves Fontaine x Carrots when edition stays unresolved", async () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Carrots",
      deck_name: "Fontaine · Carrots",
      observation: {
        visible_text: ["FONTAINE"],
        visible_logos_or_marks: [],
        visual_features: ["orange carrot motif"],
        possible_logo_description: null,
      },
    });

    const queries: string[] = [];
    const search: SearchProvider = {
      async search(request) {
        queries.push(request.query);
        if (request.query === "Fontaine Carrots V1 V2 V3") {
          return [
            hit(
              request.query,
              "https://fontainecards.com/carrots",
              "Fontaine × Carrots Playing Cards",
              "Official Fontaine Carrots playing cards. Documented editions include V1, V2, and V3.",
            ),
            hit(
              request.query,
              "https://wopc.co.uk/cards/fontaine-carrots",
              "Fontaine Carrots editions",
              "Collectors distinguish Fontaine Carrots V1, V2, and V3 playing cards by tuck details.",
            ),
            hit(
              request.query,
              "https://fontainecards.com/sleight",
              "SLEIGHT (2017) — FONTAINE CARDS",
              "Sleight playing cards from Fontaine Cards.",
            ),
          ];
        }
        return [
          hit(
            request.query,
            "https://example.com/generic-fontaine",
            "Fontaine history",
            "A broad page about the Fontaine brand.",
          ),
        ];
      },
    };

    const result = await runResearch(vision, runtime(search));

    expect(result.merged_identity.brand).toBe("Fontaine");
    expect(result.merged_identity.series).toBe("Carrots");
    expect(queries[0]).toBe("Fontaine Carrots V1 V2 V3");
    expect(queries.length).toBeLessThan(3);
    expect(result.queries_run.length).toBe(queries.length);
    expect(
      result.candidates.filter((item) => item.existence === "documented").map((item) => item.canonical_name),
    ).toEqual(expect.arrayContaining(["Fontaine × Carrots V1", "Fontaine × Carrots V2", "Fontaine × Carrots V3"]));
    expect(
      result.candidates.some(
        (item) => item.existence === "documented" && /sleight/i.test(item.canonical_name),
      ),
    ).toBe(false);
    if (result.resolution_status !== "resolved") {
      expect(result.merged_identity.edition).toBeNull();
    }
  });

  it("does not let Bicycle Snake self-confirm a burgundy Onyx observation", async () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Bicycle",
      series: "Snake",
      deck_name: "Bicycle Snake",
      observation: {
        visible_text: ["LIMITED EDITION", "Custom Playing Cards"],
        visible_logos_or_marks: [],
        visual_features: [
          "burgundy/maroon tuck",
          "gold Bicycle typography",
          "central snake artwork",
          "dark spade/geometric central shape",
          "thin gold border",
        ],
        possible_logo_description: null,
      },
    });

    const queries: string[] = [];
    const search: SearchProvider = {
      async search(request) {
        queries.push(request.query);
        if (/bicycle snake playing cards/i.test(request.query) && !/burgundy|maroon|gold|spade/i.test(request.query)) {
          return [
            hit(
              request.query,
              "https://www.usplayingcard.com/bicycle-snake",
              "Bicycle Snake Playing Cards",
              "Bicycle Snake playing cards are a real USPCC product with snake artwork.",
            ),
          ];
        }
        return [
          hit(
            request.query,
            "https://www.usplayingcard.com/bicycle-onyx",
            "Bicycle Onyx Playing Cards",
            "Bicycle Onyx playing cards. Burgundy and gold tuck with snake artwork and a central spade.",
          ),
        ];
      },
    };

    const result = await runResearch(vision, runtime(search));
    expect(queries.some((query) => /bicycle snake playing cards/i.test(query))).toBe(true);
    expect(queries.some((query) => /burgundy|maroon|gold|spade/i.test(query))).toBe(true);
    expect(result.research_goals).toEqual(
      expect.arrayContaining(["test_hypothesis", "discover_alternatives"]),
    );
    expect(result.merged_identity.brand).toBe("Bicycle");
    expect(["ambiguous", "candidates_found", "unresolved"]).toContain(result.resolution_status);
    expect(result.resolution_status).not.toBe("resolved");
    const documented = result.candidates.filter((item) => item.existence === "documented");
    expect(documented.some((item) => /onyx/i.test(item.canonical_name))).toBe(true);
    expect(
      documented.some((item) => namesEqual(item.series, "Snake")) &&
        result.resolution_status === "resolved",
    ).toBe(false);
  });

  it("confirms Bicycle Kuromi without inventing editions", async () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Bicycle",
      series: "Kuromi",
      deck_name: "Bicycle Kuromi",
      observation: {
        visible_text: ["Bicycle", "Kuromi"],
        visible_logos_or_marks: [],
        visual_features: [],
        possible_logo_description: null,
      },
    });

    const queries: string[] = [];
    const result = await runResearch(
      vision,
      runtime({
        async search(request) {
          queries.push(request.query);
          return [
            hit(
              request.query,
              "https://www.usplayingcard.com/bicycle-kuromi",
              "Bicycle Kuromi Playing Cards",
              "Official Bicycle Kuromi playing cards collaboration.",
            ),
          ];
        },
      }),
    );

    expect(result.research_goals).toEqual(["confirm_entity"]);
    expect(queries).toHaveLength(1);
    expect(queries[0]).toMatch(/Bicycle Kuromi playing cards/i);
    const documented = result.candidates.filter((item) => item.existence === "documented");
    expect(documented.some((item) => /kuromi/i.test(item.canonical_name))).toBe(true);
    expect(documented.every((item) => !item.edition)).toBe(true);
  });

  it("does not invent Supreme Back editions from unrelated Fontaine series pages", async () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Supreme Back",
      deck_name: "Fontaine Supreme Back",
      confidence_level: "high",
      observation: {
        visible_text: ["Supreme back", "fontaine", "playing cards"],
        visible_logos_or_marks: [],
        visual_features: [],
        possible_logo_description: null,
      },
    });

    const result = await runResearch(
      vision,
      runtime({
        async search() {
          return [
            hit(
              "q",
              "https://fontainecards.com/",
              "Fontaine Cards",
              "Official Fontaine playing cards homepage.",
            ),
            hit(
              "q",
              "https://fontainecards.com/carrots",
              "Carrots v2 — FONTAINE CARDS",
              "Carrots v2 playing cards from Fontaine Cards.",
            ),
            hit(
              "q",
              "https://fontainecards.com/fantasies",
              "Fantasies — FONTAINE CARDS",
              "Fantasies playing cards from Fontaine Cards.",
            ),
            hit(
              "q",
              "https://fontainecards.com/mystery-decks",
              "Mystery Decks — FONTAINE CARDS",
              "Fontaine Mystery Decks playing cards.",
            ),
            hit(
              "q",
              "https://fontainecards.com/5000s",
              "5000s — FONTAINE CARDS",
              "Fontaine 5000s playing cards.",
            ),
          ];
        },
      }),
    );

    expect(result.merged_identity.brand).toBe("Fontaine");
    expect(result.merged_identity.series).toBe("Supreme Back");
    expect(result.merged_identity.edition).toBeNull();
    const documented = result.candidates.filter((item) => item.existence === "documented");
    expect(documented.some((item) => /carrots|fantasies|mystery|5000/i.test(item.canonical_name))).toBe(
      false,
    );
    expect(
      documented.some(
        (item) =>
          namesEqual(item.series, "Supreme Back") && Boolean(item.edition),
      ),
    ).toBe(false);
    expect(result.merged_identity.observation.visible_text).toEqual([
      "Supreme back",
      "fontaine",
      "playing cards",
    ]);
  });

  it("confirms Bicycle Rider Back with a small search footprint", async () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Bicycle",
      series: "Rider Back",
      deck_name: "Bicycle · Rider Back",
    });

    const queries: string[] = [];
    const search: SearchProvider = {
      async search(request) {
        queries.push(request.query);
        return [
          hit(
            request.query,
            "https://bicyclecards.com/products/rider-back",
            "Bicycle Rider Back",
            "The Bicycle Rider Back is the classic USPCC standard deck.",
          ),
        ];
      },
    };

    const result = await runResearch(vision, runtime(search));
    expect(queries).toHaveLength(1);
    expect(result.merged_identity.brand).toBe("Bicycle");
    expect(result.merged_identity.series).toBe("Rider Back");
  });

  it("does not invent an entity for an obscure deck", async () => {
    const vision = visionResult({
      status: "unknown",
      identification_level: "deck",
      observation: {
        visible_text: [],
        visible_logos_or_marks: ["unknown geometric mark"],
        visual_features: ["iridescent tuck with no readable brand"],
        possible_logo_description: null,
      },
    });

    const result = await runResearch(
      vision,
      runtime(
        provider({
          "iridescent tuck with no readable brand playing cards deck": [
            hit(
              "iridescent tuck with no readable brand playing cards deck",
              "https://www.ebay.com/itm/999",
              "Cool cards",
              "Seller listing with no identifiable brand.",
            ),
          ],
        }),
      ),
    );

    expect(result.merged_identity.brand).toBeNull();
    expect(result.merged_identity.identification_level).toBe("deck");
    expect(result.candidates.every((item) => item.existence !== "documented" || item.support_score < 8)).toBe(
      true,
    );
  });

  it("rejects a hallucinated 1ST Playing Cards candidate", async () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "brand",
      brand: "Fontaine",
      alternative_candidates: [
        {
          deck_name: "1ST Playing Cards",
          brand: "1ST Playing Cards",
          series: null,
          edition: null,
          variant: null,
          why: "Stylized mark misread as 1ST",
        },
      ],
    });

    const result = await runResearch(
      vision,
      runtime(
        provider({
          "1ST Playing Cards playing cards": [
            hit(
              "1ST Playing Cards playing cards",
              "https://www.ebay.com/itm/1st",
              "1st lot of cards",
              "First listing, not a brand called 1ST Playing Cards.",
            ),
            hit(
              "1ST Playing Cards playing cards",
              "https://farm.example/carrots",
              "Growing carrots",
              "Agricultural carrots and harvest notes.",
            ),
            hit(
              "1ST Playing Cards playing cards",
              "https://minecraft.fandom.com/wiki/Carrot",
              "Carrot – Minecraft Wiki",
              "Carrots are a food item in Minecraft.",
            ),
          ],
        }),
      ),
    );

    const hallucinated = result.candidates.filter((item) =>
      /1st/i.test(`${item.brand} ${item.canonical_name}`),
    );
    expect(hallucinated.every((item) => item.existence === "not_found")).toBe(true);
    expect(
      result.candidates.some(
        (item) => item.existence === "documented" && /1st playing cards/i.test(item.canonical_name),
      ),
    ).toBe(false);
    expect(result.merged_identity.brand).toBe("Fontaine");
  });

  it("does not search for invalid images", async () => {
    let called = 0;
    const search: SearchProvider = {
      async search() {
        called += 1;
        return [];
      },
    };

    const result = await runResearch(
      visionResult({
        status: "invalid",
        object_type: "no_deck",
        identification_level: "no_deck",
      }),
      runtime(search),
    );

    expect(called).toBe(0);
    expect(result.skipped_reason).toBeTruthy();
    expect(result.status).toBe("failed");
  });

  it("preserves vision when the research provider is unavailable", async () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Carrots",
      deck_name: "Fontaine · Carrots",
    });

    const result = await runResearch(
      vision,
      runtime({
        async search() {
          throw new ResearchProviderError("research_unavailable");
        },
      }),
    );

    expect(result.status).toBe("failed");
    expect(result.merged_identity.brand).toBe("Fontaine");
    expect(result.merged_identity.series).toBe("Carrots");
    expect(result.merged_identity.identification_level).toBe("series");
  });

  it("preserves a partial identity when research returns no hits", async () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Carrots",
      deck_name: "Fontaine · Carrots",
    });

    const result = await runResearch(vision, runtime(provider({})));
    expect(result.merged_identity.brand).toBe("Fontaine");
    expect(result.merged_identity.series).toBe("Carrots");
    expect(result.resolution_status).toBe("unresolved");
  });
});

describe("web search parsing", () => {
  it("keeps citations and ignores free-form identity prose as the only source of hits", () => {
    const hits = parseWebSearchOutput(
      {
        output: [
          {
            type: "web_search_call",
            action: {
              type: "search",
              query: "Fontaine Carrots playing cards",
              sources: [{ type: "url", url: "https://fontainecards.com/carrots" }],
            },
            results: [
              {
                url: "https://wopc.co.uk/cards/fontaine-carrots",
                title: "Fontaine Carrots",
                snippet: "Documented collaboration editions.",
              },
            ],
          },
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: "This is definitely Fontaine Carrots V2.",
                annotations: [
                  {
                    type: "url_citation",
                    url: "https://artofplay.com/products/carrots",
                    title: "Art of Play",
                    start_index: 0,
                    end_index: 18,
                  },
                ],
              },
            ],
          },
        ],
      },
      "Fontaine Carrots playing cards",
    );

    expect(hits.map((item) => item.url).sort()).toEqual([
      "https://artofplay.com/products/carrots",
      "https://fontainecards.com/carrots",
      "https://wopc.co.uk/cards/fontaine-carrots",
    ].sort());
    expect(hits.every((item) => item.query === "Fontaine Carrots playing cards")).toBe(true);
  });
});

describe("SSRF guards", () => {
  it("rejects localhost and non-https URLs", async () => {
    expect(await assertSafeHttpsUrl("http://example.com")).toBeNull();
    expect(await assertSafeHttpsUrl("https://127.0.0.1/secret")).toBeNull();
    expect(await assertSafeHttpsUrl("https://localhost/x")).toBeNull();
  });
});
