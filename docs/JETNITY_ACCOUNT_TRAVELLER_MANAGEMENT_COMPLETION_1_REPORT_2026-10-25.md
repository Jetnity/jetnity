# R106 A — Account Traveller Management Completion 1 — REPORT

R1 fix head: `6b094021068483eee82cda7791b9fa99891c1877`

Reviewed head: `c7613bd6754b6fc2f0f62f8339dc58294e5f130c`

Node: v22.23.4. Chrome in the new harness: 148.0.7778.96.

## R1 corrections

A-R1. A saved receipt whose list is missing, invalid, or unchanged shows `Erneut lesen` next to `Die aktuelle Liste ist hier noch nicht geladen.` The control calls the existing read path only. Mounted case `gespeichert ohne neue Liste bietet Lesen an`: one write, then the read click adds one refresh and zero writes. Bert's typed draft `Bert Entwurf` stays.

A-R2. `registryUebernehmen` raises the editor epoch and stores the canonical context. A later success or `unbestaetigt` from the older receipt cannot close, clear, or focus that editor. Pure test `eine ausdrückliche Übernahme hebt die Epoche vor dem alten Abschluss` passes for both outcomes. Mounted case `ausdrueckliche Uebernahme entzieht dem alten Erfolg die Oberflaeche`: epoch 3 then 4, the editor stays open on `Neu`, and focus stays on the delete control. One write.

A-R3. Create actions still clear their fields. Traveller and document edits do not. Reopening a clean edit adopts the known list values. A dirty draft survives close and reopen. Pure tests cover both editors, the second payload, a later canonical snapshot, and the dirty draft. Mounted traveller case: after a confirmed save and an unchanged list, the second `traveller-aendern` argument is `label: Alice`, `residenceCountryCode: DE`. A later list `Bert` / `FR` is what the form shows. The typed draft `Entwurf` survives cancel and reopen. Mounted document case: the second `document-aendern` argument is `passport`, `DE`, empty citizenship, `2030-01-01`. A later `national_id` snapshot is shown. The dirty choice `unknown` survives cancel and reopen. The receipt still says the save was confirmed and the list is not loaded yet.

A-R4. Citizenship-create and document create/edit cancel buttons no longer carry the opener's focus key. Focus is applied after commit, and only when focus is on the body or still inside the editor. Escape inside those forms closes the form and keeps the panel open. Mounted case `Escape setzt den Fokus auf den bleibenden Schalter`: citizenship create focuses `staat-knopf`, document create focuses `dokument-knopf`, and a document edit at 12 documents focuses `dokument-aendern` for that document. A same-turn cancel followed by focusing delete leaves focus there. After Escape, the older document save resolves and focus stays on `dokument-aendern`. Reopen is a newer epoch than the receipt and shows `passport`. The existing panel Escape and traveller-delete Escape case still passes.

A-R5. The mounted runner calls `window.__registryAblehnen`. Case `eine echte Ablehnung nach neuer Generation bleibt beim Entwurf`: the deferred action rejects after the draft changes to `Zweiter Entwurf`. The draft stays, the form does not show the success sentence, the receipt is `unbestaetigt`, focus stays on delete, and there is one write. `320.png` is captured at root `16px` before the font change. `320-root-32.png` is captured after `documentElement` font-size `32px`. The harness asserts the bytes differ. Recorded screenshot fonts: `320.png` = `16px`, `320-root-32.png` = `32px`, `1280.png` = `16px`. The earlier identical pair under `screens-4022bc8281e27d2d7965807f45964c9f7ab09d6d/` is unchanged. Disposable mounted support now lives at `scripts/account-traveller-management-completion-1/mounted.ts`. Callers are the UI test and `run.mjs`.

## Proof for this fix head

```text
node scripts/account-traveller-management-completion-1/run.mjs
```

Exit 0. Child `node --import tsx --test lib/traveller/account-registry-workflow-ui.test.ts` with `ACCOUNT_TRAVELLER_MANAGEMENT_BROWSER=1`: 39 pass, 0 fail, 0 skipped. Of those, 2 are the always-on source contract and 37 are mounted cases. Evidence status PASS, caseCount 37, `externalRequests` empty.

