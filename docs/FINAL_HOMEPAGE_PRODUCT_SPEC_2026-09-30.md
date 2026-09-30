# Jetnity — Final Homepage Product Spec

Stand: 30 September 2026  
Status: **PRODUCT-OWNER-BINDING FINAL HOMEPAGE TARGET**

This document is the canonical final public-homepage product target. It complements and operationalizes:
- `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`
- `docs/JETNITY_AI_SEARCH_DISCOVERABILITY_STANDARD.md`
- `docs/JETNITY_MARKETING_GROWTH_STANDARD.md`

It does **not** override truth, privacy, provider, payment, cost, indexing or launch gates.

## 1. Product promise

Jetnity presents itself as a connected travel-planning and travel-companion system, not a collection of unrelated search boxes.

Primary human-readable promise:

> **Deine ganze Reise. Intelligent an einem Ort.**

Supporting idea:

Jetnity connects route, planning, organization and preparation around one trip. It should help the traveller understand what is already known, what is still open and what the next useful step is.

Do not market primarily with the word `KI`. Intelligence should be visible through product behavior and clear benefit.

## 2. First-screen contract

On a smartphone, the first meaningful screen must answer three questions immediately:
1. What is Jetnity?
2. What can I do here?
3. How do I start?

Required first-screen ingredients:
- Jetnity brand
- one concise H1
- one concise supporting paragraph
- the real existing trip/destination entry
- one primary CTA
- no feature wall
- no deceptive fake availability/pricing

Desktop may add a restrained visual product preview beside/below the hero, but the trip entry remains the dominant action.

## 3. Homepage information architecture

### A. Hero
H1: **Deine ganze Reise. Intelligent an einem Ort.**

Intent:
- one trip, one connected context
- immediate route/trip entry
- calm, premium, trustworthy

The existing canonical destination/route confirmation path remains the functional entry. Natural multi-destination intent may be used only through the already accepted canonical place-confirmation logic.

### B. One trip instead of five separate tools
Headline direction:
**Eine Reise statt fünf getrennte Tools.**

Explain in visible text that flights, accommodation, activities, mobility, trip plan and preparation belong to the same trip context.

Use one truthful scenario:
- flight changes / route changes can affect other travel areas **only where Jetnity actually has the relevant logic/evidence**
- if not yet live, show that relationship as clearly labelled product direction/preview, not current automation.

### C. Product window
Show a high-quality synthetic, non-personal Jetnity trip as a product window.

Allowed:
- synthetic trip title, dates, destinations
- truthful UI patterns already present in Jetnity
- clearly labelled preview states for not-live features

Forbidden:
- fake provider offers/prices/availability
- fake official entry/safety results
- fake live alerts
- fake booking confirmations

The product window should communicate:
- Jetzt wichtig
- trip modes/workspace
- plan
- organize
- prepare
- clear next step

### D. How Jetnity works
Three steps:
1. **Beschreiben** — tell Jetnity where you want to go and what matters.
2. **Organisieren** — keep route, plan, flights, accommodation and other travel areas connected.
3. **Begleiten lassen** — Jetnity surfaces relevant open steps and context as supported by real evidence.

### E. Why Jetnity is different
Three core differentiators:

**Reisekontext statt Einzelsuche**  
A flight or hotel is part of one trip context.

**Wahrheit statt geratenen Antworten**  
Unknown stays unknown. Planned stays planned. Official/provider truth remains distinct from Jetnity recommendations.

**Nächster sinnvoller Schritt statt Informationsflut**  
Jetnity prioritizes what deserves attention rather than presenting endless options.

### F. Inspiration
Keep a curated inspiration layer.
Inspiration must lead into the real trip-entry flow, not into thin SEO doorway pages.

Future public destination/content pages are allowed only when individually useful and truth-ready.

### G. Trust
Headline direction:
**Deine Reise. Deine Entscheidungen.**

Explain:
- no important decision is silently taken for the traveller
- no fake provider truth
- official information, provider facts, Jetnity recommendations and personal plans remain separate
- privacy/sensitive data are not marketing material

