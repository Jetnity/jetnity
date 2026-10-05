# Jetnity Trip Workspace Information Architecture 2 — TASK

Stand: 30 September 2026
Status: **BOUNDED UX/IA REPAIR / URL-BACKED TASK MODES / NO TRUTH OR PROVIDER AUTHORITY**

Issue: #641
Branch: `feat/trip-workspace-task-modes-2`
Baseline: `main@91ab08bb9163444fcbce4a5303c1522c5ad5498c`

## 1. Why this exists

#638 is accepted, merged and Production-verified. It solved the concrete problem that domain work appeared far below the desktop overview/detail split.

A new full-page Product-Owner review shows the larger IA problem:
- the default trip page is still one long document;
- Tagesplan, readiness, safety/seasonal, edit and assistant are buried below overview content;
- opening a domain makes the unrelated overview continue down the left column, producing a half-width day plan and large empty right-hand space;
- meaningful workspace state is not URL-addressable.

Do not reopen #638. Preserve its accepted interaction behavior inside the new shell.

## 2. Binding product decision

One Trip Workspace shell, four task modes:

1. `uebersicht` — label **Übersicht**
2. `plan` — label **Reiseplan**
3. `organisieren` — label **Organisieren**
4. `vorbereitung` — label **Vorbereitung**

Domains remain subordinate to `organisieren`:
`fluege | unterkunft | aktivitaeten | mobilitaet`.

This is not a hard multi-page experience. The global trip shell stays stable and mode changes are client-side. Meaningful mode/domain state must be reflected in the URL/history.

## 3. URL contract

Use a small deterministic query contract:
- Übersicht = no `ansicht` query
- Reiseplan = `?ansicht=plan`
- Organisieren = `?ansicht=organisieren`
- Organisieren domain = `?ansicht=organisieren&bereich=<domain>`
- Vorbereitung = `?ansicht=vorbereitung`

Requirements:
- Back/Forward restores mode/domain.
- Reload with a valid URL restores mode/domain.
- Invalid/unknown values fail closed to Übersicht.
- `bereich` is ignored/removed unless `ansicht=organisieren`.
- Preserve unrelated query parameters unless they conflict with this owned contract.
- No full-document navigation/reload.
- Prefer a client-history implementation that does not unnecessarily rerun server data loading.
- Search-open/result state does **not** need to enter the URL in this slice.
- URL mode/domain must never start a provider/model search automatically.

## 4. Mode content

### Übersicht
Render only the concise dashboard layer:
- overview title/progress
- `Jetzt wichtig`
- destination essentials
- domain coverage/status cards
- existing compact preference summary where useful

Do **not** render the full:
- `TripWorkspacePlan`
- safety block
- seasonal block
- `Reisevorbereitung`
at the bottom of Übersicht.

Overview domain status click:
- switch to `organisieren`
- select the corresponding domain
- update URL
- preserve #638 focus/context behavior

Attention actions:
- domain gaps -> `organisieren` + domain
- official/readiness action -> `vorbereitung`
- no provider/model side effect

### Reiseplan
Render `TripWorkspacePlan` at full workspace width.
Preserve existing planning truth, CRUD, selected day and item detail behavior.
Opening an existing item may open its contextual detail without forcing unrelated overview content into a parallel column.

Do not redesign the day-selector semantics in this slice unless a minimal seam is required for the new mode.

### Organisieren
At no domain selection:
- show domain navigator/status list and an honest empty instruction.

At domain selection:
- desktop >=1024: domain navigator/status rail + one active domain context/work surface;
- compact: one active domain task with clear parent/back navigation.

Preserve from #638:
- detail + inventory + explicit search remain one coherent domain context;
- search remains explicit;
- 360/390 sticky chrome/identity behavior;
- exactly one compact back control;
- desktop contextual work surface;
- focus restoration / Escape;
- hidden/inert semantics;
- responsive field widths.

Do not keep the entire Trip overview/day plan as the permanent left side of Organisieren.

### Vorbereitung
Render the existing:
- safety
- seasonal/travel-time
- `Reisevorbereitung`
as the full-width preparation workspace.

Do not change official/readiness/traveller truth or persistence.

## 5. Workspace local navigation

Add a dedicated trip-local mode navigation below the trip summary/header.

