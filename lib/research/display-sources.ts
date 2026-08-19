import type { IdentificationResult, ResearchEvidence } from "@/lib/types";
import { namesEqual } from "@/lib/research/names";
import { effectiveSeries, seriesPrefersHypothesis } from "@/lib/research/series-strength";
import { lockedSeries } from "@/lib/research/source-entity";
import { canonicalUrl } from "@/lib/research/urls";

export const MAX_DISPLAY_SOURCES = 5;

export type DisplaySource = {
  url: string;
  title: string;
  type: ResearchEvidence["source_type"];
  tier: ResearchEvidence["source_tier"];
  notes: string | null;
  claim_types: Array<ResearchEvidence["claim_type"]>;
};

export type DisplaySourceContext = {
  vision?: IdentificationResult | null;
};

export function selectDisplaySources(
  evidence: ResearchEvidence[],
  context: DisplaySourceContext = {},
): {
  featured: DisplaySource[];
  extra: DisplaySource[];
} {
  const unique = dedupeEvidenceSources(evidence);
  const materialTier5 = unique.filter(
    (item) => item.tier === 5 && isUniqueClaimSource(item, unique),
  );
  const preferred = unique.filter((item) => item.tier <= 4 || materialTier5.includes(item));
  const ranked = preferred.sort((left, right) => {
    const gainDelta = sourceGain(right, context.vision) - sourceGain(left, context.vision);
    if (gainDelta !== 0) {
      return gainDelta;
    }
    if (left.tier !== right.tier) {
      return left.tier - right.tier;
    }
    return right.claim_types.length - left.claim_types.length;
  });

  const informative = ranked.filter((item) => sourceGain(item, context.vision) > 0);
  const pool = informative.length > 0 ? informative : [];

  const featured: DisplaySource[] = [];
  const covered = new Set<string>();
  for (const source of pool) {
    if (featured.length >= MAX_DISPLAY_SOURCES) {
      break;
    }
    const newClaims = source.claim_types.filter((claim) => !covered.has(`${claim}:${source.tier}`));
    if (featured.length === 0 || newClaims.length > 0 || featured.length < 3) {
      featured.push(toDisplaySource(source));
      for (const claim of source.claim_types) {
        covered.add(`${claim}:${source.tier}`);
      }
    }
  }

  if (featured.length < Math.min(MAX_DISPLAY_SOURCES, pool.length)) {
    for (const source of pool) {
      if (featured.length >= MAX_DISPLAY_SOURCES) {
        break;
      }
      if (!featured.some((item) => item.url === source.url)) {
        featured.push(toDisplaySource(source));
      }
    }
  }

  const extra = ranked
    .filter((item) => !featured.some((shown) => shown.url === item.url))
    .map(toDisplaySource);
  return { featured, extra };
}

type RankedSource = DisplaySource & {
  strengthRank: number;
  entitySeries: string | null;
  hasEdition: boolean;
  independence: string;
};

export function dedupeEvidenceSources(evidence: ResearchEvidence[]): RankedSource[] {
  const byUrl = new Map<string, RankedSource>();

  for (const item of evidence) {
    if (!item.source_url.startsWith("https://")) {
      continue;
    }
    const url = canonicalUrl(item.source_url);
    const existing = byUrl.get(url);
    const strengthRank = item.strength === "strong" ? 3 : item.strength === "moderate" ? 2 : 1;
    if (!existing) {
      byUrl.set(url, {
        url,
        title: item.source_title,
        type: item.source_type,
        tier: item.source_tier,
        notes: item.notes,
        claim_types: [item.claim_type],
        strengthRank,
        entitySeries: item.documented_entity?.series ?? null,
        hasEdition: item.claim_type === "edition" || Boolean(item.documented_entity?.edition),
        independence: item.independence_group,
      });
      continue;
    }
    if (item.source_tier < existing.tier || (item.source_tier === existing.tier && strengthRank > existing.strengthRank)) {
      existing.title = item.source_title;
      existing.type = item.source_type;
      existing.tier = item.source_tier;
      existing.notes = item.notes;
      existing.strengthRank = strengthRank;
    }
    if (!existing.claim_types.includes(item.claim_type)) {
      existing.claim_types.push(item.claim_type);
    }
    if (!existing.entitySeries && item.documented_entity?.series) {
      existing.entitySeries = item.documented_entity.series;
    }
    if (item.claim_type === "edition" || item.documented_entity?.edition) {
      existing.hasEdition = true;
    }
  }

  return [...byUrl.values()];
}

function sourceGain(source: RankedSource, vision?: IdentificationResult | null): number {
  if (!vision) {
    return 6 - source.tier;
  }

  const locked = lockedSeries(vision) ?? (seriesPrefersHypothesis(vision) ? effectiveSeries(vision) : null);
  let gain = 0;

  if (locked) {
    if (source.entitySeries && namesEqual(source.entitySeries, locked)) {
      gain += 4;
      if (!vision.edition && source.hasEdition) {
        gain += 4;
      } else if (source.claim_types.includes("series")) {
        gain += 1;
      }
    } else {
      return 0;
    }
  } else if (!vision.series && source.claim_types.includes("series")) {
    gain += 4;
  } else if (source.claim_types.includes("edition")) {
    gain += 2;
  } else if (source.claim_types.includes("brand")) {
    gain += 1;
  }

  gain += 6 - source.tier;
  gain += source.strengthRank;
  return gain;
}

function toDisplaySource(source: RankedSource): DisplaySource {
  return {
    url: source.url,
    title: source.title,
    type: source.type,
    tier: source.tier,
    notes: source.notes,
    claim_types: source.claim_types,
  };
}

function isUniqueClaimSource(source: RankedSource, all: RankedSource[]): boolean {
  return source.claim_types.some(
    (claim) => all.filter((item) => item.claim_types.includes(claim)).length === 1,
  );
}
