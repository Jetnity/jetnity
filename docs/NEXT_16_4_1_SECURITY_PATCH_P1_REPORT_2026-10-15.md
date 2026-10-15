# Next.js 16.4.1 P1 security patch — author report

Issue #950 / Draft #951, 2026-10-15. Prepared by the original Codex Generation 1 author under the immutable TASK and [TL two-test amendment](https://github.com/Jetnity/jetnity/pull/951#issuecomment-6197089734). This report records local implementation evidence. Final immutable commit/tree identities and subsequent live CI/Auth/Preview results belong to the final author comment on #951; no seed result is substituted for them.

## Security applicability

| Primary advisory | Before / fixed version | Jetnity evidence and limits |
| --- | --- | --- |
| [Image Optimization SVG RCE, CVE-2026-96889](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) | Next 16.3.8 / 16.4.1; Sharp 0.35.4 / >=0.35.5 | Five next/image import sites; three existing remote patterns preserved exactly. Qualifying Linux/glibc/runtime conditions and malicious-image reachability in Production are unverified. No exploit reproduction or compromise claim. |
| [use-cache typed-array RCE](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr) | Next 16.3.8 / 16.4.1 | App Router present, Cache Components and experimental useCache unset; no use-cache directives in the bounded source inventory. The documented prerequisite was not found. |
| [Server Actions DoS](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r) | Next 16.3.8 / 16.4.1 | Twenty existing use-server source files, including admin users, sign-out, trips and hotels. Framework prerequisite exists; authentication and validation guards are unchanged and are not claimed to eliminate the framework defect. |

