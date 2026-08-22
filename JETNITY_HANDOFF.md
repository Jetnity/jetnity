# Jetnity – Handoff und nächste Schritte

Stand: 22. August 2026  
Status: **verbindlicher operativer Übergabepunkt – Foundation D im Product-Owner-Closeout**

Dieser Handoff ist die zentrale Einstiegspunkte-Datei für einen neuen Chat oder Coding Agent. Er ersetzt keine Fach- oder Statusdateien, sondern sagt **was Jetnity ist, was bereits gebaut wurde, was verbindlich entschieden ist, was aktuell läuft und was als Nächstes zu tun ist**.

Wenn Chat-Erinnerung und Repository widersprechen: **nicht raten – aktuellen Git-/PR-/CI-/Preview-/Supabase-/Production-Stand verifizieren.**

Verbindliche Kontinuitätsregel:

> **Kein relevanter Fortschritt darf beim Wechsel von Chat, Agent oder Sitzung verloren gehen. Was für die Fortsetzung wichtig ist, gehört ins Repository.**

Ein neuer Chat soll mit diesem Satz übernehmen können:

> **„Wir machen mit Jetnity weiter. Lies den Handoff und den aktuellen Repository-/Production-Stand und übernimm exakt die bisherige Hauptentwickler-Rolle.“**

Der Nutzer soll frühere Entscheidungen, Foundations oder den letzten Arbeitsfortschritt **nicht erneut erklären müssen**.

---

## 1. Pflichtlektüre

Vor Produkt-/Architektur-/Implementierungsentscheidungen lesen:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `AGENTS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/EXPERT_PROACTIVITY_POLICY.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`
- `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`
- `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`
- relevante Fach-/Acceptance-/Review-Dokumente unter `docs/`

Bei einem aktiven größeren Arbeitsblock zusätzlich die **Branch-Version** von `docs/ACTIVE_WORK_STATUS.md` und den aktuellen `docs/CURSOR_...TASK.md` bzw. neueren Review-/Amendment-Auftrag lesen.

---

## 2. Produktmandat / Rollen

Jetnity soll zum **führenden intelligenten Reiseplanungs- und Reisebegleitungsprodukt seiner Kategorie** entwickelt werden. „Nummer 1“ ist ein Entwicklungsziel, keine heutige Marktbehauptung.

Leitsätze:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

> **Nicht mehrere getrennte Suchprodukte, sondern eine Reise, deren Bereiche sich gegenseitig verstehen.**

Rollen:

- **Product Owner / Nutzer:** verbindliche Produktentscheidungen; finale Freigaben.
- **ChatGPT:** Hauptentwickler-/Product-/Architecture-/Logic-/Security-/Review-Steuerung; prüft tatsächlichen Repo-/Infra-Stand unabhängig.
- **Cursor:** Implementierung größerer Blöcke nach versioniertem Auftrag.
- **GitHub:** dauerhaftes gemeinsames Gedächtnis / Source of Truth für Kontinuität.

### Merge-Gate

**Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**

Grüne Tests, CI, Preview, technisches „ready“ oder positives Review ersetzen die Product-Owner-Entscheidung nicht. Production-Migrationen, Provider-Aktivierung und Kostenfreigaben bleiben separate Gates.

### Expert-Proaktivität

ChatGPT und Cursor sollen wie Senior-Produkt-/Architektur-/Engineering-/Security-/UX-Profis handeln. Hochwirksame Lücken, Risiken oder bessere Lösungen müssen proaktiv vorgeschlagen und versioniert werden.

### Kein Bestandsschutz alter Funktionen

Früher gebaut oder früher grün getestet bedeutet **nicht**, dass eine Funktion unveränderlich ist.

Wenn eine bestehende Funktion dem heutigen Jetnity-Standard nicht mehr entspricht oder das Gesamtsystem verschlechtert, darf/soll sie professionell refaktoriert, vereinfacht, ersetzt, migriert oder nach Product-Owner-Freigabe entfernt werden. Eine Funktion gilt nicht als fertig, wenn sie nur isoliert funktioniert; fachlich gekoppelte Funktionen müssen fehlerfrei zusammenspielen.

---

## 3. Bestehender technischer Produktkern

Stack:

- Next.js App Router / TypeScript / Tailwind
- Vercel
- Supabase Postgres/Auth/Storage
- gemeinsamer Reisegraph statt separater Schattenmodelle
- Web/PWA zuerst, Native später

