import {
  isHeicLikeFile,
  isProviderSupportedFile,
  MAX_UPLOAD_BYTES,
} from "@/lib/identification/image-constraints";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp)$/i;

export { MAX_UPLOAD_BYTES };

export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return IMAGE_EXTENSIONS.test(file.name);
}

export function getClientUploadError(file: File): string | null {
  if (file.size === 0) {
    return "That photo file is empty. Try another image.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "That photo is too large. Use an image under 10 MB.";
  }

  if (isHeicLikeFile(file)) {
    return "HEIC photos are not supported yet. Use a JPEG, PNG, or WebP.";
  }

  if (!isProviderSupportedFile(file)) {
    return "Use a JPEG, PNG, or WebP photo.";
  }

  return null;
}
