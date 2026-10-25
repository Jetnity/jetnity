# R107-M report — 2026-10-25

Logical agent: **Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1**. Runtime `grok-4.7-high-fast`. Session `bc-27e5e422-852b-49c7-9b67-0fc723f13175`.

Runtime evidence head: `7c9971037f99297c1fd74bdd50c4ac3ecec41d25`. Tree `5f05ec70a639a2305c4e386ad1c0b87d170ea806`. `origin/main` and merge-base `a74c443c6be3f064f150fcf021ab6154bda325e5`. **0 behind / 10 ahead** at that commit. TASK blob `eeb1f1239e07df5d9d9bc7459c4c83918b947777`. Node `v22.23.4`. Next `16.4.1` from the production build.

This report is not Technical-Lead PASS, Ready, or merge approval.

## Behaviour

Signed-in `/reisen` calls `reisenSammlungAusParametern`. An invalid address does not call `from('trips')`. A valid address is one `lese()` of the shared summary select, archive predicate, optional literal search, optional keyset, `updated_at` descending, `id` descending, and `limit(49)`. The page shows at most 48 rows.

Repeated raw `q`, `archiv`, or `cursor` values are rejected before that read. The client and the unread envelope encode them with the same `ungueltigeAdresse`. A single valid value still uses `sammlungHref`. The collection adopts the invalid envelope when the live address is that string, including the first paint of a deep link. Until that matching envelope arrives, the previous adopted rows stay. A later valid `/reisen` object does not replace the invalid result while the URL is still repeated.

`reisenLaden()` still caps at 200. Account home and World still call it. Graph reads stay in `lib/trips/daten.ts`.

The rows on screen are the last adopted server envelope whose address equals the live URL. The draft field is separate and is not the committed search. While the live URL and that envelope differ, retry and continuation stay disabled. Search, filter, clear, and reset stay available.

Archive success is only `{ ok: true, wert: null }`. `{ ok: false, meldung }` is `returned-negative`. Everything else is `unknown`. The same-turn lock is the `sperre` ref. `listenlieferung` is `gelesen` only for an adopted list read. An invalid address or a database problem sets `nicht-gelesen` and leaves `observation` and `write` unchanged. Copy then says this address did not read a list and repeats the retained observation. It does not say the trip is absent. A later acknowledgement changes `write` only.

A same-id row with `status === 'archived'` and no `archivePreviousStatus` keeps the sentence “Diese Reise lässt sich nicht automatisch wiederherstellen, weil der frühere Status nicht belegt ist.” Wiederherstellen is not offered. The owned pending, unknown, or acknowledged feedback stays beside that sentence. Navigation does not call the action.

## Proof

Lane unit files `reisen-sammlung-abfrage.test.ts`, `reisen-sammlung-daten.test.ts`, and `trip-archive-workflow.test.ts`: 16 pass. `npm test` includes those files and the four M-EX1 retargets.

`npm test`: 7186 tests, 7170 pass, 11 fail, 5 skipped. Every failure is an existing Official Truth or native PostgreSQL suite. Five throw `local_proof_connection_override_forbidden` because this VM sets `SUPABASE_PROJECT_REF`. Four fail on `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`, two of those as a failed subtest. Two return `NOT_VERIFIED` because local PostgreSQL binaries are required. This VM has no PostgreSQL server binaries. No failure is in this lane's files.

`npm run typecheck` passed. `npm run build` passed: compiled in 8.1s, TypeScript finished in 6.7s, `/reisen` dynamic. Prebuild warned that no `.env` file is present in this VM.

`npx eslint .`: 0 errors, 181 warnings. The device-calendar `setHeute` effect remains one of those warnings.

Hygiene: `check:dead` 0 orphans; `check:exports` 0 uncalled exports; `check:deps` 0 unused; `check:api-schutz` 12 admin routes use `requireAdminApi()`; `check:schema-bezug` exit 0 with the existing LOCAL/UNAPPLIED RPC notes. No migration.

Mounted proof: `node scripts/my-trips-collection-archive-workflow-completion-1/run.mjs` on clean `7c997103`, exit 0, 15 cases, `dirty: ""`. Evidence `docs/evidence/my-trips-collection-archive-workflow-completion-1/run-7c9971037f99297c1fd74bdd50c4ac3ecec41d25.json`. The three new cases are repeated-parameter adoption, an unread invalid envelope with late success and unknown settlement, and same-id missing provenance with pending, unknown, and acknowledged feedback. Aliases replace only `next/navigation` and `@/lib/trips/archiv-aktionen`. The shim returns void and has no arrival generation. Screenshots are synthetic fixtures at 320, 390, 768, and 1440, with root font 32px.

## Limits

No hosted SQL, RLS, Auth, Production, native device, browser zoom, or screen reader run. A URL change or a new result object is an observation, not a receipt. The 8000ms lease only drops the spinner. Account home and World remain capped at 200. `Reisekarte` can still prefetch a trip URL in the real app. The harness has no app-router context, so those links do not prefetch there. Full route unmount drops archive records.