Production-URL:

`https://jetnity-app.vercel.app`

Supabase:

- Production: `qscbgcdmivbbnzrcyegn` (`eu-central-2`)
- Development: `yfvbxvijcorffwxbxahl`

Bereits abgeschlossen / auf `main`:

- Phase 3.1 – Flight Foundation
- Phase 3.2 / 3.2c – Hotel Foundation
- Phase 3.3 / 3.3b / 3.3c – Activities Foundation
- Trip Workspace Mobile UX Iterationen
- Trip Coverage & Booking Status
- Foundation A – Mobilität & Transfers
- Foundation B – Mietwagen
- Foundation C – Automatic Travel Requirements & Readiness

Foundation C Production-Migrationen:

- `20260822010000_trip_readiness_items`
- `20260822020000_trip_travellers`

Foundation C ist abgeschlossen und darf nicht unnötig neu gebaut werden. Der dortige singuläre Traveller-Kontext ist jedoch ausdrücklich **nur transitional**; Foundation E ersetzt die langfristige Annahme durch belastbaren 1:n-Traveller Context.

Provider-Suchen/Requirements bleiben produktiv deaktiviert, solange keine echten Provider, Secrets und separate Freigaben vorhanden sind. Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Zeiten oder erfundenen regulatorischen Aussagen.

---

## 4. Aktiver Arbeitsblock – Foundation D / PR #34

**Foundation D – Route & Transit Intelligence** ist technisch umgesetzt und befindet sich im Product-Owner-Closeout, noch nicht gemergt.

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34**
- PR bleibt Draft
- kein Merge ohne ausdrückliche Product-Owner-Freigabe
- keine Foundation-D-Production-Migration ohne separates Gate
- Fachdokument: `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- Acceptance: `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- Live-Handoff im Branch: `docs/ACTIVE_WORK_STATUS.md`

Foundation D liefert u. a.:

- provider-neutrale Route-Facts-Domäne in `lib/route/`
- persistierte Flight-Itinerary in vorhandenem `trip_items.metadata`
- atomarer Development-RPC (ADR-0113) und fail-closed TypeScript-Recovery
- Airport-/Country-Truth aus `public.airports` statt Browser-Feldern (ADR-0114)
- dieselbe Grenze für direkten `reise_anlegen`-RPC und jeden `trip_items`-INSERT/UPDATE (ADR-0115, ADR-0116)
- Guest→Account-Persistenz der Route; stiller Route-Verlust ist kein Erfolg
- Readiness-Reevaluation bei Transitänderungen
- traveller-neutrale Route Truth als Grundlage für spätere Traveller-Profile

Wichtige Development-Migrationen von Foundation D:

- `20260822130000...`
- `20260822140000_flug_route_itinerary_airport_truth.sql`
- `20260822150000...` Route-Metadata-Guard

Diese sind **nicht** auf Production, solange keine separate Freigabe erfolgt.

### Product-Owner-Rundgang zu PR #34

Der Product-Owner-Rundgang ist **abgeschlossen**. Die dabei bestätigten Anforderungen sollen nicht unkontrolliert in PR #34 hineingebaut werden, sondern sind als verbindliche nächste Produktwahrheit gesichert. PR #34 bleibt Draft; kein Merge, kein Mark Ready, keine Production-Migration, kein Provider, keine Secrets.

Aktueller verbindlicher Closeout-Auftrag im Branch:

`docs/CURSOR_PR34_PRODUCT_OWNER_CLOSEOUT_TASK.md`

Cursor muss vor einer späteren Merge-Entscheidung:

1. Branch mit aktuellem `main` synchronisieren,
2. Konflikte semantisch sauber lösen,
3. Tests/Build/Security/UI-Audits neu ausführen,
4. CI und Vercel auf exakt finalem Head prüfen,
5. `docs/ACTIVE_WORK_STATUS.md` / Handoff / Acceptance aktualisieren,
6. Abschlussbericht erzeugen,
7. **nicht mergen**, **nicht Mark Ready**, **keine Production-Migration**.

Danach prüft ChatGPT den finalen Stand unabhängig. Erst dann kann der Product Owner separat über Merge entscheiden.

---

## 5. Verbindliche Product-Owner-Entscheidungen aus dem Rundgang

