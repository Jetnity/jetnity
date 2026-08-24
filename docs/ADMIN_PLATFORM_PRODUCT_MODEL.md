# Jetnity Admin Platform – Product Model / Steuerzentrale

Stand: 24. August 2026  
Status: **verbindliches Produktziel für Audit und spätere Implementierung**  

## 1. Grundsatz

Der Jetnity-Admin-Bereich wird nicht als Sammlung einzelner Verwaltungsseiten gebaut, sondern als professionelle, sehr übersichtliche **Jetnity Control Center / Steuerzentrale**.

Ziel:

> Der Betreiber soll in wenigen Sekunden verstehen, wie es Jetnity technisch, geschäftlich, sicherheitsseitig und operativ geht, was Aufmerksamkeit benötigt und welche nächsten Aktionen sinnvoll sind.

Der Admin ist ein internes Arbeits- und Entscheidungswerkzeug. Er ist kein Marketing-Dashboard und kein zweites Benutzerkonto.

## 2. UX-Ziel

- sehr klare Informationsarchitektur
- ruhige, professionelle Oberfläche mit wenig visuellem Rauschen
- Priorisierung nach Relevanz und Dringlichkeit
- Desktop-first für tiefes Arbeiten, aber Tablet und Notfall-Mobile müssen sinnvoll funktionieren
- globale Suche / Command-Palette für Nutzer, Reisen, Provider, Fehler, Rechnungen, Inhalte und Einstellungen
- gespeicherte Filter und Ansichten für wiederkehrende Arbeit
- gefährliche Aktionen klar getrennt, bestätigt und auditierbar
- Unknown / stale / unavailable muss sichtbar sein; keine erfundenen grünen KPIs

## 3. Admin Home / Steuerzentrale

Die Startseite soll die wichtigsten Informationen über Jetnity bündeln:

- Gesamtzustand der Website / App
- Production-/Preview-/Deployment-Zustand
- kritische Fehler und neue Exceptions
- Verfügbarkeit wichtiger APIs / Provider
- Auth-/Login-/RLS-/Security-Status
- offene operative Aufgaben
- Nutzer-/Reiseaktivität
- Conversion / Affiliate / Subscription / Revenue-KPIs soweit belastbar vorhanden
- Providerkosten, Limits und Budgetstatus
- Zahlungs-/Refund-/Buchhaltungsauffälligkeiten
- Supportfälle
- Content-/Moderationsaufgaben
- SEO-/Indexierungs-/Domain-/E-Mail-relevante Warnungen
- geplante Jobs / Cron / Queue / fehlgeschlagene Tasks
- Datenqualität / Freshness / Stale-Evidence

Jede Kennzahl braucht Quelle, Aktualisierungszeit und bei Unsicherheit einen sichtbaren Status.

## 4. Intelligent arbeitende Steuerzentrale / Jetnity Copilot Pro

Jetnity Copilot Pro soll als intelligenter Betriebsassistent über den Admin-Bereich arbeiten können.

Er darf:

- Systemzustände und KPIs analysieren
- Anomalien, Ausfälle, Kostenanstiege und Qualitätsprobleme erkennen
- Zusammenhänge zwischen Bereichen erklären
- priorisierte Handlungsempfehlungen erstellen
- relevante neue Funktionen und Verbesserungen proaktiv vorschlagen
- Prüfungen und Changes vorbereiten
- Reports und tägliche/periodische Briefings erzeugen
- wiederkehrende operative Aufgaben vorbereiten oder innerhalb ausdrücklich freigegebener Grenzen automatisieren
- auf bestehende Evidence, Freshness und Audit-Trails verweisen

Er darf nicht ohne geeignete Freigabe:

- Production-Security-Verträge verändern
- Rollen/Rechte erweitern
- Secrets offenlegen oder ändern
- Zahlungen/Refunds/Transfers ausführen
- Werbebudgets erhöhen
- Provider-/API-Verträge kostenpflichtig aktivieren
- Domains/DNS/Mail kritische Änderungen durchführen
- Nutzerkonten oder Daten endgültig löschen
- Datenbank-/RLS-Migrationen autonom anwenden

