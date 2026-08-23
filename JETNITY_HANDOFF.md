# Jetnity – Handoff und nächste Schritte

Stand: 23. August 2026  
Status: **verbindlicher operativer Übergabepunkt – Foundation D, Foundation E und Travel Safety & Disruption Foundation abgeschlossen; aktiver Block: Travel Timing & Seasonal Intelligence – Draft PR #38, R9-Fixes + Exact-Head-Gate grün, R10-Re-Review offen**

Dieser Handoff ist der zentrale Einstieg für einen neuen Chat oder Coding Agent. Wenn Chat-Erinnerung und Repository widersprechen: **nicht raten – aktuellen Git-/PR-/CI-/Vercel-/Supabase-/Production-Stand selbst verifizieren.**

> **Kein relevanter Fortschritt darf beim Wechsel von Chat, Agent oder Sitzung verloren gehen. Was für die Fortsetzung wichtig ist, gehört ins Repository.**

Ein neuer Chat soll mit folgendem Satz übernehmen können:

> **„Wir machen mit Jetnity weiter. Lies `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md` und den aktuellen Repository-/Production-Stand und übernimm exakt die bisherige Hauptentwickler-Rolle.“**

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
- `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`
- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- `docs/TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md`
- `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`
- `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`
- `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
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
- GitHub: dauerhaftes gemeinsames Gedächtnis / Source of Truth

### Harte Governance

- **Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.**
- Production-Migrationen sind separate Gates.
- Provider-Aktivierung, Secrets, Verträge und Kosten sind separate Gates.
- Grüne Tests/CI/Vercel ersetzen keine fachliche Review-Tiefe.
- Jeder neue Chat/Agent muss nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` aktiv nach unbekannten Truth-/Security-/Datenverlust-/Release-/Cross-Domain-Fehlern suchen.
- Frühere Implementierung hat keinen Bestandsschutz; relevante Alt-Funktionen dürfen refaktoriert/ersetzt werden, wenn sie heutigen Standards nicht genügen.
- Stop-Kriterien respektieren: keine endlosen Perfektionsschleifen ohne konkret reproduzierbaren hochwirksamen Defekt.

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

Foundation C Production-Migrationen:

- `20260822010000_trip_readiness_items`
- `20260822020000_trip_travellers`

Requirements bleiben provider-neutral. Ohne Official Evidence keine erfundene regulatorische Wahrheit.

---

## 5. Abgeschlossen – Foundation D / Route & Transit Intelligence

**Vollständig abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

