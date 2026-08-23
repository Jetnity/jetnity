# Jetnity – Roadmap

Stand: 22. August 2026  
Status: **Foundation E auf `main` gemergt; Production-Migration offen**

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

## 2. Abgeschlossen – Foundation D: Route & Transit Intelligence

Status: **GEMERGT, AUF `main` UND PRODUCTION VERIFIZIERT**

Nicht erneut bauen.

- PR #34 gemergt
- Fachdokument: `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- Acceptance: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`
- Route Truth bleibt traveller-neutral und die einzige Origin-/Transit-Quelle

---

## 2b. Abgeschlossen auf `main` – Foundation E: Traveller Context / Multi-Citizenship / Multi-Document

Status: **GEMERGT AUF `main` / DEVELOPMENT VERIFIZIERT / PRODUCTION-MIGRATION OFFEN**

- PR #35: **MERGED** – https://github.com/Jetnity/jetnity/pull/35
- Merge-Commit: `3bf1eaaa78ef6ac33bb3baff84650a143720e91d`
- Task: `docs/CURSOR_FOUNDATION_E_TRAVELLER_CONTEXT_TASK.md`
- Fachdokument: `docs/TRAVELLER_CONTEXT.md`
- Acceptance: `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md`
- Audit: `docs/FOUNDATION_E_ARCHITECTURE_AUDIT.md`
- Development-Migrationen `20260822160000`–`20260822180000`; Production endet bei `20260822150000`
- Unabhängiger Closure-Check **PASS**

### Harte Grenzen

- Production-Migration nur nach ausdrücklicher Product-Owner-Freigabe
- keine Production-Migration ohne diese Freigabe
- kein echter Requirements-Provider
- kein Timatic-Vertrag
- keine Secrets oder neuen laufenden Kosten
- keine Passnummern, Scans, MRZ oder Biometrie
- `unknown` bleibt `unknown`

---

## 3. Foundation E – Ziel und Produktlogik

Status: **AUF `main` GEMERGT; PRODUCTION-MIGRATION OFFEN; DANACH SAFETY-FOUNDATION, NICHT DER PROVIDER**

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

## 5. Verbindliche spätere Produktfähigkeit – Travel Safety, Disruption & Seasonal Timing Intelligence

Status: **PRODUKTENTSCHEIDUNG VERBINDLICH / IMPLEMENTIERUNG NOCH NICHT TERMINIERT**

Product-Owner-Entscheidungen vom 22.08.2026: Jetnity soll sowohl akute Sicherheits-/Störungsereignisse als auch erhebliche saisonale Reisezeit-Nachteile erkennen können, wenn diese eine konkrete geplante oder laufende Reise betreffen.

### Travel Safety & Disruption

Beispiele:

- Krieg / bewaffneter Konflikt
- schwere politische Unruhen
- Erdbeben / Tsunami / Vulkanaktivität
- Hochwasser / Waldbrände / Wirbelstürme
- weitere erhebliche, belastbar belegte Reisebeeinträchtigungen

Verbindlich:

- keine pauschale Alarmierung ohne konkreten Reisebezug
- Safety-/Disruption-Truth nur aus belastbarer aktueller Evidence, nicht aus LLM-Erfindung
- räumliche und zeitliche Relevanz zur konkreten Etappe/Route prüfen
- kritische Warnung, wichtiger Hinweis und Information semantisch trennen
- Warnungen in der Workspace-Übersicht intelligent priorisieren
- relevante Cross-Domain-Auswirkungen auf Route, Flug, Unterkunft, Aktivitäten, Mobilität, Tagesplan und Readiness erkennen
- keine automatische Änderung der Reise ohne ausdrückliche Nutzerfreigabe
- stale/unknown korrekt behandeln

### Travel Timing & Seasonal Intelligence

Jetnity soll zusätzlich erkennen können, wenn ein gewählter Zeitraum typischerweise deutlich ungünstiger für ein konkretes Ziel oder eine Etappe ist, z. B.:

- Monsun-/starke Regenzeit
- Hurrikan-/Taifun-/Zyklonsaison
- starke Hitze-/Kälteperioden
- Waldbrand-/Rauchsaison
- saisonale Hochwasser-/Starkregenphasen
- relevante Schnee-/Lawinenbedingungen
- saisonale Erreichbarkeits-/Schließzeiten

Verbindlich:

- saisonale Muster nicht mit einer akuten Warnung verwechseln
- keine pauschale Behauptung `schlechteste Saison` ohne belastbare Kriterien
- Region + konkrete Reisedaten berücksichtigen, soweit Daten verfügbar sind
- historische/klimatologische Muster als typische Wahrscheinlichkeit behandeln, nicht als exakte Vorhersage
- dem Nutzer erklären, was dies für seine konkrete Reise bedeuten kann
- alternative Reisezeiten und Auswirkungen nur vorschlagen, nicht erzwingen
- `Trotzdem so planen` muss eine legitime Nutzerentscheidung bleiben
- bei Übergang in einen kurzfristigen Prognose-/Warnhorizont aktuelle Safety-/Forecast-Daten neu bewerten

