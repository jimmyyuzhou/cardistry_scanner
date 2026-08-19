import { createHash } from "node:crypto";
import type { IdentificationResult, ResearchResultPayload } from "@/lib/types";
import { RESEARCH_SCHEMA_VERSION, type ResearchBudget } from "@/lib/research/types";

type CacheEntry = {
  expiresAt: number;
  value: ResearchResultPayload;
};

const MAX_ENTRIES = 100;
const TTL_MS = 45 * 60 * 1000;
const store = new Map<string, CacheEntry>();

export function researchCacheKey(
  vision: IdentificationResult,
  budget: ResearchBudget,
): string {
  const payload = {
    v: RESEARCH_SCHEMA_VERSION,
    budget,
    brand: vision.brand,
    series: vision.series,
    edition: vision.edition,
    variant: vision.variant,
    object_type: vision.object_type,
    identification_level: vision.identification_level,
    visual_features: vision.observation.visual_features,
    visible_text: vision.observation.visible_text,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function getCachedResearch(key: string): ResearchResultPayload | null {
  const entry = store.get(key);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  store.delete(key);
  store.set(key, entry);
  return entry.value;
}

export function setCachedResearch(
  key: string,
  value: ResearchResultPayload,
): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) {
      store.delete(oldest);
    }
  }
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

export function clearResearchCache(): void {
  store.clear();
}
