==================================================
CARDISTRY SCANNER — V1 PRODUCT SPECIFICATION
==================================================

Version: V1
Status: Scope Frozen
Product Type: Mobile-first Web App
Primary Domain: Cardistry / Designer Playing Cards Identification

Updated after first real V0.2 visual-identification tests and V0.3a crop tests.

Identity-model requirements from those tests are defined here as V0.3b product semantics.
V0.3b is a specification milestone. It does not implement web research or reference images.


# 1. Product Purpose

Cardistry Scanner is a mobile-first identification tool for Cardistry and collectible playing-card decks.

Its core experience is:

Scan. Identify. Understand.

A user photographs a playing-card tuck box. The system uses visual AI, web research, and evidence evaluation to determine the most likely canonical Deck Entity.

Identity is hierarchical, not a set of independent OCR labels:

Brand
↓
Series / Family
↓
Edition / Version
↓
Variant / Colorway
↓
Deck Entity

Optional supporting fields include designer(s), collaboration(s), and release year.

The system then provides reliable basic information about the deck, explains why the identification was made, shows supporting sources, and presents a trustworthy reference image so the user can visually compare their photograph with the identified deck.

The primary V1 hypothesis is:

Can AI + web research reliably identify real-world Cardistry and designer playing-card decks from one photograph, while knowing when additional evidence is required?

V1 does not need to identify every playing-card deck ever produced.

Reliability is more important than apparent completeness.

The user should be able to visually verify the identification, rather than being asked to trust the AI result blindly.

Brand + Series identification is a meaningful successful partial result. Edition uncertainty is not total failure.


# 2. V1 Scope

V1 focuses on one task:

Identify a playing-card deck as reliably as possible.

V1 includes:

- One-photo start from a Tuck Front photograph
- Manual crop / prepare-photo before identification
- Hierarchical identity: Brand → Series / Family → Edition / Version → Variant / Colorway → Deck Entity
- Identification Level, so partial results can be presented honestly
- Separation of visual observation from interpretation
- Object type (tuck front, card back, and related playing-card objects)
- English and Simplified Chinese UI
- A trustworthy reference image of the identified deck when one can be found
- Candidate comparison when Edition is unresolved
- Human confirmation of candidates, with explicit provenance
- Web research and evidence evaluation
- Progressive additional photographs when needed

V1 does NOT include:

- Collection management
- Add to Collection
- Wishlist
- User accounts
- Price estimates
- Market value
- eBay price tracking
- Portfolio value
- Purchase history
- Built-in user feedback system
- Social features
- A proprietary local playing-card reference database
- Automatic object detection or automatic cropping
- Native iOS app
- Native Android app

eBay and other marketplaces may still be used as identification evidence or as a last-resort reference-image source, but V1 does not provide valuation or market-price functionality.

V0.3b defines the semantic identity model required by later research and reference layers. It does not itself implement web research, reference images, or human candidate comparison.


# 3. Primary Input

## Required Input

### Tuck Front

The preferred first input is:

One photograph of the front of the playing-card tuck box.

The user should be able to begin identification after taking this photograph and preparing it if needed.

The image does not need:

- A professional background
- Studio lighting
- A scanner
- A perfectly isolated tuck box

The system should tolerate normal real-world photographs, including hands, tables, shelves, stores, cars, and other background objects.

The tuck box should ideally be sufficiently visible to analyze.

A valid deck may still be difficult to identify when it occupies only a small part of the frame. The product should therefore help the user prepare the photograph so the tuck box occupies the main portion of the image used for identification.

A useful image that is not a tuck front, such as a card back, must not be rejected solely because it is not the preferred first input. The system should name the object type and may still use the image as evidence, while asking for a tuck-front photograph when that would materially improve identification.


# 4. Photo Preparation / Cropping

After a user selects or captures a photo, the user should be able to crop the image so the playing-card tuck box occupies the main portion of the frame.

This is a V1 product requirement.

The intended flow is:

Capture / Upload
↓
Preview
↓
Crop / Adjust
↓
Identify

The crop step should be lightweight and mobile-friendly.

Do not require professional-quality framing.

The product should encourage the user to make the tuck box the dominant object in the final identification image.

The crop / prepare-photo step is part of the default flow. If the photograph is already well framed, confirming the existing crop should be easy. The user should not be blocked from identification solely because they decline extensive adjustment.

The original photo may be retained for the current session if useful, but the identification pipeline should use the prepared / cropped image.

V1 does NOT require automatic object detection or automatic cropping. Manual crop is sufficient.

The scan frame should clearly guide the user to place the tuck box inside the frame at capture time. Cropping remains available afterward when the captured image still leaves the deck too small or too peripheral.


