# Account Booking Folder Completion 1 — local evidence

Date: 2026-10-24. Writer: Jetnity Account Booking Folder Completion 1 — Cursor Generation 1. Session `bc-a34030c7-4c19-4c9f-863f-193cfdfa34da`. Model `grok-4.7-high-fast`.

Historical `ablauf.json` blob `cd93aeefab08db4a4599df9e1582b3e1ac334691` and `montage.json` blob `7a41748c2595fdb4f04e6d18b35cb3c4139dafab` stay byte-identical. The proof-04 run is only under `v2-proof04-2026-10-24/`. This note is not a hosted RLS, PostgREST, or PostgreSQL match pass. The accepted PLAN blob `b29a5195c57c797f6252dc5863fc6c7b9f0ebac2` and TASK blob `754fc2e0d87ba0755713c174acf60723ab3d1f13` were not edited. Parent plan head: `2ceb9e3a689d9e64e2ed555833e8b302cd139116`. Reviewed implementation head `de836013e78827d66e02be501d353f3ae2cf225e` is superseded by the review-fix commit that contains this note. `origin/main` and merge-base at the fetch before this repair: `0c37d318c47a758f06634448d6e0de3856bbc6a6`. Mode `NORMAL`.

## B-P2-PROOF-04 and main integration

Executed harness head `1574adcb802cc7c0039eb9724e0a8a11191d4ed8`, tree `3f5a46d6ccf1ad31acc68bf2edf086d8f2efb1f4`. `origin/main` at that run: `9092b29c2e187bd73d644a3d85670f3ac6436be1`, tree `bc39c3b74b5cbab7c15595500ddc70a72de8826b`. The normal merge of that main into this branch had no conflict. TASK blob `754fc2e0d87ba0755713c174acf60723ab3d1f13` and PLAN blob `b29a5195c57c797f6252dc5863fc6c7b9f0ebac2` are unchanged.

The action harness now reaches a real second page, from the loader's own continuation link, before both the button search and Enter. It records the request count and a `useLayoutEffect` witness of the returned view, then waits for a new request and a later commit. `letzterSubmit`, `pushState`, and animation frames are not the oracle. Archive `aktiv` is accepted only as `trips.status=in.(draft,planned,booked)`. Card identity is the Planpunkt `punkt` value and the card `h2`, in order. Page 2 of the Alpha fixture is `Alpha Zürich`. Page 2 of the later generic fixture is exactly `Flug 1`. Back restores `history.state.href`, `wiederholenHref`, all three fields, and the 50 first-page cards. The document URL stays `about:blank`. Retry uses the filtered cursor for title `Flug`, kind `flight`, and archive `aktiv`. The 211-row loader walk still runs once.

Fresh outputs, created only because the directories did not exist:

| Command | Exit | Result |
| --- | --- | --- |
| Focused booking tests, four files | 0 | 32 pass, 0 fail |
| `ablauf.ts --ausgabe .../v2-proof04-2026-10-24/ablauf` | 0 | Chromium 140.0.7339.16, viewport 390×844, root font 16px. Bundle in a unique temp directory. |
| `npm run typecheck` | 0 | |
| `npm run lint` | 0 | 144 warnings, 0 errors |
| `check:dead` | 0 | 845 starts, 1589 reachable, 0 orphaned |
| `check:exports` | 0 | 1202 files, 0 unused exports |
| `check:deps`, `check:api-schutz`, `check:schema-bezug` | 0 | Schema check still prints the existing LOCAL/UNAPPLIED RPC notes |
| `npm run build` | 0 | Next.js 16.4.1. Compiled in 15.0s. `/account/bookings` dynamic |
| `montage.ts --ausgabe .../v2-proof04-2026-10-24/montage` | 0 | 56 measurements, overflow max 0. Static markup and production CSS. Root font 32px only at width 320. |

Local full `npm test` was not run on this head. Native CI for this head was not observed when this section was written. The action fixture is not hosted PostgreSQL, hosted RLS, or Next Router. The montage is not hydration or native zoom.

## Review repair — R105-B code review V1

Reviewed head `de836013e78827d66e02be501d353f3ae2cf225e`. Native App/Auth run `40106883570/1` was green for that head only (7201 tests, 7199 pass, 0 fail, 2 skip). That run does not make the local `npm test` failure on that head a pass, and it does not gate the repair head.

### B-P2-CODE-01

