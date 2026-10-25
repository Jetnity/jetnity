# R107-M report — 2026-10-25

Logical agent: **Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1**. Runtime `grok-4.7-high-fast`. Session `bc-27e5e422-852b-49c7-9b67-0fc723f13175`.

Runtime evidence head: `ddd1f7eace34519996ec686223d684102a933baa`. Tree `b93520b622c470b208281da73092da4622e3829c`. `origin/main` and merge-base `a74c443c6be3f064f150fcf021ab6154bda325e5`. **0 behind / 7 ahead** at that commit. TASK blob `eeb1f1239e07df5d9d9bc7459c4c83918b947777`. Node `v22.23.4`. Next `16.4.1` from the production build.

This report is not Technical-Lead PASS, Ready, or merge approval.

## Behaviour

Signed-in `/reisen` calls `reisenSammlungAusParametern`. An invalid address does not call `from('trips')`. A valid address is one `lese()` of the shared summary select, archive predicate, optional literal search, optional keyset, `updated_at` descending, `id` descending, and `limit(49)`. The page shows at most 48 rows. The cursor is the last shown row's original `updated_at` text and `id`, capped at 626 unpadded base64url characters.

`reisenLaden()` still caps at `REISEN_LISTE_GRENZE` (200), keeps one authenticated query, and maps through `uebersichtAusZeilen`. Account home and World still call it. `reiseLaden` and `accountGraphLesen` stay in `lib/trips/daten.ts`.

Search walks the trimmed needle, escapes `\ . + * ? ^ $ ( ) [ ] { } |` for POSIX `~*`, then quotes the result. The emitted filter is `title.imatch."...",origin.imatch."..."`. The UI says the search looks at title and origin. It does not explain `imatch`, case, or collation.

The collection stays mounted across search, archive filter, cursor, empty, no-match, and read-error results. There is no request key. Guests do not mount it. Leaving the route drops client archive records.

Navigation uses `useSearchParams()`, the server result object, and the previous observed URL. The visible intent is React state. A stale timer or `catch` clears only its own `intentId`. While the live URL and the adopted result differ, retry and continuation stay disabled. Search, filter, clear, and reset stay available. Continuation is a button. The proof recorded `prefetch` 0. `Reisekarte` still imports `next/link`. In production a card can prefetch the trip page. That is existing card behaviour, not a collection page read. The harness has no app-router context, so those links do not prefetch there.

Archive success is only an object whose own keys are `ok` and `wert`, with `ok === true` and `wert === null`. `{ ok: false, meldung }` is `returned-negative` and is not rollback proof. Everything else is `unknown`. The same-turn lock is the `sperre` ref. A later list updates observation only.

## Proof

Focused `node:test` files for the query, the 251-row reader seam, the mapper, the archive classifier, and the four M-EX1 retargets passed (100 tests in the combined run; the reader file passed again after `reisenSammlungLaden` became the direct seam).

`npm test`: 7170 pass, 11 fail, 5 skipped. Every failure is `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT` in existing Official Truth tests. This VM has no PostgreSQL 16. Those failures are not in this lane's files.

`npm run typecheck` passed before the navigation rewrite. `npm run build` passed after it: compiled in 16.0s, TypeScript finished, `/reisen` dynamic. The repo's prebuild check warned that no `.env` file is present in this VM.

`npx eslint .`: 0 errors, 181 warnings. The new warning is `react-hooks/set-state-in-effect` on `setHeute(heutigesDatum())`. The effect stays so the server render and the first client render agree, and the device calendar is applied after hydration. The archive observation update is a render-time adjustment instead of an effect.

Hygiene: `check:dead` 0 orphans; `check:exports` 0 uncalled exports; `check:deps` 0 unused; `check:api-schutz` 12 admin routes use `requireAdminApi()`; `check:schema-bezug` exit 0 with the existing LOCAL/UNAPPLIED RPC notes. No migration.

Mounted proof: `node scripts/my-trips-collection-archive-workflow-completion-1/run.mjs` on clean `ddd1f7ea`, exit 0, 12 cases. Evidence `docs/evidence/my-trips-collection-archive-workflow-completion-1/run-ddd1f7eace34519996ec686223d684102a933baa.json`, `dirty: ""`. Aliases replace only `next/navigation` and `@/lib/trips/archiv-aktionen`. The shim returns void and has no arrival generation. Screenshots are synthetic fixtures at 320, 390, 768, and 1440, with root font 32px. The dense page has the `Ohne Datum` heading and does not keep `data-reisen-kalender="wartet"`.

## Limits

No hosted SQL, RLS, Auth, Production, native device, browser zoom, or screen reader run. A URL change or a new result object is an observation, not a receipt. The 8000ms lease only drops the spinner. Fixture order is exactly-once for an unchanged `updated_at`. A live row can move. `~*` can disagree with `toLocaleLowerCase('de-CH')`. `NULL` origin does not match. Full route unmount drops archive records. Account home and World remain capped at 200. Card-link prefetch of a trip page is unchanged `Reisekarte` behaviour.

## Security and cost

No new provider, secret, index, payment, or hosted service. One bounded read of at most 49 rows replaces the 200-row read on `/reisen` only. Noindex stays. The USD 100 boundary is unchanged. Auth remains `getUser()` plus RLS. Invalid input is rejected before the query. The archive write still checks status and `updated_at`. No citizenship, document, or residence field is read or written.

## Outside this lane

Trip traveller relation-loss stays with lane T. Dependency advisory triage stays with lane S. This lane did not integrate sibling branches.
