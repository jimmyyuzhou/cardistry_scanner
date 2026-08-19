==================================================
CARDISTRY SCANNER — V1 PRODUCT SPECIFICATION
==================================================

Version: V1
Status: Scope Frozen
Product Type: Mobile-first Web App
Primary Domain: Cardistry / Designer Playing Cards Identification

Updated after first real V0.2 visual-identification tests.


# 1. Product Purpose

Cardistry Scanner is a mobile-first identification tool for Cardistry and collectible playing-card decks.

Its core experience is:

Scan. Identify. Understand.

A user photographs a playing-card tuck box. The system uses visual AI, web research, and evidence evaluation to determine the most likely exact deck entity, including:

- Deck Name
- Brand
- Series
- Version / Edition

It then provides reliable basic information about the deck, explains why the identification was made, shows supporting sources, and presents a trustworthy reference image so the user can visually compare their photograph with the identified deck.

The primary V1 hypothesis is:

Can AI + web research reliably identify real-world Cardistry and designer playing-card decks from one photograph, while knowing when additional evidence is required?

V1 does not need to identify every playing-card deck ever produced.

Reliability is more important than apparent completeness.

The user should be able to visually verify the identification, rather than being asked to trust the AI result blindly.


# 2. V1 Scope

V1 focuses on one task:

Identify a playing-card deck as reliably as possible.

V1 includes:

- One-photo start from a Tuck Front photograph
- Manual crop / prepare-photo before identification
- Hierarchical identity: Brand → Series → Version / Edition → Deck Entity
- English and Simplified Chinese UI
- A trustworthy reference image of the identified deck when one can be found
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


# 3. Primary Input

## Required Input

### Tuck Front

The only required input is:

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

The system should NOT reject a valid deck merely because the photograph is imperfect.


## Clearly Invalid Input

If the image obviously does not contain a playing-card deck or relevant playing-card object, stop immediately.

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

When a deck is visible but too small, distant, or peripheral in the frame, prefer Unclear or Unknown over a guessed identity, and encourage cropping or a closer Tuck Front photograph.

The system must distinguish between:

- No deck present
- A deck may be present, but the image is insufficient


# 6. Optional Additional Images

Additional images are NOT required initially.

They should be requested only when they can resolve a specific uncertainty.

Supported additional evidence includes:


## Tuck Bottom

Useful for:

- Version / Edition
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
- Colorway
- Edition
- Series distinction


## Tuck Side

Useful for:

- Brand text
- Series text
- Manufacturer information
- Version distinction


## Seal

Useful when seal design helps distinguish:

- Editions
- Limited releases
- Production variants


## Ace / Joker / Extra Card

Advanced optional evidence.

These should only be requested when genuinely useful.

The system must NEVER ask a user to open a sealed deck simply to improve identification.


# 7. Progressive Identification

V1 follows a progressive evidence model.

The system should not require every possible photograph before beginning.

Default flow:

Tuck Front
↓
Crop / Prepare Photo
↓
Visual Analysis
↓
Candidate Generation
↓
Entity Resolution
↓
Research
↓
Reference Verification
↓
Evidence Evaluation

If sufficient evidence exists:

Identification Complete

If evidence is insufficient:

More Evidence Needed

The system should explain which additional photograph is most useful.

Example:

"Two editions remain possible."

"A photo of the tuck bottom can likely distinguish them."

Then provide:

"Scan Tuck Bottom"

The new image becomes part of the SAME identification session.

The system should reconsider the identification using:

- Original photograph
- Prepared / cropped photograph
- Additional photograph
- Previous candidates
- Previous research
- New evidence

It should not unnecessarily restart the entire user experience.


# 8. Optional User Hint

The user may optionally provide:

"Anything you already know about this deck?"

Examples:

"I think this is Fontaine."

"Bought around 2018."

"Purchased from Art of Play."

"I think this might be a V2."

User-provided information is a HINT, not verified evidence.

The system must not allow the hint to override contradictory visual or external evidence.


# 9. Primary Identification Result

The first result screen should immediately answer:

"What deck is this?"

The primary answer is the canonical deck entity, not a set of disconnected OCR labels.

Example:

Fontaine × Carrots V2

Fontaine · Carrots · V2 · 2019

