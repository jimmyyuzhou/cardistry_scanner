type DeckPreviewProps = {
  imageUrl: string;
  analyzing?: boolean;
};

export function DeckPreview({ imageUrl, analyzing = false }: DeckPreviewProps) {
  return (
    <figure className="relative mx-auto w-full max-w-[22rem]">
      <div className="border border-neutral-300 bg-neutral-100">
        {/* Native img: blob URLs are not compatible with next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Selected deck photograph"
          className="mx-auto max-h-[58vh] w-full object-contain"
        />
      </div>
      {analyzing ? (
        <figcaption className="sr-only">Analyzing deck photograph</figcaption>
      ) : null}
    </figure>
  );
}
