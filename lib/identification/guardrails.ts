import type {
  ConfidenceLevel,
  DeckCandidate,
  EvidenceKind,
  IdentificationFields,
  IdentificationLevel,
  IdentificationResult,
} from "@/lib/types";
import { emptyEvidence } from "@/lib/identification/defaults";

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  unknown: 0,
  ambiguous: 1,
  probable: 2,
  high: 3,
  confirmed: 4,
};

const HALLUCINATED_VISIBLE_TEXT = /^(1st|1st playing cards)$/i;
const HALLUCINATED_BRANDS = /^(1st|1st playing cards)$/i;

export function applyIdentityGuardrails(
  result: IdentificationResult,
): IdentificationResult {
  const next = { ...result };

  next.observation = {
    ...next.observation,
    visible_text: next.observation.visible_text.filter(
      (item) => !HALLUCINATED_VISIBLE_TEXT.test(item),
    ),
  };

  if (next.brand && HALLUCINATED_BRANDS.test(next.brand)) {
    next.brand = null;
    next.brand_evidence = emptyEvidence();
  }

  next.brand_evidence = visionOnlyEvidence(next.brand_evidence);
  next.series_evidence = visionOnlyEvidence(next.series_evidence);
  next.edition_evidence = visionOnlyEvidence(next.edition_evidence);
  next.variant_evidence = visionOnlyEvidence(next.variant_evidence);

  if (next.object_type === "no_deck" || next.status === "invalid") {
    return finalizeInvalid(next);
  }

  if (namesEqual(next.brand, next.series)) {
    next.series = null;
    next.series_evidence = emptyEvidence();
  }

  if (next.edition && !editionSupportedByObservation(next)) {
    next.alternative_candidates = addCandidate(next.alternative_candidates, {
      deck_name: next.deck_name,
      brand: next.brand,
      series: next.series,
      edition: next.edition,
      variant: next.variant,
      why: "Possible edition from visual similarity only; not treated as resolved without stronger evidence.",
    });
    next.edition = null;
    next.variant = null;
    next.edition_evidence = emptyEvidence();
    next.variant_evidence = emptyEvidence();
    next.uncertainties = uniqueStrings([
      ...next.uncertainties,
      "Exact edition could not be determined from the current visual evidence.",
    ]);
  }

  if (!next.edition) {
    next.variant = null;
    next.variant_evidence = emptyEvidence();
  }

  if (!next.series) {
    next.edition = null;
    next.variant = null;
  }

  if (!next.brand) {
    next.series = null;
    next.edition = null;
    next.variant = null;
  }

  next.identification_level = deriveIdentificationLevel(next);
  next.deck_name = coherentDeckName(next);
  next.confidence_level = capConfidence(next);
  next.suggested_next_photo = deriveSuggestedNextPhoto(next);

  if (next.status === "unclear") {
    next.message = next.message || "Deck not clearly visible.";
    next.suggested_next_photo = next.suggested_next_photo ?? "tuck_front";
    return next;
  }

  if (next.identification_level === "no_deck") {
    return finalizeInvalid(next);
  }

  if (next.identification_level === "deck") {
    return {
      ...next,
      status: "unknown",
      message: next.message || "Unable to identify this deck reliably.",
    };
  }

  if (next.status === "ambiguous") {
    return next;
  }

  return {
    ...next,
    status: "identified",
    message: partialIdentificationMessage(next) ?? next.message,
  };
}

export function deriveIdentificationLevel(
  fields: Pick<
    IdentificationFields,
    "object_type" | "brand" | "series" | "edition" | "variant"
  >,
): IdentificationLevel {
  if (fields.object_type === "no_deck") {
    return "no_deck";
  }
  if (fields.variant && fields.edition && fields.series && fields.brand) {
    return "variant";
  }
  if (fields.edition && fields.series && fields.brand) {
    return "edition";
  }
  if (fields.series && fields.brand) {
    return "series";
  }
  if (fields.brand) {
    return "brand";
  }
  return "deck";
}

function finalizeInvalid(result: IdentificationResult): IdentificationResult {
  return {
    ...result,
    status: "invalid",
    object_type: "no_deck",
    identification_level: "no_deck",
    brand: null,
    series: null,
    edition: null,
    variant: null,
    designer: null,
    collaborators: [],
    release_year: null,
    deck_name: null,
    alternative_candidates: [],
    confidence_level: "unknown",
    message: result.message || "No playing-card deck detected.",
    suggested_next_photo: "tuck_front",
  };
}

