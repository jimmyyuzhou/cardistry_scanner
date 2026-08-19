import type { DocumentedSourceEntity, IdentificationResult } from "@/lib/types";
import {
  formatCanonicalName,
  nameIncludes,
  namesEqual,
  normalizeEditionLabel,
  normalizeName,
} from "@/lib/research/names";
import { hitText } from "@/lib/research/relevance";
import { effectiveSeries, seriesEvidenceStrength } from "@/lib/research/series-strength";
import { isInvalidSeriesLabel } from "@/lib/research/text-roles";
import type { SearchHit } from "@/lib/research/types";

const KNOWN_SERIES = [
  "Supreme Back",
  "Mystery Decks",
  "Sky Blue",
  "Rider Back",
  "Checkerboard",
  "Fantasies",
  "Carrots",
  "Sleight",
  "5000s",
] as const;

const TITLE_SPLIT = /\s+[—–−-]\s+/;

export function parseSourceEntities(
  hit: Pick<SearchHit, "title" | "snippet" | "url">,
  vision?: IdentificationResult | null,
): DocumentedSourceEntity[] {
  const title = hit.title ?? "";
  const blob = hitText(hit);
  const brand = extractBrand(blob, title, vision);
  if (!brand) {
    return [];
  }

  const series = extractSeries(title, blob, vision);
  if (series && isInvalidSeriesLabel(series)) {
    return [toEntity({ brand, series: null, edition: null, variant: null })];
  }
  const editions = extractBoundEditions(title, blob, series);

  if (editions.length === 0) {
    return [toEntity({ brand, series, edition: null, variant: null })];
  }

  return editions.map((edition) => toEntity({ brand, series, edition, variant: null }));
}

export function extractBrand(
  blob: string,
  title: string,
  vision?: IdentificationResult | null,
): string | null {
  if (vision?.brand && (nameIncludes(blob, vision.brand) || nameIncludes(title, vision.brand))) {
    return vision.brand;
  }

  const fontaineCards = blob.match(/\b(fontaine)\s+cards\b/i);
  if (fontaineCards) {
    return "Fontaine";
  }
  if (/\bfontaine\b/i.test(blob) && !/fontaine[-\s]?mazur/i.test(blob)) {
    return "Fontaine";
  }
  if (/\bbicycle\b/i.test(blob)) {
    return "Bicycle";
  }
  return null;
}

export function extractSeries(
  title: string,
  blob: string,
  vision?: IdentificationResult | null,
): string | null {
  const fromTitlePattern = seriesFromTitlePattern(title, vision);
  if (fromTitlePattern && !isInvalidSeriesLabel(fromTitlePattern)) {
    return fromTitlePattern;
  }

  const fromTitleCatalog = seriesFromCatalog(title, vision);
  if (fromTitleCatalog && !isInvalidSeriesLabel(fromTitleCatalog)) {
    return fromTitleCatalog;
  }

  const fromBlob = seriesFromCatalog(blob, vision);
  return fromBlob && !isInvalidSeriesLabel(fromBlob) ? fromBlob : null;
}

export function seriesIsEstablished(vision: IdentificationResult): boolean {
  return seriesEvidenceStrength(vision) === "strong";
}

export function lockedSeries(vision: IdentificationResult): string | null {
  return seriesIsEstablished(vision) ? effectiveSeries(vision) : null;
}

