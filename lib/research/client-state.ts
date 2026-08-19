import type {
  IdentificationResult,
  ResearchResultPayload,
} from "@/lib/types";

export type ResearchUiState = "not_started" | "researching" | "complete" | "failed";

export type ScanResearchView = {
  visionResult: IdentificationResult;
  researchState: ResearchUiState;
  researchResult: ResearchResultPayload | null;
};

export function snapshotVision(vision: IdentificationResult): IdentificationResult {
  return structuredClone(vision);
}

export function createScanView(vision: IdentificationResult): ScanResearchView {
  return {
    visionResult: snapshotVision(vision),
    researchState: "not_started",
    researchResult: null,
  };
}

export function beginResearch(view: ScanResearchView): ScanResearchView {
  return {
    visionResult: view.visionResult,
    researchState: "researching",
    researchResult: null,
  };
}

export function completeResearch(
  view: ScanResearchView,
  researchResult: ResearchResultPayload,
): ScanResearchView {
  return {
    visionResult: view.visionResult,
    researchState: "complete",
    researchResult,
  };
}

export function failResearch(view: ScanResearchView): ScanResearchView {
  return {
    visionResult: view.visionResult,
    researchState: "failed",
    researchResult: null,
  };
}

export function researchEnhancedIdentity(
  view: ScanResearchView,
): IdentificationResult | null {
  if (view.researchState !== "complete" || !view.researchResult) {
    return null;
  }
  return view.researchResult.merged_identity;
}

export function researchAddsResolvedFields(
  vision: IdentificationResult,
  merged: IdentificationResult,
): boolean {
  return Boolean(
    (!vision.brand && merged.brand) ||
      (!vision.series && merged.series) ||
      (!vision.edition && merged.edition) ||
      (!vision.variant && merged.variant),
  );
}
