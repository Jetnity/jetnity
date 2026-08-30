# Jetnity – Entry Requirements Target Architecture

Stand: 31. August 2026  
Status: **BINDING TARGET ARCHITECTURE / PRODUCT-OWNER CONFIRMED / DO NOT AUTO-START RUNTIME**

## 1. Verbindliche Produktentscheidung

Jetnity darf Einreisebereitschaft nicht auf ein pauschales „Visum erforderlich / nicht erforderlich“ reduzieren.

Die Zielarchitektur muss für die konkrete Reise die praktisch relevanten offiziellen Einreiseanforderungen **strukturiert, einzeln, verständlich und pro Reisendem / Credential-Option / Route / Datum** abbilden.

Kanonisches Traveller-Invariant bleibt unverändert:

> **1 Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente/Credentials → kontextabhängig bewertete zulässige Optionen.**

Keine Default-/Primary-/Preferred-/Chosen-Citizenship und kein Default-/Primary-/Preferred-/Chosen-Pass. Issuer Country ≠ Citizenship. `documents[0]` und `evaluations[0]` sind niemals Product Truth.

## 2. Verbindlicher Requirement-Umfang

Mindestens folgende fachlichen Anforderungen gehören in die Zielarchitektur:

### Visa / elektronische Genehmigungen
- visumfreie Einreise;
- klassisches Visum vor Reise;
- Visa on Arrival;
- E-Visum / eVisa;
- eTA / elektronische Reisegenehmigung;
- Transitvisum / Transitgenehmigung;
- erlaubte Aufenthaltsdauer;
- relevante Einreise-/Nutzungsbedingungen;
- offizielle Antrags-/Informationsquelle, sofern belastbar verfügbar.

### Reisedokument
- zulässiger Dokumenttyp (z. B. Reisepass / nationale ID, soweit offiziell zulässig);
- Mindest-Passgültigkeit für die konkrete Reise;
- **freie Passseiten / blank passport pages als eigener strukturierter Requirement-Typ**;
- dokumentbezogene Bedingungen, soweit offiziell belegbar.

### Vor Abreise zu erledigen
- Einreiseformular / digitale Arrival Card;
- Gesundheitsformular / Health Declaration;
- Impfanforderungen;
- erforderliche Gesundheitsdokumente / Zertifikate;
- Versicherungspflicht.

### Bei Einreise / Reise nachweisbar
- Rück- oder Weiterflugnachweis;
- Buchungs-/Unterkunfts-/Reisedokument-Nachweise, soweit offiziell verlangt;
- **finanzielle Mittel / Proof of Funds als eigener strukturierter Requirement-Typ**;
- weitere offiziell belegte Einreisebedingungen.

## 3. Strukturierte Requirement-Typen

Der aktuelle Vertrag enthält bereits u. a.:

- `visa`
- `electronic_travel_authorization`
- `passport`
- `identity_document`
- `passport_validity`
- `transit`
- `health`
- `vaccination`
- `health_document`
- `entry_form`
- `insurance`
- `onward_or_return_ticket`
- `booking_or_travel_document`
- `other_entry_requirement`

Die Zielarchitektur erweitert diesen Vertrag verbindlich mindestens um eigene, nicht unter `other_entry_requirement` versteckte Typen für:

- `blank_passport_pages`
- `financial_means`

Vor Implementierung ist zusätzlich zu prüfen, ob Visa-Ausprägungen wie `visa_on_arrival` und `electronic_visa` besser als eigene Requirement-Typen oder als **strukturierte Visa-Subtypen** modelliert werden. Entscheidungskriterium ist nicht UI-Bequemlichkeit, sondern Verlustfreiheit, Provider-Mapping, Vergleichbarkeit und spätere Regel-/Action-Semantik.

## 4. Darstellungsprinzip für Besucher

Die UI soll Anforderungen nicht als rohe Provider-Liste oder nur als Anzahl darstellen. Zielbild ist eine priorisierte, verständliche Reise-Checkliste:

### Vor Abreise erledigen
Beispiele: eVisa/eTA, Einreiseformular, notwendige Impfung/Zertifikat, Pflichtversicherung.

