# V1 Guest Draft Adoption Honesty 1 — Binding Task

Date: 21 September 2026
Issue: #514
Branch: `fix/v1-guest-draft-adoption-honesty-1`
Baseline: `main@19a91a2594127eb2b6104b68da69786194e13865`
Agent: **Jetnity V1 guest draft adoption honesty 1**
Generation: **1**
Model: **Cursor Grok 4.6 High Fast**, no Auto/substitution.

## 1. Selected outcome

Implement only TA-R1 from accepted revalidation #509, narrowed to the active v3 guest key. A present but invalid active draft must not become the silent `art: nichts` case on account adoption. A browser storage failure must not be mislabelled corruption or no draft. This is implementation, not another audit, not a new guest model and not an account deletion/recovery product.

Read START_HERE, AGENTS, TL/Cursor standard, current mode and #509 REPORT/NEXT_SLICES. #509, #510, #506 and #512 are merged; their original point-in-time statuses are not live authority. This task is a new writer, not a restart of the revalidation session.

## 2. Independently traced seams and bounded policy

`gastspeicher.ts` is the only localStorage owner. `rohLesen` currently collapses parse/access failure to null; `gastspeicherLaden` can invoke legacy migration before filtering the active key. `gastreisenUebernehmen` returns `nichts` for an empty filtered list; `GastreiseBruecke` hides that as `ruht`.

Add a minimal **read-only active-key preflight**, in gastspeicher.ts, before the adoption flow calls any legacy-normalizing loader. Reuse the existing `reiseLesen` schema; do not modify schema or invent recovery data.

Chosen policy:
- key genuinely absent: keep existing valid queue/legacy adoption behavior; truly empty storage remains silent;
- active key present, parseable and schema-valid: existing adoption behavior unchanged;
- active key present but malformed JSON / invalid schema / empty string / invalid primitive: return a distinct invalid-draft outcome and **stop this adoption attempt before loader/migration/server calls**; keep all original raw keys unchanged, even if a valid legacy or queued draft also exists;
- browser localStorage getter/getItem unavailable or throws: explicit storage-unavailable outcome, not invalid and not empty. No server call, no write/delete, no claim that data was lost or is safely recoverable;
- SSR/no-window behavior must remain safe and must not cause a misleading rendered browser error before the client attempts adoption.

A conservative whole-attempt stop on an invalid active key is intentional: avoid a loader overwriting the invalid bytes with a legacy draft. Do not silently repair, reset, normalize or discard that key. Do not add a delete/reset button, browser-data export, logging of raw values, new persistent backup or account/server operation. Invalid legacy/queue handling outside this active-key case is not a new cleanup project; preserve existing behavior and report any additional finding separately.

Use a small additive discriminated result/outcome, fully handled by the bridge and tests. Reuse existing meanings of `nichts`, `laeuft`, `fertig`, `fehler`; do not fabricate a successful/failed trip count when parsing did not establish one. Keep raw values out of error text, analytics and logs.

## 3. UI and user truth

The bridge must visibly distinguish invalid active draft from no draft and from unavailable browser storage. Use short German copy explaining that the draft could not be adopted and was not changed by this attempt. Do not promise that malformed data is a recoverable valid trip. For storage-unavailable, say reading could not be checked; never reuse the existing unconditional 'ist nicht verloren' claim for that new state.

Keep accessible alert/status semantics and readable existing styles. A retry may re-read after the user/browser state changes, but must not mutate raw storage or spin in an automatic retry loop. Preserve valid adoption success, partial-server-failure feedback and router refresh behavior. This task does not redesign the guest workspace header.

## 4. Exclusive file ownership

Only:
- `lib/trips/gastspeicher.ts` (small preflight + safe read boundary)
- `lib/trips/uebernahme.ts` (preflight outcome orchestration)
- `components/trips/GastreiseBruecke.tsx` (new outcome presentation)
- `lib/trips/gastspeicher.test.ts`
- `lib/trips/uebernahme.test.ts`
- optional `components/trips/GastreiseBruecke.test.tsx` using existing test patterns, no added framework/package
- own TASK/STATUS/HANDOFF/SELF_REVIEW files with prefix `V1_GUEST_DRAFT_ADOPTION_HONESTY_1_`
- synthetic evidence under `docs/evidence/v1-guest-draft-adoption-honesty-1/`

#513 / PR #516 owns GastArbeitsbereich and TripWorkspace presentation; do not edit them. #515 owns Admin analyst; do not edit it. No sibling merge, global continuity, package/lockfile, trip schema/types, Auth/RLS, server action, database, provider/model, legal, retention or external service change. No new identity or permission. Unexpected shared-contract dependency returns to TL before expansion.

## 5. Required executable tests

1. Truly absent active/queue/legacy => existing silent `nichts`, zero server calls.
2. Valid active => happy-path adoption unchanged; client_ref retry/idempotence, first-error stop and delete-only-after-confirmed-adoption preserved.
3. Malformed JSON, schema-invalid object, empty string and primitive/null active values => distinct invalid outcome; no adoption; byte-for-byte raw active key retained.
4. Invalid active + valid legacy/queue => no normalizing write/delete or server call during the adoption attempt; all keys unchanged.
5. Throwing localStorage property getter or getItem => storage-unavailable; not empty/invalid; zero writes/deletes/server calls.
6. Missing active + existing valid legacy/queue => existing migration/adoption tests remain green.
7. Retry after storage/draft correction uses fresh observation and behaves correctly; no stale cached invalid result.
8. Existing parallel-run lock and failure release remain correct. No count/success/retention assertion invented for unknown input.
9. UI outcomes and accessible feedback are tested through an executable render/pure mapping contract using existing tooling; no source comment as acceptance.

Run focused tests plus required repo typecheck/lint/tests/build and hygiene. Synthetic browser/mocked-server evidence is allowed; no real signup/login, remote DB, Supabase Management, user data, secrets, provider/model calls or live adoption against a real account. Label mocked evidence honestly; source/unit proof is not authenticated E2E.

## 6. Completion boundary

Persist implementation, tests, limitations, current main, exact branch/head, agent/generation/model/session and safe continuation. Freeze once after substantive completion; exact-head CI/Auth/Vercel/thread IDs in a PR comment only. Report main drift; integrate at TL's selected boundary, not repeatedly. Self-review is not TL PASS.

**STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW.** No Ready, merge or follow-up by Cursor. No special Product-Owner gate is crossed by this bounded non-destructive read/orchestration repair.
