"use client";

import { useState } from "react";
import type {
  DisplayResult,
  IdentificationFields,
  IdentificationLevel,
  IdentificationResult as IdentificationResultType,
  ObjectType,
  ResearchResultPayload,
  SuggestedNextPhoto,
} from "@/lib/types";
import {
  researchAddsResolvedFields,
  type ResearchUiState,
} from "@/lib/research/client-state";
import { deriveEditionStatus, editionDisplayValue } from "@/lib/research/edition-status";
import { selectDisplaySources } from "@/lib/research/display-sources";
import { formatCanonicalName } from "@/lib/research/names";

type IdentificationResultProps = {
  visionResult: DisplayResult;
  researchState?: ResearchUiState;
  researchResult?: ResearchResultPayload | null;
};

const CONFIDENCE_LABELS = {
  confirmed: "Confirmed",
  high: "High",
  probable: "Probable",
  ambiguous: "Ambiguous",
  unknown: "Unknown",
} as const;

const LEVEL_LABELS: Record<IdentificationLevel, string> = {
  no_deck: "No deck",
  deck: "Deck detected",
  brand: "Brand identified",
  series: "Series identified",
  edition: "Edition identified",
  variant: "Variant identified",
};

const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  tuck_front: "Tuck front",
  tuck_back: "Tuck back",
  card_back: "Card back",
  card_face: "Card face",
  sealed_deck: "Sealed deck",
  multiple_decks: "Multiple decks",
  unknown: "Unclear object",
  no_deck: "No deck",
};

const NEXT_PHOTO_LABELS: Record<Exclude<SuggestedNextPhoto, null>, string> = {
  tuck_front: "Tuck front",
  tuck_bottom: "Tuck bottom",
  card_back: "Card back",
  tuck_back: "Tuck back",
  tuck_side: "Tuck side",
  seal: "Seal",
};

export function IdentificationResult({
  visionResult,
  researchState = "not_started",
  researchResult = null,
}: IdentificationResultProps) {
  if (visionResult.status === "error") {
    return (
      <ResultShell title="Identification failed" message={visionResult.message} />
    );
  }

  if (visionResult.status === "invalid") {
    return (
      <ResultShell
        title="No playing-card deck detected"
        message={visionResult.message ?? "No playing-card deck detected."}
        detail="Try photographing the front of the tuck box."
      />
    );
  }

  if (visionResult.status === "unclear") {
    return (
      <ResultShell
        title="Deck not clearly visible"
        message={visionResult.message ?? "Deck not clearly visible."}
        nextPhoto={visionResult.suggested_next_photo}
        objectType={visionResult.object_type}
      />
    );
  }

  const title = visionTitle(visionResult);

  return (
    <section aria-labelledby="identification-heading" className="mt-8">
      <StatusHeading title={title} statusLabel="Vision identification" />
      {visionResult.status === "unknown" ? (
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
          {visionResult.message ?? "A playing-card object is visible, but identity is unresolved."}
        </p>
      ) : visionResult.status === "ambiguous" ? (
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
          {visionResult.message ??
            "Several identities remain plausible. A single exact match was not forced."}
        </p>
      ) : visionResult.message ? (
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
          {visionResult.message}
        </p>
      ) : null}
      <ObjectTypeNote objectType={visionResult.object_type} />
      <IdentificationDetails result={visionResult} researchResult={researchResult} />
      <ResearchPanel
        visionResult={visionResult}
        researchState={researchState}
        researchResult={researchResult}
      />
    </section>
  );
}

