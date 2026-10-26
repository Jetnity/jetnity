# Jetnity Dependency Patch Remediation 1 — STATUS

**Date:** 2026-10-26  
**Lane:** R109-S  
**Writer:** Jetnity Dependency Patch Remediation 1 — Cursor Generation 1  
**Session:** https://cursor.com/agents/bc-6579ee4a-5874-4701-b1b0-fd8382cde28d  
**Model:** `grok-4.7-high-fast`  
**State:** implementation committed on Draft PR #1028. Stopped for independent Technical-Lead review. No PASS, Ready, or merge.

## Result

Lockfile-only resolution is in place:

- `ws` `8.18.3` → `8.21.0`
- `source-map-js` `1.2.1` → `1.2.2`

`package.json` is unchanged. The full lock package map changes only those two version/resolved/integrity triples. Clean `npm ci` on Node v22.23.4 installed those versions once each in the npm tree. `zod` remains `3.25.76`.

## Verification at `c04dce53930092588f237644d7f20223bec71e2e`

Passed: `npm ci`, setup check, operating-mode guard, typecheck, lint, five hygiene checks, production build.

`npm test`: 7238 passed, 11 failed, 5 skipped. The 11 failures stop on missing local PostgreSQL 16 binaries or the local-proof connection guard. They are recorded in `docs/evidence/dependency-patch-remediation-1/test-failures.txt`. PostgreSQL was not installed.

`npm audit` exits 1 with 9 remaining findings. `ws` and `source-map-js` are not among them.

## Still open for Technical Lead

Exact-head review of the final documentation head. Native CI and Preview on that head. The docs commit after verification does not change `package-lock.json` blob `abffddeeea0cc1f5507280f82ebf71fd56052fa8`.

Residual, out of this edit: Next 16.4.1 ships an unversioned `next/dist/compiled/ws` whose close path is not the installed `ws@8.21.0` guard. Zod stays open. Registry `ws` latest is `8.22.0` and was not selected.

**do not mark Ready · do not merge · do not start a follow-up slice**
