# Trip Workspace Attention Flood Grouping 1 — Task

Date: 4 October 2026
Issue: #830
Status: **BINDING / UX PRESENTATION GROUPING / NO TRUTH SEMANTIC CHANGE / NO OFFICIAL-TRUTH CHANGE**

## 1. Authority and baseline

Technical Lead selected this slice from independent Trip Workspace audit U01/P1 and independently reproduced the current rendering behavior on live main.

Baseline:
- main: `48261fc11505f013979f8320fbdf7dc33afc18e8` (Merge #829)
- mode: `NORMAL`
- #751: no active implementation writer; #829 merged/post-merge verified
- latest processed #748 MATERIAL marker: `5984004655`
- receipt `5984167839`: PARTIAL; Official Truth residuals remain OPEN, but do not block this presentation-only U01 slice

Live evidence wins. Re-read main/mode/#751 and any newer relevant #748 MATERIAL before material edits. STOP on material drift or overlapping writer.

## 2. Writer

Logical writer: **Jetnity Trip Workspace attention flood grouping 1**, Generation 1.

Execution environment: **Codex Desktop**.

Required model:
**GPT-6 Astra — Sehr hoch** (`gpt-6-astra`, `xhigh`).

No Cursor. No delegated replacement writer. Do not silently substitute model/effort.

## 3. Reproduced problem

Canonical Attention intentionally expands Official requirements by:
- traveller
- credential option
- destination
- requirement type
- transit context

Those exact points must remain intact for truth/correctness.

The current component:
`components/trips/TripWorkspaceJetztWichtig.tsx`

renders `attention.punkte` / `attention.sichtbar` directly. Therefore many semantically distinct but visibly identical low-priority availability/unchecked points become dozens of identical rows.

Independent audit observed:
- single-destination trip: 72 total hints, including 64 identical unavailable rows;
- multi-destination trip: 157 total hints.

This is a presentation problem, not permission to collapse the canonical truth model.

## 4. Binding invariants

After this slice:

1. `attention.punkte` remains the complete canonical point set. No canonical point is deleted/deduplicated from the domain result.
2. Existing point IDs, signal, severity, state, action and sort semantics remain unchanged.
3. Existing visible-limit semantics may be adapted only at the **presentation-group** level; canonical points remain independently testable.
4. Equivalent repeated presentation items are grouped deterministically.
5. A group represents only points whose user-visible semantics are genuinely equivalent.
6. Never group points if severity, state, title or action target differs.
7. Blockers/concrete actionable gaps must not be hidden behind a large generic unavailable group.
8. Group count must equal exact number of underlying canonical points.
9. Expanded/details view must make it explicit that multiple individual checks are represented; no claim that they are one legal rule.
10. No parsing of opaque IDs/client refs to manufacture human-readable facts.
11. No inferred traveller/country/legal labels from ID strings.
12. Existing Attention truth tests remain green.
13. No mutation/write side effect.
14. Mobile/desktop list remains accessible and no horizontal overflow is introduced.

## 5. Preferred design

Implement a pure presentation projection for Attention groups.

Preferred:
- a narrowly named helper in `lib/trips/attention.ts` or a new bounded presentation helper under `lib/trips/` if that keeps responsibilities clearer;
- input = ordered canonical `AttentionPunkt[]`;
- output = ordered presentation groups;
- each group retains a representative point plus exact underlying member list/count;
- group key must be based on explicit public fields only, such as exact combination of:
  - `signal`
  - `schwere`
  - `lage`
  - `titel`
  - `ebene`
  - exact normalized action target / null
- do not use `id` text parsing to group.

Do not group distinct concrete item/date mismatch titles merely because signal matches.

A group with count 1 may render like today's row.

For count >1:
- render one top-level row/card;
- visibly state e.g. `64 Einzelprüfungen betroffen` or equivalent concise German copy;
- provide an accessible disclosure/details affordance if needed;
- expanded content may show the exact number of underlying checks, but must not dump dozens of identical full-title rows by default;
- action must be safe only when every member has the exact same action target; otherwise the group must not be formed.

If richer human context is not already present in the canonical point, show count/technical grouping context only. Do not invent traveller/country labels from IDs.

## 6. Priority behavior

The page must still prioritize:
1. blockierend
2. bald
3. concrete/known gaps and warnings
4. stale/recheck-needed
5. general unavailable/unchecked/unknown informational groups

Do not let a 64-member unavailable group outrank a concrete flight/accommodation gap only because it contains more members.

Preserve canonical sort order by assigning each presentation group the position of its earliest member.

## 7. Visible-limit behavior

Current canonical visible limit is 3 points.

For this slice:
- top-level UI limit should apply to presentation groups, not raw member count;
- "weitere Hinweise" count/copy should refer to **additional groups** or use wording that is unambiguous;
- total underlying member count may be shown separately where useful;
- expanding "weitere" must not create a 4,000+ px wall of identical rows.

Do not change the meaning of `attention.punkte` just to simplify the button.

## 8. Required tests

At minimum:

### Canonical preservation
- a fixture with 64 equivalent official unavailable points still has 64 canonical `attention.punkte`;
- presentation projection produces one group with count 64;
- member IDs are all retained in the group;
- input array is not mutated.

### Non-equivalent safety
- same signal but different severity => separate groups;
- same signal/severity but different state => separate;
- different title => separate;
- different action target => separate;
- null action vs action => separate;
- item date mismatch rows with different titles remain separate;
- concrete coverage gap does not merge with generic Official unavailable.

### Ordering
- group order follows earliest canonical member;
- blocker remains before general informational group;
- group size does not influence priority.

### Visible UI
- audited-style 64 repeated unavailable points render one top-level grouped entry, not 64 identical rows;
- collapsed default remains compact;
- expanding "weitere" adds groups, not raw duplicate flood;
- count text is exact;
- action fires exactly once with the representative/shared action;
- group disclosure is keyboard accessible and has correct aria-expanded/label behavior if disclosure is added;
- no raw opaque member ID is visible to the user.

### Regression
- existing attention tests remain green;
- protected item-date Attention behavior remains unchanged;
- component premium/UX tests remain green.

## 9. Allowed files

Production, only as genuinely required:
- `lib/trips/attention.ts`
- optional new `lib/trips/attention-presentation.ts`
- `components/trips/TripWorkspaceJetztWichtig.tsx`

Tests:
- `lib/trips/attention.test.ts`
- existing relevant Trip Workspace component/premium tests
- at most one narrowly scoped new presentation test file if needed

Docs:
- this immutable TASK
- `docs/TRIP_WORKSPACE_ATTENTION_FLOOD_GROUPING_1_REPORT_2026-10-04.md`
- `docs/TRIP_WORKSPACE_ATTENTION_FLOOD_GROUPING_1_HANDOFF_2026-10-04.md`
- `docs/TRIP_WORKSPACE_ATTENTION_FLOOD_GROUPING_1_SELF_REVIEW_2026-10-04.md`

If another runtime file is genuinely necessary, STOP before expanding scope.

## 10. Explicit non-scope

Absolutely no:
- change to Official Truth catalog/Evidence/Rule/F8;
- provider/research integration;
- B01 Workspace Official-Truth wiring;
- U03 deep-link/navigation changes;
- U06 raw accessible status cleanup;
- B02 (already resolved) changes;
- B03/B05/B06/B07 changes;
- DB migration/RLS/Auth;
- Production data mutation;
- new API/route;
- broad Workspace visual redesign;
- follow-up slice.

## 11. Validation

Run final tree:

- `git diff --check`
- `npm run check:operating-mode`
- focused Attention / Trip Workspace tests
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run check:api-schutz`
- `npm run check:schema-bezug`
- `npm run check:dead`
- `npm run check:exports`
- `npm run check:deps`
- `npm run build`

No fabricated PASS. Report environment limitations honestly.

## 12. Delivery

Before delivery:
- re-read main/mode/#751/#748;
- prove immutable task unchanged;
- exact changed files;
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
Do not start U03/U06/B01 or any follow-up.
