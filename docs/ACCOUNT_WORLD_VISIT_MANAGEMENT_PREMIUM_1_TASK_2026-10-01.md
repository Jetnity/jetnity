# Account / Deine Welt Visit Management Premium UX 1 — Binding Task

Date: 1 October 2026
Issue: #692
Baseline: `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`
Logical agent: **Jetnity Account world visit management premium UX 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Product-owner evidence

Live authenticated screenshots of `/account/welt` show:
- the map itself is already strong after merged #640;
- the management surface below it is too long and repetitive;
- around 40 confirmed visits create a tall wall of large cards;
- every card contains little information compared with its footprint;
- edit/revoke actions repeat on every row;
- the “Besuchten Ort hinzufügen” form is only reachable after scrolling past all existing visits;
- on mobile this becomes an extremely long single-column page.

The Product Owner wants the same quality method used for Trip Workspace #661:
- understand the page in 2–3 seconds;
- hierarchy before decoration;
- phone-first;
- truth/behavior preserved;
- measured cross-device evidence.

## Hard parallel boundary

Active #691 owns:
- `components/account/AccountWeltKarte.tsx`
- `components/account/AccountUebersicht.tsx`

This slice MUST NOT edit either file.

It also must not edit any active #686/#689 files.

The map, country chips, planned-place list, projection and marker behavior are therefore **out of this slice**. A later TL slice may refine full-atlas density after #691 merges.

## Goal

Turn the area around and below the map into a premium visit-management workspace without changing visit truth.

A user should immediately be able to:
1. see that this is their personal visited-world management page;
2. add a confirmed visit without scrolling through the entire history;
3. scan/search existing confirmed visits quickly;
4. edit or revoke one visit safely;
5. keep repeated visits distinct.

## A. Page header / primary action

Refine `AccountBesuche.tsx` so the page intro is more intentional on wide and compact screens.

Requirements:
- keep the existing factual copy and truth boundary;
- provide a clear >=44px primary action near the header: “Besuch hinzufügen” or existing equivalent;
- activating it reveals/focuses the existing add form close to the top of the management flow;
- do not auto-search or call a provider merely by opening the form;
- success/error status remains visible and truthful;
- mobile action should not squeeze beside long text.

Do not remove the full atlas map.

## B. Add-visit form

The existing form may be visually compacted/harmonized, but:
- same fields and semantics;
- place OR country remains alternative, not additive;
- date remains optional;
- no free-text geography persistence;
- no inferred date/place/country;
- no sensitive fields;
- field text input font >=16px on phones;
- controls >=44px;
- keyboard/focus and labels preserved.

The add form should not sit only after dozens of visit cards.

## C. Existing visit management

Replace the oversized endless card wall with a denser premium management treatment.

Required:
- repeated visits remain separate events;
- no aggregation/dedup by country/label;
- each visible event still exposes its title/country/date precision truth;
- edit/revoke semantics unchanged;
- confirmation before revoke unchanged;
- no hidden destructive action without explicit confirmation;
- no tiny icon-only controls.

Preferred direction:
- compact responsive cards/rows;
- 1 column phone;
- 2 columns tablet if appropriate;
- up to 3 columns wide desktop only if actions/text remain readable;
- local search/filter over already-loaded visit presentation text is allowed;
- progressive disclosure is allowed so ~40 events do not all render as a giant visual wall by default;
- e.g. first 12 events + “Weitere anzeigen” / “Alle anzeigen”, with search revealing matching events;
- no server pagination or persistence redesign.

If adding search:
- purely client-side over already loaded events;
- no new request;
- clear no-match state;
- accessible label;
- search must not mutate ordering/truth.

## D. Editing

When a visit is edited:
- only one edit form open at a time;
- existing form semantics stay;
- preserve repeated-event identity;
- opening edit should not jump the page unpredictably;
- cancel restores the compact row/card;
- >=44px actions.

## E. Density and page length

The Product Owner specifically flagged excessive scroll length.

Measure before/after for the `welt` fixture:
- total page height at 390×844, 768×1024, 1440×900, 1920×1080;
- height from “Bestätigte Besuche” heading to add form;
- number of visit cards visible before progressive disclosure;
- horizontal overflow.

Target:
- materially reduce initial management-page height with a ~40-visit fixture;
- do not hide data permanently; all events remain reachable with one explicit local action/search.

## F. Cross-device matrix

Audit:
- 320×568
- 360×800
- 390×844
- 412×915
- 430×932
- 768×1024
- 820×1180
- 1024×768
- 1280×800
- 1440×900
- 1728×1117
- 1920×1080
- 844×390 landscape
- 200% text at 360×800
- desktop zoom 125% and 150%

States:
- many confirmed visits;
- zero visits;
- read error;
- add form open;
- edit form open;
- revoke confirmation;
- search match;
- search no match;
- progressive disclosure expanded.

Verify:
- no horizontal overflow;
- no content hidden by nav;
- >=44px interactive targets;
- text inputs >=16px compact;
- focus visible;
- keyboard reachable;
- 200% text readable;
- reduced motion if movement is introduced;
- no new network call just from opening management controls;
- no console/hydration errors.

## G. Preferred file ownership

Allowed runtime:
- `components/account/AccountBesuche.tsx`
- `components/account/AccountBesuchFormular.tsx`
- `lib/account/besuche-copy.ts` only for narrowly necessary presentation copy
- optional new pure presentation helper under `lib/account/account-world-visit-management-premium-1*.ts`
- focused tests
- one audit script
- lane-specific docs/evidence

Do NOT edit:
- `components/account/AccountWeltKarte.tsx`
- `components/account/AccountUebersicht.tsx`
- `components/account/AccountAuditClient.tsx`
- world-map truth/projection/geography files
- visit actions/persistence/schema
- AccountNavigation
- global CSS/design tokens
- package/lockfile
- Supabase/Auth/provider/payment
- Trip Workspace
- global continuity files.

If `AccountAuditClient.tsx` seems necessary for fixtures, STOP and report; do not collide with #691.

## H. Tests

Prove at minimum:
- add action/form is near the management entry, not only after full visit history;
- existing visit count and event identities unchanged;
- repeated visits stay separate;
- default progressive disclosure does not drop events from state;
- “show more/all” exposes all;
- local filter uses no fetch;
- edit/revoke still act on exact event id;
- revoke confirmation still required;
- empty/error states distinct;
- map component invocation remains unchanged;
- no visit persistence/action file changed.

Run:
- focused tests;
- full npm test;
- typecheck;
- lint;
- build;
- account/world existing audit where possible without editing #691-owned fixtures;
- new visual audit from the existing route/fixture;
- git diff --check.

## I. Main drift

#691/#686/#689 may merge while this lane runs.
Before final push:
- fetch current main;
- integrate it into this same branch/session;
- preserve all merged work;
- remain 0 behind;
- rerun exact-head gates and visual matrix.

## J. Stop

Push one exact validated head.
Record session URL, originalModelName, exact head, merge-base, ahead/behind, changed-file manifest and evidence.
Stay Draft.
Do not Ready.
Do not merge.
Do not start a follow-up.
STOP for independent Technical-Lead code + visual + mobile + interaction review.
