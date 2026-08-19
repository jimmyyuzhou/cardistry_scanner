import { describe, expect, it } from "vitest";
import { MAX_DISPLAY_SOURCES, selectDisplaySources } from "@/lib/research/display-sources";
import { visionResult } from "@/lib/research/test-fixtures";
import type { ResearchEvidence } from "@/lib/types";

function evidence(
  overrides: Partial<ResearchEvidence> & Pick<ResearchEvidence, "source_url" | "claim_type">,
): ResearchEvidence {
  return {
    evidence_id: overrides.evidence_id ?? overrides.source_url,
    source_type: overrides.source_type ?? "retailer",
    source_url: overrides.source_url,
    source_title: overrides.source_title ?? "Source",
    source_tier: overrides.source_tier ?? 3,
    claim_type: overrides.claim_type,
    claim_value: overrides.claim_value ?? "Carrots",
    evidence_text: overrides.evidence_text ?? "playing cards",
    strength: overrides.strength ?? "moderate",
    independence_group: overrides.independence_group ?? overrides.source_url,
    notes: overrides.notes ?? "notes",
    documented_entity: overrides.documented_entity ?? null,
  };
}

describe("display sources", () => {
  it("caps the default source list at 5 and hides extra sources", () => {
    const items = Array.from({ length: 8 }, (_, index) =>
      evidence({
        source_url: `https://wopc.co.uk/cards/${index}`,
        source_title: `Archive ${index}`,
        source_type: "archive",
        source_tier: 2,
        claim_type: index % 2 === 0 ? "edition" : "series",
        evidence_id: `ev_${index}`,
      }),
    );

    const { featured, extra } = selectDisplaySources(items);
    expect(featured.length).toBe(MAX_DISPLAY_SOURCES);
    expect(featured.length).toBeLessThanOrEqual(5);
    expect(extra.length).toBe(3);
  });

  it("keeps the strongest copy of canonical URL variants", () => {
    const { featured, extra } = selectDisplaySources([
      evidence({
        source_url: "https://www.fontainecards.com/carrots?utm_source=x",
        source_title: "Official Carrots",
        source_type: "official",
        source_tier: 1,
        claim_type: "series",
        strength: "strong",
      }),
      evidence({
        source_url: "https://fontainecards.com/carrots/",
        source_title: "Official Carrots duplicate",
        source_type: "official",
        source_tier: 1,
        claim_type: "edition",
        strength: "moderate",
      }),
    ]);

    expect(featured).toHaveLength(1);
    expect(extra).toHaveLength(0);
    expect(featured[0]?.url).toBe("https://fontainecards.com/carrots");
    expect(featured[0]?.claim_types).toEqual(["series", "edition"]);
  });

  it("prioritizes Supreme Back evidence over unrelated official Fontaine pages", () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Supreme Back",
      confidence_level: "high",
    });
    const { featured, extra } = selectDisplaySources(
      [
        evidence({
          source_url: "https://fontainecards.com/",
          source_title: "Fontaine Cards",
          source_type: "official",
          source_tier: 1,
          claim_type: "brand",
          documented_entity: {
            canonical_name: "Fontaine",
            brand: "Fontaine",
            series: null,
            edition: null,
            variant: null,
          },
        }),
        evidence({
          source_url: "https://fontainecards.com/carrots",
          source_title: "Carrots v2 — FONTAINE CARDS",
          source_type: "official",
          source_tier: 1,
          claim_type: "edition",
          documented_entity: {
            canonical_name: "Fontaine × Carrots V2",
            brand: "Fontaine",
            series: "Carrots",
            edition: "V2",
            variant: null,
          },
        }),
        evidence({
          source_url: "https://wopc.co.uk/cards/fontaine-supreme-back",
          source_title: "Fontaine Supreme Back",
          source_type: "archive",
          source_tier: 2,
          claim_type: "series",
          documented_entity: {
            canonical_name: "Fontaine Supreme Back",
            brand: "Fontaine",
            series: "Supreme Back",
            edition: null,
            variant: null,
          },
        }),
      ],
      { vision },
    );

    expect(featured).toHaveLength(1);
    expect(featured[0]?.title).toBe("Fontaine Supreme Back");
    expect(featured.length).toBeLessThanOrEqual(5);
    expect(extra.some((item) => /carrots/i.test(item.title))).toBe(true);
  });
});