# 5. Input Validity Check

Before performing full identification or web research, the system must first determine whether the submitted image plausibly contains a playing-card deck, tuck box, or other sufficiently relevant playing-card object.

This should be a fast preliminary validation step.

Its purpose is to prevent unnecessary research, latency, API usage, and hallucinated identifications.

A small deck in a complex background remains a valid input. Validity and identifiability are different questions. An image may contain a real deck and still be insufficient for a responsible identification until the user crops closer or provides another photograph.


## Valid Input

If a playing-card tuck box or clearly relevant playing-card object is visible, continue to identification.

Complex backgrounds are acceptable.

Examples include:

- Deck held in a hand
- Deck on a desk
- Deck photographed inside a store
- Deck photographed inside a car
- Deck surrounded by other objects
- Multiple decks in the frame
- Partially obscured tuck box, if sufficient information remains visible
- A clearly visible card back or other relevant playing-card object

The system should NOT reject a valid deck merely because the photograph is imperfect.


## Clearly Invalid Input

If the image obviously does not contain a playing-card deck or relevant playing-card object, stop immediately.

Object type: no_deck
Identification Level: 0

Examples:

- Car with no deck visible
- Cat
- Landscape
- Food
- Computer keyboard
- Random screenshot
- Human portrait with no visible deck

Do NOT perform unnecessary web research.

Return:

"No playing-card deck detected"

"We couldn't find a recognizable playing-card deck in this image."

"Try photographing the front of the tuck box."

Provide:

"Take Another Photo"


## Uncertain Input

If it is unclear whether a deck is present, do not invent an identification.

Return:

"Deck not clearly visible"

"A possible deck may be present, but there isn't enough visual information to identify it."

"Try taking a closer photo of the tuck box."

When a deck is visible but too small, distant, or peripheral in the frame, prefer Unclear or an unresolved deck detection over a guessed identity, and encourage cropping or a closer Tuck Front photograph.

The system must distinguish between:

- No deck present
- A deck may be present, but the image is insufficient
- A deck is visible, but identity is unresolved


# 6. Object Type

The system should know what kind of playing-card object it is looking at.

Suggested values:

- tuck_front
- tuck_back
- card_back
- card_face
- sealed_deck
- multiple_decks
- unknown
- no_deck

The system should not pretend that an image is a tuck-front photograph when it is not.

Example:

If the user submits a card back rather than a tuck front:

"Card back detected."

"For the most reliable first identification, please photograph the tuck box front."

A card-back image may still be useful evidence later.

Do not reject a useful image simply because it is not the preferred first input.


# 7. Optional Additional Images

Additional images are NOT required initially.

They should be requested only when they can resolve a specific uncertainty.

Supported additional evidence includes:


## Tuck Bottom

Useful for:

- Edition / Version
- Manufacturer
- Copyright
- Barcode
- Production information
- Distinguishing visually similar releases


## Tuck Back

Useful for:

- Artwork
- Copyright information
- Design variations
- Edition differences


## Card Back

Useful for:

- Cardistry-oriented visual identification
- Colorway / Variant
- Edition
- Series distinction


## Tuck Side

Useful for:

- Brand text
- Series text
- Manufacturer information
- Edition distinction


## Seal

Useful when seal design helps distinguish:

- Editions
- Limited releases
- Production variants


## Ace / Joker / Extra Card

Advanced optional evidence.

These should only be requested when genuinely useful.

The system must NEVER ask a user to open a sealed deck simply to improve identification.


# 8. Progressive Identification

V1 follows a progressive evidence model.

The system should not require every possible photograph before beginning.

Default flow:

User Image
↓
Image Preparation
↓
Observation
↓
Interpretation
↓
Candidate Generation
↓
Web / Source Research
↓
Deck Entity Resolution
↓
Reference Verification
↓
Human Confirmation when needed
↓
Final Identity

If sufficient evidence exists:

Identification Complete

This may be a full exact entity, or a valid partial identification such as Brand + Series with Edition unresolved.

If evidence is insufficient for the next identity level:

More Evidence Needed

The system should explain which additional photograph, research comparison, or human confirmation is most useful.

Example:

"Series identified. Exact edition could not yet be determined."

"These editions remain possible."

Then provide candidate comparison and / or:

"Scan Tuck Bottom"

The new image becomes part of the SAME identification session.

The system should reconsider the identification using:

- Original photograph
- Prepared / cropped photograph
- Additional photograph
- Previous candidates
- Previous research
- User confirmation, if provided
- New evidence

It should not unnecessarily restart the entire user experience.


# 9. Optional User Hint

The user may optionally provide:

"Anything you already know about this deck?"

Examples:

"I think this is Fontaine."

"Bought around 2018."

"Purchased from Art of Play."

"I think this might be a V2."

User-provided information is a HINT, not verified evidence, unless the user later confirms a specific candidate in a comparison flow.

A free-text hint must not override contradictory visual or external evidence.

A later explicit candidate selection is Human Confirmation, which is a distinct evidence type with provenance. See Human Confirmation.


# 10. Primary Identification Result

The first result screen should immediately answer:

"What deck is this?"

The primary answer is the canonical Deck Entity, not a set of disconnected OCR labels.

The screen should also show the Identification Level, so the user can tell how complete the answer is.

Example of an exact identification:

Fontaine × Carrots V2

Fontaine · Carrots · V2 · 2019

Identification Level: Variant or Edition, as supported by evidence

Example of a valid partial identification:

Fontaine × Carrots

Brand: Fontaine
Series: Carrots
Edition: Unresolved

Identification Level: Series

"Series identified. Exact edition could not yet be determined."

This is not total failure.

Detailed information appears below.

The user's photograph should remain a major visual element of the result screen.

A successful identification should also show a trustworthy reference image of the identified deck, or of ranked candidate editions when the exact edition is unresolved, so the user can visually compare:

User Photo
vs.
Reference Image

The user should be able to visually verify the identification, rather than being asked to trust the AI result blindly.


# 11. Identity Information

The system must stop treating Brand, Series, Edition, and other metadata as independent OCR fields.

It should identify a coherent Deck Entity, then populate supporting fields consistently.

Core Cardistry identity model:

Brand
↓
Series / Family
↓
Edition / Version
↓
Variant / Colorway

with optional:

Designer(s)
Collaboration(s)
Release Year

The final target is a coherent Deck Entity.

Conceptual structure:

deck_name
brand
series
edition
variant
designer(s)
collaborator(s)
release_year

Example:

deck_name:
Fontaine × Carrots V2

brand:
Fontaine

series:
Carrots

edition:
V2

variant:
null

collaborators:
Carrots

The canonical Deck Entity is the actual thing being identified. The fields describe that entity.

The system should identify the most likely canonical Deck Entity, then populate supporting fields consistently.

Prefer a coherent known deck entity over independently guessed metadata fields.


## Brand

The brand or publisher responsible for the deck.

For Cardistry / designer playing cards, Brand and Series are usually the core identity anchors.

Examples:

Fontaine → Carrots
Anyone Worldwide → Checkerboard
Virtuoso → SS14
Orbit → V8

Brand and Series should therefore be treated as the minimum meaningful identity target for a Cardistry deck when both can be established.


## Series / Family

A recognized product or design family within that brand.

Series / Family is nullable.

Do NOT require every playing-card deck in the world to have a Series.

A deck can legitimately have:

Brand:
XYZ

Series:
null

and still be a valid identification.

Never invent a Series just to fill the UI.

A word appearing on the tuck is NOT automatically the Series.

A Brand name appearing prominently on the package must NOT be copied into Series merely because it is visible.

Invalid reasoning pattern:

Visible word:
Fontaine

Therefore:
Brand = Fontaine
Series = Fontaine

This is NOT valid unless independent evidence establishes a Series actually called Fontaine.


## Edition / Version

A distinct release, generation, edition, or documented version within a Series.

Example:

V2

If Brand + Series are identified but Edition cannot yet be determined, leave Edition null / unresolved. Do not guess.


## Variant / Colorway

A variation that may exist within an edition, such as colorway or regional variation.

Nullable. Never invent a variant to complete the object.


## Deck Name

Full commonly accepted name of the exact deck entity, at the highest Identification Level supported by evidence.

This is a first-class identity field.

Examples:

Fontaine × Carrots V2

Fontaine × Carrots

when Edition is unresolved


## Designer(s)

When reliably available.


## Collaborator(s)

When reliably available.

Example:

Carrots


## Release Year

When reliably available.

Example:

2019


Information that cannot be reliably verified should be displayed as:

Unknown / Unresolved

or omitted when appropriate.

The system must NEVER invent metadata simply to make the result page appear complete.

Brand and Series are hierarchical identity fields, not independent OCR labels.


# 12. Identification Level

The system should report how complete the identification is.

Suggested levels:

LEVEL 0
No relevant deck detected

LEVEL 1
Deck detected, identity unresolved

LEVEL 2
Brand identified

LEVEL 3
Brand + Series identified

LEVEL 4
Edition / Version identified

LEVEL 5
Variant / Colorway identified

The system should be able to return a successful result even if only Brand + Series are known.

Example:

Identification Level:
Series

Brand:
Fontaine

Series:
Carrots

