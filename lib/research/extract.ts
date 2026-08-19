import type {
  DocumentedSourceEntity,
  IdentificationResult,
  ResearchClaimType,
  ResearchEvidence,
} from "@/lib/types";
import { scoreEntityRelevance } from "@/lib/research/entity-relevance";
import { isHallucinatedEntityName } from "@/lib/research/hallucinations";
import { independenceGroup } from "@/lib/research/independence";
import {
  nameIncludes,
  namesEqual,
  normalizeName,
} from "@/lib/research/names";
import { hasPlayingCardContext, hitText } from "@/lib/research/relevance";
import { lockedSeries, parseSourceEntities } from "@/lib/research/source-entity";
import { classifySource } from "@/lib/research/source-tiers";
import type { PlannedQuery, SearchHit } from "@/lib/research/types";

let evidenceSeq = 0;

export function extractEvidenceFromHits(input: {
  vision: IdentificationResult;
  hits: SearchHit[];
  queries: PlannedQuery[];
}): ResearchEvidence[] {
  const evidence: ResearchEvidence[] = [];

  for (const hit of input.hits) {
    evidence.push(...claimsFromHit(hit, input.vision));
  }

  for (const query of input.queries.filter((item) => item.purpose === "existence_check")) {
    evidence.push(...existenceFromQuery(query, input.hits));
  }

  return evidence;
}

function claimsFromHit(
  hit: SearchHit,
  vision: IdentificationResult,
): ResearchEvidence[] {
  const classified = classifySource(hit.url);
  const blob = hitText(hit);
  if (!hasPlayingCardContext(blob) || isHallucinatedEntityName(hit.title)) {
    return [];
  }

  const entityRelevance = scoreEntityRelevance(hit, vision);
  if (entityRelevance.relevance === "irrelevant") {
    return [];
  }

  const strength =
    classified.source_tier <= 2 ? "strong" : classified.source_tier === 3 ? "moderate" : "weak";

  if (entityRelevance.relevance === "weak") {
    if (
      vision.brand &&
      nameIncludes(blob, vision.brand) &&
      pageSupportsBrand(blob, vision.brand)
    ) {
      return [
        makeEvidence({
          hit,
          classified,
          claim_type: "brand",
          claim_value: vision.brand,
          strength: "weak",
          notes: `Playing-card source corroborates ${vision.brand}.`,
          documented_entity: {
            canonical_name: vision.brand,
            brand: vision.brand,
            series: null,
            edition: null,
            variant: null,
          },
        }),
      ];
    }
    return [];
  }

  const entities = parseSourceEntities(hit, vision).filter((entity) =>
    sourceEntityAllowed(entity, vision),
  );
  const claims: ResearchEvidence[] = [];

  for (const entity of entities) {
    if (entity.brand && pageSupportsBrand(blob, entity.brand)) {
      claims.push(
        makeEvidence({
          hit,
          classified,
          claim_type: "brand",
          claim_value: entity.brand,
          strength,
          notes: `Playing-card source corroborates ${entity.brand}.`,
          documented_entity: entity,
        }),
      );
    }

    if (entity.series && pageSupportsSeries(blob, entity.series, entity.brand)) {
      claims.push(
        makeEvidence({
          hit,
          classified,
          claim_type: "series",
          claim_value: entity.series,
          strength,
          notes: `Source documents ${entity.canonical_name}.`,
          documented_entity: entity,
        }),
      );
    }

    if (entity.edition && entity.series) {
      claims.push(
        makeEvidence({
          hit,
          classified,
          claim_type: "edition",
          claim_value: entity.edition,
          strength,
          notes: `Source documents ${entity.canonical_name}.`,
          documented_entity: entity,
        }),
      );
    }
  }

  return uniqueEvidence(claims);
}

function sourceEntityAllowed(
  entity: DocumentedSourceEntity,
  vision: IdentificationResult,
): boolean {
  const locked = lockedSeries(vision);
  if (!locked || !entity.series) {
    return true;
  }
  return namesEqual(entity.series, locked);
}