`rohWert` returns `Symbol('buchungen-parameter-wiederholt')` only when an owned parameter arrives as an array whose length is not 1. The string `wiederholt` and the single-element array `["wiederholt"]` are ordinary titles. `["Zürich","Bern"]` still fails before a query. `buchungen-abfrage.test.ts` asserts `titelMuster === '***=wiederholt'`.

### B-P2-CODE-02

`BuchungenFilter` remounts the GET form with a key of the applied `wiederholenHref` plus the applied title, kind, and archive. Reset, next, and back change that address, so a pending edit is discarded. A key of only the filter fields would miss next and back. The form still omits `weiter`. This browser proof is one document and the History API. It is not a Next App Router or RSC navigation.

### B-P2-PROOF-03

`buchungenSeitenLauf` is no longer in the runtime. Continuation is `buchungenFuerParameter` plus a synthetic interpreter of the URL that supabase-js 2.57.2 actually sent. Title matching in that store is case-sensitive `String.includes` of the decoded `imatch.***=` suffix. It is not PostgreSQL `~*`. Order and the keyset use exact timestamp text via `buchungenSchnittVergleich`. The browser bundle is the real `AccountBuchungen`. `window.buchungenSetzen` is assigned in an effect. The harness waits until that function exists.

`ablauf.json` records: search by button `titel=Alpha` drops the prior cursor; Enter `titel=Bern` sends no `or=` and no `id=gt.`; reset after an unsent Bern/flight/aktiv edit returns empty title, empty kind, and `alle`; next page shows `Flug 1` with an empty title field; back does not keep an unsent Bern edit; a second-page HTTP 500 keeps the same retry href and the retry shows `Flug 1`; an empty first page says `Noch keine bestätigten Buchungen`; a cursor of the only remaining row says `keine weitere Buchung`; the plan link is `/reisen/{trip}?ansicht=plan&punkt={item}`. The loader walk sees 211 rows, one combined title/kind/archive match past the old 200-row cut, a 51-row page whose cursor id is the 50th visible row, equal timestamps, and the null transition, with no duplicate ids. Chromium `140.0.7339.16`. No external request and no page error in that run.

### Repair commands

| Command | Exit | Result |
| --- | --- | --- |
| Focused booking tests, four files | 0 | 32 tests: abfrage 9, daten 5, mapping 11, ui 7. 0 fail. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx scripts/account-booking-folder-completion-1/ablauf.ts` | 0 | Loader and rendered actions above. Evidence `ablauf.json` blob `cd93aeefab08db4a4599df9e1582b3e1ac334691`. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx scripts/account-booking-folder-completion-1/montage.ts` | 0 | Re-executed after the production build. Overflow 0 on every recorded viewport and state. JSON blob unchanged `7a41748c2595fdb4f04e6d18b35cb3c4139dafab`. Static `setContent` and tab order. It does not click Search, Reset, next, or retry. |
| `npm run typecheck` | 0 | `next typegen && tsc -p tsconfig.json --noEmit` |
| `npm run lint` | 0 | 144 problems, 0 errors, 144 warnings. No warning names a booking file or the new harness. |
| `npm run check:dead` | 0 | 838 starts, 1579 reachable, 0 orphaned |
| `npm run check:exports` | 0 | 1197 files, 0 unused exports. `BUCHUNGEN_SEITE` is file-local. |
| `npm run check:deps` | 0 | 0 unused dependencies |
| `npm run check:api-schutz` | 0 | 12 admin routes use `requireAdminApi()` |
| `npm run check:schema-bezug` | 0 | Same pre-existing LOCAL/UNAPPLIED RPC notes. No new RPC. |
| `npm run build` | 0 | Next.js 16.4.1. Compiled in 7.3s. `/account/bookings` is dynamic. |
| `npm test` | 1 | 7092 tests, 845 suites, 7076 pass, 11 fail, 5 skipped, duration_ms 108367.870401. Three fewer tests than the `de836013` local run because the in-memory walker tests were removed. The 11 failures are the same pre-existing native PostgreSQL proofs listed below. |

