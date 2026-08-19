import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 256 * 1024;
const FETCH_TIMEOUT_MS = 5_000;
const MAX_REDIRECTS = 3;

export async function fetchPageExcerpt(url: string): Promise<string | null> {
  try {
    let current = url;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const parsed = await assertSafeHttpsUrl(current);
      if (!parsed) {
        return null;
      }

      const response = await fetch(parsed, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: "text/html,text/plain;q=0.9" },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || hop === MAX_REDIRECTS) {
          return null;
        }
        current = new URL(location, parsed).toString();
        continue;
      }

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
        return null;
      }

      const buffer = await readLimited(response);
      if (!buffer) {
        return null;
      }

      return excerptFromHtml(buffer.toString("utf8"));
    }

    return null;
  } catch {
    return null;
  }
}

export async function assertSafeHttpsUrl(url: string): Promise<URL | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") {
    return null;
  }
  if (parsed.username || parsed.password) {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "metadata.google.internal"
  ) {
    return null;
  }

  const addresses = await resolveAddresses(hostname);
  if (addresses.length === 0 || addresses.some(isBlockedAddress)) {
    return null;
  }

  return parsed;
}

async function resolveAddresses(hostname: string): Promise<string[]> {
  if (isIP(hostname)) {
    return [hostname];
  }

  const [v4, v6] = await Promise.allSettled([
    lookup(hostname, { all: true, family: 4 }),
    lookup(hostname, { all: true, family: 6 }),
  ]);

  const addresses: string[] = [];
  if (v4.status === "fulfilled") {
    addresses.push(...v4.value.map((item) => item.address));
  }
  if (v6.status === "fulfilled") {
    addresses.push(...v6.value.map((item) => item.address));
  }
  return addresses;
}

function isBlockedAddress(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0" || ip === "::") {
    return true;
  }
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("169.254.")) {
    return true;
  }
  const match = ip.match(/^172\.(\d+)\./);
  if (match) {
    const second = Number(match[1]);
    if (second >= 16 && second <= 31) {
      return true;
    }
  }
  const compact = ip.toLowerCase();
  if (
    compact.startsWith("fc") ||
    compact.startsWith("fd") ||
    compact.startsWith("fe80") ||
    compact.startsWith("::ffff:127.") ||
    compact.startsWith("::ffff:10.")
  ) {
    return true;
  }
  return false;
}

async function readLimited(response: Response): Promise<Buffer | null> {
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return null;
  }
  return Buffer.from(arrayBuffer);
}

function excerptFromHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  return withoutScripts.slice(0, 800);
}
