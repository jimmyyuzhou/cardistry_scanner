import type { IdentificationResult, ResearchEvidence } from "@/lib/types";
import { isHallucinatedEntityName } from "@/lib/research/hallucinations";
import {
  collaborationNames,
  entityKey,
  formatCanonicalName,
  nameIncludes,
  namesEqual,
  normalizeEditionLabel,
} from "@/lib/research/names";
import { observationSupportsSeriesName, seriesEvidenceStrength, effectiveSeries } from "@/lib/research/series-strength";
import { lockedSeries } from "@/lib/research/source-entity";
import type { DeckEntityCandidate } from "@/lib/types";

const MAX_CANDIDATES = 5;

type Acc = {
  brand: string;
  series: string | null;
  edition: string | null;
  variant: string | null;
  evidence: ResearchEvidence[];
  names: string[];
};

export function promoteCandidates(input: {
  vision: IdentificationResult;
  evidence: ResearchEvidence[];
}): DeckEntityCandidate[] {
  const groups = new Map<string, Acc>();
  const locked = lockedSeries(input.vision);
  seedHypotheses(groups, input.vision, locked);

  for (const item of input.evidence) {
    if (item.claim_type === "nonexistence") {
      upsert(groups, {
        brand: parseBrand(item.claim_value, input.vision.brand),
        series: parseSeries(item.claim_value, input.vision),
        edition: parseEdition(item.claim_value),
        variant: null,
        evidence: [item],
        names: [item.claim_value],
      });
      continue;
    }

    const identity = identityFromEvidence(item, input.vision);
    if (!identity) {
      continue;
    }
    if (shouldExcludeCrossSeries(identity, input.vision, item, locked)) {
      continue;
    }
    upsert(groups, {
      ...identity,
      evidence: [item],
      names: [item.claim_value, identity.series, identity.edition, identity.brand].filter(
        (part): part is string => Boolean(part),
      ),
    });
  }

  const candidates = [...groups.values()]
    .filter((group) => isCoherentCandidate(group, locked))
    .map((group, index) => toCandidate(group, index, input.vision))
    .sort((left, right) => right.support_score - left.support_score)
    .slice(0, MAX_CANDIDATES);

  return mergeNameVariants(candidates);
}

function seedHypotheses(
  groups: Map<string, Acc>,
  vision: IdentificationResult,
  locked: string | null,
): void {
  for (const candidate of vision.alternative_candidates) {
    const brand = candidate.brand ?? parseBrand(candidate.deck_name ?? "", vision.brand);
    if (!brand) {
      continue;
    }
    if (
      locked &&
      candidate.series &&
      !namesEqual(candidate.series, locked) &&
      !isHallucinatedEntityName(brand) &&
      !isHallucinatedEntityName(candidate.deck_name)
    ) {
      continue;
    }
    upsert(groups, {
      brand,
      series: candidate.series,
      edition: candidate.edition,
      variant: candidate.variant,
      evidence: [],
      names: [candidate.deck_name, candidate.brand, brand].filter(
        (part): part is string => Boolean(part),
      ),
    });
  }
}

function identityFromEvidence(
  item: ResearchEvidence,
  vision: IdentificationResult,
): Omit<Acc, "evidence" | "names"> | null {
  const entity = item.documented_entity;
  if (entity?.brand) {
    if (item.claim_type === "brand" && !entity.series && !entity.edition) {
      return null;
    }
    if (entity.edition && !entity.series) {
      return null;
    }
    return {
      brand: entity.brand,
      series: entity.series,
      edition: normalizeEditionLabel(entity.edition) ?? entity.edition,
      variant: entity.variant,
    };
  }

  if (item.claim_type === "existence") {
    const brand = parseBrand(item.claim_value, vision.brand);
    if (!brand) {
      return null;
    }
    return {
      brand,
      series: parseSeries(item.claim_value, vision),
      edition: parseEdition(item.claim_value),
      variant: null,
    };
  }

  return null;
}

function shouldExcludeCrossSeries(
  identity: Omit<Acc, "evidence" | "names">,
  vision: IdentificationResult,
  item: ResearchEvidence,
  locked: string | null,
): boolean {
  if (identity.series && namesEqual(identity.series, effectiveSeries(vision) ?? vision.series)) {
    return false;
  }
  if (locked && identity.series && !namesEqual(identity.series, locked)) {
    return !isMaterialSeriesContradiction(vision, identity, item);
  }
  const strength = seriesEvidenceStrength(vision);
  if (
    strength === "medium" &&
    vision.series &&
    identity.series &&
    !namesEqual(identity.series, vision.series)
  ) {
    return !observationSupportsSeriesName(vision, identity.series);
  }
  return false;
}

function isMaterialSeriesContradiction(
  vision: IdentificationResult,
  identity: Omit<Acc, "evidence" | "names">,
  item: ResearchEvidence,
): boolean {
  if (item.source_tier > 2) {
    return false;
  }
  if (!identity.series || !vision.series) {
    return false;
  }
  if (!observationSupportsSeries(vision, identity.series)) {
    return false;
  }
  return observationConflictsWithSeries(vision, vision.series);
}

function observationSupportsSeries(vision: IdentificationResult, series: string): boolean {
  return observationSupportsSeriesName(vision, series);
}

function observationConflictsWithSeries(vision: IdentificationResult, series: string): boolean {
  return !observationSupportsSeries(vision, series);
}

function isCoherentCandidate(group: Acc, locked: string | null): boolean {
  if (group.edition && !group.series) {
    return false;
  }
  if (locked && group.series && !namesEqual(group.series, locked)) {
    return false;
  }
  return true;
}