### 5.1 Multi-Destination ab Reiseeinstieg

Die Startseite/Planung darf nicht nur genau ein Ziel modellieren.

- Homepage für Einzielreise einfach halten.
- Progressiv `+ Weiteres Ziel hinzufügen`.
- geordnete dynamische Ziele/Etappen.
- bestehende `trip_stages` wiederverwenden; kein zweites Multi-Destination-Modell.
- Ziele verlustfrei in Planung übertragen.
- hinzufügen / entfernen / ersetzen / reorder.
- derselbe Ort darf mehrfach als eigene Etappe vorkommen.
- Nutzerziele strikt von Flight-Transit trennen.
- Jetnity darf bessere Reihenfolge vorschlagen, aber nicht still umsortieren.

### 5.2 „Meine Reisen“ bleibt zentraler Hub

- Seite bleibt bestehen.
- Gast: aktuell genau eine aktive Reise.
- Gast muss diese Grenze transparent verstehen.
- Bei bestehender Gastreise primär eher `Reise fortsetzen` statt irreführendem `Neue Reise`.
- niemals still überschreiben.
- mehrere Ziele innerhalb einer Reise zählen weiterhin als eine Gastreise.
- Mehrziel-Reisen sollen in Reisekarten als Route/Etappen erkennbar sein.

### 5.3 Initiale Reiseerstellung vereinfachen

- `Reisetempo`-Chips entfernen.
- strukturierte Interessen-Chips aus dem Initialflow entfernen.
- kein implizites `balanced` als user-confirmed Truth.
- ein optionaler Freitext `Wünsche & Prioritäten` als weicher Planungskontext.
- Hard Facts und Soft Preferences strikt trennen.
- Freitext später im Workspace sichtbar und einfach editierbar.
- bestehende `pace`-/`interests`-Felder später professionell auf Legacy/Nullable/Deprecation prüfen; kein stiller Bedeutungswechsel alter Daten.
- Jetnity fragt Präferenzen später gezielt nur dann, wenn die Antwort eine konkrete Entscheidung wirklich verbessert.

### 5.4 Trip Workspace ist wichtigste Produktoberfläche

Der Trip Workspace / besonders die **Übersicht** ist das intelligente Kontrollzentrum der Reise.

Die Übersicht muss aus Sicht des Besuchers schnell beantworten:

1. Was ist diese Reise?
2. Was ist bereits erledigt?
3. Was fehlt noch?
4. Gibt es Warnungen/Risiken/offene Entscheidungen?
5. Was empfiehlt Jetnity jetzt als Nächstes?

Sie darf nicht nur Karten sammeln, sondern muss Reise-Wahrheit, Status, Priorität, Empfehlungen, Warnungen und nächste Schritte intelligent zusammenführen.

Bevorzugte mentale Struktur für den späteren Umbau:

1. Reise-Kopf / Gesamtstatus
2. `Jetzt wichtig` / nächste sinnvolle Schritte
3. Warnungen / Risiken / relevante Hinweise
4. Fortschritt pro Fachbereich
5. Einreise & persönliche Vorbereitung
6. Tagesplan, wenn die Grundlage ausreichend steht
7. Wünsche & Prioritäten / Änderungen
8. sekundäre Details progressiv

Harte Facts, Booking-/Planstatus, weiche Wünsche, Empfehlungen, Warnungen und offene Entscheidungen müssen visuell und semantisch getrennt bleiben.

### 5.5 Geräte-/Viewport-Parität

Alle UX-/Logik-/Intelligence-Prinzipien gelten für Smartphone, Tablet, Laptop und Desktop.

> **Gleiche Reise. Gleiche Wahrheit. Gleiche Nutzerkontrolle. Gleich verständlich auf jedem Gerät.**

Responsiv darf die Dichte/Darstellung variieren, aber nicht fachliche Bedeutung, Kernfunktion, Nutzerkontrolle oder Entscheidungslogik.

---

## 6. Verbindliche nächste interne Priorität – Foundation E

Nach Abschluss von Foundation D kommt **Foundation E – Traveller Context / Multi-Citizenship / Multi-Document**.

Zielmodell:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängige zulässige Optionen.**

Verbindlich:

