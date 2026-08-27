# Jetnity – Roadmap

Stand: 26. August 2026  
Status: **Foundation C/D/E, Safety, Seasonal, AP-1–AP-3, Admin A–C, Provider S1–S3 + S5-A, TW-1/2/4/3/5, TW6-A, D0-1/D0-2, P1-D0-LIVE-01, QS-1/QS-2, P1-QS2-02, P1-TA-02 und Admin-AAL2-Application-Guard liegen auf `main @ 38ec8be7`. TW6-REST-01, S5-B, TW-7/TW-8, AP-4+, Admin D–K, D1/G1 und Growth-Folgeslices sind nicht gestartet. Aktueller Handoff: `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`.**

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

Status: **abgeschlossen und auf `main` gemergt (PR #38, Squash `ee988bbe`); kein Live-Provider**

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
22. ✅ Product-Owner-Merge und Production-Integration

---

## 6a. Account Platform AP-1 – persönliches Zuhause

Status: **auf `main` – Squash-Merge `084f7c87` (PR #43), 24. August 2026**

Ziel: das persönliche Account-Zuhause anlegen, ohne den Trip Workspace zu verdoppeln.

Umgesetzt in AP-1:

- Account-Shell mit kompakter Navigation
- `/account` aus bestehenden `reisenLaden()`-Daten
- **Konto**-Link nur bei `sitzung === konto`
- `/account/security` unter Einstellungen auffindbar
- UI-Audit 48/48 grün

Nicht in AP-1: Auth/MFA/AAL, RLS, Traveller-Registry, Privacy/Billing, Guest→Account, Homepage.

Auftrag: `docs/ACCOUNT_AP1_MAIN_SYNC_TASK.md`. Entscheidung: ADR-0152, ADR-0153.

---

## 6b. Account Platform AP-2 – Auth-UX-Hygiene

Status: **auf `main` – Squash-Merge `2827d1cb` (PR #48), 24. August 2026**

Ziel: Login, Register, Callback, OAuth-Sichtbarkeit, Gast-/Session-Navigation und MFA-Dialog-Accessibility härten, ohne Auth-/MFA-/AAL-Vertrag oder Provider zu ändern.

Umgesetzt in AP-2:

- OAuth-Schaltflächen nur bei belegtem `config.toml`-Enablement
- zentrale `next`-Allowlist, fail-closed `/reisen`
- Login/Register über `getUser()`
- öffentliche Register-Enumeration inkl. AP2-B1 geschlossen
- Gast `/reisen`: Fortsetzen nur bei aktivem Entwurf
- Footer aus `sitzungseintraege()`
- MFA-Dialog a11y gehärtet

Nicht in AP-2: DB/Migration/RLS, Traveller-Registry, Guest→Account-Vertragsänderung, Provider-Aktivierung, AP-3.

Auftrag: `docs/ACCOUNT_AP2_MAIN_SYNC_TASK.md`.

---

## 6c. Admin Control Center Slice A

Status: **auf `main` gemergt (PR #44, `1ec93cc9`). Entscheidung: ADR-0158.**

- ehrliche Steuerzentralen-IA auf dem vorhandenen gehärteten Backoffice
- keine neue Datenwahrheit, keine neue Autorität, keine Migration

---

## 6d. Fertig – Admin Control Center Slice B

Status: **auf `main` gemergt (PR #46, `e3bad749`). Entscheidung: ADR-0159.**

- read-only System Health ohne Fake-Green
- Parent App/Deployment = `unknown`; Parent Supabase = `not_configured`
- keine neuen Secrets, Tokens, Verträge oder Kosten
- keine DB-/RLS-/Capability-Änderung, keine Writes

---

## 6e. Admin Control Center Slice C

Status: **auf `main` gemergt (PR #49, `78192ab`). Entscheidung: ADR-0162.**

- read-only Provider- und Kostenboard
- konsumiert gemergten S1-Vertrag, ohne ihn zu verändern
- keine Provideraktivierung, keine Secrets, keine Fake-Kosten
- kein Slice D ohne ausdrückliche Product-Owner-Freigabe

Auftrag: `docs/ADMIN_SLICE_C_PROVIDER_COST_BOARD_TASK.md`

---

## 6g. Fertig – QS-2 P1-QS2-01 zentraler Admin-AAL2-Application-Guard

Status: **auf `main` gemergt (PR #80, `d3faa2a0`). Entscheidung: ADR-0169. Production-Datenebene nicht angewendet.**

- Admin-Zugang verlangt zentral `currentLevel === 'aal2'`
- Break-Glass umgeht AAL2 nicht
- Development-Migration `20260826090000_admin_aal2_data_plane.sql` ist versioniert; Production-Supabase wurde nicht migriert
- kein allgemeiner Auth-Umbau, kein Admin D–K, keine Production-Aktivierung durch diesen Merge

---

## 6f. Fertig – Account Platform AP-3

Status: **auf `main` gemergt (PR #53, `8326e72f`). Entscheidung: ADR-0160.**

- Meine Reisen gruppiert ableitend nach Aktiv / Kommend / Vergangen / Ohne Datum
- 200er-Hinweis fail-closed
- kein Archiv-Write, keine Pagination-Architektur, kein AP-4

Auftrag: `docs/ACCOUNT_AP3_TASK.md`. Entscheidung: ADR-0160.

Nach AP-3 und S3 wurde der Trip-Workspace-Audit #55 docs-only gemergt (`08fd7748`). TW-1, TW-2 und TW-4 liegen auf `main`. TW-3 ist aktiv. Kein Slice D, kein AP-4 und kein S4 ohne eigenen neuen Auftrag.

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

S1 Shared Operational Contract ist auf `main` (PR #47). S2 FlugNachweis ist auf `main` (PR #51). S2 Development-Migrationen `20260824160000` und `20260824180000` sind **nicht** Production-approved; Production endet bei `20260824140000`. S3 Mobility/Rental-Nachweis liegt auf `main` (PR #54, `b7f027ec`, ADR-0161). **S5-A Commercial Provenance Domain Contract liegt auf `main` (PR #83, `3b317bc6`, ADR-0168).** S5-B ist nicht gestartet. Kein echter Provider, keine Secrets, keine Production-Migration. S4/S6–S8 bleiben eigene Aufträge.

---

## 8. Großer End-to-End Trip-Workspace-/Übersicht-Umbau

Status: **Audit/IA docs-only als PR #55 gemergt. TW-1, TW-2, TW-4, TW-3, TW-5 und TW6-A auf `main`. TW6-REST-01 bleibt offen. Ein migrations-only Gate-0-Draft für die drei geprüften TW6-B-Dateien plus Playbook ist in Vorbereitung; das ist kein Runtime-Merge und kein Production-Apply. Kein gesamtes TW-6-Closure. Kein TW-7/TW-8.**

Der Workspace ist die wichtigste Produktoberfläche und wird **nicht nur umgebaut**, sondern vollständig funktional generalinspiziert. PR #55 liefert ausschließlich die vorbereitete Audit-/Zielarchitektur-Evidence.

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
5. ✅ Travel Timing & Seasonal – provider-neutrale Foundation
6. ✅ Account Platform AP-1 – auf `main` (`084f7c87`, PR #43)
6a. ✅ Account Platform AP-2 – auf `main` (`2827d1cb`, PR #48)
6b. ✅ Admin Slice A auf `main` (PR #44, `1ec93cc9`, ADR-0158)
6c. ✅ Admin Slice B auf `main` (PR #46, `e3bad749`, ADR-0159)
6d. ✅ Admin Slice C auf `main` (PR #49, `78192ab`, ADR-0162)
6e. ✅ Account AP-3 auf `main` (PR #53, `8326e72f`, ADR-0160)
7. ✅ Provider-Readiness S1–S3 auf `main` (S3 = PR #54, `b7f027ec`, ADR-0161)
7a. ✅ Trip-Workspace-Audit / Zielarchitektur – docs-only PR #55 auf `main` (`08fd7748`); Ziel-IA danach als ADR-0163 angenommen
8. ✅ TW-1 Shell/Geräteparität auf `main` (PR #56)
9. ✅ TW-2 Reiseübersicht auf `main` (PR #58)
10. ✅ TW-4 Aufmerksamkeit auf `main` (PR #60, `c935dd9f`)
11. ✅ TW-3 Timeline / Etappe / Tag auf `main` (PR #64)
12. ✅ TW-5 Item- und Gap-Details auf `main` (PR #66)
12a. ✅ P1-QS2-02 Guest→Account Stay/Activity-Handelsfeld-Strip – auf `main` (`86567f17`, ADR-0166)
12b. ✅ P1-TA-02 Official Evaluation Option-Scope – auf `main` (`2468160e`, ADR-0167). P2-TA-06 bleibt offen.
12c. ✅ TW6-A Create-Entry Alignment – auf `main` (`c4ea47aa`). **TW6-REST-01 bleibt offen.**
12c1. ⏳ TW6-B Gate 0 migrations-only Vorbereitung – Draft gegen `main` für die drei geprüften Dateien plus transaktionales Playbook. **Kein Production-Apply. Kein Runtime-Merge. Kein TW-7/8/9.**
12d. ✅ Provider S5-A Commercial Provenance – auf `main` (`3b317bc6`, ADR-0168). S5-B nicht gestartet.
12e. ✅ Admin-AAL2 Application-Guard – auf `main` (`d3faa2a0`, ADR-0169). Production-DB nicht angewendet.
12f. ✅ D0 live metadata boundary / P1-D0-LIVE-01 – auf `main` (PR #86, `38ec8be7`, ADR-0170). HTML-robots fail-closed; Canonical ist `https://jetnity.com`, niemals `*.vercel.app`. **Kein D1/G1. Kein Domain-Cutover. Kein Public Indexing.**
13. Admin/Account/Provider-Programme separat weiterführen; kein Slice D, AP-4, S5-B, TW-8, D1 oder G1 ohne eigenen Auftrag
14. finaler Workspace Intelligence Audit
15. echte Providerphase
16. provider-backed End-to-End-/Truth-Audit
17. finale Startseiten-Positionierung

Der nächste Agent darf D/E/Safety **nicht neu bauen**, darf **nicht direkt einen echten Provider integrieren** und darf **TW6-REST-01 / TW-7 / TW-8 / S5-B nicht ohne ausdrücklichen neuen Auftrag starten**. Continuity-Wahrheit: `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`.