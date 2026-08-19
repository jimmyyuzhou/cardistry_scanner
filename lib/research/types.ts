import type {
  ResearchChannel,
  ResearchQuery,
  ResearchQueryPurpose,
} from "@/lib/types";

export type ResearchBudget = "skip" | "confirm" | "standard" | "discover";

export type PlannedQuery = ResearchQuery & {
  allowed_domains?: string[];
};

export type SearchHit = {
  url: string;
  title: string;
  snippet: string;
  image_urls: string[];
  provider: ResearchChannel;
  query: string;
  domain: string;
};

export type SearchRequest = {
  query: string;
  channel?: Extract<ResearchChannel, "web">;
  allowedDomains?: string[];
  purpose?: ResearchQueryPurpose;
};

export type SearchProvider = {
  search: (request: SearchRequest) => Promise<SearchHit[]>;
};

export type EbayProvider = {
  search: (query: string) => Promise<SearchHit[]>;
};

export const RESEARCH_SCHEMA_VERSION = "v0.4a.3";

export const QUERY_BUDGETS: Record<
  ResearchBudget,
  { web: number; pages: number; candidates: number }
> = {
  skip: { web: 0, pages: 0, candidates: 0 },
  confirm: { web: 1, pages: 1, candidates: 2 },
  standard: { web: 4, pages: 3, candidates: 5 },
  discover: { web: 2, pages: 2, candidates: 5 },
};