File: `docs/evidence/account-traveller-management-completion-1/run-6b094021068483eee82cda7791b9fa99891c1877.json`

Layout screens: `screens-6b094021068483eee82cda7791b9fa99891c1877/320.png`, `320-root-32.png`, `1280.png`. The 32px check sets `font-size` on `documentElement`. It is not browser zoom, a device, or a screen reader.

Source digests in that evidence file:

| Path | sha256 |
| --- | --- |
| `components/account/AccountReisende.tsx` | `875bf1645e5fb571ffd2ebaa8d920b3e174643f228acbe9b03e7b973a1778072` |
| `components/account/AccountReisendeKarte.tsx` | `448e35f768f3d67388e39ba05e89b55bfa472458bcef7831ea0d2bdf00a60a83` |
| `components/account/useAccountRegistryWorkflow.ts` | `4131963620cd894be5b161f9d32d23901e9cbdec785fc04499a833203973b218` |
| `lib/traveller/account-registry-workflow.ts` | `72629bcfd59eaa7fe408b2b627403c0a05b044e4e82bb49ee08f26ac9ee062d0` |
| `lib/traveller/account-registry-copy.ts` | `579186a0bb6db998d570837a2a6451d8d3c468b8934745ff0e1489cf8b478ebb` |
| `lib/traveller/account-registry-workflow.test.ts` | `a892ffb301929a18b8e3b9e9ec6d5a1273be987301f339a5ea18661dc223de4e` |
| `lib/traveller/account-registry-workflow-ui.test.ts` | `2fa228529ab9b21b1acde7b6cd9971ec3b6cec9e0491797465c8d7b3685cc409` |
| `scripts/account-traveller-management-completion-1/mounted.ts` | `b59f6568a76e27a984262338b6568aab9c3b8083a2e9f03a5390cd4271d09e86` |

Alias boundary is unchanged: esbuild replaces only `@/lib/traveller/account-registry-aktionen` and `next/navigation`. LandFeld, copy, limits, card markup, and project CSS stay real. Fixtures are synthetic. A resolved refresh is not a list observation.

Focused native command, browser env unset, exit 0: 77 pass, 0 fail, 0 skipped. Files: workflow, workflow UI contract, premium registry UX, account-registry UI, document lifecycle UI, account-registry, registry input, and country UI tests. The mounted cases were absent, not skipped. The three new pure workflow tests are inside the 77.

`npm test` on this machine, exit 1:

```text
# tests 7129
# pass 7113
# fail 11
# skipped 5
# duration_ms 100884.79033
```

The 11 failures are disposable PostgreSQL suites whose first error is `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. This machine has no local PostgreSQL server binaries. Those suites are not account-registry tests. The three additional passes against the earlier local total are the new pure workflow tests. This local `npm test` is not the native CI pass. App run 40159657960 on `c7613bd6` (7232 tests, 7230 pass, 2 skips) does not apply to this head.

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

## Not verified on this head

Hosted Account, full Next.js router, Supabase, RLS, Production, Preview, and GitHub App/Auth/Vercel checks were not run for `6b094021`. The synthetic harness is not that proof. A changed valid list is a newly observed canonical snapshot. It does not identify which `router.refresh()` produced it. An unchanged valid list stays unconfirmed. There is no server read nonce.

`AppRouterInstance.refresh` in this Next version is typed `void`. The hook follows a returned thenable when one exists, which is how the harness shim reports rejection. A production `refresh()` call has no rejection to catch. The explicit reread still uses the local 4000ms deadline. That deadline does not retry a write and is not a server timeout.

## Boundary

No schema, migration, RLS, Auth, server-action, package, lockfile, workflow, or global-style change. No new runtime cost, provider, or model call. TASK and PLAN bytes are unchanged. Returning inserted ids would require editing frozen `account-registry-aktionen.ts`. That remains a later Technical-Lead task.
