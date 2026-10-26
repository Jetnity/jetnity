# Jetnity Dependency Patch Remediation 1 — PLAN

**Lane:** R109-S  
**Writer:** Jetnity Dependency Patch Remediation 1 — Cursor Generation 1  
**Date:** 2026-10-26  
**TASK V1:** immutable, blob `faae362420c57d2b7a0fac2da2c90096d75eca5c` at seed `9dfbb9bcebbbc162564d96ef1f8c661471ade547`  
**Session:** https://cursor.com/agents/bc-6579ee4a-5874-4701-b1b0-fd8382cde28d  
**Model:** `grok-4.7-high-fast` (`run-info.originalModelName`). Visible chat title set to the logical writer name. Not Auto.

## Goal

Resolve only the two compatible transitive patches named by the task and by COS018 intake comment `6412497717`:

- `ws` `8.18.3` → `8.21.0`
- `source-map-js` `1.2.1` → `1.2.2`

No Zod major move. No application, Auth, DB, provider, script, or workflow edit.

## Source check before the edit

Operating mode re-read: `NORMAL`. Local `origin/main` at inspection was `6ae344f4453b16514f9048083bb8b07396135fa2`, merge-base with the seed, branch `1 ahead / 0 behind`. Seed commit is task-only. Open PR for this lane is Draft `#1028`. Sibling R109 lanes were not open as PRs at that listing; they were not merged or rebased. Issue `#751` was re-read through the COS018 intake. Parent `#1026` and tracking `#1027` match this writer and this branch.

Primary GitHub Advisory API, re-fetched this session:

| Advisory | Affected range that covers the lock | First patched version |
| --- | --- | --- |
| [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) (high, CVE-2026-48779) | `ws` `>= 8.0.0, < 8.21.0` | `8.21.0` |
| [GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx) (medium, CVE-2026-45736) | `ws` `>= 8.0.0, < 8.20.1` | `8.20.1` |
| [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) (high, CVE-2026-93749) | `source-map-js` `>= 1.0.0, < 1.2.2` | `1.2.2` |

OSV query for the installed versions returned exactly those two `ws` ids and the one `source-map-js` id. OSV query for `ws@8.21.0` and `source-map-js@1.2.2` returned no vulnerabilities. Registry tarballs were downloaded and their SHA-512 values matched `npm view` `dist.integrity`.

Parent ranges already accept the targets: `@supabase/realtime-js@2.15.5` depends on `ws@^8.18.2`; `postcss@8.5.23` depends on `source-map-js@^1.2.1`. Each package appears once in the lock. Published engines, license, and peer metadata are unchanged, and neither target declares new dependencies. `package.json` therefore needs no override and no direct dependency.

Registry `latest` for `ws` is `8.22.0`. `npm update ws` without an exact spec would leave this task. The lockfile is pinned to the task version `8.21.0`, which is the first patched `8.x` release for GHSA-96hv-2xvq-fx4p and is above the GHSA-58qx-3vcg-4xpx fix. `source-map-js@1.2.2` is also the registry latest.

## Chosen change

Lockfile-only. Replace `version`, `resolved`, and `integrity` for `node_modules/ws` and `node_modules/source-map-js`. Leave every other package identity, `package.json` scripts, engines, direct dependencies, and the `simple-swizzle` override untouched.

## Verification intended after this plan

Clean `npm ci` on Node 22, installed-copy check, full lock-map diff, `npm test`, typecheck, lint, the five hygiene checks, and production build. `npm audit` is recorded as observed output only. No live vulnerability test. UI audit is out of scope: no mounted product surface changes.

## Out of scope

Zod `3.25.76` stays unchanged and open. Creation/import input guards belong to R109-T. Integration order S→T→A→U→K is Technical-Lead-only. This writer does not Ready, merge, or start a follow-up slice.
