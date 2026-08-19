export function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const params = [...parsed.searchParams.entries()].filter(
      ([key]) => !key.toLowerCase().startsWith("utm_") && key.toLowerCase() !== "fbclid",
    );
    params.sort(([left], [right]) => left.localeCompare(right));
    parsed.search = "";
    for (const [key, value] of params) {
      parsed.searchParams.append(key, value);
    }
    let href = parsed.toString();
    if (href.endsWith("/") && parsed.pathname !== "/") {
      href = href.slice(0, -1);
    }
    return href;
  } catch {
    return url.trim();
  }
}
