# Cursor-Nachtrag – Foundation C: Automatic Travel Requirements & Readiness

Stand: 22. August 2026  
Branch: `feat/travel-readiness-foundation`  
Draft-PR: `#32 – Foundation C – Travel Readiness & Dokumente`  
Status: **verbindlicher Produkt- und Architektur-Nachtrag**

Dieser Nachtrag ergänzt und überschreibt `docs/CURSOR_TRAVEL_READINESS_FOUNDATION_TASK.md` überall dort, wo der ursprüngliche Auftrag davon ausgeht, dass Nutzer Visa-, Einreise-, Impf-, Gesundheits- oder Dokumentanforderungen grundsätzlich selbst recherchieren müssen oder dass Foundation C dauerhaft nur eine manuelle Checkliste bleiben soll.

Der bestehende Auftrag bleibt ansonsten verbindlich, insbesondere für Logic Standard, Security, Datenschutz, Development/Production-Grenzen, Tests, Browser-Audits, CI, Preview und Dokumentation.

---

## 1. Neue verbindliche Produktentscheidung

Jetnity soll **von Anfang an als intelligentes automatisiertes Reisesystem** konzipiert werden.

Der Nutzer soll bei einer Reise nicht selbst herausfinden müssen, ob er beispielsweise:

- ein Visum benötigt
- visumfrei einreisen darf
- ein eVisa benötigt
- eine elektronische Reisegenehmigung wie ETA/eTA/ESTA benötigt
- Visa on Arrival nutzen kann
- einen Reisepass benötigt
- mit einer Identitätskarte einreisen darf
- eine bestimmte Pass-Restgültigkeit benötigt
- zusätzliche Transitdokumente benötigt
- wegen eines Transitlandes ein Transitvisum benötigt
- eine vorgeschriebene Impfung benötigt
- einen Gesundheits- oder Impfnachweis benötigt
- ein Einreiseformular ausfüllen muss
- einen Rück- oder Weiterflug nachweisen muss
- einen Versicherungsnachweis benötigt
- weitere verpflichtende Einreisedokumente benötigt.

**Jetnity soll diese Anforderungen selbst erkennen und automatisch für die konkrete Reise und den konkreten Reisenden auswerten.**

Produktprinzip:

> Der Nutzer plant die Reise. Jetnity erkennt automatisch, was für diese Reise erforderlich ist, erklärt es verständlich und zeigt rechtzeitig, was noch erledigt werden muss.

Nicht das Ziel:

> „Bitte prüfe selbst die Einreisebestimmungen.“

---

## 2. Travel Requirements Engine

Foundation C muss über eine reine Readiness-Checkliste hinausgehen und eine zentrale provider-neutrale **Travel Requirements Engine** vorbereiten.

Fachlicher Ablauf:

`Reisegraph + Reisendenkontext + Route/Transit + Reisedatum + vertrauenswürdige Requirements-Datenquelle → strukturierte Anforderungen → Jetnity Readiness → konkrete Nutzeraktionen`

Jetnitys intelligente Schicht darf:

- Anforderungen erklären
- priorisieren
- gruppieren
- Fristen verständlich darstellen
- fehlende Angaben erkennen
- gezielte Rückfragen formulieren
- Auswirkungen von Reiseänderungen erkennen
- Handlungsbedarf erzeugen
- belastbare Quellen und offizielle Antragswege präsentieren.

Sie darf regulatorische Wahrheit **nicht selbst erfinden**.

Ohne belastbare Provider-/Official-Evidence darf Jetnity insbesondere nicht selbst behaupten:

- `Visum erforderlich`
- `Kein Visum erforderlich`
- `Diese Impfung ist Pflicht`
- `Dieser Pass reicht`
- `Transitvisum nicht notwendig`.

Ein LLM ist keine regulatorische Quelle.

---

## 3. Provider-Strategie

Aktuell bevorzugter Kandidat für die spätere echte Integration ist **IATA Timatic / Timatic AutoCheck**, weil die Produktkategorie auf automatisierte Pass-, Visa-, Gesundheits- und Einreiseanforderungen ausgerichtet ist.

Das ist **keine Architekturbindung**. Jetnitys eigene Domain bleibt provider-neutral.

In diesem PR:

- keinen kostenpflichtigen Vertrag abschließen
- keinen externen Account buchen
- keine Kosten verursachen
- keine Secrets erfinden
- keinen Fake-Timatic-Adapter bauen
- keine manuell hartcodierte globale Visa-Matrix bauen
- kein unkontrolliertes Web-Scraping
- keine LLM-generierten regulatorischen Regeln.

