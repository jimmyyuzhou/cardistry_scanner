import { describe, expect, it } from "vitest";
import { parseSourceEntities } from "@/lib/research/source-entity";
import { visionResult } from "@/lib/research/test-fixtures";

function hit(title: string, snippet = "", url = "https://fontainecards.com/x") {
  return { title, snippet, url };
}

describe("source entity parsing", () => {
  it("keeps Brand + Series + Edition for Carrots v2 — FONTAINE CARDS", () => {
    const entities = parseSourceEntities(
      hit("Carrots v2 — FONTAINE CARDS", "Carrots v2 playing cards from Fontaine Cards."),
    );
    expect(entities).toHaveLength(1);
    expect(entities[0]).toMatchObject({
      brand: "Fontaine",
      series: "Carrots",
      edition: "V2",
      canonical_name: "Fontaine × Carrots V2",
    });
  });

  it("parses Fontaine Carrots V3 Playing Cards as a collaboration edition", () => {
    const entities = parseSourceEntities(
      hit("Fontaine Carrots V3 Playing Cards", "Official Fontaine Carrots V3 playing cards tuck."),
    );
    expect(entities[0]).toMatchObject({
      brand: "Fontaine",
      series: "Carrots",
      edition: "V3",
      canonical_name: "Fontaine × Carrots V3",
    });
  });

  it("normalizes equivalent Carrots V2 naming forms", () => {
    const titles = [
      "Fontaine Carrots V2",
      "Fontaine x Carrots V2",
      "Fontaine × Carrots v2",
      "Carrots v2 — FONTAINE CARDS",
    ];
    for (const title of titles) {
      const entity = parseSourceEntities(hit(title, "Fontaine Carrots playing cards"))[0];
      expect(entity).toMatchObject({
        brand: "Fontaine",
        series: "Carrots",
        edition: "V2",
        canonical_name: "Fontaine × Carrots V2",
      });
    }
  });

  it("parses Bicycle Onyx Playing Cards as series Onyx", () => {
    const entities = parseSourceEntities(
      hit("Bicycle Onyx Playing Cards", "Bicycle Onyx playing cards. Burgundy and gold tuck."),
      visionResult({
        status: "identified",
        identification_level: "series",
        brand: "Bicycle",
        series: "Snake",
      }),
    );
    expect(entities[0]).toMatchObject({
      brand: "Bicycle",
      series: "Onyx",
      canonical_name: "Bicycle Onyx",
    });
  });

  it("does not attach Carrots editions to a Supreme Back vision identity", () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Supreme Back",
      confidence_level: "high",
    });
    const entities = parseSourceEntities(
      hit("Carrots v2 — FONTAINE CARDS", "Carrots v2 playing cards from Fontaine Cards."),
      vision,
    );
    expect(entities[0]?.series).toBe("Carrots");
    expect(entities[0]?.edition).toBe("V2");
    expect(entities[0]?.canonical_name).toBe("Fontaine × Carrots V2");
  });
});
