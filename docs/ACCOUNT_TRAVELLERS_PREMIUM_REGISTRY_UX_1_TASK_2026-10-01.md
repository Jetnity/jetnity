# Account Reisende Premium Registry UX 1 — Binding Task

Date: 1 October 2026
Issue: #696
Baseline: `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`
Logical agent: **Jetnity Account travellers premium registry UX 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Product-owner evidence

Live authenticated screenshots of `/account/travellers` show:
- the registry is functionally strong but visually too long;
- every traveller permanently renders profile actions, citizenship controls, all document cards and a full add-document form;
- with only two travellers the page already spans many screens;
- “Person hinzufügen” is only reachable after all existing traveller details;
- desktop is constrained to a narrow single column while the forms are still very tall;
- on phone the same structure becomes an excessive vertical form stack.

Use the quality method of merged #661:
- understand the page in 2–3 seconds;
- hierarchy before decoration;
- phone-first;
- preserve truth/behavior;
- measure before/after;
- test 200% text, keyboard/focus and >=44px targets.

## Hard truth/privacy contracts

Do not regress:
- Account Registry is reusable account data, not a trip plan;
- already-created trips retain independent traveller snapshots;
- multiple citizenships are equal; no primary/preferred citizenship;
- no automatic citizenship or document choice;
- no default passport;
- issuing country and citizenship remain independent;
- citizenship-document association stays optional and explicit;
- document expiry is metadata relative to the device/current calendar only, never proof a document is sufficient;
- no passport number, document number, MRZ, scan, biometric, health or date-of-birth field;
- delete only removes the Registry entry; existing trips remain unchanged;
- Loading / Empty / Error remain distinct;
- account auth/RLS boundary unchanged.

## A. Page hierarchy

Turn the page into a compact traveller registry overview.

Expected:
1. title + concise registry/trip-snapshot explanation;
2. clear primary “Reisenden hinzufügen” action near the top;
3. compact traveller summaries;
4. details/forms only when the user explicitly opens management for a traveller.

The add-person form must not live only at the end of all traveller details.

## B. Traveller summary cards

Default state should be compact.

Each traveller summary should expose only already-stored truth, for example:
- display label;
- residence;
- citizenship labels/count;
- document type labels/count;
- existing factual expiry warning if one exists.

Do not invent:
- preferred passport/citizenship;
- readiness/eligibility;
- completion percentage;
- “profile complete” score;
- travel suitability.

Preferred wide layout:
- two-column summary grid where readable;
- selected/expanded traveller may span full width if that improves editing.

Phone:
- one clear card per traveller;
- no dense two-column form;
- no horizontal overflow.

## C. Progressive disclosure

The permanent full forms are the main UX defect.

Required:
- default traveller card is collapsed/summary;
- explicit “Verwalten” / equivalent >=44px opens the current citizenship/document management;
- only one heavy management panel should be open at a time unless strong evidence supports otherwise;
- closing returns to the compact summary without losing persisted data;
- direct actions must still target the exact traveller.

Do not hide important factual warnings permanently. If a document expiry warning exists, surface a compact summary indication and full exact text inside management.

## D. Identity / delete

“Angaben ändern” and delete remain available but should not dominate every collapsed card.

Delete:
- still requires the existing explicit confirmation;
- no icon-only destructive control;
- existing copy about trips remaining unchanged must stay.

Identity edit:
- same fields and write action;
- no new personal fields.

## E. Citizenship management

Preserve current semantics:
- all citizenships equal;
- multiple allowed;
- duplicate blocked;
- max 8;
- removing one unlinks document association but does not rewrite other document metadata.

Improve presentation:
- compact tags/rows for stored citizenships;
- add form only visible while managing;
- no repeated explanatory paragraph more often than necessary inside the same open card;
- >=44px controls;
- country search remains existing LandFeld behavior.

## F. Document management

Preserve:
- max 12;
- document type, issuer, optional citizenship association, expiry only;
- no auto-association;
- no first-citizenship default;
- existing expiry lifecycle text;
- edit/remove exact document id.

Improve:
- compact stored-document summaries;
- full add/edit form only when explicitly opened;
- edit one document at a time;
- “Dokument hinzufügen” opens the form instead of keeping it permanently visible;
- cancel returns to summary;
- phone inputs >=16px.

## G. Add traveller

Provide a near-top primary action.

Allowed:
- collapsible/add panel;
- label + residence fields unchanged;
- no extra fields;
- no trip creation/materialization;
- after successful add, preserve current refresh/status behavior.

## H. Cross-device matrix

Audit at least:
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
- desktop zoom 125% / 150%

States:
- two travellers with multiple citizenships/documents (PO-like state);
- one expanded traveller;
- identity edit;
- add citizenship;
- add document;
- edit document;
- delete confirmation;
- add traveller;
- empty;
- read error.

Measure:
- total page height before/after in the two-traveller state;
- first viewport hierarchy;
- number of heavy forms visible on first paint;
- horizontal overflow;
- minimum target;
- focus order/return;
- no content hidden behind navigation;
- no console/hydration error.

Target:
- materially shorter first-paint page;
- zero full document/citizenship add forms rendered open by default;
- existing information reachable in one explicit management action.

## I. Preferred file ownership

Allowed runtime:
- `components/account/AccountReisende.tsx`
- `components/account/AccountReisendeKarte.tsx`
- `app/account/travellers/page.tsx` only for local width/composition
- `app/account/travellers/loading.tsx` only to match the accepted shell
- `lib/traveller/account-registry-copy.ts` only for narrowly necessary presentation copy
- optional pure presentation helper `lib/traveller/account-travellers-premium-registry-ux-1*.ts`
- focused tests
- one visual audit script
- lane-specific docs/evidence

Do NOT edit:
- Registry persistence/actions/data model;
- `lib/traveller/account-registry-trip*` owned by #689;
- `lib/readiness/party.ts` or Preparation;
- AccountNavigation;
- Account home/world files owned by #691/#693;
- My Trips files owned by #695;
- Source Catalog #686;
- country core behavior;
- Supabase/Auth/RLS/schema;
- Trip Workspace;
- package/lockfile;
- global CSS/tokens;
- global continuity files.

If a forbidden file seems necessary, STOP and report.

## J. Tests

Prove at minimum:
- first paint shows compact traveller summaries, not all management forms;
- add traveller action is near top;
- expanded management exposes all existing citizenship/document functions;
- only one management panel open at a time if that chosen contract is used;
- equal-citizenship/no-primary text remains;
- no default document/citizenship assignment introduced;
- no sensitive fields introduced;
- delete confirmation and exact traveller targeting remain;
- document edit/remove exact id remains;
- Loading/Empty/Error semantics unchanged;
- no Registry→Trip materialization path introduced;
- no service-role/trip table references introduced.

Run:
- focused tests;
- full npm test;
- typecheck;
- lint;
- build;
- existing account-registry UI / country / document lifecycle tests;
- new visual matrix;
- git diff --check.

## K. Parallel/main drift

Active lanes may merge while this work runs.
Before final push:
- fetch current main;
- integrate it into this same branch/session;
- preserve merged work;
- remain 0 behind;
- rerun full gates and visual matrix.

## L. Stop

Push one exact validated head.
Record session URL, originalModelName, exact head, merge-base, ahead/behind, changed-file manifest, local gates and evidence.
Stay Draft.
Do not Ready.
Do not merge.
Do not start a follow-up.
STOP for independent Technical-Lead code + visual + mobile + interaction review.
