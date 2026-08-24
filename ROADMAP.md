# Jetnity – Roadmap

Stand: 24. August 2026  
Status: **Foundation C/D/E, Travel Safety und Seasonal Foundation auf `main`; Account AP-1 aktiv; Admin Slice A Technical Closure / PASS (Draft PR #44)**

Für Entscheidungen zusätzlich lesen:

- `JETNITY_PRODUCT_MANDATE.md`
- `JETNITY_VISION.md`
- `JETNITY_HANDOFF.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/CONTINUITY_STANDARD.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`

Leitsätze:

> **Einfach für den Nutzer. Streng logisch im Inneren. Eine Reise, eine Wahrheit.**

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

> **Nicht mehrere getrennte Suchprodukte, sondern eine Reise, deren Bereiche sich gegenseitig verstehen.**

---

## 1. Abgeschlossen / auf `main`

### Produkt- und Qualitätsfundament

- Jetnity V2 Produktvision und Product Mandate
- Product Quality Standard
- websiteweiter UX-/Informationsarchitektur-Standard
- Logic Standard
- Continuity Standard
- unabhängiger Review-Tiefenstandard
- ChatGPT/Cursor-Workflow
- Product-Owner-Merge-Gate
- Expert-Proaktivitätsregel
- Mobile-first / Device-Parity-Grundsatz

### Reise-Kern

- Reiseidee / Trip Builder Foundation
- Trip-Persistenz
- Guest → Account Übernahme
- Trip Workspace Foundation
- natürliche Reiseänderung / Revisionslogik
- gemeinsamer Reisegraph
- Booking Status / Coverage

### Reiseprodukte

- Flight Foundation
- Hotel Foundation
- Activities Foundation
- Foundation A – Mobilität & Transfers
- Foundation B – Mietwagen

---

## 2. Foundation C – Automatic Travel Requirements & Readiness

**Abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

Production-Migrationen:

- `20260822010000_trip_readiness_items`
- `20260822020000_trip_travellers`

Requirements bleiben provider-neutral. Ohne echten Provider wird keine regulatorische Wahrheit erfunden.

---

## 3. Foundation D – Route & Transit Intelligence

**Abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

- PR #34
- Merge-Commit: `5bc93bcd35421e3763dc8a3515f254c209b63d6a`
- Fachdokument: `docs/ROUTE_TRANSIT_INTELLIGENCE.md`
- Production-Acceptance: `docs/FOUNDATION_D_PRODUCTION_ACCEPTANCE.md`

Production-Migrationen:

- `20260822130000_reise_anlegen_route_itinerary`
- `20260822140000_flug_route_itinerary_airport_truth`
- `20260822150000_trip_items_route_itinerary_guard`

Route Truth bleibt traveller-neutral, provider-neutral und die kanonische Origin-/Transit-Naht.

---

## 4. Foundation E – Traveller Context / Multi-Citizenship / Multi-Document

**Abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

- PR #35
- Squash-Merge-Commit: `3bf1eaaa78ef6ac33bb3baff84650a143720e91d`
- Fachdokument: `docs/TRAVELLER_CONTEXT.md`
- Production-Acceptance: `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md`

Production-Migrationen:

- `20260822160000_traveller_context_intelligence`
- `20260822170000_traveller_context_fk_delete`
- `20260822180000_traveller_context_rereview`

Kanonisches Modell:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängig bewertete zulässige Optionen.**

Neue verbindliche Regel: `docs/TRAVELLER_CITIZENSHIP_REQUIREMENT_POLICY.md`.

- Citizenship bleibt beim einfachen Reise-Start optional.
- Sie wird zwingend, sobald eine Official-/Regulatory-Funktion davon abhängt.
- keine stille Citizenship-Annahme aus Residence/Standort/Abflugland/Sprache/Domain.
- fehlender notwendiger Kontext bleibt `unknown` / `insufficient_context`.

---

## 5. Travel Safety & Disruption Intelligence – provider-neutrale Foundation

**Abgeschlossen, technisch Closure/PASS und auf `main` gemergt. Nicht erneut bauen.**

- PR #37
- finaler PR-Head: `11976ed734b62ec906abd65581f309b1a38362f1`
- gelockter finaler Runtime-Head: `985cae72ef5abac4012c75c739fa00412189ad48`
- Squash-Merge-Commit: `2cceee0658cc426d66974779b525c8bf9a623534`
- Closure: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_CLOSURE.md`
- Fachdokument: `docs/TRAVEL_SAFETY_DISRUPTION.md`
- Acceptance: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ACCEPTANCE.md`

Finaler Runtime-Nachweis:

- 1481/1481 Tests
- Production-Build 38/38
- UI-Audit 886/886, 0 Fehler, WebKit + Chromium / 8 Viewports
- GitHub Actions SUCCESS
- Vercel Preview READY/SUCCESS
- 0 behind vor Merge
- Vercel auf Merge-Commit SUCCESS

Keine Safety-Tabelle, keine DB-/Production-Migration, kein Live-Provider, keine Secrets, keine neuen laufenden Kosten.

Verbindliche Truth-Logik:

- kein allgemeiner Newsfeed
- nur räumlich/zeitlich/fachlich relevante Events
- Source/Authority/Freshness/Scope getrennt modelliert
- `unknown` / stale / conflict / timeout / malformed bleiben fail-closed
- keine pauschale Landeswarnung bei feinerer Evidence
- Route/Transit/Stage-Zeitfenster berücksichtigen
- keine erfundene UTC-Semantik für zonenlose lokale Zeiten oder Date-only-Tage
- keine automatische Reiseänderung
- Seasonal bleibt getrennte Wahrheit

---

## 6. Travel Timing & Seasonal Intelligence

Status: **auf `main` gemergt (PR #38, Squash `ee988bbe`); kein Live-Provider**

Policy:

- `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`

Ziel: Jetnity erkennt, wenn konkrete Reisedaten typischerweise in eine deutlich ungünstigere saisonale Phase fallen, z. B.:

- Monsun
- Hurrikan-/Taifunsaison
- starke Hitze/Kälte
- Waldbrand-/Rauchperiode
- saisonale Hochwasser
- relevante Schnee-/Lawinenperioden
- saisonale Schließ-/Erreichbarkeitsprobleme

Verbindlich:

- saisonales Muster ≠ akute Safety-Warnung
- typische/statistische Bedingungen ≠ exakte Wettervorhersage
- Region + konkrete Reisedaten berücksichtigen
- keine pauschalen „schlecht“-/„gefährlich“-Behauptungen
- Auswirkungen erklären
- bessere Zeitfenster/Alternativen vorschlagen, niemals automatisch ändern
- Nutzer kann `Trotzdem so planen`
- Evidence/Freshness/Source nachvollziehbar
- keine erfundenen Wahrscheinlichkeiten
- kein echter Seasonal-Provider im ersten Foundation-Block

### Nächster Implementierungsablauf

1. ✅ Ist-Audit gegen Safety, Route, Traveller Context, Readiness und Workspace – gegen aktuellen Code verifiziert
2. ✅ provider-neutrales Domain-/Evidence-/Seasonality-Modell
3. ✅ klare Trennung zu akutem Safety
4. ✅ Cross-Domain-Impact und Reevaluation
5. ✅ minimale, ruhige Workspace-Naht
6. ✅ Pflicht-Testmatrix + Device-Matrix (1593/1593 Tests, UI-Audit 1014/1014)
7. ✅ ChatGPT-Re-Review R3: Residual Blocker 5 und Blocker 7 geschlossen
8. ✅ ChatGPT-Re-Review R4: Blocker 8 und 9 geschlossen
9. ✅ ChatGPT-Re-Review R5: Blocker 10 und 11 geschlossen, Exact-Head-Gate grün
10. ✅ ChatGPT-Re-Review R6: Blocker 12 geschlossen, Exact-Head-Gate grün
11. ✅ ChatGPT-Re-Review R7: Blocker 13 geschlossen, Exact-Head-Gate grün
12. ✅ ChatGPT-Re-Review R8: Blocker 14 und 15 geschlossen, Exact-Head-Gate grün
13. ✅ ChatGPT-Re-Review R9: Blocker 16–19 geschlossen, Exact-Head-Gate grün
14. ✅ ChatGPT-Re-Review R10: Blocker 20–23 geschlossen, Exact-Head-Gate grün
15. ✅ ChatGPT-Re-Review R11: Blocker 24–26 geschlossen, Exact-Head-Gate grün
16. ✅ ChatGPT-Re-Review R12: Blocker 27 geschlossen, Exact-Head-Gate grün
17. ✅ ChatGPT-Re-Review R13: Blocker 28 geschlossen, Exact-Head-Gate grün
18. ✅ ChatGPT-Re-Review R14: Blocker 29 geschlossen, Exact-Head-Gate grün
19. ✅ ChatGPT-Re-Review R15: Blocker 30 geschlossen, Exact-Head-Gate grün
20. ✅ ChatGPT-Re-Review R16: Blocker 31 geschlossen, Exact-Head-Gate grün
21. ✅ ChatGPT-Re-Review R17: Technical Closure / PASS, kein neuer konkreter Defekt
22. ✅ Product-Owner-Merge und Integration auf `main`

---

## 6a. In Arbeit – Admin Control Center Slice A

Status: **Technical Closure / PASS auf Exact Head `5632a3ca`; Draft PR #44 wartet auf Product-Owner-Merge-Freigabe**

- ehrliche Steuerzentralen-IA auf dem vorhandenen gehärteten Backoffice
- keine neue Datenwahrheit, keine neue Autorität, keine Migration
- danach eigener Slice B: read-only System Health
- kein Mark Ready / Merge ohne ausdrückliche Product-Owner-Freigabe

Auftrag: `docs/ADMIN_SLICE_A_IMPLEMENTATION_TASK.md`

---

## 7. Provider-Readiness / Adapter-Grenzen

**Echte Provider bleiben bis zur späteren Providerphase deaktiviert.**

Vorher müssen provider-neutrale Ports/Adapter-Grenzen professionell geschlossen werden, insbesondere bei:

- Flights
- Hotels
- Activities
- Mobility / Transfers
- Rental Cars
- Travel Requirements / Readiness
- Safety & Disruption
- Timing & Seasonal

Zu prüfen/vereinheitlichen:

- Request-/Response-Port
- Evidence / Source / Freshness
- Provider Health / unavailable / timeout
- Rate-Limit-/Billing-Schutz
- Cache-/Lizenzgrenzen
- Stale-/Invalidation-Verhalten
- Auditability
- keine Browser-/LLM-Felder als Provider Truth

Keine Verträge, Secrets oder laufenden Providerkosten ohne separate Freigabe.

---

## 8. Großer End-to-End Trip-Workspace-/Übersicht-Umbau

Status: **verbindlich geplant / erst nach Safety + Seasonal + Provider-Readiness**

Der Workspace ist die wichtigste Produktoberfläche und wird **nicht nur umgebaut**, sondern vollständig funktional generalinspiziert.

Pflichtumfang:

- Multi-Destination ab Reiseeinstieg über `trip_stages`
- „Meine Reisen“ als zentraler Hub
- Gast-One-Trip-Regel / `Reise fortsetzen`
- Initialflow vereinfachen
- `Wünsche & Prioritäten`
- harte Facts vs weiche Preferences
- Reise-Kopf / Gesamtstatus
- `Jetzt wichtig`
- Warnungen / Risiken
- Fortschritt pro Fachbereich
- Readiness / Traveller Context
- Safety / Seasonal
- Tagesplan bei ausreichender Grundlage
- Cross-Domain-Auswirkungen
- begründete/reversible Empfehlungen
- Nutzerfreigabe für relevante Änderungen
- Device-/Viewport-Parität

### Function-by-Function-Generalinspektion

Jede bestehende und neue Workspace-Funktion wird einzeln erneut geprüft auf:

- fachliche Logik / Source of Truth
- Persistenz / Datenverlust / Stale / Unknown / Error
- Security / RLS / Ownership
- Guest / Account
- Cross-Domain-Interoperabilität
- reale sequentielle E2E-Szenarien
- Smartphone / Tablet / Laptop / Desktop
- Unit-/Integration-/Regression-/E2E-Nachweise

Frühere Merges und grüne Tests sind **kein Bestandsschutz**. Evidence-Matrix pro Funktion ist Pflicht.

---

## 9. Verbindlicher finaler Workspace Intelligence Audit

Nach dem großen Umbau zwingend:

- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`
- `docs/TRIP_WORKSPACE_FUNCTION_BY_FUNCTION_AUDIT_MANDATE.md`

Senior Product / Architecture / UX / Logic / Security / Intelligence Audit über alte und neue Funktionen zusammen.

---

## 10. Echte Providerphase – bewusst spät

Erst nach provider-neutralen Foundations, Workspace-Umbau und Audit werden echte Provider aktiviert.

Vor jedem Provider:

- Kosten / Vertrag
- Coverage
- Lizenz / Display / Cache
- Rate Limits
- Reliability / Health
- Datenschutz
- Datenfrische
- Evidence-Eigenschaften
- Secrets
- Failure-/Fallback-Verhalten
- Product-Owner-Freigabe

Danach eigener provider-backed End-to-End-/Truth-Audit.

---

## 11. Finale Startseiten-Positionierung

Erst wenn der Kern tatsächlich integriert ist:

- `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`

Keine Feature-Wand, kein internes Architekturjargon, keine nicht produktiven Versprechen.

---

## 12. Aktuelle Ausführungsreihenfolge

1. ✅ Foundation C – Readiness
2. ✅ Foundation D – Route & Transit
3. ✅ Foundation E – Traveller Context inkl. Production
4. ✅ Travel Safety & Disruption – provider-neutrale Foundation
5. ✅ Travel Timing & Seasonal – provider-neutrale Foundation (PR #38 gemergt)
6. **→ Account AP-1 (Draft PR #43) aktiv; Admin Slice A Technical Closure / PASS (Draft PR #44, wartet auf Product-Owner-Freigabe); Slice B separat**
7. Provider-Readiness-/Adapter-Lücken schließen
8. großer Trip-Workspace-/Übersicht-Umbau + Function-by-Function-Generalinspektion
9. finaler Workspace Intelligence Audit
10. echte Providerphase
11. provider-backed End-to-End-/Truth-Audit
12. finale Startseiten-Positionierung

Der nächste Agent darf D/E/Safety **nicht neu bauen** und darf **nicht direkt einen echten Provider integrieren**.
