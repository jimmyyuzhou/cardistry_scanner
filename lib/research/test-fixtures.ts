import { emptyEvidence, emptyObservation } from "@/lib/identification/defaults";
import type {
  IdentificationFields,
  IdentificationResult,
  ObjectType,
} from "@/lib/types";

export function visionResult(
  overrides: Partial<IdentificationFields> &
    Pick<IdentificationResult, "status"> & {
      object_type?: ObjectType;
    },
): IdentificationResult {
  const base: IdentificationFields = {
    object_type: overrides.object_type ?? "tuck_front",
    identification_level: overrides.identification_level ?? "deck",
    observation: overrides.observation ?? emptyObservation(),
    deck_name: overrides.deck_name ?? null,
    brand: overrides.brand ?? null,
    series: overrides.series ?? null,
    edition: overrides.edition ?? null,
    variant: overrides.variant ?? null,
    designer: overrides.designer ?? null,
    collaborators: overrides.collaborators ?? [],
    release_year: overrides.release_year ?? null,
    brand_evidence: overrides.brand_evidence ?? emptyEvidence(),
    series_evidence: overrides.series_evidence ?? emptyEvidence(),
    edition_evidence: overrides.edition_evidence ?? emptyEvidence(),
    variant_evidence: overrides.variant_evidence ?? emptyEvidence(),
    confidence_level: overrides.confidence_level ?? "probable",
    reasoning_summary: overrides.reasoning_summary ?? "",
    alternative_candidates: overrides.alternative_candidates ?? [],
    uncertainties: overrides.uncertainties ?? [],
    suggested_next_photo: overrides.suggested_next_photo ?? null,
    message: overrides.message ?? null,
  };

  if (overrides.status === "invalid") {
    return { ...base, ...overrides, status: "invalid" };
  }
  if (overrides.status === "unclear") {
    return { ...base, ...overrides, status: "unclear" };
  }
  if (overrides.status === "unknown") {
    return { ...base, ...overrides, status: "unknown" };
  }
  if (overrides.status === "ambiguous") {
    return { ...base, ...overrides, status: "ambiguous" };
  }
  return { ...base, ...overrides, status: "identified" };
}
