==================================================
CARDISTRY SCANNER — V1 PRODUCT SPECIFICATION
==================================================

Version: V1
Status: Scope Frozen
Product Type: Mobile-first Web App
Primary Domain: Cardistry / Designer Playing Cards Identification


# 1. Product Purpose

Cardistry Scanner is a mobile-first identification tool for Cardistry and collectible playing-card decks.

Its core experience is:

Scan. Identify. Understand.

A user photographs a playing-card tuck box. The system uses visual AI, web research, and evidence evaluation to determine the most likely:

- Brand
- Series
- Version / Edition

It then provides reliable basic information about the deck, explains why the identification was made, and shows supporting sources.

The primary V1 hypothesis is:

Can AI + web research reliably identify real-world Cardistry and designer playing-card decks from one photograph, while knowing when additional evidence is required?

V1 does not need to identify every playing-card deck ever produced.

Reliability is more important than apparent completeness.


# 2. V1 Scope

V1 focuses on one task:

Identify a playing-card deck as reliably as possible.

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
- Native iOS app
- Native Android app

eBay and other marketplaces may still be used as identification evidence, but V1 does not provide valuation or market-price functionality.


# 3. Primary Input

## Required Input

### Tuck Front

The only required input is:

One photograph of the front of the playing-card tuck box.

The user should be able to begin identification immediately after taking this photograph.

The image does not need:

- A professional background
- Studio lighting
- Perfect cropping
- A scanner
- A perfectly isolated tuck box

The system should tolerate normal real-world photographs, including hands, tables, shelves, stores, cars, and other background objects.

The tuck box should ideally be sufficiently visible to analyze.


# 4. Input Validity Check

Before performing full identification or web research, the system must first determine whether the submitted image plausibly contains a playing-card deck, tuck box, or other sufficiently relevant playing-card object.

This should be a fast preliminary validation step.

Its purpose is to prevent unnecessary research, latency, API usage, and hallucinated identifications.


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

The system must distinguish between:

- No deck present
- A deck may be present, but the image is insufficient


# 5. Optional Additional Images

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


# 6. Progressive Identification

V1 follows a progressive evidence model.

The system should not require every possible photograph before beginning.

Default flow:

Tuck Front
↓
Visual Analysis
↓
Research
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
- Additional photograph
- Previous candidates
- Previous research
- New evidence

It should not unnecessarily restart the entire user experience.


# 7. Optional User Hint

The user may optionally provide:

"Anything you already know about this deck?"

Examples:

"I think this is Fontaine."

"Bought around 2018."

"Purchased from Art of Play."

"I think this might be a V2."

User-provided information is a HINT, not verified evidence.

The system must not allow the hint to override contradictory visual or external evidence.


# 8. Primary Identification Result

The first result screen should immediately answer:

"What deck is this?"

Example:

Fontaine × Carrots V2

Fontaine · Carrots · V2 · 2019

HIGH CONFIDENCE

Detailed information appears below.

The deck photograph should remain a major visual element of the result screen.


# 9. Identity Information

When reliably available, return:


## Deck Name

Full commonly accepted name.


## Brand

Example:

Fontaine


## Series

Example:

Carrots


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


# 10. Production Information

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


# 11. Classification

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


# 12. About This Deck

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


# 13. Identification Confidence

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


# 14. Alternative Matches

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


# 15. Unknown Is a Valid Result

Failure to identify a deck confidently is an acceptable product outcome.

If evidence is insufficient, return:

"Unable to identify this deck reliably"

"We found several possible matches, but there isn't enough evidence to determine the exact edition."

Then recommend a useful next step.

Example:

"Recommended next photo: Tuck Bottom"

The system must NEVER guess simply to create the appearance of success.


# 16. Research and Evidence Model

The identification pipeline should conceptually follow:

User Photo
↓
Input Validity Check
↓
Visual Analysis
↓
Candidate Generation
↓
Web Research
↓
Evidence Evaluation
↓
Final Identification


AI acts as:

- Visual observer
- Search planner
- Evidence synthesizer
- Final reasoner

AI should NOT treat its own prior output as independent evidence.


# 17. Source Priority

Sources should be weighted according to reliability.


## Tier 1 — Official Sources

Highest priority.

Examples:

- Brand websites
- Designer websites
- Official release archives
- Official product announcements


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


# 18. Evidence Independence

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


# 19. Why This Match?

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


# 20. Sources

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


# 21. V1 User Flow

OPEN
↓
SCAN DECK
↓
TUCK FRONT
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
WEB RESEARCH
↓
EVIDENCE EVALUATION

Then either:

MATCH
↓
RESULT

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

There is NO Add to Collection action in V1.


# 22. Camera and Platform

V1 is a mobile-first Web App.

The product should work through modern mobile browsers.

Initial camera implementation may use the device's native capture/file-input behavior.

A custom real-time camera scanner interface is optional and NOT required for V1.

Production deployment should use HTTPS so browser camera permissions function correctly.

V1 does not require:

- App Store
- TestFlight
- Google Play
- Native mobile installation


# 23. V1 Beta Strategy

V1 should be deployable as a shareable HTTPS Web App.


## Stage 1 — Internal Alpha

Test using a varied set of real decks.

Important categories include:

- Major Cardistry brands
- Standard playing cards
- Designer decks
- Similar colorways
- Multiple editions of the same series
- Obscure decks
- Difficult photographs
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
- Was additional-photo guidance useful?
- Were the sources convincing?
- Did the system admit uncertainty appropriately?
- Was identification fast enough?
- Was the result useful?


## Stage 3 — Community Beta

Only after Private Beta results are understood should broader Cardistry-community testing be considered.


# 24. V1 Success Criteria

V1 success does NOT mean:

"The system identifies every playing-card deck ever made."

V1 succeeds if:

For Cardistry and designer decks with reasonable internet documentation, a user can normally begin with one Tuck Front photograph, the system can often identify the Brand and Series, can identify the exact Version when sufficient evidence exists, and knows when to request additional evidence instead of guessing.

Additionally:

Obviously irrelevant photographs should be rejected quickly without triggering the expensive research pipeline.

The system should optimize for:

Reliability > apparent success rate

and:

Useful uncertainty > confident hallucination


# 25. Product Principles

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


==================================================
V1 PRODUCT DEFINITION
==================================================

Cardistry Scanner V1:

Take a photo of a playing-card deck you don't recognize. Cardistry Scanner identifies the most likely exact deck, researches its basic information, shows the evidence behind the identification, and asks for additional visual evidence when the answer cannot yet be determined reliably.

Scan. Identify. Understand.
