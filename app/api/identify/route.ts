import {
  ERROR_HTTP_STATUS,
  IdentificationProviderError,
  errorResult,
} from "@/lib/identification/errors";
import {
  MAX_UPLOAD_BYTES,
  validateImageBytes,
} from "@/lib/identification/image-constraints";
import { identifyDeckWithOpenAI } from "@/lib/identification/providers/openai";
import type { IdentifyErrorCode, IdentifyResponse } from "@/lib/types";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return jsonError("missing_image");
    }

    if (image.size === 0) {
      return jsonError("empty_image");
    }

    if (image.size > MAX_UPLOAD_BYTES) {
      return jsonError("oversized_image");
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    const validation = validateImageBytes({
      bytes,
      fileName: image.name,
      declaredType: image.type,
    });

    if (!validation.ok) {
      return jsonError(validation.error_code);
    }

    const result = await identifyDeckWithOpenAI({
      bytes,
      mimeType: validation.mimeType,
    });

    const body: IdentifyResponse = { ok: true, result };
    return Response.json(body);
  } catch (error) {
    if (error instanceof IdentificationProviderError) {
      return jsonError(error.code);
    }

    console.error("Identification route error", {
      name: error instanceof Error ? error.name : "unknown",
    });

    return jsonError("unknown");
  }
}

function jsonError(code: IdentifyErrorCode): Response {
  const body: IdentifyResponse = {
    ok: false,
    result: errorResult(code),
  };

  return Response.json(body, { status: ERROR_HTTP_STATUS[code] });
}