Edition:
null

User-facing interpretation:

"Series identified. Exact edition could not yet be determined."

This should NOT be presented as total failure.

If Brand + Series are confidently identified but Edition / Version is unknown:

DO NOT return overall Unknown.

Return a meaningful partial identification at Identification Level 3.

A Brand-only result (Level 2) is also a partial identification, not an exact success.

A Level 0 or Level 1 result remains a validity / unresolved-identity outcome, not a named deck.


# 13. Observation vs Interpretation

Separate raw visual observation from interpretation.

The vision system should conceptually produce two layers.


## Observation

What is actually visible?

Examples:

Object type:
tuck_front

Visible text:
only text that is actually readable, such as a clearly printed word

Visible logos / marks:
large stylized white central mark

Visual features:
black tuck
orange repeating carrot motif
white border


## Interpretation

What might these observations represent?

Possible brand:
Fontaine

Possible series:
Carrots

AI interpretation must never be written back into "visible text" as if it were literal OCR.

A stylized logo that looks like letters must not automatically become literal visible text.

Example failure:

Fontaine stylized logo
→ incorrectly interpreted as "1ST"
→ "1ST" treated as visible text
→ Brand = 1ST Playing Cards
→ High confidence

This must be treated as a serious hallucination failure.

Observation answers "I can see this."
Interpretation answers "This may be that deck."
These must not be collapsed into one field.


# 14. Entity Consistency

Before presenting a final exact identity, verify consistency across:

- deck_name
- brand
- series
- edition
- variant
- designer(s)
- collaborator(s)
- reference image, when shown

Examples of invalid results:

- Brand and Series both set to the same brand name without independent series evidence
- Deck Name contradicts Brand
- Edition belongs to a different Series
- Designer / collaboration contradicts the identified deck
- Reference image does not match the proposed deck entity

Example invalid result:

deck_name:
Fontaine × Carrots V2

brand:
Fontaine

series:
Fontaine

edition:
V2

This should be detected as inconsistent.

If internal consistency cannot be established, the system should lower confidence, correct the mapping when the canonical relationship is known, or return Ambiguous / Unknown.

Never present an internally contradictory identity as High or Confirmed.

A correct Brand with an incorrect Series is still a partially incorrect identification.

Example:

Brand: Fontaine
Series: Fontaine
Edition: unknown

must NOT be treated as a correct exact identification of a known Fontaine collaboration deck such as Fontaine × Carrots V2.


# 15. Evidence Attribution

Important identity fields should be supported by evidence where possible:

- Brand evidence
- Series evidence
- Edition evidence
- Variant evidence

Evidence can be:

- visual
- textual
- external
- reference-image-based
- user-confirmed

The system should distinguish:

"I can see this"

from:

"This interpretation matches a known deck"

from:

"The user confirmed this candidate"

Do not treat these as equivalent evidence.

User confirmation is valid evidence and should have explicit provenance. It is not the same as a vision-model guess or an unreviewed web listing.


# 16. Production Information

When supported by reliable sources, return:


## Printer

Examples:

USPCC
Cartamundi
EPCC
Legends Playing Card Company


## Stock

When reliably documented.


## Finish

When reliably documented.


## Crushed / Non-Crushed

When relevant and verifiable.


## Print Run

When reliably documented.


## Original Release Price / MSRP

When reliably documented.

This is historical release information, NOT current market valuation.


## Release Status

Possible states:

- Available
- Sold Out
- Discontinued
- Unknown

If production information differs by batch or cannot be verified, the system should explicitly communicate that uncertainty.


# 17. Classification

The system may provide simple descriptive classifications such as:

- Cardistry
- Magic
- Designer
- Standard
- Collector
- Hybrid
- Unknown

Multiple classifications may apply.

These labels exist to help users understand the general purpose and cultural positioning of the deck.

They are not intended as rigid academic categories.


# 18. About This Deck

V1 should provide a concise contextual explanation of the identified deck.

The purpose is to answer:

"Why is this deck worth knowing about?"

Possible context includes:

- Cardistry significance
- Brand history
- Design significance
- Important collaboration
- Historical period
- Cultural context

Example:

"An early Fontaine collaboration with Carrots, representing Fontaine's growing connection between Cardistry, streetwear, collaboration culture, and limited product drops."

This section must distinguish between:

- Verified facts
- AI-synthesized historical/contextual interpretation

Subjective collector opinion should not be presented as objective fact.

About This Deck is interpretation, not observation, and must not be treated as identity evidence.


# 19. Identification Confidence

V1 should not overemphasize artificially precise numerical confidence scores.

The primary confidence system is categorical.


## Confirmed

Decisive visual characteristics and strong independent evidence identify the exact deck or edition.

