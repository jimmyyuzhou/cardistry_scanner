import type {
  DeckEntityCandidate,
  IdentificationResult,
  ResearchEvidence,
  ResearchResolutionStatus,
} from "@/lib/types";
import { isHallucinatedEntityName } from "@/lib/research/hallucinations";
import { nameIncludes, namesEqual, normalizeName } from "@/lib/research/names";
import { seriesEvidenceStrength } from "@/lib/research/series-strength";
import { tierWeight } from "@/lib/research/source-tiers";

export type Resolution = {
  status: ResearchResolutionStatus;
  winner: DeckEntityCandidate | null;
  documented: DeckEntityCandidate[];
};

export function resolveEntities(input: {
  vision: IdentificationResult;
  candidates: DeckEntityCandidate[];
  evidence: ResearchEvidence[];
}): Resolution {
  const documented = input.candidates.filter((candidate) => {
    if (candidate.existence !== "documented") {
      return false;
    }
    if (isHallucinatedEntityName(candidate.brand) || isHallucinatedEntityName(candidate.canonical_name)) {
      return false;
    }
    return true;
  });

  const scored = documented
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, input.vision, input.evidence),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  if (scored.length === 0) {
    return { status: "unresolved", winner: null, documented };
  }

  const top = scored[0];
  const second = scored[1];
  const sameSeriesCluster = sameBrandSeries(scored.map((item) => item.candidate));

  if (second && Math.abs(top.score - second.score) < 1.5) {
    if (sameSeriesCluster && input.vision.series && !input.vision.edition) {
      return { status: "ambiguous", winner: null, documented };
    }
    if (!input.vision.series) {
      return { status: "ambiguous", winner: null, documented };
    }
    return { status: "ambiguous", winner: null, documented };
  }

  if (top.score >= 6 && (!second || top.score - second.score >= 2)) {
    if (isWeakSelfConfirmation(input.vision, top.candidate)) {
      return { status: "ambiguous", winner: null, documented };
    }
    return { status: "resolved", winner: top.candidate, documented };
  }

  if (top.score >= 3) {
    if (isWeakSelfConfirmation(input.vision, top.candidate)) {
      return { status: "unresolved", winner: null, documented };
    }
    return { status: "probable", winner: top.candidate, documented };
  }

  return { status: "unresolved", winner: null, documented };
}

function scoreCandidate(
  candidate: DeckEntityCandidate,
  vision: IdentificationResult,
  evidence: ResearchEvidence[],
): number {
  let score = 0;
  const related = evidence.filter((item) => candidate.evidence_ids.includes(item.evidence_id));

  if (vision.brand && !namesEqual(candidate.brand, vision.brand) && !nameIncludes(candidate.brand, vision.brand)) {
    return 0;
  }
  if (vision.brand && namesEqual(candidate.brand, vision.brand)) {
    score += 3;
  }

  if (vision.series) {
    if (candidate.series && !namesEqual(candidate.series, vision.series)) {
      score -= seriesEvidenceStrength(vision) === "weak" ? 0 : 2;
    } else if (namesEqual(candidate.series, vision.series)) {
      score += seriesEvidenceStrength(vision) === "weak" ? 0 : 2;
    }
  } else if (candidate.series && visualCompatible(candidate, vision)) {
    score += 1.5;
  }

  if (vision.edition) {
    if (candidate.edition && !namesEqual(candidate.edition, vision.edition)) {
      score -= 1;
    } else if (namesEqual(candidate.edition, vision.edition)) {
      score += 1;
    }
  }

  if (visualCompatible(candidate, vision)) {
    score += 1;
  } else if (visualContradicted(candidate, vision)) {
    score -= 2;
  }

  const groups = new Map<string, number>();
  for (const item of related) {
    const current = groups.get(item.independence_group) ?? 0;
    groups.set(item.independence_group, Math.max(current, tierWeight(item.source_tier)));
  }
  for (const weight of groups.values()) {
    score += weight;
  }

  if (related.some((item) => item.claim_type === "nonexistence")) {
    score -= 5;
  }

  return score;
}

function visualCompatible(
  candidate: DeckEntityCandidate,
  vision: IdentificationResult,
): boolean {
  const features = vision.observation.visual_features.join(" ").toLowerCase();
  const label = `${candidate.series ?? ""} ${candidate.variant ?? ""} ${candidate.canonical_name}`.toLowerCase();
  if (features.includes("blue") && label.includes("blue")) {
    return true;
  }
  if (features.includes("carrot") && label.includes("carrot")) {
    return true;
  }
  if (features.includes("rider") && label.includes("rider")) {
    return true;
  }
  return !label.match(/\b(red|green|pink|gold)\b/) || !features.match(/\b(blue|black)\b/);
}

function visualContradicted(
  candidate: DeckEntityCandidate,
  vision: IdentificationResult,
): boolean {
  const features = vision.observation.visual_features.join(" ").toLowerCase();
  const label = `${candidate.series ?? ""} ${candidate.canonical_name}`.toLowerCase();
  return features.includes("blue") && /\b(red|orange|green)\b/.test(label);
}

function sameBrandSeries(candidates: DeckEntityCandidate[]): boolean {
  if (candidates.length < 2) {
    return false;
  }
  const first = candidates[0];
  return candidates.every(
    (item) =>
      namesEqual(item.brand, first.brand) &&
      (namesEqual(item.series, first.series) || !item.series || !first.series),
  );
}

export function canRaiseEdition(resolution: Resolution): boolean {
  return (
    resolution.status === "resolved" &&
    Boolean(resolution.winner?.edition) &&
    resolution.documented.filter((item) => item.edition).length === 1
  );
}

export function canRaiseSeries(resolution: Resolution, vision?: IdentificationResult): boolean {
  if (!resolution.winner?.series) {
    return false;
  }
  if (vision && seriesEvidenceStrength(vision) === "weak") {
    return false;
  }
  if (resolution.status === "resolved") {
    return true;
  }
  if (resolution.status === "probable") {
    const seriesSet = new Set(
      resolution.documented.map((item) => normalizeName(item.series)).filter(Boolean),
    );
    return seriesSet.size === 1;
  }
  return false;
}

function isWeakSelfConfirmation(
  vision: IdentificationResult,
  candidate: DeckEntityCandidate,
): boolean {
  return (
    seriesEvidenceStrength(vision) === "weak" &&
    Boolean(vision.series) &&
    namesEqual(candidate.series, vision.series)
  );
}
