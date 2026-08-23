# Cursor Task – Jetnity Admin Platform Audit

Stand: 24. August 2026  
Status: **Audit-/Vorbereitungsauftrag – keine unkoordinierte Kernimplementierung vor technischem Closure von PR #38**

## 1. Rolle

Du arbeitest als Senior Product / Admin Platform / Security / Operations / Finance / Analytics Engineer für den Jetnity-Admin-Workstream.

Du arbeitest proaktiv mit: Wenn du eine für Jetnity wichtige zusätzliche Admin-Funktion, Sicherheitsverbesserung, Automatisierung, Architekturverbesserung oder betriebliche Lücke findest, dokumentierst und begründest du sie. Du wartest nicht nur auf einzelne Detailanweisungen. Shared Contracts und kritische Production-Aktionen änderst du trotzdem nicht eigenmächtig.

Dein **exakter Cursor-Anzeigename** muss zu Beginn in der Workstream-Dokumentation eingetragen werden. Jede Statusmeldung/Handoff referenziert diesen sichtbaren Namen.

## 2. Pflichtlektüre

Vor dem Audit lesen:

- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/ADMIN_PLATFORM_PRODUCT_MODEL.md`
- `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
- relevante Admin-/Copilot-/Analytics-/Security-/Billing-/Provider-/RLS-/Bexio-/Ads-/Domain-/E-Mail-Dokumente und Runtime-Dateien

`docs/ADMIN_PLATFORM_PRODUCT_MODEL.md` ist die verbindliche Produktgrundlage. Der Audit soll prüfen, wie das bestehende Admin-System sinnvoll in diese Zielarchitektur überführt wird, ohne professionelle vorhandene Teile unnötig neu zu bauen.

## 3. Ziel

Den heutigen Admin-Bereich vollständig auditieren und daraus einen professionellen Zielplan für eine skalierbare **Jetnity Admin Platform / Backoffice / Control Center** ableiten.

Nicht nur UI prüfen. Rollen, Rechte, Datenzugriffe, Auditierbarkeit, Betriebsprozesse, Provider-/Kostenkontrolle, Buchhaltung, Support, Analytics, Domains/E-Mail, intelligente Steuerzentrale und Sicherheitsgrenzen untersuchen.

Die Admin-Startseite soll später als echte **Steuerzentrale** funktionieren: schnell verständlicher System-, Business-, Security- und Operations-Zustand, priorisierte Alerts/Aufgaben und belastbare KPIs mit Quelle/Freshness.

## 4. Zielbereiche

Mindestens folgende Funktionsgruppen bewerten:

1. **Admin Home / Operations Overview / Steuerzentrale**
   - Systemstatus
   - wichtige Alerts
   - offene operative Aufgaben
   - aktuelle Risiken
   - Production-/Deployment-/Job-Zustand
   - KPIs mit klarer Quelle/Freshness
   - Datenqualität / Stale / Unknown sichtbar

2. **User & Account Administration**
   - Nutzer suchen/ansehen
   - sichere Support-Sicht
   - keine unnötige Einsicht in sensible Daten
   - kontrollierte Rollen-/Statusaktionen
   - keine Service-Role-Abkürzungen ohne Audit

3. **Trip / Content / Support Operations**
   - Reise-/Content-Support soweit erforderlich
   - klare Read-only vs. Write-Grenzen
   - nachvollziehbare Support-Aktionen

4. **Jetnity Copilot Pro / intelligente Steuerzentrale**
   - darf überwachen, analysieren, Anomalien erkennen, Zusammenhänge erklären, priorisieren, vorschlagen, kontrollieren und Verbesserungen vorbereiten
   - soll relevante neue Funktionen und Verbesserungen proaktiv vorschlagen
   - Reports / Briefings / wiederkehrende Operations vorbereiten
   - keine eigenmächtigen gefährlichen Production-/Security-/Billing-/Provider-/Domain-/DNS-/Mail-Aktionen
   - Human-/Product-Owner-Gates sichtbar
   - Evidence, Freshness und vollständiger Audit Trail

