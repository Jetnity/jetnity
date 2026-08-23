# Jetnity – Handoff und nächste Schritte

Stand: 23. August 2026  
Status: **verbindlicher operativer Übergabepunkt – Foundation D und E vollständig abgeschlossen inkl. Production; Travel Safety Foundation technisch reviewbereit auf Draft-PR #37**

Dieser Handoff ist der zentrale Einstieg für einen neuen Chat oder Coding Agent. Er sagt, was Jetnity ist, was bereits gebaut wurde, welche Regeln verbindlich sind und was als Nächstes zu tun ist.

Wenn Chat-Erinnerung und Repository widersprechen: **nicht raten – aktuellen Git-/PR-/CI-/Vercel-/Supabase-/Production-Stand selbst verifizieren.**

> **Kein relevanter Fortschritt darf beim Wechsel von Chat, Agent oder Sitzung verloren gehen. Was für die Fortsetzung wichtig ist, gehört ins Repository.**

Ein neuer Chat soll mit folgendem Satz übernehmen können:

> **„Wir machen mit Jetnity weiter. Lies `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md` und den aktuellen Repository-/Production-Stand und übernimm exakt die bisherige Hauptentwickler-Rolle.“**

Der Product Owner soll frühere Entscheidungen nicht erneut erklären müssen.

---

## 1. Pflichtlektüre

Vor größeren Produkt-/Architektur-/Implementierungsentscheidungen lesen:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `AGENTS.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- `docs/EXPERT_PROACTIVITY_POLICY.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`
- `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`
- `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
- `docs/TRIP_WORKSPACE_TRANSFORMATION_SCOPE_POLICY.md`
- relevante Fach-/Acceptance-/Review-Dokumente unter `docs/`

---

## 2. Produktmandat und Rollen

Jetnity soll zum **führenden intelligenten Reiseplanungs- und Reisebegleitungsprodukt seiner Kategorie** entwickelt werden. „Nummer 1“ ist Entwicklungsziel, keine heutige Marktbehauptung.

Leitsätze:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

> **Nicht mehrere getrennte Suchprodukte, sondern eine Reise, deren Bereiche sich gegenseitig verstehen.**

Rollen:

- Product Owner / Nutzer: verbindliche Produktentscheidungen und finale Gates
- ChatGPT: Hauptentwickler-/Product-/Architecture-/Logic-/Security-/Review-Steuerung; prüft tatsächlichen Repo-/Infra-Stand unabhängig
- Cursor: Implementierung größerer Blöcke nach versioniertem Auftrag
- GitHub: dauerhaftes gemeinsames Gedächtnis / Source of Truth für Kontinuität

### Harte Governance

- **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- Production-Migrationen sind separate Gates.
- Provider-Aktivierung, Secrets, Verträge und Kosten sind separate Gates.
- Grüne Tests/CI/Vercel ersetzen keine fachliche Review-Tiefe.
- Jeder neue Chat/Agent muss nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` aktiv nach unbekannten Truth-/Security-/Datenverlust-/Release-/Cross-Domain-Fehlern suchen.
- Frühere Implementierung hat keinen Bestandsschutz; relevante Alt-Funktionen dürfen professionell refaktoriert werden, wenn sie heutigen Standards nicht genügen.

---

## 3. Technischer Kern

- Next.js App Router / TypeScript / Tailwind
- Vercel
- Supabase Postgres/Auth/Storage
- gemeinsamer Reisegraph statt separater Schattenmodelle
- Web/PWA zuerst, Native später

Production:

- URL: `https://jetnity-app.vercel.app`
- Supabase Production: `qscbgcdmivbbnzrcyegn` (`eu-central-2`)
- Supabase Development: `yfvbxvijcorffwxbxahl`

Echte Travel-Provider bleiben derzeit deaktiviert. Keine Fake-Preise, Fake-Verfügbarkeit, Fake-Zeiten, erfundene Visa-/Safety-/Seasonal-Aussagen oder unfreigegebene Providerkosten.

---

## 4. Abgeschlossen – Reise-Fundament und Fachbereiche

Bereits abgeschlossen / auf `main`:

- Flight Foundation
- Hotel Foundation
- Activities Foundation
- Trip Workspace Mobile UX Iterationen
- Trip Coverage & Booking Status
- Foundation A – Mobilität & Transfers
- Foundation B – Mietwagen
- Foundation C – Automatic Travel Requirements & Readiness

