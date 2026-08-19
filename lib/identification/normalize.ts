import type {
  ConfidenceLevel,
  DeckCandidate,
  IdentificationFields,
  IdentificationResult,
  SuggestedNextPhoto,
} from "@/lib/types";
import { IdentificationProviderError } from "@/lib/identification/errors";

const CONFIDENCE_LEVELS = new Set<ConfidenceLevel>([
  "confirmed",
  "high",
  "probable",
  "ambiguous",
  "unknown",
]);

const NEXT_PHOTOS = new Set<Exclude<SuggestedNextPhoto, null>>([
  "tuck_front",
  "tuck_bottom",
  "tuck_back",
  "card_back",
  "tuck_side",
  "seal",
]);

const STATUSES = new Set([
  "identified",
  "ambiguous",
  "unknown",
  "unclear",
  "invalid",
]);

export function normalizeModelOutput(raw: unknown): IdentificationResult {
  if (!isRecord(raw)) {
    throw new IdentificationProviderError("malformed_output");
  }

  const status = asTrimmedString(raw.status);
  if (!status || !STATUSES.has(status)) {
    throw new IdentificationProviderError("malformed_output");
  }

  const suggestedNextPhoto = asSuggestedNextPhoto(raw.suggested_next_photo);
  const fields = readIdentificationFields(raw);

  if (status === "invalid") {
    return {
      status: "invalid",
      message: asTrimmedString(raw.message) ?? "No playing-card deck detected.",
    };
  }

  if (status === "unclear") {
    return {
      status: "unclear",
      message: asTrimmedString(raw.message) ?? "Deck not clearly visible.",
      suggested_next_photo: suggestedNextPhoto ?? "tuck_front",
    };
  }

  if (status === "unknown") {
    return {
      status: "unknown",
      message: asTrimmedString(raw.message) ?? "Unable to identify this deck reliably.",
      ...fields,
      confidence_level: fields.confidence_level === "confirmed" ? "unknown" : fields.confidence_level,
      suggested_next_photo: suggestedNextPhoto,
    };
  }

  if (status === "ambiguous") {
    return {
      status: "ambiguous",
      ...fields,
      confidence_level:
        fields.confidence_level === "confirmed" ? "ambiguous" : fields.confidence_level,
      suggested_next_photo: suggestedNextPhoto,
    };
  }

  const hasIdentity = Boolean(fields.deck_name || fields.brand || fields.series);
  if (!hasIdentity) {
    return {
      status: "unknown",
      message: "Unable to identify this deck reliably.",
      ...fields,
      confidence_level: "unknown",
      suggested_next_photo: suggestedNextPhoto,
    };
  }

  return {
    status: "identified",
    ...fields,
    suggested_next_photo: suggestedNextPhoto,
  };
}

function readIdentificationFields(raw: Record<string, unknown>): IdentificationFields {
  const alternatives = Array.isArray(raw.alternative_candidates)
    ? raw.alternative_candidates
        .map(asDeckCandidate)
        .filter((candidate): candidate is DeckCandidate => candidate !== null)
    : [];

  return {
    deck_name: asNullableName(raw.deck_name),
    brand: asNullableName(raw.brand),
    series: asNullableName(raw.series),
    version: asNullableName(raw.version),
    release_year: asNullableName(raw.release_year),
    designer_or_collaboration: asNullableName(raw.designer_or_collaboration),
    visible_text: asStringList(raw.visible_text),
    visual_features: asStringList(raw.visual_features),
    confidence_level: asConfidenceLevel(raw.confidence_level),
    reasoning_summary: asTrimmedString(raw.reasoning_summary) ?? "",
    alternative_candidates: alternatives,
    uncertainties: asStringList(raw.uncertainties),
    suggested_next_photo: asSuggestedNextPhoto(raw.suggested_next_photo),
  };
}

function asDeckCandidate(value: unknown): DeckCandidate | null {
  if (!isRecord(value)) {
    return null;
  }

  const why = asTrimmedString(value.why);
  const candidate: DeckCandidate = {
    deck_name: asNullableName(value.deck_name),
    brand: asNullableName(value.brand),
    series: asNullableName(value.series),
    version: asNullableName(value.version),
    release_year: asNullableName(value.release_year),
    designer_or_collaboration: asNullableName(value.designer_or_collaboration),
    why: why ?? "",
  };

  if (
    !candidate.deck_name &&
    !candidate.brand &&
    !candidate.series &&
    !candidate.why
  ) {
    return null;
  }

  return candidate;
}

function asConfidenceLevel(value: unknown): ConfidenceLevel {
  const text = asTrimmedString(value)?.toLowerCase();
  if (text && CONFIDENCE_LEVELS.has(text as ConfidenceLevel)) {
    return text as ConfidenceLevel;
  }
  return "unknown";
}

function asSuggestedNextPhoto(value: unknown): SuggestedNextPhoto {
  const text = asTrimmedString(value)?.toLowerCase().replace(/\s+/g, "_");
  if (text && NEXT_PHOTOS.has(text as Exclude<SuggestedNextPhoto, null>)) {
    return text as Exclude<SuggestedNextPhoto, null>;
  }
  return null;
}

function asNullableName(value: unknown): string | null {
  const text = asTrimmedString(value);
  if (!text) {
    return null;
  }

  const normalized = text.toLowerCase();
  if (
    normalized === "null" ||
    normalized === "unknown" ||
    normalized === "n/a" ||
    normalized === "none" ||
    normalized === "not visible"
  ) {
    return null;
  }

  return text;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asTrimmedString(item))
    .filter((item): item is string => Boolean(item));
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
