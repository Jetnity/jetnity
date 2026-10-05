# Admin Account Counts Docker Cleanup Absent Messages 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only this correction:

- `scripts/e2e/admin-account-counts-local-runtime-1/stack.mjs`
  - keep historical `No such container|object|volume|network: <exact>` ABSENT
  - accept Docker Desktop `get <exact>: no such volume` and `network <exact> not found`
  - escape and bound the resource name so a different or hyphen-suffixed name cannot PASS
  - treat `Error response from daemon: <detail>` as surrounding prefix, not unavailability
  - keep genuine daemon/permission/timeout/JSON/context failures UNKNOWN
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
  - one focused regression covering the 11 required cases
  - prior helper suite retained
- this slice STATUS / HANDOFF / SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`
- task status line only

`run.mjs`, browser/evidence modules, Docker shim, official CLI archive/binary bytes, Docker Desktop/daemon settings, product/Auth/SQL/migrations, root package/lock/CI were not changed.

Unrelated workspace drift `next-env.d.ts` was restored and never staged.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Exact Desktop container no-such-container | existing container form plus CLI envelope prefix |
| Different container id | name-bounded; other id stays UNKNOWN |
| Exact `get <volume>: no such volume` | new volume form |
| Different volume | other name and `name-extra` stay UNKNOWN |
| Exact `network <name> not found` | new network form |
| Different network | other name and `name-extra` stay UNKNOWN |
| Daemon / permission / timeout stay UNKNOWN | hard-unknown check remains first |
| Historical absent forms remain PASS | container/object/volume/network forms kept |
| Already-absent stop/remove can reach stopped=true | Desktop forms through `stoppeOwnedStack` |
| Foreign / unresolved still block | live foreign inspect / generic unresolved inspect unchanged |
| No generic `not found` | bare `<name> not found` stays UNKNOWN |
| Entire helper suite green | **79/79 PASS** |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a real-Mac PASS and does not prove the next live cleanup on Docker Desktop.

The cited Mac cleanup receipt path is not present in this checkout. That absence is recorded; it is not treated as a new Production or hosted incident.

Missing desktop/mobile browser screenshots from the same Mac run remain independently open. This slice did not change evidence/export behavior.

This writer did not run `run.mjs`, official binaries, Docker, Playwright, or any registry fetch.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **79/79 PASS, 0 FAIL** on this Linux agent (14.2s). Log: `/opt/cursor/artifacts/aaclr1-docker-cleanup-absent-messages-controlled-tests.log`.

GitHub CI / Auth / Vercel Preview are not claimed on this implementation persist. Re-read those gates on the live SHA before review.

Real Docker / official CLI / user's Mac / hosted Supabase / Production: **NOT RUN / NOT MUTATED**.

## Residual risks

- P0: the next authorized real Mac run is still required to prove cleanup now classifies Desktop already-absent volume/network forms as ABSENT and can reach Docker services stopped
- P1: missing browser screenshots from `aaclr1-20260926T182151Z` remain a separate evidence defect and must not be hidden by a green cleanup classifier
- P2: a later Docker Desktop wording change that is not one of the exact accepted forms will still be UNKNOWN. That is intended
- P3: the Docker CLI envelope is now treated as prefix text. Genuine `Cannot connect to the Docker daemon` / `daemon is not running` / `Is the docker daemon running` remain UNKNOWN

## Proactive note (out of scope)

Do not fold the missing browser screenshot/export work into this PR. The Mac run already proved that cleanup and evidence are separable; keeping them separate preserves the true remaining defect.

Traveller-context intelligence is not relevant to this local harness classifier repair.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
