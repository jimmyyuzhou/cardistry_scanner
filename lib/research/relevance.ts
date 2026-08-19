import type { IdentificationResult } from "@/lib/types";
import { classifySource } from "@/lib/research/source-tiers";
import type { SearchHit } from "@/lib/research/types";

export type Relevance = "relevant" | "weak" | "irrelevant";

export type GatedHit = SearchHit & {
  relevance: Relevance;
  relevance_score: number;
};

const POSITIVE: Array<{ pattern: RegExp; weight: number }> = [
  { pattern: /designer playing cards/i, weight: 5 },
  { pattern: /playing[- ]cards?/i, weight: 4 },
  { pattern: /cardistry/i, weight: 4 },
  { pattern: /tuck\s*box/i, weight: 3 },
  { pattern: /\btuck\b/i, weight: 2 },
  { pattern: /card\s*back/i, weight: 3 },
  { pattern: /\b(uspcc|cartamundi|epcc)\b/i, weight: 3 },
  { pattern: /\bdecks?\b/i, weight: 1 },
  { pattern: /\bcards\b/i, weight: 1 },
];

const NEGATIVE: Array<{ pattern: RegExp; weight: number }> = [
  { pattern: /minecraft/i, weight: 6 },
  { pattern: /fontaine[-\s]?mazur/i, weight: 6 },
  { pattern: /\b(conjecture|theorem|cohomology|arxiv|doi:)\b/i, weight: 5 },
  { pattern: /\b(agriculture|agricultural|farming|harvest|crop|crops|soil)\b/i, weight: 5 },
  { pattern: /\b(garden|gardening|vegetable|vegetables|nutrition|recipe|recipes|salad)\b/i, weight: 5 },
  { pattern: /carrot\s*cake|baby\s*carrots|grow(?:ing)?\s+carrots/i, weight: 5 },
  { pattern: /\b(cookbook|novel|textbook)\b/i, weight: 3 },
];

export function hitText(hit: Pick<SearchHit, "title" | "snippet" | "url">): string {
  return `${hit.title} ${hit.snippet} ${hit.url}`;
}

export function hasPlayingCardContext(text: string): boolean {
  return (
    /playing[- ]cards?/i.test(text) ||
    /cardistry/i.test(text) ||
    /tuck\s*box/i.test(text) ||
    /card\s*back/i.test(text) ||
    /\b(uspcc|cartamundi)\b/i.test(text) ||
    (/\bdecks?\b/i.test(text) && /\b(cards?|playing|tuck)\b/i.test(text))
  );
}

export function scoreRelevance(
  hit: Pick<SearchHit, "title" | "snippet" | "url">,
  vision?: IdentificationResult | null,
): { relevance: Relevance; score: number } {
  const text = hitText(hit);
  let positive = 0;
  let negative = 0;

  for (const item of POSITIVE) {
    if (item.pattern.test(text)) {
      positive += item.weight;
    }
  }
  for (const item of NEGATIVE) {
    if (item.pattern.test(text)) {
      negative += item.weight;
    }
  }

  const classified = classifySource(hit.url);
  if (classified.source_tier <= 3 && hasPlayingCardContext(text)) {
    positive += 3;
  }

  if (vision?.brand && vision.series) {
    const brand = vision.brand;
    const series = vision.series;
    const together = new RegExp(
      `${escapeRegExp(brand)}.{0,24}${escapeRegExp(series)}|${escapeRegExp(series)}.{0,24}${escapeRegExp(brand)}`,
      "i",
    );
    if (together.test(text) && hasPlayingCardContext(text)) {
      positive += 3;
    }
  }

  const score = positive - negative;
  if (negative >= 4 && positive < 4) {
    return { relevance: "irrelevant", score };
  }
  if (score >= 3 && hasPlayingCardContext(text)) {
    return { relevance: "relevant", score };
  }
  if (score >= 3 && classified.source_tier <= 2 && /\b(deck|cards?|tuck)\b/i.test(text)) {
    return { relevance: "relevant", score };
  }
  if (score >= 1) {
    return { relevance: "weak", score };
  }
  return { relevance: "irrelevant", score };
}

export function gateHits(
  hits: SearchHit[],
  vision?: IdentificationResult | null,
): { relevant: GatedHit[]; weak: GatedHit[]; irrelevant: GatedHit[]; all: GatedHit[] } {
  const all = hits.map((hit) => {
    const scored = scoreRelevance(hit, vision);
    return { ...hit, relevance: scored.relevance, relevance_score: scored.score };
  });
  return {
    all,
    relevant: all.filter((hit) => hit.relevance === "relevant"),
    weak: all.filter((hit) => hit.relevance === "weak"),
    irrelevant: all.filter((hit) => hit.relevance === "irrelevant"),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
