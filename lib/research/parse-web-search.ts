import type { SearchHit } from "@/lib/research/types";
import { hostnameFromUrl } from "@/lib/research/source-tiers";

export function parseWebSearchOutput(
  response: unknown,
  plannedQuery: string,
): SearchHit[] {
  if (!isRecord(response) || !Array.isArray(response.output)) {
    return [];
  }

  const hits: SearchHit[] = [];

  for (const item of response.output) {
    if (!isRecord(item)) {
      continue;
    }

    if (item.type === "web_search_call") {
      hits.push(...hitsFromSearchCall(item, plannedQuery));
    }

    if (item.type === "message" && Array.isArray(item.content)) {
      hits.push(...hitsFromMessage(item.content, plannedQuery));
    }
  }

  return dedupeHits(hits);
}

function hitsFromSearchCall(
  call: Record<string, unknown>,
  plannedQuery: string,
): SearchHit[] {
  const hits: SearchHit[] = [];
  const action = isRecord(call.action) ? call.action : null;

  if (action && Array.isArray(action.sources)) {
    for (const source of action.sources) {
      if (!isRecord(source) || typeof source.url !== "string") {
        continue;
      }
      hits.push(hitFromUrl(source.url, plannedQuery, "", ""));
    }
  }

  const results = Array.isArray(call.results)
    ? call.results
    : isRecord(call.action) && Array.isArray(call.action.results)
      ? call.action.results
      : [];

  for (const result of results) {
    if (!isRecord(result)) {
      continue;
    }

    const url =
      asString(result.url) ??
      asString(result.source_website_url) ??
      asString(result.link);
    if (!url) {
      continue;
    }

    const imageUrls = [
      asString(result.image_url),
      ...(Array.isArray(result.image_urls)
        ? result.image_urls.map((item) => asString(item))
        : []),
    ].filter((item): item is string => Boolean(item));

    hits.push({
      ...hitFromUrl(
        url,
        plannedQuery,
        asString(result.title) ?? "",
        asString(result.snippet) ?? asString(result.text) ?? "",
      ),
      image_urls: imageUrls,
    });
  }

  return hits;
}

function hitsFromMessage(
  content: unknown[],
  plannedQuery: string,
): SearchHit[] {
  const hits: SearchHit[] = [];

  for (const part of content) {
    if (!isRecord(part) || part.type !== "output_text") {
      continue;
    }
    const text = asString(part.text) ?? "";
    const annotations = Array.isArray(part.annotations) ? part.annotations : [];

    for (const annotation of annotations) {
      if (!isRecord(annotation) || annotation.type !== "url_citation") {
        continue;
      }
      const url = asString(annotation.url);
      if (!url) {
        continue;
      }
      const start = typeof annotation.start_index === "number" ? annotation.start_index : 0;
      const end = typeof annotation.end_index === "number" ? annotation.end_index : start;
      const snippet = text.slice(start, end).trim();
      hits.push(
        hitFromUrl(url, plannedQuery, asString(annotation.title) ?? "", snippet),
      );
    }
  }

  return hits;
}

function hitFromUrl(
  url: string,
  query: string,
  title: string,
  snippet: string,
): SearchHit {
  return {
    url,
    title: title || hostnameFromUrl(url) || url,
    snippet,
    image_urls: [],
    provider: "web",
    query,
    domain: hostnameFromUrl(url) ?? "unknown",
  };
}

function dedupeHits(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  const result: SearchHit[] = [];
  for (const hit of hits) {
    const key = hit.url.split("#")[0];
    if (seen.has(key)) {
      const existing = result.find((item) => item.url.split("#")[0] === key);
      if (existing && !existing.snippet && hit.snippet) {
        existing.snippet = hit.snippet;
      }
      if (existing && existing.title === existing.domain && hit.title) {
        existing.title = hit.title;
      }
      continue;
    }
    seen.add(key);
    result.push(hit);
  }
  return result;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