5. **Provider & Cost Control**
   - Provider-Status
   - Nutzung / Kosten / Limits
   - Kill Switches
   - Secret-/Environment-Grenzen
   - Aktivierungs-/Vertrags-/Kosten-Gates
   - monatliches Kostenbudget beachten

6. **Security Center**
   - Auth-/RLS-/Permission-Status
   - Security Alerts
   - verdächtige Aktivitäten
   - Audit Logs
   - keine Secrets im UI/Logs
   - sichere Admin-Session-/MFA-/Role-Grenzen

7. **Domains / DNS / E-Mail / Infomaniak**
   - bestehende Domain-/Mail-Architektur und Betriebsrelevanz prüfen
   - offizielle Infomaniak-API/OAuth2-Integration auf Eignung und Least-Privilege-Scopes prüfen
   - jetnity.ch / jetnity.com und weitere relevante Domains: Ablauf, Renewal, DNSSEC, Nameserver, DNS-/Mail-DNS-Health soweit belastbar möglich
   - Mail-Hosting/Mailbox-Status und relevante technische Health-/Quota-/Alias-/Security-Informationen soweit API-seitig unterstützt
   - keine E-Mail-Inhalte standardmäßig in Jetnity spiegeln
   - read-only zuerst; kritische Schreibaktionen nur nach separatem Gate, Step-up und Audit
   - Jetnity soll nicht den kompletten Infomaniak Manager nachbauen, sondern betriebsrelevante Informationen und kontrollierte Aktionen bündeln

8. **Accounting / Finance**
   - professionelles Buchhaltungs-/Finanz-Backoffice-Zielbild
   - Bexio-Integration vorbereiten
   - Umsatz / Provisionen / Affiliate / Abos / Refunds / Gebühren / Steuer/VAT
   - Schweiz zuerst, VAT-Kontext berücksichtigen
   - noch keine unfreigegebene Live-Bexio-/Payment-Integration

9. **Ads / Marketing Operations**
   - Google Ads Integration/Optimierung als spätere kontrollierte Admin-Funktion
   - Budgetgrenzen / Kampagnenstatus / Attribution
   - SEO-/Indexierungs-/Domain-Health mitdenken
   - keine autonomen Spend-Erhöhungen ohne Gate

10. **Analytics / Business Intelligence**
    - belastbare KPIs
    - Quellen/Freshness
    - Funnel / Reisen / Conversion / Affiliate / Subscription / Creator soweit relevant
    - Providerqualität / Kosten pro erfolgreicher Aktion soweit sinnvoll
    - CSV/Export nur kontrolliert

11. **Content / Creator / Review Operations**
    - heutige Admin-Review-Pfade prüfen
    - Moderation / Freigabe / Audit

12. **System / Configuration**
    - Feature Flags / Kill Switches / globale Settings soweit vorhanden
    - Cron-/Job-/Queue-/Deployment-Zustand
    - Environment-Grenzen klar
    - Production-Änderungen nicht beiläufig

13. **Admin UX / Productivity**
    - klare IA und Priorisierung
    - globale Suche / Command-Palette bewerten
    - gespeicherte Filter/Views für wiederkehrende Arbeit bewerten
    - Desktop professionell, Tablet/Notfall-Mobile sinnvoll
    - gefährliche Aktionen visuell und technisch klar trennen

## 5. Audit-Fragen

### Security / Permissions

- Wer darf Admin überhaupt öffnen?
- Wo wird Rolle serverseitig geprüft?
- Gibt es UI-only Guards?
- Welche Tabellen/RPCs/Service-Role-Pfade existieren?
- RLS / SECURITY DEFINER / search_path / Ownership / direct DB bypass
- CSRF / SSR / API authorization
- Logging sensibler Daten
- Admin MFA / Session hardening / future passkeys

### Data / Truth

- Welche Admin-Zahlen sind echte Source of Truth?
- Gibt es Demo-/Fake-/Placeholder-KPIs?
- Freshness / Errors / Unknown sichtbar?
- Können Admin-Aktionen User-/Trip-Truth umgehen?