function existenceFromQuery(
  query: PlannedQuery,
  hits: SearchHit[],
): ResearchEvidence[] {
  const candidateName = query.query.replace(/\s+playing cards$/i, "").trim();
  const relatedHits = hits.filter((hit) => hit.query === query.query);
  const supporting = relatedHits.filter((hit) => {
    const blob = hitText(hit);
    const classified = classifySource(hit.url);
    return (
      !isHallucinatedEntityName(candidateName) &&
      hasPlayingCardContext(blob) &&
      nameIncludes(blob, candidateName) &&
      classified.source_tier <= 4 &&
      !isOrdinalNoise(blob, candidateName)
    );
  });

  if (isHallucinatedEntityName(candidateName) || supporting.length === 0) {
    return [];
  }

  return supporting.slice(0, 2).map((hit) => {
    const classified = classifySource(hit.url);
    const entity = parseSourceEntities(hit)[0] ?? {
      canonical_name: candidateName,
      brand: candidateName,
      series: null,
      edition: null,
      variant: null,
    };
    return makeEvidence({
      hit,
      classified,
      claim_type: "existence",
      claim_value: candidateName,
      strength: classified.source_tier <= 3 ? "moderate" : "weak",
      notes: "Relevant playing-card source appears to document this entity.",
      documented_entity: entity,
    });
  });
}

export function pageSupportsBrand(blob: string, brand: string): boolean {
  if (!nameIncludes(blob, brand) || !hasPlayingCardContext(blob)) {
    return false;
  }
  if (/fontaine[-\s]?mazur|conjecture|theorem/i.test(blob) && normalizeName(brand) === "fontaine") {
    return false;
  }
  return true;
}

export function pageSupportsSeries(
  blob: string,
  series: string,
  brand: string | null,
): boolean {
  if (!nameIncludes(blob, series) || !hasPlayingCardContext(blob)) {
    return false;
  }
  if (normalizeName(series) === "carrots" && /minecraft|garden|agriculture|recipe|vegetable/i.test(blob)) {
    return false;
  }
  if (brand && nameIncludes(blob, brand)) {
    return true;
  }
  return /playing[- ]cards?|cardistry|tuck/i.test(blob);
}

function uniqueEvidence(items: ResearchEvidence[]): ResearchEvidence[] {
  const seen = new Set<string>();
  const unique: ResearchEvidence[] = [];
  for (const item of items) {
    const key = [
      item.source_url,
      item.claim_type,
      item.claim_value,
      item.documented_entity?.canonical_name ?? "",
    ].join("|");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(item);
  }
  return unique;
}

function isOrdinalNoise(blob: string, candidateName: string): boolean {
  if (!isHallucinatedEntityName(candidateName) && !/1st playing cards/i.test(candidateName)) {
    return false;
  }
  return /\b1st\b/i.test(blob) && !/1st playing cards/i.test(blob);
}

function makeEvidence(input: {
  hit: SearchHit;
  classified: ReturnType<typeof classifySource>;
  claim_type: ResearchClaimType;
  claim_value: string;
  strength: ResearchEvidence["strength"];
  notes: string;
  documented_entity: DocumentedSourceEntity | null;
}): ResearchEvidence {
  evidenceSeq += 1;
  return {
    evidence_id: `ev_${evidenceSeq}`,
    source_type: input.classified.source_type,
    source_title: input.hit.title,
    source_url: input.hit.url,
    source_tier: input.classified.source_tier,
    claim_type: input.claim_type,
    claim_value: input.claim_value,
    evidence_text: input.hit.snippet || input.hit.title,
    strength: input.strength,
    independence_group: independenceGroup({
      url: input.hit.url,
      title: input.hit.title,
      snippet: input.hit.snippet,
      imageUrl: input.hit.image_urls[0],
    }),
    notes: input.notes,
    documented_entity: input.documented_entity,
  };
}

export function resetEvidenceIds(): void {
  evidenceSeq = 0;
}
