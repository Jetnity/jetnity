# Jetnity – Handoff und nächste Schritte

Stand: 22. August 2026  
Status: **verbindlicher operativer Übergabepunkt nach Abschluss von Foundation C**

Dieser Handoff ist bewusst kompakt. Ein neuer Chat oder Coding Agent muss zuerst die dauerhaften Projektquellen lesen und anschließend den realen Git-/CI-/Preview-/Production-Stand prüfen.

Pflichtlektüre:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `DESIGN_SYSTEM.md`
- `AGENTS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- relevante Fach-Dokumente unter `docs/`

Wenn Erinnerung, Chat und Repository widersprechen: **nicht raten**, sondern aktuellen technischen Stand verifizieren.

---

## 1. Produktmandat

Jetnity soll zum **führenden intelligenten Reiseplanungs- und Reisebegleitungsprodukt seiner Kategorie** entwickelt werden.

Das bedeutet verbindlich:

- außergewöhnlich einfache Nutzererfahrung
- moderne, sinnvolle Top-Web-Technologie
- erstklassige, wartbare Architektur
- hohe Security- und Datenschutzqualität
- starke Performance und Mobile-Qualität
- belastbare Datenwahrheit statt plausibler Erfindungen
- ein zusammenhängender Reisegraph statt isolierter Suchmaschinen
- so viel Suchaufwand, Doppelarbeit, Entscheidungsstress und organisatorische Reibung wie sinnvoll abnehmen
- keine Feature-Sammlung ohne klaren Nutzer- oder Umsatznutzen

Leitsätze:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

> **Jetnity soll die Nummer 1 werden, weil es Reisen einfacher, intelligenter, verlässlicher und ganzheitlicher macht.**

Das ist ein Entwicklungsziel, keine heutige Marktbehauptung.

---

## 2. Rollen / Arbeitsweise

- **Product Owner / Nutzer:** verbindliche Produktentscheidungen und Freigaben.
- **ChatGPT:** Produkt-, Architektur-, Logic-, Security-, Kosten- und Review-Steuerung; prüft Repository/Supabase/Vercel unabhängig.
- **Cursor:** ausführender Hauptentwickler für größere Implementierungsblöcke nach versioniertem `docs/CURSOR_...TASK.md`.
- **GitHub:** dauerhaftes gemeinsames Gedächtnis / technische Source of Truth.

Neue Produktentscheidungen dürfen nicht nur im Chat bleiben. Nach größeren Phasen müssen Handoff, Roadmap und Fach-/Acceptance-Dokumente aktualisiert sein.

---

## 3. Aktueller `main`-Stand

Foundation C / PR #32 ist abgeschlossen.

- PR #32: `Foundation C – Travel Readiness & Dokumente`
- finaler PR-Head vor Merge: `a5099b98c9456ce07c9b12443d5540843ef8f669`
- Squash-Merge nach `main`: `b50d2ce9ebc4e50da858f67258f94f887b183f79`
- Production-Acceptance-Doku danach: `docs/PR32_PRODUCTION_MIGRATION_ACCEPTANCE.md`
- Vercel Production-Deployment des Merge-Commits: **READY**

Bereits auf `main` abgeschlossen:

- Phase 3.1 – Flight Foundation
- Phase 3.2 / 3.2c – Hotel Foundation
- Phase 3.3 / 3.3b / 3.3c – Activities Foundation
- Trip Workspace Mobile UX Iterationen
- Trip Coverage & Booking Status
- Foundation A – Mobilität & Transfers
- Foundation B – Mietwagen
- Foundation C – Automatic Travel Requirements & Readiness
- Produktqualitäts-, Logic- und Kontinuitätsstandards
- verbindlicher ChatGPT/Cursor-Workflow
- verbindliches Jetnity Product Mandate

Stabile öffentliche Production-URL:

`https://jetnity-app.vercel.app`

---

## 4. Foundation C – abgeschlossen

Jetnity besitzt jetzt den technischen und fachlichen Unterbau für **Automatic Travel Requirements & Readiness**.

Umgesetzt:

- `trip_readiness_items` als eigene User-Readiness-Domäne
- `trip_travellers` / `Trip.party` für individuellen, trip-spezifischen Traveller Context
- Guest-/Account-Parität und idempotente Übernahme
- UI-Bereich **Einreise & Reisevorbereitung** im Trip Workspace, kein sechster Haupt-Tab
- provider-neutrale Travel Requirements Engine
- async Provider-Port
- kanonische `evaluations[]`-Official-Truth
- strikte Trennung Official Requirement Truth vs User Readiness
- `unknown` bleibt `unknown`
- progressive `missingFacts`
- Context Fingerprint / stale / recheck / freshness
- Multi-Transit-Vollständigkeit
- Evidence-Trust-/Validity-Grenzen
- sichere Official Actions nur bei validierter HTTPS-Evidence
- Requirement-Typen für Visa, ETA/eTA/ESTA, Pass, ID, Passgültigkeit, Transit, Health, Vaccination, Health Documents, Entry Forms, Insurance, Return/Onward Ticket, Booking Documents und weitere Anforderungen
- keine regulatorischen Aussagen aus LLM-Text
- kein Dokumententresor / keine OCR / keine Dokumentnummern / keine Gesundheitsakte

Qualitätsnachweis des finalen Foundation-C-Standes vor Merge:

- `npm test`: **1252/1252**
- Typecheck / Lint / Hygiene / Auth-Konfiguration / Production-Build grün
- Trip-Workspace-Audit WebKit + Chromium: **678 Kombinationen, 0 Fehler**
- Activities-Regression: **184 Kombinationen, 0 Fehler**
- GitHub CI grün
- Vercel Preview READY

Fachdoku:

- `docs/TRAVEL_READINESS.md`
- `docs/PR32_PRODUCTION_MIGRATION_ACCEPTANCE.md`
- relevante ADRs in `DECISIONS.md`

Foundation C **nicht erneut bauen**.

---

## 5. Supabase Production nach Foundation C

Production-Projekt:

`qscbgcdmivbbnzrcyegn` (`eu-central-2`)

Development:

`yfvbxvijcorffwxbxahl`

Neu auf Production und verifiziert:

- `20260822010000_trip_readiness_items`
- `20260822020000_trip_travellers`

Beide Tabellen:

- RLS aktiv
- SELECT/INSERT/UPDATE/DELETE nur für `authenticated`
- Policies auf `user_id = auth.uid()` begrenzt
- `anon` / `public` ohne Tabellenrechte

Security Advisor wurde nach DDL erneut geprüft. Die neuen Tabellen erhalten den generischen GraphQL-Hinweis für `authenticated`, weil SELECT besteht; die Zeilen bleiben durch RLS geschützt. Ältere Security-Advisor-Warnungen bei anderen Tabellen / `SECURITY DEFINER`-Funktionen bleiben als separater Hardening-Track offen.

---

## 6. Was Foundation C noch bewusst nicht kann

Die Architektur ist vorhanden, aber folgende externe/strukturelle Abhängigkeiten fehlen noch:

### Echter Travel-Requirements-Provider

Noch **kein** Timatic-/Visa-/Health-Provider aktiviert.

Daher gilt produktiv weiterhin:

- keine erfundenen Visa-Aussagen
- keine erfundenen Impf-/Health-Aussagen
- keine erfundenen Pass-/Transit-Aussagen
- Official Truth bleibt ohne belastbare Evidence `unknown` / `provider_unavailable` / `insufficient_context`

Aktuell bevorzugter Kandidat: **IATA Timatic / Timatic AutoCheck**, aber keine Architekturbindung und kein Vertrag ohne separate Kosten-/Lizenzprüfung.

### Strukturierte Origin-/Transit-Fakten

`routeFactsAusReise()` ist vorbereitet, liefert aktuell bewusst `quelle: 'none'`.

Jetnity rät nicht aus Ortsnamen wie „Doha“ automatisch ein Land. Origin-/Transit-Ländercodes müssen später aus strukturierten Flight-/Itinerary-Daten kommen.

---

## 7. Provider-Suchen / externe Blocker

Production-Suchen bleiben weiterhin deaktiviert, bis echte Provider-Zugänge und separate Freigaben vorhanden sind.

Insbesondere:

- Flights: Foundation vorhanden, Production-Provider nicht einfach aktivieren
- Hotels: Phase 3.4 echter Hotelprovider weiterhin extern blockiert
- Activities: Foundation vorhanden, echter Provider separat
- Mobility: Suche deaktiviert
- Rental Cars: Suche deaktiviert
- Travel Requirements: kein echter Provider

Phase 3.4 Hotelprovider bleibt bevorzugt:

1. Booking.com Demand API / Managed Affiliate Partner, wenn echter Zugang vorhanden
2. HBX / Hotelbeds als Backup
3. Expedia Rapid späterer Kandidat

Keine Fake-Adapter, keine erfundenen Preise/Verfügbarkeiten.

---

## 8. Offene Security-Arbeit

Supabase Security Advisor zeigt ältere, nicht durch Foundation C eingeführte Warnungen u. a. bei einigen `SECURITY DEFINER`-Funktionen und GraphQL-Sichtbarkeit bestehender Tabellen.

Das ist **kein Foundation-C-Blocker**, aber ein sinnvoller eigener Security-Hardening-Track und darf langfristig nicht vergessen werden.

---

## 9. Nächster Arbeitsblock

Vor dem nächsten größeren Cursor-Job zuerst `ROADMAP.md` und den aktuellen Markt-/Provider-Blocker prüfen.

Empfohlene nächste Richtung:

1. **Strukturierte Route-/Transit-Fakten sauber in den gemeinsamen Reisegraphen integrieren**, damit Foundation C Transit automatisch aus echten Flight-/Itinerary-Daten speisen kann, und/oder
2. **echten Travel-Requirements-Provider wirtschaftlich und technisch evaluieren** (Timatic bevorzugter Kandidat), ohne Vertrag vor Preis-/Lizenz-/Datenschutzprüfung, und/oder
3. einen anderen provider-unabhängigen Kernblock aus der Roadmap priorisieren, solange externe Providerzugänge fehlen.

Nicht einfach einen Provider oder neuen Produktbereich aktivieren, ohne den aktuellen Stand und Kosten zu prüfen.

---

## 10. Neustart in neuem Chat / Agent

Ein neuer Chat soll mit folgendem Satz übernehmen können:

> „Wir machen mit Jetnity weiter. Lies den Handoff und den aktuellen Repository-/Production-Stand.“

Dann zuerst diese Datei plus Produktmandat, Vision, Roadmap, Logic-/Continuity-/Workflow-Standards lesen und erst danach neue Arbeit planen.

Der Nutzer soll Jetnity, frühere Entscheidungen oder abgeschlossene Foundations nicht erneut erklären müssen.