Foundation C Production:

- `20260822010000_trip_readiness_items`
- `20260822020000_trip_travellers`

Foundation C ist abgeschlossen. Das dortige singuläre Traveller-Modell wurde durch Foundation E professionell erweitert.

---

## 5. Abgeschlossen – Foundation D / Route & Transit Intelligence

**Foundation D ist vollständig abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

- PR #34: gemergt
- Merge-Commit: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- Production-Acceptance: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`
- Fachdokument: `docs/ROUTE_TRANSIT_INTELLIGENCE.md`

Production-Migrationen:

- `20260822130000_reise_anlegen_route_itinerary`
- `20260822140000_flug_route_itinerary_airport_truth`
- `20260822150000_trip_items_route_itinerary_guard`

Route Truth bleibt traveller-neutral, provider-neutral und die kanonische Route-/Transit-Grundlage. Browser-Orts-/Länderfelder dürfen keine Route Truth erfinden.

---

## 6. Abgeschlossen – Foundation E / Traveller Context

**Foundation E ist vollständig abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

- PR #35: gemergt
- Squash-Merge-Commit: `3bf1eaaa78ef6ac33bb3baff84650a143720e91d`
- finaler PR-Head: `52601ea0f770cf4265a5bdf5cb2356557ef7dcde`
- final geprüfter Runtime-/DB-Code-Head: `b1f9d6543aa153bacaa126f71d39c6a434dfbebb`
- Fachdokument: `docs/TRAVELLER_CONTEXT.md`
- unabhängiger Closure-Check: `docs/PR35_CHATGPT_INDEPENDENT_CLOSURE_CHECK.md` – PASS
- Production-Acceptance: `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md`

Production-Migrationen:

- `20260822160000_traveller_context_intelligence`
- `20260822170000_traveller_context_fk_delete`
- `20260822180000_traveller_context_rereview`

Kanonisches Modell:

> **Ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängig bewertete zulässige Optionen.**

Wichtige Truth-/Security-Grenzen:

- Child-Tabellen sind kanonische Citizenship-/Document-Truth.
- `party_schreiben(jsonb)` ist atomar, `SECURITY INVOKER`, nur `authenticated` ausführbar.
- Guest und Account verwenden dieselbe fachliche Traveller-Form.
- Readiness kann traveller-spezifisch sein.
- Ausstellerland ist niemals automatisch Staatsbürgerschaft.
- Document↔Citizenship-Zuordnung wird nur aus expliziter Relation abgeleitet.
- `unknown` bleibt `unknown` ohne belastbare Provider-Evidence.
- keine Passnummern, Scans, MRZ oder Biometrie.

Finaler Qualitätsnachweis vor Production:

- 1353/1353 Tests
- DB-Security 210/210
- DB-Parallelität 7/7
- UI-Audit 838/838 auf WebKit + Chromium / 8 Viewports
- Production-Build 38/38

Production-Nachprüfung bestätigte u. a. RLS, Composite-FKs, Delete-Semantik, `FOR NO KEY UPDATE`, vollständigen Backfill und 0 erfundene Document↔Citizenship-Backfill-Relationen.

---

## 7. Verbindliche Product-Owner-Entscheidungen für den späteren Workspace

### Multi-Destination ab Reiseeinstieg

- Homepage für Einzielreise einfach halten.
- progressiv `+ Weiteres Ziel hinzufügen`.
- bestehende `trip_stages` wiederverwenden; kein zweites Multi-Destination-Modell.
- hinzufügen / entfernen / ersetzen / reorder.
- derselbe Ort darf mehrfach vorkommen.
- Nutzerziele strikt von Flight-Transit trennen.
- Jetnity darf bessere Reihenfolge vorschlagen, aber nicht still umsortieren.

### „Meine Reisen“ bleibt zentraler Hub

- Seite bleibt bestehen.
- Gast: aktuell genau eine aktive Reise.
- Grenze transparent erklären.
- bei aktiver Gastreise primär `Reise fortsetzen` statt irreführendem `Neue Reise`.
- niemals still überschreiben.
- Multi-Destination ist weiterhin eine Reise.

### Initiale Reiseerstellung vereinfachen

- Reisetempo-Chips entfernen.
- Interessen-Chips aus dem Initialflow entfernen.
- kein implizites `balanced` als bestätigte Nutzerwahrheit.
- ein optionaler Freitext `Wünsche & Prioritäten`.
- Hard Facts und Soft Preferences strikt trennen.
- gezielte Rückfragen erst dann, wenn sie eine echte Entscheidung verbessern.

### Trip Workspace ist wichtigste Produktoberfläche

Die Übersicht muss schnell beantworten:

1. Was ist diese Reise?
2. Was ist erledigt?
3. Was fehlt?
4. Gibt es Warnungen/Risiken/offene Entscheidungen?
5. Was empfiehlt Jetnity als Nächstes?

Bevorzugte mentale Hierarchie:

1. Reise-Kopf / Gesamtstatus
2. `Jetzt wichtig`
3. Warnungen / Risiken
4. Fortschritt pro Fachbereich
5. Einreise & persönliche Vorbereitung
6. Tagesplan, wenn die Grundlage steht
7. Wünsche & Prioritäten / Änderungen
8. sekundäre Details progressiv

### Geräteparität

> **Gleiche Reise. Gleiche Wahrheit. Gleiche Nutzerkontrolle. Gleich verständlich auf jedem Gerät.**

Smartphone, Tablet, Laptop und Desktop dürfen sich layoutseitig unterscheiden, aber nicht in fachlicher Bedeutung, Kernfunktion oder Nutzerkontrolle.

---

## 8. Nächste verbindliche Reihenfolge

Der nächste neue Produktblock ist **technisch reviewbereit auf dem Feature-Branch**, nicht auf `main`.

Aktiver Branch: `feat/travel-safety-disruption-intelligence`  
Draft PR: https://github.com/Jetnity/jetnity/pull/37  
Auftrag: `docs/CURSOR_TRAVEL_SAFETY_DISRUPTION_FOUNDATION_TASK.md`  
Acceptance: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ACCEPTANCE.md`  
Fachdokument: `docs/TRAVEL_SAFETY_DISRUPTION.md`  
Ist-Audit: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ARCHITECTURE_AUDIT.md`  
Live-Handoff: `docs/ACTIVE_WORK_STATUS.md`

Aktuelle Reihenfolge:

1. **Travel Safety & Disruption Intelligence – provider-neutrale Foundation**
2. **Travel Timing & Seasonal Intelligence – provider-neutrale Foundation**
3. Provider-Readiness-/Adapter-Lücken über alle relevanten Bereiche schließen (Flights, Hotels, Activities, Mobility, Rental, Requirements, Safety/Seasonal usw.)
4. großer End-to-End Trip-Workspace-/Übersicht-Umbau inklusive des besprochenen Wegs dorthin
5. verpflichtender finaler Senior Product / Architecture / UX / Logic / Security / Intelligence Audit
6. echte Providerphase
7. Provider-backed End-to-End-/Truth-Audit
8. finale Startseiten-Positionierung / Kommunikation

### Provider-Regel

Echte Provider kommen am Schluss. **Vorher müssen die provider-neutralen Ports/Adapter-Grenzen professionell fertig sein**, damit reale Provider später ohne neue fachliche Schattenmodelle angeschlossen werden können.

---

## 9. Nächster operativer Schritt

Cursor hat die provider-neutrale Safety-Foundation umgesetzt und die vier REQUEST-CHANGES-Blocker aus `docs/PR37_CHATGPT_INDEPENDENT_REVIEW.md` behoben. Nächster Schritt: **unabhängiger ChatGPT-Re-Review gegen den tatsächlichen neuen PR-Head**.

Harte Gates bleiben:

- kein Merge
- kein Mark Ready
- keine Production-Migration
- kein echter Safety-/Disruption-Provider

Lokal nach Review-Fix verifiziert: 1410/1410 Tests, UI-Audit 886/886 (WebKit + Chromium, 8 Viewports), Production-Build 38/38, DB-Gates unverändert. Runtime-Head `01096bb3`: GitHub Actions `32612980450` SUCCESS, Vercel Preview READY/SUCCESS.

Leitsatz:

> **Foundation D und E sind fertig. Safety ist jetzt eine eigene Truth-Domäne derselben Reise – nicht als isolierter Warnungsfeed und nicht als Live-Provider.**
