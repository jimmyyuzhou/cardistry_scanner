export type AppStep = "home" | "preview" | "crop" | "prepared" | "analyzing" | "result";

export type ConfidenceLevel =
  | "confirmed"
  | "high"
  | "probable"
  | "ambiguous"
  | "unknown";

export type SuggestedNextPhoto =
  | "tuck_front"
  | "tuck_bottom"
  | "tuck_back"
  | "card_back"
  | "tuck_side"
  | "seal"
  | null;

export type ObjectType =
  | "tuck_front"
  | "tuck_back"
  | "card_back"
  | "card_face"
  | "sealed_deck"
  | "multiple_decks"
  | "unknown"
  | "no_deck";

export type IdentificationLevel =
  | "no_deck"
  | "deck"
  | "brand"
  | "series"
  | "edition"
  | "variant";

export type EvidenceKind =
  | "visual"
  | "text"
  | "external"
  | "reference_image"
  | "user_confirmed";

export type IdentifyErrorCode =
  | "missing_image"
  | "empty_image"
  | "oversized_image"
  | "unsupported_format"
  | "missing_api_key"
  | "invalid_api_key"
  | "api_unavailable"
  | "malformed_output"
  | "timeout"
  | "unknown";

export type FieldEvidence = {
  kinds: EvidenceKind[];
  summary: string | null;
};

export type Observation = {
  visible_text: string[];
  visible_logos_or_marks: string[];
  visual_features: string[];
  possible_logo_description: string | null;
};

export type DeckCandidate = {
  deck_name: string | null;
  brand: string | null;
  series: string | null;
  edition: string | null;
  variant: string | null;
  why: string;
};

export type IdentificationFields = {
  object_type: ObjectType;
  identification_level: IdentificationLevel;
  observation: Observation;
  deck_name: string | null;
  brand: string | null;
  series: string | null;
  edition: string | null;
  variant: string | null;
  designer: string | null;
  collaborators: string[];
  release_year: string | null;
  brand_evidence: FieldEvidence;
  series_evidence: FieldEvidence;
  edition_evidence: FieldEvidence;
  variant_evidence: FieldEvidence;
  confidence_level: ConfidenceLevel;
  reasoning_summary: string;
  alternative_candidates: DeckCandidate[];
  uncertainties: string[];
  suggested_next_photo: SuggestedNextPhoto;
  message: string | null;
};

export type IdentifiedResult = IdentificationFields & {
  status: "identified";
};

export type AmbiguousResult = IdentificationFields & {
  status: "ambiguous";
};

export type UnknownResult = IdentificationFields & {
  status: "unknown";
};

export type UnclearResult = IdentificationFields & {
  status: "unclear";
};

export type InvalidResult = IdentificationFields & {
  status: "invalid";
};

export type ErrorResult = {
  status: "error";
  error_code: IdentifyErrorCode;
  message: string;
};

export type IdentificationResult =
  | IdentifiedResult
  | AmbiguousResult
  | UnknownResult
  | UnclearResult
  | InvalidResult;

export type DisplayResult = IdentificationResult | ErrorResult;

export type IdentifySuccessResponse = {
  ok: true;
  result: IdentificationResult;
};

export type IdentifyErrorResponse = {
  ok: false;
  result: ErrorResult;
};

export type IdentifyResponse = IdentifySuccessResponse | IdentifyErrorResponse;
