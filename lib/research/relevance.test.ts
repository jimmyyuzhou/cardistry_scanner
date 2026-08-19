import { describe, expect, it } from "vitest";
import { scoreRelevance } from "@/lib/research/relevance";
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

describe("relevance gate", () => {
  it("rejects an agricultural carrot page", () => {
    const scored = scoreRelevance(
      hit(
        "https://farm.example/carrots",
        "How to grow carrots",
        "Carrots are a root vegetable. This gardening and agriculture guide covers soil, harvest, and recipes.",
      ),
    );
    expect(scored.relevance).toBe("irrelevant");
  });

  it("rejects a Minecraft carrot page", () => {
    const scored = scoreRelevance(
      hit(
        "https://minecraft.fandom.com/wiki/Carrot",
        "Carrot – Minecraft Wiki",
        "Carrots are a food item in Minecraft used for breeding and farming.",
      ),
    );
    expect(scored.relevance).toBe("irrelevant");
  });

  it("rejects an unrelated Fontaine-Mazur page", () => {
    const scored = scoreRelevance(
      hit(
        "https://math.example/fontaine-mazur",
        "The Fontaine-Mazur conjecture",
        "This paper studies Galois representations and the Fontaine-Mazur conjecture in arithmetic geometry.",
      ),
    );
    expect(scored.relevance).toBe("irrelevant");
  });

  it("accepts a genuine Fontaine Carrots official page", () => {
    const scored = scoreRelevance(
      hit(
        "https://fontainecards.com/carrots",
        "Fontaine × Carrots Playing Cards",
        "Official Fontaine Carrots playing cards collaboration with a custom tuck box.",
      ),
    );
    expect(scored.relevance).toBe("relevant");
  });

  it("accepts a genuine Carrots V2 playing-card page", () => {
    const scored = scoreRelevance(
      hit(
        "https://wopc.co.uk/cards/fontaine-carrots-v2",
        "Fontaine Carrots V2",
        "Fontaine Carrots V2 playing cards. The tuck design distinguishes this edition from V1 and V3.",
      ),
    );
    expect(scored.relevance).toBe("relevant");
  });
});

describe("claim context", () => {
  const vision = visionResult({
    status: "identified",
    identification_level: "series",
    brand: "Fontaine",
    series: "Carrots",
  });

  it("does not turn an agriculture page into series evidence", () => {
    resetEvidenceIds();
    const evidence = extractEvidenceFromHits({
      vision,
      hits: [
        hit(
          "https://farm.example/carrots",
          "Growing carrots",
          "Carrots are a popular crop. Fontaine farmers recommend this harvest.",
        ),
      ],
      queries: [],
    });
    expect(evidence).toEqual([]);
  });

  it("extracts series and edition claims from an official playing-card page", () => {
    resetEvidenceIds();
    const evidence = extractEvidenceFromHits({
      vision,
      hits: [
        hit(
          "https://fontainecards.com/carrots",
          "Fontaine × Carrots Playing Cards",
          "Official Fontaine Carrots playing cards. Editions include V1, V2, and V3.",
        ),
      ],
      queries: [],
    });
    expect(evidence.some((item) => item.claim_type === "series" && item.claim_value === "Carrots")).toBe(
      true,
    );
    expect(evidence.some((item) => item.claim_type === "edition" && item.claim_value === "V2")).toBe(
      true,
    );
    expect(evidence.every((item) => item.source_tier === 1)).toBe(true);
  });
});
