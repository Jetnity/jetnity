# Trip Workspace Manual Flight Route Completion 1 — Correction Report

Date: 5 October 2026 · Issue #836 · Draft PR #837
Writer: Jetnity Trip Workspace manual flight route completion 1 — Generation 1
Status: **P2 CORRECTED / DRAFT / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

## Identity and scope

This is the same writer and slice. TL comment [5989842622](https://github.com/Jetnity/jetnity/pull/837#issuecomment-5989842622) rejected reviewed head `b1102d29ba447b6a17cc4a74cb0ed5f1d81e1c46` because local wall-clock values at different airports were incorrectly compared. All previous exact-head PASS gates are invalid for this delivery.

- Execution: Codex Desktop; no Cursor, subagent or replacement writer.
- Model evidence: session `01a10975-730b-79d2-8bc0-fb664cf20085`, rollout basename `rollout-2026-10-05T02-27-34-01a10975-730b-79d2-8bc0-fb664cf20085.jsonl`; correction-turn `turn_context` at `2026-10-05T07:43:10.108Z` records `model: gpt-6-astra`, `effort: xhigh`. Only sanitized identity fields were extracted.
- Branch: `fix/trip-workspace-manual-flight-route-1`.
- Main / merge-base: `58d2781d4b48cfdc8f9131f374f90d9b96a10787`.
- Immutable task seed: `e5ae8e54040c69d38c37e57d740e973982355446`; unchanged task blob: `5cd20b05aff41754d62d43c70a269eb4b7cd8c4f`.
- Published correction code/tests commit: `55abce49e72f2758709c357f5d1af8ec4aa3f356`; tree: `d3f53ce8b9fdbdfd7eb86a524f65d22e9f7d82d9`, byte-identical to the locally tested tree.
- The following docs-only commit updates REPORT, HANDOFF and SELF_REVIEW. The PR-body delivery receipt records its final head and subsequent CI/Preview results, avoiding a self-referential commit hash here.

Only two runtime files and the existing bounded test file changed for the correction: `lib/trips/schema.ts`, `lib/trips/flug-manuell.ts`, `lib/trips/flug-manuell.test.ts`. Together with the three delivery documents this is six files relative to the rejected head. The cumulative PR still contains exactly 13 files, listed in HANDOFF, including the immutable task seed.

## Corrected local-time contract

The schema no longer compares departure with arrival within a flight or across the whole route. Both may belong to different timezones. Exact user-entered local dates and optional clocks survive unchanged in the canonical itinerary; no timezone, UTC or duration inference was introduced.

Continuity still requires the previous destination to equal the next origin. Only at that exact airport is chronology checked: an earlier next departure date fails; on the same date an earlier next departure clock fails when both clocks exist. Missing optional clocks on the same date remain unknown and are accepted. Real dates, exact HH:MM, 1–4 segments, unequal endpoints, bounded normalized IATA and strict key validation remain unchanged.

`manuelleFlugSummaryProjizieren` is a shared pure helper, called by the existing `manuelleFlugRouteBauen` used by both Account and Guest. It only expresses what the legacy `trip_items` summary can represent:

| Final local arrival relative to first departure | startsOn / startsAt | endsOn | endsAt |
| --- | --- | --- | --- |
| Earlier date | Exact first departure date / optional clock | null | null |
| Later date | Exact first departure date / optional clock | Exact final arrival date | Final arrival clock only if departure clock exists; otherwise null |
| Same date | Exact first departure date / optional clock | Exact final arrival date | Final arrival clock only if both clocks exist and arrival clock >= departure clock; otherwise null |

The itinerary is never rewritten to fit the summary. Summary fields are neither UTC truth nor flight-duration truth. No DB migration is needed or included.

## Account, Guest and route display

The Account action and Guest persistence files are byte-identical to the rejected head; their existing shared builder now applies the safe projection. Account still resolves every IATA through the server airport reader, preserves unrelated metadata and writes only `metadata`, `starts_on`, `starts_at`, `ends_on`, `ends_at`. Validation-before-auth, existing RLS, provider/external-reference/booking-URL guards, metadata compare-and-set, returned-row requirement, sanitized failures and success-only revalidation remain intact.

Guest keeps exact IATA/local values with null countryCode/city/country and no surface evidence. Day and undated targets use the same projection; siblings and every other target field remain unchanged. Existing persistence revision/timestamp behavior remains intact. No booking, commercial, stage/day assignment, provider flight, route trust model, Official Truth, U02/U03/B01 or follow-up changes.

RouteFacts tests assert exact equality with the itinerary's segments for Account and Guest even when summary ends are null. The existing unmodified FlugRoute renders exact Date-Line and earlier-clock local strings in segment details; editor prefill also reads the complete itinerary.

## Required regression proofs

The manual-flight file now has 51 tests. Fifteen added P2 tests include an 11-case table exercised through schema, pure projection, actual Account action/airport-reader with mocked transport, both Guest target locations, persisted graph parsing and RouteFacts. Existing guard/race/error tests still run.

- Date Line: `2026-01-02 23:30 -> 2026-01-01 12:00` passes; exact itinerary retained; startsOn `2026-01-02`, startsAt `23:30`, endsOn/endsAt null.
- Earlier same-date clock: `2026-01-02 18:00 -> 2026-01-02 09:00` passes; itinerary retains both clocks; endsOn `2026-01-02`, endsAt null.
- Arrival `09:00` without departure clock passes on same and later dates; summary endsAt is null while itinerary arrivalTime remains `09:00`.
- Normal direct/connecting routes, equal clocks, absent arrival clock and a later arrival date with an earlier clock retain every representable summary field.
- Whole-route Date-Line and earlier-clock envelopes pass even across multiple segments; no envelope comparison remains.
- DOH arrival `18:00` -> DOH departure `17:00` on the same day fails; arrival on the 3rd -> departure on the 2nd fails even with both clocks missing. Account fails before auth/read/write; Guest writes nothing.
- Missing either/both same-day connection clocks passes; equal clocks and a later connection date pass; airport discontinuity still fails.
- Actual Account UPDATE payloads and Guest summaries satisfy assertions of the existing SQL predicates `trip_items_ende_braucht_anfang`, `trip_items_endzeit_braucht_anfangszeit`, `trip_items_reihenfolge` from `20260817120000_reiseschema.sql`. This is a constraint-contract test, not a claim of hosted SQL execution.

## Validation rerun after correction

Node 22.23.3; unchanged dependencies/lockfile. All required checks were rerun on corrected runtime/tests.

| Check | Result |
| --- | --- |
| git diff --check | PASS |
| check:operating-mode | PASS, NORMAL |
| Manual-flight file | 51 tests PASS |
| Focused lib/route + lib/trips, including guest/workspace | 952 tests / 169 suites PASS |
| npm test | **5,261 PASS / 4 FAIL / 5,265 total / 0 skipped locally** |
| typecheck | PASS |
| lint | PASS, 0 errors / 149 existing warnings |
| check:api-schutz | PASS |
| check:schema-bezug | PASS |
| check:dead | PASS, 0 orphan modules |
| check:exports | PASS, 0 uncalled exports |
| check:deps | PASS |
| Production build | PASS |

The four full-suite failures are unchanged disposable PostgreSQL tests in `lib/readiness/official-truth-catalog-hardening-schema.test.ts`, `official-truth-content-identity-schema-v2.test.ts`, `official-truth-source-catalog-server.test.ts` and `official-truth-store-server.test.ts`. Each requires the Linux path `/usr/lib/postgresql/16/bin/initdb`, absent on this Mac, and fails with ENOENT. These files are unchanged, and no test was skipped or weakened. Local full-suite status is not green. The final-head Linux CI result is separately recorded in the PR receipt after this docs commit; old-head CI cannot substitute for it.

Build used a loopback Supabase URL and a dummy public key, with no hosted credentials. Existing missing-local-env/Browserslist notices are not hosted access. Next-generated AGENTS.md and next-env.d.ts edits were removed after stopping development; neither is part of delivery.

## New browser proof

The actual local Next app and Guest workspace were tested in a fresh isolated Chrome session launched by agent-browser, with Playwright attached. Seven assertions passed: Date-Line save/reload/reopen; same-date earlier-clock save/reload/reopen; arrival clock without departure clock; unchanged siblings/non-route target fields; same-airport reversed connection rejection without write; missing optional connection clock acceptance; exact Date-Line segment detail display, no 390px horizontal overflow, no browser exceptions/framework overlay. The 390px screenshot was visually inspected.

The Date-Line browser route uses NRT -> HNL -> LAX and displays `2026-01-02 23:30 -> 2026-01-01 12:00`, followed by the exact next segment's local values, while summary endsOn/endsAt are null. This verifies retention/display, not the real-world validity or duration of a flight schedule. The existing broader keyboard and 280–1280px browser evidence remains historical; it was not represented as a fresh correction-head test.

Local evidence: `correction-browser-report.json`, `correction-date-line.png`, and `correction-*.log` are copied to the delivery outputs outside the repository. No browser harness/test-only route entered runtime. Local browser and development server were stopped.

## Live gates and limits

Pre-publication reads reconfirm main, NORMAL mode, #751's same-writer correction and #839's file-disjoint coordinated hold at `3ebf3e4bde5d595722c361c07f62e41dee29ed40`. #748 latest material `5988971332` and TL triage `5989855107` were read; no newer comments appeared. The separate Development hardening decision is resolved and does not expand this slice.

TL's read-only Development/Production RLS verification is attributed to TL: authenticated UPDATE policy with USING and WITH CHECK `user_id = auth.uid()`. This writer did not connect to hosted DB, apply migrations or change policies. Account proof uses real application code with mocked transport; browser proof is local Guest, not hosted Account/RLS or physical-device acceptance. No new recurring costs.

GitHub Git-data API publishes byte-identical verified trees with non-forced fast-forward updates, since this local shell has no stored GitHub push credentials. The final receipt must identify the final head, completed fresh CI, exact-SHA Preview, task hash, changed-file set and branch graph. These checks do not grant independent approval.

**STOP FOR INDEPENDENT CHATGPT / TECHNICAL-LEAD RE-REVIEW. Keep #837 Draft. No Ready, merge, Production action or follow-up.**
