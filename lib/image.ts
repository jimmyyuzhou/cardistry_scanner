const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp)$/i;

export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return IMAGE_EXTENSIONS.test(file.name);
}
