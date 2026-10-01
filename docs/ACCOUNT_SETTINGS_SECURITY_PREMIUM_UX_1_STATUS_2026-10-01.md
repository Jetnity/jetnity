# Account Settings + Security Premium UX 1 — Status

Stand: 1 October 2026
Status: **IMPLEMENTED — LOCAL GATES GREEN — DRAFT — NOT A PASS**

- Writer: Generation 1, https://cursor.com/agents/bc-fbd188d3-8292-41f1-9c5c-61bb385fbc0f, `originalModelName=grok-4.7-high-fast`.
- Issue #698. Draft PR #699. Branch `fix/account-settings-security-premium-ux-1`.
- Baseline `main@ed5350e702f2b6b248cf49ae366420cf1b49039a`.
- Integrated `origin/main@98c9099bee1715f741e4aec87c2c386e9e5344ad` (merge-base). Branch was 0 behind that main at the evidence commit.
- UX commit `f957e96b`. Main integration `9dfde756`. This status file is committed with the evidence. The branch tip after that commit is the exact head for review. No Ready. No merge. No follow-up slice.

## Outcome

Presentation only. Auth, MFA, AAL, logout scopes, account-delete state machine, environment gate, and passkey capability are unchanged.

- `/account/settings` is a compact hub: security and JSON export are the two categories; deletion sits in a separate danger zone.
- Deletion credentials stay hidden until “Kontolöschung vorbereiten”. Closing is local and only while the phase is still `bereit`. The phrase `KONTO LÖSCHEN`, current password, conditional MFA step-up, and export-first link stay. Opening does not focus a credential field.
- `/account/security` has a compact area nav. Password and logout start collapsed. One explicit action opens the existing email-reauth password flow or the three logout scopes. Current-session facts and `ANDERE_SITZUNGEN_TEXT` stay visible. `LOGOUT_JWT_HINWEIS` stays in the logout summary.
- Logout buttons keep `variant={aktion.gefaehrlich ? "destructive" : "outline"}`. Tiers are “Diese Sitzung”, “Andere Sitzungen”, and “Hohes Risiko”.
- TOTP factors stay summarized. QR and code appear only after “Authenticator-App einrichten”. Passkeys stay the existing unsupported capability, without a setup button.
- No security score, no overall verdict, no device or session count.

## Measured first paint

Same harness, `next start`, synthetic session. `haupt` is the `<main>` scroll height.

| Surface | Vorher haupt / dokument | Nachher haupt / dokument |
| --- | ---: | ---: |
| Settings 390×844 | 1602 / 2629 | 1327 / 2282 |
| Settings 1440×900 | 1238 / 1801 | 853 / 1400 |
| Security 390×844 | 3299 / 4326 | 2342 / 3369 |
| Security 1440×900 | 2639 / 3202 | 1463 / 2026 |

Settings first paint: password and confirmation inputs 1 → 0. Security first paint: nonce field hidden, confirmation-code button hidden, TOTP enroll calls 0, passkeys `unsupported`, session `current`. Idle security still makes the existing 3 auth reads (password session, current session, factor list). Opening the password summary adds no POST.

Full matrix, 0 problems: 320×568, 360×800, 390×844, 412×915, 430×932, 768×1024, 820×1180, 1024×768, 1280×800, 1440×900, 1728×1117, 1920×1080, 844×390, 200% text at 360×800, desktop zoom 125% and 150%. Checked: no horizontal overflow, no nav overlap, targets ≥44px, compact inputs ≥16px, deletion open, password open, TOTP empty, TOTP enroll, security error. Enroll response contains no `otpauth`. Evidence: `docs/evidence/account-settings-security-premium-ux-1/`.

## Gates

- Focused contract tests for this slice plus AP-5 S1–S5, gate0, account delete, and data export: pass.
- `npm test`: 4215/4215 pass after PostgreSQL 16 binaries were present. The first run in this environment failed one test, `lib/readiness/official-truth-store-server.test.ts`, with `spawnSync /usr/lib/postgresql/16/bin/initdb ENOENT`. That test is from main, not this slice. After installing PostgreSQL 16 it passed, and the full suite was rerun green.
- `npm run typecheck`: pass.
- `npx eslint .`: 0 errors, 148 warnings. The only warning in a file this slice touched is the pre-existing `setState` in `SecurityMFA` browser-capability effect. It was not changed.
- `npm run build`: pass. Route `/ui-audit/account-settings-security` is dynamic and 404 unless `JETNITY_UI_AUDIT` is set and `VERCEL_ENV` is not production.
- `git diff --check`: pass.
- No DB, RLS, Auth config, package, or Production change. `docs/ACTIVE_WORK_STATUS.md` was not edited.

## Changed files

- `app/account/settings/page.tsx`
- `app/account/security/page.tsx`
- `components/account/KontoLoeschen.tsx`
- `components/account/SecurityPasswort.tsx`
- `components/account/SecuritySitzung.tsx`
- `components/account/SecurityLogout.tsx`
- `components/account/SecurityMFA.tsx`
- `lib/auth/account-security-premium-ux-1.ts`
- `lib/auth/account-security-premium-ux-1.test.ts`
- `app/(public)/ui-audit/account-settings-security/page.tsx`
- `scripts/account-settings-security-premium-ux-1-audit.mjs`
- `docs/evidence/account-settings-security-premium-ux-1/`

## Next step

Independent Technical-Lead review of this exact head. Stay Draft. Do not Ready. Do not merge. Do not start a follow-up.
