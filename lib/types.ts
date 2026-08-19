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

export type ResearchStatus =
  | "not_started"
  | "researching"
  | "candidates_found"
  | "resolved"
  | "ambiguous"
  | "failed";

export type ResearchChannel = "web" | "web_image" | "ebay";

export type ResearchGoal =
  | "confirm_entity"
  | "discover_brand"
  | "discover_series"
  | "resolve_edition"
  | "resolve_variant"
  | "test_hypothesis"
  | "discover_alternatives";

export type ResearchQueryPurpose =
  | "discover_entities"
  | "resolve_series"
  | "resolve_edition"
  | "confirm_known"
  | "existence_check"
  | "reference_image"
  | "test_hypothesis"
  | "discover_alternatives";

export type ResearchIdentityField = "brand" | "series" | "edition" | "variant";

export type ResearchQuery = {
  query: string;
  channel: ResearchChannel;
  purpose: ResearchQueryPurpose;
  target_fields: ResearchIdentityField[];
};

export type ResearchSourceType =
  | "official"
  | "archive"
  | "retailer"
  | "community"
  | "unverified";

export type ResearchClaimType =
  | "brand"
  | "series"
  | "edition"
  | "variant"
  | "designer"
  | "collaboration"
  | "release_year"
  | "existence"
  | "nonexistence";

export type DocumentedSourceEntity = {
  canonical_name: string;
  brand: string;
  series: string | null;
  edition: string | null;
  variant: string | null;
};

export type ResearchEvidence = {
  evidence_id: string;
  source_type: ResearchSourceType;
  source_url: string;
  source_title: string;
  source_tier: 1 | 2 | 3 | 4 | 5;
  claim_type: ResearchClaimType;
  claim_value: string;
  evidence_text: string;
  strength: "strong" | "moderate" | "weak";
  independence_group: string;
  notes: string | null;
  documented_entity: DocumentedSourceEntity | null;
};

export type DeckEntityCandidate = {
  candidate_id: string;
  canonical_name: string;
  brand: string;
  series: string | null;
  edition: string | null;
  variant: string | null;
  designer: string | null;
  collaborators: string[];
  release_year: string | null;
  support_score: number;
  reasons: string[];
  evidence_ids: string[];
  existence: "documented" | "unconfirmed" | "not_found";
};

export type ResearchResolutionStatus =
  | "resolved"
  | "probable"
  | "ambiguous"
  | "unresolved";

export type ResearchErrorCode =
  | "missing_vision"
  | "research_unconfigured"
  | "research_timeout"
  | "research_unavailable";

export type ResearchResultPayload = {
  status: Exclude<ResearchStatus, "not_started" | "researching">;
  resolution_status: ResearchResolutionStatus;
  research_goals: ResearchGoal[];
  edition_status: "known" | "unresolved" | "unknown" | "not_documented" | "not_applicable";
  merged_identity: IdentificationResult;
  candidates: DeckEntityCandidate[];
  evidence: ResearchEvidence[];
  queries_run: ResearchQuery[];
  skipped_reason: string | null;
};

export type ResearchSuccessResponse = {
  ok: true;
  research: ResearchResultPayload;
};

export type ResearchErrorResponse = {
  ok: false;
  error_code: ResearchErrorCode;
  research_status: "failed";
};

export type ResearchResponse = ResearchSuccessResponse | ResearchErrorResponse;
