import type { ResearchErrorCode } from "@/lib/types";

export const RESEARCH_ERROR_MESSAGES: Record<ResearchErrorCode, string> = {
  missing_vision: "Research requires a vision identification result.",
  research_unconfigured: "The research service is not configured.",
  research_timeout: "Research took too long. Showing the photo identification.",
  research_unavailable: "Research is temporarily unavailable.",
};

export const RESEARCH_ERROR_HTTP_STATUS: Record<ResearchErrorCode, number> = {
  missing_vision: 400,
  research_unconfigured: 500,
  research_timeout: 504,
  research_unavailable: 502,
};

export class ResearchProviderError extends Error {
  readonly code: ResearchErrorCode;

  constructor(
    code: ResearchErrorCode,
    message: string = RESEARCH_ERROR_MESSAGES[code],
  ) {
    super(message);
    this.name = "ResearchProviderError";
    this.code = code;
  }
}
