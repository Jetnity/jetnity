# Jetnity – Handoff und nächste Schritte

Stand: 22. August 2026  
Status: **verbindlicher operativer Übergabepunkt – Foundation D aktiv**

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
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/CHATGPT_CURSOR_WORKFLOW.md`
- `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
- relevante Fach-Dokumente unter `docs/`

Wenn Erinnerung, Chat und Repository widersprechen: **nicht raten**, sondern aktuellen technischen Stand verifizieren.

Verbindliche Kontinuitätsregel:

> **Kein relevanter Fortschritt darf beim Wechsel von Chat, Agent oder Sitzung verloren gehen. Was für die Fortsetzung wichtig ist, gehört ins Repository.**

Bei einem aktiven größeren Arbeitsblock muss zusätzlich `docs/ACTIVE_WORK_STATUS.md` im Feature-Branch gelesen und aktuell gehalten werden.

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
- traveller-spezifische Funktionen müssen relevante Mehrfachkontexte wie mehrere Staatsbürgerschaften oder Reisedokumente korrekt berücksichtigen, wenn diese das Ergebnis verändern können

Leitsätze:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

> **Jetnity soll die Nummer 1 werden, weil es Reisen einfacher, intelligenter, verlässlicher und ganzheitlicher macht.**

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

> **Wo Traveller-Kontext das Ergebnis ändern kann, prüft Jetnity die relevanten zulässigen Optionen individuell und evidenzbasiert.**

Das ist ein Entwicklungsziel, keine heutige Marktbehauptung.

---

## 2. Rollen / Arbeitsweise

- **Product Owner / Nutzer:** verbindliche Produktentscheidungen und Freigaben; kein Merge ohne ausdrückliche aktuelle Freigabe.
- **ChatGPT:** Produkt-, Architektur-, Logic-, Security-, Kosten- und Review-Steuerung; prüft Repository/Supabase/Vercel unabhängig und sichert relevante Fortschritts-Checkpoints dauerhaft.
- **Cursor:** ausführender Hauptentwickler für größere Implementierungsblöcke nach versioniertem `docs/CURSOR_...TASK.md`; hält während aktiver Arbeit `docs/ACTIVE_WORK_STATUS.md` aktuell.
- **GitHub:** dauerhaftes gemeinsames Gedächtnis / technische Source of Truth.

Neue Produktentscheidungen, relevante Implementierungsmeilensteine, Blocker, Review-Funde, Test-/CI-/Preview-Stände, DB-/Production-Grenzen und der exakte nächste Schritt dürfen nicht nur im Chat oder Agentenkontext bleiben.

Für jede neue oder geänderte relevante Funktion ist zusätzlich die Traveller-Context-Relevanz nach `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md` zu prüfen. Keine neue Funktion darf still eine einzelne Staatsbürgerschaft oder ein einzelnes Dokument als universelle Dauerannahme verhärten, wenn fachlich mehrere Optionen das Ergebnis verändern können.

---

## 3. Aktueller `main`-Stand

Foundation C / PR #32 ist abgeschlossen.

- PR #32: `Foundation C – Travel Readiness & Dokumente`
- finaler PR-Head vor Merge: `a5099b98c9456ce07c9b12443d5540843ef8f669`
- Squash-Merge nach `main`: `b50d2ce9ebc4e50da858f67258f94f887b183f79`
- Production-Acceptance: `docs/PR32_PRODUCTION_MIGRATION_ACCEPTANCE.md`
- Vercel Production: **READY**

Bereits auf `main` abgeschlossen / verbindlich:

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
- verbindlicher websiteweiter `UX_INFORMATION_ARCHITECTURE_STANDARD`
- verbindliche `TRAVELLER_CONTEXT_INTELLIGENCE_POLICY`
- verbindliche Product-Owner-Merge-Approval-Policy
- verbindliche Project-Progress-Persistence-Policy

Stabile öffentliche Production-URL:

`https://jetnity-app.vercel.app`

---

## 4. Foundation C – abgeschlossen

Jetnity besitzt den technischen und fachlichen Unterbau für **Automatic Travel Requirements & Readiness**.

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

Foundation C **nicht erneut bauen**.

Wichtige spätere Erweiterung: Foundation C modelliert aktuell noch singuläre Traveller-Felder. Mehrfachstaatsbürgerschaften / mehrere Reisedokumente sind inzwischen verbindlich als zukünftiger 1:n-Traveller-Context beschlossen und müssen vor produktiver Requirements-Provider-Aktivierung separat umgesetzt und reviewed werden. Die bestehende Singularität ist kein langfristiges Architekturmandat.

---

## 5. Supabase Production nach Foundation C

Production-Projekt:

`qscbgcdmivbbnzrcyegn` (`eu-central-2`)

Development:

`yfvbxvijcorffwxbxahl`

Auf Production und verifiziert:

- `20260822010000_trip_readiness_items`
- `20260822020000_trip_travellers`

Beide Tabellen:

- RLS aktiv
- SELECT/INSERT/UPDATE/DELETE nur für `authenticated`
- Policies auf `user_id = auth.uid()` begrenzt
- `anon` / `public` ohne Tabellenrechte

Ältere Security-Advisor-Warnungen bei anderen Tabellen / `SECURITY DEFINER`-Funktionen bleiben als separater Hardening-Track offen.

---

