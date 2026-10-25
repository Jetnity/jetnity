# R106 A — Account Traveller Management Completion 1 — REPORT

Implementation head: `4022bc8281e27d2d7965807f45964c9f7ab09d6d`

## What landed

`AccountReisende` and `AccountReisendeKarte` send all eight registry writes through `useAccountRegistryWorkflow`. The pure machine in `lib/traveller/account-registry-workflow.ts` is the authority.

`beginnen` checks, on the state passed at the call: no in-flight attempt and no open replacement on that key; an acknowledgment of the exact current blocking receipt when one exists; a currently qualified valid snapshot for that receipt; a still-eligible target; and the blocking receipt's own editor, target, and draft. A bare boolean is refused. A 500, 503, invalid, or unchanged list does not unlock another write.

Receipts are append-only. The current blocker is the newest `unbestaetigt` receipt on that key. A known outcome on a repeat does not delete the older unknown. Reopen does not reuse an epoch still stored on a receipt. Clean canonical adoption, including while a write is in flight, raises the editor epoch so the old completion cannot reset or move focus. A failed or invalid read adopts nothing and is not treated as disappearance.

Citizenship and document saves say `Die Angaben wurden gespeichert.` Removals say the stored entry was removed. Neither sentence says an identity fact was verified.

## Proof

Harness, from the implementation tree:

```text
node scripts/account-traveller-management-completion-1/run.mjs
```

Exit 0. Child `node --import tsx --test lib/traveller/account-registry-workflow-ui.test.ts` with `ACCOUNT_TRAVELLER_MANAGEMENT_BROWSER=1`: 33 pass, 0 fail, 0 skipped. Of those, 2 are the always-on source contract and 31 are mounted cases. Evidence status PASS, caseCount 31, Chrome 148.0.7778.96, `externalRequests` empty.

File: `docs/evidence/account-traveller-management-completion-1/run-4022bc8281e27d2d7965807f45964c9f7ab09d6d.json`

Layout screens from that run: `screens-4022bc8281e27d2d7965807f45964c9f7ab09d6d/320.png`, `320-root-32.png`, `1280.png`. The 32px check sets `font-size` on `documentElement`. It is not browser zoom, a device, or a screen reader.

Source digests recorded in that evidence file:

| Path | sha256 |
| --- | --- |
| `components/account/AccountReisende.tsx` | `875bf1645e5fb571ffd2ebaa8d920b3e174643f228acbe9b03e7b973a1778072` |
| `components/account/AccountReisendeKarte.tsx` | `1329d6414b0c70dabad96a40c290529bd539871d96847331af14914f0cdbbb3b` |
| `components/account/useAccountRegistryWorkflow.ts` | `4131963620cd894be5b161f9d32d23901e9cbdec785fc04499a833203973b218` |
| `lib/traveller/account-registry-workflow.ts` | `9a2f4e5006bc74260cb320a50ffd66e1a9f4b8888983dd69cfe3f07042dcaeae` |
| `lib/traveller/account-registry-copy.ts` | `579186a0bb6db998d570837a2a6451d8d3c468b8934745ff0e1489cf8b478ebb` |
| `lib/traveller/account-registry-workflow.test.ts` | `efa9b7cdc9045df14a98c015825736bb1e0d2a6c9e7bc733708be7e0edf44f87` |
| `lib/traveller/account-registry-workflow-ui.test.ts` | `3136afd29b01ee1119a354566e8237fdd06345e1e1a1d772676ae6deaa51ab7a` |
| `lib/traveller/account-registry-workflow-mounted.ts` | `3fd59a0d377fa362113b76d946436d3a0e49e76a4d666c95ddbb27ea589a25d4` |

Alias boundary: esbuild replaces only `@/lib/traveller/account-registry-aktionen` and `next/navigation`. LandFeld, copy, limits, card markup, and project CSS stay real. Fixtures are synthetic labels such as `Synthetische Person A`. Action stubs return deferred promises. `refresh` does not change props. A resolved refresh is not a list observation.

Focused native command, browser env unset, exit 0: 74 pass, 0 fail, 0 skipped. Files: workflow, workflow UI contract, premium registry UX, account-registry UI, document lifecycle UI, account-registry, registry input, and country UI tests. The mounted cases were absent, not skipped.

`npm test` on this machine, exit 1:

```text
# tests 7126
# pass 7110
# fail 11
# skipped 5
# duration_ms 120877.02263
```

The 11 failures are disposable PostgreSQL suites whose first error is `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. This machine has no local PostgreSQL server binaries. Those suites are not account-registry tests. The cited task baseline of 7213 tests and 2 conditional browser skips was not reproduced here: the aborted PostgreSQL suites do not contribute their inner tests, and this environment also skips the documented native PostgreSQL and browser-audit cases. The two explicit browser skips remain visible (`T09` workspace layout, shared responsive layout). This local `npm test` is not the native CI pass.

Other commands, all exit 0 unless noted:

| Command | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 errors, 181 warnings |
| `npm run check:setup:ci` | exit 0, 1 pre-existing warning: no `.env` / `.env.local` |
| `npm run check:operating-mode` | exit 0, PASS |
| `npm run check:api-schutz` | exit 0, 12 admin routes |
| `npm run check:schema-bezug` | exit 0, pre-existing LOCAL/UNAPPLIED RPC notes |
| `npm run check:dead` | exit 0, 0 orphans |
| `npm run check:exports` | exit 0 |
| `npm run check:deps` | exit 0 |
| `npm run build` | exit 0 |

## Not verified

Hosted Account, full Next.js router, Supabase, RLS, Production, Preview, and GitHub App/Auth/Vercel checks were not run. The synthetic harness is not that proof. A changed valid list is a newly observed canonical snapshot. It does not identify which `router.refresh()` produced it. An unchanged valid list stays unconfirmed. There is no server read nonce.

`AppRouterInstance.refresh` in this Next version is typed `void`. The hook follows a returned thenable when one exists, which is how the harness shim reports rejection. A production `refresh()` call has no rejection to catch. The explicit reread still uses the local 4000ms deadline. That deadline does not retry a write and is not a server timeout.

## Boundary

No schema, migration, RLS, Auth, server-action, package, lockfile, workflow, or global-style change. No new runtime cost, provider, or model call. Eleven npm advisories stay untriaged and out of scope. Returning inserted ids would require editing frozen `account-registry-aktionen.ts`. That remains a later Technical-Lead task.
