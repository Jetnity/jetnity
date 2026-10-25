# R106 O — Admin Operations Evidence Lifecycle Completion 1 — REPORT

Date: 2026-10-25. Same session `bc-5996ba4c-88a4-4a2d-b1ce-d7f1a0e4d79d`, model `grok-4.7-high-fast`.

## O-R5 correction

No runtime file changed. `scripts/admin-operations-evidence-lifecycle-completion-1/run.mjs` now proves the missing matrix on the existing boards and hook.

- `get-ungueltige-200` accepts a valid report, then sends each named invalid body through `fetch` as HTTP 200. The phase becomes `historisch` only after that response settles. The original check name and `checkedAt` stay. The invalid body's `VERBOTEN-*` text does not appear. Age does not fall. The refresh control stays enabled and a following valid GET becomes `aktuell`. A 5-second tick while historical increases age and starts no GET.
- `props-ungueltig-*` is one fresh mount per body, including null, array, and empty object. A mutation observer records the phase. The accepted sequence before the recovery click is exactly `prueft`, then `fehler`. An already-true error from another body cannot satisfy the next page.
- `verweigerung-401-json-und-kaputt` is a current 401. JSON shows the server message and hides the cards. A malformed 401 shows `Nicht angemeldet.` and is not treated as an unreadable 200. A later 503 and an invalid 200 keep the latch. A permitted GET recovers after each form.
- TTL wording: `github-lauf` is created with `ttlMs: 60000`. The mounted check at exactly 60000 ms requires freshness `fresh` and `data-health-age-ms` `60000`. The next millisecond is stale. The GitHub parent is the only 300-second boundary. `domain-flights` is the provider-ops 60-second child and has the same equality assertion. No 300-second child was added.

The earlier sentence that the 300-second boundary covered the GitHub child was wrong. The 68/68 run remains valid for what it actually executed.

## Authoritative mounted proof

```text
OPERATIONS_EVIDENCE_CHROMIUM=/usr/local/bin/google-chrome node scripts/admin-operations-evidence-lifecycle-completion-1/run.mjs
```

Exit 0. 94/94. Directory `docs/evidence/admin-operations-evidence-lifecycle-completion-1/run-1792924786492/`. Head `3fb6893b2c0b4927f6e98d71e031b739a46c29c1`. Browser `148.0.7778.96` at `/usr/local/bin/google-chrome`. Viewports 320, 360, 390, 768, 1280. Root font 16px and 32px at 320. `reducedMotion: reduce`. Clock anchor `2026-10-25T02:00:00.000Z`. Opened long evidence stayed within 1px.

Digests, unchanged from the R1 runtime commit `1c1bd44f5c15716c70b413a574ee9f6ba9ae7587`:

- `SystemHealthBoard.tsx` `9903422c9275fd22e9a6fa7c76fbb60314c1e4d36f611f4f9521a029658d7a8f`
- `ProviderOpsBoard.tsx` `870cb06f5d80113926d04a9ee63c2f779e3aa870bc21124081a34a4e76aaf6c3`
- `useOperationsReport.ts` `d0e4595f7044a737bd5ae021bc43b8263ec420321df9ffe62935c04bb43e78dd`
- `operations-read-lifecycle.ts` `e4f7fc2eabd267f19ae04daa60519eaf41a4912178f5a60086cd462bb6b67751`
- `operations-report-validation.ts` `a6f71fd2eeda4eaea0ab374feaa68c3085e185a567f2fb44f81f65d32bc8ff0e`

Fixture boundary: `fetch` is a deferred window stub. It counts aborts and still lets a late resolve run. Prop validation waits only when the harness sets `window.__JETNITY_OPS_PROPS_SPERRE__`. Production does not set that and does not fetch on mount. The phase list is a harness observer, not a product field.

Preserved, not overwritten: 44/46 root and `run-1792897515407`; 46/46 `run-1792898087571`; 66/68 `run-1792923483842` and `run-1792923548638`; dirty-tree 68/68 `run-1792923593286`; authoritative R1 68/68 `run-1792923659785`. `run-1792924636541` is empty because the process was stopped before the runner wrote `result.json`.

## Other commands

| Command | Exit | Result |
| --- | --- | --- |
| `npm test` | 1 | 7130 tests, 851 suites, 7114 pass, 11 fail, 5 skipped, 100312 ms. The 11 failures are `initdb` ENOENT in the same unrelated native PostgreSQL suites. |
| `npx tsc -p tsconfig.json --noEmit --pretty false` | 0 | |
| `npm run lint` | 0 | 181 problems, 0 errors, 181 warnings. |
| `npm run check:dead` | 0 | 0 orphan. |
| `npm run check:exports` | 0 | 0 unused exports. |
| `npm run check:deps` | 0 | |
| `npm run check:api-schutz` | 0 | 12 admin routes use `requireAdminApi()`. |
| `npm run check:schema-bezug` | 0 | Existing LOCAL/UNAPPLIED RPC notes only. |
| `npm run build` | 0 | Next.js 16.4.1 compiled successfully. |

These checks ran on the R2 source. The five digested runtime files are identical to `1c1bd44f`. No new dependency, workflow, provider, model call, secret, polling, or monthly cost. CI and Preview for this head were not run.
