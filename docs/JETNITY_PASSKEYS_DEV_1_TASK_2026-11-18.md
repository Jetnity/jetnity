# Jetnity Passkeys Dev 1 — versionierter Cursor-Auftrag

**Owner-Auftrag:** 18.11.2026, Passkeys auf `jetnity.com/account/security` fehlen; der Owner fordert eine **zweite, unabhängige Cursor-Agentenlane**.  
**Issue:** [#1239](https://github.com/Jetnity/jetnity/issues/1239)  
**PR:** eigener Draft ab `main`, Branch `feat/passkeys-dev-1-20261118`.  
**Exact Main Baseline:** `f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5`, [Main CI 44333651972](https://github.com/Jetnity/jetnity/actions/runs/44333651972) SUCCESS; vor Arbeit aktualisieren, wenn inzwischen neuer.  
**Cursor-Agent — exakter logischer Anzeigename:** `Jetnity Passkeys Dev 1`  
**Generation:** 1 für diesen separaten Passkey-Workstream; tatsächliche Cursor-Sitzung und Modell **erst nach dem realen Start** dokumentieren, nie erfinden.  
**Arbeitsmodus:** `NORMAL` zum Ausgangspunkt; stets Live-Recheck gegen `.jetnity/operating-mode.json`.  
**Freigabe:** nur enger Code-/Dokumentations-/Test-**Draft** und lokale/isolierte Dev-Reproduktion. **Kein Supabase-Auth-Apply, keine Production-Veränderung, kein Merge/Ready.** Grundlegende Auth-/MFA-Vertragsänderungen sind besondere Owner-Gates.

## 1. Ausgangslage (nicht erfinden)

- Owner-Screenshot vom 18.11.: `/account/security` zeigt TOTP als eingerichtete Authenticator-App und Passkeys als **„nicht unterstützt“**. Browser-WebAuthn-Unterstützung ersetzt nicht die Serverfreigabe.
- Live Code: `supabase/config.toml` enthält `[auth.passkey] enabled = false`; `lib/auth/account-security-passkeys-lesen.ts` und `lib/auth/account-security-lage.ts` lassen die Passkey-UI absichtlich fail-closed. `components/account/SecurityMFA.tsx` hat TOTP + eine ehrliche, noch funktionslose Passkey-Anzeige. Eine Serveraktivierung ist kein blosses Frontend-Flag.
- `lib/supabase/client.ts` erstellt via `@supabase/ssr` den Browser-Client; `package.json` erklärt für `@supabase/supabase-js` `^2.50.2` (tatsächliche Lock-Version **zuerst prüfen**).
- Aktuelle [Supabase Passkey Docs](https://supabase.com/docs/guides/auth/passkeys), [Beta Changelog](https://supabase.com/changelog/46458-passkeys-for-supabase-auth-beta): **experimentelles WebAuthn/Passkey-API**, `@supabase/supabase-js >=2.105.0` erforderlich; `auth.experimental.passkey=true` auf dem verwendeten Client und separates **serverseitiges Passkey-Enable**, gesicherte `RP ID` + passende HTTPS-Origins. Auth-Passkeys (erster Login-Faktor) **nicht** mit bereits eingerichteter TOTP-MFA und obligatorischem Admin-AAL2 gleichsetzen.
- Andere Arbeit: KI Runtime Recovery [#1238](https://github.com/Jetnity/jetnity/pull/1238) auf eigenem Branch; Gesamtplan [#1235](https://github.com/Jetnity/jetnity/pull/1235) Draft; Official Truth/Einreise/DB ist exklusiver Parallel-TL. **Keine Dateiüberschneidung.**

## 2. Ziel und Nutzervertrag

Eine **optionale**, phishing-resistente Passkey-Erfahrung für die Jetnity-Web-App in einem isolierten Draft implementieren und zum Dev-Test vorbereiten, **ohne** die bestehende Authentifizierung zu beschädigen:

1. Ein angemeldetes, bestätigtes reguläres Konto darf bei bestätigter geeigneter Dev-Serverfähigkeit bewusst einen Passkey registrieren (WebAuthn/biometrisch/HW-Schlüssel), danach seine gespeicherten Passkeys sachlich korrekt auflisten; optionale Umbenennung und Entfernen nur bei verifizierter Berechtigung und sicherem Recovery.
2. Ein Benutzer mit vorhandenem Passkey darf auf der Login-Seite **optional** passkeybasiert einloggen. E-Mail/Passwort und TOTP bleiben vollständig benutzbar und werden nicht ersetzt.
3. Nach Passkey-Login **bestehende Server-/Client-Session- und AAL-Prüfung erneut durchführen**. Hat ein Konto TOTP/AAL2-Requirement, muss der vorhandene Step-up weiterhin zwingend erfolgen. **Kein** Passkey-Login darf Admin-Owner-AAL2, MFA-Enrolment oder privilegierte Datenzugriffe umgehen.
4. Ohne bestätigte echte Serverfreigabe, bei Preview-Scope-Unsicherheit oder inkompatibler installierter SDK-Version bleiben Passkeys ausdrücklich **nicht verfügbar**; nie eine einsatzbereite Schaltfläche versprechen, die keine Auth-Funktion hat.
5. Bestehende Authenticator-App/TOTP inkl. Entfernen/Neueinrichten, Login, Logout, Passwort-Reset, Guest→Account, Sessions und Fehlerbehandlung bleiben unverändert funktionsfähig.

**Wichtig:** Passkeys dienen hier zunächst als Web-Login-/Kontofunktion, **nicht** als eigenständiger Ersatz des zweiten Faktors. Separate MFA-WebAuthn-Aktivierung, Passwordless-only oder erzwungene Umstellung auf Passkeys sind **nicht beauftragt**. Native Apps und Gerätesynchronisierung gehören späteren Phasen.

## 3. Erst Diagnose, Architektur und Sicherheit

Vor Änderungen lesen:
- `.jetnity/operating-mode.json`, `JETNITY_START_HERE.md`, `AGENTS.md`, `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`, `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`, diesen Task und das Issue.
- `docs/AUTH.md`, `DECISIONS.md`/relevante Auth-ADRs, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `supabase/config.toml` **nur lesen**, `lib/auth/account-security-*.ts`, `components/account/SecurityMFA.tsx`, `components/auth/LoginForm.tsx`, MFA- und AAL2-Guards.
- Prüfe den **exakten** `@supabase/supabase-js` Lock-Eintrag und tatsächliche `@supabase/ssr`-Kompatibilität; die Supabase-Veröffentlichungen/aktuelle API per offiziellen Quellen. Keine nur aus npm-Semver angenommene Runtime-Kompatibilität.
- Prüfe geplante RP-ID `jetnity.com` gegen die **tatsächlich** nötigen Dev-Test-Origins. Keine Annahme, dass fremde `*.vercel.app`-Preview-Origins denselben RP erfüllen. Eine RP-ID/Origin-Änderung kann bestehende Passkeys unbrauchbar machen; sichere gleiche Domain/Dev-Teststrategie **nur planen**, keine Config-Apply.
- Tatsächliche Dev-/Production-Auth-Config kann von Repo-`config.toml` abweichen. Nur lesenden, zulässigen Konfigurations-Readback nutzen; **niemals** Secrets oder Sessiondaten veröffentlichen.
- Prüfe die Cursor-/Agenten-Parallelität und fremde PR-File-Sets. Keine implizite Owner-Freigabe für Supabase-Dashboard-Toggle, ENV, Auth-Migration, Auth-Roles, JWT, Redirect-Allowlist oder Production.

## 4. Eng begrenzte Code-Draft-Arbeit

**Nach unabhängiger Scope-Verifikation** darfst du in deinem eigenen Branch die kleinste sichere, isolierte Implementierung vorbereiten:

- Neue eigene Passkey-Service-/UI-/Testdateien unter `lib/auth/`, `components/account/` und `components/auth/` (z. B. getrennte `PasskeyManagement` und `PasskeySignIn`-Komponenten) mit einer **injizierbaren, testbaren, server-/feature-gated** Supabase-Passkey-Port-Schnittstelle.
- Begrenzte, überprüfbare Ergänzung in `app/account/security/page.tsx` und `components/auth/LoginForm.tsx`, ohne bestehende Auth-/TOTP-Pfade umzuschreiben; TOTP-Faktor in `SecurityMFA.tsx` vorzugsweise unangetastet.
- Wenn für eine funktionsfähige Draft-Implementierung **zwingend** das Supabase SDK aktualisiert werden muss, auf `package.json`/`package-lock.json` nur die **minimal nötige**, zusammengehörige, gepinnte und auditierbare Versionsänderung vorbereiten. Keine andere Dependency, kein globales SDK-Rewrite. Bei Kompatibilitäts-/Security-/SSR-Folgeeffekt: **STOP + TL-Review**, nicht weiter umbauen. Passkey-Draft bleibt ohne Owner-Dev-Enable **nicht live**.
- Neue **eigene** Offline-/Unit-/UI-Browser-Tests nur für Passkey-Zustände, Registrierung, Login, Verwaltung, WebAuthn-Abbruch, abgelaufene Challenge, fehlendes Backend, Browser-Unterstützung, falsche Origin, bereits existierendes Credential, Recovery; auch Negativtests gegen MFA/AAL2-Bypass und Unterbrechung bestehender TOTP-Loginpfade.
- Kein eigener WebAuthn-Verifier oder unsichere kryptografische Logik; vorhandene offizielle Supabase-JS-API nutzen, aber **nur** nach belegter SDK-Kompatibilität. User-Credential-Operationen bleiben bei Supabase Auth; kein zusätzlicher Persistenzspeicher.
- Alle echten Supabase/WebAuthn-Aufrufe in Tests durch **isolierte deterministische Fakes** ersetzen, kein echter Auth-Write oder neues Kundenkonto.

**Gesperrte Dateien/Aktionen:** `supabase/**`, `scripts/db/**`, `types/supabase.ts`, `.github/**`, CI, `lib/readiness/**`, `components/readiness/**`, `app/api/readiness/**`, jede Official-Truth-/Einreise-/Datenbank-Datei, -Migration, -Test; fremde PRs/Branches; `ROADMAP.md`, `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md`, Phasen-/Strategie-Register, `AGENTS.md`; Vercel-ENV, Supabase-Dev-/Production-Config-Apply, Auth-Dashboard, Keys, MFA/AAL2-Gates, OAuth, Konto-Policies, Provider-Livecalls, Production, Merge/Ready.

Wenn die nötige Änderung **nur** mit gesperrten Auth-/SDK-/Global-Shared-Contracts, Migration/Server-Konfiguration oder AAL2-Verhalten möglich ist: **STOP**, Umfang und sichere Dev-Freigabe für Technical Lead/Owner dokumentieren. Keine Schein-Aktivierung und kein Umgehen des Auth-Gates.

## 5. Pflicht-Abnahmekriterien

- **A1 – Releasegrenzen:** Echtes Backend-Enable nur bei bestätigtem passkeyfähigen Supabase-Dev-Auth, geeignetem RP/Origin, passender SDK-Version und eigener Owner-Dev-Freigabe. Production bleibt passkeys OFF, keine Änderung an \(jetnity.com\).
- **A2 – Bestehender Login:** Passwort/TOTP-Flow, Admin AAL2/2FA, Cookies, Sessions, Guest-Nutzung unverändert; kein Fake-Success, keine Silent-Login-Transition.
- **A3 – Passkey-Funktionalität:** Registrierung nur durch bestätigten Nutzer, Passkey-Anmeldung korrektes authenticator selection, Listing und (nur sicher zulässig) Delete/Rename mit eigener berechtigter Sitzung, begrenzten Fehlermeldungen und Recovery; falls nicht sicher nachweisbar, Teilfunktion fail-closed.
- **A4 – Security/Privacy:** Kein Passkey-Secret/Private Key in JS oder Jetnity-Datenbank; keine Nutzer-Email oder Provider-Token in Logs; sichere RP-ID/Origin; Replay/Challenge und Credential-Reuse nur durch offiziellen Backend-Flow.
- **A5 – Unabhängige Tests:** TypeScript, gezielte Tests, bestehende Auth-/MFA-Regressionssuite, Lint, Build, CI auf exaktem Head. Vercel Preview nur in verifiziert isoliertem Dev ohne Live-RP-Enable; Tests unterscheiden `MOCK_PASS` von `HOSTED_E2E_NOT_RUN`.
- **A6 – Handoff:** vollständiger Dateisatz, Kompatibilitätsmatrix, behobene Risiken, noch nötige Owner-Schritte (Dev-Supabase-Enable, RP-/Origin-Konfiguration, Owner-Login/2FA, realer Dev-Chrome/Safari/Android/iOS Smoke-Test, Production Release separat). Keine eigene Ready/Merge-Freigabe.

## 6. Dokumentation und Stopp

Im eigenen PR dokumentieren:
- `docs/JETNITY_PASSKEYS_DEV_1_STATUS_2026-11-18.md`: konkrete Erkenntnisse und Exact-Head, Blocker;
- `docs/JETNITY_PASSKEYS_DEV_1_SELF_REVIEW_2026-11-18.md`: Scope- und Auth-Sicherheit;
- `docs/JETNITY_PASSKEYS_DEV_1_HANDOFF_2026-11-18.md`: aktuelle CI/Preview, Owner-Gates, echte Cursor-Session-Kennung/Modell, nächster begrenzter Review-Schritt.

**Kein reales Dev-/Production-Login, 2FA-Code oder Passwort im PR/Chat.** Kein Secretwert lesen oder speichern. Bei unverifizierter Beta-/Auth-Unterstützung oder nicht passendem RP: **BLOCKED – kein Produkt-Fertig-Claim**.

**STOP: Do not mark Ready. Do not merge. Do not start a follow-up slice. Do not dispatch another agent.** Nur der ChatGPT Technical Lead darf nach unabhängiger Exact-Head-Prüfung PASS/CHANGES REQUIRED entscheiden. Alle Auth-/AAL2-/Supabase-/Production-Gates verbleiben beim Owner.