The [official v16.4.1 release](https://github.com/vercel/next.js/releases/tag/v16.4.1) lists all three fixes. Registry access and exact stable availability were verified directly before edits; registry metadata/integrities are in `docs/evidence/next-16-4-1-security-patch-p1/registry.json`.

React review: [RSC RCE](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3) and [Server Functions DoS](https://github.com/react/react/security/advisories/GHSA-h3gv-c5rc-p453) name react-server-dom-parcel/turbopack/webpack, including their 19.2.8 releases, with fixes in 19.2.9 and other supported lines. Jetnity has no separately resolved react-server-dom package. Next bundles its own RSC implementations. The [official release comparison](https://github.com/vercel/next.js/compare/v16.4.0...v16.4.1) includes transport patch `a4cea6aec5da89d116b8960e113189cf51745d2f`. All **50 changed bundled RSC files** installed from npm match the Git blob identities at official release commit `7217011ac0d689026884dd28536a0c7f3c98ba77`; see `rsc-provenance.json`. The bundled React version label remains `19.3.0-canary-278794d7-20261002`; that label alone is not used as patch proof. The source comparison proves the patched bundled bytes. No evidence requires changing Jetnity's direct react/react-dom 19.2.8 pins for these advisories; Next's declared peers accept them. Direct React pins remain unchanged as required.

## Package and source results

- Exact manifest, root lock, package resolutions and installed Next/eslint-config-next: **16.4.1**. Node **22.23.3**, npm **10.9.9**, ESLint **9.39.5**, TypeScript **5.9.3**. Other direct dependencies, overrides and scripts unchanged.
- Normal `npm install --package-lock-only` regeneration, followed by successful normal `npm ci`. Lock v3 changes **40 entries including the root**, exclusively Next/its companions and Sharp's graph. No additions/removals or unrelated package changes. No npm audit fix or hand-edited integrity/resolution fields.
- Sharp **0.35.5**, all **16** locked non-libvips `@img/sharp-*` packages **0.35.5**; all **10** separately versioned libvips packages **1.3.4**. Native version floors are not inferred solely from Next's manifest.
- Actual macOS ARM64 `@img/sharp-darwin-arm64` **0.35.5** loads `lib/sharp-darwin-arm64-0.35.5.node`; its libvips package is **1.3.4**, loaded libvips reports **8.18.7**. npm ls reports Next → Sharp → host native graph without errors. Linux binaries are locked and inspected as dependency metadata locally; actual Linux loading is additionally exercised by the same audit in the unchanged CI test glob.
- `next.config.js`, `vercel.json`, all runtime source, Auth/session/RLS/headers and image allowlists remain byte-identical to baseline. No public product behavior changed. Exact source and route inventory is in the new audit evidence; no source provider, traveler data or hosted database access was performed.

## Audit and existing tests

The historical audit blob remains **`0a1f58a7fa718b73e63c4111d91b8817c6b372a2`**. It is executed read-only and returns **exit 1**, with exactly `next pin is 16.4.1, expected 16.3.8` and `eslint-config-next pin is 16.4.1, expected 16.3.8`. This is an expected dated-contract mismatch, **not a historical PASS**. The new audit rejects changed executable/config bytes, unexpected exit/stderr/error/failures, missing reports, any historical inventory/host/cache/route drift, changed Server Action source inventory, stale root/resolution/installed locks, missing applicable native graph, prereleases and unofficial/mismatched provenance. It requires the loaded native binary and Sharp version. It performs no network calls, image requests, database access or configuration writes.

Only the two permitted existing tests changed: exact Next/eslint assertions and matching labels, plus the one audit executable path. Every other assertion and test remains intact. The current audit still executes through the original `npm test` CI glob. The new namespaced adversarial suite is run separately and adds **38 passing cases** (healthy baseline plus 37 negative cases); it does not replace the full suite. After strengthening actual loaded-binary evidence, the final audit, its 38 cases, the eight existing framework/security tests and audit lint were rerun successfully.

## Original local checks

| Check | Observed result |
| --- | --- |
| npm ci | PASS, official registry/locked integrity; npm reports 18 residual findings |
| check:setup and check:setup:ci | PASS; one expected missing-env warning, no .env/.env.local present or loaded |
| check:operating-mode, first invocation | FAIL: single-branch checkout has no local main/origin-main ref for default diff. Original failure retained. Correct supported CI-style explicit base/head invocation is performed after commit and reported in final #951 receipt. No guard change. |
| typecheck | PASS |
| lint | PASS: 0 errors / 145 existing warnings |
| npm test, original unfiltered invocation | **FAIL**: 6,756 tests / 820 suites; 6,745 pass, 10 fail, 1 skip, 0 cancelled/todo |
| API protection, schema reference, dead code, exports, dependencies | All PASS |
| build (including unchanged prebuild) | PASS, Next 16.4.1 Turbopack, compiled 4.7s, 26 static pages |
| Current audit / new adversarial suite / final existing two suites | PASS / 38 of 38 / 8 of 8; no introduced skips |

All ten original full-suite failures concern unavailable local PostgreSQL 16 binaries (`initdb ENOENT` / `local_postgresql_not_available` / explicit NOT_VERIFIED assertions). Their exact test locations and sanitized errors are in `local-validation.json`. The one skip is the unchanged existing `skip: !bins` in `lib/readiness/official-truth-ch-de-application-pilot-1/database.test.ts`. No test, timeout or assertion was disabled or relaxed; no substitute database, runner or emulator was used. Original logs remain outside the repository, with digests recorded; raw logs and private paths are not published. Hosted CI must prove its actual non-skipped suite on the final material head.

## Residual risks and release disposition

Read-only npm audit returns **18 findings: 16 high / 2 moderate / 0 critical**. It no longer lists next or sharp, but still lists eslint-config-next and @next/eslint-plugin-next through existing fast-glob/micromatch dependencies, plus other pre-existing dependency paths. Full scoped summary is in `residual-audit.json`. This is not a claim that all dependency risk is fixed; unrelated upgrades are outside #950.

Local native-PG limitations, 145 lint warnings, unrelated privacy/source/DB stops and Production runtime unknowns remain. Preview metadata proves a deployment's association/state, not Production rollout, exploitability or an authenticated end-user journey. No dangerous requests, login/account mutations or protected-data probes are used to fill those gaps.

Rollback/disable plan (proposal only): if exact-head CI/Auth/Preview fails, hold this Draft and stop for TL; preserve the failed run. Before any separately authorized Production rollout, TL/PO must choose a verified fixed artifact and rollback/containment procedure. Reverting to 16.3.8/Sharp0.35.4 reintroduces the documented exposure and is not a safe automatic fallback. Disabling affected surfaces or altering image/Server Action configuration would require separate scope and authorization; no such change is made here. Keep every provider and special Owner gate unchanged. **No Ready, merge, manual deploy or follow-up slice. P1 remains open pending independently approved rollout and Production verification.**
