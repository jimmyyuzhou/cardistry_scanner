import { MAX_UPLOAD_BYTES } from "@/lib/image";

export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function cropImageToJpeg(
  imageSrc: string,
  pixelCrop: PixelCrop,
): Promise<File> {
  const image = await loadImage(imageSrc);
  const crop = clampCrop(pixelCrop, image);

  if (crop.width < 8 || crop.height < 8) {
    throw new Error("crop-too-small");
  }

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("crop-failed");
  }

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const blob = await canvasToJpeg(canvas);
  return new File([blob], "prepared.jpg", { type: "image/jpeg" });
}

function clampCrop(area: PixelCrop, image: HTMLImageElement): PixelCrop {
  const maxWidth = image.naturalWidth;
  const maxHeight = image.naturalHeight;
  const x = Math.min(Math.max(0, Math.round(area.x)), maxWidth);
  const y = Math.min(Math.max(0, Math.round(area.y)), maxHeight);
  const width = Math.min(Math.max(0, Math.round(area.width)), maxWidth - x);
  const height = Math.min(Math.max(0, Math.round(area.height)), maxHeight - y);

  return { x, y, width, height };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("crop-failed")));
    image.src = src;
  });
}

async function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  const qualities = [0.92, 0.8, 0.65];

  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((next) => resolve(next), "image/jpeg", quality);
    });

    if (blob && blob.size > 0 && blob.size <= MAX_UPLOAD_BYTES) {
      return blob;
    }

    if (blob && blob.size > 0 && quality === qualities[qualities.length - 1]) {
      throw new Error("oversized");
    }
  }

  throw new Error("crop-failed");
}
