export function AnalyzingStatus() {
  return (
    <div
      className="mt-8 text-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
        Analyzing deck
      </p>
      <div className="mx-auto mt-4 h-px w-24 overflow-hidden bg-neutral-200">
        <div className="h-full origin-left bg-foreground animate-analyze" />
      </div>
    </div>
  );
}