### Operations

- Welche wiederkehrenden Aufgaben kann Copilot vorbereiten?
- Welche Anomalien soll er erkennen?
- Welche sinnvollen neuen Funktionen sollte Jetnity aus den gefundenen Lücken ableiten?
- Welche Aktionen benötigen ausdrückliche Human-Freigabe?
- Welche Aktionen müssen vollständig auditierbar sein?
- Welche Notfall-/Kill-Switch-Prozesse fehlen?

### Domains / E-Mail

- Welche Infomaniak-Domain-/Mail-Informationen sind für Jetnity tatsächlich betriebsrelevant?
- Welche offiziellen API-Routen/Scopes sind read-only möglich?
- Welche Informationen können ohne unnötige personenbezogene Mailinhalte angezeigt werden?
- Welche DNS-/Mail-Health-Prüfungen sind source-backed und welche müssten separat berechnet werden?
- Welche Schreiboperationen sollten aus Sicherheitsgründen bewusst im Infomaniak Manager bleiben?

### Finance / Accounting

- Welche Daten existieren heute wirklich?
- Was fehlt für revisionsfähige/saubere Buchhaltung?
- Was gehört nach Bexio, was bleibt Jetnity-intern?
- Refund-/Affiliate-/Subscription-/VAT-Flows nur planen, nicht erfinden.

### UX

- Admin ist Arbeitswerkzeug, kein Marketing-Dashboard.
- klare Prioritäten, wenig visuelles Rauschen
- Desktop professionell, aber Tablet/Notfall-Mobile sinnvoll
- gefährliche Aktionen klar getrennt und bestätigt

### Cross-Domain

- Account Platform
- Auth/RLS
- Trips
- Providers
- Domains/E-Mail
- Safety/Seasonal/Readiness
- Billing/Subscription
- Creator/Content
- Analytics
- Support

## 6. Verbotene Änderungen in dieser Auditphase

Bis ChatGPT/Technical Lead nach PR-#38-Closure ausdrücklich Implementierung freigibt:

- keine neuen Admin-Rollen/Rechte in Production
- keine RLS-/DB-Migrationen
- keine Service-Role-Erweiterung
- keine Payment-/Bexio-/Google-Ads-/Provider-/Infomaniak-Live-Aktivierung
- keine Secrets oder OAuth-Tokens
- keine Domain-/DNS-/Mailbox-Schreibaktionen
- keine autonomen Spend-/Refund-/Production-Aktionen
- keine Änderungen an Route/Traveller/Readiness/Safety/Seasonal-Kernverträgen
- kein Mark Ready/Merge

Kleine rein dokumentarische Audit-Artefakte sind erlaubt.

## 7. Lieferobjekte

Im eigenen Workstream-Branch dokumentieren:

1. `docs/ADMIN_PLATFORM_AUDIT.md`
2. `docs/ADMIN_PLATFORM_TARGET_ARCHITECTURE.md`
3. `docs/ADMIN_PLATFORM_IMPLEMENTATION_PLAN.md`
4. Permission-/Security-Matrix
5. Evidence-Matrix: heutiger Pfad → Befund → Risiko → Ziel → betroffene Dateien/DB → Testbedarf
6. `Must fix / Should improve / Later`
7. Dependency-/Conflict-Liste mit Account-Workstream und PR #38
8. vorgeschlagene spätere Implementierungs-Slices mit Branch-/PR-Grenzen
9. Infomaniak-/Domain-/Mail-Integrationseignung mit Scope-/Security-Empfehlung
10. Copilot-Pro-Autonomy-Matrix: darf analysieren / vorbereiten / nach Freigabe ausführen / niemals autonom
11. vollständiges Handoff

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

Nicht "Admin Dashboard mit mehr Karten".

Ziel ist ein professionelles **Jetnity Control Center** für Betrieb, Security, Finance, Provider, Domains/E-Mail, Analytics, Support und kontrollierte intelligente Automation – mit klaren Human-Gates und vollständiger Auditierbarkeit.
