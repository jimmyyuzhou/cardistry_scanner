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

export type DeckCandidate = {
  deck_name: string | null;
  brand: string | null;
  series: string | null;
  version: string | null;
  release_year: string | null;
  designer_or_collaboration: string | null;
  why: string;
};

export type IdentificationFields = {
  deck_name: string | null;
  brand: string | null;
  series: string | null;
  version: string | null;
  release_year: string | null;
  designer_or_collaboration: string | null;
  visible_text: string[];
  visual_features: string[];
  confidence_level: ConfidenceLevel;
  reasoning_summary: string;
  alternative_candidates: DeckCandidate[];
  uncertainties: string[];
  suggested_next_photo: SuggestedNextPhoto;
};

export type IdentifiedResult = IdentificationFields & {
  status: "identified";
};

export type AmbiguousResult = IdentificationFields & {
  status: "ambiguous";
};

export type UnknownResult = IdentificationFields & {
  status: "unknown";
  message: string;
};

export type UnclearResult = {
  status: "unclear";
  message: string;
  suggested_next_photo: SuggestedNextPhoto;
};

export type InvalidResult = {
  status: "invalid";
  message: string;
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