HIGH CONFIDENCE

Detailed information appears below.

The user's photograph should remain a major visual element of the result screen.

A successful identification should also show a trustworthy reference image of the identified deck so the user can visually compare:

User Photo
vs.
Reference Image

The user should be able to visually verify the identification, rather than being asked to trust the AI result blindly.


# 10. Identity Information

Playing-card identity is hierarchical.

Brand
↓
Series
↓
Version / Edition
↓
Deck Entity

The exact deck entity is the primary identification target.

The system should determine the most likely canonical deck entity first, then populate supporting metadata fields consistently.

Recommended conceptual hierarchy:

deck_name
brand
series
version

Example:

Deck Name:
Fontaine × Carrots V2

Brand:
Fontaine

Series:
Carrots

Version:
V2

The system must prefer a coherent known deck entity over independently guessed metadata fields.

Brand and Series are hierarchical identity fields, not independent OCR labels.

A brand name appearing on the tuck box does not automatically define the series.

The system must NOT infer:

Brand = Fontaine
Series = Fontaine

merely because the word "Fontaine" appears prominently on the packaging.

Series should be supported by independent visual evidence and/or reliable external evidence.

When reliably available, return:


## Deck Name

Full commonly accepted name of the exact deck entity.

This is a first-class identity field.

Example:

Fontaine × Carrots V2


## Brand

Example:

Fontaine


## Series

Example:

Carrots

Series must not be copied from Brand unless the series is independently that name.


## Version / Edition

Example:

V2


## Release Year

Example:

2019


## Designer / Collaboration

Examples:

Fontaine × Carrots

Dan and Dave Buck

The Virts


Information that cannot be reliably verified should be displayed as:

Unknown

or omitted when appropriate.

The system must NEVER invent metadata simply to make the result page appear complete.

The final deck identity must be internally consistent. The system should not produce:

Deck Name: Fontaine × Carrots V2
Brand: Fontaine
Series: Fontaine
Version: V2

if the canonical relationship is known to be:

Fontaine → Carrots → V2


# 11. Entity Consistency

The final result must be checked for logical consistency between:

- Deck Name
- Brand
- Series
- Version / Edition
- Designer / Collaboration
- Reference image, when shown

Examples of invalid results:

- Brand and Series both set to the same brand name without independent series evidence
- Deck Name contradicts Brand
- Version belongs to a different Series
- Designer / collaboration contradicts the identified deck
- Reference image does not match the proposed deck entity

If internal consistency cannot be established, the system should lower confidence or return AMBIGUOUS / UNKNOWN rather than presenting a confident identification.

A correct Brand with an incorrect Series is still a partially incorrect identification.

Example:

Brand: Fontaine
Series: Fontaine
Version: unknown

must NOT be treated as a correct exact identification of a known Fontaine collaboration deck such as Fontaine × Carrots V2.


# 12. Production Information

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


# 13. Classification

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


# 14. About This Deck

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


# 15. Identification Confidence

V1 should not overemphasize artificially precise numerical confidence scores.

The primary confidence system is categorical.


## Confirmed

Decisive visual characteristics and strong independent evidence identify the exact deck or edition.


## High Confidence

Evidence strongly supports the identification, but a decisive verification detail may be unavailable.


## Probable

Brand and/or Series are reasonably clear, but Version / Edition or another important detail remains uncertain.


## Ambiguous

Two or more plausible candidates remain.


## Unknown

Available evidence is insufficient for a responsible identification.


Numerical confidence scores may be used internally.

V1 should not prominently expose exact percentages until the system has undergone meaningful benchmarking and confidence calibration.

Inconsistent identity fields must not be presented as Confirmed or High Confidence.


# 16. Alternative Matches

The system must not force a single identification when multiple plausible candidates remain.

Example:

Probable Match:

Fontaine XXXXX V2

Possible alternative:

Fontaine XXXXX V3

Then explain the ambiguity:

"The tuck fronts of these editions are visually similar."

And suggest the most useful next action:

"Scan Tuck Bottom to distinguish them"

Alternative candidates should be ranked according to evidence strength, not merely listed randomly.

Each alternative should also be a coherent deck entity, not a disconnected set of OCR labels.


# 17. Unknown Is a Valid Result

Failure to identify a deck confidently is an acceptable product outcome.

