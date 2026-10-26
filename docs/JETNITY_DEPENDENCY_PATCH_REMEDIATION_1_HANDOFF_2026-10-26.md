# Jetnity Dependency Patch Remediation 1 — HANDOFF

**Date:** 2026-10-26  
**Next actor:** Technical Lead, for independent exact-head review. Cursor does not Ready or merge.

## Identity

- Logical writer: **Jetnity Dependency Patch Remediation 1 — Cursor Generation 1**
- Session: https://cursor.com/agents/bc-6579ee4a-5874-4701-b1b0-fd8382cde28d
- Model: `grok-4.7-high-fast` (`run-info.originalModelName`). Chat title renamed to the logical writer name. Not Auto.
- Branch: `fix/r109-dependency-patch-remediation-1`
- Draft PR: https://github.com/Jetnity/jetnity/pull/1028
- Tracking: https://github.com/Jetnity/jetnity/issues/1027
- Parent: https://github.com/Jetnity/jetnity/issues/1026
- TASK blob: `faae362420c57d2b7a0fac2da2c90096d75eca5c` (not edited)

## Fresh evidence correction

Technical Lead reviewed implementation head `c04dce53930092588f237644d7f20223bec71e2e` and required the installed-copy evidence to separate the patched npm resolutions from `next/dist/compiled/ws`. This handoff is that correction. `package.json`, `package-lock.json`, and Next `16.4.1` are unchanged by it.

Fetched `origin/main` again on 2026-10-26 before this correction. `origin/main` and the merge-base were still `6ae344f4453b16514f9048083bb8b07396135fa2`. The branch head at that fetch was `e7ea95158993c181dd34bee0b64e4b6553199f11`, **0 behind / 3 ahead**. No rebase and no sibling merge.

| Ref | SHA |
| --- | --- |
| `origin/main` / merge-base | `6ae344f4453b16514f9048083bb8b07396135fa2` |
| lockfile implementation head | `c04dce53930092588f237644d7f20223bec71e2e` |
| prior docs head | `e7ea95158993c181dd34bee0b64e4b6553199f11` |
| `package-lock.json` blob | `abffddeeea0cc1f5507280f82ebf71fd56052fa8` |

The correction commit that contains this file does not change that lockfile blob. Confirm with `git diff c04dce53930092588f237644d7f20223bec71e2e HEAD -- package-lock.json package.json`.

## Changed files

- `package-lock.json`
- `docs/JETNITY_DEPENDENCY_PATCH_REMEDIATION_1_PLAN_2026-10-26.md`
- `docs/JETNITY_DEPENDENCY_PATCH_REMEDIATION_1_STATUS_2026-10-26.md`
- `docs/JETNITY_DEPENDENCY_PATCH_REMEDIATION_1_REPORT_2026-10-26.md`
- `docs/JETNITY_DEPENDENCY_PATCH_REMEDIATION_1_SELF_REVIEW_2026-10-26.md`
- `docs/JETNITY_DEPENDENCY_PATCH_REMEDIATION_1_HANDOFF_2026-10-26.md`
- `docs/evidence/dependency-patch-remediation-1/`

`package.json` unchanged.

## Tests and commands

Node v22.23.4, npm 10.9.7. Details in `docs/evidence/dependency-patch-remediation-1/verification.json`.

Passed: `npm ci`, `check:setup:ci`, `check:operating-mode`, `typecheck`, `lint`, `check:api-schutz`, `check:schema-bezug`, `check:dead`, `check:exports`, `check:deps`, `build`.

`npm test` exit 1: 7238 pass, 11 fail, 5 skipped. All 11 failures are local PostgreSQL 16 absence (`initdb` ENOENT, `local_proof_connection_override_forbidden`, or explicit `NOT_VERIFIED`). Excerpt: `docs/evidence/dependency-patch-remediation-1/test-failures.txt`.

