import type {
  IdentificationResult,
  ResearchQuery,
  ResearchResultPayload,
  ResearchStatus,
} from "@/lib/types";
import { getCachedResearch, researchCacheKey, setCachedResearch } from "@/lib/research/cache";
import { promoteCandidates } from "@/lib/research/candidates";
import { shouldStopSearching } from "@/lib/research/early-stop";
import { chooseResearchBudget, isResearchEligible } from "@/lib/research/eligibility";
import { deriveEditionStatus } from "@/lib/research/edition-status";
import { chooseResearchIntent } from "@/lib/research/research-goal";
import { ResearchProviderError } from "@/lib/research/errors";
import { extractEvidenceFromHits } from "@/lib/research/extract";
import { fetchPageExcerpt } from "@/lib/research/fetch-page";
import { mergeVisionWithResearch } from "@/lib/research/merge";
import { planQueries } from "@/lib/research/query-plan";
import { gateHits } from "@/lib/research/relevance";
import { resolveEntities } from "@/lib/research/resolve";
import { classifySource } from "@/lib/research/source-tiers";
import { canonicalUrl } from "@/lib/research/urls";
import {
  QUERY_BUDGETS,
  type PlannedQuery,
  type SearchHit,
  type SearchProvider,
} from "@/lib/research/types";

const DEFAULT_TIME_BUDGET_MS = 75_000;

export type ResearchRuntime = {
  search: SearchProvider;
  fetchExcerpt?: (url: string) => Promise<string | null>;
  now?: () => number;
  timeBudgetMs?: number;
  useCache?: boolean;
};

export async function runResearch(
  vision: IdentificationResult,
  runtime: ResearchRuntime,
): Promise<ResearchResultPayload> {
  const intent = isResearchEligible(vision) ? chooseResearchIntent(vision) : null;
  const budget = chooseResearchBudget(vision);
  if (budget === "skip" || !isResearchEligible(vision) || !intent) {
    return skipped(vision, skipReason(vision));
  }

  const cacheKey = researchCacheKey(vision, budget);
  if (runtime.useCache !== false) {
    const cached = getCachedResearch(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const planned = planQueries(vision, budget);
  const limits = QUERY_BUDGETS[budget];
  const deadline = (runtime.now ?? Date.now)() + (runtime.timeBudgetMs ?? DEFAULT_TIME_BUDGET_MS);
  const hits: SearchHit[] = [];
  const executed: PlannedQuery[] = [];
  const seenQueries = new Set<string>();
  let timedOut = false;
  let searchFailed = 0;

  for (const query of planned) {
    if ((runtime.now ?? Date.now)() >= deadline) {
      timedOut = true;
      break;
    }
    const key = query.query.toLowerCase();
    if (seenQueries.has(key)) {
      continue;
    }
    seenQueries.add(key);

    try {
      const found = await runtime.search.search({
        query: query.query,
        channel: "web",
        allowedDomains: query.allowed_domains,
        purpose: query.purpose,
      });
      hits.push(...found);
      executed.push(query);
    } catch (error) {
      searchFailed += 1;
      if (error instanceof ResearchProviderError && planned.length === 1) {
        throw error;
      }
      if (
        error instanceof ResearchProviderError &&
        error.code === "research_unconfigured"
      ) {
        throw error;
      }
    }

    const snapshot = processHits(vision, hits, executed);
    if (
      shouldStopSearching({
        vision,
        evidence: snapshot.evidence,
        candidates: snapshot.candidates,
        queriesRun: executed.length,
        executedPurposes: executed.map((item) => item.purpose),
      })
    ) {
      break;
    }
  }

  if (hits.length > 0 && limits.pages > 0 && (runtime.now ?? Date.now)() < deadline) {
    const relevantUrls = new Set(
      gateHits(dedupeHits(hits), vision).relevant.map((hit) => canonicalUrl(hit.url)),
    );
    await enrichHighTierHits({
      hits: hits.filter((hit) => relevantUrls.has(canonicalUrl(hit.url))),
      maxPages: limits.pages,
      fetchExcerpt: runtime.fetchExcerpt ?? fetchPageExcerpt,
      deadline,
      now: runtime.now ?? Date.now,
    });
  }

  const { relevant, evidence, candidates } = processHits(vision, hits, executed);
  const resolution = resolveEntities({ vision, candidates, evidence });
  const merged = mergeVisionWithResearch({
    vision,
    resolution,
    evidence,
    candidates: candidates.slice(0, limits.candidates),
  });

  const payload: ResearchResultPayload = {
    status: toResearchStatus({
      timedOut,
      hits: relevant,
      searchFailed,
      resolution: resolution.status,
      candidateCount: candidates.filter((item) => item.existence === "documented").length,
    }),
    resolution_status: resolution.status,
    research_goals: intent.goals,
    edition_status: deriveEditionStatus({
      vision,
      candidates,
      intent,
      researchComplete: true,
    }),
    merged_identity: merged,
    candidates: candidates.slice(0, limits.candidates),
    evidence,
    queries_run: toPublicQueries(executed),
    skipped_reason: null,
  };

  if (runtime.useCache !== false && payload.status !== "failed") {
    setCachedResearch(cacheKey, payload);
  }

  return payload;
}

function processHits(
  vision: IdentificationResult,
  hits: SearchHit[],
  queries: PlannedQuery[],
) {
  const relevant = gateHits(dedupeHits(hits), vision).relevant;
  const evidence = extractEvidenceFromHits({ vision, hits: relevant, queries });
  const candidates = promoteCandidates({ vision, evidence });
  return { relevant, evidence, candidates };
}

function dedupeHits(hits: SearchHit[]): SearchHit[] {
  const seen = new Map<string, SearchHit>();
  for (const hit of hits) {
    const key = canonicalUrl(hit.url);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, { ...hit, url: key });
      continue;
    }
    if (hit.snippet.length > existing.snippet.length) {
      existing.snippet = hit.snippet;
    }
    if (existing.title === existing.domain && hit.title) {
      existing.title = hit.title;
    }
  }
  return [...seen.values()];
}