Vision-only milestones should use Confirmed extremely rarely. No independent evidence means Confirmed is almost never appropriate.


## High Confidence

Evidence strongly supports the identification, but a decisive verification detail may be unavailable.


## Probable

An identity level is reasonably clear, but an important remaining detail is uncertain.


## Ambiguous

Two or more plausible candidates remain.


## Unknown

Available evidence is insufficient for a responsible identification at even Brand level, or no coherent entity can be formed.


Numerical confidence scores may be used internally.

V1 should not prominently expose exact percentages until the system has undergone meaningful benchmarking and confidence calibration.


## Guardrails

The model must NOT freely assign High or Confirmed based on a weak visual similarity.

Rules:

- If the Brand itself is uncertain: do not output High or Confirmed.
- If Series is uncertain: do not output High for the Series identity.
- If Edition is unresolved: do not present the exact Edition as Confirmed or High.
- A weak visual match must not receive High confidence merely because the model can name a plausible deck.
- Inconsistent identity fields must not be presented as Confirmed or High Confidence.

Vision-only V0.2 / V0.3a should prefer:

High
Probable
Ambiguous
Unknown

depending on actual evidence, and should almost never emit Confirmed.

The final application should eventually be able to apply additional programmatic guardrails to confidence instead of trusting unrestricted model confidence.


# 20. Alternative Matches and Candidate Comparison

The system must not force a single identification when multiple plausible candidates remain.

When Brand + Series are identified but Edition is unresolved, the system should be able to present candidate editions for human comparison.

Example:

Possible Editions:

Fontaine × Carrots V1
[reference image]
[key distinguishing features]

Fontaine × Carrots V2
[reference image]
[key distinguishing features]

Fontaine × Carrots V3
[reference image]
[key distinguishing features]

The user should be able to compare candidates.

Each alternative should be a coherent deck entity, not a disconnected set of OCR labels.

Alternative candidates should be ranked according to evidence strength, not merely listed randomly.

The system should explain the remaining uncertainty:

"The tuck fronts of these editions are visually similar."

And suggest the most useful next action, such as:

"Scan Tuck Bottom to distinguish them"

or invite the user to confirm a candidate if reference images make the distinction clear.

Candidate comparison depends on future Web Research + Reference Images.

V0.3b does NOT implement that system. It is a product requirement for the future identification flow.


# 21. Unknown vs Partial Identification

Failure to identify a deck confidently is an acceptable product outcome.

Unknown remains valid when a relevant deck cannot be identified at Brand or Series level, or when remaining candidates cannot be responsibly ranked.

If evidence is insufficient for any named identity:

"Unable to identify this deck reliably"

Then recommend a useful next step.

Example:

"Recommended next photo: Tuck Bottom"

The system must NEVER guess simply to create the appearance of success.

Edition / Version uncertainty is not total failure.

If Brand + Series are confidently identified:

Return a Series-level result.

User-facing message:

"Series identified. Exact edition could not be determined from the current evidence."

Do not collapse that outcome into overall Unknown.


# 22. Human Confirmation

V1 should support Human Confirmation as an explicit evidence type.

Example flow:

AI:
Brand = Fontaine
Series = Carrots
Edition unresolved

Research:
V1 / V2 / V3 discovered

System:
shows reference candidates

User:
"This is V2."

Final result:

Fontaine × Carrots V2

Source of Edition:
User confirmed after candidate comparison

The system must distinguish:

AI identified

from:

User confirmed

This creates clear provenance.

User confirmation is valid evidence. It should not be silently merged into model confidence as if the model had independently proven the edition.

A free-text hint is not Human Confirmation. Confirmation applies to a specific presented candidate.


# 23. Research and Evidence Model

The identification pipeline should conceptually follow:

User Image
↓
Image Preparation
↓
Observation
↓
Interpretation
↓
Candidate Generation
↓
Web / Source Research
↓
Deck Entity Resolution
↓
Reference Verification
↓
Human Confirmation when needed
↓
Final Identity

This is distinct from a vision-only shortcut of:

Image
↓
Vision Model
↓
Answer

V0.2 / V0.3a remain vision-only and do not perform web research.

V0.3b defines the semantic model required for later layers. It does not implement Web Research or Reference Verification.

V1 research architecture must support:

- Observation separate from interpretation
- Object type
- Identification Level
- Deck Entity Resolution
- Reference verification
- Human confirmation with provenance

not merely free-form field extraction from a photograph.

AI acts as:

- Visual observer
- Interpreter of candidates
- Search planner
- Entity resolver
- Evidence synthesizer
- Final reasoner

AI should NOT treat its own prior output as independent evidence.

