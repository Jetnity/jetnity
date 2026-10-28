# Jetnity UX V1 U1-C Route Design Alignment 1 — PRE-CODE PLAN

28 October 2026. Cursor Generation 1. Draft PR #1082. Tracking #1081. Parent #1064. Visual acceptance #1067 stays open. Organizer context #1068 stays queued and is not this writer.

This document is the pre-code plan. It authorizes no runtime edit. Implementation starts only after an independent Technical Lead accepts this plan, including the amendments named below.

## Binding

| Fact | Value |
| --- | --- |
| Repository | Jetnity/jetnity |
| Branch | `feat/ux-v1-u1c-route-design-alignment-1` |
| Task seed / parent of this plan | `408a4c5d50848ccbfcfc72b2aaca627168d10eb1` |
| Seed tree | `88e775d4e718459ed9650d1ae71609c43f88b436` |
| Baseline and fetched `origin/main` | `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc` |
| Main tree | `24770e02bd176f06040ccaf515783534ca5c83e6` |
| Merge-base with `origin/main` | `8fc72a18390af1650d6902fb2a20a64e4f7f8ccc` |
| Ahead / behind `origin/main` before this plan commit | 3 / 0 |
| Mode | `NORMAL` (`.jetnity/operating-mode.json`) |
| Session | https://cursor.com/agents/bc-4904589f-a8f0-4106-a65a-507bc53e084a |
| `bcId` | `bc-4904589f-a8f0-4106-a65a-507bc53e084a` |
| Session name after rename read-back | `UX V1 U1-C Route Design Alignment 1 — Cursor Generation 1` |
| `run-info.originalModelName` | `grok-4.7-high-fast` |
| Latest #751 read | https://github.com/Jetnity/jetnity/issues/751#issuecomment-6476986415 |

The local `origin/main` ref was stale at `b7cadb7688f7bac84df0ea33a7b9ec1f3a9b7c48` before `git fetch origin main`. After fetch it matches the task baseline. This plan does not treat a later main SHA as current.

Logical name: **Jetnity UX V1 Route Design Alignment 1 — Cursor Generation 1**. One writer. The U1-B session stays STOP and is not resumed.

## What is already true

Merged #1080 on this main already provides the four labelled modes, the compact header, desktop route/detail split through `naechsteAnordnung`, and mobile `Zur Route`. Canonical plan selection is `?ansicht=plan&tag=<dayId>&punkt=<itemId>` in `lib/trips/workspace-mode.ts`. History state `jetnityWorkspace` stores presentation context only. N12 `chronologischeLaeufe` already keeps repeated stage visits as separate runs, keeps unassigned days in calendar order, and does not invent Hinreise or Rückreise.

The remaining divergence is presentation:

- `TripWorkspacePlan` renders every day of every run as an equal chip. Below `md` those chips sit in `overflow-x-auto` strips (`data-plan-tag-streifen`). From `md` up they sit in a 4/7-column grid (`data-plan-raster`).
- The same component then repeats a stage summary (`data-plan-etappen-uebersicht`) via `timeline.etappen` and `ersterTagDerEtappe`. That summary is explicitly “not the calendar order” and collapses a stage to its first day, so a repeated city can point at the wrong visit.
- A visit whose stage has no stored `arrivalDate` / `departureDate` is labelled `Ziel dieser Reise – Aufenthalt noch nicht festgelegt` even when days are explicitly assigned to that stage.
- Guest `Entwurf verwerfen` and account `Reise löschen` sit in the always-visible header slot. Each already uses its own `window.confirm` and storage path.
- `BackToTop` is `fixed` at `bottom: calc(1.5rem + safe-area)` and `z-40`. The workspace bottom nav is `fixed`, `z-30`, and publishes its live height as `--ux-u1a-nav-offset`. At 390×844 the reproduced button rect `x322..366 / y776..820` intersects that nav at `y791..844`.

The HTML mock is a design reference with synthetic Hinreise/Rückreise roles and fake organizer jumps. It is not data and it is not permission to add those roles or a second workspace.

## Target behavior