- mehrere Citizenship-/Document-Kontexte korrekt modellieren
- individuelle Auswertung je Traveller
- Group-Travel korrekt
- Legal/Regulatory zuerst, dann Route-/Transit-Kompatibilität, dann belegbare Vorteile
- keine Passnummern, Scans, biometrischen Daten oder unnötigen sensiblen Daten
- Guest/Account-Parität
- RLS/Privacy/Security
- Freshness/Fingerprints/Reevaluation
- keine uncontrolled passport hopping
- `unknown` ehrlich behandeln

Ein konkreter Foundation-E-Cursor-Auftrag wird nach Foundation-D-Abschluss mit Schema/API/RLS/UX/Tests/Migration-Gates professionell erstellt. Das genaue DB-Schema ist **noch nicht blind vorwegzunehmen**.

Erst auf belastbarer Foundation-E-Basis soll ein echter Travel-Requirements-Provider produktiv evaluiert/aktiviert werden.

---

## 7. Danach – großer Workspace-Umbau und kompletter Intelligence Audit

Nach Foundation E wird der zentrale Trip Workspace mit Route Truth + Traveller Truth + bestehendem Reisegraphen umfassend optimiert.

Wichtig: Frühere Funktionen dürfen dabei verändert werden, wenn sie dem heutigen Standard nicht entsprechen.

Danach ist ein verbindlicher **Senior Product / Architecture / UX / Logic / Security / Intelligence Audit** vorgeschrieben:

`docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`

Der Audit prüft u. a.:

- komplette Informationsarchitektur: wo was liegen sollte
- bestehende und neue Funktionen erneut gegen heutigen Standard
- Cross-Domain-Zusammenspiel
- doppelte/konkurrierende Sources of Truth
- Änderungsketten und Folgeeffekte
- Guest/Account/Guest→Account
- Multi-Destination
- Multi-Traveller/Multi-Citizenship
- Truth/Evidence/Security
- UX/Psychologie/Accessibility
- Geräte-/Viewport-Matrix
- realistische End-to-End-/Edge-Case-Szenarien
- proaktive Experten-Funde, auch wenn der Product Owner sie nicht selbst genannt hat

Erst nach behobenen Audit-Funden, erneuter technischer Verifikation und ausdrücklicher Product-Owner-Freigabe gilt die zentrale Workspace-Ausbaustufe als produktreif.

---

## 8. Travel Safety & Disruption Intelligence – verbindlich

Diese Fähigkeit **wird gebaut**, aber nicht als Schnelllösung in Foundation D.

Fachregel:

`docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`

Jetnity soll erkennen können, wenn aktuelle reale Ereignisse eine konkrete geplante/laufende Reise betreffen, z. B.:

- Krieg/bewaffneter Konflikt
- schwere politische Unruhen
- Erdbeben/Tsunami/Vulkan
- Hochwasser/Waldbrand
- Hurrikan/Taifun/Zyklon
- andere erhebliche belegte Störungen

Verbindlich:

- kein LLM erzeugt Safety-Truth
- belastbare aktuelle Evidence/Authority
- räumliche + zeitliche Relevanz zur konkreten Reise
- keine pauschale Länderangst, wenn nur eine Region betroffen ist
- kritische Warnung / wichtiger Hinweis / Information trennen
- in der Workspace-Übersicht nach realer Relevanz priorisieren
- Cross-Domain-Folgen auf Route/Flug/Unterkunft/Aktivitäten/Mobilität/Tagesplan/Readiness prüfen
- sinnvolle nächste Aktion anbieten
- niemals Reise/Etappe/Buchung still ändern

---

## 9. Travel Timing & Seasonal Intelligence – verbindlich

Schwesterfunktion von Safety & Disruption mit **eigener Truth-Klasse**:

`docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`

Sie behandelt planbare/wiederkehrende saisonale Muster, z. B.:

- Monsun-/starke Regenzeit
- Hurrikan-/Taifun-/Zyklonsaison
- extreme Hitze/Kälte
- Waldbrand-/Rauchsaison
- Hochwasser-/Starkregenperioden
- saisonale Erreichbarkeit/Schließzeiten

Wichtig:

- saisonales Muster ist **nicht** gleich akute Gefahr
- Region + konkrete Reisedaten berücksichtigen
- historische/klimatologische Muster nicht als exakte Vorhersage verkaufen
- mögliche Trade-offs/Vorteile sachlich erklären, wenn belegt
- Alternative Reisezeiten vorschlagen dürfen
- Nutzer darf bewusst bei seiner Reisezeit bleiben
- Jetnity widerspricht der Entscheidung nicht und ändert nichts automatisch
- wenn später eine konkrete aktive Warnung entsteht, übernimmt Safety & Disruption die akute Ebene

