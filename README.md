# Cardistry Scanner

**Identify collectible playing cards from a photo.**

Cardistry Scanner is an experimental, non-commercial project for identifying playing cards — especially cardistry, designer, collaboration, and collectible decks — from photographs.

The long-term goal is simple:

> Take a photo of a deck and identify the exact real-world deck entity: **Brand → Series → Edition → Variant**, when those distinctions actually exist.

The project is currently an early prototype.

---

## Why this project exists

Identifying collectible playing cards is surprisingly difficult.

A photo may show a distinctive design while containing very little readable text. Different releases from the same series can look extremely similar, discontinued decks may have limited documentation, and visual motifs do not necessarily correspond to product names.

For example:

- a deck containing snake artwork is not necessarily a deck named *Snake*;
- identifying **Fontaine × Carrots** does not necessarily tell us whether it is V1, V2, or V3;
- text such as **LIMITED EDITION** may describe packaging rather than the deck's canonical series;
- an obscure deck may have better surviving visual evidence in collector databases or marketplace listings than on the original manufacturer's website.

Cardistry Scanner is an attempt to solve these problems without forcing an answer when the evidence is insufficient.

---

## Current prototype

The current stable prototype uses a multi-stage identification pipeline:

```text
Photo
  ↓
Prepare / Crop
  ↓
Vision Observation
  ↓
Identity Interpretation
  ↓
Web Research
  ↓
Documented Candidate Entities
  ↓
Result + Evidence + Sources
```

The user's photo is first analyzed for observable evidence such as:

- visible text
- logos and marks
- colors
- tuck-box geometry
- illustration motifs
- typography
- packaging details

The system then separates **observation** from **interpretation**.

For example:

```text
Observation:
repeating orange carrot illustrations

Interpretation:
possible Fontaine × Carrots deck
```

The interpretation is treated as a hypothesis rather than automatically becoming ground truth.

---

## Deck identity model

Cardistry Scanner models a deck as a hierarchical real-world entity.

```text
Brand
  ↓
Series / Product
  ↓
Edition
  ↓
Variant
```

Example:

```text
Brand:    Fontaine
Series:   Carrots
Edition:  V2

Canonical entity:
Fontaine × Carrots V2
```

Not every deck needs every field.

A deck may be completely identified by Brand + Series if no meaningful edition or variant structure exists.

The system therefore supports partial identification instead of inventing missing metadata.

---

## Research and evidence

The current prototype can use web research after visual identification.

Research is designed to answer questions such as:

- Does this deck entity actually exist?
- What is its canonical name?
- Are multiple editions documented?
- Which sources support the candidate?
- Is an apparent product name actually just a visual motif or packaging descriptor?

Evidence keeps its provenance.

The project distinguishes between sources such as:

- official brand / designer sources
- established archives and collector databases
- specialist retailers
- community sources
- marketplace evidence

A source proving that a deck **exists** is not automatically proof that the photographed deck is that product.

---

## Why a structured playing-card catalog matters

One of the biggest limitations of the current prototype is candidate discovery.

Today, the system often has to discover possible deck entities through web research at identification time.

A much stronger architecture would use an existing structured playing-card catalog:

```text
User Photo
    ↓
Visual Retrieval
    ↓
Known Reference Images
    ↓
Closest Deck Entities
    ↓
Detailed Visual Comparison
    ↓
Identification
```

A catalog containing reliable:

- deck IDs
- canonical names
- brands
- series
- editions / variants
- release metadata
- tuck-front images
- tuck-back images
- card-back images

would allow Cardistry Scanner to treat identification primarily as a **visual retrieval problem**, rather than repeatedly rediscovering the playing-card catalog from the web.

Web research could then focus on genuinely unknown or long-tail decks.

This is one of the main research directions for the project.

---

## Current status

### Implemented

- Photo upload
- Manual crop / photo preparation
- Server-side OpenAI vision identification
- Structured deck identity model
- Observation vs. interpretation separation
- Brand / Series / Edition / Variant semantics
- Partial and ambiguous identification
- Confidence guardrails
- Web research
- Source provenance
- Candidate entity generation
- Research relevance filtering
- Protection against several false-confirmation patterns
- Stable Vision and Research result layers

### In development

- Reference-image retrieval
- Visual candidate comparison
- Visual retrieval against a deck catalog
- Candidate reranking using image similarity
- Better long-tail deck discovery
- Automated evaluation dataset

### Future

- Simplified Chinese / English interface
- Reference images displayed alongside identification results
- Human candidate confirmation
- Larger verified playing-card reference dataset
- Multi-photo identification
- Community-contributed reference photographs

---

## Example challenge: Fontaine × Carrots

A photographed deck may contain enough visual evidence to identify:

```text
Fontaine × Carrots
```

while still lacking enough evidence to distinguish:

```text
Fontaine × Carrots V1
Fontaine × Carrots V2
Fontaine × Carrots V3
```

Rather than guessing an edition, Cardistry Scanner is designed to preserve the correct partial identity and surface documented candidates.

The next step is to compare the user's photograph directly against verified reference images for those editions.

---

## Example challenge: visual false friends

Visual motifs can create misleading semantic matches.

A photographed Bicycle deck containing snake artwork may cause a vision system to search for a product named "Bicycle Snake."

But the actual deck may be an entirely different Bicycle release that also happens to contain snake artwork.

This creates a dangerous feedback loop:

```text
snake artwork
    ↓
"Snake" hypothesis
    ↓
search for Bicycle Snake
    ↓
Bicycle Snake really exists
    ↓
false confirmation
```

Cardistry Scanner therefore treats visual motifs as **observations**, not automatically as canonical product names.

Direct image-to-image retrieval against known deck references is intended to reduce this failure mode.

---

## Design principles

1. **Do not guess when evidence is insufficient.**
2. **Observation is not the same as identity.**
3. **A real product existing does not mean the user's photo depicts it.**
4. **Brand + Series can be a valid partial identification.**
5. **Edition and Variant should only be assigned when supported.**
6. **Evidence should remain traceable to its source.**
7. **Visual contradictions matter as much as visual similarities.**
8. **Canonical deck entities should come from structured evidence, not generated names.**
9. **Reference images are a core identification signal, not decoration.**
10. **The system should become better as its verified deck catalog grows.**

---

## Technology

Current prototype:

- Next.js
- TypeScript
- React
- OpenAI API
- OpenAI web search
- Vitest

API keys and other credentials remain server-side and are not committed to the repository.

---

## Project status

Cardistry Scanner is currently an experimental personal project and is **not a commercial product**.

The architecture and identity model are still evolving as real-world decks expose new failure cases.

The project is being developed through repeated testing against known playing-card identities rather than optimizing only for successful demonstrations.

---

## Data / catalog collaboration

I am particularly interested in working with existing playing-card databases, collectors, brands, and archivists.

If you maintain a structured playing-card catalog or reference-image collection and are interested in experimenting with visual identification, I would be very interested in discussing:

- read-only API access
- deck metadata access
- reference-image access
- research / integration access
- attribution requirements
- ways visual identification could contribute back to catalog quality

The project does **not** need access to private user collections or account data.

---

## Contact

If you're interested in the project, playing-card data, visual identification, or testing the prototype, feel free to reach out through GitHub.

---

*Cardistry Scanner is an independent experimental project and is not affiliated with the playing-card brands or databases referenced during research.*
