import type { IdentificationResult as IdentificationResultData } from "@/lib/types";

type IdentificationResultProps = {
  result: IdentificationResultData;
};

export function IdentificationResult({ result }: IdentificationResultProps) {
  const fields = [
    ["Brand", result.brand],
    ["Series", result.series],
    ["Version", result.version],
    ["Confidence", `${result.confidence}%`],
  ] as const;

  return (
    <section aria-labelledby="identification-heading" className="mt-8">
      <h2 id="identification-heading" className="sr-only">
        Identification result
      </h2>

      <dl className="border-y border-neutral-300">
        {fields.map(([label, value]) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-6 border-b border-neutral-200 py-3 last:border-b-0"
          >
            <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">
              {label}
            </dt>
            <dd
              className={
                label === "Confidence"
                  ? "font-mono text-[15px] tabular-nums text-foreground"
                  : "text-[15px] text-foreground"
              }
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <ListBlock title="Evidence" items={result.evidence} />
      <ListBlock title="Uncertainty" items={result.uncertainty} />
    </section>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
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
            <span aria-hidden="true" className="mt-[0.55em] h-[3px] w-[3px] shrink-0 bg-neutral-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
