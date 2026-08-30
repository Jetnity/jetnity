# Jetnity – AP-5-R1 Honest Global Logout Failure Semantics – Status

Stand: 30. August 2026  
Status: **IMPLEMENTIERT / DRAFT / STOPP FÜR UNABHÄNGIGEN TECHNICAL-LEAD EXACT-HEAD-REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**  
Workstream: Account / Security  
Cursor-Agent: **`Account plattform audit vorbereitung 22`**  
Cursor-Session/Run-ID: `bc-f631838b-21f3-4290-aa1f-db450a037ac3`  
Beobachteter Run-Titel: `Ehrliche globale abmeldefehlersemantik`  
Issue: [#241](https://github.com/Jetnity/jetnity/issues/241)  
Branch: `feat/ap5-r1-honest-global-logout-2026-08-30`  
Draft-PR: https://github.com/Jetnity/jetnity/pull/242

> Live-Evidence gewinnt. Dieser Status ist Authoring-/Handoff-Evidence, kein Technical-Lead-PASS.

## 1. Live-Rekonstruktion dieses Agenten

| Feld | Wert |
| --- | --- |
| Feature-Branch-Start | `a261db267841e81be396bb9027625c500701114c` – Task-only |
| Baseline / Merge-Base | `main @ 5129be01a9b8785bc9d7fed01a33186fa97345a1` |
| Logical Cursor-Agent | `Account plattform audit vorbereitung 22` |
| Cursor-Run | https://cursor.com/agents/bc-f631838b-21f3-4290-aa1f-db450a037ac3 |
| `main` Branch Protection | nicht in diesem Slice angefasst |
| Issue #241 | OPEN |
| Draft-PR | #242, bleibt Draft |
| AP-5-S3 scoped Logout | **unberührt** (`local` / `others` / `global`) |
| Folgeslice | **nicht gestartet** |

## 2. Caller-Inventar (vor Codeänderung, gegen aktuellen Branch)

Echte Runtime-Caller von `signOutAction` / `signOutToAdminLoginAction`:

| Fläche | Datei | Aktion | Success-Ziel | Bemerkung |
| --- | --- | --- | --- | --- |
| Öffentliche Navbar | `components/layout/PublicNavbar.tsx` | `signOutAction` | `/` | Desktop + Mobile |
| Footer | `components/layout/FooterSitzung.tsx` | `signOutAction` | `/` | dieselbe Session-Navigation |
| Unauthorized | `app/unauthorized/page.tsx` | `signOutAction` | `/` | Server-Seite, Client-Formular |
| Admin-Topbar | `components/layout/AdminTopbar.tsx` | `signOutAction` | `/` | bestehendes Ziel, nicht `/admin/login` |
| Admin-Login | `app/(public)/admin/login/page.tsx` | `signOutToAdminLoginAction` | `/admin/login` | fest im Code |

Geprüft und **keine** allgemeinen Caller:

- `app/account/security/logout-action.ts` – AP-5-S3 scoped Authority
- `components/account/SecurityLogout.tsx` – nur `accountLogoutScopeAction`
- `components/account/SecurityMFA.tsx` – nur scoped `local` über S3/S4
- `app/(public)/admin/login/actions.ts` – internes `signOut()` nach Login-Denial, kein allgemeiner Logout-Caller

## 3. Was dieser Slice geliefert hat

1. Allgemeine/admin Logout-Actions prüfen `{ error }` und fangen Operationswürfe.
2. Success-Redirect nur nach bestätigtem unscoped `signOut()`.
3. Public-Ziel bleibt `/`. Admin-Login-Ziel bleibt `/admin/login`.
4. Kein anfragegesteuertes Redirect-Ziel.
5. Kleines Client-Formular mit `useActionState`, sichtbarer `role="alert"` / `aria-live="assertive"`-Copy, gleicher Submit als Retry.
6. Navbar schließt das Mobile-Menü nicht mehr beim Klick auf Abmelden, damit ein Fehler sichtbar bleibt.
7. Admin-Topbar schließt das Menü nicht mehr beim Submit; bei Fehler bleibt es offen.
8. AP-5-S3 `local` / `others` / `global` unverändert.

Nicht geliefert: Scope-Wechsel des allgemeinen Logout, Sessionliste, MFA/AAL-Änderung, Auth-Config, DB/RLS, PrivacyBee/AP-6/AP-7/AP-8.

**Traveller-Kontext:** nicht relevant. Logout hängt nicht von Citizenship, Dokumenten oder Route ab.

## 4. Vertrag

| Aussage | Klasse | Evidence |
| --- | --- | --- |
| Allgemeines Abmelden bleibt unscoped / global | **current** | `await supabase.auth.signOut()` ohne Options; Gate-0 + S3-Vertragstests |
| Success `/` nur nach bestätigtem Erfolg | **current** | `globalesSignOutDarfWeiterleiten` + `redirect(ergebnis.ziel)` |
| Success `/admin/login` nur nach bestätigtem Erfolg | **current** | `signOutToAdminLoginAction` |
| `{ error }` und Wurf sind kein Success-Redirect | **current** | `globales-sign-out.test.ts` |
| Copy ohne Rohtexte/Tokens/Session-IDs | **current** | Dicht-Tests + feste Texte |
| Kein Open Redirect | **current** | Allowlist `/` und `/admin/login`; Formularfelder ungelesen |
| S3-Scopes unverändert | **current** | S3-Unit + Vertragstests grün; keine Edits an S3-Dateien |

## 5. Tests / Evidence dieses Slices

| Lauf | Ergebnis |
| --- | --- |
| Focused R1-Unit | **7/7 pass** (`lib/auth/globales-sign-out.test.ts`) |
| R1 Vertrag/Caller/A11y | **5/5 pass** (`lib/auth/ap5-r1-honest-global-logout.test.ts`) |
| S3-Unit + Vertrag | **pass** (unverändert) |
| Gate-0-Inventory | **8/8 pass** |
| `npm test` | **2771/2771 pass** |
| `npm run typecheck` | pass |
| `npm run lint` | **0 errors / 135 warnings** (bestehende Next-16/React-Compiler-Linie; R1-Dateien 0 Findings) |
| Hygiene | `check:dead` nur CookieConsent-Ausnahme; `check:exports` 761 Dateien / 0 unbegründete Exporte; `check:deps` sauber; `check:api-schutz` 12/12; `check:schema-bezug` pass |
| `npm run auth:pruefen` | **55/55**, 242 Schlüssel |
| `npm run build` | Production-Build Next.js 16.3.3 Turbopack erfolgreich |
| Browser / Real-Device | nicht gelaufen, nicht behauptet |
| Exact-Head GitHub Actions / Vercel | werden am finalen Stamp-Head live geprüft; nicht vorab behauptet |

## 6. DB / RLS / Production-Grenze

Keine Migration. Kein RLS-/Ownership-/Identity-Write. Kein Auth-Config-Push. Keine Service Role. `supabase/config.toml` unverändert.

## 7. Kosten / Provider / Secrets

Keine neuen laufenden Kosten. Keine Provider. Keine Secrets.

## 8. Residuals / Risiken

- Admin-Topbar bleibt ein `signOutAction`-Caller und landet bei Erfolg weiter auf `/`, nicht auf `/admin/login`. Das ist inventarisierter Bestand, kein stiller Rewrite.
- `app/(public)/admin/login/actions.ts` ignoriert weiterhin `{ error }` beim Denial-Cleanup-`signOut()`. Das ist kein allgemeiner Logout-Caller und bleibt außerhalb.
- Ein fehlgeschlagenes Abmelden bedeutet nicht, dass die Server-Sitzung sicher gültig bleibt – die Copy behauptet das nicht.
- Access Tokens können bis zum Ablauf weiter gültig sein; dieser Slice behauptet kein JWT-Kill.
- Kein authentifizierter Browser-/Real-Device-Beweis.
- Agent-Self-Review ist kein PASS.

## 9. Offene Freigaben

Kein Product-Owner-Sondergate. Keine Production-Migration. Keine Provider-Aktivierung.

## 10. Exakter nächster Schritt

Unabhängiger Technical-Lead Exact-Head-Review von Draft-PR #242. Kein Ready. Kein Merge. Kein Folgeslice durch den Autor-Agenten.

## 11. Zuerst lesen

1. `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_TASK_2026-08-30.md`
2. dieser Status
3. `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_HANDOFF_2026-08-30.md`
4. `docs/AP5_R1_HONEST_GLOBAL_LOGOUT_FAILURE_SEMANTICS_SELF_REVIEW_2026-08-30.md`
5. ADR-0200
6. ADR-0192 / AP-5-S3
7. Issue #241
