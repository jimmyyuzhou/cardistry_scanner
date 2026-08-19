import type { ResearchSourceType } from "@/lib/types";

export type ClassifiedSource = {
  domain: string;
  source_type: ResearchSourceType;
  source_tier: 1 | 2 | 3 | 4 | 5;
};

type DomainRule = {
  domain: string;
  source_type: ResearchSourceType;
  source_tier: 1 | 2 | 3 | 4 | 5;
};

const DOMAIN_RULES: DomainRule[] = [
  { domain: "fontainecards.com", source_type: "official", source_tier: 1 },
  { domain: "fontaineplayingcards.com", source_type: "official", source_tier: 1 },
  { domain: "anyoneworldwide.com", source_type: "official", source_tier: 1 },
  { domain: "bicyclecards.com", source_type: "official", source_tier: 1 },
  { domain: "usplayingcard.com", source_type: "official", source_tier: 1 },
  { domain: "theory11.com", source_type: "official", source_tier: 1 },
  { domain: "dealersgrip.com", source_type: "official", source_tier: 1 },
  { domain: "orbitplayingcards.com", source_type: "official", source_tier: 1 },
  { domain: "virtuosofallacy.com", source_type: "official", source_tier: 1 },
  { domain: "newdeckorder.com", source_type: "official", source_tier: 1 },

  { domain: "wopc.co.uk", source_type: "archive", source_tier: 2 },
  { domain: "52plusjoker.org", source_type: "archive", source_tier: 2 },
  { domain: "i-p-c-s.org", source_type: "archive", source_tier: 2 },
  { domain: "playingcardforum.com", source_type: "archive", source_tier: 2 },

  { domain: "artofplay.com", source_type: "retailer", source_tier: 3 },
  { domain: "penguinmagic.com", source_type: "retailer", source_tier: 3 },
  { domain: "murphysmagic.com", source_type: "retailer", source_tier: 3 },
  { domain: "playingcarddecks.com", source_type: "retailer", source_tier: 3 },
  { domain: "ellusionist.com", source_type: "retailer", source_tier: 3 },
  { domain: "cardshop.com", source_type: "retailer", source_tier: 3 },

  { domain: "unitedcardists.com", source_type: "community", source_tier: 4 },
  { domain: "reddit.com", source_type: "community", source_tier: 4 },
  { domain: "facebook.com", source_type: "community", source_tier: 4 },
  { domain: "instagram.com", source_type: "community", source_tier: 4 },
  { domain: "discord.com", source_type: "community", source_tier: 4 },
];

const BRAND_OFFICIAL_DOMAINS: Record<string, string[]> = {
  fontaine: ["fontainecards.com", "fontaineplayingcards.com"],
  bicycle: ["bicyclecards.com", "usplayingcard.com"],
  anyone: ["anyoneworldwide.com"],
  anyoneworldwide: ["anyoneworldwide.com"],
  theory11: ["theory11.com"],
  dealersgrip: ["dealersgrip.com"],
  orbit: ["orbitplayingcards.com"],
};

export function hostnameFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return null;
  }
}

export function classifySource(url: string): ClassifiedSource {
  const domain = hostnameFromUrl(url) ?? "unknown";
  const rule = DOMAIN_RULES.find(
    (item) => domain === item.domain || domain.endsWith(`.${item.domain}`),
  );

  if (rule) {
    return {
      domain,
      source_type: rule.source_type,
      source_tier: rule.source_tier,
    };
  }

  if (
    domain.includes("ebay.") ||
    domain.endsWith("ebay.com") ||
    domain === "etsy.com" ||
    domain.endsWith(".etsy.com") ||
    domain === "amazon.com" ||
    domain.endsWith(".amazon.com") ||
    domain === "mercari.com"
  ) {
    return { domain, source_type: "unverified", source_tier: 5 };
  }

  return { domain, source_type: "unverified", source_tier: 5 };
}

export function officialDomainsForBrand(brand: string | null): string[] {
  if (!brand) {
    return [];
  }
  const key = brand.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return BRAND_OFFICIAL_DOMAINS[key] ?? [];
}

export function tierWeight(tier: 1 | 2 | 3 | 4 | 5): number {
  switch (tier) {
    case 1:
      return 4;
    case 2:
      return 3;
    case 3:
      return 2;
    case 4:
      return 1.5;
    default:
      return 0.5;
  }
}
