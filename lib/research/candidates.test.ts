import { beforeEach, describe, expect, it } from "vitest";
import { promoteCandidates } from "@/lib/research/candidates";
import { extractEvidenceFromHits, resetEvidenceIds } from "@/lib/research/extract";
import { visionResult } from "@/lib/research/test-fixtures";
import type { SearchHit } from "@/lib/research/types";

function hit(url: string, title: string, snippet: string): SearchHit {
  return {
    url,
    title,
    snippet,
    image_urls: [],
    provider: "web",
    query: "test",
    domain: new URL(url).hostname.replace(/^www\./, ""),
  };
}

describe("candidate entity relationships", () => {
  beforeEach(() => {
    resetEvidenceIds();
  });

  it("promotes Carrots v2 as Fontaine × Carrots V2", () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Carrots",
      confidence_level: "high",
      observation: {
        visible_text: ["FONTAINE"],
        visible_logos_or_marks: [],
        visual_features: ["orange carrot motif"],
        possible_logo_description: null,
      },
    });
    const evidence = extractEvidenceFromHits({
      vision,
      hits: [
        hit(
          "https://fontainecards.com/carrots-v2",
          "Carrots v2 — FONTAINE CARDS",
          "Carrots v2 playing cards from Fontaine Cards.",
        ),
      ],
      queries: [],
    });
    const candidates = promoteCandidates({ vision, evidence }).filter(
      (item) => item.existence === "documented",
    );

    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          canonical_name: "Fontaine × Carrots V2",
          brand: "Fontaine",
          series: "Carrots",
          edition: "V2",
          collaborators: ["Carrots"],
        }),
      ]),
    );
    expect(candidates.some((item) => item.canonical_name === "Fontaine V2")).toBe(false);
    expect(
      candidates
        .find((item) => item.canonical_name === "Fontaine × Carrots V2")
        ?.reasons.some((reason) => /v2/i.test(reason) && !/corroborates fontaine/i.test(reason)),
    ).toBe(true);
  });

  it("does not document an edition from brand-only evidence", () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Carrots",
      confidence_level: "high",
    });
    const evidence = extractEvidenceFromHits({
      vision,
      hits: [
        hit(
          "https://fontainecards.com/",
          "Fontaine Cards",
          "Official Fontaine playing cards. Shop the latest decks.",
        ),
      ],
      queries: [],
    });
    const candidates = promoteCandidates({ vision, evidence });
    expect(
      candidates.some(
        (item) => item.existence === "documented" && item.edition === "V2",
      ),
    ).toBe(false);
  });

  it("promotes Fontaine Carrots V3 Playing Cards as Fontaine × Carrots V3", () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Carrots",
      confidence_level: "high",
    });
    const evidence = extractEvidenceFromHits({
      vision,
      hits: [
        hit(
          "https://fontainecards.com/carrots-v3",
          "Fontaine Carrots V3 Playing Cards",
          "Official Fontaine Carrots V3 playing cards tuck.",
        ),
      ],
      queries: [],
    });
    const candidates = promoteCandidates({ vision, evidence }).filter(
      (item) => item.existence === "documented",
    );
    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          canonical_name: "Fontaine × Carrots V3",
          brand: "Fontaine",
          series: "Carrots",
          edition: "V3",
        }),
      ]),
    );
  });

  it("allows Bicycle Onyx to become a documented candidate from observation evidence", () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Bicycle",
      series: "Snake",
      observation: {
        visible_text: ["LIMITED EDITION", "Custom Playing Cards"],
        visible_logos_or_marks: [],
        visual_features: ["burgundy/maroon tuck", "central snake artwork"],
        possible_logo_description: null,
      },
    });
    const evidence = extractEvidenceFromHits({
      vision,
      hits: [
        hit(
          "https://www.usplayingcard.com/bicycle-onyx",
          "Bicycle Onyx Playing Cards",
          "Bicycle Onyx playing cards. Burgundy and gold tuck with snake artwork.",
        ),
      ],
      queries: [],
    });
    const candidates = promoteCandidates({ vision, evidence });
    expect(evidence.some((item) => item.documented_entity?.series === "Onyx")).toBe(true);
    expect(
      candidates.some(
        (item) => item.existence === "documented" && /onyx/i.test(item.canonical_name),
      ),
    ).toBe(true);
  });

  it("does not promote Sleight when Series Carrots is established", () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Carrots",
      confidence_level: "high",
      observation: {
        visible_text: ["FONTAINE"],
        visible_logos_or_marks: [],
        visual_features: ["orange carrot motif"],
        possible_logo_description: null,
      },
    });
    const evidence = extractEvidenceFromHits({
      vision,
      hits: [
        hit(
          "https://fontainecards.com/carrots",
          "Fontaine × Carrots Playing Cards",
          "Official Fontaine Carrots playing cards.",
        ),
        hit(
          "https://fontainecards.com/sleight",
          "SLEIGHT (2017) — FONTAINE CARDS",
          "Sleight playing cards from Fontaine Cards.",
        ),
      ],
      queries: [],
    });
    const candidates = promoteCandidates({ vision, evidence });
    expect(
      candidates.some(
        (item) => item.existence === "documented" && /sleight/i.test(item.canonical_name),
      ),
    ).toBe(false);
    expect(
      candidates.some(
        (item) => item.existence === "documented" && /carrots/i.test(item.canonical_name),
      ),
    ).toBe(true);
  });
});
