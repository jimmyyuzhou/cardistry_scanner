export function normalizeName(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function namesEqual(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const a = normalizeName(left);
  const b = normalizeName(right);
  return a.length > 0 && a === b;
}

export function canonicalizeDisplayName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeEditionLabel(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const compact = value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (compact === "v1" || compact === "version1" || compact === "1stedition") {
    return "V1";
  }
  if (compact === "v2" || compact === "version2" || compact === "2ndedition") {
    return "V2";
  }
  if (compact === "v3" || compact === "version3" || compact === "3rdedition") {
    return "V3";
  }
  const match = value.match(/\bv(?:ersion)?\s*([1-3])\b/i);
  return match ? `V${match[1]}` : null;
}

const COLLABORATION_SERIES = new Set(["carrots"]);
const PREFIX_COLORWAYS = new Set(["blue", "skyblue"]);

export function isCollaborationSeries(series: string | null | undefined): boolean {
  return COLLABORATION_SERIES.has(normalizeName(series));
}

export function formatCanonicalName(parts: {
  brand: string;
  series?: string | null;
  edition?: string | null;
  variant?: string | null;
}): string {
  const brand = parts.brand.trim();
  const edition = normalizeEditionLabel(parts.edition);
  const variant = parts.variant?.trim() || null;
  const series = stripRedundantBrand(parts.series, brand);
  const suffix = [edition, variant].filter(Boolean).join(" ");

  if (series && isCollaborationSeries(series)) {
    return [`${brand} × ${series}`, suffix].filter(Boolean).join(" ");
  }

  if (series && PREFIX_COLORWAYS.has(normalizeName(series))) {
    return [`${series} ${brand}`, suffix].filter(Boolean).join(" ");
  }

  if (series) {
    return [brand, series, suffix].filter(Boolean).join(" ");
  }

  return [brand, suffix].filter(Boolean).join(" ");
}

export function stripRedundantBrand(
  series: string | null | undefined,
  brand: string,
): string | null {
  if (!series) {
    return null;
  }
  const trimmed = series.replace(/\s+/g, " ").trim();
  if (!trimmed || namesEqual(trimmed, brand)) {
    return null;
  }

  const stripped = trimmed
    .replace(new RegExp(`^${escapeRegExp(brand)}\\s*[×x]\\s*`, "i"), "")
    .replace(new RegExp(`^${escapeRegExp(brand)}\\s+`, "i"), "")
    .replace(/^[×x]\s*/, "")
    .trim();

  if (!stripped || namesEqual(stripped, brand)) {
    return null;
  }
  return stripped;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function collaborationNames(series: string | null | undefined): string[] {
  return series && isCollaborationSeries(series) ? [series] : [];
}

export function entityKey(parts: {
  brand?: string | null;
  series?: string | null;
  edition?: string | null;
  variant?: string | null;
}): string {
  return [
    normalizeName(parts.brand),
    normalizeName(parts.series),
    normalizeName(normalizeEditionLabel(parts.edition) ?? parts.edition),
    normalizeName(parts.variant),
  ].join("|");
}

export function nameIncludes(
  haystack: string | null | undefined,
  needle: string | null | undefined,
): boolean {
  const hay = normalizeName(haystack);
  const need = normalizeName(needle);
  return hay.length > 0 && need.length > 0 && hay.includes(need);
}

export function uniqueStrings(items: string[]): string[] {
  return [...new Set(items.filter((item) => item.trim().length > 0))];
}
