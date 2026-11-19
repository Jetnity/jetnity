# Jetnity — Gesamtstand, Drei-Phasen-Abgleich und Restarbeiten

> Jeder Chat liest diese Datei zuerst. Wer eine Funktion fertigstellt, trägt sie im selben PR hier nach.

**Stichtag:** 18. November 2026 (Europe/Zurich)  
**Status:** DOCUMENTATION-ONLY / OWNER-UND-CODE-ABGLEICH / VORSCHLAG ZUR WEITEREN ABNAHME  
**Referenz-Main:** \`f0f376fa2a65ff2276b665d2b549ec75ae9c5ae5\`  
**Public-Release-Stand:** \`jetnity.com\` war auf Vercel Production \`dpl_4bei1CfkMWKRJpgvEvcq9R5K6Etf\` gebunden (Feature-Head \`e85ff69e5ebab77b019212843d92e5726eddd224\`, gleiches Dateibaum-Ergebnis wie der gemergte PR #1231). Das neuere Main-Deployment \`dpl_8fitMFHnsYX2RPYBGtPXJGkJFwaA\` war READY, aber nicht auf die öffentliche Domain umgeschaltet. Dies ist ein gezielt gepinnter Release, kein nachgewiesener Ausfall.  
**Main-CI:** [Run 44333651972](https://github.com/Jetnity/jetnity/actions/runs/44333651972) \`SUCCESS\` auf dem oben genannten Main-Commit.  
**Wichtig:** Dieser Bericht ist weder ein neuer V1 Release-Readiness-PASS noch eine Genehmigung, Code, Datenbanken, Produktion oder Anbieter zu ändern.

## 1. Verbindliche Dokumentenhierarchie und unveränderte Vision

Die bestehenden verbindlichen Quellen bleiben unverändert und gehen diesem datierten Abgleich für **Zielbild, rechtliche/technische Gates und Produktphasen** vor:

1. [Produktmandat](../JETNITY_PRODUCT_MANDATE.md) und [Vision](../JETNITY_VISION.md): Ein zusammenhängendes intelligentes Reisesystem, „eine Reise, eine Wahrheit“, hochwertige mobile UX, belastbare Datenwahrheit, Marktführerschaft als Ziel statt unbelegter Behauptung.
2. [ADR-0204](ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md) und [Drei-Phasen-Strategie](JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md): unveränderte Produktphasen und ihr Umfang.
3. [V1 Definition of Done](JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md) und [Release Readiness Gate](JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md): vollständige Kernreise, echte Truth und Release-Gates.
4. [V1-kritische Build Order](JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md): bindende Abhängigkeiten; neue Priorisierung nur nach PO-Entscheid.
5. [Strategisches Differenzierungsregister](JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md) und [Guardian-/What-if-Standard](JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md): alle strategisch genehmigten Funktionen bleiben vollständig erhalten.
6. [Technischer Betrieb- und Reviewstandard](JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md): Exact-Head-Review, CI, Security, PO-Gates, keine unkontrollierten Folgeslices.

Historische technische „Phase 2.x“/„Phase 3.x“ sind **nicht** die drei aktuellen Produkt-/Releasephasen. Ältere Roadmap- und Statusblöcke werden nicht rückwirkend überschrieben. Bei Realzustand gewinnt neuere geprüfte Live-Evidence.

## 2. Drei Produktphasen — unverändert

| Phase | Ziel | Verbindliche Einordnung |
| --- | --- | --- |
| **Phase 1 – Jetnity Core** | Eine reale Reise mit Etappen, Reisenden, Angeboten, Einreisebereitschaft und intelligenter Begleitung zuverlässig planen und führen | Endet erst bei **„PRODUCTION READY FOR REAL TRAVELLERS“**, nach V1-DoD, eigener Release-Readiness-Prüfung und Owner-Freigabe |
| **Phase 2 – Jetnity Complete Travel Platform** | Mehr Anbieter/Kategorien, tiefere Reiseentscheidungen, automatisierte Begleitung, Admin-/Marketing-/Finance- und Growth-Ausbau | Nach realen Abhängigkeiten und eigenen Freigaben; bereits vorhandene Grundlagen weiterverwenden |
| **Phase 3 – Jetnity Travel Ecosystem** | Native Apps, sicheres Traveller-/Gruppennetzwerk, Creator und Partner, Intelligence-Assets, internationale Skalierung | Langfristig; keine heimliche Streichung oder Umdeutung von Zielbild/Architektur |

**Bevorzugte Launchfolge:** Private Alpha → kontrollierte Closed Beta → Swiss Public Launch → Stabilisierung/Product Learning → DACH → weitere Märkte.  
**Termin 30.11.2026:** weiterhin ambitioniertes Owner-Ziel, **keine** Aufhebung des V1-Release-Gates oder automatische Zusage eines uneingeschränkten öffentlichen Launches.

## 3. Evidence-Klassen und neue Product-Owner-Abnahmen

- **OWNER_PROD_TESTED:** Product Owner meldet reale Bedienung auf jetnity.com. Aussage gilt nur für den von ihm geprüften Ablauf, nicht automatisch für alle Rollen/Browser/Fehlerfälle oder DB-Integrität.
- **MERGED_TESTED:** Code auf Main integriert, mit PR-/CI-/Browser- oder Testnachweisen. Ein separates aktuelles Production-E2E ist damit nicht bewiesen.
- **IMPLEMENTED_PARTIAL:** Teilweise Nutzung/Integration oder bekannte Feature-, Provider-, Auth-, Daten-/Production- oder Abnahmegrenze.
- **NOT_DELIVERED:** vollständige Funktion nicht als produktiver Nutzerpfad nachgewiesen; vorhandene Foundations sind zu erhalten.
- **REQUIRES_VERIFICATION:** Aktivierung/Runtime/abhängige Gegenstellen nicht unabhängig bestätigt; niemals still als fertig deklarieren.

**Owner-Rückmeldung am 18.11.2026:**

| Bereich | Bestätigter Owner-Befund | Planungsfolge |
| --- | --- | --- |
| **KI-Funktionen** (KI-Reiseerstellung, sprachliche Reiseänderung/Reisebegleiter) | **„Funktioniert noch nicht“** | **Offene Phase-1-Runtime-Lücke**; zuerst Ursache/Umgebung/Anbindung diagnostizieren, vorhandene Architektur nicht ungeprüft neu bauen |
| **Reisewetter** | **Auf jetnity.com getestet** | Bestehende Wetterfunktion nicht neu bauen; Umfang des Tests vom noch gesondert nachzuweisenden globalen Quoten-/DB-Gate #1219 trennen |
| **Merkliste** | **Auf jetnity.com getestet** | Funktion nicht als „fehlt“ führen; Production-Schema-/BG1-Readback und Mehrgeräte-/Fehlerfälle sind separate technische Evidence |
| **Admin, CMS, Kampagnen** | **Weiss ich nicht** | Keine Live-Freigabe behaupten; vorhandene Dev-Runtime (#1212) und Production-Vorbereitung (#1220) gezielt read-only prüfen |
| **Gesamte Reise** | **Auf jetnity.com getestet** | Grundlegenden Nutzerablauf als vom Owner getestet behandeln; kein pauschaler E2E-/Release-PASS für alle Wege, Provider-/Payment-/Security-Fehlerfälle |

**Evidenzgrenze:** Das Repository kann Code, Tests und vergangene Release-Prüfungen belegen; diese Runde hat **keinen frischen vollständigen authentifizierten Browser-/Realgeräte-Endtest** ausgeführt. Konfiguration/DB wurden nicht verändert und keine privaten Daten/Secrets gelesen.

## 4. Stand der 55 Funktionen — keine Neubau-Duplikate

Legende: **B** = gebaut und mit technischer Evidence belegt; **T** = vom Owner live getestet; **P** = teilweise/Bedarf an zusätzlichen Nachweisen; **O** = langfristige Funktion als Ganzes noch offen. B/T bedeutet **nicht** Release-Readiness-PASS.

### A. Reise und Planer

| Nr. | Funktion | Stand / tatsächliche Grenze |
| --- | --- | --- |
| 01 | Gastreise ohne Anmeldung | **B** – Guest-Erstellung/Persistenz |
| 02 | Reise aus KI-Beschreibung | **P** – Modell- und Vorschlagsweg implementiert; **Owner: funktioniert nicht**; Aktivierungs-/Runtimeprüfung offen |
| 03 | Reise speichern und erneut öffnen | **B** – Browser- und Kontopfad; **T** im geprüften Gesamtablauf |
| 04 | Mehrere Länder/Orte im selben Land | **B** – Multi-Stage, wiederholte Ziele |
| 05 | Etappen/An-/Abreise ändern | **B** – direkter Editor |
| 06 | Tagesplan mit Zeiten/Aktivitäten | **B** – Timeline/Planpunkte/Zeitprüfung |
| 07 | Google Maps im Reiseplan | **B** – Karte gemäß #1215/#1217 mit Einwilligung, Kosten-/Runtime-Gates |
| 08 | Orte auf der Karte wählen und hinzufügen | **B** – Kartenmarker/Stopp-Editor |
| 09 | Strecken/Verbindungen anzeigen | **P** – Routen-/Kartenlinien, Omio/12Go; schematische Linien ≠ geprüfte reale Wegberechnung |
| 10 | Änderungen ohne Datenverlust speichern | **B** – Revision/Conflict-/Persistenzprüfungen |
| 11 | Reise durch KI-Freitext ändern | **P** – Änderungs-/Vorschaupfad implementiert; **Owner: funktioniert nicht** |
| 12 | Reise automatisch vollständig prüfen | **P** – vorhandener Trip Audit V1 deckt Nächte, Zeiten, Flüge, Verbindungen im gespeicherten Plan ab; **keine** vollständige E2E-Durchführbarkeitszusage |

### B. Anbieter und Organisation

| Nr. | Funktion | Stand / tatsächliche Grenze |
| --- | --- | --- |
| 13 | Flughafen/Stadt/Land suchen | **B** – country-aware Airport Lookup #1231, public Browser-Evidence |
| 14 | Echte Flugangebote/Preise/Zeiten | **B** – Travelpayouts #1187 und Flugziel-Karten #1231; Bilder bei den Zielkarten |
| 15 | Kalender, One-way, Return, Open-Jaw | **B** – Suchformular/Kalender |
| 16 | Flugpartner korrekt öffnen | **B** – reale Linkouts/Browser-Evidence; **keine** automatische Buchungsbestätigung |
| 17 | Hotels mit Bildern/Preisen/Karte | **B** – Stay22 #1185, zusätzlich Partnerweiterleitung |
| 18 | Hoteltermine/Gäste aus Etappe übernehmen | **P** – Grunddaten vorhanden; komplexer Zimmer-/Kinderkontext nachzuprüfen |
| 19 | Hotel-Buchungspartner öffnen | **B** – Stay22 bzw. Booking.com-Linkout; kein Jetnity-Eigencheckout |
| 20 | Viator/GetYourGuide-Angebote | **P** – Widgets #1100; native Viator-Production-Aktivierung und GetYourGuide-Restpfad getrennt |
| 21 | Aktivitäten nach Ziel/Tag | **P** – tages-/zielbezogene Darstellung; verbindliche date-spezifische Availability nicht allgemein belegt |
| 22 | Mietwagen real vergleichen | **B** – DiscoverCars #1109: Fahrzeuge/Gesamtpreise/Details/Vergleich; Ablauf/Consent prüfen |
| 23 | 12Go/Omio-Verbindungen | **B** – #1101/#1176; allgemeine Strecke/Preisindikation ≠ bestätigter Sitz für einen Tag |
| 24 | Nach externen Anbietern zur Reise zurückkehren | **P** – Navigations-/Linkoutwege; keine universelle automatische Buchungs-Rückübernahme |

### C. Einreise, Wetter, Begleitung

| Nr. | Funktion | Stand / tatsächliche Grenze |
| --- | --- | --- |
| 25 | Kundenoberfläche Einreise/Visum | **B** – #1224/#1229; **nur UI-Beleg**, fachlicher Owner ist anderer TL |
| 26 | Einreise nach Land/Pass | **P** – tatsächliche sichere Abdeckung laut zuständigem Official-Truth-TL, hier **nicht** als generell abgeschlossen erklärt |
| 27 | Quellen/Formulare/Gebühren/alle Themen | **P** – eigenständiger Official-Truth-Workstream; keine Sach- oder Statusfreigabe hier |
| 28 | Wetter in Reise/Tagesplan | **T** – vom Owner auf jetnity.com getestet; Quoten-/Schutzkandidat #1219 unabhängig gegen Hosted-Stand abgleichen |
| 29 | „Jetzt wichtig“ | **B** – vorhandene kontextbezogene Aufmerksamkeit |
| 30 | KI-Reisebegleiter | **P** – Code/Assistant vorhanden; Owner berichtet KI funktioniert noch nicht |
| 31 | Automatische Cross-Domain-Änderungsfolgen | **O** – \`change-impact-foundation-v1\` ausdrücklich dormant; kein vollständiger Recovery-Service |

### D. Account/Meine Welt

| Nr. | Funktion | Stand / tatsächliche Grenze |
| --- | --- | --- |
| 32 | Login/Registrierung/Passwort | **B** – Auth-Flows vorhanden; echter Provider-Health-Test getrennt |
| 33 | Konto-2FA/Sicherheit | **B** – MFA/Session/Logout |
| 34 | Gastreise ins Konto übernehmen | **B** – Guest→Account, dokumentierte Browser-/Regressionstests |
| 35 | Mehrere Reisende/Staatsbürgerschaften | **B** – Account Registry/Trip-Snapshot; keine automatische Wahl des „besten Passes“ |
| 36 | Gespeicherte/vergangene/künftige Reisen | **B** – Account- und Reisen-Sammlung |
| 37 | Meine Welt (besucht/geplant) | **B** – accountgebundene Welt-/Besuchskarte |
| 38 | Präferenzen, Favoriten, Export | **T/P** – Merkliste vom Owner auf Production getestet; Sprach-Einstellung/Export gebaut; breitere Reisepräferenzen/Entitlements nicht pauschal abgeschlossen |

### E. Admin und Copilot Pro

| Nr. | Funktion | Stand / tatsächliche Grenze |
| --- | --- | --- |
| 39 | Admin-AAL2/2FA | **B** – Access-Guards vorhanden |
| 40 | Benutzer/Kontozähler/Analytics | **P** – implementierte Ansichten; Konto-/Production-Runtime und aktuelle Auth-Abnahme separat |
| 41 | CMS verwalten und veröffentlichen | **P** – Editor/geschützter Dev-RPC-Speicher #1212; Hosted Production-Schalter/DB-Gate nicht unabhängig freigegeben |
| 42 | Kampagnenentwürfe | **P** – Draft-Editor/Dev-Runtime; keine voll produktive Paid-Kampagnenautomatik |
| 43 | Provider, Kosten, Provisionen, Health | **P** – Ops Board/Analytics vorhanden, echte Revenue-Reconciliation/Finance unvollständig |
| 44 | Copilot-Pro-Analysen/Empfehlungen | **P** – deterministische read-only Analyst-Hinweise, nicht mit autonomer KI-Steuerung gleichsetzen |
| 45 | Copilot Pro führt freigegebene Routineaufgaben autonom aus | **O** – als volle produktive Betriebsautomatik nicht nachgewiesen; Official-Truth-KI-Konzeption gehört zum anderen TL |

### F. Website/Release

| Nr. | Funktion | Stand / tatsächliche Grenze |
| --- | --- | --- |
| 46 | Professionelle Startseite | **B** – #1108 und Browser-/CI-Evidence |
| 47 | Mobile Kernflächen | **P** – viele responsive/browser Tests, physische Realgeräte-Gesamt-Abnahme fehlt |
| 48 | Datenschutz/AGB/Impressum | **B** – Routen vorhanden; juristische Endfreigabe getrennt |
| 49 | Installierbare PWA | **B** – Manifest/App-Icons; Offline-Service-Worker bewusst nicht zugesagt |
| 50 | Gesamtreise auf Production stabil benutzbar | **T/P** – grundlegender Ablauf vom Owner auf jetnity.com getestet; vollständige Failure-/Security-/Provider-/Device-Matrix noch offen |

### G. Verbindlich erhaltene langfristige Funktionen

| Nr. | Funktion | Stand |
| --- | --- | --- |
| 51 | What-if-Reisesimulator | **O** – verbindlich geplant, isolierter vollständiger Simulator nicht produktiv |
| 52 | Guardian/Reise-Autopilot | **O** – verbindlich geplant, keine allgemeine automatische Reise-Runtime |
| 53 | Gesamtoptimierung Preis/Zeit/Komfort | **O** – Einzelberechnungen/Provider-Karte vorhanden, Gesamt-Value-Optimizer fehlt |
| 54 | Reisepartner-Finder/Gruppenplanung | **O** – bestehende Grundlagen/Strategie, volle Nutzerfunktion fehlt |
| 55 | Native iOS-/Android-Apps | **O** – Web/PWA vorhanden, native Apps später |

## 5. Alle acht Besonderheiten unbedingt erhalten

Diese Funktionen sind als **ausdrücklich gespeicherte, fortgeltende Zukunftsziele** zu behandeln. Diese Dokumentationsrunde ändert **weder ihre fachliche Definition noch ihre priorisierte strategische Wertigkeit**:

1. **OP-01 Jetnity Trip Audit / Journey Integrity Audit** – komplette Reise auf belegte Lücken/Widersprüche prüfen.
2. **OP-02 Change Impact & Recovery Engine** – Reiseänderungen und Folgen inklusive Optionen im Gesamtkontext erkennen.
3. **OP-03 Multi-Citizenship / Entry Decision Engine** – je Traveller/Papier belegte Optionen für die konkrete Route, kein Default-Pass.
4. **OP-04 True Trip Cost** – reale Gesamtreisekosten statt isolierter Billigangebote.
5. **OP-05 Route & Connection Feasibility** – tatsächliche Durchführbarkeit von Strecken/Umstiegen.
6. **OP-06 What-if-Reisesimulator** – sichere hypothetische Änderung; echte Reise bleibt unverändert bis ausdrücklicher Übernahme.
7. **OP-07 Next Best Action** – die wichtigste belastbare nächste Handlung zur konkreten Reise.
8. **Jetnity Guardian / Reise-Autopilot** – Änderungen/Probleme und Folgen erfassen, erklären, Lösungen vorbereiten, keine heimlichen Writes.

Die ersten sieben werden im [Differenzierungsregister](JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md), Guardian zusammen mit dem What-if-Simulator zusätzlich im [verbindlichen Standard](JETNITY_GUARDIAN_AND_WHAT_IF_SIMULATOR_STANDARD.md) geführt. **Nicht löschen, nicht still zurückstufen, nicht durch einen generischen Chatbot ersetzen.** Jede neue konkrete Build-Einordnung ist gesondert zu genehmigen und muss der echten Abhängigkeitslage folgen.

## 6. Vorschlag für nächste Restreihenfolge — NO AUTOMATIC START

Dies ist eine **Abstimmungs- und Priorisierungsempfehlung**, **keine** stille Änderung der verbindlichen V1-Build-Order oder ein Agentenauftrag. Der Owner entscheidet über Umsetzung und Programmreihenfolge. Live-Evidence/Gates gewinnen.

1. **KI-Runtime-Funktionsausfall diagnostizieren:** ohne Secrets im Chat; Modell-/Kill-Switch-/Auth-/Kosten-/Provider-Grenze und echte Ausgabefehler eingrenzen. Vorhandene \`reisevorschlag\`, \`reiseaenderung\` und \`reisebegleiter\`-Pfade wiederverwenden; nur gezielte Reparatur nach Auftrag. Keine pauschale Neubauarchitektur.
2. **Admin tatsächlich inventarisieren:** geschützte Analytics, CMS, Campaign Drafts, Kontozähler und Copilot-Analyst nach Dev/Production/aktiviert/unavailable unterscheiden. #1212 Dev gegen #1220 Production-Gate abgleichen; keine DB-, Rollen-, Auth- oder 2FA-Mutation ohne eigenen Auftrag.
3. **Phase-1-Reiseintegration und Anbieter-Evidence schliessen:** bestätigte Grundreise als Baseline, TW-8 Commercial Provenance/Revalidation/Übernahme/Booking State, Wiederöffnung/Fehler, Activities/Stay22/DiscoverCars/Flight/Connections sauber begrenzen. Bestehende Widgets/Provider nicht duplizieren.
4. **Official-Truth-Anschluss ausschliesslich dem zweiten TL überlassen:** V1 benötigt sichere echte reisenden-/pass-/route-spezifische Quelle und Vorbereitung. Andere Produktlanes ändern keinerlei Official-Truth-/Einreise-/Datenbank-Dateien, Migrationen, Tests oder CI.
5. **Phase-1-Releasequalität:** Preview/Production-Trennung (#968), Consent/Privacy/Legal, Monitoring, Kosten/Rate, Backup/Restore, Mobile/Browser/Accessibility, reale interoperative E2E-/Failure Cases und offene P0/P1 bewerten. Keine Skips oder Fixtures als PASS umdeuten.
6. **V1 DoD + Release Gate** getrennt ausführen; Owner entscheidet über Private Alpha/Closed Beta/Swiss Public Launch und Production-/Indexierungsfreigabe.
7. **Phase 2/3** abhängigkeitsgeleitet umsetzen; fortgeltende Guardian/What-if/Recovery/Optimierungsziele nicht vergessen. Neue Features nicht zulasten der sicheren Kernreise vorziehen.

### KI-Runtime einschalten – gesicherter Arbeits- und Owner-Freigabeweg (Nachtrag 19.11.2026)

**Herkunft und Nachweisgrenze:** Die Diagnose von 18.11. steht in [KI Runtime Recovery 1 – STATUS (unveränderlicher Originalstand)](https://github.com/Jetnity/jetnity/blob/4fbaab959ed44914d0a69947e3d89ae34193454c/docs/JETNITY_KI_RUNTIME_RECOVERY_1_STATUS_2026-11-18.md), aus dem geschlossenen, nicht gemergten [#1238](https://github.com/Jetnity/jetnity/pull/1238) mit identischem historischen Original in [#1252](https://github.com/Jetnity/jetnity/pull/1252). Diese Diagnose stellte **keinen aktuellen Production-Kill-Switch-Wert und keinen Production-KI-E2E-Erfolg** fest. Ein gemeinsamer Code-Gate vor den drei vorhandenen Pfaden `reisevorschlag`, `reiseaenderung`, `reisebegleiter` wurde lokal bestätigt (211/211 gezielte Tests); es wurde kein isolierter Runtime-Codefehler bewiesen. Seitdem wurde in isolierter KI-Dev-Vorschau die **Gast-KI-Reiseänderung mit sichtbarem Save→Reload** am 19.11. durch den Owner bestätigt. Der angemeldete Konto-Änderungstest blieb am **bestehenden 24-Stunden-Kontingent** blockiert, nicht als bestanden klassifiziert (Nachweise in #1252). Andere KI-Pfade und Production sind dadurch nicht automatisch abgenommen. Der am 18.11. im STATUS notierte Production-Alias-Rückstand ist **historische Beobachtung**; spätere Release-Entscheidungen sind separat live zu lesen.

**Reihenfolge, kein automatischer Ausführungsauftrag:**

1. **Aktuelle Runtime und Konfiguration read-only feststellen:** Vercel-Deployment, Domain-Alias, Git-SHA und Branch/Target für Dev und Production unabhängig abgleichen. In Vercel nur **Namen, Scope und Existenz** der benötigten Servervariablen prüfen, niemals Secretwerte in Chat, PR oder Logs aufnehmen: `JETNITY_MODELL_AKTIV`, `OPENAI_API_KEY`, `JETNITY_MODELL_NAME`, `JETNITY_MODELL_AUFWAND`, `SUPABASE_SERVICE_ROLE_KEY`. Ein Modellaufruf wird nur zugelassen, wenn der Kill Switch genau `true` oder `1` ist, ein gültiger Schlüssel vorliegt und Modell/Aufwand bekannt sind. **Nicht** aus der historischen Diagnose ableiten, dass Production aktuell deaktiviert oder aktiviert ist.
2. **Sicherheit, Budget und Modellvertrag abnehmen:** Modellname, API-Request/Parser, aktuelle Herstellerpreise und den konservativen Reservierungsvertrag in `lib/modell/preise.ts` vergleichen; der Statusbericht vom 18.11. notiert für Sol eine **historische** Preisabweichung. Jede Änderung an Modell, Kostenregeln, Preisdatei oder neuen Schlüsseln ist ein separater Owner-Gate. Bestehende Kontingent-, Gesamtkosten-, RLS-/Ownership- und Datenschutzgrenzen unverändert belassen; keine Quota-Umgehung für Tests.
3. **Datenbankvoraussetzungen read-only prüfen:** Vorhandene serverseitige Kontingent-Reservierung, zugelassene Supabase-/Session-Berechtigungen und die separate Reisebegleiter-Voraussetzung `20260917090000_modell_reisebegleiter` **am tatsächlichen Production-Stand** kontrollieren. Der alte Bericht nennt diese Migration historisch offen, beweist aber nicht ihren aktuellen Zustand. Fehlende Migration oder Berechtigung nur über eine **eigene geprüfte Owner-/DB-Freigabe** behandeln; nicht in diesem Docs-PR und nicht in der fremden Official-Truth-Lane ändern.
4. **Isolierten Dev-Endtest vollständig abschliessen:** Alle drei existierenden Nutzerpfade getrennt prüfen: KI-Reiseerstellung, KI-Reiseänderung und KI-Reisebegleiter. Bei #1252 den vorbereiteten **angemeldeten Konto-Änderungstest** erst nach regulärer Erneuerung des rollierenden KI-Kontingents durchführen: Vorschau prüfen → ausdrücklich übernehmen → speichern → neu laden → ursprüngliche Aktivitäten/Notizen/Unterkünfte und IDs/Revision vergleichen. Der zuvor bestandene Gasttest ersetzt diesen nicht. Fehlende Modellantwort, Timeouts, falsches JSON, Kontingent und fehlende Konfiguration müssen ehrlich fehlschlagen, ohne die Reise zu beschädigen.
5. **Production ausschliesslich mit Owner-Freigabe einschalten:** Erst nach getrenntem Merge-/Production-/Kostenentscheid die zulässige Modellkonfiguration und vorhandenen Schlüssel **im richtigen Vercel-Production-Scope** bereitstellen und `JETNITY_MODELL_AKTIV` gezielt freigeben. Das passende Deployment kontrolliert bereitstellen bzw. zuordnen. Ein Docs-Merge, Main-CI oder Alias-Wechsel schaltet die KI **nicht** automatisch ein. Kein Login/2FA durch Coding-Agenten.
6. **Nach Aktivierung echte Abnahme und Rückfallweg:** Für Erstellung, Änderung und Begleiter die kleinsten autorisierten Production-E2E-Wege mit echter Antwort, Quoten-/Kostenkontrolle, Sitzungs- und Speicherungstest nachweisen. Bei Fehlern den Kill Switch kontrolliert deaktivieren und den bestehenden Release-/Rollbackweg verwenden; keine erfundene Erfolgsmeldung. Vor einer öffentlichen Freigabe erneute Owner-/V1-Release-Gate-Prüfung.

**Verbindliche Priorität:** KI-Runtime abschliessen → während des Kontingent-Wartefensters Admin-Inventar Dev/Production prüfen → danach Reise-Integration/Anbieter-Evidence → dann Preview-Trennung, Consent, Mobile und E2E. Vorhandene Karte und `Jetzt wichtig` nicht neu bauen; Change Impact/What-if/Guardian später; Einreise ausschliesslich durch den anderen TL.

### Bestätigte Schutz-/Releasegrenzen

- **GitHub Main vs jetnity.com:** \`main\` ist zum Berichtsstand neuer als das bewusst auf die Domain gepinnte Flug-Discovery-Deployment. Nicht als automatischen Fehler interpretieren; eine Umschaltung ist separater Owner-Release-Entscheid.
- **KI-Funktion ist nicht als live funktionsfähig abgenommen.** Source/Tests ersetzen keine passende, autorisierte Laufzeit und Modellkostenfreigabe.
- **Reisewetter und Merkliste sind owner-getestet**, aber Source-Änderungen für globale Wetterquote/Saved-Offers-Gebinde werden nicht durch diesen Produktbericht als sicher in Production installiert ausgegeben. Eigene Guard-/Runtime-Readbacknachweise bleiben separat.
- **Admin-Production:** Source verlangt einen branch-/env-gebundenen Production-Schalter, insbesondere \`main\`; keine Auth-/DB-Bypass-Empfehlung.
- **Official Truth:** ausschliessliche Verantwortung des parallelen TL. Offene PRs und tatsächliche Faktenversionen stets live dort lesen; diese Planung ist kein Truth-/DB-Bericht.
- **Public Indexing/Launch, neue Kosten, externe Anbieter, Echtgeld/Subscriptions, Produktions-DB und grundlegende Auth-Änderungen** bleiben spezielle PO-Gates.

## 7. Welche älteren Statusdokumente als datierte Historie fortbestehen

- [ROADMAP.md](../ROADMAP.md), [JETNITY_START_HERE.md](../JETNITY_START_HERE.md), [ACTIVE_WORK_STATUS.md](ACTIVE_WORK_STATUS.md) enthalten zeitweise **veraltete operative Live-Pointer** aus 12.–16.11.; deren Historie nicht vernichten. Für eine konkrete Official-Truth-Arbeitsanweisung gilt **ausschliesslich** der zuständige TL mit seinen neuesten PR-/Issue-/CI-/Runtime-Nachweisen.
- [Phase-1 Gap Analysis vom September](JETNITY_V1_PHASE1_GAP_ANALYSIS_2026-09-01.md) nennt teils World Map/Provider noch als fehlend. Diese Aussagen sind durch seitdem gemergte Runtime-Slices für den **Bauzustand** veraltet, nicht notwendigerweise für die finalen E2E-Release-Gates.
- [Admin Delivery Plan vom 15.11.](ADMIN_PRODUCT_DELIVERY_PLAN_2026-11-15.md) führt Analytics/CMS/Marketing als Platzhalter. Seit #1212/#1220 existieren implementierte und zumindest Development-gebundene Runtimepfade. Production ist getrennt zu prüfen.
- Alte Account AP- und Binding-Build-Order-Berichte dokumentieren technische Abhängigkeiten, aber nicht automatisch den aktuellen Status jeder Funktion.

**Reconciliation-Prinzip:** Bestehende Einträge nicht löschen und keinen grossen Whole-File-Rewrite. Diese neue, datierte Gesamtübersicht zeigt den verifizierten Funktionsstand. Die originalen verbindlichen Verträge und strategischen Ziele bleiben unberührt.

## 8. Nachweise

**Kanonische Produktdokumente:** [ADR-0204](ADR_0204_JETNITY_THREE_PHASE_PRODUCT_RELEASE_STRATEGY.md), [Drei-Phasen-Zielbild](JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md), [V1-DoD](JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md), [V1-Readiness](JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md), [V1-Baufolge](JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md), [Strategieregister](JETNITY_STRATEGIC_DIFFERENTIATION_OPPORTUNITY_REGISTER_2026-08-30.md).

**Reise und Anbieter:** [#1180](https://github.com/Jetnity/jetnity/pull/1180), [#1181](https://github.com/Jetnity/jetnity/pull/1181), [#1198](https://github.com/Jetnity/jetnity/pull/1198), [#1215](https://github.com/Jetnity/jetnity/pull/1215), [#1217](https://github.com/Jetnity/jetnity/pull/1217), [#1185 Stay22](https://github.com/Jetnity/jetnity/pull/1185), [#1187 Travelpayouts](https://github.com/Jetnity/jetnity/pull/1187), [#1231 Flight Discovery](https://github.com/Jetnity/jetnity/pull/1231), [#1109 DiscoverCars](https://github.com/Jetnity/jetnity/pull/1109), [#1100 Activities](https://github.com/Jetnity/jetnity/pull/1100), [#1101 12Go](https://github.com/Jetnity/jetnity/pull/1101), [#1176 Omio](https://github.com/Jetnity/jetnity/pull/1176).

**Account/Admin:** [#1212](https://github.com/Jetnity/jetnity/pull/1212), [#1220](https://github.com/Jetnity/jetnity/pull/1220), [#1221 Saved Offers BG1](https://github.com/Jetnity/jetnity/pull/1221), [#1219 Wetterquoten](https://github.com/Jetnity/jetnity/pull/1219), [#968 Preview-Isolation](https://github.com/Jetnity/jetnity/issues/968).

**Bereits vorhandene Quellbereiche:** \`lib/reisevorschlag/\`, \`lib/reiseaenderung/\`, \`lib/reisebegleiter/\`, \`components/trips/\`, \`lib/trips/trip-audit-v1/\`, \`components/trips/reisekarte/\`, \`lib/providers/\`, \`lib/saved-offers/\`, \`components/account/\`, \`components/admin/\`, \`lib/admin/\`; Quellcode-Bestand ist **nicht** eine eigenständige Hosted-Aktivierungsbestätigung.

**Official-Truth-Quellen werden von diesem Dokument nicht geändert, bestätigt oder freigegeben.** Der aktuelle Fachstand ist ausschliesslich vom separaten Technical Lead auf GitHub und im jeweiligen echten Runtime-Readback festzustellen.

---

**STOP NACH DOKUMENTATIONSABNAHME:** Dieser Bericht startet keinen Runtime-/Agenten-Slice. Weitergehende Änderungen, insbesondere eine fundamentale Änderung der verbindlichen Bau-Reihenfolge und jede Production-Aktion, benötigen die dazugehörige neue ausdrückliche Owner-Entscheidung.