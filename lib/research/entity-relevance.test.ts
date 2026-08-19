import { describe, expect, it } from "vitest";
import { scoreEntityRelevance } from "@/lib/research/entity-relevance";
import { visionResult } from "@/lib/research/test-fixtures";

function hit(url: string, title: string, snippet: string) {
  return { url, title, snippet };
}

describe("entity relevance", () => {
  const supremeBack = visionResult({
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
  });

  it("rejects an official Carrots page while researching Supreme Back", () => {
    const scored = scoreEntityRelevance(
      hit(
        "https://fontainecards.com/carrots",
        "Carrots v2 — FONTAINE CARDS",
        "Carrots v2 playing cards from Fontaine Cards.",
      ),
      supremeBack,
    );
    expect(scored.relevance).toBe("irrelevant");
  });

  it("treats a generic Fontaine homepage as weak when Series is already known", () => {
    const scored = scoreEntityRelevance(
      hit(
        "https://fontainecards.com/",
        "Fontaine Cards",
        "Official Fontaine playing cards. Shop the latest decks.",
      ),
      supremeBack,
    );
    expect(scored.relevance).toBe("weak");
  });

  it("accepts a Supreme Back specific playing-card source", () => {
    const scored = scoreEntityRelevance(
      hit(
        "https://wopc.co.uk/cards/fontaine-supreme-back",
        "Fontaine Supreme Back Playing Cards",
        "A collector note on the Fontaine Supreme Back playing cards tuck.",
      ),
      supremeBack,
    );
    expect(scored.relevance).toBe("relevant");
  });
});
