# Jetnity Final Homepage Premium Experience 2 — TASK

Stand: 30 September 2026
Status: **BOUNDED HOMEPAGE PREMIUM UX / MOBILE-FIRST / SEARCH+AI PRESERVATION / NO LAUNCH AUTHORITY**

Issue: #648
Branch: `feat/final-homepage-premium-experience-2`
Baseline: `main@5ed4a9e3abb5a2920cee21359f5efb703a090a72`

## 1. Product-Owner decision

The Product Owner reviewed the live homepage and authorized the Technical Lead to make it as modern, premium and functionally top-level as possible.

Binding intent:
- keep the accepted #644 Google/Search/AI/entity/truth foundation;
- upgrade the human experience from a clean SaaS/documentation page to a premium travel product;
- smartphone is primary;
- no deceptive functionality;
- no Search/AI regression.

This is not a rewrite of product truth and not a rollback of #644.

## 2. Fresh precheck facts

Before dispatch:
- machine mode `NORMAL`;
- live main `5ed4a9e3abb5a2920cee21359f5efb703a090a72`;
- #642/#641 closed;
- #644/#643 closed and post-merge verified;
- #647/#646 closed and post-merge verified;
- post-#647 CI `36739917927` SUCCESS;
- post-#647 Vercel Production `dpl_J3CNdzWhiqzYqD6wsgEUZAHArQF5` READY on exact main with `jetnity.com`;
- public homepage still serves the accepted #644 product content and remains `noindex, nofollow`, robots `Disallow: /`;
- no active runtime/product writer;
- historical open PRs #52/#50/#40/#39/#28 are not active writers;
- #626 remains OPEN/BLOCKED;
- provider/payment/Production/indexing/launch special gates remain closed;
- #585 remains deferred.

The top continuity block merged by #647 still contains its pre-merge “Draft #647” delivery-time sentence. Live #647 closure evidence supersedes that sentence. Do not edit global current-state files from this product slice.

## 3. Writer identity

Agent: **Jetnity final homepage premium experience 2**
Generation: **1**
Required model: **Grok 4.7 High Fast**, not Auto.

Record actual Cursor session URL and `originalModelName` before editing.
If required model is unavailable, STOP.

## 4. Read first

1. `.jetnity/operating-mode.json`
2. `JETNITY_START_HERE.md` plus live #647 closure
3. Technical-Lead / Cursor standard
4. Binding Slice Precheck standard
5. `docs/FINAL_HOMEPAGE_PRODUCT_SPEC_2026-09-30.md`
6. `docs/FINAL_HOMEPAGE_PRODUCT_1_{TASK,REPORT,HANDOFF,SELF_REVIEW}_2026-09-30.md`
7. current `app/(public)/page.tsx`
8. current `components/home/**`
9. current `lib/seo/final-homepage.ts` and test
10. current public navbar/session navigation contracts for read-only audit
11. live `jetnity.com` and current screenshots/evidence from #644

Reconstruct live before editing.

## 5. Design diagnosis to solve

The Hero is accepted and currently the strongest part of the page.

Below the Hero, the current page is truthful but visually too repetitive:
- repeated white rounded cards;
- the five-tool 3+2 grid leaves dead composition and reads like a feature matrix;
- the product window reads more like an information card than a premium workspace;
- the 3-step section repeats another generic card row;
- the long capability list is excellent truth evidence but visually resembles release notes;
- section rhythm is too uniform.

The page must feel like one connected premium travel product.

## 6. Required final experience

### 6.1 Hero — preserve strength
Preserve:
- H1 exactly: **Deine ganze Reise. Intelligent an einem Ort.**
- real `StartzielForm`;
- Bali image direction;
- concise visible definition;
- immediate primary action;
- excellent mobile first screen.

Only refine typography/spacing/composition if evidence shows an improvement.

### 6.2 One connected trip system
Replace the generic five-card matrix with a visually connected system.

Communicate:
- Reiseplan;
- Flüge;
- Unterkunft;
- Aktivitäten;
- Mobilität;
- all belong to one trip/context.

Direction:
- central trip/context identity plus connected domain modules, or another equally strong product-native composition;
- desktop can use a connected horizontal/constellation layout;
- phone should become a natural vertical connected flow;
- no dead 3+2 grid;
- use existing Lucide/icons/design tokens only;
- state labels remain truthful.

### 6.3 Premium product window — visual centerpiece
Transform Lissabon/Porto into a convincing mini Jetnity workspace, still synthetic.

Must visibly include:
- **Produktvorschau**;
- Lissabon + Porto trip identity / 8-day example;
- real modes: Übersicht / Reiseplan / Organisieren / Vorbereitung;
- Jetzt wichtig;
- a lightweight mini plan/timeline or route context;
- open gaps and a clear next action;
- provider/official non-live boundaries.

It should look like product UI rather than a text matrix.

Forbidden:
- fake prices;
- fake availability;
- fake bookings;
- fake provider offers;
- fake official/safety/entry results;
- fake live alerts;
- fake collaboration.

### 6.4 “So begleitet Jetnity deine Reise”
Do not use another generic three-card row.

Create a connected 3-step journey:
1. Beschreiben
2. Organisieren
3. Begleiten lassen

Phone: clear vertical progression.
Desktop: richer connected sequence.
Text remains concise and truthful.

### 6.5 “Warum Jetnity anders ist”
Preserve the strong dark premium contrast.
May become asymmetrical / more editorial if that improves hierarchy.
Core messages remain:
- Reisekontext statt Einzelsuche;
- Wahrheit statt geratenen Antworten;
- nächster sinnvoller Schritt statt Informationsflut.

