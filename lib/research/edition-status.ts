import type { DeckEntityCandidate, IdentificationResult } from "@/lib/types";
import { isEditionFamily, type ResearchIntent } from "@/lib/research/research-goal";
import { seriesEvidenceStrength } from "@/lib/research/series-strength";

export type EditionStatus =
  | "known"
  | "unresolved"
  | "unknown"
  | "not_documented"
  | "not_applicable";

export function deriveEditionStatus(input: {
  vision: IdentificationResult;
  candidates?: DeckEntityCandidate[];
  intent?: ResearchIntent | null;
  researchComplete?: boolean;
}): EditionStatus {
  if (input.vision.edition) {
    return "known";
  }

  const strength = seriesEvidenceStrength(input.vision);
  const documentedEditions = (input.candidates ?? []).filter(
    (item) => item.existence === "documented" && item.edition,
  );

  if (documentedEditions.length >= 2) {
    return "unresolved";
  }

  if (isEditionFamily(input.vision.series) || input.intent?.goals.includes("resolve_edition")) {
    if (input.researchComplete && documentedEditions.length === 0) {
      return "not_documented";
    }
    return "unresolved";
  }

  if (strength === "strong") {
    if (input.researchComplete && documentedEditions.length === 0) {
      return "not_applicable";
    }
    return documentedEditions.length === 1 ? "known" : "not_applicable";
  }

  if (strength === "weak" || strength === "none") {
    return "unknown";
  }

  return "unknown";
}

export function editionDisplayValue(
  vision: IdentificationResult,
  status: EditionStatus,
): string | null {
  if (vision.edition) {
    return vision.edition;
  }
  if (status === "unresolved") {
    return "Unresolved";
  }
  return null;
}
