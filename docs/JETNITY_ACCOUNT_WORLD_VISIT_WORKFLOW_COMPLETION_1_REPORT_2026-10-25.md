# R107-W — Account World Visit Workflow Completion 1 — REPORT

Date: 2026-10-25

Author: Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1. Runtime `grok-4.7-high-fast`. Session `bc-af293d35-d2af-43d8-b193-9fbaab7c351b`.

This report describes the implementation authorized by the R3 plan PASS. It is not Technical-Lead acceptance.

## What shipped

Deine Welt visit create, edit, and revoke now keep one operation ledger in the browser.

- A local pure-reader miss, before the action thunk, is the only known not-sent outcome. Every returned `{ ok: false }`, including the frozen writer's transport sentence, is unconfirmed. A throw, a rejection, and a fulfillment with any extra key are unconfirmed. Exact `{ ok: true, wert: null }` is accepted and still does not prove that the displayed list is the write's result.
- The single-flight guard is taken before the thunk. The thunk runs inside `try/catch/finally`. A second call in the same turn does not evaluate a second action.
- Acknowledgement, "Liste prüfen", and "Erneut senden" stay separate. "Vorgang schliessen" drops the blocker and does not write. Nothing is replayed automatically. A created visit is never matched to a row.
- A changed displayed stamp is displayed content. A stamp already seen before settlement stays "gleich". A failed visit read is `lesefehler`, not an empty history. The map still receives the frozen `welt`, `besucht`, and `laender` values.
- A clean editor adopts a changed canonical row and does not send. A dirty editor keeps the user's fields until "Liste übernehmen" or "Meinen Entwurf speichern". Drift or removal while a write is in flight bumps the epoch before the response is applied, so the old acknowledgement cannot close that draft.
- Every revoke open or reopen gets a new confirmation id and epoch. Cleanup needs that id, that epoch, the event id, and conflict `keiner`. One confirmation is visible. Opening another replaces it. The old in-flight result cannot clear the newer confirmation. B and A are not shown together.
- Focus moves only for the user's own cancel, reopen, or toggle, and not while search or a newer draft holds focus. Search, disclosure, and opening another confirmation stay usable while one operation is in flight.

## Files

Runtime: `components/account/AccountBesuche.tsx`, `components/account/AccountBesuchFormular.tsx`, `components/account/useAccountVisitWorkflow.ts`, `lib/account/account-visit-workflow.ts`, `lib/account/besuche-copy.ts`.

Proof: `lib/account/account-visit-workflow.test.ts`, `scripts/account-world-visit-workflow-completion-1/**`.

Evidence: `docs/evidence/account-world-visit-workflow-completion-1/run-82260869d6cb.json` and `screens-82260869d6cb/`.

The TASK and the approved PLAN were not edited. No allowlist exception was taken. Map, date, read, and write modules were not edited.

## Checks

| Check | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 182 warnings, 0 errors. Owned files later passed `eslint --max-warnings 0`. The recorded baseline is 181 warnings. None of the 182 were in this lane's files. |
| `check:dead` | exit 0, 0 unreferenced files |
| `check:exports` | exit 0 after internal helpers stopped being exported and the form's empty value stayed in use |
| `check:deps` | exit 0 |
| `check:api-schutz` | exit 0 |
| `check:schema-bezug` | exit 0. Existing LOCAL/UNAPPLIED RPC notes are unchanged and outside this lane. |
| `npm run build` | exit 0 |
| `npm test` | exit 1. 7177 tests, 7161 pass, 11 fail, 5 skipped. All 11 failures are local PostgreSQL 16 proofs (`initdb` ENOENT, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED` because the binary is absent). No visit test failed. |
| Focused visit/map/home regressions | 61 pass, 0 fail, after the final product sources |
| Mounted harness | 12 pass, 0 fail, exit 0, bound to `82260869` |

Node `v22.23.4`. The mounted runner aliases only `next/navigation` and `lib/account/besuche-aktionen.ts`. Playwright Chromium was installed in this environment for that run.

CSS at 320, 390, 768, and 1440, with root font size 32px, measured `[data-besuch-verwaltung]` and the document. Both differences were 0 for the long-label check, the first page of the 40-event fixture with an open editor and an open revoke confirmation, a failed visit read, and an unconfirmed create. The first page shows 12 rows. Expanding the other 28 was not part of the width sweep. The harness does not set `overflow: hidden`.

## Limits

- This is not hosted Account proof, not SQL or RLS proof, not a full Next.js router proof, and not a device proof.
- A refresh request is not causal readback. A changed stamp is not a newer database snapshot. The guard is not exactly-once.
- The frozen writers have no client version token. Another session can still change the row after this page reads it.
- A full unmount drops the ledger. The product sentence says the hint remains only on this page.
- Native App, Auth, and Vercel gates were not run here and are not passed.
- No Production DB, Auth, AAL, RLS, secret, provider, payment, legal, or launch action was taken.

## Cost and security

No new dependency, provider, paid call, or route. No schema or RLS change. The ledger stores the visit fields the user already typed in this page. Traveller credentials are unchanged.
