# Jetnity Account Platform – Evidence-Matrix

Stand: 23. August 2026  
Status: **Audit-Evidenz, keine Implementierung**  
Cursor-Anzeigename: **Account plattform audit vorbereitung**  
Branch: `audit/account-platform`

Legende Risiko: H = hoch, M = mittel, L = niedrig.  
Shared: ja = Lead-geschützter Vertrag, nicht in der Auditphase ändern.

| ID | Heutiger Pfad | Befund | Risiko | Ziel | Dateien / DB | Testbedarf | Shared |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | keine Account-IA | Konto ist Auth + Reiseliste | M | Shell Übersicht/Reisen/Reisende/Favoriten/Abo/Einstellungen | `lib/auth/oeffentliche-navigation.ts`, neues `app/account/layout.tsx` | Nav-Zustände gast/konto; Mobile-Shell | nein |
| A2 | `/account/security` | MFA unauffindbar, ohne Chrome | M | unter Einstellungen, V2-Tokens | `app/account/security/page.tsx`, `SecurityMFA.tsx` | Link existiert; Seite ohne Session → Login | nein |
| A3 | `middleware.ts` `?next=` | Login ignoriert `next` | L | Allowlist `/account*`, `/reisen*` | `LoginForm.tsx`, `CallbackClient.tsx` | fremder Host verworfen; deep link `/account/security` | nein |
| A4 | Login/Register OAuth | Buttons trotz disabled Provider | L | Buttons nur bei Enablement | `LoginForm.tsx`, `RegisterForm.tsx`, `config.toml` | Flag-aus → keine Buttons | nein |
| A5 | `/terms` `/privacy` 404 | Consent nicht persistiert | H | Legal + Consent-Register | `RegisterForm.tsx`; später DB | Links 200; Consent-Version gespeichert | ja (DB) |
| A6 | Register-Fehlertext | E-Mail-Enumeration | M | neutrale Meldung | `RegisterForm.tsx` | bestehender + neuer Account gleicher Text | nein |
| A7 | `SecurityMFA` Enroll | kein AAL2/Re-Auth | H | Step-up vor Enroll/Unenroll | `SecurityMFA.tsx`, Auth-Config | Enroll ohne Step-up abgelehnt | ja (Auth) |
| A8 | keine Export/Lösch-UI | CASCADE nur bei auth.users-Delete | H | Selbstbedienung + Audit | `docs/DATENBANK.md`; neue Actions | Export vollständig; Delete entfernt trips/party | ja |
| A9 | `profiles` ungeschrieben | Register nur `user_metadata.name` | M | bewusste Profilzeile | `20260817120300_generisches_profil.sql`, Admin-only Writes | Signup erzeugt user-Rolle, keine Eskalation | ja |
| A10 | `reisenLaden()` flach | keine Zeitgruppen; archived tot | M | Datumsgruppen; Archiv später | `lib/trips/daten.ts`, `Reisekarte.tsx`, `trips.status` | Datumsableitung; ohne Datum ≠ vergangen | Archiv-Write ja |
| A11 | `/reisen` CTA immer Neu | Gast-One-Trip erst im Formular | M | primär Fortsetzen | `reisen/page.tsx`, `GastreiseBestehtFehler` | Gast mit Entwurf: Fortsetzen sichtbar | nein |
| A12 | `Footer.tsx` | immer Anmelden/Register | L | session-aware | `Footer.tsx`, `oeffentliche-navigation.ts` | konto → kein Register-Link | nein |
| A13 | `lib/trips/uebernahme.ts` | Graph ok, Party fail → UI unklar | M | Teilerfolg + Retry-Test | `uebernahme.ts`, `GastreiseBruecke.tsx` | Party-fail behält Entwurf; Retry idempotent | UX nein; RPC ja |
| A14 | `party_schreiben` | weggelassene Traveller bleiben | M | dokumentiertes Replace später | `20260822160000_*.sql` | Omit-Traveller-Verhalten festnageln | ja |
| A15 | ADR-0102 vs Produktmodell | keine Account-Traveller | H | Registry + Participation | `types/trips.ts`, `trip_travellers*` | keine Cross-Trip-Leaks; keine Defaults | ja |
| A16 | Traveller-Kontext | keine erfundene Citizenship | — | beibehalten | `traveller-kontext.ts`, Policies | Account-Prefs setzen keine Citizenship | ja bei Registry |
| A17 | `MFATotpDialog` | kein Focus-Trap / labelledby | M | a11y-Dialog | `MFATotpDialog.tsx` | Keyboard-Falle; Name des Dialogs | nein |
| A18 | Login/Register page | `getSession()` als Gate | L | `getUser()` | `login/page.tsx`, `register/page.tsx` | bestehender Redirect-Test härten | nein |
| A19 | `site_url` localhost | Preview/Prod-Mail-Flows | H | Ops-Gate Redirects | `supabase/config.toml`, `docs/AUTH.md` | `auth:pruefen` gegen Zielumgebung | ja (Auth-Ops) |
| A20 | kein Subscription-Modell | Admin-`payments` ohne user_id | H | Entitlement zuerst | `docs/MONETARISIERUNG.md` | keine Produktlogik an Stripe | ja |
| A21 | Passkey-Copy | Backend aus | L | ehrliche Readiness | `SecurityMFA.tsx` | keine Enroll-Illusion | nein |
| A22 | nur `signOut` aktuell | keine Geräteverwaltung | M | Sessions + logout-all | `app/auth/sign-out.ts` | Liste/Revoke ohne Service Role | Auth-API |
| A23 | `CookieConsent` tot | irreführende Analytics-Copy | L | wahrer Banner oder weiter tot | `CookieConsent.tsx` | nicht einhängen ohne Kategorien | nein |
| A24 | `TripWorkspaceUebersicht` | reiches Reise-Dashboard | H bei Kopie | Account nur cross-trip | `TripWorkspaceUebersicht.tsx` | Account-Übersicht ohne Bereichskarten | nein |
| A25 | Policy-Datei fehlt | `MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md` 404 | L | Datei nachliefern oder Referenzen streichen | Task-Docs | — | Doku |
| A26 | `ACTIVE_WORK_STATUS` auf Branch | behauptete „Seasonal nicht gestartet“ | M | Multi-Agent-Status | dieses Branch-Doc | PR #38 unabhängig verifiziert: Draft OPEN | Doku |

