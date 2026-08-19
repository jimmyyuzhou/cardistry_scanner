import type { IdentificationResult } from "@/lib/types";
import { nameIncludes, namesEqual, normalizeName } from "@/lib/research/names";
import { hasPlayingCardContext, hitText } from "@/lib/research/relevance";
import { extractSeries } from "@/lib/research/source-entity";
import { effectiveSeries, seriesEvidenceStrength, observationSupportsSeriesName } from "@/lib/research/series-strength";
import type { SearchHit } from "@/lib/research/types";

export type EntityRelevance = "relevant" | "weak" | "irrelevant";

export type EntityRelevanceScore = {
  relevance: EntityRelevance;
  score: number;
  unresolved_field_gain: number;
  documented_series: string | null;
};

const OTHER_SERIES_HINTS = [
  "carrots",
  "sleight",
  "fantasies",
  "mystery decks",
  "mystery deck",
  "sky blue",
  "5000s",
  "supreme back",
  "checkerboard",
];

export function scoreEntityRelevance(
  hit: Pick<SearchHit, "title" | "snippet" | "url">,
  vision?: IdentificationResult | null,
): EntityRelevanceScore {
  const text = hitText(hit);
  const documentedSeries = extractSeries(hit.title, text, vision);
  const strength = vision ? seriesEvidenceStrength(vision) : "none";
  const anchored = vision ? effectiveSeries(vision) : null;
  const locked = strength === "strong" ? anchored : null;

  if (!vision?.brand) {
    return {
      relevance: hasPlayingCardContext(text) ? "weak" : "irrelevant",
      score: hasPlayingCardContext(text) ? 1 : 0,
      unresolved_field_gain: 0,
      documented_series: documentedSeries,
    };
  }

  if (!nameIncludes(text, vision.brand) && !nameIncludes(hit.url, vision.brand)) {
    if (documentedSeries && !locked) {
      return {
        relevance: "weak",
        score: 1,
        unresolved_field_gain: vision.series ? 0 : 1,
        documented_series: documentedSeries,
      };
    }
    return {
      relevance: "irrelevant",
      score: 0,
      unresolved_field_gain: 0,
      documented_series: documentedSeries,
    };
  }

  if (locked) {
    const mentionsLocked = mentionsSeries(text, hit.url, locked);
    if (mentionsLocked) {
      const editionGain = !vision.edition && /\bv(?:ersion)?\s*[1-3]\b/i.test(text) ? 3 : 0;
      return {
        relevance: "relevant",
        score: 4 + editionGain,
        unresolved_field_gain: editionGain + (vision.edition ? 0 : 2),
        documented_series: documentedSeries ?? locked,
      };
    }

    if (documentedSeries && !namesEqual(documentedSeries, locked)) {
      return {
        relevance: "irrelevant",
        score: 0,
        unresolved_field_gain: 0,
        documented_series: documentedSeries,
      };
    }

    if (mentionsCompetingSeries(text, locked)) {
      return {
        relevance: "irrelevant",
        score: 0,
        unresolved_field_gain: 0,
        documented_series: documentedSeries,
      };
    }

    return {
      relevance: "weak",
      score: 1,
      unresolved_field_gain: 0,
      documented_series: documentedSeries,
    };
  }

  if (strength === "medium" && anchored) {
    const mentionsAnchored = mentionsSeries(text, hit.url, anchored);
    if (mentionsAnchored) {
      return {
        relevance: "relevant",
        score: 4,
        unresolved_field_gain: !vision.edition ? 2 : 0,
        documented_series: documentedSeries ?? anchored,
      };
    }
    if (documentedSeries && !namesEqual(documentedSeries, anchored)) {
      if (observationSupportsSeriesName(vision, documentedSeries)) {
        return {
          relevance: "relevant",
          score: 2,
          unresolved_field_gain: 2,
          documented_series: documentedSeries,
        };
      }
      return {
        relevance: "irrelevant",
        score: 0,
        unresolved_field_gain: 0,
        documented_series: documentedSeries,
      };
    }
  }

  const seriesGain = documentedSeries && !vision.series ? 3 : 0;
  return {
    relevance: "relevant",
    score: 3 + seriesGain,
    unresolved_field_gain: seriesGain,
    documented_series: documentedSeries,
  };
}

export function isEntityEligibleForEvidence(
  hit: Pick<SearchHit, "title" | "snippet" | "url">,
  vision?: IdentificationResult | null,
): boolean {
  return scoreEntityRelevance(hit, vision).relevance !== "irrelevant";
}

function mentionsSeries(text: string, url: string, series: string): boolean {
  return nameIncludes(text, series) || nameIncludes(url, series) || containsSeriesPhrase(text, series);
}

function mentionsCompetingSeries(text: string, locked: string): boolean {
  const lockedKey = normalizeName(locked);
  return OTHER_SERIES_HINTS.some((hint) => {
    const key = normalizeName(hint);
    return key !== lockedKey && !lockedKey.includes(key) && text.toLowerCase().includes(hint);
  });
}

function containsSeriesPhrase(text: string, series: string): boolean {
  const compactText = normalizeName(text);
  const compactSeries = normalizeName(series);
  return compactSeries.length > 0 && compactText.includes(compactSeries);
}
