import { deriveIdentificationLevel } from "@/lib/identification/guardrails";
import { emptyEvidence } from "@/lib/identification/defaults";
import type {
  DeckCandidate,
  DeckEntityCandidate,
  IdentificationResult,
  ResearchEvidence,
} from "@/lib/types";
import { formatCanonicalName, namesEqual } from "@/lib/research/names";
import {
  canRaiseEdition,
  canRaiseSeries,
  type Resolution,
} from "@/lib/research/resolve";

export function mergeVisionWithResearch(input: {
  vision: IdentificationResult;
  resolution: Resolution;
  evidence: ResearchEvidence[];
  candidates: DeckEntityCandidate[];
}): IdentificationResult {
  const merged: IdentificationResult = {
    ...input.vision,
    observation: {
      visible_text: [...input.vision.observation.visible_text],
      visible_logos_or_marks: [...input.vision.observation.visible_logos_or_marks],
      visual_features: [...input.vision.observation.visual_features],
      possible_logo_description: input.vision.observation.possible_logo_description,
    },
    alternative_candidates: documentedAsVisionCandidates(input.candidates),
    collaborators: [...input.vision.collaborators],
    uncertainties: [...input.vision.uncertainties],
  };

  const winner = input.resolution.winner;

  if (winner && canRaiseSeries(input.resolution, input.vision) && !merged.series) {
    merged.series = winner.series;
    merged.series_evidence = externalFieldEvidence(
      input.evidence,
      winner.evidence_ids,
      "series",
      winner.series,
    );
  }

  if (winner && canRaiseEdition(input.resolution) && merged.series && !merged.edition) {
    merged.edition = winner.edition;
    merged.edition_evidence = externalFieldEvidence(
      input.evidence,
      winner.evidence_ids,
      "edition",
      winner.edition,
    );
  }

  if (winner?.variant && merged.edition && !merged.variant) {
    merged.variant = winner.variant;
  }

  if (officialContradiction(input.vision, input.evidence)) {
    if (merged.series && contradicted(merged.series, input.evidence, "series")) {
      merged.series = null;
      merged.edition = null;
      merged.variant = null;
      merged.series_evidence = emptyEvidence();
      merged.edition_evidence = emptyEvidence();
    }
  }

  merged.identification_level = deriveIdentificationLevel(merged);
  merged.deck_name = coherentName(merged);
  merged.message = mergeMessage(merged, input.resolution, input.vision);
  merged.uncertainties = mergeUncertainties(merged, input.resolution);

  if (merged.identification_level === "deck") {
    return {
      ...merged,
      status: "unknown",
      message: merged.message || input.vision.message,
    };
  }

  if (merged.status === "invalid" || merged.status === "unclear") {
    return input.vision;
  }

  let status: IdentificationResult["status"] = input.vision.status;
  if (input.resolution.status === "resolved" || input.resolution.status === "probable") {
    status = merged.brand ? "identified" : status;
  } else if (input.vision.status === "unknown" && merged.brand) {
    status = "identified";
  } else if (input.vision.status === "ambiguous") {
    status = "ambiguous";
  } else if (merged.brand) {
    status = "identified";
  }

  return { ...merged, status };
}

function documentedAsVisionCandidates(
  candidates: DeckEntityCandidate[],
): DeckCandidate[] {
  return candidates
    .filter((candidate) => candidate.existence === "documented")
    .map((candidate) => ({
      deck_name: candidate.canonical_name,
      brand: candidate.brand,
      series: candidate.series,
      edition: candidate.edition,
      variant: candidate.variant,
      why: candidate.reasons[0] ?? "Documented by retrieved sources.",
    }));
}

function externalFieldEvidence(
  evidence: ResearchEvidence[],
  evidenceIds: string[],
  claimType: "series" | "edition",
  value: string | null,
): IdentificationResult["series_evidence"] {
  const matches = evidence.filter(
    (item) =>
      evidenceIds.includes(item.evidence_id) &&
      item.claim_type === claimType &&
      (!value || namesEqual(item.claim_value, value)),
  );
  const best = matches.sort((left, right) => left.source_tier - right.source_tier)[0];
  return {
    kinds: ["external"],
    summary: best?.notes ?? best?.evidence_text ?? null,
  };
}

function coherentName(fields: IdentificationResult): string | null {
  if (fields.identification_level === "no_deck" || fields.identification_level === "deck") {
    return null;
  }
  if (!fields.brand) {
    return fields.deck_name;
  }
  return (
    formatCanonicalName({
      brand: fields.brand,
      series: fields.series,
      edition: fields.edition,
      variant: fields.variant,
    }) || fields.deck_name
  );
}

function mergeMessage(
  merged: IdentificationResult,
  resolution: Resolution,
  vision: IdentificationResult,
): string | null {
  if (merged.identification_level === "series" && !merged.edition) {
    return "Series identified. Exact edition could not be determined from the current evidence.";
  }
  if (merged.identification_level === "brand" && resolution.status === "ambiguous") {
    return "Brand identified. Several series remain possible.";
  }
  if (merged.identification_level === "brand") {
    return "Brand identified. Series could not be determined from the current evidence.";
  }
  return vision.message;
}

function mergeUncertainties(
  merged: IdentificationResult,
  resolution: Resolution,
): string[] {
  const next = [...merged.uncertainties];
  if (resolution.status === "ambiguous") {
    next.push("Research found more than one documented candidate.");
  }
  if (merged.identification_level === "series" && !merged.edition) {
    next.push("Exact edition could not be determined from the current evidence.");
  }
  return [...new Set(next)];
}

function officialContradiction(
  vision: IdentificationResult,
  evidence: ResearchEvidence[],
): boolean {
  return evidence.some(
    (item) =>
      item.source_tier <= 2 &&
      item.claim_type === "nonexistence" &&
      (namesEqual(item.claim_value, vision.brand) || namesEqual(item.claim_value, vision.series)),
  );
}

function contradicted(
  value: string,
  evidence: ResearchEvidence[],
  claimType: "series" | "brand",
): boolean {
  return evidence.some(
    (item) =>
      item.source_tier <= 2 &&
      item.claim_type === "nonexistence" &&
      namesEqual(item.claim_value, value) &&
      (item.claim_type === "nonexistence" || item.claim_type === claimType),
  );
}
