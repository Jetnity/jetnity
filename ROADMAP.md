# Jetnity – Roadmap

Stand: 22. August 2026  
Status: **Foundation D – Route & Transit Intelligence aktiv**

Für Entscheidungen zusätzlich lesen:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`

Leitsätze:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

---

## 1. Abgeschlossen / auf `main`

### Produkt- und Qualitätsfundament

- Jetnity V2 Produktvision
- verbindliches Product Mandate: führendes intelligentes Reiseplanungs-/Reisebegleitungsprodukt anstreben
- Product Quality Standard
- **websiteweiter UX & Informationsarchitektur Standard**
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

## 2. Aktiv – Foundation D: Route & Transit Intelligence

Status: **UMGESETZT AUF DRAFT-PR #34 / NICHT GEMERGT**

- Branch: `feat/route-transit-intelligence`
- Task: `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md`
- Fachdokument: `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- Acceptance: `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md`
- verbindlicher UX-Standard: `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- Merge erst nach finalem Human-/Architecture-/Truth-Re-Review und ausdrücklicher Product-Owner-Freigabe
- Round-4-Metadata-Guard (ADR-0116) liegt auf Development; Production unverändert

### Ziel

Jetnity erhält eine belastbare, provider-neutrale Route Truth für:

- Origin
- Destination
- geordnete Flug-/Itinerary-Segmente
- Transit-/Connection-Punkte
- Airport-/Place- und Country-Kontext
- Connection Duration, wenn aus echten Zeiten ableitbar
- Evidence / Source
- Änderungs-/Revisionsbezug

Kein Raten aus Ortsnamen.

### Produktwirkung

**Flüge**

- Route und Umstiege verständlich sichtbar
- Direktflug einfacher als Multi-Segment-Verbindung
- technische Providerdaten werden in menschlich lesbare Reiseinformation übersetzt

**Einreise & Reisevorbereitung**

- Foundation C erhält echte strukturierte Origin-/Transit-Ländercodes
- Multi-Transit bleibt vollständig
- Transitänderung löst korrekt stale/recheck aus

**Mobilität / Connections**

- spätere Transfer-, Airport-Change- und Connection-Logik kann dieselbe Route Truth verwenden

**Reiseänderungen**

- Änderungen wie `ZRH → DOH → BKK` zu `ZRH → SIN → BKK` werden als echte Kontextänderung verstanden

### UX-Verbindlichkeit

Foundation D ist gleichzeitig der erste aktive Block unter dem neuen websiteweiten UX-/Informationsarchitektur-Standard.

Alle betroffenen Oberflächen müssen:

- sofort Orientierung geben
- klare visuelle Priorität haben
- Status verständlich zeigen
- einen nächsten sinnvollen Schritt erkennen lassen
- Details progressiv öffnen
- Mobile und Desktop logisch gleich behandeln
- Cross-Domain-Auswirkungen verständlich statt redundant darstellen

Ein technisch grüner PR ist nicht ausreichend, wenn die Oberfläche kognitiv unnötig belastet.

### Harte Grenzen

- PR #34 bleibt Draft bis Human-/Architecture-Review
- nicht mergen
- keine Production-Migration
- kein echter Flight-/Requirements-Provider
- kein Timatic-Vertrag
- keine Secrets
- keine Fake-Routen, Transitländer oder Zeiten
- bestehende Foundations nicht neu bauen

---

## 3. Danach – Traveller Context & Multi-Citizenship

Status: **VERBINDLICHE NÄCHSTE INTERNE PRIORITÄT NACH FOUNDATION D**

Product-Owner-Entscheidung vom 22.08.2026: Nach Abschluss von Foundation D wird als nächster Kernblock **Traveller Context / Multi-Citizenship / Multi-Document** umgesetzt, bevor ein echter Travel-Requirements-Provider produktiv aktiviert wird.

### Ziel

Jetnity muss einen Reisenden fachlich korrekt mit mehreren rechtlich relevanten Kontexten modellieren können, insbesondere:

- mehrere Staatsbürgerschaften
- mehrere Reisedokumente / Pässe
- Wohnsitzkontext, wenn relevant
- ausstellendes Land / Dokumenttyp / Gültigkeit nur soweit fachlich nötig
- mehrere rechtlich zulässige Einreise-/Transitoptionen

Grundmodell:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängige zulässige Optionen.**

Keine Passnummern, Scans, biometrischen Daten oder unnötige sensible Daten speichern.

### Verbindliche Produktlogik

Wo Traveller-Kontext ein Ergebnis ändern kann, darf Jetnity nicht still nur eine einzelne Staatsbürgerschaft oder einen einzelnen Pass als universelle Dauerannahme verwenden.

Jetnity muss zuerst gesetzliche Pflichten respektieren und danach belegbare Vorteile zwischen zulässigen Optionen vergleichen können, z. B.:

- visumfrei statt Visum
- ETA/eVisa statt klassischem Visum
- bessere Transitbedingungen
- zulässige Aufenthaltsdauer
- erforderliche Dokumente
- andere belegte Einreise-/Reisevorteile

Diese Traveller Context Intelligence ist nicht nur für Readiness gedacht, sondern muss von jeder relevanten zukünftigen Funktion berücksichtigt werden, wenn der Traveller-Kontext das Ergebnis verändern kann.

### UX

Der Nutzer soll nicht mit allen Varianten überlastet werden. Jetnity zeigt bevorzugt:

- zwingende Option, falls rechtlich vorgeschrieben
- sonst beste belegbare zulässige Option
- kurze Begründung
- Alternativen progressiv aufklappbar
- `unknown` / „noch nicht zuverlässig vergleichbar“, wenn die Datenlage nicht reicht

Verbindliche Grundlagen:

- `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md`
- `docs/MULTI_CITIZENSHIP_READINESS_AMENDMENT.md`

---

## 4. Danach – echter Travel-Requirements-Provider

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
- offizielle Source-/Action-Möglichkeiten

Kein Vertrag und keine laufenden Kosten ohne separate Freigabe.

Traveller Context / Multi-Citizenship muss vorher als belastbare Grundlage existieren.

---

## 5. Extern blockiert / Provider-Zugänge fehlen

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

## 6. Security-Hardening Track

Status: **offen, nicht durch Foundation C/D verursacht**

Supabase Security Advisor weist weiterhin auf ältere Punkte hin, insbesondere:

- mehrere `SECURITY DEFINER`-Funktionen, die für `authenticated` ausführbar sind
- GraphQL-Sichtbarkeit verschiedener bestehender Tabellen

Diese Punkte separat prüfen und priorisieren. Keine pauschalen Berechtigungsänderungen ohne Funktions-/Ownership-Review.

---

## 7. Bewusst nicht priorisiert

Jetnity nicht wieder mit Nebenmodulen aufblasen.

Nicht automatisch weiterbauen:

- Creator Hub
- Creator Feed
- Media Studio
- große Social-Funktionen
- umfangreiche Blogging-/Render-Systeme
- Enterprise-Nebenmodule ohne direkten Produktkern-Nutzen

Neue Features müssen Reiseplanung/-begleitung klar verbessern, Zeit/Suchaufwand reduzieren, Nutzerbindung aus realem Nutzen erhöhen, Umsatzpotenzial stärken oder technisch für einen Kernbereich notwendig sein.

---

## 8. Production-Grenzen

Bereits auf Production-Schema:

- Booking Status
- Mobility
- Rental Cars
- Travel Readiness / Travellers

Das bedeutet **nicht**, dass externe Provider-Suchen aktiv sind.

Foundation D darf bis zur separaten Freigabe keine Production-Schemaänderung ausrollen.

Weiterhin keine Production-Aktivierung von Provider-Suchen, Secrets oder kostenpflichtigen Integrationen ohne dokumentierte Freigabe.

---

## 9. Definition für den nächsten Agenten

Solange PR #34 offen ist:

1. `JETNITY_PRODUCT_MANDATE.md` lesen.
2. `JETNITY_VISION.md` lesen.
3. `JETNITY_HANDOFF.md` lesen.
4. diese Roadmap lesen.
5. `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md` lesen.
6. `docs/ROUTE_TRANSIT_INTELLIGENCE.md` und `docs/PR34_ROUTE_TRANSIT_ACCEPTANCE.md` lesen.
7. `docs/CURSOR_ROUTE_TRANSIT_INTELLIGENCE_TASK.md` vollständig lesen.
8. `docs/ACTIVE_WORK_STATUS.md` und `docs/CURSOR_PR34_HUMAN_REVIEW_ROUND4.md` lesen, dann aktuellen PR #34 / Git-/CI-/Vercel-/Supabase-Stand prüfen.
9. relevante Flight-/Trip-/Mobility-/Readiness-/Change-Dokumente lesen.
10. nicht mergen, nicht Mark Ready, keine Production-Migration.
11. bestehende Arbeit synchronisieren und fortsetzen statt neu anzufangen.
12. Nach Foundation D ist Traveller Context / Multi-Citizenship die verbindliche nächste interne Priorität.

Kein abgeschlossener Block darf unnötig neu gebaut werden.