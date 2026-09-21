# V1 Protected Item Date Attention 1 — Binding Dispatch Task

Date: 21 September 2026
Issue: #519
Branch: `fix/v1-protected-item-date-attention-1`
Verified baseline: `main@1103407ba2a9e5fa76f4a8e588ab210934b955e3`
Agent: **Jetnity V1 protected item date attention 1**
Generation: **1**
Required model: **Cursor Grok 4.6 High Fast**, no Auto/substitution.

## 1. Phase, selection and authority

This is the Technical Lead's selected implementation of accepted **TA-R2** in `docs/V1_TRIP_ACCOUNT_REVALIDATION_1_NEXT_SLICES_2026-09-21.md` (#509). Read its report/residual TA-N1, canonical START_HERE, AGENTS, operating mode and TL/Cursor standard.

#517 (TA-R1 adoption), #516 (workspace usability), #518 (first read-only Admin) are completed and merged. Final shared main CI35638485863/Auth106461719537/TLB106461719905 and Production dpl_J4adX7ZS9m1GMCRkM6NH9y57aaTu were verified green. Their writers are STOP. This is a new narrow functional trip task, not an immediate review fix and not a restart of any closed audit/specification session.

No special PO gate is crossed by deriving this non-mutating signal. Ordinary technical decisions within this task do not need renewed PO approval. Only TL may Ready/merge after independent review and exact-head gates.

## 2. Concrete useful outcome

After a trip date shift, a commercially protected item can correctly retain its original `startsOn` while the owning day's `dayDate` moves. The traveller must see that mismatch in the existing Jetzt-wichtig attention surface. The date is **not** automatically corrected.

Live source reconstruction:
- `lib/reiseaenderung/anwenden.ts::zeitraumVerschieben` moves trip/stage/day dates but skips item dates for `istKommerziell`.
- `lib/reiseaenderung/geschuetzt.ts::istKommerziell` is the canonical pure predicate, already exported.
- `lib/reiseaenderung/anwenden.test.ts` already proves dayDate2026-09-19 vs protected startsOn2026-09-12 after +7 days.
- `lib/trips/attention.ts::attentionAbleiten` currently lacks this item-date signal.
- `components/trips/TripWorkspaceJetztWichtig.tsx` already renders attention points, including non-action text; reuse it.

## 3. Behavior and truth contract

1. For a protected item assigned to an existing owning day, emit one deterministic **item-level** date-mismatch point only when both startsOn and dayDate are present, valid calendar dates and differ.
2. Use canonical `istKommerziell` unchanged. Protection through provider, booking link, external reference, a price including zero, or booked status must not diverge from that predicate. Commercial protection does not itself prove an actual booking.
3. Use a named stable signal such as `item.date_mismatch`, `ebene: item`, `lage: stale`, stable per-item id and an appropriate existing severity. Integrate deterministically with the current ordering/visible-limit mechanism; do not displace higher-priority safety-critical attention. Active mismatch suppresses a misleading all-clear empty state.
4. German title/copy identifies the affected item and makes the differing item date vs plan day understandable. Do not claim the provider changed/cancelled a booking or that the item is expired. Do not show internal ids/field names as product copy. Use human-readable dates; no invented date, price or recommendation.
5. Missing/invalid dates, no owning day and unassigned items do not establish this particular mismatch. Do not assign dates/ownership or turn insufficient information into a healthy/provider claim.
6. Non-commercial items do not get this protected-item signal. Same-date protected items do not get it. Multiple mismatched items remain distinct and ordered stably.
7. This is a pure projection. No input mutation, storage write, provenance change, rebooking, synchronization or commercial-field/date rewrite. Existing account and guest trip behavior remains.
8. Reuse the existing attention display. `aktion: null` is sufficient for this bounded warning; do not invent an action or extend the navigation/shared AttentionAktion contract merely for this slice. No extra dashboard/editor.

## 4. Exclusive ownership and non-scope

Write only:
- `lib/trips/attention.ts`
- `lib/trips/attention.test.ts`
- optional additional focused `lib/trips/protected-item-date-attention.test.ts` if the meaningful shift-to-attention integration cases warrant it
- own `docs/V1_PROTECTED_ITEM_DATE_ATTENTION_1_{TASK,STATUS,HANDOFF,SELF_REVIEW}_2026-09-21.md`
- own `docs/evidence/v1-protected-item-date-attention-1/` (synthetic fixtures/render harness/evidence only; no product route).

Read/reuse, do not edit: protection predicate and apply engine, schema/types, detail/navigation and existing workspace components. Existing generic attention rendering should be sufficient. If an actual implementation dependency requires a component/shared-contract edit, report the concrete dependency to TL before expanding; do not silently widen ownership.

No UX redesign, VUX vocabulary/essentials work, guest-storage repair, Admin changes, Foundation-E fallback repair, TW-8/S5-B, second lifecycle, Auth/RLS/DB migration/apply, provider/model/paid call, secrets, real accounts, legal/retention, package/lockfile, workflows or global continuity rewrite. No sibling merge or new agent from this writer.

## 5. Executable acceptance and evidence

- Integration fixture: actual existing trip-shift operation (+days and startDate change) retains protected startsOn and ownership; derive attention from the resulting graph and assert mismatch. Existing commercial preservation assertions stay green.
- Protected same-date, non-commercial moved date, mixed multiple items and stable ordering/deduplication.
- Missing startsOn, missing dayDate, invalid calendar values and unassigned items: no fabricated mismatch. Leap-day/calendar handling is explicit, not Date.parse normalization.
- Input graph unchanged by attention derivation (deep-equality or frozen fixture); no write/provenance mutation.
- Canonical protection variants, including zero price and booked-only, covered without redefining protection.
- Existing safety/seasonal/readiness/official fail-closed behavior, critical priority and visible/weitere limit preserved. No empty all-clear with an active mismatch.
- Existing generic Jetzt-wichtig surface renders useful copy in a synthetic fixture at phone390 and desktop1024; assert this is the actual component with actual compiled project styles if using screenshots. No new general audit or real-device claim. Bind captures to the tested source commit/tree, not an undisclosed dirty parent. Exercise enough/multiple points to show further-list handling if applicable.
- Run focused attention/detail/apply/protection regressions and required repository typecheck/lint/tests/build/hygiene. Do not treat authored source comments or screenshots alone as executable behavioral proof.
- No live provider, model, account or DB probe. Clearly label synthetic evidence and omitted systems.

## 6. Handoff and freeze

Persist own status/handoff/adversarial self-review with changed behavior, limitations, source/evidence distinctions and actual session/model. Re-read origin/main before handoff and report drift; integration happens only at TL's chosen boundary. Freeze once after code/evidence are ready. Post exact final head, CI/Auth/Preview/inline and Vercel-thread evidence plus session/model and STOP in a PR comment; avoid avoidable evidence-only pushes after final freeze.

**STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW. Do not mark Ready. Do not merge. Do not start a follow-up slice.**