Visible words on a tuck box are observational evidence, not a complete identity model. Extracting the most prominent printed word into both Brand and Series is not acceptable entity resolution.


# 24. Source Priority

Sources should be weighted according to reliability.


## Tier 1 — Official Sources

Highest priority.

Examples:

- Brand websites
- Designer websites
- Official release archives
- Official product announcements
- Official product pages


## Tier 2 — Established Playing-Card Resources

Examples:

- Reputable playing-card databases
- Established archival resources
- Well-maintained collector references


## Tier 3 — Market Evidence

Examples:

- eBay listings
- Specialist playing-card retailers
- Historical product listings

Market evidence is primarily useful for:

- Reference photographs
- Product names
- Packaging comparison
- Edition / version cross-checking

V1 does not use this tier for market valuation.

Reputable specialist retailers outrank generic marketplace images when choosing a visual reference.


## Tier 4 — Community Sources

Examples:

- UnitedCardists
- Reddit playing-card communities
- Cardistry communities
- Established collector discussions

Useful for context and difficult historical questions.


## Tier 5 — Unverified Retail / Listing Information

Weak evidence.

Examples include poorly documented reseller listings or marketplace descriptions.

These should not independently determine an identification.


# 25. Evidence Independence

Multiple search results do not necessarily represent multiple independent pieces of evidence.

Example:

Five eBay sellers describing a deck as "V2" do not automatically constitute five independent confirmations.

The system should consider:

- Source authority
- Source independence
- Whether descriptions may have been copied
- Whether photographs actually match
- Whether official information corroborates the claim
- Whether the source identifies the exact edition or merely the general series
- Whether the claim is observation, interpretation, external evidence, or user confirmation

Evidence quality matters more than raw result count.


# 26. Why This Match?

Every successful identification should allow the user to understand the reasoning, attributed by field where possible.

Example:

Why this match?

- Brand evidence: Fontaine branding / mark matches
- Series evidence: Carrots collaboration artwork matches
- Edition evidence: Tuck design matches known V2 references
- External evidence: Official release material corroborates the edition

The system should also expose meaningful remaining uncertainty.

Example:

Remaining uncertainty:

"Edition not confirmed. Tuck bottom was not provided."

This feature exists to make identification inspectable rather than magical.

Visual comparison with a reference image is part of this inspectability.

Do not present interpretation as if it were literal visible text.


# 27. Sources

Identification results should expose the external sources used to support important factual claims.

Example:

Sources:

- Fontaine — Official Release Archive
- Established Playing Card Resource
- eBay — Visual Reference
- User confirmed edition after candidate comparison

Sources should be clickable when possible.

The AI itself is NOT a source.

AI performs:

Observe → Interpret → Search → Compare → Resolve → Summarize

Factual claims should ultimately be grounded in external evidence whenever reasonably possible.


# 28. Reference Image

A successful identification should not only provide text metadata.

It should also show a trustworthy reference image of the identified deck so that the user can visually compare:

User Photo
vs.
Reference Image

The reference image must correspond to the identified deck / edition as closely as possible.

The system should NOT display a generic image of the brand or series when the exact identified edition is known.

If a trustworthy exact-edition reference image cannot be found, say so instead of presenting a misleading image.

When Edition is unresolved, reference images should support candidate comparison rather than implying one exact edition.

The reference image should be accompanied by its source.

Example:

Reference Image
Fontaine — Official
View Source

Preferred source order for the reference image:

1. Official brand website / official product page
2. Official release archive / designer website
3. Established playing-card archive / collector database
4. Reputable specialist retailer
5. Marketplace or secondary-market image only when higher-quality sources are unavailable

A reference image that does not match the proposed deck entity is a consistency failure. In that case, omit the image or lower confidence rather than showing a misleading picture.


# 29. Localization

The entire application should support:

- English
- Simplified Chinese

Provide a visible language switcher.

The UI language should be user-selectable and should not depend exclusively on browser language.

The system may use browser language as an initial default, but the user must be able to switch manually.

Localization must cover the application UI, including:

- Home screen
- Scan actions
- Upload actions
- Crop / prepare-photo UI
- Analyzing state
- Identification result
- Identification Level labels
- Confidence labels
- Error messages
- Invalid / unclear messages
- Suggested next-photo guidance
- Candidate comparison
- Reference-image section
- Sources
- Any future V1 UI copy


## Canonical Names

UI localization and identity naming are separate concepts.

The canonical deck identity should preserve the brand / community name.

Playing-card brand names, series names, edition names, and variant names should NOT be forcibly translated into Chinese.

Use the canonical / original names used by the brand and the playing-card community.

Examples:

English UI:
Brand: Bicycle
Series: Rider Back

Simplified Chinese UI:
品牌：Bicycle
系列：Rider Back

NOT:

品牌：自行车

Likewise, names such as:

Fontaine
Carrots
Anyone Worldwide
Checkerboard
Virtuoso
SS14
Orbit
V8
Dealersgrip

should remain in their canonical / original form.

If a brand or series has an official Chinese name, that may be used when appropriate, but the canonical / original name should remain available.

The underlying metadata should preserve canonical names independent of UI language.

Changing UI language must NOT change the stored identity of the deck.


# 30. V1 User Flow

OPEN
↓
SCAN DECK / UPLOAD PHOTO
↓
PREFERRED: TUCK FRONT
↓
CROP / PREPARE PHOTO
↓
OBJECT TYPE / INPUT VALIDITY CHECK

If invalid / no_deck:
↓
NO DECK DETECTED
↓
TAKE ANOTHER PHOTO

If valid:
↓
OBSERVATION
↓
INTERPRETATION
↓
CANDIDATE GENERATION
↓
WEB / SOURCE RESEARCH
↓
DECK ENTITY RESOLUTION
↓
REFERENCE VERIFICATION
↓
HUMAN CONFIRMATION when needed
↓
RESULT

The result may be:

- Exact Deck Entity
- Partial identification (for example Brand + Series, Edition unresolved)
- Ambiguous candidates
- Unknown
- Invalid

When Edition is unresolved but Brand + Series are known:

RESULT at Identification Level Series
↓
CANDIDATE COMPARISON
↓
optional USER CONFIRMATION
and / or
REQUEST ADDITIONAL PHOTO

Final action:

SCAN ANOTHER DECK

Language may be switched at any point without restarting identification or changing the stored deck identity.

There is NO Add to Collection action in V1.


# 31. Camera and Platform

V1 is a mobile-first Web App.

The product should work through modern mobile browsers.

Initial camera implementation may use the device's native capture/file-input behavior.

The scan frame should clearly guide the user to place the tuck box inside the frame.

A custom real-time camera scanner interface is optional and NOT required for V1.

Automatic object detection and automatic cropping are NOT required for V1.

Production deployment should use HTTPS so browser camera permissions function correctly.

V1 does not require:

- App Store
- TestFlight
- Google Play
- Native mobile installation


# 32. V1 Beta Strategy

V1 should be deployable as a shareable HTTPS Web App.


## Stage 1 — Internal Alpha

Test using a varied set of real decks.

Important categories include:

- Major Cardistry brands
- Standard playing cards, including decks with no Series
- Designer decks
- Collaboration decks
- Similar colorways / variants
- Multiple editions of the same series
- Obscure decks
- Difficult photographs
- Deck occupying a small portion of the frame
- Card-back photographs
- Invalid / non-deck photographs
- Stylized logos that can be misread as text

The purpose is to discover failure modes.


## Stage 2 — Private Beta

Invite a small number of experienced Cardists and playing-card collectors.

The product does NOT need an integrated feedback system.

Feedback can be collected directly through conversation with testers.

Important questions include:

- Was the object type correct?
- Was the Brand correct?
- Was the Series correct?
- Was the exact Edition correct?
- Was the Variant correct when relevant?
- Was the deck entity internally consistent?
- Was Brand + Series treated as a useful partial result when Edition was unknown?
- Did the reference image match the identified deck / edition?
- Was candidate comparison useful?
- Was human confirmation useful and clearly attributed?
- Was additional-photo guidance useful?
- Were the sources convincing?
- Did the system admit uncertainty appropriately?
- Did it hallucinate visible text from logos?
- Was identification fast enough?
- Was the result useful?
- Was crop / prepare-photo useful?
- Was the language switcher usable?


## Stage 3 — Community Beta

Only after Private Beta results are understood should broader Cardistry-community testing be considered.


# 33. V1 Success Criteria

V1 success does NOT mean:

"The system identifies every playing-card deck ever made."

V1 succeeds if:

For Cardistry and designer decks with reasonable internet documentation, a user can normally begin with one Tuck Front photograph, optionally crop it so the tuck box dominates the frame, the system can often identify Brand and Series, can identify the exact Edition when sufficient evidence exists, can present a coherent Deck Entity, can show a trustworthy reference image when one is available, can ask for candidate comparison or additional evidence instead of guessing, and knows when identity remains unresolved.

Additionally:

Obviously irrelevant photographs should be rejected quickly without triggering the expensive research pipeline.

A result is not considered fully correct merely because the Brand is correct.

A Brand-correct but Series-wrong result is NOT an exact identification success.

A Brand + Series correct but Edition unresolved result is a valid partial identification.