Beide Funktionen werden später professionell in die Workspace-Priorisierung integriert und in den finalen Intelligence Audit aufgenommen.

---

## 10. Finale Startseiten-Optimierung – verbindlich

Wenn die zentralen Jetnity-Fähigkeiten tatsächlich fertig integriert und geprüft sind, wird die öffentliche Startseite nochmals **grundlegend als finale Positionierungs-/Kommunikationsfläche optimiert**.

Fachregel:

`docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`

Ein neuer Besucher muss innerhalb weniger Sekunden verstehen:

1. Was ist Jetnity?
2. Welches Problem löst es?
3. Was kann es konkret?
4. Was macht es anders als übliche Reiseplaner/Vergleichsportale/isolierte Suchmaschinen?
5. Warum sollte ich meine Reise hier beginnen?
6. Was ist mein nächster einfacher Schritt?

Die Startseite soll nicht als Feature-Wand funktionieren, sondern Jetnity als **zusammenhängendes intelligentes Reisesystem** erklären.

Keine zukünftige Fähigkeit darf als heute vorhanden verkauft werden. Keine unbelegbaren Marktführer-/Superlativ-Tatsachenbehauptungen. Intelligenz wird durch Nutzen/Verhalten erklärt, nicht permanent durch das Marketingwort „KI“.

---

## 11. Provider / Kosten / Production-Grenzen

Production-Suchen bleiben bis zu echten Provider-Zugängen und separater Freigabe deaktiviert.

- Flights: Foundation vorhanden; echter Production-Provider separat
- Hotels: echter Provider extern blockiert; Präferenz Booking.com Demand → HBX/Hotelbeds → Expedia später
- Activities: echter Provider separat
- Mobility: Suche deaktiviert
- Rental Cars: Suche deaktiviert
- Travel Requirements: kein echter Provider; Timatic aktuell bevorzugter Kandidat, aber nicht gebunden/aktiv
- Safety/Disruption/Seasonal Sources: später separat nach Authority, Coverage, Lizenz, Kosten, Freshness, Geo-Granularität und Datenschutz evaluieren

Keine neuen laufenden Kosten/Verträge/Secrets außerhalb bestehender Freigaberegeln.

Offener separater Security-Hardening-Track bleibt sichtbar (u. a. ältere `SECURITY DEFINER`-/GraphQL-Warnungen). Keine pauschalen Berechtigungsänderungen ohne Review.

---

## 12. Exakter nächster Schritt

Solange PR #34 noch offen ist:

1. tatsächlichen PR-#34-/Branch-/`main`-Stand prüfen,
2. Branch-Version von `docs/ACTIVE_WORK_STATUS.md` lesen,
3. `docs/CURSOR_PR34_PRODUCT_OWNER_CLOSEOUT_TASK.md` vollständig ausführen lassen,
4. finalen synchronisierten Head mit Tests/CI/Vercel/DB-Grenzen verifizieren,
5. ChatGPT führt unabhängigen Abschlussreview durch,
6. erst danach Product Owner separat um Merge-Freigabe fragen.

**Nicht** Foundation E starten, solange Foundation D nicht sauber abgeschlossen bzw. die Governance-Entscheidung dazu getroffen ist.

Nach Foundation D gilt als Reihenfolge:

1. **Foundation E – Traveller Context / Multi-Citizenship / Multi-Document**
2. **zentraler Trip-Workspace-Umbau**
3. **Travel Safety & Disruption + Travel Timing & Seasonal Intelligence professionell integrieren**
4. **finaler kompletter Workspace Intelligence Audit**
5. **später finale Homepage-Positionierungs-/Kommunikationsoptimierung**

Die Roadmap ist für spätere Phasen maßgeblich; vor jeder konkreten Arbeit den tatsächlichen Repo-/PR-/Production-Stand und im Feature-Branch `docs/ACTIVE_WORK_STATUS.md` neu prüfen. Foundation D darf nicht als zweite Route-Foundation neu gebaut werden. Traveller-Production-Schema in diesem PR nicht migrieren.
