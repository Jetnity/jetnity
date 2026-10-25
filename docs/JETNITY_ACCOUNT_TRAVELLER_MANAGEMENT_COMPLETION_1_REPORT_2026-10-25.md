# R106 A — Account Traveller Management Completion 1 — REPORT

A-R4 supplement head: `268445373d68f06cec322bcd2ad3a12724e5fb3e`

Prior R1 fix head: `6b094021068483eee82cda7791b9fa99891c1877`

Reviewed head: `c7613bd6754b6fc2f0f62f8339dc58294e5f130c`

Node: v22.23.4. Chrome in the supplement harness: 148.0.7778.96. `origin/main` was fetched again before this handoff and is still `500fbe40c8c8a70a0fe0d291782289f809d5d5b3`.

## R1 corrections that stay

A-R1. A saved receipt whose list is missing, invalid, or unchanged shows `Erneut lesen` next to `Die aktuelle Liste ist hier noch nicht geladen.` The control calls the existing read path only. The mounted case still sends one write, then the read click adds one refresh and zero writes. An unrelated draft stays.

A-R2. `registryUebernehmen` raises the editor epoch and stores the canonical context. A later success or `unbestaetigt` from the older receipt cannot close, clear, or focus that editor. The mounted adoption case still moves epoch 3 to 4 and leaves the editor open.

A-R3. Create actions still clear their fields. Traveller and document edits do not. A clean reopen shows the known list. A dirty draft survives close and reopen. The second mounted traveller payload remains `Alice` / `DE`. The second document payload remains `passport` / `DE` / empty citizenship / `2030-01-01`.

A-R5. The harness still rejects a real deferred action after the draft changes. `320.png` is captured at root `16px` before the font change. `320-root-32.png` is captured after `documentElement` font-size `32px`. The bytes differ. The earlier identical pair under `screens-4022bc8281e27d2d7965807f45964c9f7ab09d6d/` is unchanged. The mounted module stays at `scripts/account-traveller-management-completion-1/mounted.ts`.

## A-R4 supplement

At `6b094021`, post-commit restoration treated any `[data-registry-editor]` ancestor as the cancelled editor. Receipt containers carry that attribute on a `div`, so the already-mounted `Trotzdem erneut speichern` button was treated as the form being closed. After React committed, focus moved to `staat-knopf`.

At `26844537`, restoration runs only when focus is absent, on `body`, on `documentElement`, or still inside `form[data-registry-editor="<the cancelled editor>"]`. Any other element is a newer purposeful focus and is left alone. That includes a control inside a historical receipt and a control inside another editor. Membership in an arbitrary editor container is not enough.

Cancel buttons still request that restoration:

- citizenship create focuses `staat-knopf:<travellerId>`
- document create focuses `dokument-knopf:<travellerId>`
- document edit focuses `dokument-aendern:<documentId>`, including when twelve documents leave no create button

The form-specific Escape handlers from `6b094021` are removed. Escape bubbles to the existing panel handler. That handler follows accepted PLAN §6.3. With a delete confirmation open, Escape closes only that confirmation and focuses its opener. With the panel open and no confirmation, Escape focuses that card's `Schließen` button (`verwalten:<id>`) and closes the panel. Closing the panel keeps a dirty draft. Cancellation focus work does not change that panel contract.

Mounted case `Abbrechen setzt den Fokus auf den bleibenden Schalter`: a click on Cancel restores `staat-knopf`, then `dokument-knopf`, and the panel stays open. A same-turn cancel followed by focusing `loeschen:<id>` leaves focus there. At twelve documents, Cancel on the document edit focuses `dokument-aendern` for that document. The later save does not take that focus. Reopen uses a newer epoch and shows `passport`. One write.

Mounted case `Abbrechen laesst den Fokus auf dem aelteren Beleg`: a traveller edit is genuinely rejected, the unknown receipt stays, citizenship create opens, and one event turn clicks that form's Cancel and then focuses the receipt repeat button. The immediate text and the text after the form detaches are `Trotzdem erneut speichern`. Focus is not `staat-knopf`. Write count stays 1. The `loeschen` move above does not replace this case.

Mounted case `Escape schliesst die Verwaltung und behaelt den Entwurf`: Escape in the traveller edit closes the panel, focuses `verwalten:<id>`, and reopen shows `Entwurf bleibt`. Escape in the citizenship form also closes the panel and focuses `verwalten`. Escape with the traveller-delete confirmation open closes only that confirmation, keeps the panel, and focuses `loeschen`. Write count stays 0. The existing `Tastatur Escape und Enter` case still passes.

## Proof for this supplement head

```text
node scripts/account-traveller-management-completion-1/run.mjs
```

Exit 0. Child `node --import tsx --test lib/traveller/account-registry-workflow-ui.test.ts` with `ACCOUNT_TRAVELLER_MANAGEMENT_BROWSER=1`: 41 pass, 0 fail, 0 skipped, `duration_ms 33100.250813`. Of those, 2 are the always-on source contract and 39 are mounted cases. Evidence status PASS, caseCount 39, `externalRequests` empty. Chrome 148.0.7778.96.

File: `docs/evidence/account-traveller-management-completion-1/run-268445373d68f06cec322bcd2ad3a12724e5fb3e.json`

