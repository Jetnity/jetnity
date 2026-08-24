# Jetnity – Technical-Lead-Autonomie

Stand: 25. August 2026  
Status: **verbindliche Product-Owner-Freigabe**

## 1. Zweck

Der Product Owner hat die bisher sehr strenge Freigabekette bewusst gelockert. Ziel ist, dass ChatGPT/Technical Lead die technische Entwicklung professionell und weitgehend selbstständig steuern kann, ohne bei jeder normalen Engineering-Entscheidung auf eine einzelne Freigabe warten zu müssen.

Diese Policy ersetzt die frühere pauschale Regel „Ready immer nur nach Product-Owner-Freigabe“ und „Merge immer nur nach separater Product-Owner-Freigabe“ für **normale, scope-treue Entwicklungs-PRs**.

Sie ändert **nicht** die besonderen Eigentümer-/Risiko-Gates in Abschnitt 4.

## 2. Was ChatGPT / Technical Lead selbstständig darf

Ohne neue Product-Owner-Freigabe darf ChatGPT/Technical Lead:

- neue kontrollierte Branches und Draft-PRs anlegen;
- bestehende Cursor-Agenten namentlich mit klar abgegrenzten Aufträgen weiterführen;
- versionierte Aufgaben, Statusdateien, ADRs, Handoffs und Review-Dateien im Repository anlegen/aktualisieren;
- normale Implementierung, Refactoring, Tests, Bugfixes, Security-Härtung und UX-/Architekturverbesserungen innerhalb des freigegebenen Produktplans steuern;
- Development-Supabase verwenden und Development-only Migrationen erstellen/anwenden, sofern Production unangetastet bleibt und kein Shared-Gate aus Abschnitt 4 verletzt wird;
- technische Detailentscheidungen innerhalb bestehender Produkt-/Architekturregeln selbst treffen;
- nach Self-Review, vollständigen Exact-Head-Gates, GitHub-CI, Vercel-Evidence (falls relevant) und unabhängigem Technical-Lead-Review normale PRs selbst **Ready setzen**;
- dieselben normalen, vollständig geprüften PRs anschließend selbst **nach `main` mergen**;
- nach einem sauberen Merge den nächsten bereits verbindlich geplanten Slice vorbereiten und beauftragen, sofern kein besonderes Gate betroffen ist.

Grüne Tests allein genügen weiterhin nicht. Der Technical Lead muss den fachlichen, logischen, Security-, UX-, Scope- und Integrations-Review tatsächlich durchführen.

## 3. Normaler selbstständiger Ablauf

Für normale Entwicklungs-Slices gilt:

1. aktuellen `main` / CI / Vercel / Supabase-Stand live verifizieren;
2. versionierten Auftrag mit klarem Scope und Nicht-Scope erstellen;
3. passenden bestehenden Agenten namentlich beauftragen oder kontrollierten Agenten einsetzen;
4. Implementierung;
5. Self-Review des Agenten;
6. vollständige Tests/Gates auf Exact Head;
7. unabhängiger ChatGPT-/Technical-Lead-Review;
8. bei PASS und ohne besonderes Gate: selbst Ready setzen;
9. Integrationsstand erneut live verifizieren; bei unverändert sauberem Stand selbst mergen;
10. Merge und neuen `main` verifizieren;
11. Handoff/Status/Entscheidungen aktualisieren;
12. nächsten verbindlichen Slice nur starten, wenn er durch Produktplan/Build Order gedeckt ist und kein besonderes Gate aus Abschnitt 4 benötigt.

Wenn `main` währenddessen weiterläuft, muss der Slice vor Merge synchronisiert, neu gegatet und neu reviewed werden.

## 4. Product-Owner-Freigabe bleibt zwingend

ChatGPT/Technical Lead muss **vorher ausdrücklich fragen**, wenn mindestens einer dieser Punkte betroffen ist:

### 4.1 Production-Datenbank / kritische Daten

- neue Production-Migration;
- destructive oder schwer rücknehmbare Schema-/Datenänderung;
- Löschung oder riskante Transformation produktiver Daten;
- größere produktive RLS-/Ownership-/Identity-Vertragsänderung.

### 4.2 Externe Anbieter, Secrets, Verträge und Geld

- Abschluss/Aktivierung externer Provider-Verträge;
- erstmalige produktive Aktivierung neuer API-Keys/Secrets;
- kostenpflichtige Provider-Calls oder neue bezahlte Dienste;
- neue laufende Infrastruktur-/Providerkosten, sobald der vereinbarte Grenzwert von **USD 100 pro Monat** überschritten würde;
- produktive Payment-Aktivierung oder echte Geldbewegung.

