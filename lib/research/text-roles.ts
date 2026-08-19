import { nameIncludes, namesEqual, normalizeName } from "@/lib/research/names";

export type IdentityRole =
  | "brand"
  | "series_or_product"
  | "edition"
  | "variant"
  | "collaborator"
  | "manufacturer"
  | "release_descriptor"
  | "generic_product_text"
  | "visual_motif"
  | "unknown";

const RELEASE_DESCRIPTORS = [
  "limited edition",
  "limited",
  "special edition",
  "deluxe edition",
  "collector edition",
  "custom playing cards",
  "custom deck",
];

const GENERIC_PRODUCT = [
  "playing cards",
  "playing card",
  "deck of cards",
  "cardistry deck",
];

const MANUFACTURERS = [
  "the united states playing card company",
  "united states playing card company",
  "uspcc",
  "cartamundi",
  "theory11",
];

const KNOWN_BRANDS = ["bicycle", "fontaine", "ellusionist", "dealersgrip"];

export function classifyIdentityText(value: string): IdentityRole {
  const compact = normalizeName(value);
  const lowered = value.toLowerCase().replace(/\s+/g, " ").trim();

  if (!compact) {
    return "unknown";
  }
  if (KNOWN_BRANDS.includes(compact)) {
    return "brand";
  }
  if (MANUFACTURERS.some((item) => compact.includes(normalizeName(item)) || namesEqual(item, value))) {
    return "manufacturer";
  }
  if (isReleaseDescriptor(value)) {
    return "release_descriptor";
  }
  if (GENERIC_PRODUCT.some((item) => namesEqual(item, value) || compact === normalizeName(item))) {
    return "generic_product_text";
  }
  if (/^v(?:ersion)?\s*[1-3]$/i.test(lowered) || /^(1st|2nd|3rd)\s+edition$/i.test(lowered)) {
    return "edition";
  }
  if (/motif|artwork|illustration|pattern|border|typography/i.test(lowered)) {
    return "visual_motif";
  }
  return "series_or_product";
}

export function isReleaseDescriptor(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  const lowered = value.toLowerCase().replace(/\s+/g, " ").trim();
  const compact = normalizeName(value);
  return RELEASE_DESCRIPTORS.some(
    (item) => namesEqual(item, value) || compact === normalizeName(item) || lowered === item,
  );
}

export function isGenericProductText(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return GENERIC_PRODUCT.some((item) => namesEqual(item, value) || nameIncludes(value, item) && normalizeName(value) === normalizeName(item));
}

export function isInvalidSeriesLabel(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }
  const role = classifyIdentityText(value);
  return (
    role === "release_descriptor" ||
    role === "generic_product_text" ||
    role === "manufacturer" ||
    role === "brand" ||
    role === "edition"
  );
}

export function classifyVisibleTexts(items: string[]): Array<{ text: string; role: IdentityRole }> {
  return items.map((text) => ({ text, role: classifyIdentityText(text) }));
}

export function classifyVisualFeature(value: string): IdentityRole {
  if (/motif|artwork|illustration|snake|carrot|spade|geometric|border|typography|tuck/i.test(value)) {
    return "visual_motif";
  }
  return classifyIdentityText(value);
}
