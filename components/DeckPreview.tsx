type DeckPreviewProps = {
  imageUrl: string;
  analyzing?: boolean;
  caption?: string;
};

export function DeckPreview({
  imageUrl,
  analyzing = false,
  caption,
}: DeckPreviewProps) {
  return (
    <figure className="relative mx-auto w-full max-w-[22rem]">
      <div className="border border-neutral-300 bg-neutral-100">
        {/* Native img: blob URLs are not compatible with next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={caption ?? "Selected deck photograph"}
          className="mx-auto max-h-[58vh] w-full object-contain"
        />
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted">
          {caption}
        </figcaption>
      ) : null}
      {analyzing ? (
        <figcaption className="sr-only">Analyzing deck photograph</figcaption>
      ) : null}
    </figure>
  );
}
