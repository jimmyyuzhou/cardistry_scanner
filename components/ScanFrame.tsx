export function ScanFrame() {
  return (
    <div className="mx-auto w-[min(72vw,260px)]">
      <div
        className="relative aspect-[63/88]"
        aria-hidden="true"
      >
        <div className="absolute inset-0 overflow-hidden rounded-[10px] border border-neutral-300 bg-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.28)]">
          <CornerMarks />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
              Tuck box
            </span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-[13px] leading-relaxed text-muted">
        Place the tuck box inside the frame.
      </p>
    </div>
  );
}

function CornerMarks() {
  return (
    <>
      <span className="absolute left-3 top-3 h-3 w-3 border-l border-t border-neutral-800" />
      <span className="absolute right-3 top-3 h-3 w-3 border-r border-t border-neutral-800" />
      <span className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-neutral-800" />
      <span className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-neutral-800" />
    </>
  );
}
