export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const PROVIDER_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const HEIC_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIC_EXTENSIONS = /\.(heic|heif)$/i;
const PROVIDER_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;

export type SniffedImageFormat = "jpeg" | "png" | "webp" | "gif" | "heic" | "unknown";

export type ImageValidationFailure = {
  ok: false;
  error_code: "empty_image" | "oversized_image" | "unsupported_format";
};

export type ImageValidationSuccess = {
  ok: true;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
};

export type ImageValidationResult = ImageValidationFailure | ImageValidationSuccess;

export function isHeicLikeFile(file: {
  name: string;
  type: string;
}): boolean {
  return HEIC_MIME_TYPES.has(file.type.toLowerCase()) || HEIC_EXTENSIONS.test(file.name);
}

export function isProviderSupportedFile(file: {
  name: string;
  type: string;
}): boolean {
  const mime = file.type.toLowerCase();
  if (PROVIDER_MIME_TYPES.has(mime)) {
    return true;
  }
  if (!mime && PROVIDER_EXTENSIONS.test(file.name)) {
    return true;
  }
  return false;
}

export function validateImageBytes(input: {
  bytes: Uint8Array;
  fileName: string;
  declaredType: string;
}): ImageValidationResult {
  if (input.bytes.byteLength === 0) {
    return { ok: false, error_code: "empty_image" };
  }

  if (input.bytes.byteLength > MAX_UPLOAD_BYTES) {
    return { ok: false, error_code: "oversized_image" };
  }

  if (isHeicLikeFile({ name: input.fileName, type: input.declaredType })) {
    return { ok: false, error_code: "unsupported_format" };
  }

  const sniffed = sniffImageFormat(input.bytes);
  if (sniffed === "heic") {
    return { ok: false, error_code: "unsupported_format" };
  }

  const mimeType = providerMimeType(sniffed, input.declaredType, input.fileName);
  if (!mimeType) {
    return { ok: false, error_code: "unsupported_format" };
  }

  return { ok: true, mimeType };
}

function providerMimeType(
  sniffed: SniffedImageFormat,
  declaredType: string,
  fileName: string,
): ImageValidationSuccess["mimeType"] | null {
  switch (sniffed) {
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      break;
  }

  const mime = declaredType.toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg") {
    return "image/jpeg";
  }
  if (mime === "image/png") {
    return "image/png";
  }
  if (mime === "image/webp") {
    return "image/webp";
  }
  if (mime === "image/gif") {
    return "image/gif";
  }

  const lowerName = fileName.toLowerCase();
  if (/\.jpe?g$/.test(lowerName)) {
    return "image/jpeg";
  }
  if (lowerName.endsWith(".png")) {
    return "image/png";
  }
  if (lowerName.endsWith(".webp")) {
    return "image/webp";
  }
  if (lowerName.endsWith(".gif")) {
    return "image/gif";
  }

  return null;
}

function sniffImageFormat(bytes: Uint8Array): SniffedImageFormat {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }

  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 4) === "WEBP"
  ) {
    return "webp";
  }

  if (bytes.length >= 6) {
    const header = ascii(bytes, 0, 6);
    if (header === "GIF87a" || header === "GIF89a") {
      return "gif";
    }
  }

  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4).toLowerCase();
    if (
      brand === "heic" ||
      brand === "heix" ||
      brand === "heif" ||
      brand === "hevc" ||
      brand === "hevx" ||
      brand === "mif1" ||
      brand === "msf1"
    ) {
      return "heic";
    }
  }

  return "unknown";
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}
