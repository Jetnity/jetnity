# R107-W — Account World Visit Workflow Completion 1 — REPORT

Date: 2026-10-25

Author: Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1. Runtime `grok-4.7-high-fast`. Session `bc-af293d35-d2af-43d8-b193-9fbaab7c351b`.

This report describes the candidate-review correction after the R3 implementation. It is not Technical-Lead acceptance.

## What changed for the review

### W-R1.1 — retry stays on the recorded kind

**Erneut senden** reads `vorgang.art`. It no longer chooses edit or revoke from whichever editor happens to be open.

The control is enabled only when that same kind has a current deliberate intent: the create form is open, the editor for that event is open with conflict `keiner`, or the current revoke confirmation for that event is open with conflict `keiner`. A failed read, an in-flight operation, a cancelled editor, or a replaced confirmation disables it (`data-besuch-erneut="gebunden"`). The click returns before any action.

An enabled retry sends the fields now in the editor, or the confirmation now on screen. It does not resend `vorgang.eingabe`. A destructive revoke still needs **Ja, widerrufen**, or a later **Erneut senden** while that new confirmation is applicable. An unknown edit does not turn the old retry into a revoke. An unknown revoke does not let the edit form's ordinary submit through.

Mounted proof, both directions, on the real component: unknown edit, cancel, open revoke, old retry stays disabled and the call list stays `aendern` until **Ja, widerrufen**; unknown edit, cancel, reopen, year 2019, retry sends `aendern` with 2019; unknown revoke, cancel, open editor, old retry stays disabled and the form submit adds no call, then a new confirmation makes retry send `widerrufen` again.

### W-R1.2 — the operation stays when the row does not

The latest operation for each surface renders in `[data-besuch-vorgang-haltung="eigen"]` when its row is not on screen: failed read, search with no match, or a valid list that no longer contains the event. The panel keeps the operation id, the event id, and the phase. **Liste prüfen** requests a refresh and does not call a writer. During a failed read the panel says the read failed; it does not use the absence sentence or the empty-history title.

Mounted proof while the component stays mounted: unknown edit, then a 503 with `besuche: []`, panel remains and **Liste prüfen** increments the refresh count without a second action; pending revoke, then a valid empty list, pending text remains, and the late `{ ok: false }` still shows the unknown state and **Liste prüfen**; pending revoke hidden by search still shows the pending text. A full unmount still drops the ledger. That limit is separate from these cases.

### W-R1.3 — the new receipt is bound

`run-8b1e6ac0185c.json` records:

- command `node scripts/account-world-visit-workflow-completion-1/run.mjs`
- test command `node --import tsx --test scripts/account-world-visit-workflow-completion-1/mounted.ts`
- Node `v22.23.4`, Playwright `1.55.0`, browser `140.0.7339.16`
- hashes of `run.mjs`, `mounted.ts`, `mount.tsx`, both shims, `styles/globals.css`, and the compiled CSS
- hashes of the six tested product sources
- tracked status clean before the run; no tracked dirty paths after it

`run-82260869d6cb.json` is unchanged. It still lacks those bindings. This receipt does not rewrite it. The independent reproduction on Node 24.22.1 is not this run.

## What the first implementation still does

Create, edit, and revoke keep acknowledgement, **Liste prüfen**, and a later displayed list separate. A returned `{ ok: false }` is unconfirmed. The action thunk sits inside the single-flight try/finally. Revoke cleanup needs the confirmation id, its epoch, and the event id. One confirmation is visible. An older settlement does not clear a newer one. A created visit is not matched to a row. The map, date, read, and write contracts are unchanged.

## Files

Correction: `components/account/AccountBesuche.tsx`, `lib/account/account-visit-workflow.ts`, `lib/account/account-visit-workflow.test.ts`, `lib/account/besuche-copy.ts`, `scripts/account-world-visit-workflow-completion-1/mounted.ts`, `scripts/account-world-visit-workflow-completion-1/run.mjs`.

Corrected evidence: `docs/evidence/account-world-visit-workflow-completion-1/run-8b1e6ac0185c.json` and `screens-8b1e6ac0185c/`.

The TASK and the approved PLAN were not edited. No allowlist exception was taken.

## Checks on this correction

| Check | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 182 warnings, 0 errors. None are in this lane's files. |
| `check:dead` | exit 0, 0 unreferenced files |
| `check:exports` | exit 0 |
| `check:deps` | exit 0 |
| `check:api-schutz` | exit 0 |
| `check:schema-bezug` | exit 0. Existing LOCAL/UNAPPLIED RPC notes are unchanged and outside this lane. |
| `npm run build` | exit 0 |
| `npm test` | exit 1. 7178 tests, 7162 pass, 11 fail, 5 skipped. The 11 failures are local PostgreSQL 16 proofs (`initdb` ENOENT, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED`). No visit test failed. The extra passing test is the new kind-binding unit test. |
| Focused visit/map/home regressions | 62 pass, 0 fail |
| Mounted harness | 14 pass, 0 fail, exit 0, bound to `8b1e6ac0` |

CSS at 320, 390, 768, and 1440, with root font size 32px, measured `[data-besuch-verwaltung]` and the document. Both differences were 0 for the long-label check, the first page of the 40-event fixture with an open editor and an open revoke confirmation, a failed visit read, and an unconfirmed create. The first page shows 12 rows. The harness does not set `overflow: hidden`.

Native App/Auth CI 40213289991 was reported green on candidate `016d5309`. It does not gate `8b1e6ac0`. This environment did not rerun native CI, Preview, or Production.

## Limits

- This is not hosted Account proof, not SQL or RLS proof, not a full Next.js router proof, and not a device proof.
- A refresh request is not causal readback. A changed stamp is not a newer database snapshot. The guard is not exactly-once.
- The frozen writers have no client version token. Another session can still change the row after this page reads it.
- A full unmount drops the ledger. The product sentence says the hint remains only on this page.
- No Production DB, Auth, AAL, RLS, secret, provider, payment, legal, or launch action was taken.

## Cost and security

No new dependency, provider, paid call, or route. No schema or RLS change. The ledger stores the visit fields the user already typed on this page. Traveller credentials are unchanged.
