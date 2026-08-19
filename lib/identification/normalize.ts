import type {
  ConfidenceLevel,
  DeckCandidate,
  EvidenceKind,
  FieldEvidence,
  IdentificationFields,
  IdentificationLevel,
  IdentificationResult,
  ObjectType,
  Observation,
  SuggestedNextPhoto,
} from "@/lib/types";
import { IdentificationProviderError } from "@/lib/identification/errors";
import { applyIdentityGuardrails } from "@/lib/identification/guardrails";
import { emptyEvidence, emptyObservation } from "@/lib/identification/defaults";

const CONFIDENCE_LEVELS = new Set<ConfidenceLevel>([
  "confirmed",
  "high",
  "probable",
  "ambiguous",
  "unknown",
]);

const OBJECT_TYPES = new Set<ObjectType>([
  "tuck_front",
  "tuck_back",
  "card_back",
  "card_face",
  "sealed_deck",
  "multiple_decks",
  "unknown",
  "no_deck",
]);

const IDENTIFICATION_LEVELS = new Set<IdentificationLevel>([
  "no_deck",
  "deck",
  "brand",
  "series",
  "edition",
  "variant",
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

const VISION_EVIDENCE_KINDS = new Set<EvidenceKind>(["visual", "text"]);

export function normalizeModelOutput(raw: unknown): IdentificationResult {
  if (!isRecord(raw)) {
    throw new IdentificationProviderError("malformed_output");
  }

  const status = asTrimmedString(raw.status);
  if (!status || !STATUSES.has(status)) {
    throw new IdentificationProviderError("malformed_output");
  }

  const fields = readIdentificationFields(raw);

  let result: IdentificationResult;

  if (status === "invalid") {
    result = {
      ...emptyIdentityFields("no_deck"),
      ...fields,
      status: "invalid",
      object_type: "no_deck",
      identification_level: "no_deck",
      message: asTrimmedString(raw.message) ?? "No playing-card deck detected.",
      confidence_level: "unknown",
    };
  } else if (status === "unclear") {
    result = {
      ...fields,
      status: "unclear",
      message: asTrimmedString(raw.message) ?? "Deck not clearly visible.",
      suggested_next_photo: fields.suggested_next_photo ?? "tuck_front",
    };
  } else if (status === "unknown") {
    result = {
      ...fields,
      status: "unknown",
      message: asTrimmedString(raw.message) ?? "Unable to identify this deck reliably.",
    };
  } else if (status === "ambiguous") {
    result = {
      ...fields,
      status: "ambiguous",
    };
  } else {
    result = {
      ...fields,
      status: "identified",
    };
  }

  return applyIdentityGuardrails(result);
}

function readIdentificationFields(raw: Record<string, unknown>): IdentificationFields {
  const observation = asObservation(raw.observation);
  const objectType = asObjectType(raw.object_type);

  return {
    object_type: objectType,
    identification_level: asIdentificationLevel(raw.identification_level, objectType),
    observation,
    message: asTrimmedString(raw.message),
    deck_name: asNullableName(raw.deck_name),
    brand: asNullableName(raw.brand),
    series: asNullableName(raw.series),
    edition: asNullableName(raw.edition ?? raw.version),
    variant: asNullableName(raw.variant),
    designer: asNullableName(raw.designer ?? raw.designer_or_collaboration),
    collaborators: asStringList(raw.collaborators),
    release_year: asNullableName(raw.release_year),
    brand_evidence: asFieldEvidence(raw.brand_evidence),
    series_evidence: asFieldEvidence(raw.series_evidence),
    edition_evidence: asFieldEvidence(raw.edition_evidence),
    variant_evidence: asFieldEvidence(raw.variant_evidence),
    confidence_level: asConfidenceLevel(raw.confidence_level),
    reasoning_summary: asTrimmedString(raw.reasoning_summary) ?? "",
    alternative_candidates: Array.isArray(raw.alternative_candidates)
      ? raw.alternative_candidates
          .map(asDeckCandidate)
          .filter((candidate): candidate is DeckCandidate => candidate !== null)
      : [],
    uncertainties: asStringList(raw.uncertainties),
    suggested_next_photo: asSuggestedNextPhoto(raw.suggested_next_photo),
  };
}

function emptyIdentityFields(objectType: ObjectType): IdentificationFields {
  return {
    object_type: objectType,
    identification_level: objectType === "no_deck" ? "no_deck" : "deck",
    observation: emptyObservation(),
    message: null,
    deck_name: null,
    brand: null,
    series: null,
    edition: null,
    variant: null,
    designer: null,
    collaborators: [],
    release_year: null,
    brand_evidence: emptyEvidence(),
    series_evidence: emptyEvidence(),
    edition_evidence: emptyEvidence(),
    variant_evidence: emptyEvidence(),
    confidence_level: "unknown",
    reasoning_summary: "",
    alternative_candidates: [],
    uncertainties: [],
    suggested_next_photo: null,
  };
}

function asObservation(value: unknown): Observation {
  if (!isRecord(value)) {
    return emptyObservation();
  }

  return {
    visible_text: asStringList(value.visible_text),
    visible_logos_or_marks: asStringList(value.visible_logos_or_marks),
    visual_features: asStringList(value.visual_features),
    possible_logo_description: asTrimmedString(value.possible_logo_description),
  };
}

function asFieldEvidence(value: unknown): FieldEvidence {
  if (!isRecord(value)) {
    return emptyEvidence();
  }

  const kinds = Array.isArray(value.kinds)
    ? value.kinds
        .map((kind) => asTrimmedString(kind)?.toLowerCase())
        .filter((kind): kind is EvidenceKind => Boolean(kind) && VISION_EVIDENCE_KINDS.has(kind as EvidenceKind))
    : [];

  return {
    kinds: unique(kinds),
    summary: asTrimmedString(value.summary),
  };
}

function asDeckCandidate(value: unknown): DeckCandidate | null {
  if (!isRecord(value)) {
    return null;
  }

  const candidate: DeckCandidate = {
    deck_name: asNullableName(value.deck_name),
    brand: asNullableName(value.brand),
    series: asNullableName(value.series),
    edition: asNullableName(value.edition ?? value.version),
    variant: asNullableName(value.variant),
    why: asTrimmedString(value.why) ?? "",
  };

  if (!candidate.deck_name && !candidate.brand && !candidate.series && !candidate.why) {
    return null;
  }

  return candidate;
}

function asObjectType(value: unknown): ObjectType {
  const text = asTrimmedString(value)?.toLowerCase().replace(/\s+/g, "_");
  if (text && OBJECT_TYPES.has(text as ObjectType)) {
    return text as ObjectType;
  }
  return "unknown";
}

function asIdentificationLevel(
  value: unknown,
  objectType: ObjectType,
): IdentificationLevel {
  const text = asTrimmedString(value)?.toLowerCase().replace(/\s+/g, "_");
  if (text && IDENTIFICATION_LEVELS.has(text as IdentificationLevel)) {
    return text as IdentificationLevel;
  }
  return objectType === "no_deck" ? "no_deck" : "deck";
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
    normalized === "not visible" ||
    normalized === "unresolved"
  ) {
    return null;
  }

  return text;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return unique(
    value
      .map((item) => asTrimmedString(item))
      .filter((item): item is string => Boolean(item)),
  );
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
