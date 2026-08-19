import type { ErrorResult, IdentifyErrorCode } from "@/lib/types";

export const ERROR_MESSAGES: Record<IdentifyErrorCode, string> = {
  missing_image: "Please choose a photo of a deck.",
  empty_image: "That photo file is empty. Try another image.",
  oversized_image: "That photo is too large. Use an image under 10 MB.",
  unsupported_format:
    "Use a JPEG, PNG, or WebP photo. HEIC photos are not supported yet.",
  missing_api_key: "The identification service is not configured.",
  invalid_api_key: "Identification is temporarily unavailable. Try again later.",
  api_unavailable: "Identification is temporarily unavailable. Try again later.",
  malformed_output: "We couldn't read the identification result. Try again.",
  timeout: "Identification took too long. Try again with another photo.",
  unknown: "Something went wrong. Try again.",
};

export const ERROR_HTTP_STATUS: Record<IdentifyErrorCode, number> = {
  missing_image: 400,
  empty_image: 400,
  oversized_image: 413,
  unsupported_format: 415,
  missing_api_key: 500,
  invalid_api_key: 502,
  api_unavailable: 502,
  malformed_output: 502,
  timeout: 504,
  unknown: 500,
};

export function errorResult(
  errorCode: IdentifyErrorCode,
  message: string = ERROR_MESSAGES[errorCode],
): ErrorResult {
  return {
    status: "error",
    error_code: errorCode,
    message,
  };
}

export class IdentificationProviderError extends Error {
  readonly code: IdentifyErrorCode;

  constructor(code: IdentifyErrorCode, message: string = ERROR_MESSAGES[code]) {
    super(message);
    this.name = "IdentificationProviderError";
    this.code = code;
  }
}
