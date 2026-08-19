import OpenAI, {
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
  AuthenticationError,
} from "openai";
import { IdentificationProviderError } from "@/lib/identification/errors";
import {
  IDENTIFICATION_JSON_SCHEMA,
  IDENTIFICATION_SCHEMA_NAME,
  IDENTIFICATION_SYSTEM_PROMPT,
} from "@/lib/identification/schema";
import { normalizeModelOutput } from "@/lib/identification/normalize";
import type { IdentificationResult } from "@/lib/types";

const IDENTIFY_TIMEOUT_MS = 45_000;

export async function identifyDeckWithOpenAI(input: {
  bytes: Buffer;
  mimeType: string;
}): Promise<IdentificationResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_VISION_MODEL?.trim();

  if (!apiKey || !model) {
    throw new IdentificationProviderError("missing_api_key");
  }

  const client = new OpenAI({
    apiKey,
    timeout: IDENTIFY_TIMEOUT_MS,
  });

  const dataUrl = `data:${input.mimeType};base64,${input.bytes.toString("base64")}`;

  try {
    const response = await client.responses.parse(
      {
        model,
        store: false,
        instructions: IDENTIFICATION_SYSTEM_PROMPT,
        text: {
          format: {
            type: "json_schema",
            name: IDENTIFICATION_SCHEMA_NAME,
            strict: true,
            schema: IDENTIFICATION_JSON_SCHEMA as unknown as Record<string, unknown>,
          },
        },
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "Observe this photograph first: object type, literal visible text, logos/marks, and visual features. Then interpret Brand / Series only as far as the image supports. Do not force an edition. Do not treat stylized logos as OCR. Return the structured result only.",
              },
              {
                type: "input_image",
                detail: "high",
                image_url: dataUrl,
              },
            ],
          },
        ],
      },
      { timeout: IDENTIFY_TIMEOUT_MS },
    );

    if (response.output_parsed == null) {
      throw new IdentificationProviderError("malformed_output");
    }

    return normalizeModelOutput(response.output_parsed);
  } catch (error) {
    throw mapProviderError(error);
  }
}

function mapProviderError(error: unknown): IdentificationProviderError {
  if (error instanceof IdentificationProviderError) {
    return error;
  }

  if (error instanceof AuthenticationError) {
    return new IdentificationProviderError("invalid_api_key");
  }

  if (
    error instanceof APIConnectionTimeoutError ||
    error instanceof APIUserAbortError
  ) {
    return new IdentificationProviderError("timeout");
  }

  if (error instanceof APIError) {
    console.error("Identification provider error", {
      name: error.name,
      status: error.status,
    });

    if (error.status === 401 || error.status === 403) {
      return new IdentificationProviderError("invalid_api_key");
    }
    if (error.status === 408 || error.status === 504) {
      return new IdentificationProviderError("timeout");
    }
    if (error.status === 413) {
      return new IdentificationProviderError("oversized_image");
    }
    if (error.status === 415) {
      return new IdentificationProviderError("unsupported_format");
    }
    if (error.status === 400) {
      return new IdentificationProviderError("malformed_output");
    }
    return new IdentificationProviderError("api_unavailable");
  }

  console.error("Identification provider error", {
    name: error instanceof Error ? error.name : "unknown",
  });

  if (isTimeoutLike(error)) {
    return new IdentificationProviderError("timeout");
  }

  return new IdentificationProviderError("unknown");
}

function isTimeoutLike(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();
  return name.includes("timeout") || message.includes("timeout") || name === "aborterror";
}
