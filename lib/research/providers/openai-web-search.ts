import OpenAI, {
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
  AuthenticationError,
} from "openai";
import { ResearchProviderError } from "@/lib/research/errors";
import { parseWebSearchOutput } from "@/lib/research/parse-web-search";
import type { SearchHit, SearchProvider, SearchRequest } from "@/lib/research/types";

const SEARCH_TIMEOUT_MS = 20_000;

export function createOpenAIWebSearchProvider(): SearchProvider {
  return {
    async search(request: SearchRequest): Promise<SearchHit[]> {
      const { client, model } = researchClient();

      try {
        const response = await client.responses.create(
          {
            model,
            store: false,
            tool_choice: "required",
            tools: [
              {
                type: "web_search",
                search_context_size: request.purpose === "confirm_known" ? "low" : "medium",
                ...(request.allowedDomains && request.allowedDomains.length > 0
                  ? { filters: { allowed_domains: request.allowedDomains } }
                  : {}),
              },
            ],
            include: ["web_search_call.action.sources", "web_search_call.results"],
            instructions:
              "You are a retrieval assistant. Use web_search with the exact query you are given. Do not rewrite it into a generic identification question. Do not decide what deck it is. Do not treat your own prose as evidence. Prefer official brand, archive, and specialist retailer sources over marketplaces.",
            input: `Search the public web for this exact query and return sources:\n${request.query}`,
          },
          { timeout: SEARCH_TIMEOUT_MS },
        );

        return parseWebSearchOutput(response, request.query);
      } catch (error) {
        throw mapSearchError(error);
      }
    },
  };
}

export function researchModelName(): string | null {
  return (
    process.env.OPENAI_RESEARCH_MODEL?.trim() ||
    process.env.OPENAI_VISION_MODEL?.trim() ||
    null
  );
}

export function researchClient(): { client: OpenAI; model: string } {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = researchModelName();

  if (!apiKey || !model) {
    throw new ResearchProviderError("research_unconfigured");
  }

  return {
    client: new OpenAI({
      apiKey,
      timeout: SEARCH_TIMEOUT_MS,
    }),
    model,
  };
}

function mapSearchError(error: unknown): ResearchProviderError {
  if (error instanceof ResearchProviderError) {
    return error;
  }
  if (error instanceof AuthenticationError) {
    return new ResearchProviderError("research_unconfigured");
  }
  if (
    error instanceof APIConnectionTimeoutError ||
    error instanceof APIUserAbortError
  ) {
    return new ResearchProviderError("research_timeout");
  }
  if (error instanceof APIError) {
    console.error("Research search provider error", {
      name: error.name,
      status: error.status,
    });
    if (error.status === 401 || error.status === 403) {
      return new ResearchProviderError("research_unconfigured");
    }
    if (error.status === 408 || error.status === 504) {
      return new ResearchProviderError("research_timeout");
    }
    return new ResearchProviderError("research_unavailable");
  }

  console.error("Research search provider error", {
    name: error instanceof Error ? error.name : "unknown",
  });
  return new ResearchProviderError("research_unavailable");
}
