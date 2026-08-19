import type { FieldEvidence, Observation } from "@/lib/types";

export function emptyObservation(): Observation {
  return {
    visible_text: [],
    visible_logos_or_marks: [],
    visual_features: [],
    possible_logo_description: null,
  };
}

export function emptyEvidence(): FieldEvidence {
  return { kinds: [], summary: null };
}