function capConfidence(fields: IdentificationFields): ConfidenceLevel {
  let confidence = fields.confidence_level;

  if (confidence === "confirmed") {
    confidence = "high";
  }

  if (fields.object_type === "unknown" || fields.object_type === "no_deck") {
    return minConfidence(confidence, "unknown");
  }

  if (!fields.brand) {
    return minConfidence(confidence, "unknown");
  }

  if (!hasKind(fields.brand_evidence.kinds, "text")) {
    confidence = minConfidence(confidence, "probable");
  }

  if (fields.identification_level === "brand") {
    confidence = minConfidence(confidence, "probable");
  }

  if (!fields.edition && (confidence === "high" || confidence === "confirmed")) {
    confidence = fields.series ? "high" : "probable";
    if (!hasKind(fields.brand_evidence.kinds, "text") && !hasKind(fields.series_evidence.kinds, "text")) {
      confidence = minConfidence(confidence, "probable");
    }
  }

  if (fields.edition && !hasKind(fields.edition_evidence.kinds, "text")) {
    confidence = minConfidence(confidence, "probable");
  }

  return confidence;
}

function editionSupportedByObservation(fields: IdentificationFields): boolean {
  if (!fields.edition) {
    return false;
  }

  if (hasKind(fields.edition_evidence.kinds, "text")) {
    return true;
  }

  const needle = normalizeName(fields.edition);
  return fields.observation.visible_text.some((item) =>
    normalizeName(item).includes(needle),
  );
}

function coherentDeckName(fields: IdentificationFields): string | null {
  if (fields.identification_level === "no_deck" || fields.identification_level === "deck") {
    return null;
  }

  const fromFields = [fields.brand, fields.series, fields.edition, fields.variant]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

  if (!fields.deck_name) {
    return fromFields || null;
  }

  if (fields.brand && !normalizeName(fields.deck_name).includes(normalizeName(fields.brand))) {
    return fromFields || fields.deck_name;
  }

  if (fields.series && namesEqual(fields.deck_name, fields.brand)) {
    return fromFields || fields.deck_name;
  }

  return fields.deck_name;
}

function partialIdentificationMessage(
  fields: IdentificationFields,
): string | null {
  if (fields.identification_level === "series" && !fields.edition) {
    return "Series identified. Exact edition could not be determined from the current visual evidence.";
  }
  if (fields.identification_level === "brand") {
    return "Brand identified. Series could not be determined from the current visual evidence.";
  }
  return null;
}

function deriveSuggestedNextPhoto(
  fields: IdentificationFields,
): IdentificationFields["suggested_next_photo"] {
  if (fields.object_type === "card_back" || fields.object_type === "card_face") {
    return fields.suggested_next_photo ?? "tuck_front";
  }
  if (fields.identification_level === "series" && !fields.edition) {
    return fields.suggested_next_photo ?? "tuck_bottom";
  }
  return fields.suggested_next_photo;
}

function visionOnlyEvidence(
  evidence: IdentificationFields["brand_evidence"],
): IdentificationFields["brand_evidence"] {
  const kinds = evidence.kinds.filter(
    (kind): kind is EvidenceKind => kind === "visual" || kind === "text",
  );
  return { kinds, summary: evidence.summary };
}

function addCandidate(
  existing: DeckCandidate[],
  candidate: DeckCandidate,
): DeckCandidate[] {
  const already = existing.some(
    (item) =>
      namesEqual(item.edition, candidate.edition) &&
      namesEqual(item.series, candidate.series) &&
      namesEqual(item.brand, candidate.brand),
  );
  return already ? existing : [...existing, candidate];
}

function minConfidence(
  current: ConfidenceLevel,
  max: ConfidenceLevel,
): ConfidenceLevel {
  return CONFIDENCE_RANK[current] <= CONFIDENCE_RANK[max] ? current : max;
}

function hasKind(kinds: EvidenceKind[], kind: EvidenceKind): boolean {
  return kinds.includes(kind);
}

function namesEqual(left: string | null, right: string | null): boolean {
  if (!left || !right) {
    return false;
  }
  return normalizeName(left) === normalizeName(right);
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function uniqueStrings(items: string[]): string[] {
  return [...new Set(items)];
}
