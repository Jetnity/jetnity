# GetYourGuide Visual Discovery Foundation 1 — REPORT

Date: 26 October 2026.
Author: Jetnity GetYourGuide Visual Discovery Foundation 1 — Cursor Generation 1.
Tracking #1038. Draft PR #1039.

## What changed

- `components/trips/AktivitaetenBereich.tsx` passes the originally requested day id into the new block and renders that block when the trip has no days. Native search and adoption are unchanged. The native invalid-day fallback to the first day remains.
- `components/trips/GetYourGuideAktivitaeten.tsx` is the visible block. The default export always uses the closed application seam. `GetYourGuidePruefFlaeche` accepts a resolver and renderer only when `herkunft` is `pruefung`.
- `lib/activities/getyourguide/freigabe.ts`, `widget.ts`, `kontext.ts` and `lebenszyklus.ts` own the closed gate, the three-field public descriptor, destination truth and generation-owned completion.
- `scripts/getyourguide-visual-discovery-1/` is a local synthetic mount. It is not a route.
- ADR-0221 and short dated pointers in `ARCHITECTURE.md` and `ROADMAP.md` say this is code-only and inactive.

## What the checks showed

Focused GetYourGuide tests, after the final component edit: 25 passed, 0 failed. Node v22.23.4. They cover closed reads, invalid day, missing stage, Bangkok city versus region, Thailand on a day, Panama without days, a city that does not become a country, multiple countries, forged and mismatched ids, repeated city occurrences, minimized trip copy, stale completion, retry, and the empty application seam.

Native `lib/activities/suchlebenszyklus.test.ts` was run with those tests before the last comment-only lifecycle capture and passed 13 tests. The lifecycle capture does not change that module. The full suite below includes it.

Mounted harness, headless Chromium, after the final component edit: exit 0. Six requests, all `http://127.0.0.1` for the local page, CSS and script. Zero GetYourGuide, Supabase, GeoNames or other external requests. Loads 7, disposals 7, aborts 7. Every recorded descriptor had only `anbieter`, `umfang` and `oeffentlicheKennung`. Viewports 320, 390, 768, 1440, 320 at 200% text and 390 at 200% text. Keyboard focus and Enter on “Was fehlt hier?”. Panama copy stays a country. A synthetic failure leaves the native idle sentence in place. Screenshots are synthetic and live under `/opt/cursor/artifacts/gyg-visual-discovery/`.

`eslint .` after the ref move: 0 errors, 175 warnings, exit 0. The warnings are existing. The only warning in a file this slice edits is `AktivitaetenBereich.tsx` calling `setEigeneTagId` inside an effect. That effect was already there and was not changed.

`check:dead`: 0 unreferenced files. `check:exports`: 0 unreferenced named exports. `check:deps`: 0 unused dependencies. `check:api-schutz`: 12 admin routes still use `requireAdminApi()`. `check:schema-bezug`: generated structures match; the same pre-existing LOCAL/UNAPPLIED Official Truth and trip RPCs are reported. No new RPC.

`npm run typecheck` (`next typegen` and `tsc --noEmit`) on the final tree: exit 0. `npm run build`: exit 0. `next-env.d.ts` was not kept as a change.

Full `npm test` on the final tree: 7350 tests, 884 suites, 7334 pass, 11 fail, 5 skipped. The 11 failures are local PostgreSQL proofs (`initdb` ENOENT, `local_proof_connection_override_forbidden`, or an explicit `NOT_VERIFIED` because local PostgreSQL binaries are absent). They are not GetYourGuide tests. The 5 skips are the existing native-PostgreSQL, CI-only and shared-layout-audit skips. This environment did not install PostgreSQL and did not point those tests at a hosted database.

No migration. No new dependency. Playwright Chromium was installed into the user cache for the harness and is not a `package.json` change. The harness uses the esbuild binary already present through `tsx`.

## Security and cost

The application path cannot be opened by env, URL, storage or a caller-supplied seam. The renderer receives three public fields. No secret, service role, provider call or trip write. No new ongoing cost.

## Honest limit

The synthetic SVG in the harness is not a GetYourGuide offer. A green harness does not mean pictured offers are available.
