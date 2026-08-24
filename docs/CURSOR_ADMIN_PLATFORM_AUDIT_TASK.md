# Cursor Task – Jetnity Admin Platform Audit

Stand: 23. August 2026  
Status: **Audit-/Vorbereitungsauftrag – keine unkoordinierte Kernimplementierung vor technischem Closure von PR #38**

## 1. Rolle

Du arbeitest als Senior Product / Admin Platform / Security / Operations / Finance / Analytics Engineer für den Jetnity-Admin-Workstream.

Dein **exakter Cursor-Anzeigename** muss zu Beginn in der Workstream-Dokumentation eingetragen werden. Jede Statusmeldung/Handoff referenziert diesen sichtbaren Namen.

## 2. Pflichtlektüre

Vor dem Audit lesen:

- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/MULTI_AGENT_DEVELOPMENT_TEAM_POLICY.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
- relevante Admin-/Copilot-/Analytics-/Security-/Billing-/Provider-/RLS-/Bexio-/Ads-Dokumente und Runtime-Dateien

## 3. Ziel

Den heutigen Admin-Bereich vollständig auditieren und daraus einen professionellen Zielplan für eine skalierbare **Jetnity Admin Platform / Backoffice** ableiten.

Nicht nur UI prüfen. Rollen, Rechte, Datenzugriffe, Auditierbarkeit, Betriebsprozesse, Provider-/Kostenkontrolle, Buchhaltung, Support, Analytics und Sicherheitsgrenzen untersuchen.

## 4. Zielbereiche

Mindestens folgende Funktionsgruppen bewerten:

1. **Admin Home / Operations Overview**
   - Systemstatus
   - wichtige Alerts
   - offene operative Aufgaben
   - aktuelle Risiken
   - KPIs mit klarer Quelle/Freshness

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

4. **Jetnity Copilot Pro**
   - darf überwachen, analysieren, vorschlagen, kontrollieren und Verbesserungen vorbereiten
   - keine eigenmächtigen gefährlichen Production-/Security-/Billing-/Provider-Aktionen
   - Human-/Product-Owner-Gates sichtbar
   - Evidence und Audit Trail

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

7. **Accounting / Finance**
   - professionelles Buchhaltungs-/Finanz-Backoffice-Zielbild
   - Bexio-Integration vorbereiten
   - Umsatz / Provisionen / Affiliate / Abos / Refunds / Gebühren / Steuer/VAT
   - Schweiz zuerst, VAT-Kontext berücksichtigen
   - noch keine unfreigegebene Live-Bexio-/Payment-Integration

8. **Ads / Marketing Operations**
   - Google Ads Integration/Optimierung als spätere kontrollierte Admin-Funktion
   - Budgetgrenzen / Kampagnenstatus / Attribution
   - keine autonomen Spend-Erhöhungen ohne Gate

9. **Analytics / Business Intelligence**
   - belastbare KPIs
   - Quellen/Freshness
   - Funnel / Reisen / Conversion / Affiliate / Subscription / Creator soweit relevant
   - CSV/Export nur kontrolliert

10. **Content / Creator / Review Operations**
    - heutige Admin-Review-Pfade prüfen
    - Moderation / Freigabe / Audit

11. **System / Configuration**
    - Feature Flags / Kill Switches / globale Settings soweit vorhanden
    - Environment-Grenzen klar
    - Production-Änderungen nicht beiläufig

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
- Welche Aktionen benötigen ausdrückliche Human-Freigabe?
- Welche Aktionen müssen vollständig auditierbar sein?
- Welche Notfall-/Kill-Switch-Prozesse fehlen?

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
- keine Payment-/Bexio-/Google-Ads-/Provider-Live-Aktivierung
- keine Secrets
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
9. vollständiges Handoff

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

Ziel ist ein professionelles Backoffice für Betrieb, Security, Finance, Provider, Analytics, Support und kontrollierte Automation – mit klaren Human-Gates und vollständiger Auditierbarkeit.
