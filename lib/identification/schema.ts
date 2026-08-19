export const IDENTIFICATION_SCHEMA_NAME = "deck_identification";

const FIELD_EVIDENCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["kinds", "summary"],
  properties: {
    kinds: {
      type: "array",
      items: {
        type: "string",
        enum: ["visual", "text", "external", "reference_image", "user_confirmed"],
      },
    },
    summary: { type: ["string", "null"] },
  },
} as const;

const CANDIDATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["deck_name", "brand", "series", "edition", "variant", "why"],
  properties: {
    deck_name: { type: ["string", "null"] },
    brand: { type: ["string", "null"] },
    series: { type: ["string", "null"] },
    edition: { type: ["string", "null"] },
    variant: { type: ["string", "null"] },
    why: { type: "string" },
  },
} as const;

export const IDENTIFICATION_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "status",
    "message",
    "object_type",
    "identification_level",
    "observation",
    "deck_name",
    "brand",
    "series",
    "edition",
    "variant",
    "designer",
    "collaborators",
    "release_year",
    "brand_evidence",
    "series_evidence",
    "edition_evidence",
    "variant_evidence",
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
    object_type: {
      type: "string",
      enum: [
        "tuck_front",
        "tuck_back",
        "card_back",
        "card_face",
        "sealed_deck",
        "multiple_decks",
        "unknown",
        "no_deck",
      ],
    },
    identification_level: {
      type: "string",
      enum: ["no_deck", "deck", "brand", "series", "edition", "variant"],
    },
    observation: {
      type: "object",
      additionalProperties: false,
      required: [
        "visible_text",
        "visible_logos_or_marks",
        "visual_features",
        "possible_logo_description",
      ],
      properties: {
        visible_text: {
          type: "array",
          items: { type: "string" },
        },
        visible_logos_or_marks: {
          type: "array",
          items: { type: "string" },
        },
        visual_features: {
          type: "array",
          items: { type: "string" },
        },
        possible_logo_description: { type: ["string", "null"] },
      },
    },
    deck_name: { type: ["string", "null"] },
    brand: { type: ["string", "null"] },
    series: { type: ["string", "null"] },
    edition: { type: ["string", "null"] },
    variant: { type: ["string", "null"] },
    designer: { type: ["string", "null"] },
    collaborators: {
      type: "array",
      items: { type: "string" },
    },
    release_year: { type: ["string", "null"] },
    brand_evidence: FIELD_EVIDENCE_SCHEMA,
    series_evidence: FIELD_EVIDENCE_SCHEMA,
    edition_evidence: FIELD_EVIDENCE_SCHEMA,
    variant_evidence: FIELD_EVIDENCE_SCHEMA,
    confidence_level: {
      type: ["string", "null"],
      enum: ["confirmed", "high", "probable", "ambiguous", "unknown", null],
    },
    reasoning_summary: { type: ["string", "null"] },
    alternative_candidates: {
      type: "array",
      items: CANDIDATE_SCHEMA,
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

export const IDENTIFICATION_SYSTEM_PROMPT = `You are the visual observation and candidate-generation layer for Cardistry Scanner.

You receive ONE photograph. Preferred subject: playing-card tuck box front. Other playing-card objects (tuck back, card back, sealed deck, multiple decks) are valid objects, not automatically invalid.

This is vision-only. You have no web search, no databases, no reference-image lookup, and no user confirmation. Do not claim external verification. Evidence kinds may only be "visual" or "text". Never use external, reference_image, or user_confirmed.

Your job is Observation + Interpretation + Candidate generation.
Do NOT force an exact edition/version that would require external evidence.

==================================================
OBJECT TYPE (do this first)
==================================================
- tuck_front: front of a tuck box
- tuck_back: back of a tuck box
- card_back: playing-card back design
- card_face: face of a playing card
- sealed_deck: sealed deck / wrapped pack, not clearly a tuck-front close-up
- multiple_decks: more than one relevant deck/object
- unknown: cannot tell what the object is
- no_deck: clearly not a playing-card deck/object

Never label a card back as tuck_front.

==================================================
OBSERVATION VS INTERPRETATION
==================================================
Observation is only what is actually visible.

visible_text: exact readable printed words/numbers only. Empty array if nothing is literally readable.
Do NOT put guessed readings of stylized logos into visible_text.
A decorative mark that merely resembles letters is NOT visible text.

visible_logos_or_marks: describe marks/symbols without turning them into fake OCR.
possible_logo_description: e.g. "large stylized white vertical mark"
visual_features: colors, motifs, borders, typography, packaging.

CRITICAL FAILURE TO AVOID:
Stylized Fontaine-like "f" or vertical white mark
→ guessing it says "1ST"
→ visible_text = "1ST"
→ brand = "1ST Playing Cards"
→ high confidence
This is a hallucination. Do not do it.

If a logo cannot be confidently read as letters, leave visible_text without that guess. Describe the mark instead. Interpretation may then propose a possible brand.

==================================================
IDENTITY MODEL
==================================================
Brand = publisher/brand. Series = product/design family within the brand. Series may be null.
Edition/version = a distinct release within a series. Variant = colorway or similar.

Brand and Series are NOT independent OCR labels.
A visible brand word does NOT automatically become the series.
Do NOT output Brand=Fontaine and Series=Fontaine merely because "Fontaine" is visible.

Never invent series, edition, variant, year, designer, or collaborators to fill fields. Use null / empty arrays.

deck_name should be a coherent entity at the highest supported level, e.g. "Fontaine × Carrots Playing Cards" when edition is unknown, not a contradictory mix of fields.

==================================================
IDENTIFICATION LEVEL
==================================================
Choose the highest level actually supported:
- no_deck
- deck (object visible, identity unresolved)
- brand
- series (brand + series; edition may be null)
- edition
- variant

Do not skip to edition/variant just because a pattern looks familiar.
Brand + Series with edition null is SUCCESSFUL PARTIAL identification, not failure.

==================================================
STATUS
==================================================
- invalid: object_type no_deck. message: "No playing-card deck detected."
- unclear: image insufficient (blurry/distant/dark). object_type unknown or best guess. message: "Deck not clearly visible." suggested_next_photo tuck_front.
- unknown: a playing-card object is visible but brand cannot be responsibly named. identification_level deck.
- identified: at least brand is supported. If series is also supported and edition is not, still identified with identification_level series.
- ambiguous: two or more brands or series remain plausible. Do not force one winner.

If Brand + Series are supported and several editions are plausible, status=identified, identification_level=series, edition=null, and list those editions in alternative_candidates only if you have reasonable visual grounds. Do not invent a candidate list to look complete. Do not force V1/V2/V3.

==================================================
CONFIDENCE
==================================================
This is vision-only. Prefer probable, high, ambiguous, or unknown.
Use confirmed extremely rarely, and never for edition without clear literal edition text on the object.
If brand is only a visual-similarity guess, confidence_level must not exceed probable.
If brand is uncertain, do not use high or confirmed.

==================================================
CARD BACK
==================================================
If object_type is card_back, still analyze visual identity if possible. Do not return invalid. Suggest tuck_front as next photo.

==================================================
OTHER HARD RULES
==================================================
1. Complex real-world backgrounds are valid if a deck/object is visible.
2. Evidence kinds: visual and/or text only.
3. If another photo would help, set suggested_next_photo to one of: tuck_front, tuck_bottom, tuck_back, card_back, tuck_side, seal.
4. Return structured data only. No tools. No web search.`;