1. The initial route is one compact chronological list. One row per N12 run. Selecting a row opens that run’s days in the existing detail pane. A 22-day trip does not show 22 equal day chips in the route.
2. Desktop keeps the existing measured split: route left, one detail right, using the current `neben` / `schmal` threshold. Narrow layout keeps route, then detail, then `Zur Route`. The four mode labels stay. No fifth tab and no admin sidebar.
3. The selected run’s day chooser wraps in normal flow. Every day of that run is a real button, at least 44×44 CSS pixels, with the existing `data-timeline-tag` and `aria-current="date"`. No compulsory horizontal swipe. Previous/next stays the existing whole-trip chronology from `planTageFolgen`.
4. Repeated visits stay distinct because the run key is already `${stageId}:ziel:${firstDayId}` and selection uses a day id, never the city name.
5. Non-contiguous runs of one stage are not collapsed. An unassigned or flight/transfer run between them stays in calendar order and blocks a shortcut connection across it.
6. Unassigned first and last dates stay `Noch keinem Ziel zugeordnet` or the existing flight/transfer-without-destination label. They do not become Hinreise or Rückreise. F01 is out of scope.
7. Planned-day text is derived only from the dates on the days in that run and is labelled `Geplante Tage`. Stored stage arrival/departure, when present, is shown separately with `etappenZeitraumAnzeigen`. Neither label is a lodging date, night count, or check-in.
8. Country text uses the stored stage `countryCode` only. Empty becomes `Land noch nicht zugeordnet`. A catalog code uses existing `landAnzeigeText`. A stored non-catalog code uses the existing unknown-code label. No flag and no inference from the city name.
9. Internal connections are labels or, only if amendment B is accepted, selectable detail. They are the existing `connection:<fromStageId>:<toStageId>` edges from `mobilitaetsAbdeckung` that also join two chronologically adjacent destination runs. Bangkok → Ko Chang → Phuket therefore has two internal neighbors. Outbound and return edges are not rendered. No date, duration, mode, price, availability, or covered state is invented. A stored flight or transfer already matched by that edge may show its existing title, status, and `durationMinutes` when that value is non-null.
10. Destructive discard/delete moves behind a closed `Reiseoptionen` disclosure. Confirmation text, handlers, and storage stay as they are. Storage truth stays outside that disclosure.
11. Back-to-top clears the live bottom nav or hides while that clearance is unknown. Pages without the fixed workspace nav keep today’s offset.

Organisieren is not given a new visit or connection argument. No route button says it opens a scoped organizer search. #1068 remains the owner of that context. 12Go stays the existing explicit external search.

## Selection, URL, and history

Visit and day selection stays on the current contract.

- Choosing a run calls the existing `tagWechseln` / `onTagWechseln`. If the current `tag` already belongs to that run, it is kept. Otherwise the run’s first day id is used. The same city name cannot select the other visit.
- The day chooser and the existing previous/next controls write the same `tag` parameter. `punkt` stays the existing item id.
- Reload, back, and forward keep using `modusAusQuery`, `modusFuerReise`, and `historieSchreiben`. A removed day still produces the existing `tag-fehlt` hint and does not substitute another visit. A removed item still produces `punkt-fehlt`.
- Mobile `routeBetont` stays local presentation state, as it is today. `Zur Route` does not push a new history entry.
- Focus return on `Zur Route` moves to the selected run button inside `[data-u1b-route]`, not to a day chip in a horizontal strip. The day chip remains in the detail chooser. If the anchored day was removed, focus falls back to the route container, which is the current removal behavior.
- Scroll restoration keeps the existing route-pane `scrollTop` / `window` snapshot. The horizontal strip snapshot goes away with the strip.
- Opening a run or a day does not mount a second search surface and does not issue a provider request.

Connection selection is the one URL decision in amendment B. Without that amendment, a connection is not a button.

## Compact route sketch

Reference shape only. Labels come from the real graph. The mock’s Hinreise/Rückreise names are not copied onto unassigned days.

Desktop, when `anordnung` is `neben`:

