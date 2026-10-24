# Jetnity — Manual Mobility Pending Draft Guard 1 — STATUS

Date: 24 October 2026
Author: **Jetnity Manual Mobility Pending Draft Guard 1 — Cursor Generation 1**
Session: `bc-529c718d-03e4-43f9-a8fa-7e555d3f4cbf`
https://cursor.com/agents/bc-529c718d-03e4-43f9-a8fa-7e555d3f4cbf
Model: `grok-4.7-high-fast`
UI title: Jetnity Manual Mobility Pending Draft Guard 1 — Cursor Generation 1
Issue: #986
PR: #988
Branch: `fix/manual-mobility-pending-draft-guard-1`

Status: implementation and local proof complete on the runtime head below. Independent Technical-Lead review is not done. This status is not PASS, Ready, or merge.

## Runtime head

Component proof ran at `5250356bdfcf0de3a4e39b348fd3b7ab8518110b`.
`ManuelleVerbindung` source blob `105c8a2a9a4d0b5b285395cfbf2951e411a6dc23`.
SHA-256 `652cd513e490813a09bcc5a3111a3d487b804a0ff4df6dcdb54d689853fd4db3`.
Baseline blob `8560a106e4eb61a852b2f4ce27868ab30cf18cf0`.
TASK V1 blob `3e5d971be2234c0bd8adf487bd5ac673021bc07e`, unchanged.
The docs/evidence commit after that head does not change the component. Exact final HEAD is only in the PR comment.

## Outcome

While `onAnlegen` is pending, mode, day, origin, destination, both dates, both clocks, connection reference, note, and submit are disabled. Success still stores captured draft A, shows the existing user-entered confirmation, and clears only the connection reference and note. A returned error string and a rejected promise restore editing, keep the entered values, and do not show success. The synchronous one-write guard and the per-instance unmount guard remain.

## Proof

`node scripts/manual-mobility-pending-draft-guard-1/harness.mjs` exit 0.
Evidence `docs/evidence/manual-mobility-pending-draft-guard-1/result.json` status PASS.
Chrome `148.0.7778.96` after Playwright's downloaded Chromium was absent. Not a skip.
Viewports 320×720, 390×844, 1280×900. No blocked external requests. No page errors.

## Local gates on the runtime head

| Command | Result |
| --- | --- |
| harness | PASS |
| `npm test` | exit 1: 7044 tests, 7028 pass, 11 fail, 5 skipped |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 errors, 146 warnings |
| `npm run check:setup` | exit 0, 1 pre-existing warning: no `.env` / `.env.local` |
| `npm run check:operating-mode` | PASS |
| `npm run check:api-schutz` | PASS, 12 admin routes |
| `npm run check:schema-bezug` | exit 0, pre-existing LOCAL/UNAPPLIED notices |
| `npm run check:dead` | 0 orphans |
| `npm run check:exports` | 0 |
| `npm run check:deps` | 0 unused |
| `npm run build` | exit 0 |

The 11 failures are native PostgreSQL proofs (`initdb` ENOENT, `local_proof_connection_override_forbidden`, or missing local binaries). None name this component. They were not repaired. The two conditional browser skips remain opt-in: T09 without `TRIP_AUDIT_UI_URL`, and shared responsive layout without `SHARED_LAYOUT_AUDIT_BASE`. This lane added no skip.

## Boundaries

No database, Auth, RLS, secret, provider, payment, or cost change. Lane B was not touched. `origin/main` at this read is still `e372f4d830c35a74a235d345c2baaf08ab615e6c`, tree `09f4ee368b137b6e4a918e950b94176fe32b583c`, 0 behind. No Ready. No merge. No follow-up slice.