### H. Capability truth
The page may show the intended complete product story now, but every non-live capability must be visibly labelled:
- `In Vorbereitung`
- `Kommt später`
- `Produktvorschau`
or equivalent.

No ambiguous state where a normal visitor would reasonably believe a non-live capability is available today.

### I. Final CTA
One strong closing action:
**Reise starten**

No CTA clutter.

## 4. Mobile-first rule

Smartphone is the primary homepage experience.

Required:
- 360×800 and 390×844 first-class evidence
- no horizontal page overflow
- >=44px interactive targets
- no input font below 16px on compact
- safe-area aware
- no critical copy hidden behind visual effects
- hero entry usable without precision tapping
- sections naturally progressive and skimmable
- no giant desktop mockup merely scaled down
- no autoplay-heavy media dependency

Tablet/laptop/desktop may use richer grids, split composition and wider product previews.

## 5. Google/Search contract

The homepage visible HTML must clearly state:
- Jetnity definition
- target user/problem
- actual current capabilities
- clearly labelled planned capabilities
- differentiated product logic
- how to start

Technical requirements:
- server-rendered/static critical copy
- one clear H1
- semantic H2/H3 hierarchy
- canonical `/`
- truthful metadata/description
- OpenGraph/Twitter
- crawlable internal links
- no homepage-critical information only inside images
- excellent accessibility/performance
- no private trip/account/admin links marketed as indexable public content

Public indexing remains controlled by the existing launch gate and stays fail-closed until explicitly enabled.

## 6. AI / Answer-engine / Entity contract

Jetnity should be easy to identify and cite as one entity.

Machine-readable and visible facts must agree:
- Brand: Jetnity
- Canonical website: `https://jetnity.com`
- Category/definition: travel planning / travel companion platform, using the most accurate publicly supportable phrasing
- Switzerland-first context where useful
- current vs planned functionality

Homepage structured data should use only truthful supported types, such as:
- `Organization`
- `WebSite`
- `SoftwareApplication` / suitable application type

No:
- fake `sameAs`
- fake reviews/ratings
- fake awards
- fake offers
- fake partner relationships
- fake user counts

Structured data must match visible content.

Answer-engine-friendly copy should make these questions easy to answer:
- What is Jetnity?
- Who is Jetnity for?
- What does Jetnity do?
- What is live?
- What is planned?
- How is Jetnity different?
- How does someone start?

Do not optimize by keyword repetition. Optimize by clarity, evidence and stable entity language.

## 7. Future public knowledge architecture

The homepage is the entity/product hub, not the only SEO page.

Later, once individually truth-ready:
- trip planner / travel planner
- multi-destination planning
- flights in Jetnity context
- accommodation in Jetnity context
- activities
- mobility
- entry/readiness
- travel preparation
- destination/city/country pages with real value
- fair comparison/use-case pages

No thin mass-generated pages.

## 8. Internationalization target

Final public content is multilingual:
DE / EN / FR / IT first for Switzerland relevance, with ES / PT / PL as planned target languages.

When implemented:
- real localized content
- language-specific URLs
- correct canonical/hreflang
- no low-quality automatic keyword translation
- consistent product truth in every language

This spec does not itself authorize an i18n routing migration.

## 9. Performance / accessibility target

The final homepage must remain fast and robust:
- no unnecessary dependency for presentation
- responsive images
- minimal JS for first content
- reduced-motion support
- accessible contrast/focus
- semantic landmarks
- Core Web Vitals treated as release-quality evidence
- no global overflow hiding to mask layout defects

## 10. Truth and launch boundary

This final design may be implemented before every capability exists.

However:
- live capability = may be described as available
- not-live capability = must be visibly labelled planned/preview
- unknown capability status = do not claim

No public indexing activation, paid provider activation, tracking, ads, new legal claim, partner claim or launch action follows from this document.

## 11. Final acceptance

A first-time visitor on phone or desktop should be able to explain, after a short visit:

> Jetnity helps me plan and organize one complete trip in a connected workspace, shows what is still open, separates facts from suggestions, and gives me a clear way to start my own trip.

Google/search/answer systems should be able to extract the same truthful definition from visible page content and matching structured data.