Evaluation should separately track:

1. Object-type accuracy
2. Brand accuracy
3. Series accuracy
4. Edition / Version accuracy
5. Variant accuracy
6. Deck-entity accuracy
7. Entity consistency
8. Evidence attribution accuracy
9. Reference-image match
10. Appropriate use of Unknown / Ambiguous
11. Hallucination rate, including hallucinated visible text
12. Human-confirmation usefulness

Also continue evaluating:

- Invalid-image rejection
- Unclear-image detection
- Whether additional-photo guidance is useful

Example of a result that is not a correct exact identification:

Brand: Fontaine
Series: Fontaine
Edition: unknown

when the photographed object is a known Fontaine collaboration deck.

The exact entity hierarchy matters.

The system should optimize for:

Reliability > apparent success rate

and:

Useful uncertainty > confident hallucination


# 34. Product Principles

These principles govern all V1 development decisions.


## 1. One photo should be enough to start.

Do not create unnecessary capture friction.


## 2. Validate before researching.

Clearly irrelevant images should never trigger the full identification pipeline.


## 3. Ask for more evidence only when needed.

Additional photographs should solve specific uncertainties.


## 4. Never guess to create the appearance of completeness.

Unknown and Ambiguous are legitimate outcomes. Partial identification is also a legitimate outcome.


## 5. Sources matter more than AI confidence.

Strong external evidence should drive identification.


## 6. Evidence quality matters more than evidence quantity.

Five weak listings do not outweigh one decisive official source.


## 7. Do not punish imperfect real-world photography.

A deck photographed in a hand, store, car, or cluttered environment can still be valid input.


## 8. Never require a collector to open a sealed deck.

Identification must respect the physical object being collected.


## 9. Keep facts and interpretation distinguishable.

Historical context is valuable, but AI interpretation must not masquerade as verified metadata.


## 10. V1 does one thing well: identify playing cards.

Do not allow collection management, valuation, social features, or unrelated functionality to dilute the core product.


## 11. Prepare the image before asking the model to identify it.

Help the user make the tuck box the dominant object in the identification image.


## 12. Show the user a trustworthy visual reference after identification whenever one is available.

The user should be able to compare their photo with a source-backed reference image.


## 13. Preserve canonical brand and series names across language settings.

Do not forcibly translate brand or series names. Changing UI language must not change deck identity.


## 14. Brand and Series are core Cardistry identity anchors.

For Cardistry / designer decks, Brand + Series is the minimum meaningful identity target when both can be established. Series remains nullable.


## 15. Brand, Series, Edition, and Variant are related identity concepts, not independent OCR fields.

A brand name printed on the tuck box is not automatically the series.


## 16. The Deck Entity is the final identification target.

Identify the most likely canonical Deck Entity, then populate supporting fields consistently.


## 17. Observation must be separated from interpretation.

"I can see this" is not the same as "this is that deck."


## 18. Literal visible text must never contain hallucinated interpretation.

A stylized logo must not be written back as OCR and then used as Brand evidence.


## 19. Object type matters.

Do not treat a card back as if it were a tuck front. Do not reject a useful non-tuck-front image solely for being the wrong preferred input.


## 20. Brand + Series identification is a meaningful successful partial result.

Edition uncertainty should not be presented as total failure.


## 21. Edition uncertainty should lead to candidate comparison, not forced guessing.

Show plausible editions with distinguishing evidence when possible.


## 22. User confirmation is valid evidence and should have explicit provenance.

Distinguish AI identified from User confirmed.


## 23. A weak visual match must not receive High confidence merely because the model can name a plausible deck.

Apply confidence guardrails. Prefer programmatic checks over unrestricted model confidence.


## 24. Internal identity consistency must be checked before presenting an exact result.

Never present a contradictory Brand / Series / Edition / Deck Name mapping as High or Confirmed.


## 25. A correct Brand with an incorrect Series is still a partially incorrect identification.

Brand-only correctness is not exact-entity correctness.


## 26. Visual verification should be part of user trust, not an afterthought.

Text metadata without a matching reference image asks the user to trust the model blindly.


==================================================
V1 PRODUCT DEFINITION
==================================================

Cardistry Scanner V1:

Take a photo of a playing-card deck you don't recognize. Crop it so the tuck box is clearly visible. Cardistry Scanner identifies the most likely canonical Deck Entity — Brand, Series, Edition, and Variant when evidence supports them — researches its basic information, shows a trustworthy reference image and the evidence behind the identification, treats Brand + Series as a meaningful partial result when Edition is unresolved, and asks for additional visual evidence or human confirmation when the exact entity cannot yet be determined reliably.

Scan. Identify. Understand.