Für kritische Aktionen gelten Human-/Product-Owner-Gates, Vorschau/Diff wo sinnvoll, Bestätigung und vollständiger Audit-Trail.

## 5. Benutzer, Accounts und Support

- Nutzer suchen und sicher anzeigen
- Accountstatus und relevante, erlaubte Metadaten
- Reiseübersicht eines Nutzers für Supportzwecke
- Rollen/Status nur kontrolliert ändern
- keine unnötige Einsicht in Pass-/Credential-/sensible Daten
- Supportfälle / Notizen / Verlauf mit Berechtigungsgrenzen
- Export-/Löschanfragen kontrolliert begleiten
- Account-Security-Ereignisse und Sessions nur soweit erforderlich

## 6. Reisen / Operations

- Reisen suchen und inspizieren
- Read-only Supportansicht als Standard
- Änderungen nur in klar definierten Supportfällen
- Route/Traveller/Readiness/Safety/Seasonal-Truth nicht durch Admin-Shortcuts umgehen
- Fehlerhafte oder unvollständige Reisegraphen sichtbar machen
- Datenqualität und Stale-Zustände anzeigen

## 7. Security Center

- Auth-/MFA-/Session-Status
- Admin-Rollen und Berechtigungen
- RLS-/Policy-/Security-Gates
- verdächtige Aktivitäten
- Audit Logs
- kritische Admin-Aktionen
- Security Alerts
- Secret-/Environment-Health ohne Secret-Werte offenzulegen
- Notfall-/Kill-Switch-Prozesse
- Login-/Admin-Session-Härtung
- später Passkey-/Step-up-Readiness

## 8. Provider & API Control Center

Für jeden externen Provider sollen, soweit technisch und vertraglich verfügbar, sichtbar sein:

- Status / Health
- aktiv / vorbereitet / deaktiviert
- Environment
- letzte erfolgreiche Anfrage
- Fehlerquote / Latenz
- Usage / Quota / Rate Limits
- Kosten / Budget
- Vertrags-/Freigabestatus
- Fallback-/Primary-/Specialist-Rolle
- Kill Switch
- Secrets nur als Status vorhanden/nicht vorhanden, nie als Klartext

Keine Live-Provider-Aktivierung ohne vereinbarte Gates.

## 9. Domains, DNS und E-Mail / Infomaniak

Da Jetnity Domains und E-Mail bei Infomaniak nutzt, soll eine kontrollierte Infomaniak-Integration geprüft und, wenn technisch/vertraglich sinnvoll, später in den Admin integriert werden.

Ziel ist **nicht**, den kompletten Infomaniak Manager nachzubauen. Jetnity soll die für Betrieb und Sicherheit relevanten Informationen und ausgewählte kontrollierte Aktionen an einem Ort bündeln.

Mögliche Funktionen nach API-/Scope-Prüfung:

### Domains

- jetnity.ch / jetnity.com und weitere relevante Domains anzeigen
- Ablaufdatum / Renewal-Status
- DNSSEC-Status
- Nameserver-/DNS-Zustand
- relevante DNS-/Mail-DNS-Checks (MX, SPF, DKIM, DMARC soweit verfügbar/prüfbar)
- Domain-/SSL-/DNS-Warnungen
- Redirect-/Environment-Zuordnung dokumentieren

### E-Mail

- Mail-Hostings / Mailboxen anzeigen
- Mailbox-Status und technische Health-Informationen
- Alias-/Weiterleitungs-/Quota-/Security-relevante Informationen soweit API-seitig unterstützt
- wichtige Funktionsadressen wie info@ / support@ / no-reply@ kontrolliert überwachen
- keine E-Mail-Inhalte standardmäßig in den Admin ziehen

### Auth / Security

- Integration bevorzugt über Infomaniak OAuth2 / offizielle API
- Least-Privilege-Scopes
- Tokens/Secrets serverseitig und geschützt speichern
- read-only zuerst; Schreiboperationen nur einzeln freigeben
- kritische Domain-/DNS-/Mailbox-Aktionen mit Step-up, Bestätigung und Audit-Log

Infomaniak ist eine Betriebsintegration, keine harte Abhängigkeit der Travel-Produkt-Truth.

## 10. Finance / Accounting

