# R106 A — Account Traveller Management Completion 1 — REPORT

Synchronization merge: `e761c47131bbdf0b508fa9afd6470514dca9530e`

Pre-sync head: `e2db757d502f97f0dcce48d61e0b0fd87f95caa0`

Accepted main: `41844878a8437256572da3de1374fbb36fd7a516`

Node: v22.23.4. Chrome in the new harness: 148.0.7778.96.

## What the merge did

`git merge origin/main` completed with the `ort` strategy and no conflicts. Parents are `e2db757d502f97f0dcce48d61e0b0fd87f95caa0` and `41844878a8437256572da3de1374fbb36fd7a516`. The tree is `712a7cf23a135aba652173a11f871bc2c31ebcb5`. After the merge, `origin/main` is the merge-base and the branch is 12 ahead / 0 behind. The working tree was clean before the proof files were written.

`git diff --name-only e2db757d HEAD` contains only the inherited Admin lane: three `components/admin` paths, five `lib/admin` paths, three `scripts/admin-operations-evidence-lifecycle-completion-1` paths, six Admin completion docs, and `docs/evidence/admin-operations-evidence-lifecycle-completion-1/**`. No Account source, Account test, Account script, or Account evidence file differs from `e2db757d`.

`git diff --name-status origin/main...HEAD` is the Account lane only: `components/account/AccountReisende.tsx`, `AccountReisendeKarte.tsx`, `useAccountRegistryWorkflow.ts`, registry copy, workflow, workflow tests, the premium registry UX test, `scripts/account-traveller-management-completion-1/**`, and the owned Account docs and evidence. 31 files before this documentation commit.

Account runtime blobs, identical to `e2db757d`:

| Path | Git blob |
| --- | --- |
| `components/account/AccountReisende.tsx` | `a597b75f8f40f5cd3a25e40c34503c9175cf8269` |
| `components/account/AccountReisendeKarte.tsx` | `1403a4c2101b1156104141ed434ca7c0e3ef9ada` |
| `components/account/useAccountRegistryWorkflow.ts` | `b59fd88813204447e0000527d100a3ca9b1dac37` |
| `lib/traveller/account-registry-copy.ts` | `ddccb1daf9c933fb593a9fc1f02282952d26a25d` |
| `lib/traveller/account-registry-workflow.ts` | `ce1ba1a704ce270f81a34374e76bae68ec76bfbb` |
| `lib/traveller/account-registry-workflow.test.ts` | `99493ef5a57344ac1944b56b91e90d9e44cf5fc7` |
| `lib/traveller/account-registry-workflow-ui.test.ts` | `0428c4b8788970df750ef40cd3bca7e2f6fad954` |
| `scripts/account-traveller-management-completion-1/mounted.ts` | `3ec4218d4749f3151f6c4f928ccd16aded510b4e` |

TASK blob `fab67b9438388ff876eb9f98e1796e2edd091c47` and PLAN blob `fe7275d6e490e97573045baf8c4b07db12e281b3` are unchanged. `package.json` blob `e6187432cb8f224c10281b7b476bb24eb8ef1c1b` and `package-lock.json` blob `4c64e03d16a54ae6c648dc3e40c88d6b94c5cfbe` are unchanged. Historical Account evidence for `4022bc82`, `6b094021`, and `26844537` remains.

## Proof on the merge commit

The harness ran after the merge and before this docs commit, so its `commit` field is `e761c47131bbdf0b508fa9afd6470514dca9530e`.

```text
node scripts/account-traveller-management-completion-1/run.mjs
```

Exit 0. Child `node --import tsx --test lib/traveller/account-registry-workflow-ui.test.ts` with `ACCOUNT_TRAVELLER_MANAGEMENT_BROWSER=1`: 41 pass, 0 fail, 0 skipped, `duration_ms 48274.028293`. Of those, 2 are the source contract and 39 are mounted cases. Evidence status PASS, caseCount 39, `externalRequests` empty. Chrome 148.0.7778.96. Local origin `http://127.0.0.1:45071`.

File: `docs/evidence/account-traveller-management-completion-1/run-e761c47131bbdf0b508fa9afd6470514dca9530e.json`

Layout screens: `screens-e761c47131bbdf0b508fa9afd6470514dca9530e/320.png` at 16px, `320-root-32.png` at 32px, `1280.png` at 16px. The 16px and 32px files differ. The 32px check sets `font-size` on `documentElement`. It is not browser zoom, a device, or a screen reader. Alias boundary is unchanged: esbuild replaces only `@/lib/traveller/account-registry-aktionen` and `next/navigation`.

Source digests in that file match the blobs above. sha256 of the card is `ad095bccf34e6e18833fe2f6d1707238d759650f46f115e8b35214ebf4c98e37`. sha256 of `mounted.ts` is `c13ce804fb4d8a4ac80fe8e5ec0d9d36795f2b3d8fcff0fa208f8e4e3cab4fe9`.

Focused native command, browser env unset, exit 0: 77 pass, 0 fail, 0 skipped. Files: workflow, workflow UI contract, premium registry UX, account-registry UI, document lifecycle UI, account-registry, registry input, and country UI tests (`ui`, `land-feld`, `darstellung`, `scope`). Mounted cases were absent, not skipped.

`npm test` on this machine for the merge head, exit 1:

```text
# tests 7152
# pass 7136
# fail 11
# skipped 5
# duration_ms 123950.664347
```

The 23 additional passes against the pre-sync local total of 7129 tests / 7113 passes are tests inherited with main. The 11 failures are local PostgreSQL proof suites. Inspected errors are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`, `local_proof_connection_override_forbidden`, or `NOT_VERIFIED: local PostgreSQL binaries are required`. They are not account-registry tests. This local run is not native CI.

Other commands on the merge head, all exit 0:

| Command | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 errors, 181 warnings |
| `npm run check:setup:ci` | exit 0, 1 pre-existing warning: no `.env` / `.env.local` |
| `npm run check:operating-mode` | exit 0, PASS |
| `npm run check:api-schutz` | exit 0, 12 admin routes |
| `npm run check:schema-bezug` | exit 0, pre-existing LOCAL/UNAPPLIED RPC notes |
| `npm run check:dead` | exit 0, 0 orphans, 857 starts, 1606 reachable modules |
| `npm run check:exports` | exit 0 |
| `npm run check:deps` | exit 0 |
| `npm run build` | exit 0, compiled in 10.3s |

## Not verified on this head

Hosted Account, full Next.js router, Supabase, RLS, Production, Preview, and GitHub App/Auth were not observed for `e761c471`. The synthetic harness is not that proof. App run 40185107709 and Preview `dpl_56CgA19gxyksdweVM3sYRrCx2WxH` on `e2db757d` do not cover this head. The merge commit was pushed before this docs commit; any CI that starts on `e761c471` does not cover the docs commit, and this report does not claim a result for either.

`AppRouterInstance.refresh` remains typed `void`. A production refresh failure is not observable, and a refresh is not a list observation.