Baue stattdessen die Adaptergrenze so, dass Timatic AutoCheck oder ein gleichwertiger vertrauenswürdiger Anbieter später ohne grundlegenden Produktumbau angeschlossen werden kann.

Vor einer späteren kostenpflichtigen Aktivierung separat bewerten:

- Preis
- Lizenzbedingungen
- erlaubte Nutzung
- Caching
- Datenhaltung
- Datenschutz
- Rate Limits
- Coverage
- API-Eigenschaften.

---

## 4. Automatische Prüfung statt manueller Recherche

Sobald Jetnity genügend belastbaren Kontext besitzt, soll die Requirements-Prüfung automatisch ausgelöst bzw. automatisch als erforderlich erkannt werden.

Beispiel:

`Schweiz → Thailand`

Jetnity kennt Reiseroute, Datum und den relevanten Reisendenkontext. Später soll die Engine daraus automatisch bestimmen können:

- Visa-Status
- Pass-/ID-Anforderungen
- Passgültigkeit
- Transit-Anforderungen
- Health-/Vaccination-Requirements
- zusätzliche Einreiseformalitäten
- Fristen
- Handlungsbedarf
- Quellen.

Der Nutzer soll dafür keine eigene Internetsuche durchführen müssen.

Ändert sich die Route, Destination, der Transit, das Datum oder ein relevanter Traveller-Fakt, müssen abhängige Ergebnisse automatisch stale werden und neu bewertet werden.

---

## 5. Individueller Reisendenkontext

Die bisherige reine Anzahl `travellers` reicht für dieses Produktziel nicht.

Foundation C soll eine saubere Grundlage für **individuellen Reisendenkontext** schaffen.

Untersuche das bestehende Datenmodell und entscheide per ADR, ob dafür eine eigene Traveller-Domäne nötig ist, z. B.:

- `trip_travellers`
- accountweite Traveller-Profile plus Trip-Zuordnung
- oder eine logisch bessere, datensparsame Lösung.

Mehrere Reisende derselben Reise müssen getrennt ausgewertet werden können.

Beispiel:

- Traveller A: Schweizer Staatsangehörigkeit
- Traveller B: serbische Staatsangehörigkeit

Jetnity darf niemals automatisch dieselben Einreiseanforderungen für beide annehmen.

### Minimal notwendige Traveller-Fakten

Nur fachlich notwendige Informationen speichern. Mögliche Foundation-Felder nach sauberer Prüfung:

- stabile Traveller-ID
- Anzeigename oder neutrale Bezeichnung
- Staatsangehörigkeits-Ländercode
- Wohnsitz-Ländercode
- Reisedokumenttyp
- ausstellendes Land des Reisedokuments
- optional Ablaufdatum des verwendeten Dokuments, falls für Requirements wirklich nötig
- sinnvolle Alterskategorie nur falls regulatorisch erforderlich
- weitere Requirement-Fakten nur bei klarer fachlicher Begründung.

Explizit **nicht** speichern:

- Passnummer
- Ausweisnummer
- Visa-Nummer
- Kreditkartendaten
- Pass-/ID-/Visa-Scans
- Führerschein-Scans
- biometrische Rohdaten.

Keinen Dokumententresor in Foundation C.

---

## 6. Progressive Missing-Facts-Logik

Die Nutzerführung soll intelligent und datensparsam sein.

Nicht zuerst ein riesiges Profilformular verlangen.

Ablauf:

1. bereits bekannte Reiseinformationen verwenden
2. bereits bekannte passende Traveller-Fakten verwenden
3. Requirements Engine bestimmt fehlende notwendige Fakten
4. nur diese fehlenden Fakten gezielt anfragen
5. danach automatisch neu prüfen.

Provider-/Domain-Ergebnis muss daher `insufficient_context` mit strukturierten `missingFacts` ausdrücken können.

Bekannte Informationen nicht erneut abfragen.

---

## 7. Provider-neutrale Requirement-Domain

Die Domain muss mindestens folgende Dimensionen abbilden können.

### Scope

- Trip
- Traveller
- Destination
- Transit
- optional Segment/Stage.

### Requirement Types

Mindestens Architektur für:

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
- `other_entry_requirement`.

Benennung darf verbessert werden, wenn die Domain dadurch klarer wird.

### Result

Mindestens:

- `required`
- `not_required`
- `conditional`
- `unknown`
- `insufficient_context`
- `provider_unavailable`.

Nicht alles auf Boolean reduzieren.

### Evidence

Mindestens:

- Provider
- Autorität / Source
- belastbare Source URL, falls vorhanden
- `checkedAt`
- optional `validFrom`
- optional `validUntil`
- Provider-/Rule-Reference
- Context Fingerprint
- Traveller-ID
- Destination-/Transit-Country-Code.

Provider-Evidence darf nicht vom Browser frei behauptet werden.

---

## 8. Health / Vaccination Requirements

Die Produktentscheidung umfasst ausdrücklich auch Impf- und Gesundheitsanforderungen.

Jetnity soll später automatisch erkennen können, ob eine konkrete Route einen verpflichtenden Impfnachweis oder andere regulatorische Health Requirements erzeugt.

Wichtig: **Requirement Truth und persönliche Gesundheitsdaten strikt trennen.**

Foundation C darf z. B. darstellen:

> „Für diese Route verlangt die vertrauenswürdige Quelle Requirement X.“

Foundation C baut aber keine Gesundheitsakte und keinen Impfpass-Vault.

Keine Impfpass-Uploads, Diagnosen oder unnötige persönliche Gesundheitsdaten.

Zusätzlich muss die Domain/UI sauber unterscheiden zwischen:

- verpflichtender Einreiseanforderung
- regulatorischem Gesundheitsnachweis
- offizieller Empfehlung
- allgemeinem Reisehinweis
- unbekannt.

Eine medizinische Empfehlung darf nicht als Einreisevorschrift dargestellt werden und umgekehrt.

---

## 9. Official Requirement Truth vs User Readiness

Die Trennung aus dem ursprünglichen Foundation-C-Auftrag bleibt zwingend.

### Official Requirement Truth

Was verlangt eine belastbare Quelle für diesen Traveller und diese konkrete Reise?

### User Readiness Truth

Was hat der Nutzer bereits erledigt?

Beispiel:

Requirements Engine erkennt später:

- eVisa erforderlich
- Reisepass erforderlich
- Passgültigkeit mindestens X
- Einreiseformular erforderlich.

Jetnity erzeugt daraus Handlungsbedarf:

- eVisa beantragen
- Passgültigkeit prüfen
- Einreiseformular ausfüllen.

Der Nutzerstatus `done` verändert nie die zugrunde liegende offizielle Requirement-Evidence.

---

## 10. Context Fingerprint + Freshness

Requirements müssen auf den gemeinsamen Reisegraphen reagieren.

Mindestens relevante Änderungen:

- Destination geändert
- Land hinzugefügt/entfernt
- Transit hinzugefügt/entfernt
- Reisedatum geändert
- Route geändert
- Traveller hinzugefügt/entfernt
- Staatsangehörigkeit geändert
- Wohnsitz geändert
- Reisedokument geändert
- Dokument-Ablaufdatum geändert.

Baue deterministische Context-Fingerprints / Revisionen.

Eine Evaluation gilt nur dann als aktuell, wenn ihr Kontext noch zum aktuellen Trip-/Traveller-Kontext passt.

Zusätzlich braucht die Architektur **zeitliche Freshness**:

- aktuell geprüft
- Recheck erforderlich
- veraltet
- Provider nicht erreichbar
- Quelle temporär nicht verfügbar.

Einreisebestimmungen ändern sich. Alte Evidence darf nicht dauerhaft als aktuell gelten.

Konkrete spätere Recheck-Frequenzen bleiben provider- und lizenzabhängig.

---

## 11. Provider Interface

Die Adaptergrenze soll so gestaltet sein, dass später z. B. ein `TimaticRequirementsProvider` implementiert werden kann.

Provider Input darf nicht nur ein Country Code sein.

Er muss relevante strukturierte Fakten aufnehmen können, z. B.:

- Origin
- Destinations
- Transit Itinerary
- Travel Dates
- Traveller Nationality
- Residence
- Document Type
- Issuing Country
- weitere tatsächlich erforderliche Provider-Fakten.

Provider Output wird in Jetnitys eigene Requirement-Domain normalisiert.

Keine provider-spezifischen Typen durch die gesamte Anwendung ziehen.

Solange kein echter Providerzugang vorhanden ist, bleibt die Integration ehrlich bei `provider_unavailable` oder `insufficient_context`.

---

## 12. UX-Ziel

Die fünf Hauptbereiche bleiben vorerst:

`Übersicht · Flüge · Unterkunft · Aktivitäten · Mobilität`

Keinen sechsten Top-Level-Tab erzwingen.

Der Bereich in der Übersicht soll fachlich aber nicht wie eine manuelle Checkliste wirken, sondern als **Einreise & Reisevorbereitung** oder ähnlich verständlich konzipiert werden.

Spätere evidenzbasierte Darstellung pro Traveller kann z. B. zeigen:

- Visum
- Reisepass / ID
- Passgültigkeit
- Transit
- Gesundheit / Pflichtnachweise
- Einreiseformular
- weitere Dokumente
- offene Schritte.

Nur belastbar belegte Aussagen dürfen konkret `required` / `not_required` anzeigen.

Fehlt der Providerzugang, ehrlich anzeigen:

> „Automatische Einreiseprüfung derzeit nicht verfügbar.“

Die langfristige Produkterfahrung soll dennoch klar darauf ausgerichtet sein, dass Jetnity diese Recherche übernimmt.

### Handlung statt bloßer Information

Die Domain/UX soll spätere sichere Actions unterstützen:

- offizielle Information öffnen
- offiziellen Antrag öffnen
- ETA/eVisa-Antragsseite öffnen
- Formular öffnen
- Deadline anzeigen
- offenen Vorbereitungspunkt erzeugen.

Keine URL aus freiem Modelltext. Keine Fake-Links. Keine offenen Redirects.

---

## 13. Guest / Account

Gast und Konto bleiben dieselbe fachliche Reiseform.

Wenn Traveller Context für Gäste gespeichert wird:

- nur lokal
- gleiche Domain-Form
- streng validiert
- Guest → Account idempotent übernehmbar.

Accountdaten:

- privat
- RLS
- kein öffentlicher Cache
- keine Cross-User-Leaks
- kein Admin-Zugriff auf private Traveller-Inhalte nur aus Bequemlichkeit.

Prüfe per ADR, ob Traveller-Fakten zunächst tripspezifisch oder sicher accountweit wiederverwendbar sein sollen.

Produktziel bleibt: bekannte Informationen nicht bei jeder Reise erneut abfragen.

---

## 14. Security / Datenschutz

Mit Traveller-Kontext steigt die Schutzanforderung.

Pflicht:

- Datenminimierung
- keine Dokumentnummern
- keine Dokumentscans
- keine Gesundheitsakte
- keine Secrets im Browser
- keine Service Role im Client
- RLS / Ownership vollständig testen
- Cross-Trip-/Cross-User-Verknüpfungen verhindern
- keine sensitiven Werte in Logs
- keine sensitiven Werte in Analytics
- keine Traveller-Personendaten in URL Query Strings
- keine öffentlichen ISR-/CDN-Caches für persönliche Requirements.

---

## 15. Migrationen

Falls Traveller-/Requirement-Modelle DB-Migrationen benötigen:

- nur Development
- versioniert
- Typen regenerieren
- Constraints/FKs/Indizes/RLS vollständig
- Reproduzierbarkeit und bestehende DB-/Security-Checks grün.

**Keine Production-Migration.**

Production erst nach separater ausdrücklicher Freigabe des Nutzers.

---

## 16. Zusätzliche Tests

Zusätzlich zum ursprünglichen Foundation-C-Testauftrag mindestens:

### Traveller Logic

- zwei Traveller mit unterschiedlicher Nationalität
- Requirements niemals zwischen Travellern vermischen
- unbekannte Nationalität → `insufficient_context`
- bekannte Angaben nicht erneut anfordern
- Traveller gelöscht → alte Evaluation nicht weiter verwenden.

### Route Logic

- Direktflug vs. Transit
- Transit hinzugefügt/entfernt
- Multi-Country
- Land mehrfach besucht
- Destination geändert
- Reisezeitraum geändert.

### Requirement Truth

- Provider `required` → required
- Provider `not_required` → not_required
- conditional bleibt conditional
- Provider unavailable → keine erfundene Antwort
- insufficient context → fehlende Fakten präzise
- LLM kann Official Truth nicht überschreiben.

### Health

- verpflichtende Requirement und Empfehlung getrennt
- Route kann Health Requirement erzeugen
- keine persönliche Gesundheitsakte entsteht.

### Freshness

- alter Context Fingerprint → stale
- Traveller-Fakt geändert → stale
- alte Provider-Evidence → recheck
- neue Evidence ersetzt alte sauber.

### Security