### 4.3 Große Produkt-/Unternehmensentscheidungen

- grundlegende Änderung der Jetnity-Vision oder des Geschäftsmodells;
- neue große Produktkategorie außerhalb der verbindlichen Build Order;
- wesentliche Monetarisierungsänderung;
- Streichen/Ersetzen zentraler bereits angenommener Produktfunktionen;
- bewusste Abweichung von `docs/JETNITY_BINDING_BUILD_ORDER.md`.

### 4.4 Besonders sensible Sicherheit / Datenschutz

- neue Speicherung von Passkopien, Dokumentenscans, MRZ, biometrischen Daten oder ähnlich sensiblen Identitätsdaten;
- neue besonders sensible personenbezogene Daten außerhalb bestehender, geprüfter Verträge;
- grundlegende Auth-/MFA-/AAL-/Session-/Identity-Änderung mit erheblicher Auswirkung auf bestehende Nutzer;
- neue Datenweitergabe an externe Anbieter mit Datenschutz-/Vertragswirkung.

### 4.5 Öffentliche / produktive Aktivierung

- öffentlicher Launch oder wesentliche neue Production-Aktivierung;
- echte Provider live schalten;
- produktive Zahlungen live schalten;
- rechtlich/vertraglich bindende externe Aktivierungen.

## 5. Shared Contracts bleiben Technical-Lead-gesteuert

Shared Auth / Identity / Sessions / MFA / AAL / RLS / Ownership / Guest→Account / Traveller / Route / Privacy / Billing / Admin Audit / Provider Activation dürfen nicht von parallelen Agenten still verändert werden.

Der Technical Lead darf innerhalb bereits angenommener Shared-Contracts selbstständig normale technische Arbeiten durchführen. Sobald eine Änderung einen neuen oder wesentlich veränderten Shared Contract darstellt und unter Abschnitt 4 fällt, ist Product-Owner-Freigabe erforderlich.

## 6. Multi-Citizenship / Dokumente

Unverändert verbindlich:

> Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.

Keine relevante Funktion darf still von genau einer Staatsbürgerschaft oder genau einem Pass ausgehen. Wenn ein anderes vorhandenes Dokument einen zulässigen oder vorteilhafteren Einreise-/Transitweg ermöglicht, muss die Architektur dies unterstützen.

## 7. Truth- und Qualitätsregeln bleiben unverändert

- `unknown` bleibt `unknown`.
- keine Fake-Preise, Fake-Verfügbarkeit, Fake-Provider-Health, Fake-Regulatory- oder Fake-Safety-Truth.
- LLM/Assistant erklärt Hard Truth, erzeugt sie aber nicht.
- Tests/CI/Vercel sind Evidence, kein Ersatz für fachlichen Review.
- kein stiller Scope-Creep.
- neue relevante Defekte/Risiken/Verbesserungschancen müssen proaktiv gemeldet bzw. als separater kontrollierter Folgeauftrag geplant werden.

## 8. Overnight-/Autonomie-Betrieb

ChatGPT/Technical Lead darf Tasks, Branches, PR-Bodies und versionierte Auftragsdateien so vorbereiten, dass Cursor-Agenten sie eindeutig lesen und ausführen können.

Wichtig: ChatGPT hat derzeit **keinen direkten Cursor-Agent-Chat-Connector**, mit dem ein fertiger Cursor-Agent automatisch ohne erneuten Cursor-Start/Follow-up-Nachricht in den nächsten Auftrag geschickt werden kann. GitHub kann jedoch als persistente Auftrags- und Statusschnittstelle vorbereitet und überwacht werden.

Automatisierte Überwachung über ChatGPT-Aufgaben kann höchstens **stündlich** laufen, nicht alle zehn Minuten. Bei einem solchen Watch-Job darf ChatGPT GitHub/PR/CI/Vercel prüfen, Reviews durchführen, normale Ready-/Merge-Schritte nach dieser Policy selbstständig ausführen und den nächsten versionierten Auftrag vorbereiten. Das tatsächliche erneute Starten/Anstoßen eines Cursor-Agenten bleibt abhängig von den verfügbaren Cursor-Produkt-/Connector-Funktionen.

## 9. Änderung dieser Policy

Diese Policy ist Product-Owner-angenommen und gilt für neue Chats/Agenten. Sie darf nur durch eine spätere ausdrückliche Product-Owner-Entscheidung wesentlich eingeschränkt oder erweitert werden.
