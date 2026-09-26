# Admin Account Counts G16/G17 Streamed State Wait 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only this streamed-state wait repair:

- `scripts/e2e/admin-account-counts-browser-flows-1/counts.mjs`
  - add `waitForAccountCountsTerminalState`
  - wait only for exact `forbidden` or `unavailable` on `/admin`
  - fail immediately on aggregates, failed copy, wrong origin/path, mismatched terminal kind, unready navigation, abort, or timeout
  - generic shell / unknown / blank remain intermediate and cannot PASS
- `scripts/e2e/admin-account-counts-browser-flows-1/flows.mjs`
  - G16 waits for forbidden, then existing `assertNoCountDisclosure`
  - G17 waits for unavailable, then existing `assertUnavailableNotZero`
  - G13/G14/G15/G18/G19 untouched
- `scripts/e2e/admin-account-counts-browser-flows-1/test.mjs`
  - required G16/G17 PASS/FAIL matrix
  - G15 immediate semantics retained
  - G18/G19 and prior browser-flow suite retained
- this slice STATUS / HANDOFF / SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`
- task status line only

Product `components/admin/home/AdminAccountCounts.tsx` and `app/(admin)/admin/page.tsx` were read and pinned, not edited. Docker cleanup, runtime npm/cache, artifact export, SQL/Auth, root package/lock/CI were not changed.

Unrelated workspace drift `next-env.d.ts` was restored and never staged.

## Product inspection (required first step)

Inspected current source before changing the browser wait:

1. `/admin` keeps the Steuerzentrale / Operative Lage shell and streams `AdminAccountCounts` as an async server component.
2. Restricted caller status and missing wrapper do not redirect away from `/admin`. They render the exact forbidden/unavailable copy inside the count component.
3. G16/G17 previously classified immediately after `domcontentloaded`. That can observe the generic shell or a partial streamed body (`unknown`) before the terminal copy commits.
4. G9/G11 already settle before async count assertions. G15 can still PASS from page-level admin denial/redirect.

That matches the real-Mac receipt: cleanup and G6–G15/G18/G19 PASS, only G16/G17 FAIL at `generic unknown page cannot become a denial PASS`. Increasing the timeout without waiting for the exact copy would still treat generic UI as a race, not a proof.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Inspect product truth first | Admin home + AdminAccountCounts copy pinned in STATUS and a controlled test |
| Do not guess / do not only raise timeout | exact-state wait; existing action/timeout budget unchanged |
| G16 wait only for current forbidden | `kind: 'forbidden'` then existing `assertNoCountDisclosure` |
| G17 wait only for current unavailable | `kind: 'unavailable'` then existing `assertUnavailableNotZero` |
| Intermediate shell later exact copy => PASS | delayed-shell helper and gate tests |
| Mismatched terminal => FAIL immediately | forbidden↔unavailable |
| Available aggregates => FAIL immediately | disclosed present/window values |
| Failed copy / wrong origin/path / unready navigation => FAIL | helper tests |
| Timeout with only generic shell | `OwnershipUncertaintyError` / bounded terminal error |
| AbortSignal => FAIL | already-aborted and mid-wait |
| Generic/intermediate UI cannot PASS | disabled/unknown/blank keep polling; assert still rejects them |
| G15 unchanged | no wait helper; delayed shell still fails immediately |
| G18/G19 unaffected | source slice + full controlled suite |
| Prior suite remains green | 42 prior tests + 10 new = **52/52 PASS** |
| No product / Docker / npm / export / Production | confirmed by diff |

## Misleading claims corrected

Helper PASS is not a real-Mac G16/G17 PASS and does not prove G6–G19 on hardware.

The generic /admin shell is a real intermediate streamed state, not a denial. This slice does not treat that shell as forbidden/unavailable and does not change product rendering.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-browser-flows-1/test.mjs` — **52/52 PASS, 0 FAIL** on this Linux agent (2.4s). Log: `/opt/cursor/artifacts/aacbf1-g16-g17-streamed-state-wait-controlled-tests.log`.

GitHub CI / Auth / Vercel Preview are not claimed on this implementation persist. Re-read those gates on the live SHA before review.

Real Mac / Playwright / Docker / official CLI / hosted Supabase / Production: **NOT RUN / NOT MUTATED**.

## Residual risks

- P0: the next authorized real Mac run is still required to prove G16/G17 now observe the streamed forbidden/unavailable copy after live /admin navigation
- P1: G16's post-restore available-count re-read still has no terminal-state wait. If the later Mac run fails only after status restoration, that is a separate available-state wait, not this denial-state slice
- P2: a later product change that removes the exact forbidden/unavailable strings will fail the source-pin test; do not loosen the predicate to arbitrary denial text
- P3: `waitForRequestsToSettle` remains a bound, not proof. PASS still requires the exact copy plus the existing disclosure asserts

## Proactive note (out of scope)

If a later real-Mac run shows G16 failing only on the active-restoration re-read, add a source-backed **available** terminal wait there. Do not broaden this denial wait to treat counts-title presence as PASS.

Traveller-context intelligence is not relevant to this admin-count harness wait.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