Required:
- 4 labels above
- `aria-current` / keyboard semantics
- >=44px targets
- desktop clearly integrated with trip shell
- mobile/tablet clean wrap/scroll without horizontal page overflow
- mode change moves focus/scroll to the new mode heading, but does not unexpectedly steal focus for pointer users
- no duplicate global nav

If sticky behavior is used, it must respect actual site-header occlusion and safe-area behavior.

## 6. Trip actions

Move the existing **Reise ändern** and **Reisebegleiter fragen** entry controls out of the bottom-of-overview discovery problem.

Preferred bounded solution:
- compact action row near the trip-local navigation/header
- existing content panels may open immediately below that action row
- preserve existing lazy mount, focus, Escape, and “assistant changes nothing” semantics

Do not create a new floating assistant/chat product in this slice.
Do not change the assistant/provider/model execution contract.

## 7. Write ownership

Allowed runtime:
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `components/trips/TripWorkspaceKopf.tsx` only if needed for the bounded action seam
- `components/trips/TripWorkspaceNavigation.tsx`
- `components/trips/TripWorkspacePlan.tsx` only for mode/container seam, not plan truth
- `components/trips/TripWorkspaceDetail.tsx` only for parent/back wording/seam if required
- NEW `components/trips/TripWorkspaceModeNavigation.tsx`
- NEW `components/trips/TripWorkspaceDomainNavigation.tsx` if separation is justified
- NEW `lib/trips/workspace-mode.ts`
- focused tests under `lib/trips/*workspace-mode-2*.test.ts`
- bounded audit script `scripts/trip-workspace-information-architecture-2-audit.mjs`
- own task/report/handoff/self-review
- `docs/evidence/trip-workspace-information-architecture-2/`

Do not touch any other runtime path without STOP + TL approval.

## 8. Hard boundaries

No provider activation/call.
No automatic commercial search.
No commercial snapshot/provenance changes.
No route/trip/traveller truth change.
No official/readiness/safety/seasonal truth change.
No Supabase/Auth/RLS/schema/functions.
No payments.
No dependencies/lockfile.
No #626.
No Account/Admin/map work.
No global header/nav redesign.
No launch/indexing.

## 9. Audit matrix before and after

Viewports:
- 360×800
- 390×844
- 768×1024
- 1024×768
- 1280×800
- 1440×900
- 1920×1080

Required flows:
1. default URL -> Übersicht
2. click Reiseplan -> URL + full-width plan
3. click Organisieren -> domain navigator
4. select Flüge -> URL + in-context flight domain
5. open explicit Flug search -> no auto provider call
6. select Unterkunft / Aktivitäten / Mobilität
7. Vorbereitung -> full-width readiness/safety/seasonal
8. Jetzt wichtig flight gap -> Organisieren/Flüge
9. official/readiness attention -> Vorbereitung
10. browser Back/Forward across at least Übersicht -> Plan -> Organisieren/Flüge
11. reload valid deep link
12. invalid query -> Übersicht
13. edit-trip action open/close/focus
14. assistant action open/close/focus when available
15. existing item detail
16. Escape/back behavior from compact domain

Record:
- URL
- scrollY
- active element
- visible mode heading
- mode/domain nav state
- horizontal overflow
- provider/model network requests
- key bounding boxes

## 10. Acceptance criteria

- the default trip page no longer renders the full plan + preparation + edit + assistant as one long continuation;
- Plan uses full width;
- Preparation uses full width;
- Organisieren uses domain navigation + active domain workspace, not full overview as its permanent left column;
- meaningful mode/domain state is URL/history-backed;
- Back/Forward/reload/deep-link behavior is deterministic;
- invalid URL state fails closed;
- no provider/model call occurs from mode/domain navigation;
- #638 explicit-search/focus/compact-context fixes remain;
- no horizontal overflow;
- keyboard/focus/44px semantics preserved;
- Guest and Account share the same mode shell;
- all current truth/persistence behavior unchanged;
- focused tests + full tests + typecheck + lint + build + CI/Auth + Vercel Preview green.

## 11. Deliverables

- before/after cross-device evidence
- URL/history evidence
- network no-auto-call evidence
- exact changed-file manifest
- exact final head / merge-base / ahead-behind
- actual Cursor session URL + `originalModelName`
- report + self-review + handoff

Required model: **Grok 4.7 High Fast**, not Auto.

Cursor remains Draft.
No Ready, no merge, no follow-up slice.
STOP for independent main-chat TL **code + IA + visual + interaction** review.
