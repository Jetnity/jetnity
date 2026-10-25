# R106 A — Account Traveller Management Completion 1 — HANDOFF

Stop here for Technical-Lead re-review. Do not Ready, merge, close #1005 or #1003, write `main`, start a follow-up, or treat this self-review as PASS.

| Field | Value |
| --- | --- |
| Logical name | Jetnity Account Traveller Management Completion 1 — Cursor Generation 1 |
| Actual runtime model | `grok-4.7-high-fast` |
| Session | https://cursor.com/agents/bc-3b7c97c5-d9fa-4326-9000-14377b2dd939 |
| Branch | `feat/r106-account-traveller-management-1` |
| Base / `origin/main` / merge-base | `500fbe40c8c8a70a0fe0d291782289f809d5d5b3` |
| Accepted plan head | `27204850956b024da1d1b4cf7556c321bf6cfe66` |
| Reviewed head | `c7613bd6754b6fc2f0f62f8339dc58294e5f130c` |
| Prior R1 fix head | `6b094021068483eee82cda7791b9fa99891c1877` |
| Prior docs head | `3aca6036babaad1b7e8b0bd4ead28f05ca425ec7` |
| A-R4 supplement head | `268445373d68f06cec322bcd2ad3a12724e5fb3e` |
| TASK blob | `fab67b9438388ff876eb9f98e1796e2edd091c47` |
| PLAN blob | `fe7275d6e490e97573045baf8c4b07db12e281b3` |
| New evidence | `docs/evidence/account-traveller-management-completion-1/run-268445373d68f06cec322bcd2ad3a12724e5fb3e.json` |
| Preserved evidence | `run-6b094021068483eee82cda7791b9fa99891c1877.json` and `run-4022bc8281e27d2d7965807f45964c9f7ab09d6d.json` |
| Draft PR | #1008 |

`origin/main` was fetched again immediately before this handoff and is still `500fbe40c8c8a70a0fe0d291782289f809d5d5b3`. The supplement commit is 10 ahead and 0 behind. The docs commit that adds this handoff is the commit after `268445373d68f06cec322bcd2ad3a12724e5fb3e`. Re-check ahead/behind on that commit.

## What this supplement changes

- Cancel restores focus only when the active element is gone or still inside the cancelled `form`. A historical receipt uses `data-registry-editor` on a `div`, so its repeat button is not that form.
- The mounted counterexample rejects a traveller edit, opens citizenship create, and in one turn cancels that form and focuses `Trotzdem erneut speichern`. Focus stays there. Write count stays 1.
- Ordinary Cancel clicks still focus `staat-knopf`, `dokument-knopf`, and, at 12 documents, `dokument-aendern`. A focus already on `loeschen` stays there.
- Escape follows PLAN §6.3. No confirmation closes the panel and focuses `Schließen`. An open delete confirmation closes only itself. The draft `Entwurf bleibt` survives.
- A-R1, A-R2, A-R3, and A-R5 from `6b094021` stay in force. The 16px and 32px screenshots on this head differ. The older evidence trees stay.

## Owned paths

- `components/account/AccountReisende.tsx`
- `components/account/AccountReisendeKarte.tsx`
- `components/account/useAccountRegistryWorkflow.ts`
- `lib/traveller/account-registry-copy.ts`
- `lib/traveller/account-registry-workflow.ts`
- `lib/traveller/account-registry-workflow.test.ts`
- `lib/traveller/account-registry-workflow-ui.test.ts`
- `lib/traveller/account-travellers-premium-registry-ux-1.test.ts`
- `scripts/account-traveller-management-completion-1/**`
- `docs/evidence/account-traveller-management-completion-1/**`
- `docs/JETNITY_ACCOUNT_TRAVELLER_MANAGEMENT_COMPLETION_1_{STATUS,REPORT,SELF_REVIEW,HANDOFF}_2026-10-25.md`

This supplement edits the card and `mounted.ts` only. TASK and PLAN are unchanged. Frozen server actions, domain modules, schema, Auth, RLS, Trip storage, account settings, bookings, and global navigation were not edited.

## Findings

P0: none found. P1: none found. No R1 product finding is left open. The receipt-focus steal is not an accepted residual.

Remaining limits, not R1 product defects: local `npm test` on `26844537` exit 1 because PostgreSQL `initdb` is absent (11 suites, 7129 tests, 7113 pass, 5 skipped, `duration_ms 104941.811037`). Production `router.refresh()` is `void`, so a production refresh failure is not observable and a refresh is not a list observation. Create actions still do not return ids. Two tabs can still race. No exactly-once claim.

## Verified on this machine for the supplement head

Harness exit 0. 39 mounted cases pass. 2 source-contract tests pass in the same child (41 pass, `duration_ms 33100.250813`). 0 mounted skips. `externalRequests` empty. Chrome 148.0.7778.96. Focused native tests exit 0, 77 pass. `typecheck`, `lint` (181 warnings, 0 errors), `check:setup:ci`, `check:operating-mode`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`, and `build` exit 0.

App, Auth, and Vercel success on `c7613bd6` are historical. This head has no hosted Account, full Next router, Supabase, RLS, or Production proof.

## Next

Root Technical Lead, same session `bc-3b7c97c5-d9fa-4326-9000-14377b2dd939`, fresh-head review of `268445373d68f06cec322bcd2ad3a12724e5fb3e` plus the docs commit that follows it. Main sync only if a later instruction in this session says so.