### 6.6 Inspiration
Keep the strong Bali / Lissabon / Zermatt / Amsterdam visual section.
Preserve exact place IDs/order and `zielHref`.
Refine hover/focus/layout only if useful.
No thin destination SEO pages.

### 6.7 Trust + capability truth — compact but machine-readable
The full current-vs-planned truth is a Search/AI asset and must remain server-rendered.

Redesign so it does not dominate the page:
- premium trust/transparency summary;
- clear grouped status story: today / partial / in preparation / later;
- show key truths immediately;
- full detailed capability text stays in semantic SSR HTML, preferably a native accessible `<details>` / `<summary>` disclosure or an equally accessible no-JS pattern;
- do not move full truth into client-only state;
- do not use `display:none`/sr-only SEO stuffing;
- visitors can expand detail when they want it;
- Search/AI can still extract every capability statement from server HTML.

### 6.8 Closing CTA and footer
Keep strong closing CTA.
Improve section transition and visual finish if needed.
No new conversion claims.

## 7. Search / Google / AI / answer-engine contract — zero regression

Must preserve or improve:
- one H1;
- visible concise Jetnity definition;
- stable entity name Jetnity;
- SSR/static critical copy;
- semantic landmarks and H2/H3 hierarchy;
- canonical `https://jetnity.com/`;
- page title and description;
- OpenGraph/Twitter;
- JSON-LD graph: Organization / WebSite / SoftwareApplication;
- JSON-LD description aligned with visible definition;
- current-vs-planned truth;
- internal crawlable links;
- no private trip/account/admin indexing claims;
- no fake `sameAs`, ratings, reviews, awards, offers, user counts, partner/provider claims;
- no keyword stuffing;
- no thin pages;
- no `llms.txt` substitute.

The page must still make these questions easy to answer from HTML:
- What is Jetnity?
- Who is it for?
- What does it do?
- What is available today?
- What is partial?
- What is planned?
- What makes Jetnity different?
- How do I start?

## 8. Public navigation audit — read-only unless defect proven

Audit current PublicNavbar/session logic on:
- guest;
- account;
- unknown/hydration state;
- desktop;
- compact menu.

It must never truthfully contradict session state.

Existing source contract says:
- guest: Anmelden only;
- account: Konto + Abmelden;
- unknown: no session claim.

Do not edit auth/navigation merely to restyle the homepage.
If a real contradictory state is reproduced and a fix requires `PublicNavbar` or auth-navigation paths, STOP and request a minimal scope amendment before editing.

## 9. Mobile-first acceptance

Primary:
- 360×800
- 390×844

Then:
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

Phone must not feel like desktop cards stacked vertically.

Required:
- no horizontal overflow;
- touch targets >=44px;
- compact inputs >=16px;
- safe-area aware;
- keyboard/focus visible;
- reduced-motion respected;
- no content hidden under sticky nav;
- 200% text readable;
- no mid-word fragmentation in critical headings/definition;
- no global overflow hiding.

## 10. Performance quality

- no new dependency;
- no video/autoplay;
- no external design/vendor service;
- no unnecessary client components for static presentation;
- preserve static homepage where possible;
- existing images only unless an existing repository asset is clearly better;
- responsive images;
- restrained shadows/blur;
- no presentation that harms contrast/readability;
- no large JS animation library.

## 11. Allowed runtime write ownership

Allowed:
- `app/(public)/page.tsx`
- `components/home/**`
- `lib/seo/final-homepage.ts` only when required for truthful content/grouping
- `lib/seo/final-homepage.test.ts`
- NEW focused homepage presentation helpers under `lib/home/**` only if pure/static and justified
- NEW `scripts/final-homepage-premium-experience-2-audit.mjs`
- own task/report/handoff/self-review
- `docs/evidence/final-homepage-premium-experience-2/**`

Do NOT edit:
- `components/layout/PublicNavbar.tsx`
- `lib/auth/oeffentliche-navigation.ts`
- `StartzielForm`
- Trip Workspace runtime
without STOP + TL scope amendment.

Do not edit global continuity pointers from this product slice.

## 12. Hard boundaries

No provider activation/call/contact/secret.
No Supabase/Auth/RLS/schema/function.
No payment.
No dependencies/lockfile.
No #626.
No PrivacyBee/legal rewrite.
No tracking/ads/pixels.
No i18n routing migration.
No robots/indexing launch change.
No Production configuration.
No external vendor/service.
No fake evidence.

## 13. Before / after evidence

Create objective before and after evidence from the same production-like local runtime.

At minimum:
- first screen: 360, 390, 1440;
- connected-system section: 360/390 + 1440;
- product window: 360/390 + 1440;
- 3-step flow: 390 + 1440;
- inspiration: 390 + 1440;
- trust/capability collapsed/default and expanded state: 390 + 1440;
- full page: 390 + 1440;
- 200% text: 360;
- keyboard focus path;
- reduced motion;
- console/page errors;
- network origins;
- horizontal overflow;
- metadata/canonical/JSON-LD;
- server HTML includes full capability truth even in compact disclosure.

Audit guest navbar source/behavior; run existing auth navigation unit tests. Do not fabricate account browser proof if credentials are unavailable.

## 14. Gates

Run:
- focused homepage/search tests;
- relevant public navigation tests;
- full `npm test`;
- typecheck;
- lint;
- build;
- hygiene checks;
- production-mode browser audit;
- exact-head GitHub CI/Auth;
- exact-head Vercel Preview;
- changed-path manifest;
- merge-base/ahead/behind;
- review threads;
- actual agent session/model.

## 15. Stop

Cursor remains Draft.
No Ready.
No merge.
No follow-up slice.
STOP for independent main-chat Technical-Lead **code + copy + truth + mobile + visual + Search/AI** review.
