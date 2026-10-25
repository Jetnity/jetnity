# Jetnity Dependency Advisory Triage 1 — Author self-review

Date: 2026-10-25. This is not a Technical-Lead PASS and not acceptance.

## Scope

The diff adds the inventory script, the evidence validator, the report, this review, the status, the handoff, and `docs/evidence/dependency-advisory-triage-1/**`. TASK V1 was not edited. `package.json` and `package-lock.json` were not edited. No install, `npm audit fix`, runtime import, Production query, or held-lane checkout was run.

## Checks I actually made

- Pinned SHA-256 and blobs matched the plan before the disposable copies were made, and the copies matched again.
- Both audit commands used the explicit include/omit sets under `env -i`. Exits were 1 with JSON.
- Watched worktree hashes, including dirty `next-env.d.ts`, were unchanged after the children. Nothing was restored.
- 23 primary GHSA payloads were retrieved. The local range comparator and the OSV id sets agreed for the 14 locked versions. OSV stayed labeled aggregator.
- `node scripts/dependency-advisory-triage-1/validate-evidence.mjs` is the evidence gate. `git diff --check` is the whitespace gate. `npm test`, lint, typecheck, and `next build` were not run, as the plan requires.

## Findings I do not want over-read

- There is no provisional P0. Impact is `partial` because the advisory condition was not shown in traced shipped code. That is a limit, not a clearance.
- Confidence `high` means the parent chains for those 42 rows were enumerated. It does not mean the vulnerable function inside the dependency was read. Zod 3's parser, realtime frame handling, and Next's source-map use were not opened. Those limits are in the uncertainty text.
- `zod@4.6.6` is a real primary patched version and a major relative to `^3.25.76`. This packet does not recommend editing it.
- The plan's unique-name count of 562 is not what the inventory script counts on the same blob. The script counts 565 path suffixes. The blob hash is the binding.
- The CI baseline file is transcribed from the accepted plan. This session did not re-download run 40202059080.
- The audit JSON did not contain the string `registry.npmjs.org`. GitHub advisory hosts were not treated as a foreign registry. The body does not prove the contacted host or an unauthenticated transport.
- Several moderate build-tool rows are provisional P2, not P1. High build-tool rows are provisional P1 from the severity/bucket table even though they are dev-exclusive.

## Residual

Deployed selection, optional sharp/SWC selection, and installed consistency stay unknown. A later lockfile edit invalidates this matrix. Author review does not move the PR to Ready.