Layout screens: `screens-268445373d68f06cec322bcd2ad3a12724e5fb3e/320.png`, `320-root-32.png`, `1280.png`. Recorded fonts: `320.png` = `16px`, `320-root-32.png` = `32px`, `1280.png` = `16px`. The 32px check sets `font-size` on `documentElement`. It is not browser zoom, a device, or a screen reader.

Preserved evidence:

- `docs/evidence/account-traveller-management-completion-1/run-6b094021068483eee82cda7791b9fa99891c1877.json` (37 mounted cases on the prior R1 head)
- `docs/evidence/account-traveller-management-completion-1/run-4022bc8281e27d2d7965807f45964c9f7ab09d6d.json` (the identical 320px pair stays as historical evidence)

Source digests in the supplement evidence file:

| Path | sha256 |
| --- | --- |
| `components/account/AccountReisende.tsx` | `875bf1645e5fb571ffd2ebaa8d920b3e174643f228acbe9b03e7b973a1778072` |
| `components/account/AccountReisendeKarte.tsx` | `ad095bccf34e6e18833fe2f6d1707238d759650f46f115e8b35214ebf4c98e37` |
| `components/account/useAccountRegistryWorkflow.ts` | `4131963620cd894be5b161f9d32d23901e9cbdec785fc04499a833203973b218` |
| `lib/traveller/account-registry-workflow.ts` | `72629bcfd59eaa7fe408b2b627403c0a05b044e4e82bb49ee08f26ac9ee062d0` |
| `lib/traveller/account-registry-copy.ts` | `579186a0bb6db998d570837a2a6451d8d3c468b8934745ff0e1489cf8b478ebb` |
| `lib/traveller/account-registry-workflow.test.ts` | `a892ffb301929a18b8e3b9e9ec6d5a1273be987301f339a5ea18661dc223de4e` |
| `lib/traveller/account-registry-workflow-ui.test.ts` | `2fa228529ab9b21b1acde7b6cd9971ec3b6cec9e0491797465c8d7b3685cc409` |
| `scripts/account-traveller-management-completion-1/mounted.ts` | `c13ce804fb4d8a4ac80fe8e5ec0d9d36795f2b3d8fcff0fa208f8e4e3cab4fe9` |

The card and mounted digests differ from `6b094021`. The other six match that head. Alias boundary is unchanged: esbuild replaces only `@/lib/traveller/account-registry-aktionen` and `next/navigation`. LandFeld, copy, limits, card markup, and project CSS stay real. Fixtures are synthetic. A resolved refresh is not a list observation.

Focused native command on `26844537`, browser env unset, exit 0: 77 pass, 0 fail, 0 skipped. Files: workflow, workflow UI contract, premium registry UX, account-registry UI, document lifecycle UI, account-registry, registry input, and country UI tests. The mounted cases were absent, not skipped.

`npm test` on this machine for `26844537`, exit 1:

```text
# tests 7129
# pass 7113
# fail 11
# skipped 5
# duration_ms 104941.811037
```

The 11 failures are disposable PostgreSQL suites. The inspected errors are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. This machine has no local PostgreSQL server binaries. Those suites are not account-registry tests. This local `npm test` is not the native CI pass. App run 40159657960 on `c7613bd6` (7232 tests, 7230 pass, 2 skips) does not apply to this head.

Other commands on `26844537`, before this docs commit, all exit 0 unless noted:

| Command | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0, 0 errors, 181 warnings |
| `npm run check:setup:ci` | exit 0 |
| `npm run check:operating-mode` | exit 0 |
| `npm run check:api-schutz` | exit 0 |
| `npm run check:schema-bezug` | exit 0 |
| `npm run check:dead` | exit 0 |
| `npm run check:exports` | exit 0 |
| `npm run check:deps` | exit 0 |
| `npm run build` | exit 0, compiled in 3.4s; `check:setup` inside the build reports 1 pre-existing warning: no `.env` / `.env.local` |

## Not verified on this head

Hosted Account, full Next.js router, Supabase, RLS, Production, Preview, and GitHub App/Auth/Vercel checks were not run for `26844537`. The synthetic harness is not that proof. App run 40159657960, Auth, and Vercel Preview on `c7613bd6` do not cover this head. A changed valid list is a newly observed canonical snapshot. It does not identify which `router.refresh()` produced it. An unchanged valid list stays unconfirmed. There is no server read nonce.

`AppRouterInstance.refresh` in this Next version is typed `void`. The hook follows a returned thenable when one exists, which is how the harness shim reports rejection. A production `refresh()` call has no rejection to catch. The explicit reread still uses the local 4000ms deadline. That deadline does not retry a write and is not a server timeout.

## Boundary

The supplement diff is `components/account/AccountReisendeKarte.tsx` and `scripts/account-traveller-management-completion-1/mounted.ts`, plus this docs and evidence commit. No schema, migration, RLS, Auth, server-action, package, lockfile, workflow, or global-style change. No new runtime cost, provider, or model call. TASK and PLAN bytes are unchanged. Returning inserted ids would require editing frozen `account-registry-aktionen.ts`. That remains a later Technical-Lead task.
