# V2-S3 Guest Navigation and Large Text 1 — HANDOFF

For an independent Technical-Lead exact-head review. Cursor does not Ready and does not merge.

## Identity

- Logical agent: Jetnity V2 Guest Navigation and Large Text 1 — Cursor Generation 1
- Session: https://cursor.com/agents/bc-16a84de0-d3be-44eb-9f80-f7b3cf9de306
- `run-info.originalModelName`: `grok-4.7-high-fast`
- Branch: `fix/v2-s3-guest-navigation-text-1`
- Draft PR: #1054
- Tracking: #1050. Parent: #1046
- Implementation commit: `d021358953d8a6a12c03d04ac6b2208330a25035`
- Review head: the branch tip after the docs commit that adds this handoff. Re-fetch. Do not review `d0213589` as if it were the tip.
- Base: `origin/main` `d31a16afdac5e97d4b02f4cb5824f5adc290577c`, re-fetched before this handoff, 0 behind
- Mode: `NORMAL`

## Product result

F08. `components/trips/GastCreateLink.tsx` subscribes, for a guest session only, to `GASTSPEICHER_AKTUALISIERT` and to a `storage` event for `SCHLUESSEL.aktiv` (or a storage clear). It re-reads `gastspeicherLaden()`. It does not copy `newValue` and does not post a message. Account and unknown sessions still ignore guest storage.

The event is dispatched from `schreibenVersuch` only after the active key's readback succeeds and the stored bytes changed. Queue and legacy keys do not emit it. A microtask avoids re-entering `legacyUebernehmen` on the same stack. Identical bytes do not emit it, so a later legacy retry of the same active payload does not loop.

F09. `TripWorkspaceModeNavigation` uses one column below `sm` and the existing horizontal scroller from `sm` upward. The source lock in `trip-workspace-premium-experience-3.test.ts` now expects `grid-cols-1` and rejects `grid-cols-2`.

## Tests the reviewer can re-run

```bash
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/trips/guest-nav-text-1.test.ts \
  lib/trips/gastspeicher.test.ts \
  lib/trips/create-entry.test.ts \
  lib/trips/trip-workspace-premium-experience-3.test.ts
```

The mounted file needs Playwright Chromium. It bundles the real components with production Tailwind, stubs only `next/link` and `@/lib/supabase/client`, and uses synthetic trip ids `trip-a-synthetic` and `trip-b-synthetic`. No account, no network provider, no database.

Author harness screenshots are not acceptance. They show the synthetic page at CSS 390 and 320 with root 32px: both CTAs on B, and the four labels stacked.

## R1 correction

Reviewed head `3225892807714b671e3841fbd89dc33724ecc1d7` failed required App CI because the new `before` hook called `chromium.launch` and the runner has no Playwright-managed `chromium_headless_shell`. The correction is only in `lib/trips/guest-nav-text-1.test.ts`. Playwright Chromium is still preferred. `channel: 'chrome'` runs only when that launch reports `Executable doesn't exist`. The four mounted cases stay real browser tests. There is no `test.skip`. `.github/workflows/ci.yml` was not edited.

The failed job's label was `ubuntu-latest`. During this migration window that label is Ubuntu 24.04 or Ubuntu 26.04. Both current runner-image readmes list Google Chrome. Local system Chrome `148.0.7778.96` executed all four subtests when the managed browser directory was empty.

The browser-launch correction is `1477653a2a4ced3aff3a351d3357cdc646ad5ebf`, tree `546dae1e0db48a763f7bc0ea1f2544558fe7c193`. Do not treat `32258928` as current.

On that exact commit, run `40549850593` passed. App job `122350326327` logged `guest-nav-browser kanal=chrome version=155.0.8059.39` and passed all four mounted subtests. TAP: 7483 tests, 7481 pass, 0 fail, 0 cancelled, 2 skipped. Auth job `122350326756` passed. Vercel commit status is success for deployment `3jD8x37gXUREz6j5o2LbVcJGUvqm`. That read is not a Technical-Lead PASS. Re-fetch the tip after this handoff commit and review that newer head on its own CI.

## Exact next step

Independent Technical-Lead R2 of the fetched tip. The hosted App, Auth, and Vercel success already read is exact to `1477653a`. This handoff commit is a newer head, so Root reads its own CI and Preview. Cursor stops. No follow-up slice. No Ready. No merge. `origin/main` moved to `d698ee9e3e365b09295effc1db5a4f9db165eec8` after #1043. This branch was not synced.

## Not done here

- No Ready, no merge, no base sync, no CI edit
- No `ACTIVE_WORK_STATUS.md` or `DECISIONS.md` edit
- No claim that the 11 local official-truth PostgreSQL failures were fixed or re-run on a database
- The green App, Auth, and Vercel status above are for `1477653a` only. They are not a Ready mark and not a PASS for a later docs tip
- A raw `setItem` in the writing tab still does not notify that same tab. The other tab receives the browser `storage` event and fail-closes. Successful Jetnity writers notify the writing tab through the new event