### Dokument prüfen
Beispiele: erlaubter Pass/ID, Mindestgültigkeit, freie Passseiten.

### Bei Einreise nachweisen können
Beispiele: Rück-/Weiterflug, Unterkunft/Reisebuchung, finanzielle Mittel.

### Route / Transit
Beispiele: Transitvisum, Transitgenehmigung, airside/landside-relevante Bedingungen, soweit die Quelle dies belastbar differenziert.

Jeder Eintrag soll – soweit die Quelle dies belastbar liefert – strukturiert tragen können:

- `required | not_required | conditional | unknown`;
- betroffener Reisender;
- betroffene Credential-Option / Reisedokument;
- Destination oder Transitland;
- Bedingung / Schwellenwert (z. B. 6 Monate Passgültigkeit, 2 freie Seiten);
- Gültigkeits-/Zeitraumkontext;
- offizielle Authority / Source URL;
- Jetnity-`checkedAt` / Freshness;
- relevante Action (z. B. offiziellen Antrag öffnen);
- fehlende Fakten;
- fail-closed Availability-/Unknown-Zustand.

## 5. Multi-Citizenship / Multi-Document

Alle Anforderungen müssen pro zulässiger Credential-Option bewertet werden können.

Beispiel:

- Schweizer Pass → E-Visum erforderlich;
- zweiter zulässiger Pass → visumfrei.

Jetnity darf eine bessere Option nur dann hervorheben, wenn die Option für **dieselbe konkrete Reise** auf vollständiger, aktueller und belastbarer Official Evidence beruht.

„Besser“ darf später mehrere Dimensionen unterscheiden, z. B.:

- weniger zwingende Vorab-Schritte;
- kein Visum / einfachere Genehmigung;
- geringere offiziell belegte Gebühren;
- längerer zulässiger Aufenthalt;
- weniger dokumentierte Restriktionen.

Keine stille Auswahl des Passes. Der Nutzer muss nachvollziehen können, welche Credential-Option bewertet wurde.

## 6. Route und Transit

Der vollständige Transitkontext ist Product Truth. Kein Adapter darf Transitländer still verwerfen oder auf ein Providerlimit kürzen.

Falls ein Provider weniger Transit-Nodes unterstützt als Jetnity:

- nur beweisbar vollständige Split-/Aggregation-Semantik ist zulässig;
- andernfalls fail-closed `unknown` / `unsupported`;
- niemals scheinbar vollständige Official Truth aus unvollständigem Transitkontext.

## 7. Truth-, Freshness- und Quellenregeln

- Nur eine Requirements Engine / belastbarer Provider darf Official Hard Truth setzen.
- Modell-/LLM-Text ist keine offizielle Quelle.
- Fehlende oder unklare Daten bleiben `unknown` / `insufficient_context`.
- `checkedAt` bedeutet Jetnity Retrieval/Evaluation Time und ist nicht Vendor-`lastUpdatedAt`.
- Official Evidence muss bounded Freshness besitzen.
- Stale Evidence darf nicht dauerhaft als `current` erscheinen.
- Source-/Provider-Ausfall darf nie in „nicht erforderlich“ umgedeutet werden.
- Offizielle Links müssen valide und sicher sein; keine undokumentierten Scraping-Wege als Hard Truth.

## 8. Datenschutz / Minimal-PII

Diese Zielarchitektur rechtfertigt **keine** unnötige Speicherung sensibler Dokumentdaten.

Grundsatz:

- nur die für die Bewertung notwendigen strukturierten Fakten;
- keine Passnummer, MRZ, Scan, Biometrie oder Gesundheitsakte ohne eigenes Product-Owner-/Privacy-/Security-Gate;
- Gesundheitsanforderung ≠ Speicherung persönlicher Gesundheitsdaten;
- Account Registry bleibt wiederverwendbare Traveller-Faktenquelle;
- Trip Snapshot bleibt einzige Current Truth der konkreten Reise.

## 9. Proaktive Travel-Companion- und Deadline-Architektur

Jetnity soll den Reisenden **vor und während der Reise aktiv begleiten**, nicht nur statische Informationen anzeigen.

