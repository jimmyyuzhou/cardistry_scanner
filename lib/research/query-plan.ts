import type { IdentificationResult, ResearchGoal } from "@/lib/types";
import { isHallucinatedEntityName } from "@/lib/research/hallucinations";
import { uniqueStrings } from "@/lib/research/names";
import { chooseResearchIntent } from "@/lib/research/research-goal";
import { effectiveSeries } from "@/lib/research/series-strength";
import { officialDomainsForBrand } from "@/lib/research/source-tiers";
import { isGenericProductText, isReleaseDescriptor } from "@/lib/research/text-roles";
import { QUERY_BUDGETS, type PlannedQuery, type ResearchBudget } from "@/lib/research/types";

const GENERIC_QUERY = /what (playing )?card is this|identify this( deck)?/i;

const COLOR_WORDS = [
  "sky blue",
  "navy",
  "blue",
  "black",
  "white",
  "red",
  "green",
  "gold",
  "silver",
  "pink",
  "purple",
  "orange",
  "yellow",
  "brown",
  "burgundy",
  "maroon",
];

export function planQueries(
  vision: IdentificationResult,
  budget: ResearchBudget,
): PlannedQuery[] {
  if (budget === "skip") {
    return [];
  }

  const intent = chooseResearchIntent(vision);
  const planned = queriesForGoals(vision, intent.goals);
  const withExistence = [...planned, ...existenceCheckQueries(vision)];
  const capped = capAndDedup(withExistence, QUERY_BUDGETS[budget].web);
  return applyOfficialFirst(capped, vision.brand);
}

export function isBannedQuery(query: string): boolean {
  return GENERIC_QUERY.test(query.trim());
}

function queriesForGoals(vision: IdentificationResult, goals: ResearchGoal[]): PlannedQuery[] {
  if (goals.includes("resolve_edition") && goals.includes("discover_alternatives")) {
    const edition = queriesForGoal(vision, "resolve_edition");
    const discovery = queriesForGoal(vision, "discover_alternatives");
    const rest = goals
      .filter((goal) => goal !== "resolve_edition" && goal !== "discover_alternatives")
      .flatMap((goal) => queriesForGoal(vision, goal));
    return [edition[0], discovery[0], ...edition.slice(1), ...discovery.slice(1), ...rest].filter(
      (item): item is PlannedQuery => Boolean(item),
    );
  }

  if (goals.includes("test_hypothesis") && goals.includes("discover_alternatives")) {
    const hypothesis = queriesForGoal(vision, "test_hypothesis");
    const discovery = queriesForGoal(vision, "discover_alternatives");
    return [...hypothesis, ...discovery];
  }

  const planned: PlannedQuery[] = [];
  for (const goal of goals) {
    planned.push(...queriesForGoal(vision, goal));
  }
  return planned;
}

function queriesForGoal(vision: IdentificationResult, goal: ResearchGoal): PlannedQuery[] {
  const series = effectiveSeries(vision);

  if (goal === "confirm_entity") {
    const parts = [vision.brand, series].filter((part): part is string => Boolean(part));
    if (parts.length === 0) {
      return [];
    }
    return [query(`${parts.join(" ")} playing cards`, "confirm_known", series ? ["series"] : ["brand"])];
  }

  if (goal === "resolve_edition" && vision.brand && series) {
    return [
      query(`${vision.brand} ${series} V1 V2 V3`, "resolve_edition", ["edition"]),
      query(`${vision.brand} ${series} playing cards`, "resolve_edition", ["edition"]),
      query(`${vision.brand} ${series} editions`, "resolve_edition", ["edition"]),
    ];
  }

  if (goal === "test_hypothesis" && vision.brand && series) {
    return [
      query(`${vision.brand} ${series} playing cards`, "test_hypothesis", ["series"]),
    ];
  }

  if (goal === "discover_alternatives") {
    return observationDiscoveryQueries(vision);
  }

  if (goal === "discover_series" && vision.brand) {
    const color = colorFromObservation(vision);
    if (color) {
      return [
        query(`${vision.brand} ${color} playing cards`, "resolve_series", ["series"]),
        query(`${vision.brand} ${color} deck`, "resolve_series", ["series"]),
        query(`${vision.brand} editions ${color}`, "resolve_series", ["series"]),
      ];
    }
    return [
      query(`${vision.brand} playing cards editions`, "resolve_series", ["series"]),
      query(`${vision.brand} deck series`, "resolve_series", ["series"]),
    ];
  }

  if (goal === "discover_brand") {
    return discoverQueries(vision);
  }

  return [];
}

