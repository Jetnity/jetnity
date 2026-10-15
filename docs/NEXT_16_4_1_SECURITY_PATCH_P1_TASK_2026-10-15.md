# Jetnity Next.js 16.4.1 Security Patch P1 — immutable TASK
Date: 2026-10-15 (Europe/Zurich)  
Issue: [#950](https://github.com/Jetnity/jetnity/issues/950)  
Code author: **Jetnity Next.js 16.4.1 P1 Security Patch 1 — Codex Generation 1** (new, actual session not yet assigned).  
Baseline: `main@10fdee40c3e4fcc7dffb6515dda5acf1db391aed`, tree `e5c899c3a5465fc5dc02b4738184c9cb8eff6bb3`, operating mode NORMAL.  
Branch: `security/next-16-4-1-emergency-p1`.  
Draft PR: established by TL after creating this TASK-only seed.  
This TASK is **IMMUTABLE** once published. Code owner must not modify it.

## A. Security impetus — actual vendor advisories
Guardian #748 [COS-20261015-0757-014](https://github.com/Jetnity/jetnity/issues/748#issuecomment-6185540871), independently checked:
- [GHSA-2464-fhr4-w9xw](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw): Image Optimization SVG RCE on qualifying glibc Linux, CVE-2026-96889, fixed `next 16.4.1`; `sharp>=0.35.5` is upstream workaround.
- [GHSA-673q-mjm6-r5xr](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr): `use cache` typed-array RCE under particular App Router Cache Component usage, fixed `16.4.1`.
- [GHSA-p3m5-59mp-jv5r](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r): App Router Server Actions DoS, fixed `16.4.1`.
Main pins `next=16.3.8`, `eslint-config-next=16.3.8`, `react=react-dom=19.2.8`; lock `sharp=0.35.4`, native `@img/sharp-linux-x64=0.35.4`. App has actual `'use server'` actions and image remotePatterns. No proven production compromise/RCE; code scan alone cannot establish Vercel glibc/PIE runtime/exploitability.

Current actual Production alias `jetnity.com` → `dpl_8Z8LAGvkSEhvdZVZUcwAi2LSprND`, target=production, READY, git main exact baseline, Vercel LAMBDAS/Node22 metadata. This is not proof of package/native runtime contents beyond deployed Git build and needs post-upgrade verification.

## B. Mandatory BEFORE editing dependencies
1. Reconstruct live main, mode, #751, newest relevant #748, open drafts, exact branch/Task, no new competing security writer. Confirm previous 30 Sep security upgrade work is historical, not a current branch.
2. Verify exact stable `next@16.4.1` and `eslint-config-next@16.4.1` and a fixed `sharp@0.35.5` are **actually available via official npm registry** in the legitimately permitted task workspace before editing. Read vendor patched-version ranges, constraints and native `sharp` dependency range. If registry/setup access denied, STOP: no alternate access/proxy/context, no guessed pins or cached unverified claims.
3. Inspect current `package.json`, `package-lock.json`, `next.config.js`, `app/(admin)/admin/users/actions.ts`, `app/auth/sign-out.ts`, `lib/trips/aktionen.ts`, `lib/hotels/aktionen.ts` and other active server actions, `'use cache'`, `next/og`, dynamic image/remotePatterns code and prior read-only `scripts/next-16-3-8-security-upgrade-1-audit.mjs`. Do not claim every vulnerability is reachable if requirements are unknown.
4. Check whether React/ReactDOM `19.2.8` or `react-server-dom-*` require independent patch per actual React/Next primary advisory. **Default no React direct pin change**; if materially required, STOP for scoped TL arbitration first, never silently introduce an upgrade outside authorized contract.

## C. One strictly limited dependency patch
- `package.json`: exact stable `next=16.4.1` and `eslint-config-next=16.4.1`, preserve all other pins/overrides unless distinct scoped TL approval granted.
- `package-lock.json`: deterministically regenerate from the unchanged baseline plus these exact two pins, using official registry/lock semantics; actual `next` must be16.4.1, `eslint-config-next`16.4.1, **all lockfile resolutions of installed `sharp` and applicable optional `@img/sharp-*` packages >=0.35.5**. If Next/lock keeps vulnerable `sharp`, STOP, propose exact minimal dependency override separately. Do not claim merely a new Next pin guarantees the lock/native runtime fixed.
- No packages outside narrow dependency graph, unrelated dependency housekeeping, npm audit fix, canary, new API key, provider, hosting upgrade, Vercel setting, `next.config.js` change or static patch to suppress an audit.
- Allowed supporting **new** namespaced read-only audit/tests: `scripts/next-16-4-1-security-patch-p1/**`, only if truly needed to pin patched versions and effective lock; avoid repeating existing audits.
- Allowed new status/evidence artifacts only: `docs/NEXT_16_4_1_SECURITY_PATCH_P1_{PLAN,REPORT,SELF_REVIEW,HANDOFF}_2026-10-15.md`, `docs/evidence/next-16-4-1-security-patch-p1/**` JSON/text sanitized summary. No raw/plaintext/gzip logs, file-system personal paths, screenshots, archived HTML or secrets. Other files **FORBIDDEN**. This TASK is immutable. Existing version assertion in tests requires STOP for a narrow amend, never stealth test relaxation.

## D. Proof
- Vendor patch applicability matrix (pre/post versions and code/host conditions) with attribution. Read-only route/runtime inventory including genuine active server action. Identify Vercel-specific unknowns without new setting or traffic probes.
- Exact npm pin + lockfile assertions including `sharp` optional natives; guard against accidental version reversion. Preserve image configuration, auth/session/RLS/sensitive headers and package overrides; compare to main.
- Run `npm ci`, setup/mode/typecheck/lint/tests/API/schema/dead/exports/deps/build without reducing assertions/timeouts. Existing local Mac/native-PG variance must not be hidden as PASS. No unauthorized bypass/alternate execution if sandbox safety blocks; document and rely on normal independent exact-head CI when available.
- Read actual CI Verify and Auth jobs and original safe summaries on new material SHA, all required step completion and non-skipped Auth55/243; Preview exact SHA READY (no user-facing changes). No production claims from Preview. Publish sanitized immutable identities, test counts, security scope, original failures, mitigation residuals and manual rollback/disable plan.
- No runtime exploitation reproduction, no unauthenticated probes or replay of dangerous payloads, no source/DB request.

## E. Protected existing gates
- Research Engine Draft [#949](https://github.com/Jetnity/jetnity/pull/949) author delivered code-only, independent TL review pending. Do not edit, Ready, merge, cherry-pick, rebase, or adopt PR #949. Priority **P1 fix first**. If main/PR baseline shifts, STOP for TL arbitration.
- Official Truth [#917](https://github.com/Jetnity/jetnity/issues/917) SOURCE_NOT_QUALIFIED, application availability FALSE/provider OFF. [#944](https://github.com/Jetnity/jetnity/issues/944) BP1 live GET not permitted; no BMDS/alternate contact, PO expressly declined. No Supabase action, no replay, query rewrite, alternate tool/user/project/connection, DEV-PREP-1 first apply response SUCCESS/readback platform-safety BLOCKED, second NOT ATTEMPTED.
- [#913](https://github.com/Jetnity/jetnity/pull/913) privacy cleanup SAFETY-BLOCKED; keep no raw local paths/logs, no cleanup/history rewrite; #911 P2 remains. #937 Bern App PAUSED; #934 LIVE B HARD-BLOCKED; #626 reserved. No secrets/provider/payment/new recurring cost, production schema/indexing/public launch permissions.
- The ordinary code-only security patch is permissible to prepare; **do not merge/Ready/deploy/activate anything** as author. Normal TL independent review and any special Owner/Production gate apply.

## F. Author handoff / independent TL
One writer, isolated new task-owned checkout, new Codex Generation1. Publish on existing security branch/Draft PR only with fast-forward non-force push, return exact HEAD/tree/parent/blob and complete file/diff inventory, full original CI/Auth/Preview evidence, scope, residual risks and self-review. Preserve failed attempts.
**STOP for independent Technical Lead. NO Ready, NO Merge, NO manual deploy, NO follow-up slice.**

**STATUS: TASK-ONLY SEED — WAITING FOR CODE AUTHOR.**