- Cross-user Traveller blockiert
- Cross-trip Relation blockiert
- Browser kann Official Evidence nicht fälschen
- Provider Source URL validiert
- keine Dokumentnummern im Schema/Payload
- keine sensitiven Werte in Logs.

---

## 17. Browser / Mobile

Bestehende WebKit-/Chromium-Audits bleiben Pflicht.

Zusätzlich prüfen:

- mehrere Traveller
- unterschiedliche Requirements je Traveller
- insufficient context
- progressive Fragen nach fehlenden Traveller-Fakten
- required / not_required / conditional / unknown
- stale / recheck
- lange Requirement-Texte
- mehrere Länder / Transit
- Mobile 280–430 px
- Landscape
- Desktop.

Keine horizontale Seitenverschiebung; Status nie nur über Farbe.

---

## 18. Dokumentation / ADR

Diese Produktentscheidung muss dauerhaft im Repository stehen.

Aktualisieren/ergänzen:

- `docs/CURSOR_TRAVEL_READINESS_FOUNDATION_TASK.md` oder klarer Verweis auf diesen Nachtrag
- `docs/TRAVEL_READINESS.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/REISEN.md`
- `docs/DATENBANK.md`
- ggf. `JETNITY_VISION.md`, `DESIGN_SYSTEM.md`, `docs/LOGIC_STANDARD.md`.

ADRs mindestens für:

1. automatische Travel Requirements als Produktprinzip
2. Traveller Context / Datenmodell
3. provider-neutrale Requirements Engine
4. Official Requirement Truth vs User Readiness
5. Health Requirement vs persönliche Gesundheitsdaten
6. Context Fingerprint + Freshness/Recheck
7. Timatic als bevorzugter aktueller Provider-Kandidat ohne Architekturbindung.

---

## 19. Definition of Done – Erweiterung

Foundation C ist erst technisch reviewbar, wenn mindestens:

- individueller Traveller Context vorhanden
- automatische Requirements-Engine-Domain vorhanden
- provider-neutrale Adaptergrenze vorhanden
- Timatic-/gleichwertige Integration sauber vorbereitbar
- kein Fake-Provider
- Requirements pro Traveller möglich
- Visa-/Passport-/ID-/Transit-/Health-/Vaccination-/Document-Kategorien abbildbar
- automatische Context-Stale-Logik vorhanden
- Freshness-/Recheck-Semantik vorhanden
- Requirements und Readiness sauber getrennt
- Guest-/Account-Parität geklärt
- RLS/Security vollständig
- progressive Missing-Facts-UX vorhanden
- alle ursprünglichen Tests/DB-Checks/Audits/Build/CI/Preview-Pflichten grün
- keine bekannten Logic-/Truth-Fehler offen.

---

## 20. Abschlussbericht – zusätzliche Pflichtfragen

Der Abschlussbericht muss zusätzlich beantworten:

1. Wie erkennt Jetnity automatisch, welche Anforderungen geprüft werden müssen?
2. Welche Traveller-Fakten verwendet die Engine?
3. Wie werden mehrere Reisende getrennt behandelt?
4. Welche Daten werden bewusst nicht gespeichert?
5. Wie funktionieren Transit und Multi-Country?
6. Wie funktionieren Impf-/Health Requirements ohne Gesundheitsakte?
7. Wie werden Pflicht und Empfehlung getrennt?
8. Wie funktionieren Context Fingerprint und Freshness?
9. Was passiert bei einer Reiseänderung?
10. Welche Provider-Schnittstelle wurde gebaut?
11. Wie kann Timatic später angeschlossen werden?
12. Was funktioniert bereits ohne Provider?
13. Was bleibt bis zum echten Providerzugang bewusst `provider_unavailable`?
14. Welche Kosten entstehen aktuell?
15. Welche externen Abhängigkeiten fehlen?
16. Welche Production-Aktionen wären später nötig?

---

## 21. Harte Grenzen

- **Nicht mergen.**
- **PR nicht Ready setzen.**
- **Keine Production-Migration.**
- **Keine Production-Provider-Aktivierung.**
- **Keine kostenpflichtigen Verträge.**
- **Keine Fake-Visa-/Impf-/Passregeln.**
- **Keine regulatorischen Behauptungen aus einem LLM.**
- **Kein Dokumententresor.**

Arbeite den bestehenden Draft-PR mit diesem Nachtrag selbstständig weiter und bringe ihn zu einem technisch vollständig reviewbaren Stand.