```text
Deine Route                              Bangkok
15. Nov. · Noch keinem Ziel zugeordnet   Geplante Tage: 16.–22. Nov.
Bangkok · Geplante Tage: 16.–22. Nov.    Land: Thailand
  Bangkok → Ko Chang                     [16] [17] [18] [19]
Ko Chang · Geplante Tage: 23.–29. Nov.   [20] [21] [22]
  Ko Chang → Phuket                      Vorheriger Tag    Nächster Tag
Phuket · Geplante Tage: 30. Nov.–5. Dez. day items, six kinds, editor
6. Dez. · Noch keinem Ziel zugeordnet
```

The day buttons wrap. They are not one horizontal scroller. The selected run row is `aria-pressed`. The selected day is `aria-current="date"`.

Narrow, route first:

```text
Deine Route
[ 15. Nov. · Noch keinem Ziel zugeordnet ]
[ Bangkok · Geplante Tage: 16.–22. Nov. · Thailand ]
  Bangkok → Ko Chang
[ Ko Chang · … ]
  Ko Chang → Phuket
[ Phuket · … ]
[ 6. Dez. · Noch keinem Ziel zugeordnet ]
```

Narrow, after choosing Bangkok:

```text
Zur Route
Bangkok
Geplante Tage: 16.–22. Nov.
Land: Thailand
[16] [17] [18]
[19] [20] [21]
[22]
Vorheriger Tag          Nächster Tag
existing day detail and editor
```

`Zur Route` returns to the route list and focuses the Bangkok run button. Previous/next can move into Ko Chang; the detail heading then follows that run. No second column is mounted.

Back-to-top, only while `[data-shell-nav="bottom"]` is fixed:

```text
bottom = var(--ux-u1a-nav-offset) + 0.75rem
```

That variable is already the nav’s `offsetHeight`, including its own safe-area padding. Safe area is not added a second time. If the fixed nav is present and the variable is missing or not a positive length, the control uses the existing hidden/`inert` state until a measurement exists. Sticky and flow navs do not change the current public-page offset.

## Reiseoptionen

`TripWorkspaceKopf` gains an optional `reiseoptionen` slot rendered as:

```text
Reiseoptionen          (closed details, summary is a 44px button)
  existing Entwurf verwerfen or Reise löschen button
```

The visible header keeps the title, dates, route summary, `Reise ändern`, and the existing device/account sentence. Guest save errors and the account sentence `Änderungen werden sofort in deinem Konto gespeichert.` stay outside the disclosure. The confirm strings stay in `GastArbeitsbereich.verwerfen` and `KontoArbeitsbereich.loeschen`.

This slot split is amendment C. Putting the whole current `kopfzeile` inside the disclosure would hide the guest error and the account save sentence, so that shortcut is not the plan.

## Exact write set after acceptance

Allowed without further amendment:

- `components/trips/TripWorkspacePlan.tsx` — replace the chip strips, day grid, and duplicate stage summary with the compact route; keep the detail editor, six kinds, no-day list, previous/next, and chronology markers `data-plan-chronologie`, `data-plan-premium="4"`, `data-tagesplan-modul="ein"`.
- `components/trips/TripWorkspaceRoute.tsx` — new presentational list and wrapping day chooser.
- `components/trips/TripWorkspace.tsx` — selection glue and focus return to the run button only.
- `components/trips/TripWorkspaceKopf.tsx` — options disclosure only.
- `components/layout/BackToTop.tsx` — clearance using the existing nav offset variable, preserving the current source-tested button contract (`scrollVerhalten`, focus ring, `inert`, `currentTarget.blur`, no `return null`).
- `lib/trips/ux-u1c-route-design-alignment-1/route.ts` and `route.test.ts` — pure row model.
- `lib/trips/ux-u1c-route-design-alignment-1/back-to-top.ts` and `back-to-top.test.ts` — pure clearance decision.
- `lib/trips/ux-u1c-route-design-alignment-1/harness.tsx` and `browser.test.ts` — mounted workspace fixtures.
- `docs/JETNITY_UX_V1_U1C_ROUTE_DESIGN_ALIGNMENT_1_{STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-28.md` at delivery.
- Sanitized evidence under `docs/evidence/ux-v1-u1c-route-design-alignment-1/` except the two immutable reference files.

Not written in this plan commit, and not written before acceptance:

