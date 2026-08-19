import { describe, expect, it } from "vitest";
import {
  beginResearch,
  completeResearch,
  createScanView,
  failResearch,
  researchAddsResolvedFields,
  researchEnhancedIdentity,
} from "@/lib/research/client-state";
import { visionResult } from "@/lib/research/test-fixtures";
import type { ResearchResultPayload } from "@/lib/types";

function payload(
  merged: ResearchResultPayload["merged_identity"],
): ResearchResultPayload {
  return {
    status: "candidates_found",
    resolution_status: "ambiguous",
    merged_identity: merged,
    candidates: [],
    evidence: [],
    queries_run: [],
    research_goals: [],
    edition_status: "unresolved",
    skipped_reason: null,
  };
}

describe("scan research view", () => {
  const vision = visionResult({
    status: "identified",
    identification_level: "series",
    brand: "Fontaine",
    series: "Carrots",
    deck_name: "Fontaine × Carrots",
    observation: {
      visible_text: ["FONTAINE"],
      visible_logos_or_marks: [],
      visual_features: ["orange carrot motif"],
      possible_logo_description: null,
    },
  });

  it("keeps the Vision snapshot unchanged while Research starts", () => {
    const view = createScanView(vision);
    expect(view.researchState).toBe("not_started");
    expect(view.visionResult.brand).toBe("Fontaine");
    expect(view.visionResult.series).toBe("Carrots");

    const researching = beginResearch(view);
    expect(researching.researchState).toBe("researching");
    expect(researching.visionResult).toBe(view.visionResult);
    expect(researching.visionResult.series).toBe("Carrots");
    expect(researching.visionResult.edition).toBeNull();
  });

  it("applies research output in one completion transition", () => {
    const researching = beginResearch(createScanView(vision));
    const merged = visionResult({
      status: "identified",
      identification_level: "series",
      brand: "Fontaine",
      series: "Carrots",
      deck_name: "Fontaine × Carrots",
    });
    const complete = completeResearch(researching, payload(merged));

    expect(complete.researchState).toBe("complete");
    expect(complete.visionResult).toBe(researching.visionResult);
    expect(complete.visionResult.series).toBe("Carrots");
    expect(researchEnhancedIdentity(complete)?.brand).toBe("Fontaine");
    expect(researchAddsResolvedFields(complete.visionResult, merged)).toBe(false);
  });

  it("does not alter Vision when Research fails", () => {
    const researching = beginResearch(createScanView(vision));
    const failed = failResearch(researching);
    expect(failed.researchState).toBe("failed");
    expect(failed.visionResult).toBe(researching.visionResult);
    expect(failed.visionResult.brand).toBe("Fontaine");
    expect(failed.visionResult.series).toBe("Carrots");
    expect(failed.researchResult).toBeNull();
    expect(researchEnhancedIdentity(failed)).toBeNull();
  });
});