If evidence is insufficient, return:

"Unable to identify this deck reliably"

"We found several possible matches, but there isn't enough evidence to determine the exact edition."

Then recommend a useful next step.

Example:

"Recommended next photo: Tuck Bottom"

The system must NEVER guess simply to create the appearance of success.


# 18. Research and Evidence Model

The identification pipeline should conceptually follow:

User Photo
↓
Crop / Prepare Photo
↓
Input Validity Check
↓
Visual Evidence
↓
Candidate Generation
↓
Entity Resolution
↓
Web Research
↓
Reference Verification
↓
Evidence Evaluation
↓
Final Identification

This is distinct from a vision-only shortcut of:

Image
↓
Vision Model
↓
Answer

V0.2 remains vision-only and does not perform web research.

V1 research architecture must support entity resolution and reference verification, not merely free-form field extraction from a photograph.

AI acts as:

- Visual observer
- Search planner
- Entity resolver
- Evidence synthesizer
- Final reasoner

AI should NOT treat its own prior output as independent evidence.

Visible words on a tuck box are evidence, not a complete identity model. Extracting the most prominent printed word into both Brand and Series is not acceptable entity resolution.


# 19. Source Priority

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
- Version cross-checking

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


# 20. Evidence Independence

Multiple search results do not necessarily represent multiple independent pieces of evidence.

Example:

Five eBay sellers describing a deck as "V2" do not automatically constitute five independent confirmations.

The system should consider:

- Source authority
- Source independence
- Whether descriptions may have been copied
- Whether photographs actually match
- Whether official information corroborates the claim
- Whether the source identifies the exact version or merely the general series

Evidence quality matters more than raw result count.


# 21. Why This Match?

Every successful identification should allow the user to understand the reasoning.

Example:

Why this match?

- Fontaine branding matches
- Carrots collaboration artwork matches
- Tuck design matches known V2 references
- Official release material corroborates the edition

The system should also expose meaningful remaining uncertainty.

Example:

Remaining uncertainty:

"Tuck bottom was not provided."

This feature exists to make identification inspectable rather than magical.

Visual comparison with a reference image is part of this inspectability.


# 22. Sources

Identification results should expose the external sources used to support important factual claims.

Example:

Sources:

- Fontaine — Official Release Archive
- Established Playing Card Resource
- eBay — Visual Reference

Sources should be clickable when possible.

The AI itself is NOT a source.

AI performs:

Observe → Search → Compare → Evaluate → Summarize

Factual claims should ultimately be grounded in external evidence whenever reasonably possible.


# 23. Reference Image

A successful identification should not only provide text metadata.

It should also show a trustworthy reference image of the identified deck so that the user can visually compare:

User Photo
vs.
Reference Image

The reference image must correspond to the identified deck / version as closely as possible.

The system should NOT display a generic image of the brand or series when the exact identified version is known.

If a trustworthy exact-version reference image cannot be found, say so instead of presenting a misleading image.

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


# 24. Localization

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
- Confidence labels
- Error messages
- Invalid / unclear messages
- Suggested next-photo guidance
- Reference-image section
- Sources
- Any future V1 UI copy


## Canonical Names

Playing-card brand names and series names should NOT be forcibly translated into Chinese.

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
Anyone
Virtuoso
Orbit
Dealersgrip

should remain in their canonical / original form.

If a brand or series has an official Chinese name, that may be used when appropriate, but the canonical / original name should remain available.

The underlying metadata should preserve canonical names independent of UI language.

Changing UI language must NOT change the stored identity of the deck.


# 25. V1 User Flow

OPEN
↓
SCAN DECK / UPLOAD PHOTO
↓
TUCK FRONT
↓
CROP / PREPARE PHOTO
↓
INPUT VALIDITY CHECK

If invalid:
↓
NO DECK DETECTED
↓
TAKE ANOTHER PHOTO

If valid:
↓
VISUAL ANALYSIS
↓
CANDIDATE GENERATION
↓
ENTITY RESOLUTION
↓
WEB RESEARCH
↓
REFERENCE VERIFICATION
↓
EVIDENCE EVALUATION

Then either:

MATCH
↓
RESULT
including user photo, identity fields, and reference image when available

or:

UNCERTAIN
↓
REQUEST EVIDENCE
↓
Tuck Bottom / Tuck Back / Card Back / etc.
↓
ADD PHOTO
↓
RE-EVALUATE
↓
RESULT

Final action:

SCAN ANOTHER DECK

Language may be switched at any point without restarting identification or changing the stored deck identity.

There is NO Add to Collection action in V1.


# 26. Camera and Platform

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


# 27. V1 Beta Strategy

V1 should be deployable as a shareable HTTPS Web App.


## Stage 1 — Internal Alpha

Test using a varied set of real decks.

Important categories include:

- Major Cardistry brands
- Standard playing cards
- Designer decks
- Collaboration decks
- Similar colorways
- Multiple editions of the same series
- Obscure decks
- Difficult photographs
- Deck occupying a small portion of the frame
- Invalid/non-deck photographs

The purpose is to discover failure modes.


## Stage 2 — Private Beta

Invite a small number of experienced Cardists and playing-card collectors.

The product does NOT need an integrated feedback system.

Feedback can be collected directly through conversation with testers.

Important questions include:

- Was the Brand correct?
- Was the Series correct?
- Was the exact Version correct?
- Was the deck entity internally consistent?
- Did the reference image match the identified deck / version?
- Was additional-photo guidance useful?
- Were the sources convincing?
- Did the system admit uncertainty appropriately?
- Was identification fast enough?
- Was the result useful?
- Was crop / prepare-photo useful?
- Was the language switcher usable?


## Stage 3 — Community Beta

Only after Private Beta results are understood should broader Cardistry-community testing be considered.


# 28. V1 Success Criteria

V1 success does NOT mean:

"The system identifies every playing-card deck ever made."

V1 succeeds if:

For Cardistry and designer decks with reasonable internet documentation, a user can normally begin with one Tuck Front photograph, optionally crop it so the tuck box dominates the frame, the system can often identify the Brand and Series, can identify the exact Version when sufficient evidence exists, can present a coherent deck entity, can show a trustworthy reference image when one is available, and knows when to request additional evidence instead of guessing.

Additionally:

Obviously irrelevant photographs should be rejected quickly without triggering the expensive research pipeline.

A result is not considered fully correct merely because the Brand is correct.

Evaluation should separately track:

1. Brand accuracy
2. Series accuracy
3. Version accuracy
4. Entity consistency
5. Reference-image match

Also continue evaluating:

- Invalid-image rejection
- Unclear-image detection
- Appropriate use of Ambiguous / Unknown
- Hallucination rate
- Whether additional-photo guidance is useful

Example of a result that is not a correct exact identification:

Brand: Fontaine
Series: Fontaine
Version: unknown

when the photographed object is a known Fontaine collaboration deck.

The exact entity hierarchy matters.

The system should optimize for:

Reliability > apparent success rate

and:

Useful uncertainty > confident hallucination


# 29. Product Principles

These principles govern all V1 development decisions.


## 1. One photo should be enough to start.

Do not create unnecessary capture friction.


## 2. Validate before researching.

Clearly irrelevant images should never trigger the full identification pipeline.


## 3. Ask for more evidence only when needed.

Additional photographs should solve specific uncertainties.


## 4. Never guess to create the appearance of completeness.

Unknown and Ambiguous are legitimate outcomes.


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


## 14. Brand, Series, Version, and Deck are related identity entities, not independent OCR fields.

A brand name printed on the tuck box is not automatically the series.


## 15. The system should identify a coherent deck entity before filling secondary metadata.

Prefer a consistent known deck over independently guessed fields.


## 16. A correct Brand with an incorrect Series is still a partially incorrect identification.

Brand-only correctness is not exact-entity correctness.


## 17. Visual verification should be part of user trust, not an afterthought.

Text metadata without a matching reference image asks the user to trust the model blindly.


==================================================
V1 PRODUCT DEFINITION
==================================================

Cardistry Scanner V1:

Take a photo of a playing-card deck you don't recognize. Crop it so the tuck box is clearly visible. Cardistry Scanner identifies the most likely exact deck entity, researches its basic information, shows a trustworthy reference image and the evidence behind the identification, and asks for additional visual evidence when the answer cannot yet be determined reliably.

Scan. Identify. Understand.
