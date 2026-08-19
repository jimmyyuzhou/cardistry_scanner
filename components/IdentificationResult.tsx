import type {
  DisplayResult,
  IdentificationFields,
  IdentificationLevel,
  ObjectType,
  SuggestedNextPhoto,
} from "@/lib/types";

type IdentificationResultProps = {
  result: DisplayResult;
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

export function IdentificationResult({ result }: IdentificationResultProps) {
  if (result.status === "error") {
    return (
      <ResultShell title="Identification failed" message={result.message} />
    );
  }

  if (result.status === "invalid") {
    return (
      <ResultShell
        title="No playing-card deck detected"
        message={result.message ?? "No playing-card deck detected."}
        detail="Try photographing the front of the tuck box."
      />
    );
  }

  if (result.status === "unclear") {
    return (
      <ResultShell
        title="Deck not clearly visible"
        message={result.message ?? "Deck not clearly visible."}
        nextPhoto={result.suggested_next_photo}
        objectType={result.object_type}
      />
    );
  }

  if (result.status === "unknown") {
    return (
      <section aria-labelledby="identification-heading" className="mt-8">
        <StatusHeading
          title="Unable to identify this deck reliably"
          statusLabel={LEVEL_LABELS[result.identification_level]}
        />
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
          {result.message ?? "A playing-card object is visible, but identity is unresolved."}
        </p>
        <ObjectTypeNote objectType={result.object_type} />
        <IdentificationDetails result={result} />
      </section>
    );
  }

  if (result.status === "ambiguous") {
    const title =
      result.deck_name ??
      joinIdentity(result.brand, result.series, result.edition) ??
      "More than one match is possible";

    return (
      <section aria-labelledby="identification-heading" className="mt-8">
        <StatusHeading title={title} statusLabel="Ambiguous" />
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
          {result.message ??
            "Several identities remain plausible. A single exact match was not forced."}
        </p>
        <ObjectTypeNote objectType={result.object_type} />
        <IdentificationDetails result={result} />
      </section>
    );
  }

  const title =
    result.deck_name ??
    joinIdentity(result.brand, result.series, result.edition) ??
    "Identified deck";

  return (
    <section aria-labelledby="identification-heading" className="mt-8">
      <StatusHeading
        title={title}
        statusLabel={LEVEL_LABELS[result.identification_level]}
      />
      {result.message ? (
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
          {result.message}
        </p>
      ) : null}
      <ObjectTypeNote objectType={result.object_type} />
      <IdentificationDetails result={result} />
    </section>
  );
}

function IdentificationDetails({ result }: { result: IdentificationFields }) {
  const editionValue =
    result.identification_level === "series" && !result.edition
      ? "Unresolved"
      : result.edition;

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
        Candidates
      </h3>
      <ul className="mt-3 space-y-4">
        {candidates.map((candidate, index) => {
          const label =
            candidate.deck_name ??
            joinIdentity(candidate.brand, candidate.series, candidate.edition) ??
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

function joinIdentity(
  brand: string | null,
  series: string | null,
  edition: string | null,
): string | null {
  const parts = [brand, series, edition].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}
