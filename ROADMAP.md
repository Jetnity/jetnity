# Jetnity – Roadmap

Stand: 23. August 2026  
Status: **Foundation D und E vollständig abgeschlossen inkl. Production; nächster Block: Travel Safety & Disruption Intelligence – provider-neutrale Foundation**

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

Die Requirements-Engine bleibt provider-neutral. Ohne echten Provider wird keine regulatorische Wahrheit erfunden.

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

Route Truth bleibt traveller-neutral, provider-neutral und die einzige kanonische Origin-/Transit-Naht für relevante spätere Funktionen.

---

## 4. Foundation E – Traveller Context / Multi-Citizenship / Multi-Document

**Abgeschlossen, gemergt und auf Production verifiziert. Nicht erneut bauen.**

- PR #35
- Squash-Merge-Commit: `3bf1eaaa78ef6ac33bb3baff84650a143720e91d`
- Fachdokument: `docs/TRAVELLER_CONTEXT.md`
- Closure: `docs/PR35_CHATGPT_INDEPENDENT_CLOSURE_CHECK.md` – PASS
- Production-Acceptance: `docs/FOUNDATION_E_PRODUCTION_ACCEPTANCE.md`

Production-Migrationen:

- `20260822160000_traveller_context_intelligence`
- `20260822170000_traveller_context_fk_delete`
- `20260822180000_traveller_context_rereview`

Kanonisches Modell:

> **Ein Reisender → mehrere Staatsbürgerschaften → mehrere Reisedokumente / Credentials → kontextabhängig bewertete zulässige Optionen.**

Keine Passnummern, Scans, MRZ oder Biometrie. Ausstellerland ist keine automatische Staatsbürgerschaft. `unknown` bleibt `unknown` ohne belastbare Evidence.

---

## 5. NÄCHSTE PRIORITÄT – Travel Safety & Disruption Intelligence

Status: **in Arbeit auf `feat/travel-safety-disruption-intelligence`; `main` unverändert**

Verbindliche Policy:

- `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`

Ziel: Jetnity soll relevante akute Sicherheits-/Störungsereignisse für eine konkrete geplante oder laufende Reise erkennen und in den Reisekontext einordnen können, z. B.:

- Krieg / bewaffneter Konflikt
- schwere politische Unruhen
- Erdbeben / Tsunami / Vulkanaktivität
- Hochwasser / Waldbrände
- Hurrikane / Taifune / andere erhebliche Naturereignisse
- andere belastbar belegte, erhebliche Reisebeeinträchtigungen

### Verbindliche Truth-Logik

- kein allgemeiner Newsfeed
- nur anzeigen, wenn Ereignis räumlich/zeitlich/fachlich zur konkreten Reise, Etappe oder Route relevant ist
- Safety Truth nur aus geeigneter belastbarer Evidence; LLM darf erklären, nicht Wahrheit erzeugen
- Source/Authority, Freshness, räumlicher Scope und Event-/Warning-Kontext müssen modellierbar sein
- `unknown` / unzureichende Evidence bleibt unknown
- keine landesweite Warnung, wenn Evidence nur eine Region betrifft und feinere Granularität möglich ist
- semantische Stufen: kritische Warnung / wichtiger Reisehinweis / Information-Watch
- keine automatische Reiseänderung

### Cross-Domain

Safety muss Auswirkungen auf relevante Teile derselben Reise erkennen können:

- Destination / Etappe
- Flug / Route / Transit
- Unterkunft
- Aktivitäten
- Mobilität / Transfers
- Mietwagen / Straßen
- Tagesplan
- Readiness, wenn fachlich betroffen

Die Funktion darf kein isoliertes Warnungsmodul werden. Sie muss Route Truth, Traveller Context und den bestehenden Reisegraphen wiederverwenden.

### Auftrag / Arbeitsstand

Versionierter Cursor-Auftrag liegt auf `main` und wird jetzt implementiert:

- `docs/CURSOR_TRAVEL_SAFETY_DISRUPTION_FOUNDATION_TASK.md`
- Ist-Audit: `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_ARCHITECTURE_AUDIT.md`
- Live-Status: `docs/ACTIVE_WORK_STATUS.md`

Kein echter Safety-Provider in diesem Block. Keine Production-Migration, kein Mark Ready, kein Merge.

---

## 6. Danach – Travel Timing & Seasonal Intelligence

Status: **verbindliche Produktentscheidung / noch nicht begonnen**

Policy:

- `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`

Ziel: erkennen, wenn konkrete Reisedaten typischerweise in eine deutlich ungünstigere saisonale Phase fallen, z. B. Monsun, Hurrikan-/Taifunsaison, starke Hitze/Kälte, Waldbrand-/Rauchperiode, saisonale Hochwasser, relevante Schnee-/Lawinenperioden oder saisonale Schließ-/Erreichbarkeitsprobleme.

Verbindlich:

- saisonales Muster ≠ akute Warnung
- typische/statistische Bedingungen ≠ exakte Wettervorhersage
- Region und konkrete Reisedaten berücksichtigen
- nicht pauschal „schlecht“ oder „gefährlich“ behaupten
- mögliche Auswirkungen erklären
- Alternativen vorschlagen, niemals automatisch Datum/Ziel ändern
- Nutzer kann `Trotzdem so planen`
- Safety und Seasonal teilen keine unscharfe Wahrheit, können aber im Workspace koordiniert priorisiert werden

