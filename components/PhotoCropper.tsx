"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ActionButton } from "@/components/ActionButton";
import { cropImageToJpeg } from "@/lib/crop-image";

const TUCK_ASPECT = 63 / 88;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

type PhotoCropperProps = {
  imageUrl: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
};

export function PhotoCropper({ imageUrl, onConfirm, onCancel }: PhotoCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels || busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const file = await cropImageToJpeg(imageUrl, croppedAreaPixels);
      onConfirm(file);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "crop-failed";
      if (code === "oversized") {
        setError("That crop is still too large. Zoom in a little more.");
      } else {
        setError("Couldn't prepare that photo. Try adjusting the crop.");
      }
      setBusy(false);
    }
  }

  return (
    <>
      <div className="relative mx-auto w-full max-w-[22rem]">
        <div className="relative h-[min(58vh,28rem)] overflow-hidden border border-neutral-300 bg-neutral-100">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={TUCK_ASPECT}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            objectFit="contain"
            showGrid={false}
            restrictPosition
            roundCropAreaPixels
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            classes={{
              containerClassName: "cropper-container",
              cropAreaClassName: "cropper-area",
            }}
          />
        </div>
      </div>

      <p className="mt-4 text-center text-[14px] leading-relaxed text-neutral-700">
        Fill the frame with the tuck box.
      </p>
      <p className="mt-1 text-center text-[13px] text-muted">
        Pinch or use the slider to zoom. Drag to position.
      </p>

      <label className="mx-auto mt-5 flex w-full max-w-[22rem] items-center gap-3">
        <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
          Zoom
        </span>
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="h-8 w-full accent-neutral-900"
          aria-valuemin={MIN_ZOOM}
          aria-valuemax={MAX_ZOOM}
          aria-valuenow={zoom}
        />
      </label>

      {error ? (
        <p className="mt-4 text-center text-[13px] text-neutral-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3">
        <ActionButton
          onClick={() => void handleConfirm()}
          disabled={busy || !croppedAreaPixels}
        >
          {busy ? "Preparing…" : "Confirm Crop"}
        </ActionButton>
        <ActionButton variant="ghost" onClick={onCancel} disabled={busy}>
          Choose Another
        </ActionButton>
      </div>
    </>
  );
}