## Unabhängig ausgeführte Tests in dieser Session

| Befehl | Ergebnis | Aussage |
| --- | --- | --- |
| `npx tsx --test lib/trips/uebernahme.test.ts` | 77/77 pass | Graph-Übernahme und Manipulation. Kein Party-Fail-nach-Graph-Fall. |
| `npx tsx --test lib/auth/oeffentliche-navigation.test.ts` | 10/10 pass | Navbar-Sitzungsregeln. Footer nicht abgedeckt. |
| `npx tsx --test lib/supabase/auth-erwartung.test.ts` | 33/33 pass | `config.toml`-Abbildung, nicht Live-API. |
| `npx tsx --test lib/readiness/uebernahme.test.ts` | 4/4 pass | Readiness-Mapping, nicht volle Pipeline. |

Nicht ausgeführt: Production-Build, UI-Audit, `auth:pruefen`, `db:rls`, Browser.

## PR #38 (nur Existenz, kein Code-Review dieses Workstreams)

- URL: https://github.com/Jetnity/jetnity/pull/38
- Branch: `feat/travel-timing-seasonal-intelligence`
- State: OPEN, Draft
- Head zum Prüfzeitpunkt: `f4f2fbd5bf89438ae0ccb6999eb0baa2c536e72f`
- CI/Vercel zum Prüfzeitpunkt: SUCCESS-Kontexte sichtbar
- Dieser Workstream ändert daran nichts
