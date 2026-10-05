# Account Settings + Security Premium UX 1 — Binding Task

Date: 1 October 2026
Issue: #698
Baseline: `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`
Logical agent: **Jetnity Account settings security premium UX 1**
Generation: **1**
Required model: **Grok 4.7 High Fast** — not Auto.

## Product-owner evidence

Live authenticated screenshots of:
- `/account/settings`
- `/account/security`

show correct functionality but an overly long, form-heavy presentation.

Observed:
- Settings overview is understandable, but account deletion exposes the destructive confirmation/password form immediately on first paint.
- Security renders Password, current session, logout choices, Authenticator/TOTP and Passkeys as a long sequence of fully open sections.
- Security truth/copy is careful and must remain intact.
- Desktop width is underused; phone would inherit a long vertical stack.

Use the quality method of merged #661:
- 2–3 second comprehension;
- hierarchy before decoration;
- phone-first;
- truth/behavior preserved;
- measured cross-device evidence;
- 200% text, keyboard/focus, >=44px targets.

## Absolute security boundary

This is a **presentation-only** slice.

Do NOT modify:
- auth state machines;
- MFA/AAL semantics;
- reauthentication rules;
- logout scopes;
- account-delete state machine;
- account-delete environment gate;
- API routes;
- Supabase client behavior;
- Auth config;
- RLS/schema/migrations;
- password policy;
- passkey capability detection;
- security error classification;
- Production configuration.

If UX cannot be improved without changing any of these, STOP and report.

## A. Settings landing page

Goal: make `/account/settings` a calm settings hub.

Preserve:
- Security link and route;
- JSON export semantics and warning;
- account deletion availability gate.

Improve:
- tighter header/composition;
- Security + Data export as clear settings categories;
- account deletion visually separated as “danger zone” / destructive area;
- do not make deletion look like a normal primary setting;
- wide desktop may use a balanced grid only if text/actions stay readable;
- phone stays single-column.

No fake categories or unavailable settings.

## B. Account deletion progressive disclosure

Current problem: full destructive confirmation/password form is permanently visible.

Required:
- default view shows the destructive section summary and an explicit >=44px control such as “Kontolöschung vorbereiten”;
- only after explicit user action reveal the existing deletion form;
- preserve exact confirmation phrase `KONTO LÖSCHEN`;
- preserve current-password step;
- preserve conditional MFA step-up;
- preserve export-first option;
- preserve status/focus behavior;
- preserve environment availability gate;
- no auto-focus into destructive fields before explicit open;
- close/cancel may hide the form only if doing so does not corrupt the existing state machine; if not safe, do not add close after flow begins.

Do not make deletion easier to trigger accidentally.

## C. Security page hierarchy

Goal: user understands security posture and available actions quickly.

Existing domains remain:
- Password
- Current session
- Logout/session termination
- Authenticator-App (TOTP)
- Passkeys

Allowed:
- add a compact top overview/navigation of these existing areas;
- group related session/logout surfaces visually;
- use progressive disclosure where it does not alter behavior;
- make active/available/unavailable status easier to scan;
- use desktop width intentionally;
- keep rare/destructive actions subordinate.

Do not invent:
- a security score;
- “secure/not secure” overall verdict;
- device count when unavailable;
- session list when unavailable;
- passkey support when server says unsupported.

## D. Password

Preserve:
- email reauthentication flow;
- current password is not requested for password change;
- nonce semantics;
- password policy and strength logic;
- all focus/status behavior.

Improve only presentation:
- collapsed/summary state may be used before user starts changing password;
- explicit action opens the flow;
- form inputs >=16px on compact screens;
- buttons >=44px.

## E. Session + logout

Preserve every truthful limitation:
- only current session is directly shown;
- Jetnity cannot enumerate other sessions/devices with current auth information;
- access-code validity is not session-end time or last activity;
- logout scopes remain exact.

Improve:
- current-session facts in a compact readable fact grid;
- logout actions visually tiered:
  1. this device/session;
  2. other sessions/devices;
  3. everywhere logout as destructive/high-risk;
- no count or device identity invented;
- existing exact warning text remains available.

## F. Authenticator / TOTP

Preserve:
- factor listing;
- enroll/challenge/verify;
- step-up before protected unenroll where required;
- factor removal behavior;
- QR/data handling;
- error/success copy;
- no secret URI exposure.

