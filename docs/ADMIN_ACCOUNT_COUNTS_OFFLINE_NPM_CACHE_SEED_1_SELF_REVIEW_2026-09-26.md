# Admin Account Counts Offline npm Cache Seed 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only this correction:

- `scripts/e2e/admin-account-counts-local-runtime-1/npm-cache-seed.mjs`
  - discover local `<original HOME>/.npm/_cacache` only
  - copy into run-owned `NPM_CONFIG_CACHE/_cacache`
  - refuse URL/remote/outside-HOME/symlink/nested-symlink sources
  - bound files/bytes; never modify the user source cache
  - validate lockfile HTTPS npm-registry integrity before install
  - keep install env offline + ignore_scripts + private cache
- `scripts/e2e/admin-account-counts-local-runtime-1/app.mjs`
  - `prepareAppForLaunch` seeds before locked `npm ci`
- `scripts/e2e/admin-account-counts-local-runtime-1/runtime.mjs`
  - pass `leseOriginalHome()` and `owned.privateHome`
  - original HOME is not placed into the child env
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
  - 16 required proofs plus the prior 61-test suite
- this slice STATUS / HANDOFF / SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`
- task status line only

`env.mjs`, Docker shim, official CLI archive/binary bytes, Docker Desktop/daemon settings, product/Auth/SQL/migrations, root package/lock/CI were not changed.

Unrelated workspace drift `next-env.d.ts` was restored and never staged.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Copy only local `~/.npm/_cacache` | `discoverSourceCacache` joins original HOME + `.npm/_cacache` |
| Never copy `.npmrc` / logs / auth | walk stays inside `_cacache`; refused names are skipped |
| Source remains byte-identical | no write/chmod/prune of source; hash-tree test |
| Source / nested symlink refused | `lstat` + path-component checks fail closed |
| Outside-HOME source refused | explicit `sourceCacache` must stay under original HOME |
| Byte/file cap | 100_000 files / 4 GiB default; tests use tiny caps |
| Missing integrity fail closed | lockfile validator requires `sha512\|256\|1-` |
| HTTP/git/file/custom fail closed | protocol and host checks before copy |
| HTTPS npm-registry lockfile passes | fixture + real `package-lock.json` (611 registry tarballs) |
| Destination under private HOME | dest is `NPM_CONFIG_CACHE/_cacache` under `owned.privateHome` |
| Install env uses only private cache | `assertOfflineLockedInstallEnv` plus fake-npm receipt |
| offline / ignore_scripts remain | required `true`; `--prefer-online` refused |
| Fake npm sees private cache only | receipt cache/home are private; no userconfig/source hint |
| Missing package stays ENOTCACHED | fake npm exits 1; no retry/fetch |
| Prior suite stays green | 61 previous + 6 new = 67/67 PASS |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a real-Mac PASS and does not prove the next live `npm ci` has every lockfile tarball in the Product Owner's local cache.

The cited Mac failure receipt path is not present in this checkout. That absence is recorded; it is not treated as a new Production or hosted incident.

This writer did not run `run.mjs`, official binaries, Docker, Playwright, or any registry fetch.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **67/67 PASS, 0 FAIL** on this Linux agent (14.5s). Log: `/opt/cursor/artifacts/aaclr1-offline-npm-cache-seed-controlled-tests.log`.

Exact `318dbefe` GitHub CI run `36250359496` SUCCESS, Auth job `108427163277` SUCCESS, Vercel Preview `FYizaAyjM9WPRM14svo61jgajQvx` READY. Re-read those gates on any later head.

Real Docker / official CLI / user's Mac / hosted Supabase / Production: **NOT RUN / NOT MUTATED**.

## Residual risks

- P0: the next authorized real Mac run is still required to prove live locked `npm ci` now resolves from the seeded private cache after the local stack starts
- P1: the Product Owner's entire `~/.npm/_cacache` is copied, including packages from other projects. That matches the authorized design. If that tree exceeds 4 GiB or 100_000 files, the run fails closed instead of fetching
- P2: seed completeness is npm's job. A local cache that never downloaded this lockfile will still `ENOTCACHED`. That is truthful, not a license to enable network
- P2: `leseOriginalHome()` reads the harness-process `HOME`, not the isolated child `HOME`. That is intended. A hostile parent `HOME` still has to be a local non-symlink directory under which `.npm/_cacache` exists
- P3: source-text pins on `runtime.mjs` catch the originalHome/privateHome hook; they do not execute `defaultStartRuntime` through app install

## Proactive note (out of scope)

Copying the whole user `_cacache` is the authorized smallest repair. A later dedicated slice could copy only lockfile-required cacache keys after hashing the resolved tarball integrity into npm content-address paths. That would shrink the copy and the cap risk. Do not start that here, and do not replace it with a registry fetch.

Traveller-context intelligence is not relevant to this local harness cache-seed repair.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
