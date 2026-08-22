# Jetnity – Roadmap

Stand: 22. August 2026  
Status: **operativer Stand nach Abschluss von Foundation C**

Für Entscheidungen zusätzlich lesen:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`

Leitsatz:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

---

## 1. Abgeschlossen / auf `main`

### Produkt- und Qualitätsfundament

- Jetnity V2 Produktvision
- verbindliches Product Mandate: führendes intelligentes Reiseplanungs-/Reisebegleitungsprodukt anstreben
- Product Quality Standard
- Logic Standard
- Continuity Standard
- verbindlicher ChatGPT/Cursor-Workflow
- Mobile-first Design-System und Trip Workspace

### Reise-Kern

- Reiseidee / Trip Builder Foundation
- Trip-Persistenz
- Guest → Account Übernahme
- Trip Workspace
- natürliche Reiseänderung / Revisionslogik
- gemeinsamer Reisegraph
- Booking Status / Coverage

### Reiseprodukte

- Phase 3.1 – Flight Foundation
- Phase 3.2 / 3.2c – Hotel Foundation
- Phase 3.3 / 3.3b / 3.3c – Activities Foundation
- Foundation A – Mobilität & Transfers
- Foundation B – Mietwagen

### Foundation C – Automatic Travel Requirements & Readiness

**Abgeschlossen, gemergt und Production-Schema verifiziert.**

- PR #32 per Squash nach `main`
- Merge-Commit: `b50d2ce9ebc4e50da858f67258f94f887b183f79`
- Production-Migrationen:
  - `20260822010000_trip_readiness_items`
  - `20260822020000_trip_travellers`
- RLS / Owner-Isolation verifiziert
- Vercel Production READY
- Acceptance: `docs/PR32_PRODUCTION_MIGRATION_ACCEPTANCE.md`

Nicht erneut bauen.

---

## 2. Foundation C – nächste Abhängigkeiten, nicht Teil des abgeschlossenen Blocks

### A. Strukturierte Origin-/Transit-Fakten

Status: **offen / wichtig**

Ziel:

- Flight-/Itinerary-Daten sollen strukturierte Origin-/Transit-Ländercodes in den gemeinsamen Reisegraphen liefern.
- `routeFactsAusReise()` wird dadurch mit echter Evidence gespeist.
- Kein Raten aus Ortsnamen.

Nutzen:

- automatische Transit-Requirements
- bessere Reiseänderungslogik
- bessere Mobilitäts-/Connection-Prüfungen
- Grundlage für spätere Timatic-Auswertung.

### B. Echter Travel-Requirements-Provider

Status: **offen / extern**

Bevorzugter aktueller Kandidat: IATA Timatic / Timatic AutoCheck.

Vor Aktivierung zwingend prüfen:

- Preis / Vertragsmodell
- Lizenz und erlaubte Nutzung
- Coverage
- Rate Limits
- Caching-Regeln
- Datenhaltung / Datenschutz
- API-Eigenschaften
- Health-/Vaccination-Abdeckung
- offizielle Source-/Action-Möglichkeiten.

Kein Vertrag und keine laufenden Kosten ohne separate Freigabe.

---

## 3. Extern blockiert / Provider-Zugänge fehlen

### Phase 3.4 – echter Hotelprovider

Status: **WARTET / EXTERN BLOCKIERT**

Bevorzugte Reihenfolge:

1. Booking.com Demand API / Managed Affiliate Partner
2. HBX / Hotelbeds
3. Expedia Rapid später

Keine Fake-Adapter, keine erfundenen Preise oder Verfügbarkeiten.

### Weitere echte Provider

- Flight Production Provider: separat freigeben
- Activities Provider: separat evaluieren/freigeben
- Mobility Provider: separat evaluieren/freigeben
- Rental Car Provider: separat evaluieren/freigeben
- Travel Requirements Provider: separat evaluieren/freigeben

Production-Suchen bleiben bis dahin deaktiviert.

---

## 4. Empfohlene nächste interne Priorität

Solange externe Provider-Zugänge fehlen, bevorzugt ein Block mit hohem Produktwert und ohne Fake-Daten:

### Priorität 1 – Route & Transit Intelligence Foundation

- strukturierte Route-/Transit-Fakten im Reisegraphen
- Flight-/Itinerary-Evidence statt Ortsnamen-Raten
- Auswirkungen auf Readiness, Connections, Mobilität und Reiseänderungen
- keine Provider-Erfindungen

Warum hoch priorisiert:

- schließt eine klare Foundation-C-Lücke
- verbessert mehrere bestehende Domänen gleichzeitig
- erhöht spätere Provider-Readiness
- passt zum Prinzip „eine Reise, eine Wahrheit“.

### Danach mögliche Tracks

- echter Travel-Requirements-Provider, sobald Konditionen vorliegen
- echter Hotelprovider, sobald Zugang vorliegt
- weiterer Trip-Builder-/Workspace-Nutzen mit klarer Zeitersparnis
- gezieltes Security-Hardening bestehender Supabase-Warnungen.

Der nächste konkrete Block wird vor Start gegen Produktmandat, Nutzen, Kosten und aktuelle externe Abhängigkeiten entschieden.

---

## 5. Security-Hardening Track

Status: **offen, nicht durch Foundation C verursacht**

Supabase Security Advisor weist weiterhin auf ältere Punkte hin, insbesondere:

- mehrere `SECURITY DEFINER`-Funktionen, die für `authenticated` ausführbar sind
- GraphQL-Sichtbarkeit verschiedener bestehender Tabellen.

Diese Punkte separat prüfen und priorisieren. Keine pauschalen Berechtigungsänderungen ohne Funktions-/Ownership-Review.

---

## 6. Bewusst nicht priorisiert

Jetnity nicht wieder mit Nebenmodulen aufblasen.

Nicht automatisch weiterbauen:

- Creator Hub
- Creator Feed
- Media Studio
- große Social-Funktionen
- umfangreiche Blogging-/Render-Systeme
- Enterprise-Nebenmodule ohne direkten Produktkern-Nutzen.

Neue Features müssen Reiseplanung/-begleitung klar verbessern, Zeit/Suchaufwand reduzieren, Nutzerbindung aus realem Nutzen erhöhen, Umsatzpotenzial stärken oder technisch für einen Kernbereich notwendig sein.

---

## 7. Production-Grenzen

Bereits auf Production-Schema:

- Booking Status
- Mobility
- Rental Cars
- Travel Readiness / Travellers

Das bedeutet **nicht**, dass externe Provider-Suchen aktiv sind.

Weiterhin keine Production-Aktivierung von Provider-Suchen, Secrets oder kostenpflichtigen Integrationen ohne die dokumentierte Freigabe.

---

## 8. Definition für den nächsten Agenten

Vor dem nächsten größeren Arbeitsblock:

1. `JETNITY_PRODUCT_MANDATE.md` lesen.
2. `JETNITY_VISION.md` lesen.
3. `JETNITY_HANDOFF.md` lesen.
4. diese Roadmap lesen.
5. aktuellen Git-/CI-/Vercel-/Supabase-Stand prüfen.
6. relevante Fach-/ADR-/Logic-Dokumente lesen.
7. vollständigen Cursor-Task im neuen Feature-Branch hinterlegen.

Kein abgeschlossener Block darf unnötig neu gebaut werden.