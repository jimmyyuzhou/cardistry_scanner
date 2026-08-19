import { hostnameFromUrl } from "@/lib/research/source-tiers";
import { canonicalUrl } from "@/lib/research/urls";

export function independenceGroup(input: {
  url: string;
  title: string;
  snippet: string;
  imageUrl?: string | null;
}): string {
  const domain = hostnameFromUrl(input.url) ?? "unknown";
  const image = normalizeToken(input.imageUrl ?? "");
  if (image) {
    return `img:${image}`;
  }

  const urlKey = canonicalUrl(input.url);
  const title = normalizeToken(input.title).slice(0, 80);
  const snippet = normalizeToken(input.snippet).slice(0, 120);
  const marketplace = isMarketplace(domain);

  if (marketplace) {
    const titleCore = listingCore(input.title);
    if (titleCore) {
      return `mkt:${titleCore}`;
    }
  }

  if (snippet.length >= 48) {
    return `snip:${snippet.slice(0, 96)}`;
  }

  if (title && snippet && similar(title, snippet)) {
    return `copy:${title}`;
  }

  if (title) {
    return `${urlKey}:${title}`;
  }

  return `${urlKey}:${snippet || "untitled"}`;
}

function isMarketplace(domain: string): boolean {
  return (
    domain === "ebay.com" ||
    domain.endsWith(".ebay.com") ||
    domain.includes("ebay.") ||
    domain === "etsy.com" ||
    domain === "amazon.com" ||
    domain.endsWith(".amazon.com")
  );
}

function listingCore(title: string): string {
  return normalizeToken(title)
    .replace(
      /(?:rare|authentic|fastship|shipping|sealed|mint|new|free|ship|wow|lot)+/g,
      "",
    )
    .slice(0, 40);
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function similar(left: string, right: string): boolean {
  if (!left || !right) {
    return false;
  }
  return left.includes(right.slice(0, 40)) || right.includes(left.slice(0, 40));
}