Node `v22.23.4`. The repair source blobs are `AccountBuchungen.tsx` `22bb8c991e414f0aede63531c9b5bef2be0cb0bc`, `BuchungenFilter.tsx` `02e51e09b3b8dd20758eb3ed6f5c2a857852f74d`, `buchungen-abfrage.ts` `493a39b75b5bf0ca6378d903b81d0d2cf55c2caa`, `buchungen-abfrage.test.ts` `81bee03b8e906763f3ba4e04e2ee5cf48cd847ec`, `buchungen-ui.test.ts` `197fbaf518a0702d80756482bc09deaaac16d149`, `ablauf.ts` `bac00b8058a0cc1ed33df13d349aef0b18226b4c`, `flaeche.tsx` `68f0293447de0084d97f788a0f6392597fbc41c2`, `crypto-browser-stub.ts` `583b5c1e1283a30ccbf74e5da8554990bd815873`. Page, daten, mapping test, and `montage.ts` blobs are unchanged from the table below.

CI and Preview for the repair head were not observed when this section was written.

## Prior implementation head `de836013`

The table and proof classes below are the delivery evidence for `de836013e78827d66e02be501d353f3ae2cf225e`. They are not re-labeled as the repair result. The local `npm test` exit 1 on that head stays a failure.

## Source blobs at note time

| Path | git hash-object |
| --- | --- |
| `app/account/bookings/page.tsx` | `9bfb0db745675bd99a40cca75f71545fc282c042` |
| `components/account/AccountBuchungen.tsx` | `262d75a7c0602ecdefccaf7eb026e26a5f739c1e` |
| `components/account/BuchungenFilter.tsx` | `de51d033d01de73e01fc616ce4d162999c0954e9` |
| `lib/account/buchungen.ts` | `2a15645baedd10100496c71de702b15eec8543cc` |
| `lib/account/buchungen-daten.ts` | `b4335793a73a5d0af16a03d2e07f5e932fa996d2` |
| `lib/account/buchungen-abfrage.ts` | `2cd66da67311bc322bb2e89166ba4404db04021e` |
| `lib/account/buchungen-abfrage.test.ts` | `ee0d250a8103d8be49e36173483f2c64c8b5ca56` |
| `lib/account/buchungen-daten.test.ts` | `d3868629b50d45f25808cd3ae968243ffd05dd29` |
| `lib/account/buchungen.test.ts` | `0ce848ba86c392e96ae4efea1c7308422261644e` |
| `lib/account/buchungen-ui.test.ts` | `09e8655d671cd2461c9f32b6abfe4a276392bdce` |
| `scripts/account-booking-folder-completion-1/montage.ts` | `e2a2274ee41be7ff1733690e6796329937de030c` |
| `docs/evidence/account-booking-folder-completion-1/montage.json` | `7a41748c2595fdb4f04e6d18b35cb3c4139dafab` |

`app/account/bookings/loading.tsx` is unchanged. No schema, migration, workflow, dependency, or shared-contract file is in the diff.

## Commands

| Command | Exit | Result |
| --- | --- | --- |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/account/buchungen-abfrage.test.ts lib/account/buchungen-daten.test.ts lib/account/buchungen.test.ts lib/account/buchungen-ui.test.ts` | 0 | 35 tests, 4 suites, 35 pass, 0 fail, 0 skipped |
| `npm run typecheck` | 0 | `next typegen && tsc -p tsconfig.json --noEmit` |
| `npm run lint` | 0 | 144 problems, 0 errors, 144 warnings. None name the booking files. |
| `npm run check:dead` | 0 | 0 orphaned files. 835 starts, 1576 reachable. |
| `npm run check:exports` | 0 | 1197 files, 0 unused exports |
| `npm run check:deps` | 0 | 0 unused dependencies |
| `npm run check:api-schutz` | 0 | 12 admin routes use `requireAdminApi()` |
| `npm run check:schema-bezug` | 0 | Existing LOCAL/UNAPPLIED RPC notes printed. Exit 0. No new RPC. |
| `npm run build` | 0 | Next.js 16.4.1 Turbopack. `/account/bookings` is dynamic. Setup warning: no `.env` / `.env.local`. Browserslist data is 13 months old. |
| `npm test` | 1 | 7095 tests, 845 suites, 7079 pass, 11 fail, 0 cancelled, 5 skipped, duration_ms 103284.95336. The TAP stream also contains 7 `# SKIP` annotations. This note does not collapse that difference. |
| Playwright harness | 0 | See below. |

Node `v22.23.4`. Installed `@supabase/supabase-js` 2.57.2 and `@supabase/postgrest-js` 1.21.3. Playwright package range `^1.55.0`. Chromium downloaded for this run: 140.0.7339.16, Playwright build v1187. `psql` and `initdb` are absent, including `/usr/lib/postgresql/16/bin/initdb`.

