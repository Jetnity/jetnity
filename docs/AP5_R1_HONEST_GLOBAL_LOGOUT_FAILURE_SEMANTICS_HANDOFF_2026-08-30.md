# Jetnity – AP-5-R1 – Handoff

Stand: 30. August 2026  
Status: **REVIEW-FIX / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-RE-REVIEW / KEIN FOLGESLICE**  
Cursor-Agent: **`Account plattform audit vorbereitung 22`**  
Cursor-Session/Run-ID: `bc-f631838b-21f3-4290-aa1f-db450a037ac3`  
Issue: [#241](https://github.com/Jetnity/jetnity/issues/241)  
Branch: `feat/ap5-r1-honest-global-logout-2026-08-30`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/242  
Prior Review-Head: `c0abee5091511d241c2c1f55c04baa4e5baee10c` – CHANGES REQUIRED `5060518239`

## Zuerst lesen

1. `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_TASK_2026-08-30.md`
2. `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_STATUS_2026-08-30.md`
3. Review `5060518239`
4. `docs/AP5_S3_ACCOUNT_SECURITY_LOGOUT_SCOPES_HANDOFF_2026-08-29.md`
5. Issue #241

## Was ein neuer Chat wissen muss

AP-5-R1 macht allgemeines/admin `signOut()` ehrlich: Success-Redirect nur nach bestätigter Auth-Antwort.

Review-Fixes auf derselben Session 22:

1. Keine Cursor-Edits mehr an TL-owned `ARCHITECTURE.md` / `DECISIONS.md`. Keine AP-5-R1-ADR-Nummer. Die bereits vergebene zentrale ADR-Nummer bleibt unangetastet.
2. Alle echten Admin-Logout-Flächen (Topbar + Admin-Login) nutzen `signOutToAdminLoginAction` und landen nach Erfolg auf festem `/admin/login`.
3. `GlobalesAbmeldenForm` hat keinen `onErgebnis`-Effect. Ein Fehler fängt das Admin-Menü nicht.

Harte Wahrheiten:

1. Allgemeines Logout bleibt Supabase-default / unscoped / global.
2. Success-Redirect nur nach bestätigtem `signOut()` ohne Fehler.
3. `{ error }` oder Wurf = logout not confirmed.
4. Public-Ziel `/`. Admin-Ziel `/admin/login`.
5. AP-5-S3 `local` / `others` / `global` bleibt unverändert.
6. Keine Rohtexte, Tokens, Cookies, Session-IDs oder Secrets in der UI.
7. Kein Open Redirect.
8. Generation 22 ist nur für AP-5-R1. Kein Folgeslice.

Exact Cursor-Session-ID: `bc-f631838b-21f3-4290-aa1f-db450a037ac3`.

## Caller-Inventar

`signOutAction`: PublicNavbar, FooterSitzung, Unauthorized.  
`signOutToAdminLoginAction`: AdminTopbar, Admin-Login-Seite.  
Nicht geändert: S3 scoped Action, MFA local, Admin-Login-Denial-Cleanup.

## Residuals

- Admin-Login-Denial-`signOut()` bleibt außerhalb.
- Kein authentifizierter Browser-/Real-Device-Beweis.
- Agent-Self-Review ist kein PASS.
- Zentrale Architecture-/Decision-Persistenz bleibt TL-owned nach Merge.

## Nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Re-Review von Draft-PR #242. Nicht Ready. Nicht mergen. Keinen Folgeslice starten.
