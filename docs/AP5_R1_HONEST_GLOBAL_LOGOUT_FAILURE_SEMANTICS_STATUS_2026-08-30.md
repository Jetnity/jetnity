# Jetnity – AP-5-R1 Honest Global Logout Failure Semantics – Status

Stand: 30. August 2026  
Status: **REVIEW-FIX / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-RE-REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Workstream: Account / Security  
Cursor-Agent: **`Account plattform audit vorbereitung 22`**  
Cursor-Session/Run-ID: `bc-f631838b-21f3-4290-aa1f-db450a037ac3`  
Beobachteter Run-Titel: `Ehrliche globale abmeldefehlersemantik`  
Issue: [#241](https://github.com/Jetnity/jetnity/issues/241)  
Branch: `feat/ap5-r1-honest-global-logout-2026-08-30`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/242  
Review: `5060518239` CHANGES REQUIRED auf `c0abee5091511d241c2c1f55c04baa4e5baee10c`

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| Feature-Branch-Start | `a261db267841e81be396bb9027625c500701114c` – Task-only |
| Baseline / Merge-Base | `main @ 5129be01a9b8785bc9d7fed01a33186fa97345a1` |
| Logical Cursor-Agent | `Account plattform audit vorbereitung 22` – dieselbe Session |
| Cursor-Run | https://cursor.com/agents/bc-f631838b-21f3-4290-aa1f-db450a037ac3 |
| Prior Review-Head | `c0abee5091511d241c2c1f55c04baa4e5baee10c` – CHANGES REQUIRED |
| `main` Branch Protection | nicht in diesem Slice angefasst |
| Issue #241 | OPEN |
| Draft-PR | #242, bleibt Draft |
| AP-5-S3 scoped Logout | **unberührt** (`local` / `others` / `global`) |
| Folgeslice | **nicht gestartet** |
| Zentrale Continuity | `ARCHITECTURE.md` / `DECISIONS.md` wieder baseline-identisch; keine AP-5-R1-ADR-Nummer |

## 2. Caller-Inventar (aktueller Review-Fix)

| Fläche | Datei | Aktion | Success-Ziel | Bemerkung |
| --- | --- | --- | --- | --- |
| Öffentliche Navbar | `components/layout/PublicNavbar.tsx` | `signOutAction` | `/` | Desktop + Mobile |
| Footer | `components/layout/FooterSitzung.tsx` | `signOutAction` | `/` | dieselbe Session-Navigation |
| Unauthorized | `app/unauthorized/page.tsx` | `signOutAction` | `/` | Server-Seite, Client-Formular |
| Admin-Topbar | `components/layout/AdminTopbar.tsx` | `signOutToAdminLoginAction` | `/admin/login` | Review-Fix; fest im Code |
| Admin-Login | `app/(public)/admin/login/page.tsx` | `signOutToAdminLoginAction` | `/admin/login` | fest im Code |

Geprüft und **keine** allgemeinen Caller:

- `app/account/security/logout-action.ts` – AP-5-S3 scoped Authority
- `components/account/SecurityLogout.tsx` – nur `accountLogoutScopeAction`
- `components/account/SecurityMFA.tsx` – nur scoped `local` über S3/S4
- `app/(public)/admin/login/actions.ts` – internes `signOut()` nach Login-Denial, kein allgemeiner Logout-Caller

## 3. Review-Fixes gegen `c0abee50`

1. AP-5-R1-Edits aus `ARCHITECTURE.md` und `DECISIONS.md` entfernt. Keine slice-lokale ADR-Nummer. Die bereits auf `main` vergebene zentrale ADR-Nummer bleibt unangetastet.
2. Admin-Topbar nutzt `signOutToAdminLoginAction`. Bestätigter Admin-Logout landet auf festem `/admin/login`.
3. `onErgebnis` / Effect entfernt. Ein Fehler zwingt das Admin-Menü nicht erneut auf; Nutzer kann per Toggle, Aussenklick oder Escape schließen.

Unverändert geblieben: unscoped/default globales Sign-Out; fail-closed `{ error }`/Wurf; dichte Copy; S3-Scopes; kein DB/Auth-Config/RLS/PrivacyBee.

## 4. Vertrag

| Aussage | Klasse | Evidence |
| --- | --- | --- |
| Allgemeines Abmelden bleibt unscoped / global | **current** | `await supabase.auth.signOut()` ohne Options; Gate-0 + S3-Vertragstests |
| Public Success `/` nur nach bestätigtem Erfolg | **current** | `signOutAction` + `globalesSignOutDarfWeiterleiten` |
| Admin Success `/admin/login` nur nach bestätigtem Erfolg | **current** | Admin-Topbar und Admin-Login nutzen `signOutToAdminLoginAction` |
| `{ error }` und Wurf sind kein Success-Redirect | **current** | `globales-sign-out.test.ts` |
| Copy ohne Rohtexte/Tokens/Session-IDs | **current** | Dicht-Tests + feste Texte |
| Kein Open Redirect | **current** | Allowlist `/` und `/admin/login`; Formularfelder ungelesen |
| Fehler hält Admin-Menü nicht gefangen | **current** | kein `onErgebnis`; `globalesAbmeldenMenueOffen(..., 'abmelden_fehler')` ändert Offenheit nicht |
| S3-Scopes unverändert | **current** | S3-Unit + Vertragstests; keine Edits an S3-Dateien |
| Keine zentrale Architecture-/ADR-Wahrheit durch Cursor | **current** | `ARCHITECTURE.md` / `DECISIONS.md` ohne AP-5-R1-Text |

## 5. Tests / Evidence dieses Review-Fix

Vorherige Gates von `c0abee50` / `5ba971ff` sind ungültig.

| Lauf | Ergebnis |
| --- | --- |
| Focused R1-Unit | **8/8 pass** (`lib/auth/globales-sign-out.test.ts`) |
| R1 Vertrag/Caller/A11y | **6/6 pass** (`lib/auth/ap5-r1-honest-global-logout.test.ts`) |
| S3 + Gate 0 + S5 | **pass** |
| `npm test` | **2773/2773 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 135 warnings** |
| Hygiene | `check:dead` nur CookieConsent-Ausnahme; `check:exports` 0; `check:deps` sauber; `check:api-schutz` 12/12; `check:schema-bezug` pass |
| `npm run auth:pruefen` | **55/55**, 242 Schlüssel |
| `npm run build` | Production-Build Next.js 16.3.3 Turbopack erfolgreich |
| Browser / Real-Device | nicht gelaufen, nicht behauptet |
| Exact-Head GitHub Actions / Vercel | Review-Fix-Head `0e338da945dee3528f2629cfa2488c447657f222`: Actions Run `33306101036` SUCCESS; Vercel Inspector `DNmCi7Vt5dgLGmHRoKG6LaoegA3v` SUCCESS. Dieser Evidence-Stamp erzeugt einen neueren Head. Kein weiterer Stamp, außer dessen CI fehlschlägt. |

## 6. DB / RLS / Production-Grenze

Keine Migration. Kein RLS-/Ownership-/Identity-Write. Kein Auth-Config-Push. Keine Service Role. `supabase/config.toml` unverändert.

## 7. Kosten / Provider / Secrets

Keine neuen laufenden Kosten. Keine Provider. Keine Secrets.

## 8. Residuals / Risiken

- `app/(public)/admin/login/actions.ts` ignoriert weiterhin `{ error }` beim Denial-Cleanup-`signOut()`. Das ist kein allgemeiner Logout-Caller und bleibt außerhalb.
- Ein fehlgeschlagenes Abmelden bedeutet nicht, dass die Server-Sitzung sicher gültig bleibt – die Copy behauptet das nicht.
- Access Tokens können bis zum Ablauf weiter gültig sein; dieser Slice behauptet kein JWT-Kill.
- Kein authentifizierter Browser-/Real-Device-Beweis.
- Agent-Self-Review ist kein PASS.
- Zentrale Architecture-/Decision-Persistenz bleibt TL-owned nach Merge.

## 9. Offene Freigaben

Kein Product-Owner-Sondergate. Keine Production-Migration. Keine Provider-Aktivierung.

## 10. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Re-Review von Draft-PR #242. Kein Ready. Kein Merge. Kein Folgeslice durch den Autor-Agenten.

## 11. Zuerst lesen

1. `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_TASK_2026-08-30.md`
2. dieser Status
3. `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_HANDOFF_2026-08-30.md`
4. `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_SELF_REVIEW_2026-08-30.md`
5. Review `5060518239`
6. ADR-0192 / AP-5-S3
7. Issue #241
