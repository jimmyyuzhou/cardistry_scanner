import { describe, expect, it } from "vitest";
import { classifyIdentityText, isInvalidSeriesLabel } from "@/lib/research/text-roles";
import { seriesEvidenceStrength } from "@/lib/research/series-strength";
import { visionResult } from "@/lib/research/test-fixtures";

describe("identity text roles", () => {
  it("classifies brands, descriptors, and motifs", () => {
    expect(classifyIdentityText("BICYCLE")).toBe("brand");
    expect(classifyIdentityText("Kuromi")).toBe("series_or_product");
    expect(classifyIdentityText("Supreme Back")).toBe("series_or_product");
    expect(classifyIdentityText("V2")).toBe("edition");
    expect(classifyIdentityText("LIMITED EDITION")).toBe("release_descriptor");
    expect(classifyIdentityText("PLAYING CARDS")).toBe("generic_product_text");
    expect(classifyIdentityText("THE UNITED STATES PLAYING CARD COMPANY")).toBe("manufacturer");
    expect(classifyIdentityText("snake artwork")).toBe("visual_motif");
    expect(isInvalidSeriesLabel("Limited Edition")).toBe(true);
  });
});

describe("series evidence strength", () => {
  it("treats literal Kuromi and Supreme Back as strong", () => {
    expect(
      seriesEvidenceStrength(
        visionResult({
          status: "identified",
          identification_level: "series",
          brand: "Bicycle",
          series: "Kuromi",
          observation: {
            visible_text: ["Bicycle", "Kuromi"],
            visible_logos_or_marks: [],
            visual_features: [],
            possible_logo_description: null,
          },
        }),
      ),
    ).toBe("strong");

    expect(
      seriesEvidenceStrength(
        visionResult({
          status: "identified",
          identification_level: "series",
          brand: "Fontaine",
          series: "Supreme Back",
          confidence_level: "high",
          observation: {
            visible_text: ["Supreme back", "fontaine", "playing cards"],
            visible_logos_or_marks: [],
            visual_features: [],
            possible_logo_description: null,
          },
        }),
      ),
    ).toBe("strong");
  });

  it("treats Carrots visual identity as medium and Snake artwork as weak", () => {
    expect(
      seriesEvidenceStrength(
        visionResult({
          status: "identified",
          identification_level: "series",
          brand: "Fontaine",
          series: "Carrots",
          observation: {
            visible_text: ["FONTAINE"],
            visible_logos_or_marks: [],
            visual_features: ["orange carrot motif"],
            possible_logo_description: null,
          },
        }),
      ),
    ).toBe("medium");

    expect(
      seriesEvidenceStrength(
        visionResult({
          status: "identified",
          identification_level: "series",
          brand: "Bicycle",
          series: "Snake",
          observation: {
            visible_text: ["LIMITED EDITION", "Custom Playing Cards"],
            visible_logos_or_marks: [],
            visual_features: ["central snake artwork", "burgundy/maroon tuck"],
            possible_logo_description: null,
          },
        }),
      ),
    ).toBe("weak");
  });
});