Improve:
- existing configured factors summarized cleanly;
- enrollment flow only dominates when explicitly started;
- destructive remove remains explicit;
- QR/code flow remains accessible;
- >=44px actions.

## G. Passkeys

Preserve exact server/browser capability truth.

If unsupported:
- show as a concise unavailable capability, not a large dead-end card;
- keep explanation that browser support alone does not enable server support;
- do not add a fake setup button.

If later enabled by existing state:
- preserve existing exact capability logic.

## H. Cross-device audit

Required sizes:
- 320×568
- 360×800
- 390×844
- 412×915
- 430×932
- 768×1024
- 820×1180
- 1024×768
- 1280×800
- 1440×900
- 1728×1117
- 1920×1080
- 844×390 landscape
- 200% text at 360×800
- desktop zoom 125% / 150%

States:
Settings:
- normal;
- deletion collapsed;
- deletion opened;
- deletion error/status where synthetic harness permits.

Security:
- normal current-session + TOTP configured;
- password flow opened;
- logout section;
- TOTP enrollment;
- TOTP existing-factor state;
- passkey unsupported;
- relevant empty/unavailable/error states from existing audit fixtures.

Verify:
- no horizontal overflow;
- no nav overlap;
- >=44px targets;
- compact inputs >=16px;
- focus visible/order sensible;
- destructive actions clearly differentiated;
- no console/hydration errors;
- no new network call caused purely by cosmetic disclosure where avoidable;
- no auth behavior difference between old and new action execution.

## I. Page-height / first-paint targets

Measure before/after:
- `/account/settings` default first-paint total height;
- `/account/security` default first-paint total height;
- 390×844 and 1440×900;
- number of destructive credential inputs visible on settings first paint;
- number of heavy security forms visible on security first paint.

Targets:
- account deletion credential fields hidden until explicit user intent;
- security first paint materially shorter/easier to scan;
- every existing action remains reachable with one clear explicit expansion/action.

## J. Preferred file ownership

Allowed runtime:
- `app/account/settings/page.tsx`
- `app/account/security/page.tsx`
- `components/account/KontoLoeschen.tsx`
- `components/account/SecurityPasswort.tsx`
- `components/account/SecuritySitzung.tsx`
- `components/account/SecurityLogout.tsx`
- `components/account/SecurityMFA.tsx`
- presentation-only new helper/component under `components/account/` or `lib/auth/account-security-premium-ux-1*`
- loading UI for these two routes only if needed
- focused UI/contract tests
- one visual audit script
- lane-specific docs/evidence

Do NOT edit:
- `lib/auth/account-password-aenderung*`
- `lib/auth/account-mfa-step-up*`
- `lib/auth/account-logout*`
- `lib/auth/account-security-passkeys-lesen*`
- `lib/account/kontoloeschung-client*`
- `lib/account/kontoloeschung-vertrag*`
- account export API
- Supabase/Auth/RLS/schema/config
- AccountNavigation
- files owned by #686/#689/#691/#693/#695/#697
- package/lockfile
- global CSS/tokens
- global continuity files.

If any forbidden behavioral file seems necessary, STOP and report.

## K. Tests

Prove at minimum:
- delete credential fields are not exposed before explicit deletion intent;
- opening deletion reveals the same existing confirmation/password/MFA path;
- deletion exact phrase unchanged;
- export link remains;
- password reauth semantics unchanged;
- current session truth unchanged;
- logout action scopes unchanged;
- TOTP add/remove/step-up semantics unchanged;
- passkey capability truth unchanged;
- no fake device/session counts;
- no new Auth/Supabase API calls introduced by idle presentation;
- Loading/Empty/Error/status semantics remain honest.

Run:
- focused tests;
- full npm test;
- typecheck;
- lint;
- build;
- existing auth/security/account-delete tests;
- new cross-device visual audit;
- git diff --check.

## L. Parallel/main drift

Active lanes may merge while this work runs.
Before final push:
- fetch current main;
- integrate it into this same branch/session;
- preserve merged work;
- remain 0 behind;
- rerun full gates and visual matrix.

## M. Stop

Push one exact validated head.
Record session URL, originalModelName, exact head, merge-base, ahead/behind, changed-file manifest, local gates and evidence.
Stay Draft.
Do not Ready.
Do not merge.
Do not start a follow-up.
STOP for independent Technical-Lead code + security-boundary + visual + mobile review.
