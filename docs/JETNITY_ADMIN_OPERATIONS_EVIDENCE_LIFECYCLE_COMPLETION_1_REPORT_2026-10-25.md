# R106 O — Admin Operations Evidence Lifecycle Completion 1 — REPORT

Date: 2026-10-25. Same session `bc-5996ba4c-88a4-4a2d-b1ce-d7f1a0e4d79d`, model `grok-4.7-high-fast`.

## Implemented

- `lib/admin/operations-report-validation.ts` accepts a real collector object and its JSON form. Optional `undefined` is absent. Unknown keys, null detail, a provider `sourceUpdatedAt`, bad status, bad freshness, non-empty `writeActions`, and a TTL above the current frozen map fail closed. The raw object is not mutated.
- `lib/admin/operations-read-lifecycle.ts` owns the age floor, the non-fresh latch, and request ownership. `endlichZahl` stays private.
- `components/admin/operations/useOperationsReport.ts` is the only new client hook. It calls the existing `lade()` and one `fetch(endpunkt, { cache: 'no-store', signal })`.
- Both boards render through that hook. Card truth for the existing presentation tests lives on `SystemHealthAnsicht` and `ProviderOpsAnsicht`. The board shell is `prueft` until validation finishes. Owned wrappers use `min-w-0` and `break-words`.
- Disposable harness: `scripts/admin-operations-evidence-lifecycle-completion-1/`. It bundles the real boards with esbuild, compiles `styles/globals.css` with the project Tailwind/PostCSS setup, and drives local Chrome.

Frozen contracts were not edited: collectors, `ladezustand`, APIs, routes, status/TTL maps, Auth, AAL, RLS, package, workflow, and governance.

## Authoritative mounted proof

```text
OPERATIONS_EVIDENCE_CHROMIUM=/usr/local/bin/google-chrome node scripts/admin-operations-evidence-lifecycle-completion-1/run.mjs
```

Exit 0. 46/46. Directory `docs/evidence/admin-operations-evidence-lifecycle-completion-1/run-1792898087571/`. Head `bce903ef8c52e8aec71c14861cee6c2d77b79d22`. Browser `148.0.7778.96` at `/usr/local/bin/google-chrome`. Viewports 320, 360, 390, 768, 1280. Root font 16px and 32px at 320. `reducedMotion: reduce`. Clock anchor `2026-10-25T02:00:00.000Z`. Opened long evidence stayed within 1px (`scrollWidth == clientWidth` on each recorded case).

Digests, matched with `sha256sum` on that commit:

- `SystemHealthBoard.tsx` `68cbcadee839ebcf61e64c2febb85d79894961c7140e4209bd6c816e7bcc2014`
- `ProviderOpsBoard.tsx` `4e7885027e12997bca73488429a1dd7031dd025462b1f3234054cfe9d18a7718`
- `useOperationsReport.ts` `9cada169f013594dde28ff3ce362c052c063f925cd9bd8146c2d78863b6b65b2`
- `operations-read-lifecycle.ts` `f7f5450501e4102d912c638db4e7296028c3d6d48cca6ad0926e750c09ae040b`
- `operations-report-validation.ts` `a6f71fd2eeda4eaea0ab374feaa68c3085e185a567f2fb44f81f65d32bc8ff0e`

Fixture boundary, copied from the result: `fetch` is a deferred window stub. Synthetic prop validation waits only when the harness sets `window.__JETNITY_OPS_PROPS_SPERRE__`. Production does not set that and does not fetch on mount.

Both boards covered: valid and invalid initial props with no automatic GET; an explicit click and a keyboard activation while prop validation is still pending; one GET for two clicks; replayed props do not replace a report; endpoint change marks the visible report historical and drops the old run; permission loss drops the in-flight result and re-enable does not fetch; unmount drops a late response; newer denial beats older success and the reverse; 403 stays latched through 503, network, and invalid 200 until one permitted GET; TTL at 59999, 60000, and 60001 with an older child; rollback keeps stale; both clocks unusable after a good tick while `checkedAt` is still in the past; future parent stays non-green; tab return ages with zero GETs.

Preserved, not overwritten: root `result.json` 44/46 and `run-1792897515407` 44/46, both failing only `ttl-kind-und-ruecklauf` while the clock control was still wrong. `run-1792897569459` is an earlier 46/46 on uncommitted bytes and is not this proof.

## Other commands

| Command | Exit | Result |
| --- | --- | --- |
| `npm test` | 1 | 7126 tests, 851 suites, 7110 pass, 11 fail, 5 skipped, 130320 ms. Owned lifecycle, validation, presentation, System Health, and Provider-Ops board tests passed. |
| `npx tsc -p tsconfig.json --noEmit --pretty false` | 0 | After correcting the hook so the full report, including `writeActions`, stays the generic. An earlier `npm run typecheck` exited 2 on that mismatch. |
| `npm run lint` | 0 | 181 problems, 0 errors, 181 warnings. Same warning count as the #1003 baseline. Touched files have no new warning. |
| `npm run check:dead` | 0 | 850 starts, 1597 modules, 0 orphan. |
| `npm run check:exports` | 0 | 1207 files, 0 unused exports, after `endlichZahl` was made private. The first run exited 1 on that export. |
| `npm run check:deps` | 0 | 11 dependencies and 2 devDependencies in use. |
| `npm run check:api-schutz` | 0 | 12 admin routes use `requireAdminApi()`. |
| `npm run check:schema-bezug` | 0 | Existing LOCAL/UNAPPLIED RPC notes only. No schema edit. |
| `npm run build` | 0 | Next.js 16.4.1 compiled successfully. |

The 11 `npm test` failures are `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in unrelated native PostgreSQL suites. This VM has no PostgreSQL 16 server binaries. They are not a product regression of this lane. The five skips are pre-existing conditional browser, layout, and native-PostgreSQL guards. A skip is not a pass. CI remains mandatory.

No new dependency, workflow, provider, model call, secret, polling, or monthly cost.