---

## 7. Provider-Readiness / Adapter-Grenzen vor dem großen Workspace-Umbau

**Echte Provider bleiben bis zur späteren Providerphase deaktiviert.**

Vorher müssen die provider-neutralen Ports/Adapter-Grenzen professionell vorhanden sein, wo noch Lücken bestehen – insbesondere bei:

- Flights
- Hotels
- Activities
- Mobility / Transfers
- Rental Cars
- Travel Requirements / Readiness
- Safety & Disruption
- Timing & Seasonal

Ziel: reale Provider später anschließen, ohne fachliche Modelle umzubauen oder neue Schattenwahrheiten einzuführen.

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

Status: **verbindlich geplant / erst nach D + E + Safety + Seasonal + Provider-Readiness**

Der Trip Workspace ist die wichtigste Produktoberfläche.

Die Übersicht soll schnell beantworten:

1. Was ist diese Reise?
2. Was ist erledigt?
3. Was fehlt?
4. Was ist unsicher / riskant / offen?
5. Was empfiehlt Jetnity jetzt als Nächstes?

Verbindliche Punkte aus dem Product-Owner-Rundgang sind vollständig einzubeziehen:

- Multi-Destination ab Reiseeinstieg über `trip_stages`
- „Meine Reisen“ als zentraler Hub
- klare Gast-One-Trip-Regel
- `Reise fortsetzen` statt irreführendem Neu-Anlegen bei aktivem Gasttrip
- Reisetempo-/Interessen-Chips aus Initialflow entfernen
- optionaler Freitext `Wünsche & Prioritäten`
- kein hidden `balanced` als Nutzerwahrheit
- harte Facts vs weiche Preferences strikt trennen
- Reise-Kopf / Gesamtstatus
- `Jetzt wichtig`
- Warnungen / Risiken
- Fortschritt pro Fachbereich
- Readiness / Traveller Context
- Tagesplan erst bei ausreichender Grundlage
- Cross-Domain-Auswirkungen sichtbar
- Empfehlungen begründet / reversibel
- wichtige Änderungen nur nach Nutzerfreigabe
- Device-/Viewport-Parität
- relevante alte Funktionen nach aktuellem Standard re-evaluieren

Leitsatz:

> **Komplexität gehört ins System, nicht in den Kopf des Nutzers.**

---

## 9. Verbindlicher finaler Workspace Intelligence Audit

Nach dem großen Umbau ist ein kompletter Senior Product / Architecture / UX / Logic / Security / Intelligence Audit zwingend:

- `docs/TRIP_WORKSPACE_FINAL_INTELLIGENCE_AUDIT_POLICY.md`

Er muss alte und neue Funktionen zusammen prüfen, nicht nur einzelne Module.

Insbesondere:

- kanonische Wahrheiten
- sequential multi-change scenarios
- Cross-Domain-Auswirkungen
- Stale/Invalidation
- Guest/Account
- Multi-Destination
- Traveller Context
- Route/Transit
- Readiness
- Safety
- Seasonal
- User Approval
- Device-Matrix
- Security / RLS / Data Loss
- technische Regressionen

---

## 10. Echte Providerphase – bewusst spät

Erst nach den provider-neutralen Foundations, dem Workspace-Umbau und dessen Audit werden echte Provider aktiviert.

Vor jedem Provider:

- Kosten / Vertrag
- Coverage
- Lizenz / Display / Cache
- Rate Limits
- Reliability / Health
- Datenschutz
- Datenfrische
- Source-/Evidence-Eigenschaften
- Secrets
- Failure-/Fallback-Verhalten
- Product-Owner-Freigabe

Kein Provider darf eine separate fachliche Wahrheit neben dem Jetnity-Domainmodell erzeugen.

Nach Provider-Aktivierung folgt ein eigener **provider-backed End-to-End-/Truth-Audit**.

---

## 11. Finale Startseiten-Positionierung

Erst wenn der Kern tatsächlich integriert ist:

- `docs/FINAL_HOMEPAGE_POSITIONING_OPTIMIZATION_POLICY.md`

Die Startseite muss einem neuen Besucher in Sekunden erklären:

- was Jetnity ist
- welches Problem es löst
- was es konkret kann
- warum es sich von klassischen Reiseplanern / Metasuchen unterscheidet
- warum die Reise als zusammenhängendes System einen Vorteil bringt
- wie man einfach startet

Keine Feature-Wand, kein internes Architekturjargon, keine nicht produktiven Versprechen.

---

## 12. Aktuelle Ausführungsreihenfolge

1. ✅ Foundation C – Readiness
2. ✅ Foundation D – Route & Transit
3. ✅ Foundation E – Traveller Context inkl. Production
4. **→ Travel Safety & Disruption – provider-neutrale Foundation**
5. Travel Timing & Seasonal – provider-neutrale Foundation
6. Provider-Readiness-/Adapter-Lücken schließen
7. großer Trip-Workspace-/Übersicht-Umbau
8. finaler Workspace Intelligence Audit
9. echte Providerphase
10. provider-backed End-to-End-/Truth-Audit
11. finale Startseiten-Positionierung

Der nächste Agent darf **nicht** Foundation D oder E neu bauen und darf **nicht** direkt einen echten Provider integrieren.
