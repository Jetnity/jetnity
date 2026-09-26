# Admin Account Counts macOS Private HOME Canonicalization 1 — SELF_REVIEW

This is author self-review, not an independent Technical-Lead PASS.

## Scope

Owned only this correction:

- `scripts/e2e/admin-account-counts-local-runtime-1/npm-cache-seed.mjs`
  - keep `assertLocalNonSymlinkDirectory()` strict for original HOME and source `_cacache`
  - add a distinct run-owned private-HOME contract
  - accept visible/canonical ancestor alias above the owned root
  - refuse the private HOME itself being a symlink
  - refuse every symlink/escape inside the private HOME
  - validate dest/cache with visible suffix + canonical root relation
  - keep npm offline; no `.npmrc`/auth/logs/network
- `scripts/e2e/admin-account-counts-local-runtime-1/test.mjs`
  - eleven required canonicalization proofs
  - prior #568 cache-seed tests retained
- this slice STATUS / HANDOFF / SELF_REVIEW
- `docs/ACTIVE_WORK_STATUS.md`
- task status line only

`run.mjs`, `env.mjs`, Docker shim, official CLI archive/binary bytes, Docker Desktop/daemon settings, product/Auth/SQL/migrations, root package/lock/CI were not changed.

Unrelated workspace drift `next-env.d.ts` was restored and never staged.

## Review mapping

| Requirement | Correction |
| --- | --- |
| Original HOME / source cache stay strict | `leseOriginalHome` / `discoverSourceCacache` still use `assertLocalNonSymlinkDirectory` and `realpath === visible` |
| Separate run-owned helper | `assertRunOwnedPrivateHome` is distinct and is the only private-HOME entry |
| Accept alias above owned root | visible != canonical is allowed only after lstat proves the final HOME entry is a real directory |
| Do not hard-code `/var` or username | alias is detected via realpath/basename identity, not path prefixes |
| Private HOME itself is a symlink | lstat fail-closed |
| Symlink inside private HOME | `assertNoRunOwnedSymlinkComponents` uses lstat, including broken links |
| Lexical visible containment first | `pathIsUnderRoot(path, visibleRoot)` before suffix/canonical checks |
| Same relative suffix under canonical root | `assertRealPathMatchesVisibleSuffix` |
| Missing dest uses nearest ancestor | `nearestExistingAncestor` + same suffix relation |
| Post-copy symlink/escape refused | mkdir/copy re-check contained path after create |
| Env stays visible-path based | `HOME` / `NPM_CONFIG_CACHE` remain the visible run-owned paths |
| npm offline / no auth/logs | #568 seed/lockfile/install-env rules unchanged |
| Prior #568 tests stay green | tests 62–66 and 78 plus earlier suite |
| Entire helper suite green | **78/78 PASS** |

## Misleading claims corrected

`codeCompleteClaim` remains false. Helper PASS is not a real-Mac PASS and does not prove the next live `npm ci` has every lockfile tarball in the Product Owner's local cache.

The cited Mac failure receipt path is not present in this checkout. That absence is recorded; it is not treated as a new Production or hosted incident.

This writer did not run `run.mjs`, official binaries, Docker, Playwright, or any registry fetch.

## Tests actually run

`node --test scripts/e2e/admin-account-counts-local-runtime-1/test.mjs` — **78/78 PASS, 0 FAIL** on this Linux agent (14.7s). Log: `/opt/cursor/artifacts/aaclr1-macos-private-home-canonicalization-controlled-tests.log`.

GitHub CI / Auth / Vercel Preview are not claimed on this implementation persist. Re-read those gates on the live SHA before review.

Real Docker / official CLI / user's Mac / hosted Supabase / Production: **NOT RUN / NOT MUTATED**.

## Residual risks

- P0: the next authorized real Mac run is still required to prove the seed now accepts the tmpdir alias and that live locked `npm ci` then resolves from the seeded private cache
- P1: a later real Mac cache larger than 4 GiB / 100_000 files still fails closed and needs a later size-decision, not a network fallback
- P2: seed completeness remains npm's job. A local cache that never downloaded this lockfile will still `ENOTCACHED`. That is truthful
- P2: original HOME stays strict. If a later host presented the user's HOME through a similar ancestor alias, source discovery would still fail closed. That is intended; do not reuse the run-owned helper for untrusted source material
- P3: basename equality is an extra identity check, not a `/var` special case. It matches the macOS tmpdir alias and the Linux ancestor-symlink fixture

## Proactive note (out of scope)

The next authorized Mac rerun should still be treated as the first live proof of #568+#569 together. If that run then fails only on incomplete `_cacache` (`ENOTCACHED`), that is a cache-completeness fact, not a license to enable network.

Traveller-context intelligence is not relevant to this local harness path-canonicalization repair.

## Not claimed

Author does not claim TL PASS, Ready, merge, hosted parity, real-Mac acceptance, or full local execution.