Verbindliche Fachregeln:

- `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`
- `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`

Diese Fähigkeiten werden **nicht** als Schnelllösung in Foundation D eingebaut und ändern die verbindliche unmittelbare Priorität Foundation E nicht. Die konkrete Implementierungsphase wird separat geplant und muss in die gemeinsame Reise-Wahrheit und Workspace-Priorisierung integriert werden.

---

## 6. Verbindliche spätere Abschlussphase – finale Startseiten-Positionierung

Status: **PRODUKTENTSCHEIDUNG VERBINDLICH / NACH INTEGRATION DES KERNPRODUKTS**

Wenn die komplette Jetnity-Website bzw. die zentralen Produktfähigkeiten in der vorgesehenen Ausbaustufe umgesetzt, integriert und geprüft sind, wird die öffentliche Startseite nochmals grundlegend optimiert.

Ziel: Jeder erstmalige Besucher soll innerhalb weniger Sekunden verstehen:

- was Jetnity ist
- welches Problem Jetnity löst
- was Jetnity konkret kann
- was Jetnity von üblichen Reiseplanern, Vergleichsportalen und isolierten Suchmaschinen unterscheidet
- warum die Reise als zusammenhängendes System behandelt wird
- wie der Besucher sofort mit seiner eigenen Reise anfangen kann

Die finale Startseite darf keine Feature-Wand werden. Sie muss die tatsächliche Produktleistung ruhig, glaubwürdig und differenziert erklären und nur Fähigkeiten als vorhanden darstellen, die zu diesem Zeitpunkt tatsächlich verfügbar sind.

Verbindliche Fachregel:

- `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`

Diese finale Kommunikations-/Positionierungsphase wird bewusst **nach** der Kernprodukt- und Workspace-Integration durchgeführt, damit Marketing und Produkterlebnis exakt dieselbe Wahrheit erzählen.

---

## 7. Extern blockiert / Provider-Zugänge fehlen

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
- Travel Safety / Disruption / Seasonal Sources oder Provider: separat evaluieren/freigeben

Production-Suchen bleiben bis dahin deaktiviert.

---

## 8. Security-Hardening Track

Status: **offen, nicht durch Foundation C/D verursacht**

Supabase Security Advisor weist weiterhin auf ältere Punkte hin, insbesondere:

- mehrere `SECURITY DEFINER`-Funktionen, die für `authenticated` ausführbar sind
- GraphQL-Sichtbarkeit verschiedener bestehender Tabellen

Diese Punkte separat prüfen und priorisieren. Keine pauschalen Berechtigungsänderungen ohne Funktions-/Ownership-Review.

---

## 9. Bewusst nicht priorisiert

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

## 10. Production-Grenzen

Bereits auf Production-Schema:

- Booking Status
- Mobility
- Rental Cars
- Travel Readiness / Travellers

Das bedeutet **nicht**, dass externe Provider-Suchen aktiv sind.

Foundation E darf bis zur separaten Freigabe keine Production-Schemaänderung ausrollen. Foundation D ist auf Production.

Weiterhin keine Production-Aktivierung von Provider-Suchen, Secrets oder kostenpflichtigen Integrationen ohne dokumentierte Freigabe.

---

## 11. Definition für den nächsten Agenten

Nach dem Merge von Foundation E:

1. `JETNITY_PRODUCT_MANDATE.md` lesen.
2. `JETNITY_VISION.md` lesen.
3. `JETNITY_HANDOFF.md` und `docs/ACTIVE_WORK_STATUS.md` lesen.
4. diese Roadmap lesen.
5. `docs/TRAVELLER_CONTEXT.md`, `docs/TRAVELLER_CONTEXT_INTELLIGENCE_POLICY.md` und `docs/FOUNDATION_E_TRAVELLER_CONTEXT_ACCEPTANCE.md` lesen.
6. aktuellen `main`-/CI-/Supabase-/Production-Stand prüfen.
7. keine Production-Migration ohne ausdrückliche aktuelle Product-Owner-Freigabe.
8. Foundation E nicht erneut implementieren.
9. Verbindliche Reihenfolge nach Foundation-E-Production-Abnahme: provider-neutrale Safety-Foundation → provider-neutrale Seasonal-Foundation → Provider-Readiness-Lücken schließen → großer Workspace-Umbau → Workspace Intelligence Audit → echte Providerphase → Provider-backed Audit → finale Startseiten-Positionierung.
13. Travel Safety & Disruption Intelligence ist eine verbindliche spätere Produktfähigkeit gemäß `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`.
14. Travel Timing & Seasonal Intelligence ist eine verbindliche gekoppelte spätere Produktfähigkeit gemäß `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`.
15. Provider werden erst in einer späteren finalen Phase angeschlossen; vorher muss Jetnity provider-ready sein (`docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`, `docs/PRODUCT_OWNER_PR34_PROVIDER_READINESS_ADDENDUM.md`).
16. Nach der Providerphase folgt eine verbindliche finale Startseiten-Positionierung gemäß `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`.

Kein abgeschlossener Block darf unnötig neu gebaut werden.
