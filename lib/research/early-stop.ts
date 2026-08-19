import type {
  DeckEntityCandidate,
  IdentificationResult,
  ResearchEvidence,
  ResearchGoal,
} from "@/lib/types";
import { namesEqual, normalizeEditionLabel } from "@/lib/research/names";
import { chooseResearchIntent } from "@/lib/research/research-goal";

export function shouldStopSearching(input: {
  vision: IdentificationResult;
  evidence: ResearchEvidence[];
  candidates: DeckEntityCandidate[];
  queriesRun: number;
  executedPurposes?: string[];
}): boolean {
  if (input.queriesRun < 1) {
    return false;
  }

  const { vision, evidence, candidates } = input;
  const intent = chooseResearchIntent(vision);
  const purposes = input.executedPurposes ?? [];

  if (needsDiscoveryTrack(intent.goals) && !hasDiscoveryQuery(purposes)) {
    return false;
  }

  if (intent.goals.includes("confirm_entity")) {
    return evidence.some(
      (item) =>
        item.source_tier <= 2 &&
        item.claim_type !== "nonexistence" &&
        (namesEqual(item.claim_value, vision.brand) || namesEqual(item.claim_value, vision.series)),
    );
  }

  if (vision.brand && vision.series && !vision.edition && intent.goals.includes("resolve_edition")) {
    const officialSeries = evidence.some(
      (item) =>
        item.source_tier === 1 &&
        (item.claim_type === "series" || item.claim_type === "brand") &&
        (namesEqual(item.claim_value, vision.series) || namesEqual(item.claim_value, vision.brand)),
    );
    const editionClaims = evidence.filter(
      (item) => item.claim_type === "edition" && item.source_tier <= 3,
    );
    const editions = new Set(
      candidates
        .filter((item) => item.existence === "documented")
        .map((item) => normalizeEditionLabel(item.edition))
        .filter((item): item is string => Boolean(item)),
    );
    return officialSeries && editionClaims.length >= 1 && editions.size >= 2;
  }

  if (vision.brand && !vision.series) {
    const seriesCandidates = candidates.filter(
      (item) => item.existence === "documented" && Boolean(item.series),
    );
    const highTierSeries = evidence.some(
      (item) => item.claim_type === "series" && item.source_tier <= 2,
    );
    return seriesCandidates.length >= 2 && highTierSeries;
  }

  if (vision.brand && vision.series && vision.edition) {
    return evidence.some((item) => item.source_tier <= 2 && item.claim_type !== "nonexistence");
  }

  return false;
}

function needsDiscoveryTrack(goals: ResearchGoal[]): boolean {
  return goals.includes("discover_alternatives") || goals.includes("test_hypothesis");
}

function hasDiscoveryQuery(purposes: string[]): boolean {
  return purposes.some(
    (item) => item === "discover_alternatives" || item === "discover_entities",
  );
}
