import type { IdentificationResult } from "@/lib/types";
import { nameIncludes, namesEqual, normalizeName } from "@/lib/research/names";
import { isInvalidSeriesLabel } from "@/lib/research/text-roles";

export type SeriesEvidenceStrength = "strong" | "medium" | "weak" | "none";

const GENERIC_MOTIF_SERIES = new Set([
  "snake",
  "dragon",
  "skull",
  "rose",
  "spade",
  "geometric",
  "limitededition",
  "limited",
]);

const DISTINCTIVE_VISUAL_SERIES = new Set(["carrots"]);

export function effectiveSeries(vision: IdentificationResult): string | null {
  if (!vision.series || isInvalidSeriesLabel(vision.series)) {
    return null;
  }
  return vision.series;
}

export function seriesEvidenceStrength(vision: IdentificationResult): SeriesEvidenceStrength {
  const series = effectiveSeries(vision);
  if (!series) {
    return "none";
  }

  const visible = vision.observation.visible_text;
  const literal = visible.some(
    (item) => namesEqual(item, series) || nameIncludes(item, series),
  );
  if (literal) {
    return "strong";
  }

  const blob = observationBlob(vision);
  const motifMatch = motifMatchesSeries(blob, series);
  if (motifMatch && isGenericMotifSeries(series)) {
    return "weak";
  }
  if (motifMatch && DISTINCTIVE_VISUAL_SERIES.has(normalizeName(series))) {
    return "medium";
  }
  if (motifMatch) {
    return "weak";
  }

  if (
    vision.identification_level === "series" ||
    vision.identification_level === "edition" ||
    vision.identification_level === "variant"
  ) {
    return isGenericMotifSeries(series) ? "weak" : "medium";
  }

  return "weak";
}

export function seriesIsStronglyLocked(vision: IdentificationResult): boolean {
  return seriesEvidenceStrength(vision) === "strong";
}

export function seriesPrefersHypothesis(vision: IdentificationResult): boolean {
  const strength = seriesEvidenceStrength(vision);
  return strength === "strong" || strength === "medium";
}

export function isGenericMotifSeries(series: string | null | undefined): boolean {
  return GENERIC_MOTIF_SERIES.has(normalizeName(series));
}

export function observationSupportsSeriesName(
  vision: IdentificationResult,
  series: string,
): boolean {
  const blob = observationBlob(vision);
  if (normalizeName(series) === "carrots") {
    return /carrot/i.test(blob);
  }
  if (normalizeName(series) === "sleight") {
    return /\bsleight\b/i.test(blob);
  }
  if (normalizeName(series) === "onyx") {
    return /onyx|burgundy|maroon/i.test(blob);
  }
  return (
    vision.observation.visible_text.some((item) => nameIncludes(item, series)) ||
    nameIncludes(blob, series)
  );
}

function motifMatchesSeries(blob: string, series: string): boolean {
  if (normalizeName(series) === "carrots") {
    return /carrot/i.test(blob);
  }
  return nameIncludes(blob, series);
}

function observationBlob(vision: IdentificationResult): string {
  return [
    ...vision.observation.visible_text,
    ...vision.observation.visible_logos_or_marks,
    ...vision.observation.visual_features,
    vision.observation.possible_logo_description ?? "",
  ].join(" ");
}