function toResearchStatus(input: {
  timedOut: boolean;
  hits: SearchHit[];
  searchFailed: number;
  resolution: ResearchResultPayload["resolution_status"];
  candidateCount: number;
}): Exclude<ResearchStatus, "not_started" | "researching"> {
  if (input.hits.length === 0) {
    return "failed";
  }
  if (input.resolution === "resolved" || input.resolution === "probable") {
    return "resolved";
  }
  if (input.resolution === "ambiguous") {
    return "ambiguous";
  }
  if (input.candidateCount > 0 || input.timedOut) {
    return "candidates_found";
  }
  return "failed";
}

function toPublicQueries(queries: PlannedQuery[]): ResearchQuery[] {
  return queries.map(({ query, channel, purpose, target_fields }) => ({
    query,
    channel,
    purpose,
    target_fields,
  }));
}

function skipped(
  vision: IdentificationResult,
  reason: string,
): ResearchResultPayload {
  return {
    status: "failed",
    resolution_status: "unresolved",
    research_goals: [],
    edition_status: "unknown",
    merged_identity: vision,
    candidates: [],
    evidence: [],
    queries_run: [],
    skipped_reason: reason,
  };
}

function skipReason(vision: IdentificationResult): string {
  if (vision.status === "invalid" || vision.object_type === "no_deck") {
    return "No playing-card deck detected.";
  }
  if (vision.status === "unclear") {
    return "Image is too unclear for research.";
  }
  return "Research was not required.";
}

async function enrichHighTierHits(input: {
  hits: SearchHit[];
  maxPages: number;
  fetchExcerpt: (url: string) => Promise<string | null>;
  deadline: number;
  now: () => number;
}): Promise<void> {
  const ranked = [...input.hits]
    .filter((hit) => classifySource(hit.url).source_tier <= 2)
    .slice(0, input.maxPages);

  for (const hit of ranked) {
    if (input.now() >= input.deadline) {
      return;
    }
    const excerpt = await input.fetchExcerpt(hit.url);
    if (excerpt && excerpt.length > hit.snippet.length) {
      hit.snippet = excerpt;
    }
  }
}
