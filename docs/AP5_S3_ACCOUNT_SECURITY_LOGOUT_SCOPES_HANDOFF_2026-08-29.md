# Jetnity – AP-5-S3 – Handoff

Stand: 29. August 2026  
Status: **DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN S4–S5**  
Cursor-Agent: **`Account plattform audit vorbereitung 13`**  
Issue: [#153](https://github.com/Jetnity/jetnity/issues/153)  
Branch: `feat/ap5-s3-account-security-logout-scopes-2026-08-29`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/156

## Zuerst lesen

1. `docs/AP5_S3_ACCOUNT_SECURITY_LOGOUT_SCOPES_TASK_2026-08-29.md`
2. `docs/AP5_S3_ACCOUNT_SECURITY_LOGOUT_SCOPES_STATUS_2026-08-29.md`
3. `docs/AP5_S3_LOCAL_TEST_EVIDENCE_2026-08-29.md`
4. ADR-0192 in `DECISIONS.md`
5. `docs/AP5_GATE0_ACCOUNT_SECURITY_CAPABILITY_STATUS_2026-08-28.md`
6. ADR-0182
7. Issue #153

## Was ein neuer Chat wissen muss

S3 macht vorhandene Supabase-Logout-Scopes in `/account/security` ehrlich nutzbar. Es ändert keine Auth-Architektur.

Harte Wahrheiten:

1. `local` beendet nur diese Sitzung. `others` behält die aktuelle. `global` beendet alle und entspricht dem bestehenden allgemeinen Abmelden.
2. Das allgemeine `signOutAction()` bleibt unscoped. Navbar, Footer, Unauthorized und Admin-Login wurden nicht auf `local` gedreht.
3. Eine Session-/Geräteliste ist weiterhin unsupported. S3 darf keine Anzahl oder Geräteliste erfinden.
4. Erfolg darf erst nach erfolgreichem `signOut({ scope })` behauptet werden. Netz-/Serverfehler sind unbestätigt.
5. Access Tokens können bis `jwt_expiry` (3600 s) weiter gültig sein. Logout ist kein sofortiges JWT-Kill.
6. Generation 13 ist nur für AP-5-S3. Nicht für S4 oder S5 wiederverwenden.

## Was bewusst nicht gebaut wurde

MFA-Step-up, Sessionkarte, Consumer-AAL2, Auth-Config-Push, Default-Logout-Wechsel, Recovery-Rewrite, C2, AP-7.

## Shared Contract

Kein neuer Auth-Vertrag. ADR-0192 präzisiert nur die UI-Nutzung der bereits in ADR-0182 festgestellten Scopes und die ehrliche Fehler-/JWT-Semantik.

## Residuals

- `signOutAction` schluckt weiter Fehler und redirected immer.
- Kein authentifizierter Browser-/Real-Device-Beweis.
- Exact Head und CI/Vercel müssen live am PR geprüft werden; dieser Handoff erfindet keine grünen Gates.
- `main` `protected=false`.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review. Nicht Ready. Nicht mergen. Kein automatischer S4-Start.