function seriesFromTitlePattern(title: string, vision?: IdentificationResult | null): string | null {
  const collaboration = title.match(
    /\b([A-Za-z][A-Za-z0-9'’.-]*)\s+[×x]\s+([A-Za-z][A-Za-z0-9'’.\s-]*?)(?:\s+v(?:ersion)?\s*[1-3]|\s+playing|\s*$)/i,
  );
  if (collaboration) {
    const right = cleanSeriesLabel(collaboration[2]);
    if (right) {
      return canonicalSeriesName(right) ?? right;
    }
  }

  const dashed = title.split(TITLE_SPLIT)[0]?.trim() ?? "";
  if (dashed && TITLE_SPLIT.test(title)) {
    const withoutYear = dashed.replace(/\(\s*\d{4}\s*\)/g, " ").trim();
    const withoutEdition = stripEditionToken(withoutYear);
    const cleaned = cleanSeriesLabel(withoutEdition);
    if (cleaned) {
      return canonicalSeriesName(cleaned) ?? cleaned;
    }
  }

  const brandSeriesEdition = title.match(
    /\b(fontaine|bicycle)\s+(?:[×]\s+|\bx\s+)?([A-Za-z][A-Za-z0-9'’.\s-]*?)\s+(?:v(?:ersion)?\s*[1-3]|playing cards)\b/i,
  );
  if (brandSeriesEdition) {
    const series = cleanSeriesLabel(stripEditionToken(brandSeriesEdition[2]));
    if (series && !isInvalidSeriesLabel(series)) {
      return canonicalSeriesName(series) ?? series;
    }
  }

  if (vision?.brand) {
    const branded = title.match(
      new RegExp(
        `\\b${escapeRegExp(vision.brand)}\\s+(?:[×]\\s+|x\\s+)?([A-Za-z][A-Za-z0-9'’.\\s-]{1,40}?)\\s+playing cards\\b`,
        "i",
      ),
    );
    if (branded) {
      const series = cleanSeriesLabel(stripEditionToken(branded[1]));
      if (series && !isInvalidSeriesLabel(series)) {
        return canonicalSeriesName(series) ?? series;
      }
    }
  }

  return null;
}

function seriesFromCatalog(text: string, vision?: IdentificationResult | null): string | null {
  const catalog = catalogSeries(vision);
  for (const series of catalog) {
    if (nameIncludes(text, series) || containsSeriesPhrase(text, series)) {
      return series;
    }
  }

  if (/\bblue fontaine\b/i.test(text) || /\bfontaine(?:'s)? blue\b/i.test(text)) {
    return "Blue";
  }

  return null;
}

function extractBoundEditions(title: string, blob: string, series: string | null): string[] {
  if (!series) {
    return [];
  }

  const pageIsAboutSeries =
    nameIncludes(title, series) ||
    containsSeriesPhrase(title, series) ||
    namesEqual(extractSeries(title, title), series);

  if (!pageIsAboutSeries) {
    return [];
  }

  const labels = [
    ...editionTokens(title),
    ...editionTokens(blob),
  ];
  return [...new Set(labels)];
}

function editionTokens(text: string): string[] {
  const matches = [
    ...(text.match(/\b(v(?:ersion)?\s*[1-3])\b/gi) ?? []),
    ...(text.match(/\b(1st|2nd|3rd)\s+edition\b/gi) ?? []),
  ];
  return matches
    .map((item) => normalizeEditionLabel(item))
    .filter((item): item is string => Boolean(item));
}

function catalogSeries(vision?: IdentificationResult | null): string[] {
  const strength = vision ? seriesEvidenceStrength(vision) : "none";
  const extra =
    vision && (strength === "strong" || strength === "medium") && effectiveSeries(vision)
      ? [effectiveSeries(vision) as string]
      : [];
  return [...extra, ...KNOWN_SERIES].filter(
    (item, index, all) => all.findIndex((other) => namesEqual(other, item)) === index,
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function canonicalSeriesName(value: string): string | null {
  const catalog = catalogSeries();
  return catalog.find((item) => namesEqual(item, value) || nameIncludes(value, item)) ?? null;
}

function stripEditionToken(value: string): string {
  return value
    .replace(/\b(v(?:ersion)?\s*[1-3]|1st|2nd|3rd)\s*(edition)?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSeriesLabel(value: string): string | null {
  const cleaned = value
    .replace(/\bplaying cards?\b/gi, " ")
    .replace(/\bdecks?\b/gi, " ")
    .replace(/\bfontaine\b/gi, " ")
    .replace(/\s*[×]\s*/g, " ")
    .replace(/\s+x\s+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length >= 2 ? cleaned : null;
}

function containsSeriesPhrase(text: string, series: string): boolean {
  const compactText = normalizeName(text);
  const compactSeries = normalizeName(series);
  return compactSeries.length > 0 && compactText.includes(compactSeries);
}

function toEntity(parts: {
  brand: string;
  series: string | null;
  edition: string | null;
  variant: string | null;
}): DocumentedSourceEntity {
  return {
    canonical_name: formatCanonicalName(parts),
    brand: parts.brand,
    series: parts.series,
    edition: normalizeEditionLabel(parts.edition) ?? parts.edition,
    variant: parts.variant,
  };
}
