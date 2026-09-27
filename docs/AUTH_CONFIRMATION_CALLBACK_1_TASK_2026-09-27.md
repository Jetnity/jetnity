# Auth Confirmation Callback 1 — bounded corrective task
Date: 2026-09-27
Parent issue: #582
Status: IMPLEMENTED / AWAITING INDEPENDENT TECHNICAL-LEAD REVIEW / NO PASS / NO READY / NO MERGE
Baseline main: 2ae99dc0d37e325fe6a021d6767aca18d24ad4f3
Branch: fix/auth-confirmation-callback-1
Cursor-Agent: Jetnity auth confirmation callback 1
Generation: 1
Required model: cursor-grok-4.6-high-fast (do not substitute silently)

## Observed defect
PO performed the two authorized Production email smokes. Password-reset delivery and landing at https://jetnity.com/auth/update-password passed. Signup confirmation email delivered, but first opening on an iPhone showed:
"invalid request: both auth code and code verifier should be non-empty"
Only after refresh did "Meine Reisen" appear on jetnity.com. SMTP delivery success does not make the confirmation flow PASS.
Evidence: #582 comments 5856545386, 5856553343, 5856620779. No raw screenshots, recipient emails, IDs, passwords or tokenized URLs in repo.

## Goal
Correct the first-load email-confirmation callback so the valid flow reaches its expected safe app destination without refresh or a duplicate exchange; preserve honest failure behavior. This is a narrow repair of an existing contract, not a fundamental auth architecture change.

## Read first / audit before edit
Read AGENTS.md, JETNITY_START_HERE.md, operating-mode, TL standard, multi-agent standard, relevant architecture/decisions/auth docs and tests.
Re-read main and open PRs before work. Live mode was NORMAL and open PRs at task creation were only historical #52/#50/#40/#39/#28; no current callback writer identified.
Read app/auth/callback/CallbackClient.tsx, callback/page.tsx, lib/supabase/client.ts, RegisterForm, LoginForm, update-password/page.tsx, next-target validator, and actual locked library source.
Locked versions: @supabase/ssr 0.6.1; supabase-js 2.57.2; auth-js 2.71.1.
TL source triage: default createBrowserClient sets PKCE and detectSessionInUrl=isBrowser(); auth-js initialization detects the callback; public exchangeCodeForSession waits for initializePromise; CallbackClient also explicitly calls exchangeCodeForSession. Verify the competing processing hypothesis deterministically, including verifier consumption and initialization ordering. Distinguish from a different-browser/missing-verifier case; do not present hypothesis as live trace proof.

## Scope / ownership
One writer on this branch.
- Existing callback component and a small directly related helper if justified.
- Focused regression tests for real library/initialization behavior and UI outcome.
- Read other auth flows to prevent regression. Minimal changes outside callback only with demonstrated necessity; stop if fundamental auth/session redesign would be needed.
- German understandable error UI; never expose tokens/verifiers/raw sensitive URL data.
- Task/status/handoff/self-review and bounded continuity update referencing #582.

## Acceptance
1. Reproduce or deterministically prove the old duplicate/competing exchange failure. Test fails before fix and passes after.
2. Exactly one owner for exchanging the callback code, compatible with the actual singleton/library initialization; handle completion whether client initialized before or within the callback.
3. Valid signup reaches existing safe intended destination without refresh.
4. Missing verifier, invalid/expired/replayed code, explicit callback error, absent session and network failure remain honest failures. An unrelated existing session must not automatically convert a failed confirmation into success.
5. Safe-next validation unchanged; no external redirect/open redirect. Preserve reset landing at /auth/update-password, including recovery identification and default SDK behavior.
6. Remount/concurrency does not duplicate consumption or leak timers/subscriptions. No security weakening or broad catch-and-ignore.
7. No dependency upgrade/new auth architecture just to solve this.
8. Meaningful deterministic tests, typecheck/lint/build and applicable existing gates. Report unavailable gates honestly. No live email needed for offline regression proof.
9. Actual first-load physical-device regression acceptance remains open until an explicitly authorized retest after review; never claim the earlier refresh-only success as PASS.

## Hard boundaries
No Production or Development hosted mutations; no additional real signup/resend/reset email; both originally authorized sends are already used.
No password changes; no MFA/AAL, OAuth/provider, SMTP/template/rate-limit, site/redirect config changes.
No DB/RLS/migration; no service-role secret use, DNS, indexing/public launch, deployment environment changes, paid provider calls or new costs.
No new vendor legal text; PrivacyBee Infomaniak follow-up belongs to #582 and is not this writer's scope.
Do not change public contact or mailboxes. Do not delete the PO test account.
No change to governance/rulesets or historical residual acceptance.

## Verification / deliverables / stop
Write a short plan before implementation. Supply exact changed files and rationale, failing-before/passing-after regression evidence, gates and limitations, baseline/head, session footer/identity and status/handoff/self-review. Re-read origin/main before handoff.
Keep PR draft. do not mark Ready. do not merge. do not start a follow-up slice.
STOP after implementation and evidence for independent Technical-Lead exact-head review. No declaration that #582 is complete.