function IdentificationDetails({
  result,
  researchResult,
}: {
  result: IdentificationResultType;
  researchResult?: ResearchResultPayload | null;
}) {
  const editionStatus = deriveEditionStatus({
    vision: result,
    candidates: researchResult?.candidates,
    researchComplete: researchResult?.status !== undefined && researchResult.status !== "failed",
  });
  const editionValue = editionDisplayValue(result, editionStatus);

  const fields = [
    ["Object", OBJECT_TYPE_LABELS[result.object_type]],
    ["Level", LEVEL_LABELS[result.identification_level]],
    ["Brand", result.brand],
    ["Series", result.series],
    ["Edition", editionValue],
    ["Variant", result.variant],
    ["Year", result.release_year],
    ["Designer", result.designer],
    ["Collaborators", result.collaborators.join(" · ") || null],
    ["Confidence", CONFIDENCE_LABELS[result.confidence_level]],
  ].filter(([, value]) => Boolean(value)) as Array<[string, string]>;

  return (
    <>
      {fields.length > 0 ? (
        <dl className="mt-6 border-y border-neutral-300">
          {fields.map(([label, value]) => (
            <div
              key={label}
              className="flex items-baseline justify-between gap-6 border-b border-neutral-200 py-3 last:border-b-0"
            >
              <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">
                {label}
              </dt>
              <dd className="text-right text-[15px] text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {result.reasoning_summary ? (
        <p className="mt-7 text-[14px] leading-relaxed text-neutral-700">
          {result.reasoning_summary}
        </p>
      ) : null}

      <ListBlock title="Visible text" items={result.observation.visible_text} />
      <ListBlock
        title="Logos and marks"
        items={
          result.observation.possible_logo_description
            ? [
                ...result.observation.visible_logos_or_marks,
                result.observation.possible_logo_description,
              ]
            : result.observation.visible_logos_or_marks
        }
      />
      <ListBlock title="Visual features" items={result.observation.visual_features} />
      <EvidenceNote label="Brand evidence" evidence={result.brand_evidence} />
      <EvidenceNote label="Series evidence" evidence={result.series_evidence} />
      <EvidenceNote label="Edition evidence" evidence={result.edition_evidence} />
      <ListBlock title="Uncertainty" items={result.uncertainties} />
      <AlternativeList candidates={result.alternative_candidates} />
      <NextPhotoNote photo={result.suggested_next_photo} />
    </>
  );
}

function ObjectTypeNote({ objectType }: { objectType: ObjectType }) {
  if (objectType !== "card_back" && objectType !== "card_face") {
    return null;
  }

  return (
    <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">
      {OBJECT_TYPE_LABELS[objectType]} detected. For the most reliable first
      identification, photograph the tuck box front.
    </p>
  );
}

function EvidenceNote({
  label,
  evidence,
}: {
  label: string;
  evidence: IdentificationFields["brand_evidence"];
}) {
  if (!evidence.summary && evidence.kinds.length === 0) {
    return null;
  }

  const kinds = evidence.kinds.join(", ");
  const text = [kinds ? kinds : null, evidence.summary].filter(Boolean).join(" — ");

  return (
    <div className="mt-7">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">
        {label}
      </h3>
      <p className="mt-3 text-[14px] leading-relaxed text-neutral-700">{text}</p>
    </div>
  );
}

function ResultShell({
  title,
  message,
  detail,
  nextPhoto,
  objectType,
}: {
  title: string;
  message: string;
  detail?: string;
  nextPhoto?: SuggestedNextPhoto;
  objectType?: ObjectType;
}) {
  return (
    <section aria-labelledby="identification-heading" className="mt-8">
      <StatusHeading title={title} />
      <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
        {message}
      </p>
      {detail ? (
        <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
          {detail}
        </p>
      ) : null}
      {objectType ? <ObjectTypeNote objectType={objectType} /> : null}
      <NextPhotoNote photo={nextPhoto ?? null} />
    </section>
  );
}

function StatusHeading({
  title,
  statusLabel,
}: {
  title: string;
  statusLabel?: string;
}) {
  return (
    <header>
      {statusLabel ? (
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
          {statusLabel}
        </p>
      ) : null}
      <h2
        id="identification-heading"
        className={`font-serif text-[1.45rem] leading-tight tracking-tight text-foreground ${statusLabel ? "mt-2" : ""}`}
      >
        {title}
      </h2>
    </header>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-7">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-3 text-[14px] leading-relaxed text-neutral-700"
          >
            <span
              aria-hidden="true"
              className="mt-[0.55em] h-[3px] w-[3px] shrink-0 bg-neutral-400"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlternativeList({
  candidates,
}: {
  candidates: IdentificationFields["alternative_candidates"];
}) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="mt-7">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">
        Vision candidates
      </h3>
      <ul className="mt-3 space-y-4">
        {candidates.map((candidate, index) => {
          const label =
            candidate.deck_name ??
            identityLabel(candidate.brand, candidate.series, candidate.edition, candidate.variant) ??
            `Candidate ${index + 1}`;

          return (
            <li key={`${label}-${index}`} className="text-[14px] leading-relaxed text-neutral-700">
              <p className="text-foreground">{label}</p>
              {candidate.why ? (
                <p className="mt-1 text-neutral-600">{candidate.why}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NextPhotoNote({ photo }: { photo: SuggestedNextPhoto }) {
  if (!photo) {
    return null;
  }

  return (
    <p className="mt-7 text-[14px] leading-relaxed text-neutral-700">
      Recommended next photo: {NEXT_PHOTO_LABELS[photo]}.
    </p>
  );
}

function ResearchPanel({
  visionResult,
  researchState,
  researchResult,
}: {
  visionResult: IdentificationResultType;
  researchState: ResearchUiState;
  researchResult: ResearchResultPayload | null;
}) {
  if (researchState === "not_started") {
    return null;
  }

  if (researchState === "researching") {
    return (
      <div className="mt-8" role="status" aria-live="polite">
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Research
        </h3>
        <p className="mt-3 text-[14px] leading-relaxed text-neutral-700">
          Researching sources…
        </p>
      </div>
    );
  }

  if (researchState === "failed") {
    return (
      <div className="mt-8">
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Research
        </h3>
        <p className="mt-3 text-[14px] leading-relaxed text-neutral-700">
          Research unavailable.
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">
          Identification above remains based on the photo only.
        </p>
      </div>
    );
  }

  if (!researchResult) {
    return null;
  }

  const enhanced = researchResult.merged_identity;
  const showEnhanced = researchAddsResolvedFields(visionResult, enhanced);
  const documented = researchResult.candidates.filter(
    (candidate) => candidate.existence === "documented",
  );
  const { featured, extra } = selectDisplaySources(researchResult.evidence, {
    vision: visionResult,
  });

  return (
    <div className="mt-8">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">
        Research
      </h3>

      {showEnhanced ? (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
            Research-enhanced identification
          </p>
          <p className="mt-2 font-serif text-[1.25rem] leading-tight tracking-tight text-foreground">
            {visionTitle(enhanced)}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-[14px] leading-relaxed text-neutral-700">
          {researchStatusLabel(researchResult.status)}
        </p>
      )}

      {documented.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {documented.map((candidate) => (
            <li
              key={candidate.candidate_id}
              className="text-[14px] leading-relaxed text-neutral-700"
            >
              <p className="text-foreground">{candidate.canonical_name}</p>
              {candidate.reasons[0] ? (
                <p className="mt-1 text-neutral-600">{candidate.reasons[0]}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {featured.length > 0 ? (
        <SourceList sources={featured} extra={extra} />
      ) : null}
    </div>
  );
}

function SourceList({
  sources,
  extra,
}: {
  sources: ReturnType<typeof selectDisplaySources>["featured"];
  extra: ReturnType<typeof selectDisplaySources>["extra"];
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? [...sources, ...extra] : sources;

  return (
    <div className="mt-7">
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-muted">
        Sources
      </h3>
      <ul className="mt-3 space-y-4">
        {visible.map((source) => (
          <li key={source.url} className="text-[14px] leading-relaxed text-neutral-700">
            <p className="text-foreground">{source.title}</p>
            <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-muted">
              {SOURCE_TYPE_LABELS[source.type]} · Tier {source.tier}
            </p>
            {source.notes ? (
              <p className="mt-1 text-neutral-600">{source.notes}</p>
            ) : null}
            <a
              className="mt-1 inline-block text-[13px] text-neutral-700 underline decoration-neutral-300 underline-offset-4"
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          </li>
        ))}
      </ul>
      {extra.length > 0 ? (
        <button
          type="button"
          className="mt-4 text-[13px] text-neutral-700 underline decoration-neutral-300 underline-offset-4"
          onClick={() => setShowAll((current) => !current)}
        >
          {showAll ? "Show fewer sources" : "Show all research sources"}
        </button>
      ) : null}
    </div>
  );
}

const SOURCE_TYPE_LABELS = {
  official: "Official",
  archive: "Archive",
  retailer: "Retailer",
  community: "Community",
  unverified: "Unverified",
} as const;

function visionTitle(result: IdentificationResultType): string {
  if (result.brand) {
    return (
      formatCanonicalName({
        brand: result.brand,
        series: result.series,
        edition: result.edition,
        variant: result.variant,
      }) || result.deck_name || "Identified deck"
    );
  }

  if (result.status === "unknown") {
    return result.deck_name ?? "Unable to identify this deck reliably";
  }
  if (result.status === "ambiguous") {
    return result.deck_name ?? "More than one match is possible";
  }
  return result.deck_name ?? "Identified deck";
}

function identityLabel(
  brand: string | null,
  series: string | null,
  edition: string | null,
  variant?: string | null,
): string | null {
  if (brand) {
    return formatCanonicalName({ brand, series, edition, variant });
  }
  const parts = [brand, series, edition, variant].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}

function researchStatusLabel(status: ResearchResultPayload["status"]): string {
  if (status === "resolved") {
    return "Research complete";
  }
  if (status === "ambiguous" || status === "candidates_found") {
    return "Candidates found";
  }
  return "Research complete";
}
