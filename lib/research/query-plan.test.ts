import { describe, expect, it } from "vitest";
import { chooseResearchBudget, isResearchEligible } from "@/lib/research/eligibility";
import { isBannedQuery, planQueries } from "@/lib/research/query-plan";
import { visionResult } from "@/lib/research/test-fixtures";

describe("query planner", () => {
  it("skips invalid images", () => {
    const vision = visionResult({
      status: "invalid",
      object_type: "no_deck",
      identification_level: "no_deck",
    });
    expect(isResearchEligible(vision)).toBe(false);
    expect(chooseResearchBudget(vision)).toBe("skip");
    expect(planQueries(vision, "skip")).toEqual([]);
  });

  it("targets Fontaine blue unresolved series", () => {
    const vision = visionResult({
      status: "identified",
      object_type: "card_back",
      identification_level: "brand",
      brand: "Fontaine",
      observation: {
        visible_text: [],
        visible_logos_or_marks: ["mirrored white stylized Fontaine mark"],
        visual_features: ["deep blue background", "white border"],
        possible_logo_description: "stylized white Fontaine mark",
      },
    });

    const budget = chooseResearchBudget(vision);
    expect(budget).toBe("standard");
    const queries = planQueries(vision, budget).map((item) => item.query);

    expect(queries.some((query) => /fontaine blue playing cards/i.test(query))).toBe(true);
    expect(queries.some((query) => /fontaine blue deck/i.test(query))).toBe(true);
    expect(queries.every((query) => /blue/i.test(query))).toBe(true);
    expect(queries.every((query) => !isBannedQuery(query))).toBe(true);
    expect(queries.every((query) => !/^fontaine playing cards$/i.test(query))).toBe(true);
    expect(queries.length).toBeLessThanOrEqual(3);
  });

  it("targets Fontaine Carrots editions", () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Carrots",
      observation: {
        visible_text: ["FONTAINE"],
        visible_logos_or_marks: [],
        visual_features: ["orange carrot motif", "black tuck"],
        possible_logo_description: null,
      },
    });

    const queries = planQueries(vision, "standard").map((item) => item.query);
    expect(queries[0]).toBe("Fontaine Carrots V1 V2 V3");
    expect(queries.some((query) => /carrots/i.test(query))).toBe(true);
    expect(queries.some((query) => !/\bcarrots\b/i.test(query))).toBe(true);
    expect(queries.every((query) => !/^Fontaine playing cards$/i.test(query))).toBe(true);
    expect(queries.length).toBeLessThanOrEqual(4);
  });

  it("uses a confirm budget for Bicycle Rider Back", () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Bicycle",
      series: "Rider Back",
    });

    expect(chooseResearchBudget(vision)).toBe("confirm");
    const queries = planQueries(vision, "confirm");
    expect(queries).toHaveLength(1);
    expect(queries[0]?.query).toMatch(/Bicycle Rider Back playing cards/i);
    expect(queries[0]?.purpose).toBe("confirm_known");
  });

  it("keeps discover queries small for obscure decks", () => {
    const vision = visionResult({
      status: "unknown",
      identification_level: "deck",
      object_type: "tuck_front",
      observation: {
        visible_text: ["QOR"],
        visible_logos_or_marks: [],
        visual_features: ["iridescent geometric tuck"],
        possible_logo_description: null,
      },
    });

    expect(chooseResearchBudget(vision)).toBe("discover");
    const queries = planQueries(vision, "discover");
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.length).toBeLessThanOrEqual(2);
    expect(queries.every((item) => !isBannedQuery(item.query))).toBe(true);
  });

  it("uses two-track queries for a weak Bicycle Snake hypothesis", () => {
    const vision = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Bicycle",
      series: "Snake",
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

    expect(chooseResearchBudget(vision)).toBe("standard");
    const planned = planQueries(vision, "standard");
    const queries = planned.map((item) => item.query);
    expect(planned.some((item) => item.purpose === "test_hypothesis")).toBe(true);
    expect(planned.some((item) => item.purpose === "discover_alternatives")).toBe(true);
    expect(queries.some((query) => /bicycle snake playing cards/i.test(query))).toBe(true);
    expect(queries.some((query) => /burgundy|maroon|gold|spade/i.test(query))).toBe(true);
    expect(queries.some((query) => !/snake/i.test(query) || /burgundy|maroon|gold|spade/i.test(query))).toBe(
      true,
    );
    expect(queries.every((query) => !/limited edition playing cards/i.test(query))).toBe(true);
  });

  it("confirms Bicycle Kuromi without inventing editions", () => {
    const vision = visionResult({
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
    });

    expect(chooseResearchBudget(vision)).toBe("confirm");
    const planned = planQueries(vision, "confirm");
    expect(planned).toHaveLength(1);
    expect(planned[0]?.purpose).toBe("confirm_known");
    expect(planned[0]?.query).toMatch(/Bicycle Kuromi playing cards/i);
    expect(planned.every((item) => !/v1 v2 v3/i.test(item.query))).toBe(true);
  });

  it("adds an existence check for a 1ST hypothesis", () => {
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
          why: "Stylized mark resembled 1ST",
        },
      ],
    });

    const queries = planQueries(vision, "standard");
    expect(
      queries.some(
        (item) =>
          item.purpose === "existence_check" && /1ST Playing Cards playing cards/i.test(item.query),
      ),
    ).toBe(true);
  });
});
