import type {
  IdentificationLevel,
  IdentificationResult,
  ObjectType,
} from "@/lib/types";

const STATUSES = new Set([
  "identified",
  "ambiguous",
  "unknown",
  "unclear",
  "invalid",
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

const LEVELS = new Set<IdentificationLevel>([
  "no_deck",
  "deck",
  "brand",
  "series",
  "edition",
  "variant",
]);

export function parseVisionResult(raw: unknown): IdentificationResult | null {
  if (!isRecord(raw)) {
    return null;
  }
  if (typeof raw.status !== "string" || !STATUSES.has(raw.status)) {
    return null;
  }
  if (typeof raw.object_type !== "string" || !OBJECT_TYPES.has(raw.object_type as ObjectType)) {
    return null;
  }
  if (
    typeof raw.identification_level !== "string" ||
    !LEVELS.has(raw.identification_level as IdentificationLevel)
  ) {
    return null;
  }
  if (!isRecord(raw.observation)) {
    return null;
  }

  return raw as IdentificationResult;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