- PR #34
- Merge-Commit: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- Production-Acceptance: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`
- Fachdokument: `docs/ROUTE_TRANSIT_INTELLIGENCE.md`

Production-Migrationen:

- `20260822130000_reise_anlegen_route_itinerary`
- `20260822140000_flug_route_itinerary_airport_truth`
- `20260822150000_trip_items_route_itinerary_guard`

Route Truth bleibt traveller-neutral, provider-neutral und kanonische Origin-/Transit-Grundlage. Browser-Orts-/Länderfelder dürfen keine Route Truth erfinden.

---

## 6. Abgeschlossen – Foundation E / Traveller Context

**Vollständig abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

- PR #35
- Squash-Merge-Commit: `3bf1eaaa78ef6ac33bb3baff84650a143720e91d`
- Fachdokument: `docs/TRAVELLER_CONTEXT.md`
- Production-Acceptance: `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md`

Production-Migrationen:

- `20260822160000_traveller_context_intelligence`
- `20260822170000_traveller_context_fk_delete`
- `20260822180000_traveller_context_rereview`

Kanonisches Modell:

> **Ein stabiler Traveller → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängig bewertete zulässige Optionen.**

Truth-/Security-Grenzen:

- Child-Tabellen sind kanonische Citizenship-/Document-Truth.
- Guest und Account verwenden dieselbe fachliche Traveller-Form.
- Ausstellerland ist niemals automatisch Staatsbürgerschaft.
- Document↔Citizenship-Zuordnung nur aus expliziter Relation.
- `unknown` bleibt `unknown` ohne belastbare Provider-Evidence.
- keine Passnummern, Scans, MRZ oder Biometrie.

### Neue verbindliche Citizenship-Regel

Policy: `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`

- Citizenship ist beim einfachen Reise-Start **nicht global verpflichtend**.
- Sie wird zur **harten Pflichtvoraussetzung**, sobald eine Official-/Regulatory-Funktion davon abhängt (z. B. Visa, Transit, staatsbürgerschaftsabhängige Health/Vaccination-Anforderungen).
- keine stille Default-Citizenship aus Wohnsitz, Standort, Abflugland, Sprache oder Domain.
- mehrere Citizenship-Optionen pro Traveller bleiben unterstützt.
- fehlen notwendige Fakten: `insufficient_context` / `unknown`, keine erfundene Official-Entscheidung.

---

## 7. Abgeschlossen – Travel Safety & Disruption Intelligence Foundation

**Vollständig technisch Closure/PASS, vom Product Owner freigegeben und auf `main` gemergt. Nicht erneut bauen.**

- PR #37
- finaler PR-Head: `11976ed734b62ec906abd65581f309b1a38362f1`
- gelockter finaler Runtime-Head: `985cae72ef5abac4012c75c739fa00412189ad48`
- Squash-Merge-Commit: `2cceee0658cc426d66974779b525c8bf9a623534`
- Closure-Nachweis: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_CLOSURE.md`
- Fachlogik: `docs/TRAVEL_SAFETY_DISRUPTION.md`
- Acceptance: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ACCEPTANCE.md`

Finaler Qualitätsnachweis:

- 1481/1481 Tests
- Production-Build 38/38
- UI-Audit 886/886, 0 Fehler, WebKit + Chromium / 8 Viewports
- GitHub Actions auf gelocktem Runtime-Head SUCCESS
- Vercel Preview READY/SUCCESS
- vor Merge 0 behind zu `main`
- Vercel auf Squash-Merge-Commit SUCCESS

Architekturgrenzen:

- `lib/safety/` eigene Truth-Domäne
- `safetyProviderAus()` bleibt `null`
- kein Live-Provider / keine Secrets / keine neuen laufenden Providerkosten
- keine Safety-Tabelle
- **keine DB-/Production-Migration erforderlich**
- fail-closed bei unknown/stale/conflict/timeout/malformed/insufficient context
- Route-/Stage-/Transit-/Zeit-/Geo-Relevanz deterministisch und provider-neutral
- keine automatische Reiseänderung
- Seasonal bleibt getrennte Wahrheit

Bekannte spätere Gates: persistentes globales Rate-Limit vor echtem Provider, Account-`tripId`-Serverload, title-only Geo bleibt unknown, minutengenaue lokale Routezeit braucht später belastbare IANA-Zone/UTC-Offset.

---

## 8. Verbindliche Product-Owner-Entscheidungen für den späteren Workspace

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
- Gast: genau eine aktive Reise.
- bei aktiver Gastreise primär `Reise fortsetzen`.
- zweite Reise erfordert Konto oder ausdrückliches Verwerfen/Ersetzen; niemals still überschreiben.
- Multi-Destination ist weiterhin eine Reise.

### Initiale Reiseerstellung vereinfachen

- Reisetempo-Chips entfernen.
- Interessen-Chips aus Initialflow entfernen.
- kein implizites `balanced` als bestätigte Nutzerwahrheit.
- optionaler Freitext `Wünsche & Prioritäten`.
- Hard Facts und Soft Preferences strikt trennen.
- gezielte Rückfragen erst dann, wenn sie eine echte Entscheidung verbessern.

### Trip Workspace ist wichtigste Produktoberfläche

Die Übersicht muss schnell beantworten:

1. Was ist diese Reise?
2. Was ist erledigt?
3. Was fehlt?
4. Gibt es Warnungen/Risiken/offene Entscheidungen?
5. Was empfiehlt Jetnity als Nächstes?

Bevorzugte Hierarchie:

1. Reise-Kopf / Gesamtstatus
2. `Jetzt wichtig`
3. Warnungen / Risiken
4. Fortschritt pro Fachbereich
5. Einreise & persönliche Vorbereitung
6. Tagesplan bei ausreichender Grundlage
7. Wünsche & Prioritäten / Änderungen
8. sekundäre Details progressiv

### Function-by-Function-Generalinspektion

Der spätere große Workspace-Block ist **kein reines Redesign**. Jede bestehende und neue Funktion wird einzeln erneut geprüft auf:

- fachliche Logik / Source of Truth
- Datenfluss / Persistenz / Stale/Unknown/Error
- Security / RLS / Ownership
- Guest/Account
- Cross-Domain-Verhalten
- sequential realistische End-to-End-Szenarien
- Smartphone / Tablet / Laptop / Desktop
- Unit-/Integration-/Regression-/E2E-Nachweis

Frühere grüne Tests oder frühere Merges geben keinen Bestandsschutz. Evidence-Matrix pro Funktion ist Pflicht.

### Geräteparität

> **Gleiche Reise. Gleiche Wahrheit. Gleiche Nutzerkontrolle. Gleich verständlich auf jedem Gerät.**

---

## 9. Nächste verbindliche Reihenfolge

Der nächste neue Entwicklungsblock ist **gestartet**.

1. ✅ Foundation C – Readiness
2. ✅ Foundation D – Route & Transit
3. ✅ Foundation E – Traveller Context inkl. Production
4. ✅ Travel Safety & Disruption – provider-neutrale Foundation
5. **→ Travel Timing & Seasonal Intelligence – provider-neutrale Foundation (Draft PR #38, R9-Fixes + Exact-Head-Gate grün, R10-Re-Review offen)**
6. Provider-Readiness-/Adapter-Lücken schließen
7. großer End-to-End Trip-Workspace-/Übersicht-Umbau inkl. Function-by-Function-Generalinspektion
8. verpflichtender finaler Senior Product / Architecture / UX / Logic / Security / Intelligence Audit
9. echte Providerphase
10. provider-backed End-to-End-/Truth-Audit
11. finale Startseiten-Positionierung / Kommunikation

### Provider-Regel

Echte Provider kommen bewusst später. Vorher müssen provider-neutrale Ports/Adapter-Grenzen professionell fertig sein. Jeder echte Provider braucht separates Kosten-/Vertrags-/Lizenz-/Security-/Privacy-/Secret-/Product-Owner-Gate.

---

## 10. Exakter nächster operativer Schritt

Aktiver Branch: `feat/travel-timing-seasonal-intelligence`  
Draft PR: `#38`  
Basis: `origin/main` @ `cd220beb`  
Runtime-Head: `263c2f84`

1. Ist-Audit ist gegen den tatsächlichen Code verifiziert.
2. Seasonal-Runtime sowie Review-Blocker 1–19 sind geschlossen, inklusive Airport-Change-Origins, Connection-Ownership, Chronologie-Präzision und Readiness-Digest.
3. Full Gate auf Runtime `263c2f84` ist lokal und remote grün (1614/1614 Tests, UI-Audit 1014/1014, Build Exit 0, GitHub Actions SUCCESS, Vercel Preview READY).
4. PR bleibt Draft. Kein echter Seasonal-Provider, kein Secret, keine unfreigegebenen Kosten, kein Merge ohne aktuelle Product-Owner-Freigabe.
5. **Exakter nächster Schritt:** unabhängiger ChatGPT-Re-Review R10 nach Stop-Kriterium.

Live-Status: `docs/ACTIVE_WORK_STATUS.md`.

Leitsatz:

> **Safety ist fertig als akute Truth-Domäne. Seasonal wird als getrennte, evidenzbasierte saisonale Wahrheit gebaut – beide verstehen dieselbe Reise, vermischen ihre Aussagen aber nicht.**
