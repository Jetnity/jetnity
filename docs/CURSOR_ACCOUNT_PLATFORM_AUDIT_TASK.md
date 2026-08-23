# Cursor Task – Jetnity Account Platform Audit

Stand: 23. August 2026  
Status: **Audit-/Vorbereitungsauftrag – keine unkoordinierte Kernimplementierung vor technischem Closure von PR #38**

## 1. Rolle

Du arbeitest als Senior Product / Frontend / Backend / Auth / Security / UX Engineer für den Jetnity-Benutzerkonto-Workstream.

Dein **exakter Cursor-Anzeigename** muss zu Beginn in der Workstream-Dokumentation eingetragen werden. Jede Statusmeldung/Handoff referenziert diesen sichtbaren Namen.

## 2. Pflichtlektüre

Vor dem Audit lesen:

- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/ACCOUNT_TRIP_WORKSPACE_PRODUCT_MODEL.md`
- `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`
- relevante Auth-/Account-/Traveller-/Guest→Account-/RLS-/Privacy-Dokumente und Runtime-Dateien

## 3. Ziel

Den heutigen Benutzerkonto-Bereich vollständig fachlich, technisch, sicherheitsbezogen und UX-seitig auditieren und daraus einen belastbaren Implementierungsplan für eine professionelle **Jetnity Account Platform** ableiten.

Nicht nur UI anschauen. Bestehende Datenflüsse, Auth, Persistenz, RLS, Guest→Account, Traveller Context und Abhängigkeiten zum Trip Workspace prüfen.

## 4. Zielmodell

Verbindlich gilt:

> **Benutzerkonto = persönliches dauerhaftes Zuhause des Kunden.**

> **Trip Workspace = operative Zentrale genau einer Reise.**

Das Account-Dashboard darf keine Kopie des Trip Workspace werden.

Zielbereiche des Accounts:

- Übersicht
- Meine Reisen
- Reisende/Familie
- persönliches Reiseprofil/Präferenzen
- Favoriten/Wunschlisten/Reisegedächtnis
- reiseübergreifende Buchungsübersicht
- Benachrichtigungen
- Abonnement/Zahlungen
- Sicherheit/MFA/Passkeys-Perspektive/Sessions
- Datenschutz/Datenexport/Kontolöschung
- strukturierte Dokumentdaten mit strengen Privacy-Grenzen
- verbundene Dienste
- Support/Kontoaktivität

Sichtbare Hauptnavigation möglichst kompakt: ungefähr Übersicht / Reisen / Reisende / Favoriten / Abonnement / Einstellungen.

## 5. Audit-Fragen

Mindestens prüfen:

### Produkt / Informationsarchitektur

- Welche Account-Seiten existieren heute?
- Welche Funktionen fehlen oder sind doppelt?
- Welche Inhalte gehören fälschlich in Account statt Workspace oder umgekehrt?
- Wie landet der Nutzer nach Login sinnvoll bei nächster/aktiver Reise?
- Wie funktioniert "Meine Reisen" heute?

### Account vs Traveller

- Accountbesitzer ist nicht automatisch einziger Traveller.
- Wie werden Partner/Kinder/Mitreisende verwaltet?
- Mehrere Staatsbürgerschaften und Dokumente pro Traveller.
- Dokument↔Citizenship nur explizit.
- Keine Passwahl erfinden.

### Auth / Security

- Registrierung/Login/Logout
- E-Mail-Bestätigung
- MFA/TOTP
- OAuth Google/Apple soweit vorhanden
- Session-/Device-Handling
- Passwort-Reset/Recovery
- Account Enumeration / Rate Limits / CSRF / Redirects / Open Redirects
- serverseitige Ownership Checks
- RLS / Rollen / Service-Role-Pfade
- sensible Daten / Logs / Analytics

### Guest→Account

- bestehende Gastreise korrekt übernehmen
- kein Datenverlust
- keine doppelten Reisen
- Retry/Idempotenz
- Konflikte mit bereits vorhandenem Accountzustand
- Traveller-/Readiness-/Route-Truth bleibt konsistent

### Privacy / Compliance

- Datenauskunft/Export
- Kontolöschung
- Consent / connected services
- DSG/DSGVO-relevante Datenflüsse
- keine Passnummern, Scans, MRZ oder Biometrie ohne separaten späteren Vault-Gate

### Subscription / Billing Readiness

- heutiger Stand
- sauberer zukünftiger Platz für Tarif, Rechnungen, Zahlungsmethode, Upgrade/Downgrade/Kündigung
- keine unnötige Payment-Implementierung in diesem Audit

### UX / Geräte

- Smartphone zuerst, zusätzlich Tablet/Laptop/Desktop
- klare Hierarchie
- wenige Hauptbereiche
- leere Zustände / Fehler / Loading / Stale
- Accessibility / Touch / Keyboard soweit relevant

### Cross-Domain

- Meine Reisen ↔ Trip Workspace
- Traveller ↔ Readiness / Entry
- Favorites ↔ Workspace
- Notifications ↔ Safety / Seasonal / Booking
- Account Preferences ↔ Empfehlungen, aber keine falsche Hard Truth

## 6. Verbotene Änderungen in dieser Auditphase

Bis ChatGPT/Technical Lead nach PR-#38-Closure ausdrücklich Implementierung freigibt:

- keine unkoordinierten Änderungen an Auth-/RLS-/DB-Kernverträgen
- keine Migrationen
- keine Production-Änderungen
- keine Provider-/Payment-/Secret-Aktivierung
- keine Änderungen an Route/Traveller/Readiness/Safety/Seasonal-Truth-Contracts
- kein Mark Ready/Merge

Kleine rein dokumentarische Audit-Artefakte sind erlaubt.

## 7. Lieferobjekte

Im eigenen Workstream-Branch dokumentieren:

1. `docs/ACCOUNT_PLATFORM_AUDIT.md`
2. `docs/ACCOUNT_PLATFORM_TARGET_ARCHITECTURE.md`
3. `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
4. Evidence-Matrix: heutiger Pfad → Befund → Risiko → Ziel → betroffene Dateien/DB → Testbedarf
5. klare Liste `Must fix / Should improve / Later`
6. Dependency-/Conflict-Liste mit Admin-Workstream und PR #38
7. vorgeschlagene Branch-/PR-Scope-Grenzen für die spätere Implementierung
8. vollständiges Handoff

## 8. Handoff-Pflicht

Jeder wichtige Meilenstein und spätestens vor Fertigmeldung muss enthalten:

- exakter Cursor-Anzeigename
- Workstream
- Branch / PR / Runtime-Head
- geprüfte Bereiche
- konkrete Befunde
- Entscheidungen/Annahmen
- offene Risiken/Blocker
- Abhängigkeiten
- Tests/Gates (falls ausgeführt)
- exakter nächster Schritt

Keine wichtige Erkenntnis darf nur in der Cursor-Session existieren.

## 9. Qualitätsmaßstab

Nicht "Profilseite schöner machen".

Ziel ist eine professionelle, skalierbare, sichere Account Platform, die Jetnitys Reiseprodukt unterstützt, ohne den Trip Workspace zu duplizieren.
