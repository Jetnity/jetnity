# Jetnity – Account/Admin Shared Contract Decisions

Stand: 24. August 2026  
Status: **verbindlicher Technical-Lead-Schnitt nach gemeinsamem Audit-Review; erste konfliktarme UI-/IA-Slices nach PR-#38-R17 technisch entblockt, Shared Runtime-/DB-Verträge weiter seriell**

Geprüfte Workstreams:

- `Account plattform audit vorbereitung` – `audit/account-platform`, Draft-PR #39
- `Admin platform audit` – `audit/admin-platform`, Draft-PR #40

Grundsatz:

> **Account und Admin haben getrennte UX, aber gemeinsame kanonische Verträge. Keine doppelte Identity-, Privacy-, Billing-, Auth- oder Trip-Truth.**

## S0-1 Identity / Profile

- Supabase `auth.users` bleibt Auth-Identität.
- Es gibt langfristig genau einen kanonischen Application-Account-Datensatz pro Nutzer; kein separates Admin- und Account-Profil.
- Rollen, Status und privilegierte Felder sind system-/admin-kontrolliert und dürfen nicht über normale Account-Profileditierung eskalieren.
- Reisepräferenzen gehören nicht in Rollen-/Creator-Altspalten; bei späterer Persistenz eigener klarer Account-Contract.
- Bestehende Rolle `creator` wird aus Kompatibilitätsgründen vorerst **nicht entfernt und nicht umgedeutet**. Eine spätere Produktentscheidung darf sie separat ablösen.

## S0-2 Auth / MFA / AAL

- Account und Admin verwenden denselben Supabase-Auth-/AAL-Vertrag; kein zweiter MFA-Stack.
- MFA Enroll/Unenroll braucht Step-up.
- Kritische Admin-Writes benötigen AAL2/Step-up, mindestens: Rollen/Capabilities, Security-Härtung, echte Refund-/Finance-Writes, Domain/DNS/Mail-Writes, Provider-/Kill-Switch-Aktivierung, Production-/Konfigurations-Writes und destructive Privacy-Aktionen.
- UI-Hiding ist niemals Autorisierung.

## S0-3 Privacy / Export / Delete

- Account besitzt den nutzerseitigen Consent-/Export-/Löschpfad.
- Admin darf Fälle begleiten, Status/Audit sehen und ausdrücklich definierte Supportaktionen ausführen.
- Kein stilles Service-Role-Delete, keine parallele Admin-Privacy-Truth, keine unnötige PII-Kopie.
- Jede privilegierte Privacy-Aktion braucht Actor, Grund, Step-up soweit kritisch und Audit-Trail.

## S0-4 Support-Sicht auf Reisen

- Eine minimierte read-only Support-Sicht ist fachlich erlaubt und sinnvoll.
- **Keine** breite RLS-Policy „Admins dürfen alle Trips lesen“.
- Ziel: schmale SECURITY-DEFINER-/RPC-Schnittstelle mit serverseitiger Capability-Prüfung, Allowlist-Feldern und Audit.
- Keine Credential-/Dokument-Klartexte, keine Route-/Traveller-/Readiness-/Safety-/Seasonal-Overrides.

## S0-5 Billing / Payments / Refund / Bexio

- Die heutige lokale Admin-`payments`-Tabelle ist **nicht** die zukünftige kanonische Billing-Truth und darf nicht als echte Geldbewegung dargestellt werden.
- Später entsteht genau ein Billing-/Entitlement-Contract, den Account und Admin unterschiedlich darstellen, aber gemeinsam lesen.
- Payment-Provider liefern externe Transaktionswahrheit; Jetnity hält die kanonische interne Zuordnung/Entitlements/Audit.
- Bexio ist nachgelagerte Buchhaltung/Accounting-Integration, **nicht** primäre Subscription-/Payment-Truth.
- Echte Refunds erst provider-backed, mit Berechtigung, AAL2, Confirmation und Audit.

## S0-6 Admin Audit Trail

- Ein append-only Admin-Audit-Trail ist **verbindlich erforderlich**, bevor kritische Admin-Writes als fertig gelten.
- Mindestfelder: Actor, Capability/Rolle, Aktion, Ziel, Grund, vorher/nachher bzw. Diff soweit sinnvoll, AAL, Request-/Correlation-ID, Zeitpunkt, Resultat.
- Keine Geheimnisse oder Credential-Inhalte ins Audit schreiben.

## S0-7 Rollen / Capabilities

- Bestehendes serverseitiges Capability-Modell bleibt Grundlage.
- Neue Capabilities werden nur bei realem Bedarf seriell und gespiegelt in Code/DB/Tests eingeführt.
- Account und Admin dürfen Rollen-/Capability-Verträge nicht parallel ändern.
- `creator` bleibt vorerst kompatibel bestehen; keine neue Bedeutung im Account ableiten.

## S0-8 IP-Blocklist

- Die heutige Liste bleibt bis zu einer separaten Security-Entscheidung **nicht durchgesetzt** und muss in der UI ehrlich so gekennzeichnet sein.
- Kein stilles Enforcement, bevor Proxy-/Forwarded-IP-Trust, IPv6, Lockout-/Recovery- und False-Positive-Szenarien getestet sind.