- `lib/trips/n12-chronology-1/**` behavior. The reader stays read-only.
- `lib/trips/workspace-mode.ts`, `lib/trips/detail.ts`, mobility `kanten.ts`, provider/search components, header/nav components, Auth, DB, config, workflows.
- `docs/ACTIVE_WORK_STATUS.md`. It is outside the task allowlist. This plan and status are the continuity record until amendment D is accepted.
- `ReiseAenderungManuell` and `lib/reiseaenderung/**`.

## Required amendments

These are part of plan acceptance. They are not implemented here.

### A — Retarget presentation tests that pin the old route

The required compact route contradicts current tests. Leaving them unchanged makes a faithful implementation fail. Changing them is not permission to weaken chronology, editor, history, or provider assertions.

- `lib/trips/n12-chronology-1/laeufe.test.ts` asserts `data-plan-etappen-uebersicht` and `ersterTagDerEtappe` in `TripWorkspacePlan.tsx`.
- `lib/trips/n12-chronology-1/browser.test.ts` requires all 22 `data-timeline-tag` nodes visible at once and requires the duplicate stage summary text.
- `lib/trips/trip-plan-premium-experience-4.test.ts` pins `data-plan-tag-streifen`, `data-plan-raster`, `w-max shrink-0 snap-start`, `tagStreifenZiel`, and the 4/7-column grid in `TripWorkspacePlan.tsx`.
- `lib/trips/ux-u1b-route-detail-1/browser.test.ts` expects `Zur Route` to focus a visible `data-timeline-tag` inside `data-plan-tag-streifen`.

Replacement assertions:

- The route shows one control per chronological run, in run order, including unassigned and flight/transfer runs.
- All 22 day ids remain reachable: select the run, then activate that day, and previous/next still walks day 1 through day 22.
- The duplicate stage summary is absent.
- The initial route has no `overflow-x-auto` day strip.
- `Zur Route` focuses the selected run button, which must be visible and inside the viewport. The selected day button remains in the detail chooser.
- Same-day transfer plus stay, six item kinds, no-day items, editor draft retention, invalid id hints, and no passive provider request stay covered. Source pins that protect those contracts stay.

### B — Connection selection identity

Decide one of these. The plan recommends B1.

- B1. Extend `lib/trips/workspace-mode.ts` with one optional plan key `kante`. The only accepted value is an id that `mobilitaetsAbdeckung` currently emits with `art === 'connection'` and that still joins two adjacent destination runs. `modusFuerReise` drops any other value, including `outbound:` and `return:`, and drops a connection whose stages are no longer neighbors. The UI then says the section is no longer available and does not select a different visit. `tag` remains the return day. No organizer parameter is added. `Hinweis` in `lib/trips/ux-u1b-route-detail-1/hinweis.ts` is not extended; the missing-connection sentence lives in the U1-C helper.
- B2. If B1 is rejected, connection rows are text, not buttons. Visit rows remain the only selectors. No inert `Verbindung organisieren` control is added.

Organizer handoff is not proposed in either choice.

### C — Options slot

- `components/trips/GastArbeitsbereich.tsx` and `components/trips/KontoArbeitsbereich.tsx`: pass only the existing destructive button through a new `reiseoptionen` prop. Leave error text and account save copy in the visible header slot. Do not change confirm copy, routing, or storage calls.
- `TripWorkspace.tsx` threads that prop. `TripWorkspaceKopf.tsx` renders it.

### D — Continuity pointer, optional

A short current-writer pointer in `docs/ACTIVE_WORK_STATUS.md` is useful and is outside the task allowlist. This plan does not edit that file. Accept D separately if the pointer should land in a later commit on this same branch.

## Row model

`route.ts` reads `chronologischeLaeufe` and `mobilitaetsAbdeckung`. It does not sort the graph and does not write it.

Each run becomes one row:

- id: `lauf.schluessel`
- stage id: `lauf.stageId`
- title: `lauf.name`
- kind: `lauf.lesart`
- country: rule above
- planned days: minimum and maximum valid `dayDate` inside that run, prefixed `Geplante Tage:`, or omitted when a run has no valid dates
- stored stage span: `etappenZeitraumAnzeigen(arrivalDate, departureDate)` only, labelled as the stored stage span
- days: the same day objects, for the detail chooser

