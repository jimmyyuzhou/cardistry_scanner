import type { IdentificationResult } from "@/lib/types";
import { namesEqual, normalizeName } from "@/lib/research/names";
import { seriesEvidenceStrength, effectiveSeries } from "@/lib/research/series-strength";
import type { ResearchGoal } from "@/lib/types";

const EDITION_FAMILIES = new Set(["carrots"]);

const WELL_KNOWN_SERIES: Array<{ brand: string; series: string }> = [
  { brand: "bicycle", series: "riderback" },
  { brand: "bicycle", series: "rider" },
  { brand: "bicycle", series: "standard" },
];

export type ResearchIntent = {
  goals: ResearchGoal[];
  budget: "skip" | "confirm" | "standard" | "discover";
};

export function isEditionFamily(series: string | null | undefined): boolean {
  return EDITION_FAMILIES.has(normalizeName(series));
}

export function isWellKnownComplete(result: IdentificationResult): boolean {
  const brand = normalizeName(result.brand);
  const series = normalizeName(effectiveSeries(result));
  if (!brand || !series) {
    return false;
  }
  return WELL_KNOWN_SERIES.some(
    (item) => item.brand === brand && (item.series === series || namesEqual(item.series, result.series)),
  );
}

export function chooseResearchIntent(vision: IdentificationResult): ResearchIntent {
  const series = effectiveSeries(vision);
  const strength = seriesEvidenceStrength(vision);

  if (!vision.brand) {
    return { goals: ["discover_brand"], budget: "discover" };
  }

  if (isWellKnownComplete(vision)) {
    return { goals: ["confirm_entity"], budget: "confirm" };
  }

  if (strength === "weak" && series) {
    return {
      goals: ["test_hypothesis", "discover_alternatives"],
      budget: "standard",
    };
  }

  if (strength === "medium" && series && !vision.edition) {
    const goals: ResearchGoal[] = isEditionFamily(series)
      ? ["resolve_edition", "discover_alternatives"]
      : ["test_hypothesis", "discover_alternatives"];
    return { goals, budget: "standard" };
  }

  if (strength === "strong" && series && !vision.edition) {
    if (isEditionFamily(series)) {
      return { goals: ["resolve_edition"], budget: "standard" };
    }
    return { goals: ["confirm_entity"], budget: "confirm" };
  }

  if (vision.brand && !series) {
    return { goals: ["discover_series"], budget: "standard" };
  }

  if (vision.edition) {
    return { goals: ["confirm_entity"], budget: "confirm" };
  }

  return { goals: ["discover_series"], budget: "standard" };
}

export function needsIndependentDiscovery(vision: IdentificationResult): boolean {
  const strength = seriesEvidenceStrength(vision);
  return strength === "weak" || strength === "medium";
}