## 6. Foundation C – externe/strukturelle Abhängigkeiten

### Echter Travel-Requirements-Provider

Noch **kein** Timatic-/Visa-/Health-Provider aktiviert.

Daher produktiv weiterhin keine erfundenen Visa-, Impf-/Health-, Pass- oder Transit-Aussagen. Official Truth bleibt ohne belastbare Evidence `unknown` / `provider_unavailable` / `insufficient_context`.

Aktuell bevorzugter Kandidat: **IATA Timatic / Timatic AutoCheck**, aber keine Architekturbindung und kein Vertrag ohne separate Kosten-/Lizenzprüfung.

Vor produktiver Provider-Aktivierung muss zusätzlich die 1:n-Unterstützung für mehrere Staatsbürgerschaften / Credential-Profile fachlich, technisch und providerseitig geklärt und umgesetzt sein.

### Strukturierte Origin-/Transit-Fakten

Diese Lücke wird jetzt mit Foundation D bearbeitet.

---

## 7. Aktiver Arbeitsblock – Foundation D

**Foundation D – Route & Transit Intelligence** ist gestartet.

- Branch: `feat/route-transit-intelligence`
- Draft PR: **#34**
- verbindlicher Task: `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`
- aktiver Live-Handoff im Branch: `docs/ACTIVE_WORK_STATUS.md`
- websiteweiter UX-/IA-Standard: `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- globaler Traveller-Context-Standard: `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- Progress-Persistence-Policy: `docs/PROJECT_PROGRESS_PERSISTENCE_POLICY.md`
- Merge-Gate: `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`

Ziel:

- strukturierte Route-/Transit-Fakten im gemeinsamen Reisegraphen
- Flight-/Itinerary-Evidence statt Ortsnamen-Raten
- Origin, Destination, Segmente und Multi-Transit belastbar ableiten
- Foundation C automatisch mit echter Route-/Transit-Struktur speisen
- Route im Flugbereich verständlich sichtbar machen
- Reiseänderungen auf Transit-/Readiness-Auswirkungen prüfen
- Mobility/Connections auf dieselbe Route Truth vorbereiten
- Route Truth traveller-neutral halten, damit dieselbe Route später gegen mehrere Traveller-/Credential-Profile ausgewertet werden kann

Produkt-/UX-Regel:

> **Der Nutzer sieht die Reise – nicht die Komplexität des Datenmodells dahinter.**

Der websiteweite Standard ist verbindlich: Alle Besucherbereiche müssen psychologisch ruhig, logisch eindeutig und visuell priorisiert sein. Ein technisch grüner PR reicht nicht, wenn Nutzer unnötig suchen, denken oder Informationen zusammensetzen müssen.

Harte Grenzen für PR #34:

- Draft bis Human-/Architecture-Review und Product-Owner-Entscheidung
- **kein Merge ohne ausdrückliche aktuelle Nutzerfreigabe**
- keine Production-Migration
- kein echter Flight-/Requirements-Provider
- kein Timatic-Vertrag
- keine Secrets
- keine Fake-Routen/Transitländer/Zeiten

Aktueller operative Stand innerhalb des Branches darf nicht aus diesem Handoff allein geraten werden: **immer `docs/ACTIVE_WORK_STATUS.md` + PR/Head prüfen**.

---

## 8. Provider-Suchen / externe Blocker

Production-Suchen bleiben deaktiviert, bis echte Provider-Zugänge und separate Freigaben vorhanden sind.

- Flights: Foundation vorhanden, Production-Provider separat
- Hotels: Phase 3.4 echter Hotelprovider extern blockiert
- Activities: Foundation vorhanden, echter Provider separat
- Mobility: Suche deaktiviert
- Rental Cars: Suche deaktiviert
- Travel Requirements: kein echter Provider

Hotelprovider bevorzugt:

1. Booking.com Demand API / Managed Affiliate Partner
2. HBX / Hotelbeds
3. Expedia Rapid später

Keine Fake-Adapter, keine erfundenen Preise/Verfügbarkeiten.

---

## 9. Offene Security-Arbeit

Supabase Security Advisor zeigt ältere, nicht durch Foundation C eingeführte Warnungen u. a. bei einigen `SECURITY DEFINER`-Funktionen und GraphQL-Sichtbarkeit bestehender Tabellen.

Das ist kein Foundation-D-Scope, außer eine Änderung berührt diese Bereiche direkt. Der Hardening-Track bleibt sichtbar.

---

## 10. Neustart in neuem Chat / Agent

Ein neuer Chat soll mit folgendem Satz übernehmen können:

> „Wir machen mit Jetnity weiter. Lies den Handoff und den aktuellen Repository-/Production-Stand.“

Dann zuerst diese Datei plus Produktmandat, Vision, Roadmap, UX-/Traveller-Context-/Logic-/Continuity-/Workflow-/Progress-/Merge-Standards lesen, **PR #34 und dessen tatsächlichen Head prüfen**, im Feature-Branch `docs/ACTIVE_WORK_STATUS.md` lesen und erst danach neue Arbeit planen.

Ein neuer Cursor-Agent liest zusätzlich den aktuellen Cursor-Task und alle neueren Amendments/Review-Aufträge.

Der Nutzer soll Jetnity, frühere Entscheidungen, abgeschlossene Foundations oder den letzten Arbeitsfortschritt **nicht erneut erklären müssen**.