A connection row is inserted only between two consecutive rows when all of these hold:

- both are `lesart === 'ziel'`
- their stage ids differ and are non-null
- no run sits between them
- `mobilitaetsAbdeckung` contains `connection:${left}:${right}`

If the edge exists but `date` is null, the row says the travel date is not stored. If `durationMinutes` is null, it says duration is not stored. Status text comes from the existing edge status without adding a new status vocabulary.

## Tests after acceptance

Unit fixtures, not the mock as a data seed:

- assigned Bangkok 16–22 Nov, Ko Chang 23–29 Nov, Phuket 30 Nov–5 Dec, with 15 Nov and 6 Dec unassigned: five run rows, two connection rows, no Hinreise/Rückreise, planned-day labels, no lodging inference
- repeated Bangkok with a different stage id and dates: two Bangkok rows, selection of one does not return the other’s day id
- same stage id interrupted by an unassigned run: two rows, no connection across the gap
- null country and a non-catalog code
- stored stage dates shown beside, not instead of, planned days
- edge with a matched transfer shows that item; edge without a date or duration does not invent them
- outbound and return edges from a Zurich origin are ignored
- back-to-top clearance: fixed nav with a positive offset clears it; missing offset hides; no fixed nav keeps the default

Mounted browser fixtures, same graph across widths 280, 320, 360, 390, 430, 768, and 1440, plus root font 32px as text size rather than browser zoom:

- route to detail to `Zur Route`, highlight, focus, and URL
- wrapping day chooser has no horizontal page overflow
- previous/next, reorder/removal invalidation, reload
- pending editor failure still restores the draft
- six kinds and a no-day item still open
- geometry: back-to-top box does not intersect `[data-shell-nav="bottom"]`; both remain hit-testable
- selecting a run or day records no provider/XHR request

Browser zoom 200%, physical Safari, and VoiceOver stay untested unless a later run actually performs them. Root 32px is recorded as root font size, not zoom.

Also run the focused existing plan, chronology, U1-B, and workspace-mode suites after amendment A, then typecheck, lint, hygiene, and production build. Native exact-head App/Auth CI and Preview identity belong to the pushed implementation head. Preview READY is not browser acceptance. This plan head is not that gate.

## Duration / allocation triage

Not a bug to fix in this slice. No silent-save claim and no #1080 regression claim.

`manuellerEntwurf` in `lib/reiseaenderung/direct/entwurf.ts` measures a stage’s current length as `days.filter(day => day.stageId === stage.id).length`. On a fully unassigned 22-day trip every stage length is 0. Asking for 7+7+8 therefore creates three `etappe_dauer` deltas of +7, +7, and +8. `etappeDauer` inserts that many new assigned days and does not consume days whose `stageId` is null. The projected total starts at 22 and adds 22, which is the observed 44 after an explicit preview/save. The original 22 unassigned days remain.

The manual day-allocation path that assigns existing days to stages is a different operation and still yields 22 days. `ReiseAenderungManuell` must not be changed to make a screenshot match.

Proposed later issue, not opened here: explain before save that stage duration edits only the days already assigned to that stage, and that unassigned calendar days stay. A domain change that would assign or replace those days needs its own task.

## Risks

- Amendment A is large because several browser tests click day chips directly. The replacement must still prove every day is reachable.
- B1 is a public query key. Accepting any value other than a live `connection:` id would let a crafted URL imply outbound or return intent.
- Wrapping day buttons for a long single visit can make the detail tall. That is the accepted alternative to a horizontal strip.
- `--ux-u1a-nav-offset` is owned by the shell nav. This slice only reads it. If it is absent during a fixed-nav frame, the control hides instead of overlapping.
- Guest and account destructive buttons are different components. Amendment C must not unify their confirm copy.
- Showing `Geplante Tage` from assignment could still be misread as hotel nights if the label is shortened. The label stays explicit.
- This slice does not complete UX V1, #1067, #1068, F01, or any provider gate.

## Stop

No runtime file is edited by the plan commit. Cursor does not mark Ready, merge, deploy, or start another slice. Review fixes stay in session `bc-4904589f-a8f0-4106-a65a-507bc53e084a`.
