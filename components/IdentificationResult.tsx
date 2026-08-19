import type {
  DisplayResult,
  IdentificationFields,
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
        message={result.message}
        detail="Try photographing the front of the tuck box."
      />
    );
  }

  if (result.status === "unclear") {
    return (
      <ResultShell
        title="Deck not clearly visible"
        message={result.message}
        nextPhoto={result.suggested_next_photo}
      />
    );
  }

  if (result.status === "unknown") {
    return (
      <section aria-labelledby="identification-heading" className="mt-8">
        <StatusHeading
          title="Unable to identify this deck reliably"
          statusLabel="Unknown"
        />
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
          {result.message}
        </p>
        <IdentificationDetails result={result} />
      </section>
    );
  }

  if (result.status === "ambiguous") {
    const title =
      result.deck_name ??
      joinIdentity(result.brand, result.series, result.version) ??
      "More than one match is possible";

    return (
      <section aria-labelledby="identification-heading" className="mt-8">
        <StatusHeading title={title} statusLabel="Ambiguous" />
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-700">
          Several identities or editions remain plausible. A single exact match
          was not forced.
        </p>
        <IdentificationDetails result={result} />
      </section>
    );
  }

  const title =
    result.deck_name ??
    joinIdentity(result.brand, result.series, result.version) ??
    "Identified deck";

  return (
    <section aria-labelledby="identification-heading" className="mt-8">
      <StatusHeading
        title={title}
        statusLabel={CONFIDENCE_LABELS[result.confidence_level]}
      />
      <IdentificationDetails result={result} />
    </section>
  );
}

function IdentificationDetails({ result }: { result: IdentificationFields }) {
  const fields = [
    ["Brand", result.brand],
    ["Series", result.series],
    ["Version", result.version],
    ["Year", result.release_year],
    ["Designer", result.designer_or_collaboration],
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
              <dd className="text-[15px] text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {result.reasoning_summary ? (
        <p className="mt-7 text-[14px] leading-relaxed text-neutral-700">
          {result.reasoning_summary}
        </p>
      ) : null}

      <ListBlock title="Visible text" items={result.visible_text} />
      <ListBlock title="Visual features" items={result.visual_features} />
      <ListBlock title="Uncertainty" items={result.uncertainties} />
      <AlternativeList candidates={result.alternative_candidates} />
      <NextPhotoNote photo={result.suggested_next_photo} />
    </>
  );
}

function ResultShell({
  title,
  message,
  detail,
  nextPhoto,
}: {
  title: string;
  message: string;
  detail?: string;
  nextPhoto?: SuggestedNextPhoto;
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
        Alternatives
      </h3>
      <ul className="mt-3 space-y-4">
        {candidates.map((candidate, index) => {
          const label =
            candidate.deck_name ??
            joinIdentity(candidate.brand, candidate.series, candidate.version) ??
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
  version: string | null,
): string | null {
  const parts = [brand, series, version].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}