- Umsatz, Affiliate-Provisionen, Abos, Gebühren, Refunds, offene Forderungen
- Schweizer VAT-Kontext
- Bexio-Integration vorbereiten
- klare Trennung zwischen Jetnity-operativer Finance-Sicht und buchhalterischer Source of Truth
- Rechnungs-/Belegstatus
- Payment-Provider-Status
- keine autonomen Refunds oder Transfers ohne Gate

## 11. Marketing / Ads / SEO

- Google Ads später kontrolliert anbinden
- Kampagnenstatus / Spend / Budget / Conversion / Attribution
- klare Budgetlimits
- keine autonomen Spend-Erhöhungen ohne Freigabe
- SEO-/Sitemap-/Indexierungs-/Domain-Health
- wichtige Landingpages und technische SEO-Warnungen

## 12. Analytics / Business Intelligence

- Nutzerwachstum
- aktive Nutzer
- Trips erstellt / geplant / aktiv / abgeschlossen
- Conversion Funnels
- Affiliate-Umsätze
- Subscription-KPIs
- Retention / Wiederkehr
- wichtigste Destinations-/Feature-Nutzung
- Providerqualität / Kosten pro erfolgreicher Aktion
- Creator/Content-KPIs soweit relevant

Keine Demo-KPIs als echte Business-Wahrheit. Quelle und Freshness sind Pflicht.

## 13. Content / Creator / Moderation

- Content-/Creator-Review
- Moderation
- Freigaben
- Qualitätsstatus
- Änderungsverlauf
- Auditierbare Aktionen

## 14. System & Configuration

- Feature Flags
- Kill Switches
- globale Settings
- Cron-/Job-Status
- Environment-Zustand
- Deployment-/Version-Information
- Datenbank-/Migration-Status nur kontrolliert
- API-/Webhook-/Integration-Health
- keine beiläufigen Production-Änderungen

## 15. Rollenmodell

Nicht jeder Admin darf alles.

Mindestens fachlich prüfen:

- Support
- Content/Moderation
- Operations
- Finance
- Security
- Marketing
- Superadmin / Owner

Serverseitige Permission-Prüfung ist Pflicht. UI-Hiding allein ist kein Schutz. Hochkritische Aktionen benötigen Step-up / Bestätigung / Audit-Trail.

## 16. Proaktive Agentenpflicht

Der Cursor-Agent für den Admin-Workstream soll nicht nur diese Liste abarbeiten.

Er muss als Senior Admin-Platform/Security/Operations/Finance/Analytics Engineer selbstständig prüfen, welche weiteren Funktionen für Jetnity relevant sind. Wenn er eine wichtige Funktion, Sicherheitslücke, bessere Architektur, Automatisierung oder betriebliche Verbesserung erkennt, soll er:

1. sie konkret dokumentieren;
2. Nutzen und Risiko erklären;
3. Abhängigkeiten und Kosten nennen;
4. eine Empfehlung abgeben;
5. kritische Shared-Contract-Änderungen nicht eigenmächtig implementieren.

Das Ziel ist die Qualität der gesamten Jetnity-Plattform, nicht das mechanische Erfüllen einer Aufgabenliste.

## 17. Integrationsgrenzen

Admin darf keine zweite Source of Truth für Account, Traveller, Route, Readiness, Safety, Seasonal, Provider-Truth, Billing oder Content erzeugen.

Admin liest, aggregiert, kontrolliert und führt klar autorisierte Aktionen gegen die jeweils kanonischen Contracts aus.

Account-/Admin-Shared-Contracts (`profiles`, Rollen, Privacy/Delete, Billing/Entitlements, Support/Audit) werden nach den Audits zentral durch Technical Lead geschnitten.

## 18. Audit-vor-Implementierung

Der kommende Admin-Agent beginnt mit einem vollständigen Audit des bestehenden Admin-Bereichs.

Er entscheidet nicht vorab, dass alles neu gebaut werden muss. Bestehende professionelle Komponenten werden behalten und integriert; schwache Teile werden refaktoriert oder ersetzt; fehlende Funktionen werden geplant.

Bis zur ausdrücklichen Implementierungsfreigabe gelten die bestehenden Multi-Agent-, Security-, Kosten-, Provider- und Merge-Gates.
