# Registration Consent Interaction 1 — binding implementation task

Date: 2026-09-22
Issue: #539
Status: TL SELECTED / IMPLEMENT ONLY AFTER EXPLICIT CURSOR DISPATCH
Baseline: main@fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee
Branch: fix/registration-consent-interaction-1
Cursor-Agent: Jetnity registration consent interaction 1
Generation: 1 (new user-reported defect)
Required model: Cursor Grok 4.6 High Fast (cursor-grok-4.6-high-fast). No Auto/substitution; if unavailable, STOP.

## Authority and precheck
The Product Owner reports that the terms checkbox cannot be clicked/tapped on iPhone at production /register, blocking registration. This is ordinary repair of existing functionality under NORMAL, not authorization for Production identity/role/Auth changes.
Read JETNITY_START_HERE.md, AGENTS.md, the TL/Cursor Operating Standard, Binding Slice Precheck, Multi-Agent Slice Planning Standard, V1 Binding Build Order and latest #512 handoffs first.
Main is fb4c9ece; completed UX/Trip/Account slices must not be repeated. Admin #538 has its own existing Cursor session and owns different files. Scheduled monitoring remains disabled and today's failed Daily is left alone.
PO report and screenshot establish a user-visible failure; TL has not yet independently reproduced the hydrated interaction. Source review found a suspected competing custom role=checkbox onClick and wrapping label's native input activation. Uncontrolled visual state also derives from defaultChecked rather than current state. Only runtime consumer found is RegisterForm.
TL browser limitation: agent-browser daemon failed to start; fallback Chromium installed but public Production navigation returned ERR_EMPTY_RESPONSE. Do not report these as browser PASS or a confirmed event-level root cause.

## Concrete outcome
A single tap/click/Space on the consent checkbox reliably changes its visible, accessible and form state exactly once. User can deliberately accept and revoke consent. Registration remains disabled without explicit consent; legal links remain usable. Fix the product, not a general audit.

## Ownership
Allowed:
- components/ui/checkbox.tsx
- RegisterForm.tsx at its existing repository path, minimal consent wiring only if necessary
- focused checkbox/registration interaction tests and a small local browser harness if needed
- docs/REGISTRATION_CONSENT_INTERACTION_1_{STATUS,HANDOFF,SELF_REVIEW}_2026-09-22.md
- docs/evidence/registration-consent-interaction-1/
Discover exact RegisterForm path before editing. Do not change unrelated registration behavior.
Forbidden: Admin #538 files, auth services, signup API/server logic, credentials, roles, MFA, DB/RLS/schema/migrations, dependencies/lockfiles, global CSS or shared Label redesign, legal content, governance/global status files, Grok bots or schedules. If a forbidden/shared change is necessary, STOP at that boundary and explain to TL.

## Interaction contract
1. Diagnose a hydrated original component/form using genuine unforced pointer/touch/keyboard actions. Capture state after event processing settles; screenshots alone do not prove the defect.
2. Prefer one authoritative native checkbox and native label activation. Avoid duplicated focus targets or two independent toggles for one user action. Preserve exported API and forwarded native input ref, id/name/value/form props, disabled, checked/defaultChecked, onCheckedChange and indeterminate semantics. One accessible checkbox with associated consent text and visible focus.
3. Controlled parent state and uncontrolled state must each toggle once and stay aligned with the native checked state and rendered visual state. Test checked and unchecked initial state, rerender, and indeterminate transition.
4. Preserve >=44px usable touch area, pointer and real keyboard Tab/Space activation. Disabled checkbox does not change or emit callback.
5. External consent label text activates once. Links inside the label navigate to /terms and /privacy without toggling consent or submitting the form. Keep the full existing wording and destinations.
6. Default consent stays unchecked. Keep both disabled submit without accept and existing handleRegister consent validation. Never precheck, bypass or weaken consent. No change to password policy, email validation, signup, email verification, roles, MFA or access decisions.
7. Small-screen layout 320/390 and desktop, 200% text, no introduced overflow or label overlap.
8. No real account creation, email sending, role assignment, fixture seeding or Production Auth mutation. Browser tests use empty fields or synthetic local fixtures and intercept/block registration writes. Do not use user credentials or include user email/password in evidence.

## Multi-agent suitability and order
PARALLEL DISJOINT SLICES: one fresh Cursor writer for this tightly coupled checkbox/form repair; existing #538 Admin session continues separately. No second writer on checkbox, RegisterForm or these tests. No dependency on unmerged #538 and no sibling integration. This user-blocking fix can be reviewed/merged independently first.
Immediate review corrections reuse the returned session; no duplicate agent.

## Required evidence and gates
- Executable regression test fails against baseline interaction and passes after correction, with explicit settled native/visible/accessible state and callback count. Prefer hydrated browser tests, not source-string assertions or click() invoked inside page.evaluate.
- Real mouse click, mobile touch tap, external label activation, keyboard Tab then Space, controlled/uncontrolled/default/indeterminate/disabled.
- Legal links retain correct navigation without toggling. Default unchecked and submit disabled until consent; revoke restores disabled. No registration request is sent.
- Chromium plus WebKit mobile where available; distinguish emulated browser coverage from real iPhone evidence. If WebKit unavailable, record the limitation honestly. No forced clicks masking overlay/hit-testing defects.
- Record browser/runtime/source SHA, screenshot evidence and exact commands/results. Use compiled actual component styles; label harness evidence separately from full hydrated /register route evidence.
- Run owned-file lint, typecheck and relevant existing registration/legal regression tests; applicable required CI/hygiene/build/Auth gates. Do not weaken or skip tests to obtain green.
- Independent TL review, complete exact-head CI/Auth, direct Vercel Preview and review-thread/visual gates remain mandatory before Ready/merge. Agent completion is not TL PASS.

## Delivery and STOP
Acknowledge logical name, generation, branch, baseline, actual model and session evidence in PR before implementation. Do not claim UI rename unless performed.
Implement, self-review, commit and push only allowed scope. Re-read origin/main before handoff and report drift/merge-base without repeated main merges. Pin final head and files, root cause, before/after proof, executed tests, CI/Auth/Preview IDs, residual limitations.
STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW. Do not mark Ready, merge, deploy manually or start a follow-up.
