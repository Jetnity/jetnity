# MFA Existing Factor Step-Up 1 — binding repair task

Date: 2026-09-22
Issue: #541
Baseline: main@a3eb83b86d5aec604fb77d5d2b75d58c6a653ef1
Branch: fix/mfa-existing-factor-step-up-1
Cursor-Agent: Jetnity MFA existing factor step-up 1
Generation: 1 (new bounded defect, not a restart of #538 or #540)
Required model: Cursor Grok 4.6 High Fast (cursor-grok-4.6-high-fast), no Auto/substitution. STOP if unavailable.

## Authority / precheck
Read JETNITY_START_HERE.md, AGENTS.md, TL/Cursor Operating Standard, binding slice/multi-agent planning and latest #512 handoffs. NORMAL permits ordinary defect repair. This restores the existing challenge contract; it does not change authentication policy or waive special PO gates.
PO entered Admin, then on another device was told to enroll TOTP again. TL independently verified that one verified TOTP still exists for the designated account (read-only, no secrets or factor IDs read). Do not include account identity in evidence.
Main #540 registration repair is integrated/postmerge verified; #538 Admin home is complete. Current open PRs before selection are historical #52/#50/#40/#39/#28 only; no active MFA writer. No direct Cursor UI-wide inventory is claimed. Scheduled monitoring disabled; failed Daily deferred.
Fresh logical session for this separate MFA helper defect. Immediate review fixes reuse that session.

## Independently reproduced defect
Exact-main lib/auth/mfa.ts startTotpChallenge reads lf.all ?? lf.factors and searches f.type === 'totp'. Current installed @supabase/auth-js Factor uses factor_type; _listFactors filters factor_type === 'totp' AND status === 'verified' for data.totp.
Synthetic response {all:[{id:'synthetic-factor',factor_type:'totp',status:'verified'}],totp:[same],phone:[]} causes current helper to throw "Kein TOTP-Faktor gefunden..." with ZERO challenge calls.
Consumers: components/auth/LoginForm.tsx and app/(public)/admin/mfa/AdminMfaStepUp.tsx. Already-AAL2 sessions do not need this step; fresh sessions do, explaining device-change symptom. This is causal source/repro evidence, not a captured Production network trace.
Existing lib/auth/account-security-faktoren.ts already defines canonical factor_type precedence and legacy type fallback. Reuse this contract if appropriate; do not create a competing factor truth.
Reference: installed SDK src/GoTrueClient.ts:_listFactors and src/lib/types.ts:Factor; official https://supabase.com/docs/reference/javascript/auth-mfa-listfactors. TL also consulted current changelog; this is a repository compatibility defect, not an established new upstream breaking change.

## User outcome / security invariant
New browser/device with existing verified TOTP and AAL1 receives the existing-factor code challenge, then existing verification and server AAL2 recheck. No new QR/enrollment is needed. New session confirmation remains required.
Only a genuinely absent usable verified TOTP may lead to existing setup guidance. Read/API/malformed response failures remain errors, not asserted factor absence.
No enrollment, factor removal, new device trust, persistent bypass or weaker MFA requirement.

## Scope
Primary runtime owner: lib/auth/mfa.ts.
Allowed only if directly necessary: narrow existing-factor normalizer changes in lib/auth/account-security-faktoren.ts and tiny error-state wiring in app/(public)/admin/mfa/AdminMfaStepUp.tsx / lib/auth/admin-aal.ts. Preserve their public contracts and existing security behavior. Explain any such change.
Focused new tests: lib/auth/mfa.test.ts and directly relevant existing MFA tests.
Delivery docs: docs/MFA_EXISTING_FACTOR_STEP_UP_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-22.md.
Evidence: docs/evidence/mfa-existing-factor-step-up-1/.
Read-only consumers: LoginForm, MFATotpDialog, Admin mfa page/actions, admin-guard/admin-access, account security and step-up flows.
Forbidden: DB/schema/migrations/RLS/roles, Production Auth/settings/factors/sessions, MFA secrets/credentials, env/lock/dependency changes, enrollment/removal/recovery implementation, login redesign, AAL policy/device trust/session duration, #538/#540 runtime, global governance/status files.
STOP at a necessary forbidden/shared change; no silent expansion. This task does not authorize real challenge/verify calls against the user's account or credential use.

## Required behavior
- Recognize actual factor_type='totp' with status='verified' and a nonempty valid ID. Never choose an unverified factor before a verified one or a phone factor.
- Current factor_type takes precedence over legacy type; conflicting metadata must not turn phone into TOTP. Follow supported existing compatibility shapes intentionally, not arbitrary fallbacks.
- One list then one challenge for the selected valid factor; return unchanged factorId/challengeId API.
- Empty valid factor list / only unverified TOTP => no challenge and genuine existing no-factor path. Missing SDK method, rejected list, malformed/unreadable response => error, not setup claim. No call on those paths.
- Challenge error/missing challengeId => error and no success/fake ID. Preserve verified code flow and server-side evaluateAdminAccess/AAL2 gate. A challenge started is not proof of successful verification.
- Avoid raw any-based assumptions in the repaired selection where possible; retain this binding when invoking SDK methods.
- No writes except local synthetic mock counters. Never expose factors/secrets/tokens/real identity in docs, logs, screenshots or test fixtures.

## Meaningful proof
First add a regression that fails on baseline with the exact current-shape verified fixture above and passes after repair.
Tests must call actual startTotpChallenge with injected/mock SDK, assert selected ID and exact challenge count; include current all/totp shape, supported legacy fallback, conflict precedence, unverified-first/verified-second, no verified factor, phone only, error/throw/malformed response, missing ID, challenge error and missing challenge ID.
Exercise both consumer contracts: fresh AAL1 with existing verified TOTP opens code dialog and not enrollment prompt; true no-factor shows existing setup; failed lookup is not no-factor; already AAL2 and server recheck remain intact. Prefer a small hydrated actual component harness with synthetic SDK/network boundary and truthful labels. No fake authenticated/real-device PASS.
Run relevant admin-aal/access/alignment and account-security-faktoren/account-mfa-step-up regressions plus owned lint, typecheck and full required CI/Auth/build/hygiene. No test weakening or skipped-secret PASS.
If UI is touched, inspect 390/desktop, keyboard code entry/focus and error vs no-factor screens. If UI unchanged, targeted dialog-state proof suffices; no general UX audit.
Version pin all runtime/evidence. Clearly report unavailable real authenticated/device verification; user can perform real device switch retest after reviewed deployment.

## Parallelism / delivery
SINGLE_AGENT: one tightly coupled shared helper used by Login and Admin; second writer would overlap. No duplicate agent, no unrelated audit. New branch from exact verified main.
Before coding acknowledge exact logical name/generation/model/session/branch/baseline. UI rename only if actually supported.
Self-review, commit/push scoped implementation and evidence; reread main before handoff and report drift. No unrequested repeated main merges/rebase/force. Deliver frozen head, tests, CI/Auth/direct Preview references and limitations.
STOP FOR INDEPENDENT TL REVIEW. Do not Ready, merge or start a follow-up. TL alone performs exact-head review/gates and postmerge verification. Any changed head invalidates old gates.