## Proof classes

1. Synthetic continuation, executed on `de836013` by `buchungenSeitenLauf`. Rows 0, 1, 50, 51, and 201 are each returned once. Equal timestamps, the step onto null timestamps, and a null-only sequence were in `buchungen-abfrage.test.ts` on that head. The repair removes that walker from the runtime and covers the same cases through `ablauf.ts`. On a 51-row window the next address uses the 50th id and does not use the 51st. The comparison is exact timestamp text. It is not a PostgreSQL execution.
2. Documented `imatch` / `***=` semantics remain a citation in the accepted PLAN. Not re-executed here.
3. Installed-client serialization, executed. A recording `fetch` against `http://127.0.0.1:9` intercepts the request. No server is listening. For `*`, `%`, `_`, `\`, `"`, `'`, `a,b(c)`, `.*`, `(a|b)`, and `Zürich`, the decoded `title` parameter is `imatch.***=` plus that exact text, with no added quotes. `getAll('kind')` is one value: `in.(flight,stay,transfer,rental_car)` without `art`, and `eq.stay` with `art=stay`. The title pattern is absent from `or`. There is no `count=exact`, no `like`/`ilike`, order `booking_confirmed_at.desc.nullslast,id.asc`, and `limit=51`. These are client bytes, not a database match.
4. Local `value ~* pattern` is NOT-RUN. `psql` is absent. No JavaScript matcher is substituted.
5. Invalid cursor, repeated parameters, oversized title, unknown kind, and a foreign-filter cursor do not call the client. An unknown extra key is ignored, omitted from the first-page link, and kept on the retry address.
6. `data: null`, a thrown read, SQLSTATE `08006` with status 0, and a malformed trip are load errors. Status 0 / class 08 becomes 503 through the existing `problemAus`. A later zero-row page is `fortsetzungLeer`, not an empty account.
7. `renderToStaticMarkup` separates empty, no-match, error, invalid address, continuation end, and the plan link `/reisen/{uuid}?ansicht=plan&punkt=`.
8. Headless Chromium, executed. Browser `140.0.7339.16`. `emulateMedia({ reducedMotion: 'reduce' })`. Viewports 280, 320, 360, 390, 430, 768, 1280, and landscape 844×390. Root font is 32px at 320 and 16px otherwise. Horizontal overflow is 0 for liste, fortsetzung, leer, keine, fehler, ungueltig, and fortsetzungLeer. Tab order reaches search, kind, archive, Suchen, Filter zurücksetzen, Planpunkt öffnen, Weitere Buchungen, Erste Seite dieser Filter, and Erneut versuchen on the states where those controls exist. The empty unfiltered page has no reset link. Measurements: `montage.json`. This is CSS and root-font simulation. It is not a physical device, native zoom, screen reader, or hosted account.

## Full-suite failures

None of the 11 failures are under `lib/account` or `app/account/bookings`. They are pre-existing official-truth native PostgreSQL proofs in this environment:

- catalog hardening: disposable PostgreSQL upgrade — `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`
- native PG16 accepted-store projection — `local_proof_connection_override_forbidden`
- S1 disposable PostgreSQL 16 — `initdb ENOENT`
- current-version lookup on native PostgreSQL 16 — `local_proof_connection_override_forbidden`
- R3 native canonical URL publication — `local_proof_connection_override_forbidden`
- real disposable PostgreSQL structural proof — `NOT_VERIFIED: local PostgreSQL binaries are required`
- actual primary and composed v2 bundles — same NOT_VERIFIED assertion
- R5 native legacy and typed SQL consumers — `local_proof_connection_override_forbidden`
- M1–M4 synthetic atomic custody — `local_proof_connection_override_forbidden`
- throwaway PostgreSQL proof for the source catalog gateway — nested `initdb ENOENT`
- throwaway PostgreSQL proof for the trusted store gateway — nested `initdb ENOENT`

PostgreSQL 16 was not installed. These failures are not converted into a local `~*` pass.

## Not verified

Hosted PostgREST application of the raw `imatch` value, hosted application of the quoted keyset `.or()`, hosted RLS, any real account with more than 200 rows, `ß`/`ss` and umlaut case folding, timestamptz normalization of mixed `Z` and `+00:00` forms, native device, native zoom, and screen reader. CI and Vercel for this implementation head were not observed when this note was written. No hosted account was read.