function upsert(groups: Map<string, Acc>, next: Acc): void {
  const key = entityKey(next);
  const existing = groups.get(key);
  if (!existing) {
    groups.set(key, next);
    return;
  }
  existing.evidence.push(...next.evidence);
  existing.names.push(...next.names);
}

function toCandidate(
  group: Acc,
  index: number,
  vision: IdentificationResult,
): DeckEntityCandidate {
  const documented = hasEntitySpecificEvidence(group);
  const unconfirmed = group.evidence.some(
    (item) => item.claim_type !== "nonexistence" && item.source_url.startsWith("https://"),
  );
  const nonexistent = group.evidence.some((item) => item.claim_type === "nonexistence");
  const hallucinated = [group.brand, group.series, ...group.names].some((name) =>
    isHallucinatedEntityName(name),
  );

  let existence: DeckEntityCandidate["existence"] = "unconfirmed";
  if (hallucinated || (nonexistent && !documented)) {
    existence = "not_found";
  } else if (documented) {
    existence = "documented";
  } else if (!unconfirmed) {
    existence = "not_found";
  }

  const independent = new Set(
    group.evidence
      .filter((item) => item.claim_type !== "nonexistence")
      .map((item) => item.independence_group),
  );
  const bestTier = Math.min(
    ...group.evidence.map((item) => item.source_tier),
    5,
  ) as 1 | 2 | 3 | 4 | 5;

  const edition = normalizeEditionLabel(group.edition) ?? group.edition;
  const canonical_name = formatCanonicalName({
    brand: group.brand,
    series: group.series,
    edition,
    variant: group.variant,
  });

  return {
    candidate_id: `cand_${index + 1}`,
    canonical_name: canonical_name || vision.deck_name || group.brand,
    brand: group.brand,
    series: group.series,
    edition,
    variant: group.variant,
    designer: null,
    collaborators: collaborationNames(group.series),
    release_year: null,
    support_score: existence === "documented" ? independent.size * (5 - bestTier) : 0,
    reasons: reasonsFor(group, existence),
    evidence_ids: [...new Set(group.evidence.map((item) => item.evidence_id))],
    existence,
  };
}

function hasEntitySpecificEvidence(group: Acc): boolean {
  const usable = group.evidence.filter(
    (item) =>
      item.claim_type !== "nonexistence" &&
      item.source_url.startsWith("https://") &&
      item.source_tier <= 4 &&
      item.source_type !== "unverified" &&
      item.documented_entity,
  );
  if (group.edition) {
    return usable.some(
      (item) =>
        (item.claim_type === "edition" || item.claim_type === "existence") &&
        namesEqual(item.documented_entity?.brand, group.brand) &&
        namesEqual(item.documented_entity?.series, group.series) &&
        namesEqual(item.documented_entity?.edition, group.edition),
    );
  }
  if (group.series) {
    return usable.some(
      (item) =>
        (item.claim_type === "series" || item.claim_type === "existence") &&
        namesEqual(item.documented_entity?.brand, group.brand) &&
        namesEqual(item.documented_entity?.series, group.series),
    );
  }
  return usable.some((item) => item.claim_type === "brand");
}

function reasonsFor(group: Acc, existence: DeckEntityCandidate["existence"]): string[] {
  if (existence === "not_found") {
    return ["No credible source documents this entity."];
  }

  const canonical = formatCanonicalName({
    brand: group.brand,
    series: group.series,
    edition: group.edition,
    variant: group.variant,
  });

  const specific = group.evidence.filter((item) => {
    if (item.claim_type === "nonexistence" || !item.documented_entity) {
      return false;
    }
    if (group.edition) {
      return (
        item.claim_type === "edition" &&
        namesEqual(item.documented_entity.edition, group.edition) &&
        namesEqual(item.documented_entity.series, group.series)
      );
    }
    if (group.series) {
      return item.claim_type === "series" && namesEqual(item.documented_entity.series, group.series);
    }
    return item.claim_type === "brand";
  });

  const notes = specific
    .map((item) => item.notes)
    .filter((item): item is string => Boolean(item));
  if (notes.length > 0) {
    return [...new Set(notes)].slice(0, 4);
  }
  if (existence === "documented") {
    return [`Source documents ${canonical}.`];
  }
  return ["Named by retrieved sources."];
}

function mergeNameVariants(candidates: DeckEntityCandidate[]): DeckEntityCandidate[] {
  const merged: DeckEntityCandidate[] = [];
  for (const candidate of candidates) {
    const twin = merged.find(
      (item) =>
        namesEqual(item.brand, candidate.brand) &&
        namesEqual(item.series, candidate.series) &&
        namesEqual(item.edition, candidate.edition) &&
        namesEqual(item.variant, candidate.variant),
    );
    if (!twin) {
      merged.push(candidate);
      continue;
    }
    twin.evidence_ids = [...new Set([...twin.evidence_ids, ...candidate.evidence_ids])];
    twin.reasons = [...new Set([...twin.reasons, ...candidate.reasons])];
    twin.support_score = Math.max(twin.support_score, candidate.support_score);
    if (candidate.existence === "documented") {
      twin.existence = "documented";
    }
  }
  return merged.slice(0, MAX_CANDIDATES);
}

function parseBrand(value: string, fallback: string | null): string {
  if (fallback) {
    return fallback;
  }
  return value.split(/[×x]/i)[0]?.trim() || value.trim();
}

function parseSeries(
  value: string,
  vision: IdentificationResult,
): string | null {
  if (vision.series && nameIncludes(value, vision.series)) {
    return vision.series;
  }
  const known = ["Carrots", "Sleight", "Sky Blue", "Blue", "Rider Back", "Supreme Back", "Onyx", "Kuromi"];
  return known.find((item) => nameIncludes(value, item)) ?? null;
}

function parseEdition(value: string): string | null {
  return normalizeEditionLabel(value);
}
