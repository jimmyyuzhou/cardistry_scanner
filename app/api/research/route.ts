import {
  RESEARCH_ERROR_HTTP_STATUS,
  ResearchProviderError,
} from "@/lib/research/errors";
import { runResearch } from "@/lib/research/orchestrate";
import { parseVisionResult } from "@/lib/research/parse-vision";
import { createOpenAIWebSearchProvider } from "@/lib/research/providers/openai-web-search";
import type { ResearchErrorCode, ResearchResponse } from "@/lib/types";

export const maxDuration = 90;
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const vision = await readVision(request);
    if (!vision) {
      return jsonError("missing_vision");
    }

    const research = await runResearch(vision, {
      search: createOpenAIWebSearchProvider(),
    });

    const body: ResearchResponse = { ok: true, research };
    return Response.json(body);
  } catch (error) {
    if (error instanceof ResearchProviderError) {
      return jsonError(error.code);
    }

    console.error("Research route error", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return jsonError("research_unavailable");
  }
}

async function readVision(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload: unknown = await request.json();
    const vision = isRecord(payload) ? payload.vision : payload;
    return parseVisionResult(vision);
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await request.formData();
    const raw = formData.get("vision");
    if (typeof raw !== "string") {
      return null;
    }
    try {
      return parseVisionResult(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  try {
    const payload: unknown = await request.json();
    const vision = isRecord(payload) ? payload.vision : payload;
    return parseVisionResult(vision);
  } catch {
    return null;
  }
}

function jsonError(code: ResearchErrorCode): Response {
  const body: ResearchResponse = {
    ok: false,
    error_code: code,
    research_status: "failed",
  };
  return Response.json(body, { status: RESEARCH_ERROR_HTTP_STATUS[code] });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