## S0-9 Notifications vs. Ops Alerts

- Nutzer-Benachrichtigungen/Preferences gehören zum Account-/Delivery-Contract.
- Admin-Ops-Alerts gehören zum Control Center.
- Keine gemeinsame Tabelle/UX nur wegen ähnlicher Bezeichnung; keine erfundenen Notifications.

## S0-10 Traveller / Credentials

- Dauerhafte Account-Traveller-Registry ist Account-/Foundation-E-nah.
- Trip-spezifische Traveller-/Readiness-/Entry-Truth bleibt bei den Travel-Contracts.
- Admin darf diese Truth nur minimiert lesen, nicht überschreiben.
- Snapshot-vs-Live, Guest→Account-Opt-in und ADR-0102-Nachfolger müssen vor AP-7 in einem eigenen ADR entschieden werden.
- Keine erfundene Citizenship oder Credential-Auswahl.

## S0-11 System Health / Infrastruktur

- Vercel-/Supabase-/GitHub-/App-/später Infomaniak-Health gehört exklusiv zum Admin Control Center, nicht zum Account.
- Read-only zuerst; source-backed Evidence mit `lastCheckedAt`, Freshness und `unknown/stale/unavailable` statt erfundenem Grün.
- Keine Management-Secrets im Browser; keine Deploy-/Migration-/DNS-Writes in der ersten Stufe.

## S0-12 Copilot Pro

- Copilot Pro ist Analyst/Operator-Assistent über belegte Evidence, kein autonomer Superadmin.
- Er darf analysieren, erklären, priorisieren, Reports und Change-Vorschläge erzeugen.
- Kritische Aktionen laufen ausschließlich über dieselben serverseitigen Capability-, AAL2-, Confirmation- und Audit-Gates wie manuelle Aktionen.

## S0-13 Integrations- und Parallelitätsregel

PR #38 hat am 24. August 2026 im unabhängigen ChatGPT-R17 **Technical Closure / PASS** erreicht. Damit ist die frühere technische Sperre für die ersten konfliktarmen Account-/Admin-UI-/IA-Slices aufgehoben.

Ab jetzt dürfen parallel starten:

- Account: zuerst AP-1 Account-Shell + persönliche Übersicht / Meine Reisen als Account-Hub;
- Admin: zuerst Slice A – ehrliche Control-Center-/Steuerzentralen-IA; danach separat read-only System Health.

Weiterhin **nicht parallel** neu definieren oder verändern:

- Auth / Identity / MFA / AAL
- Rollen / Capabilities
- RLS / Ownership / Service Role
- Trip Graph / Guest→Account
- Traveller / Credentials / Readiness
- Route / Safety / Seasonal Truth
- Privacy Export / Delete
- Billing / Payments / Refund / Bexio
- Support-Zugriffscontract
- Admin Audit Trail

Diese Shared Contracts bleiben seriell unter Technical-Lead-Ownership.

### PR-#38-Abhängigkeit – geschlossen

R16 hatte Blocker 31 gefunden: untrusted Browser-/LocalStorage-/Guest-`routeItinerary` konnte `surfaceFromAirportCode` syntaktisch selbst behaupten und dadurch die Route-Truth beeinflussen.

Der Fix auf Runtime `5782401943b41ddd1eea1337c93cb37163210362` strippt Client-Surface an den aktuellen untrusted Grenzen. R17 hat Browser/LocalStorage/Guest→Server/DB, DB-Read, Safety/Seasonal und eine read-only Development-DB-Reproduktion unabhängig geprüft und keinen neuen konkreten Defekt gefunden. Review: `docs/PR38_CHATGPT_R17_REVIEW.md` auf PR #38.

Der zukünftige Invariant bleibt: Kein neuer Mapper darf rohe Client-JSON direkt als trusted `TripItem.routeItinerary` deklarieren. Echte spätere Provider-/Server-Surface-Evidence braucht einen expliziten serverkontrollierten Provenance-/Write-Contract.

## Review-Urteil zu den Audits

- `Account plattform audit vorbereitung`: **AUDIT-PASS** als Planungsgrundlage; das Audit allein autorisiert keine Shared-Contract-Änderung.
- `Admin platform audit`: **AUDIT-PASS** als Planungsgrundlage. Bestehendes Admin-Gerüst soll weiterverwendet werden; kein zweites Control Center bauen.
- Beide Audits sind architektonisch vereinbar, wenn dieser Shared-Contract-Schnitt gilt.

## Nächster Schritt

1. Account AP-1 und Admin Slice A dürfen als getrennte konfliktarme UI-/IA-Slices vorbereitet bzw. umgesetzt werden.
2. Nach jedem Slice unabhängiger Technical-Lead-Review vor dem nächsten Slice.
3. Shared-Contract-Arbeiten nur seriell und nach erneutem Lesen dieses Dokuments.
4. PR #38 bleibt Draft; Mark Ready/Merge nur nach ausdrücklicher aktueller Product-Owner-Freigabe.
5. Production-Migrationen und Provider-/Secret-/Kosten-Aktivierungen bleiben jeweils separate Product-Owner-Gates.

Die gespeicherte Homepage-Produktseiten-Richtung bleibt bis zu einem ausdrücklichen Startsignal separat pausiert.
