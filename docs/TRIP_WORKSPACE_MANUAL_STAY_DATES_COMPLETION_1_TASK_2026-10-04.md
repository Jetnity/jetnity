# Trip Workspace Manual Stay Dates Completion 1 — Task

Date: 4 October 2026
Issue: #832
Status: **BINDING / B03a / MANUAL STAY DATE COMPLETION / NO DB MIGRATION / NO PROVIDER FACT REWRITE**

## 1. Authority and live baseline

Selected by Technical Lead from the independent Trip Workspace audit B03/P2 after B02 and U01 were resolved.

Baseline:
- main: `85a53346a87b6175f9e0ffad9901ff6bd45a2654` (Merge #831)
- mode: `NORMAL`
- #751: no active implementation writer; #831 merged/post-merge verified
- latest processed #748 MATERIAL marker: `5984004655`
- TL receipt `5984167839`: PARTIAL; Official Truth residuals remain OPEN and are unrelated to this bounded Workspace slice

Live evidence wins. Re-read main/mode/#751/#748 and current issue/PR before material edits. STOP on material drift or overlapping writer.

## 2. Writer

Logical writer: **Jetnity Trip Workspace manual stay dates completion 1**, Generation 1.

Execution: **Codex Desktop**.

Required model:
**GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

No Cursor. No delegated writer. Do not silently substitute model or reasoning effort.

## 3. Reproduced product gap

Canonical TripItem already contains:
- `startsOn`
- `endsOn`

Database `trip_items` already contains:
- `starts_on`
- `ends_on`

`unterkunftAbdeckung` correctly requires a valid half-open stay interval `[check-in, check-out)`; missing/invalid dates produce `status='unknown'`.

The generic manual plan-point creation path can create `kind='stay'` without these date fields, but `UnterkunftBestand` currently offers only booking-status correction. Therefore a user can see an unknown accommodation interval but cannot complete it from the visible flow.

This slice closes only that bounded gap.

## 4. Manual-only trust boundary

The editable path is for **manual/user-owned stay items only**.

A stay is NOT editable by this path if it carries provider/commercial identity, including any provider/external-ref/booking URL evidence that marks it as provider-derived.

Do not silently rewrite provider-backed stay dates as user-entered data.

Use one shared pure predicate/helper if needed so UI and server/guest mutation logic do not drift.

The exact predicate should be conservative and documented. Prefer:
- `kind === 'stay'`
- provider is absent
- external ref is absent
- booking URL is absent

Booking status/source may be user-managed and must not by itself make a manual stay ineligible.

## 5. Required user behavior

In `UnterkunftBestand`:

For a manual editable stay:
- show current Check-in / Check-out when present;
- if one/both are missing or invalid, clearly say the period is incomplete;
- provide an explicit action such as `Zeitraum ergänzen`;
- if valid dates already exist, allow `Zeitraum ändern`;
- use native date inputs or an equivalent existing Jetnity date-control;
- prefill existing dates;
- save only after explicit user action;
- show bounded inline validation/error feedback;
- no auto-save while typing;
- no modal required unless existing patterns make it materially safer.

For a provider-backed stay:
- display existing dates/status normally;
- do **not** show the manual date-edit affordance in this slice.

After successful save:
- account path refreshes the canonical server graph;
- guest path uses the returned persisted guest graph;
- `unterkunftAbdeckung` must immediately recompute from the updated graph;
- no fake "fully covered" text if dates still do not cover required nights.

## 6. Date contract

Input contract must require:
- valid ISO calendar date `YYYY-MM-DD`;
- both check-in and check-out together;
- `checkOut > checkIn`.

Do not invent dates from:
- title;
- note;
- trip start/end;
- day date;
- stage dates;
- provider metadata not already represented in the item.

This slice may prefill the form with existing stored dates, but must not infer missing values.

No timezone or check-in/check-out clock time is introduced here.

No stage/day reassignment in this slice.

## 7. Account write path

Add one narrowly named server action / helper, e.g. `unterkunftZeitraumSetzen`.

Requirements:
- untrusted input validated server-side;
- require `tripId`, `itemId`, `startsOn`, `endsOn`;
- authenticate using the existing `konto()` path;
- no service role;
- pre-read exact item by `id` + `trip_id`;
- fail if not found;
- fail unless `kind='stay'`;
- fail unless it satisfies the manual-only predicate;
- update **only** `starts_on` and `ends_on`;
- do not update title/note/provider/external_ref/booking_url/price/booking status/day/stage/position;
- RLS remains the ownership authority;
- revalidate the trip route only after successful write;
- sanitize database errors through existing mechanisms.

No migration/RPC needed.

## 8. Guest write path

Add one narrowly named guest helper, e.g. `gastUnterkunftZeitraumSetzen`.

Requirements:
- same input/date validation semantics as account path;
- find exact item ID in days or `ohneTag`;
- fail if missing;
- fail unless editable manual stay;
- replace only the two date fields in that item;
- preserve all sibling items and every other field byte-for-byte/structurally unchanged;
- increment/re-save through existing `gastreiseSpeichern` path;
- schema validation remains active.

Account and guest behavior must have matching error semantics where practical.

## 9. UI wiring

Add a bounded callback from:
- `KontoArbeitsbereich`
- `GastArbeitsbereich`
through:
- `TripWorkspace`
to:
- `UnterkunftBestand`

Preferred prop shape:
`onUnterkunftZeitraum?: (itemId, startsOn, endsOn) => Promise<string | null>`

Do not expose a generic arbitrary-item update callback.

Do not route provider-backed stays through this callback.

The same callback may be reused wherever the existing `UnterkunftBestand` is rendered inside the Workspace/search surface, but avoid duplicate form state fighting over one item.

## 10. Required tests

### Pure/manual eligibility
- manual stay with no provider/externalRef/bookingUrl => editable;
- provider set => not editable;
- externalRef set => not editable;
- bookingUrl set => not editable;
- non-stay => not editable;
- user booking status does not disable manual edit.

### Validation
- valid interval passes;
- equal dates fail;
- checkout before checkin fails;
- malformed/invalid calendar dates fail;
- missing one side fails.

### Account server action
- pre-read by exact trip+item;
- foreign/not-found => no update;
- non-stay => no update;
- provider-backed => no update;
- valid manual stay => exactly one update of only `starts_on`, `ends_on`;
- no commercial/provider/booking fields included in update payload;
- DB error sanitized;
- no revalidate on failure;
- revalidate on success.

### Guest
- manual stay exact item updated;
- sibling items unchanged;
- all non-date fields of target unchanged;
- provider-backed stay rejected;
- invalid dates rejected;
- both day item and `ohneTag` item covered;
- persisted graph re-parses cleanly.

### Coverage
- stay missing dates remains unknown before edit;
- after valid edit, `unterkunftAbdeckung` uses exactly the new interval;
- partial interval coverage remains partial;
- full interval coverage becomes full only when nights truly match;
- booking status does not fabricate coverage beyond dates.

### UI
- incomplete manual stay shows `Zeitraum ergänzen`;
- complete manual stay shows `Zeitraum ändern`;
- provider-backed stay has no edit affordance;
- current dates prefilled;
- validation prevents invalid submit;
- submit callback receives exact itemId/checkIn/checkOut;
- success closes/resets edit state as appropriate and does not alter booking action availability;
- keyboard labels/date inputs/buttons are accessible;
- mobile layout has no horizontal overflow.

## 11. Allowed material files

Production, only if genuinely required:
- `components/trips/UnterkunftBestand.tsx`
- `components/trips/TripWorkspace.tsx`
- `components/trips/KontoArbeitsbereich.tsx`
- `components/trips/GastArbeitsbereich.tsx`
- `lib/trips/aktionen.ts`
- `lib/trips/gastspeicher.ts`
- `lib/trips/schema.ts`
- optional one new bounded helper such as `lib/trips/unterkunft-manuell.ts`

Tests:
- existing `lib/trips/aktionen.test.ts` if present/appropriate
- `lib/trips/gastspeicher.test.ts`
- `lib/trips/naechte-abdeckung.test.ts`
- existing Workspace/premium component tests
- at most one new narrowly scoped stay/manual-edit test file if needed

Docs:
- this immutable TASK
- `docs/TRIP_WORKSPACE_MANUAL_STAY_DATES_COMPLETION_1_REPORT_2026-10-04.md`
- `docs/TRIP_WORKSPACE_MANUAL_STAY_DATES_COMPLETION_1_HANDOFF_2026-10-04.md`
- `docs/TRIP_WORKSPACE_MANUAL_STAY_DATES_COMPLETION_1_SELF_REVIEW_2026-10-04.md`

If another runtime surface is genuinely required, STOP before expanding scope.

## 12. Explicit non-scope

Absolutely no:
- flight route completion;
- stage reassignment;
- day reassignment;
- title/note editing;
- provider result mutation;
- price/provider/externalRef/bookingUrl edits;
- booking-status redesign;
- B01 Official Truth wiring;
- U02/U03 navigation;
- B05/B06/B07;
- DB migration/schema/RLS/Auth;
- Production data mutation;
- provider/search calls;
- new route/API;
- broad Workspace redesign;
- follow-up slice.

## 13. Validation

Run final tree:
- `git diff --check`
- `npm run check:operating-mode`
- focused stay/account/guest/coverage/Workspace tests
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run check:api-schutz`
- `npm run check:schema-bezug`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run build`

Do not fabricate PASS. Report environment limitations honestly.

## 14. Delivery

Before delivery:
- re-read live main/mode/#751/#748;
- task seed unchanged;
- exact changed files;
- merge-base/ahead/behind;
- final head;
- review threads;
- exact model/effort evidence;
- no hosted DB/Vercel/Production mutation by writer.

Create REPORT, HANDOFF, SELF_REVIEW.

Keep PR Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready.
Do not merge.
Do not start flight B03b, U02/U03, B01 or any follow-up.
