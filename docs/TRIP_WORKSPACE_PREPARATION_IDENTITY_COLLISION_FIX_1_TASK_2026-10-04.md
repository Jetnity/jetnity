# Trip Workspace Preparation Identity Collision Fix 1 — Task

Date: 4 October 2026
Issue: #828
Status: **BINDING / PRODUCT BUGFIX / DATA-INTEGRITY / NO DB MIGRATION / NO OFFICIAL-TRUTH CHANGE**

## 1. Authority and baseline

Technical Lead selected this slice from the independent read-only Trip Workspace audit, finding B02/P1, then independently reproduced the defect on live current main.

Baseline:
- main: `1396d1251c7fe0c52f2b1d3096dba814da6adbee` (Merge #827)
- mode: `NORMAL`
- #751: no active writer; first GOV.UK Development registration complete / STOP
- Production: current main deployment READY
- Official Truth programme must remain untouched by this slice

Live evidence wins. Re-read main/mode/#751 and relevant new #748 MATERIAL before edits. STOP on material drift or overlapping writer.

## 2. Writer

Logical writer: **Jetnity Trip Workspace preparation identity collision fix 1**, Generation 1.

Execution environment: **Codex Desktop**.

Required model:
**GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

No Cursor. No delegated replacement writer. Do not silently substitute model/effort.

## 3. Reproduced defect

Current production UI in:
`components/trips/Reisevorbereitung.tsx`

creates a new custom preparation point with:

`clientRef: preparation:<lowercased title truncated to 40 chars>`

Therefore distinct titles can collide, for example:

- `Versicherung für den Urlaub rechtzeitig prüfen: Person A`
- `Versicherung für den Urlaub rechtzeitig prüfen: Person B`

A matching existing `clientRef` causes the account write path to update the existing row, including title and user status, instead of creating an independent point.

The guest path in `lib/readiness/gast.ts` additionally searches semantically for an existing item when no explicit `clientRef` is supplied.

Title/content must never be the identity of a custom preparation point.

## 4. Required invariants

After this slice:

1. every explicit **new custom preparation submission** receives a unique stable `clientRef` independent of title text;
2. two different titles with the same first 40 characters create two distinct items;
3. two intentionally separate submissions with the exact same title also remain distinct;
4. an existing custom preparation item is updated only by its exact existing `clientRef`;
5. updating item B never changes item A's title/status and vice versa;
6. creating item B never resets item A from `done` to `open`;
7. account and guest flows have equivalent identity semantics;
8. derived/system readiness identities remain deterministic and unchanged;
9. Guest→Account transfer idempotency semantics remain unchanged;
10. no official Evidence, provider fact or title inference is introduced.

A transport retry of the *same submitted create payload* should remain idempotent when it carries the same generated clientRef. A separate user submission is a separate point.

## 5. Preferred design

Use the existing readiness client-ref generator in `lib/readiness/bauen.ts` rather than creating a second unrelated ID scheme.

It is acceptable and preferred to expose one narrowly named pure helper for generating a new readiness client ref if needed by the client component.

For the explicit new-custom-preparation UI:
- generate the new stable id once for that submission;
- do not derive it from title/country/trip item;
- pass it through the existing action contract.

For updates:
- preserve exact existing `clientRef`.

For guest handling:
- remove/limit semantic fallback behavior where it can cause a custom preparation create to select another existing preparation item;
- do not weaken deterministic behavior for derived/system items;
- if production callers rely on fallback behavior, prove it and make the smallest safe distinction rather than deleting behavior blindly.

Do not add a database-generated identity migration in this slice.

## 6. Allowed material files

Production allowed only as genuinely required:
- `components/trips/Reisevorbereitung.tsx`
- `lib/readiness/bauen.ts`
- `lib/readiness/gast.ts`
- `lib/readiness/schema.ts` only if contract adjustment is genuinely required
- `lib/readiness/aktionen.ts` only if server-side create/update distinction is genuinely required
- `components/trips/TripWorkspace.tsx` only if its callback type must become more precise
- `components/trips/KontoArbeitsbereich.tsx` / `GastArbeitsbereich.tsx` only if required by the exact callback contract

Tests may modify existing relevant test files, preferably:
- `lib/trips/gastspeicher.test.ts`
- existing readiness/workspace integration tests
- add at most one narrowly scoped readiness test file if existing files cannot express the account/client behavior cleanly

Docs:
- this immutable task seed
- `docs/TRIP_WORKSPACE_PREPARATION_IDENTITY_COLLISION_FIX_1_REPORT_2026-10-04.md`
- `docs/TRIP_WORKSPACE_PREPARATION_IDENTITY_COLLISION_FIX_1_HANDOFF_2026-10-04.md`
- `docs/TRIP_WORKSPACE_PREPARATION_IDENTITY_COLLISION_FIX_1_SELF_REVIEW_2026-10-04.md`

If another runtime area is needed, STOP before expanding scope.

## 7. Required adversarial tests

At minimum prove:

### Custom create identity
- two B02 example titles create distinct client refs/items;
- same exact title submitted twice intentionally creates distinct items;
- long titles are never truncated into identity;
- title case/whitespace normalization does not collapse two explicit creates into one identity.

### Existing update
- exact existing `clientRef` updates only that item;
- title/status of sibling custom item remains byte-for-byte unchanged;
- setting A done, then creating/updating B cannot reopen A.

### Retry/idempotency
- repeating the same explicit payload with the same already-generated clientRef behaves as the existing exact-id update/idempotent path, not a second unrelated point;
- a fresh user submission gets a fresh ref.

### Guest/account consistency
- guest create semantics match account intent;
- guest path does not select a prior custom preparation merely because kind/country/trip-item match;
- existing derived/system item status updates remain stable and deterministic;
- Guest→Account transfer tests remain green.

### Bounds/security
- generated client refs satisfy existing `READINESS_GRENZEN.clientRef`;
- no sensitive-data/title validation weakening;
- item count limit remains enforced;
- no new browser authority over official evidence.

## 8. Non-scope

Absolutely no:
- DB migration or table/RPC change;
- RLS/Auth/role changes;
- Official Truth catalog/Evidence/Rule/F8 changes;
- provider/search/research integration;
- U01 attention deduplication;
- B01 Workspace Official-Truth wiring;
- B03 flight/hotel redesign;
- B07 position ordering;
- broad visual redesign;
- Production data mutation;
- new recurring infrastructure/cost.

## 9. Validation

Run on final tree:

- `git diff --check`
- `npm run check:operating-mode`
- focused readiness / guest / workspace tests
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run check:api-schutz`
- `npm run check:schema-bezug`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run build`

Do not fabricate PASS. Report environment-blocked checks exactly.

## 10. Delivery

Before delivery:
- re-read main/mode/#751/#748;
- prove task seed unchanged;
- prove exact changed files and scope;
- merge-base/ahead/behind;
- final head;
- review threads;
- exact model/effort evidence;
- no Supabase/Vercel/Production mutation by writer.

Create REPORT, HANDOFF, SELF_REVIEW.

Keep PR Draft.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD EXACT-HEAD REVIEW.**

Do not Ready.
Do not merge.
Do not start U01/B01 or any follow-up.