`npm audit` exit 1: 9 remaining advisories, none of them `ws` or `source-map-js`. Summary: `docs/evidence/dependency-patch-remediation-1/npm-audit-summary.json`.

## Browser

Not run. No product UI changed. The task also forbids a personally signed-in browser session.

## Checked / not checked

Checked: advisory API, OSV, registry tarball integrity, full lock map, clean install, npm tree, installed npm copies, the separate `next/dist/compiled/ws` manifest and SHA-256, the baseline/hot-reloader/prod-bundle source sites, a local baseline load check on Node v22.23.4, typecheck, lint, hygiene, build, audit output, `origin/main` drift.

Not checked: hosted DB/RLS, Production alias, real accounts, provider calls, live attack behavior, browser/device, sibling branch contents, deployed loading of `compiled/ws`. The bundle version and its advisory disposition are UNKNOWN.

## Findings

- **P0:** none.
- **P1:** none introduced. Pre-existing Zod `3.25.76` / GHSA-mrhx-c7xc-m3w5 stays open. R109-T owns creation/import input guards. This lane does not migrate Zod.
- **P2:** `next/dist/compiled/ws` remains inside frozen Next `16.4.1`. Manifest name `ws`, no version field, `index.js` 45,840 bytes, SHA-256 `af354cb13a11abe910cdbcb70943cb450b01b24f322026ae3f88d428d148395d`. It is outside the lock map and `npm ls`. Version UNKNOWN. Advisory disposition UNKNOWN. Local Node v22.23.4 loads it through the baseline getter only after native `WebSocket` is removed; with native `WebSocket` present, that require stays out of the cache. Dev hot-reloader modules import it and were not executed. Deployed reachability UNKNOWN. Evidence: `docs/evidence/dependency-patch-remediation-1/bundled-ws-residual.json`.
- **P3:** registry `ws` latest is `8.22.0`. Not taken, because the task names `8.21.0`. OSV listed no advisory for `8.21.0`. The other eight non-Zod audit packages stay out of scope.

## CI / Preview

GitHub Actions run [40305882452](https://github.com/Jetnity/jetnity/actions/runs/40305882452) completed with conclusion **success** for head `87b1522b5a30033b51969afd065a9e215104030f`.

| Job | Conclusion |
| --- | --- |
| Auth-Konfiguration gegen config.toml | success, 2026-10-26T10:16:02Z–10:16:39Z |
| Typecheck, Lint & Build | success, 2026-10-26T10:16:02Z–10:35:45Z, including the Tests step and Production build |

Earlier Actions runs on this branch were cancelled when later pushes arrived. The job log also shows existing annotation warnings (Node.js 20 action runtime deprecation, and lint notes in files this lane did not change). Those annotations did not fail the jobs.

Vercel commit status on that same SHA: **success**, description "Deployment has completed", updated 2026-10-26T10:15:18Z, inspector https://vercel.com/jetnity-e1b93c82/jetnity-app/9oRvtCQdqzKihYxzD6LP1c755nPs. The check "Vercel Preview Comments" also succeeded. This is a Preview deployment for the PR head at that moment, not Production acceptance and not a Technical-Lead PASS.

`origin/main` was fetched again after that run: still `6ae344f4453b16514f9048083bb8b07396135fa2`, merge-base unchanged, **0 behind / 4 ahead** at `87b1522b`. The commit that records this CI result is docs-only. The success stays bound to `87b1522b` and lock blob `abffddeeea0cc1f5507280f82ebf71fd56052fa8`. Confirm the lockfile is unchanged with `git diff 87b1522b5a30033b51969afd065a9e215104030f HEAD -- package-lock.json package.json`.

## Gate

Draft. Independent exact-head review by Technical Lead. Then only Technical Lead may PASS, Ready, or merge. Planned integration remains S→T→A→U→K and is not started here.

**do not mark Ready · do not merge · do not start a follow-up slice**