function observationDiscoveryQueries(vision: IdentificationResult): PlannedQuery[] {
  const brand = vision.brand;
  if (!brand) {
    return discoverQueries(vision);
  }

  const descriptors = observationDescriptors(vision);
  const queries: PlannedQuery[] = [];
  if (descriptors.length >= 2) {
    queries.push(
      query(`${brand} ${descriptors.slice(0, 4).join(" ")} playing cards`, "discover_alternatives", [
        "series",
      ]),
    );
  }
  if (descriptors.length >= 3) {
    queries.push(
      query(`${brand} ${descriptors.slice(0, 5).join(" ")} deck`, "discover_alternatives", ["series"]),
    );
  }
  if (queries.length === 0) {
    queries.push(
      query(`${brand} ${distinctiveFeature(vision) ?? "playing cards"} deck`, "discover_alternatives", [
        "series",
      ]),
    );
  }
  return queries;
}

function observationDescriptors(vision: IdentificationResult): string[] {
  const series = effectiveSeries(vision);
  const parts: string[] = [];

  for (const feature of vision.observation.visual_features) {
    const tokens = usefulObservationTokens(feature, series);
    parts.push(...tokens);
  }
  for (const text of vision.observation.visible_text) {
    if (isReleaseDescriptor(text) || isGenericProductText(text)) {
      continue;
    }
    const tokens = usefulObservationTokens(text, series);
    parts.push(...tokens);
  }

  return uniqueStrings(parts).slice(0, 6);
}

function usefulObservationTokens(value: string, hypothesizedSeries: string | null): string[] {
  const cleaned = value
    .replace(/\b(tuck|background|central|thin|dark|stylized|white|mark)\b/gi, " ")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) {
    return [];
  }

  const tokens = cleaned
    .split(" ")
    .map((item) => item.trim())
    .filter((item) => item.length >= 3)
    .filter((item) => !/^(the|and|with|from|this)$/i.test(item));

  if (hypothesizedSeries && tokens.length === 1 && tokens[0]?.toLowerCase() === hypothesizedSeries.toLowerCase()) {
    return tokens;
  }
  return tokens;
}

function discoverQueries(vision: IdentificationResult): PlannedQuery[] {
  const visible = usefulVisibleText(vision);
  const feature = distinctiveFeature(vision);
  const queries: PlannedQuery[] = [];

  if (visible) {
    queries.push(
      query(`${visible} playing cards`, "discover_entities", ["brand", "series"]),
    );
  }

  if (feature) {
    queries.push(
      query(`${feature} playing cards deck`, "discover_entities", ["brand", "series"]),
    );
  }

  if (queries.length === 0 && vision.brand) {
    queries.push(
      query(`${vision.brand} playing cards`, "discover_entities", ["brand"]),
    );
  }

  return queries;
}

function usefulVisibleText(vision: IdentificationResult): string | null {
  return (
    vision.observation.visible_text.find(
      (item) => !isReleaseDescriptor(item) && !isGenericProductText(item),
    ) ?? null
  );
}

function existenceCheckQueries(vision: IdentificationResult): PlannedQuery[] {
  const names = uniqueStrings(
    vision.alternative_candidates.flatMap((candidate) => {
      const label =
        candidate.deck_name ??
        [candidate.brand, candidate.series, candidate.edition]
          .filter((part): part is string => Boolean(part))
          .join(" ");
      return label ? [label] : [];
    }),
  );

  return names
    .filter((name) => isHallucinatedEntityName(name))
    .map((name) =>
      query(`${name} playing cards`, "existence_check", ["brand", "series"]),
    );
}

function applyOfficialFirst(
  queries: PlannedQuery[],
  brand: string | null,
): PlannedQuery[] {
  const official = officialDomainsForBrand(brand);
  if (official.length === 0 || queries.length === 0) {
    return queries;
  }

  const [first, ...rest] = queries;
  return [{ ...first, allowed_domains: official }, ...rest];
}

function capAndDedup(queries: PlannedQuery[], max: number): PlannedQuery[] {
  const seen = new Set<string>();
  const result: PlannedQuery[] = [];

  for (const item of queries) {
    if (result.length >= max) {
      break;
    }
    const normalized = item.query.toLowerCase().replace(/\s+/g, " ").trim();
    if (!normalized || isBannedQuery(normalized) || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push({ ...item, query: item.query.replace(/\s+/g, " ").trim() });
  }

  return result;
}

function query(
  text: string,
  purpose: PlannedQuery["purpose"],
  target_fields: PlannedQuery["target_fields"],
): PlannedQuery {
  return {
    query: text,
    channel: "web",
    purpose,
    target_fields,
  };
}

function colorFromObservation(vision: IdentificationResult): string | null {
  const blob = [
    ...vision.observation.visual_features,
    ...vision.observation.visible_logos_or_marks,
    vision.observation.possible_logo_description ?? "",
  ]
    .join(" ")
    .toLowerCase();

  for (const color of COLOR_WORDS) {
    if (blob.includes(color)) {
      return color;
    }
  }
  return null;
}

function distinctiveFeature(vision: IdentificationResult): string | null {
  return (
    vision.observation.visual_features[0] ??
    vision.observation.visible_logos_or_marks[0] ??
    vision.observation.possible_logo_description
  );
}
