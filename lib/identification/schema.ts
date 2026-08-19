export const IDENTIFICATION_SCHEMA_NAME = "deck_identification";

export const IDENTIFICATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "status",
    "message",
    "deck_name",
    "brand",
    "series",
    "version",
    "release_year",
    "designer_or_collaboration",
    "visible_text",
    "visual_features",
    "confidence_level",
    "reasoning_summary",
    "alternative_candidates",
    "uncertainties",
    "suggested_next_photo",
  ],
  properties: {
    status: {
      type: "string",
      enum: ["identified", "ambiguous", "unknown", "unclear", "invalid"],
    },
    message: { type: ["string", "null"] },
    deck_name: { type: ["string", "null"] },
    brand: { type: ["string", "null"] },
    series: { type: ["string", "null"] },
    version: { type: ["string", "null"] },
    release_year: { type: ["string", "null"] },
    designer_or_collaboration: { type: ["string", "null"] },
    visible_text: {
      type: "array",
      items: { type: "string" },
    },
    visual_features: {
      type: "array",
      items: { type: "string" },
    },
    confidence_level: {
      type: ["string", "null"],
      enum: ["confirmed", "high", "probable", "ambiguous", "unknown", null],
    },
    reasoning_summary: { type: ["string", "null"] },
    alternative_candidates: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "deck_name",
          "brand",
          "series",
          "version",
          "release_year",
          "designer_or_collaboration",
          "why",
        ],
        properties: {
          deck_name: { type: ["string", "null"] },
          brand: { type: ["string", "null"] },
          series: { type: ["string", "null"] },
          version: { type: ["string", "null"] },
          release_year: { type: ["string", "null"] },
          designer_or_collaboration: { type: ["string", "null"] },
          why: { type: "string" },
        },
      },
    },
    uncertainties: {
      type: "array",
      items: { type: "string" },
    },
    suggested_next_photo: {
      type: ["string", "null"],
      enum: [
        "tuck_front",
        "tuck_bottom",
        "tuck_back",
        "card_back",
        "tuck_side",
        "seal",
        null,
      ],
    },
  },
} as const;

export const IDENTIFICATION_SYSTEM_PROMPT = `You are the visual identification layer for Cardistry Scanner.

You receive ONE photograph. The intended subject is the front of a playing-card tuck box, but other relevant playing-card objects (tuck box sides, a clearly visible deck, a card back) may also be valid.

This is a vision-only experiment. You have no web search, no external sources, and no independent verification. Do not claim that you checked official sites, databases, or listings.

First decide whether a relevant playing-card deck / tuck box / playing-card object is actually visible. Then, only if valid, attempt an initial identification.

Status rules:
- invalid: the photograph clearly does not contain a relevant playing-card deck or object (car, cat, landscape, food, keyboard, portrait with no deck, random screenshot, etc.).
- unclear: a deck may be present, but the image is insufficient for reliable analysis (too blurry, too distant, too dark, too cropped, too obscured).
- unknown: a playing-card deck is visible, but you cannot responsibly identify brand/series/version from this photo alone.
- ambiguous: two or more identities or editions remain plausible. Do not force a single winner.
- identified: one likely identification exists from visible evidence.

Hard rules:
1. A complex real-world background is NOT a reason to reject. Hands, desks, shelves, stores, cars, and clutter are valid if the deck is sufficiently visible.
2. Do not invent deck_name, brand, series, version, release_year, or designer_or_collaboration to fill the schema. Use null.
3. visible_text must be text you can actually see in the photograph, not catalog knowledge.
4. Do not guess an exact version when the tuck front of multiple editions looks similar. Use ambiguous and list alternatives.
5. "confirmed" must be rare. There is no independent web evidence in this version. Prefer high, probable, ambiguous, or unknown. Use confirmed only if unique identifying text or marks are clearly readable on the object.
6. If status is invalid, set message to "No playing-card deck detected." Null out identification fields, use empty arrays, confidence_level unknown, suggested_next_photo tuck_front.
7. If status is unclear, set message to "Deck not clearly visible." Null out identification fields, suggested_next_photo tuck_front.
8. If status is unknown, set message to "Unable to identify this deck reliably."
9. If another photograph would materially help, set suggested_next_photo to the single most useful option: tuck_front, tuck_bottom, tuck_back, card_back, tuck_side, or seal. Otherwise null.
10. Return structured data only. Do not use tools. Do not search the web.`;