Verbindliches Produktprinzip:

> **Official Requirement → belastbare Zeitregel → konkrete Reisezeit → Action-Fenster / Deadline → Aufgabe → Status → relevante Erinnerung.**

Beispiel: Wenn eine belastbare offizielle Regel festlegt, dass eine Arrival Card frühestens 72 Stunden vor Ankunft ausgefüllt werden darf, muss Jetnity für die konkrete Reise daraus den richtigen Aktivierungszeitpunkt ableiten und den Reisenden rechtzeitig darauf hinweisen.

### 9.1 Zeitregeln müssen strukturiert modellierbar sein

Ein Requirement soll – sofern die Official Evidence es belastbar trägt – mindestens folgende zeitliche Semantik ausdrücken können:

- frühester erlaubter Erledigungszeitpunkt (`available_from` / relative Regel);
- spätester sinnvoller oder verpflichtender Erledigungszeitpunkt (`due_at` / relative Regel);
- Referenzereignis: Abflug, Ankunft, Transit, Grenzübertritt oder anderes eindeutig belegtes Reiseereignis;
- relevante Zeitzone;
- Gültigkeitsfenster;
- Wiederholungs-/Recheck-Bedarf;
- Änderungsauswirkung, wenn sich Reisezeiten oder Route ändern.

Keine frei erfundene Deadline aus UI-Text. Eine harte Frist darf nur aus belastbarer Evidence entstehen.

### 9.2 Aufgabenstatus und Dringlichkeit

Zeitgebundene Reisevorbereitung muss mindestens folgende fachliche Zustände unterstützen können:

- noch nicht verfügbar / zu früh;
- demnächst;
- jetzt erledigen;
- erledigt;
- überfällig / kritisch, sofern eine belastbare Deadline existiert;
- erneut prüfen, wenn Evidence stale oder Reiseparameter geändert wurden;
- nicht mehr relevant.

Die Besucherkommunikation soll drei verständliche Prioritäten verwenden:

1. **Jetzt erledigen** – zeitkritisch oder zwingend;
2. **Demnächst** – bereits bekannt, aber noch nicht oder noch nicht sinnvoll ausführbar;
3. **Zur Information** – relevant, aktuell ohne erforderliche Aktion.

Jetnity soll Stress reduzieren und keine unnötige Notification-Flut erzeugen.

### 9.3 Neuberechnung bei Reiseänderungen

Zeitregeln hängen an der **konkreten Current Trip Truth**, nicht an einer einmal berechneten statischen Erinnerung.

Ändern sich insbesondere:

- Abflug-/Ankunftszeit;
- Datum;
- Route oder Transit;
- Destination;
- Reisender oder Credential-Option;
- belastbare Official Requirement Evidence;

dann muss Jetnity betroffene Action-Fenster, Deadlines, Aufgaben und Warnungen neu bewerten. Eine alte Erinnerung darf nicht unverändert weitergelten, wenn ihre Grundlage geändert wurde.

### 9.4 Proaktive Begleitung vor und während der Reise

Die Companion-Architektur soll später mindestens folgende Kategorien unterstützen können, soweit belastbare Daten vorhanden und die jeweilige Funktion freigegeben ist:

- Visa/eVisa/eTA und Antragsfristen;
- Arrival Cards / Einreiseformulare;
- Transitgenehmigungen;
- Pass-/Dokument-Rechecks;
- Impf-/Gesundheits- und Versicherungsanforderungen ohne unnötige Speicherung persönlicher Gesundheitsdaten;
- Check-in-Fenster;
- relevante Flug-/Terminal-/Gate-/Anschlussänderungen;
- Transfers und zeitkritische Buchungsschritte;
- weitere konkrete reisebezogene Pflichten oder nächste Schritte.

Nicht jede dieser Kategorien kommt aus demselben Provider oder Slice. Die Companion-Schicht darf unterschiedliche belastbare Truth-Quellen orchestrieren, aber niemals fehlende Truth erfinden.

### 9.5 Notification-Kanäle

Die Zielarchitektur soll kanalneutral sein und später – abhängig von Nutzerfreigabe, Plattform und Privacy-Konzept – In-App-Hinweise, Push und gegebenenfalls E-Mail unterstützen können.

Benachrichtigungen müssen:

- aus einem nachvollziehbaren Reise-/Requirement-Ereignis entstehen;
- dedupliziert und priorisiert werden;
- erledigte oder nicht mehr relevante Aufgaben respektieren;
- Nutzerpräferenzen und Opt-ins respektieren;
- bei stale/unknown Evidence keine falsche Sicherheit behaupten.

### 9.6 Direkte Action

Wo eine offizielle Aktion belastbar bekannt ist, soll eine Erinnerung nicht nur warnen, sondern direkt zur passenden sicheren Handlung führen können, zum Beispiel:

- „Offizielles E-Visum beantragen“;
- „Arrival Card ausfüllen“;
- „Offizielle eTA beantragen“;
- „Offizielle Transitgenehmigung öffnen“.

Eine **Antragsseite** muss von einer reinen **Informationsseite** unterscheidbar sein. Unverifizierte Vermittler dürfen nicht als offizielle Antragstelle dargestellt werden.

## 10. Scope-Grenze zum laufenden S4-R1

Diese Produktentscheidung **erweitert S4-R1 nicht**.

S4-R1 bleibt ausschließlich provider-neutrales Runtime-Hardening:

- AbortSignal / Timeout;
- Readiness-Kill-Switch;
- technische Failure-Semantik;
- bounded Freshness/TTL;
- Factory bleibt `null`;
- kein realer Provider, keine Secrets, keine paid calls.

Die Erweiterung des Requirement-Vertrags, die detaillierte Besucher-Darstellung und die Travel-Companion-/Deadline-Runtime benötigen nach S4-R1 einen **frischen Binding Slice Precheck** und eigene bounded Slices. Kein automatischer Start.

## 11. Spätere Acceptance-Basis

Ein späterer Entry-Requirements-/Travel-Companion-Slice ist erst fachlich vollständig, wenn mindestens:

1. die oben definierten Requirement-Kategorien strukturiert und lossless modellierbar sind;
2. `blank_passport_pages` und `financial_means` nicht in einem unspezifischen Sonstiges-Feld verschwinden;
3. Visa on Arrival, eVisa/eTA und klassische/visumfreie Einreise verständlich differenzierbar sind;
4. dieselben Regeln für mehrere Reisende und mehrere Credential-Optionen gelten;
5. Transit vollständig berücksichtigt wird;
6. Unknown/Unavailable/Stale deutlich von Not Required getrennt bleiben;
7. UI die konkrete Aktion / den konkreten Nachweis verständlich zeigt;
8. Quellen/Freshness sichtbar und technisch prüfbar bleiben;
9. kein LLM und kein Browser offizielle Einreisewahrheit erfindet;
10. zeitliche Regeln ein belastbares Referenzereignis, Zeitfenster/Deadline und Zeitzone besitzen, bevor harte Warnungen entstehen;
11. Reiseänderungen betroffene Deadlines/Aufgaben neu berechnen;
12. Aufgaben priorisiert, dedupliziert und statusbewusst kommuniziert werden;
13. offizielle Antrags-/Action-Links sicher von Informations- oder Drittanbieterlinks getrennt sind;
14. kein echter Provider oder paid call ohne separates Product-Owner-Gate aktiviert wird.

## 12. Verbindlichkeit

Diese Zielarchitektur ist durch den Product Owner am 31. August 2026 ausdrücklich bestätigt und um die proaktive Travel-Companion-/Deadline-Architektur verbindlich erweitert. Sie ist für zukünftige Technical-Lead-Chats und Cursor-Agenten bindend.

Sie ist **kein automatischer Build-Auftrag**, aber jeder zukünftige Requirements-/Readiness-/Provider-/Traveller-/Trip-Workspace-/Notification-Slice muss sie als Zielzustand und Scope-Grenze berücksichtigen.

**Live-Evidence gewinnt für Ist-Zustand; diese Datei definiert den bestätigten Zielzustand.**
