# Cursor Task – Travel Timing & Seasonal Intelligence – provider-neutrale Foundation

Stand: 23. August 2026  
Status: **verbindlicher Implementierungsauftrag**

Basis beim Erstellen dieses Auftrags: `main` nach abgeschlossenem Safety-Block.  
Vor Arbeitsbeginn **immer** `origin/main` neu fetchen und Branch von aktuellem `origin/main` erstellen.

Verbindlich zuerst vollständig lesen:

1. `JETNITY_HANDOFF.md`
2. `ROADMAP.md`
3. `docs/ACTIVE_WORK_STATUS.md`
4. `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`
5. `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ARCHITECTURE_AUDIT.md`
6. `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md`
7. `docs/TRAVEL_SAFETY_DISRUPTION_FOUNDATION_CLOSURE.md`
8. `docs/TRAVEL_SAFETY_DISRUPTION.md`
9. `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
10. `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`
11. `docs/PRODUCT_OWNER_MERGE_APPROVAL_POLICY.md`
12. `docs/PRODUCT_QUALITY_STANDARD.md`
13. `docs/LOGIC_STANDARD.md`
14. `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`

---

## 0. Auftrag in einem Satz

Baue eine **eigene provider-neutrale Travel Timing & Seasonal Intelligence Foundation**, die kanonischen Trip-/Stage-/Route-/Datums-Kontext gegen streng normalisierte, source-backed saisonale Facts deterministisch, geo-/zeitpräzise und fail-closed bewertet, ohne Safety-Truth zu vermischen, ohne echten Provider, ohne Fake-Daten, ohne automatische Reiseänderungen und standardmäßig ohne DB-Migration.

---

## 1. Branch / PR / Governance

Erstelle einen neuen Branch, bevorzugt:

`feat/travel-timing-seasonal-intelligence`

Öffne **früh** einen Draft PR mit Titel ähnlich:

`Travel Timing & Seasonal Intelligence – provider-neutrale Foundation`

Regeln:

- PR bleibt Draft.
- Kein Mark Ready.
- Kein Merge.
- Kein echter Provider.
- Keine Secrets.
- Keine neuen laufenden Kosten.
- Keine Production-Migration.
- Wenn entgegen der Architektur eine DB-Migration zwingend erscheint: **STOP**, dokumentieren und Product-Owner-/Architecture-Freigabe einholen, bevor eine Migration erzeugt oder angewendet wird.
- Handoff, Active Work, Roadmap, Architektur, ADRs und Acceptance während der Arbeit nachziehen.

---

## 2. Phase 1 – Ist-Stand verifizieren, nicht blind nachbauen

Bevor Runtime-Code entsteht:

1. `git fetch origin`
2. sicherstellen, dass der neue Branch auf aktuellem `origin/main` basiert
3. prüfen, dass Safety PR #37 auf `main` gemergt ist
4. Architektur-Audit gegen den tatsächlichen Code gegenlesen
5. Abweichungen zwischen Audit und aktuellem Code **vor Implementierung** im Audit dokumentieren

Besonders prüfen:

- `lib/safety/*`
- `app/api/safety/evaluate/route.ts`
- `lib/route/*`
- `lib/readiness/*`
- `types/trips.ts`
- `components/trips/TripWorkspace.tsx`
- `components/trips/TripWorkspaceUebersicht.tsx`
- `components/trips/ReiseSicherheit.tsx`
- Guest-/Account-Arbeitsbereiche
- UI-Audit-Scripts/Fixtures

Keine Funktion neu bauen, die kanonisch bereits existiert.

---

## 3. Eigene Domain `lib/seasonal/`

Erstelle eine fachlich eigenständige Seasonal-Domäne. Dateinamen dürfen repo-konform deutsch sein.

Mindestens fachlich trennen:

- Domain / enums / limits
- Evidence / Source / Freshness
- Spatial Scope
- Travel / recurring window
- Provider-Port
- strict normalization
- conflict/deduplication
- context construction
- context/event fingerprint
- relevance
- impact
- presentation/status/copy
- engine/orchestration
- request/schema/API boundary
- fixtures + comprehensive tests

### Nicht erlaubt

- `SafetyEvaluation` als Seasonal Evaluation umbenennen
- Safety presentation classes (`critical_warning`, `do_not_travel` etc.) für Seasonal verwenden
- Safety `seasonal_pattern` als akute Warnung darstellen
- Active Warning/Event als Historical Seasonal Context darstellen
- Provider-specific Schema erfinden

### Low-level Shared Helpers

Wenn Calendar/Timezone/Geo-Code identisch zu Safety gebraucht wird, darfst du **kleine wirklich generische** Primitiven in ein neutral benanntes Shared-Modul extrahieren.

Nur wenn:

- keine Domain-Semantik hineinleckt
- Safety Verhalten bit-for-bit/fachlich gleich bleibt
- Safety Tests vollständig grün bleiben
- kein breiter Refactor entsteht

Sonst eigene, klar getestete Seasonal-Implementierung bevorzugen.

---

## 4. Seasonal Evidence Classes / Truth Classes

Mindestens modellieren:

- `seasonal_pattern`
- `official_seasonal_risk_window`
- `forecast_outlook`

Eine akute Warnung/Event-Klasse muss erkennbar **nicht Seasonal** sein und darf nicht als Seasonal-Evaluation erscheinen.

Wichtig:

- Seasonal Pattern = typische/historische/wiederkehrende Bedingungen
- Official Seasonal Window = offiziell/fachlich definierte saisonale Periode
- Forecast Outlook = zeitnahe Prognose, aber keine Active Warning
- Active Warning = Safety-Domäne

LLM darf später erklären, nie Wahrheit erzeugen. In dieser Foundation kein LLM-Truth-Pfad.

---

## 5. Provider-neutraler Seasonal Fact Vertrag

Entwirf einen internen `SeasonalProviderFact`, der spätere echte Provider normalisieren kann, ohne UI-Neubau.

Mindestens:

- stabile `factKey`
- category
- evidenceClass / truthClass
- source-backed outcome
- spatialScope
- travelWindow
- provider/source/authority metadata
- publishedAt / updatedAt / checkedAt / freshUntil
- reference period / climatology period, soweit vorhanden
- headline/summary optional und streng textvalidiert
- ggf. source-backed impact hints / affected domains
- availability / temporary unavailable semantics

Kein ungeprüfter Freitext als Entscheidungssignal.

### Kategorien

Kategorien sollen Policy-Beispiele abdecken, z. B. fachlich äquivalent zu:

- heavy_rain / monsoon
- tropical_cyclone_season
- heat
- cold / winter
- wildfire / smoke season
- flood / heavy-rain period
- snow / avalanche seasonal context
- seasonal_access / closure
- other
- unknown

Kategorien sind **keine** Severity.

### Outcome

Nutze eine getrennte source-backed Semantik, z. B.:

- `less_favorable`
- `mixed_tradeoff`
- `favorable_context`
- `unknown`

Kein Outcome aus bloßer Kategorie erfinden.

---

## 6. Travel Window Modell – besonders gründlich

Seasonal braucht zwei klar getrennte Fensterarten:

### A. Annual recurring

Beispiel: `11-01` → `03-31` jedes Jahr.

Anforderungen:

- Month/Day streng validieren
- Start <= End im selben Jahr korrekt
- Window über Jahreswechsel korrekt
- Reise über mehrere Jahre korrekt
- mehrere Stage-Zeiträume getrennt bewerten
- Leap-Day deterministisch
- keine naive `month in []`-Logik als einzige Wahrheit

### B. Absolute window

Konkretes Start-/Enddatum bzw. geeigneter Forecast-Zeitraum.

- Date-only bleibt Date-only
- Instant bleibt Instant
- keine erfundene Zeitzone

### Reference Period ist nicht Travel Window

Beispiel: Klimanormal `1991–2020` beschreibt die Datenbasis, nicht dass die Reise 1991–2020 liegen muss.

Explizite Tests dafür.

---

## 7. Temporal / Timezone Truth

Die Timezone-Closure-Regeln aus Safety sind verbindlich:

- Foundation-D `HH:mm` ist Ortszeit ohne Zone
- niemals still `Z` anhängen
- Trip-/Stage-Date-only ist zonenloser Kalendertag
- Date/clock ↔ UTC instant innerhalb möglicher globaler Offset-Spanne bleibt `insufficient_context`
- nur klar außerhalb darf before/after/not-applicable entstehen
- wiederholte Airport-/Routekontakte bleiben getrennte Fenster

Diese Regeln dürfen durch Seasonal nicht regressieren.

---

## 8. Geo / Scope

Definiere einen Seasonal Spatial Scope mit mindestens:

- country
- admin_region
- city/place
- point/radius
- airport
- route
- unknown

Fail-closed:

- Country-Code aus Stage darf Country-Level Match erlauben
- feinere Region ohne kanonische Membership → `insufficient_context`
- city/place nur mit belastbarer Place-/Membership-/Coordinate-Truth
- title-only Item-Text ist keine Geo-Truth
- Route/Airport nur aus Foundation D
- keine pauschale Hochstufung einer regionalen Quelle auf ganzes Land

Wenn bestehende Safety-Scope-Algorithmen fachlich generisch extrahiert werden: alle Safety-Regressionen verpflichtend.

---

## 9. Seasonal Trip Context

Baue den Context ausschließlich aus kanonischen Trip Facts.

Mindestens:

- Trip dates
- stages inkl. IDs, countryCode, placeId, coordinates, arrival/departure
- days / dates soweit relevant
- Foundation-D route facts / route fingerprint
- relevante item refs + type/stage/day für Impact-Ableitung

Keine Citizenship-/Document-Felder im Standard-Foundation-Request. Seasonal ist traveller-neutral, solange keine echte fachliche Notwendigkeit belegt ist.

Guest und Account mit identischem Trip Graph müssen dasselbe fachliche Ergebnis liefern.

---

## 10. Relevance Engine

Seasonal Evaluation soll mindestens unterscheiden:

- `applies`
- `not_applies`
- `insufficient_context`
- `unknown`

Relevance entsteht aus **Geo + Travel Window + Source Validity**, nicht aus UI-Text.

Wichtig:

- Pattern kann für Stage A gelten, für Stage B nicht
- Multi-Destination separat
- repeated destination separat nach Datum
- route/transit nur bei fachlich passender Source
- incomplete context niemals in `not_applies` verwandeln

---

## 11. Evidence / Freshness

Seasonal Freshness **nicht** aus Safety `7 Tage` kopieren.

Trenne:

- Retrieval/Checked Freshness
- Source updated/published
- explicit `freshUntil` / adapter policy
- Reference Period
- Travel Window

Sichere Regel für Foundation:

- ohne belastbare Freshness-Semantik kein `current`
- stale / recheck-needed sichtbar
- stale fact darf keine clean/favorable Zusammenfassung erzeugen

Wenn du eine Default-Max-Age definieren willst, muss sie fachlich begründet, dokumentiert und provider-neutral sein. Bevorzuge fail-closed statt erfundener Gültigkeit.

---

## 12. Conflict / Deduplication / Order Independence

Erstelle eine zentrale decision-relevante Signatur für Providerfacts.

Konfliktprüfung muss alle Felder enthalten, die das Ergebnis ändern können, mindestens:

- category
- truth/evidence class
- outcome
- spatial scope identity
- travel window identity
- source-backed impact semantics
- ggf. source-defined risk/materiality field, falls eingeführt

Nur unterschiedliche Source URLs bei ansonsten identischer Semantik sind nicht automatisch Konflikt.

Anforderungen:

- vollständig identische Duplikate deduplizieren
- widersprüchliche Facts → conflict/unknown/recheck
- Reihenfolge ändert Ergebnis nicht
- maxFact limit verwirft/fehlschlägt deterministisch statt rohe Reihenfolge abzuschneiden
- malformed `unknown` darf nicht zu einem günstigen Default normalisiert werden

---

## 13. Provider-Port

Erstelle `SeasonalProvider` + `seasonalProviderAus()`.

Factory in diesem Block:

```ts
export function seasonalProviderAus(): SeasonalProvider | null {
  return null
}
```

Kein echter Adapter, kein Scraper, kein Browser-Fetch, kein LLM.

Provider request enthält nur minimal erforderliche kanonische Facts.

Provider call:

- AbortController
- definierter Timeout
- Timeout und Throw → `source_temporarily_unavailable` / fachlich gleichwertig
- keine Fake-Fallbacks

---

## 14. Engine / Checked Empty / Partial Invalid

Analog zu Safety, aber mit Seasonal-Semantik:

### Kein Provider

- honest `unavailable`
- keine Aussage `Reisezeit ist gut`

### Erfolgreicher Provider mit `[]`

- geprüftes leeres Ergebnis, nicht provider unavailable
- Copy etwa: `Im geprüften Ausschnitt wurden keine belastbaren relevanten saisonalen Hinweise geliefert.`
- ausdrücklich **keine Garantie**, dass Reisezeit optimal ist

### Partial invalid response

- valide relevante Hinweise dürfen sichtbar bleiben
- Response Summary muss `complete=false` / fachlich gleichwertig tragen
- keine clean/favorable Gesamt-Copy

### Conflict

- kein winner
- unknown/recheck

---

## 15. Fingerprints

### Context fingerprint

Muss decision-relevante Trip Facts enthalten, mindestens:

- trip date range
- sorted stages: id / country / place / coordinates / dates
- route fingerprint bzw. relevant route contacts
- relevante item refs/types/stage/day soweit Impact davon abhängt

Kein User-Label/Freitext, der fachlich nichts ändert.

### Event/fact fingerprint

Alle normalized fields, die Evaluation ändern können.

Array-/Provider-Reihenfolge darf Fingerprint nicht ändern.

Versioniere Fingerprints (`seasonal-context-v1`, `seasonal-fact-v1` oder gleichwertig) und dokumentiere Semantik.

---

## 16. Cross-domain Impact

Seasonal Impact ist nicht automatisch konkreter Ausfall.

Unterstütze konservativ:

- stage
- flight/route
- stay
- activity
- mobility
- rental_car
- day_plan

Beispiele:

- starke typische Regenzeit + Activity in betroffener Stage → `needs_recheck`/betroffene Planung, nicht behaupten `Activity fällt aus`
- saisonale Pass-/Straßenschließung mit source-backed spezifischem Road/Place Scope kann Mobility/Rental relevanter markieren
- allgemeines Country-Level Pattern darf nicht jedes einzelne Hotel als `affected` behaupten

Keine Preise/Crowding/Availability ohne echte Daten.

---

## 17. Presentation / Copy

Eigene Seasonal presentation classes, fachlich etwa:

- `timing_check`
- `timing_notice`
- `information`
- `unknown`

Kein Safety-Alarm-Vokabular.

Copy:

- `typischerweise`
- `kann beeinflussen`
- `für diese Region / diesen Zeitraum`
- `keine exakte Vorhersage`

Verboten ohne harte Evidence:

- `schlechte Reisezeit`
- `gefährlich`
- `nicht reisen`
- erfundene Prozentwahrscheinlichkeiten
- erfundene optimale Monate

Source/Reference Period/Freshness progressiv sichtbar.

---

## 18. API Boundary

Baue:

`POST /api/seasonal/evaluate`

Härtung mindestens analog Safety:

- `dynamic = 'force-dynamic'`
- nur JSON
- hard payload bytes
- strict schema
- `Cache-Control: private, no-store`
- rate-limit Preview/Dev
- provider only server-side
- keine Client Evidence
- kein Raw Provider Payload zurückgeben
- ehrliche API status `ok | unknown | unavailable` oder gleichwertig

`unknown` / `unavailable` darf nie wie `kein Problem` klingen.

---

## 19. Minimal Workspace Integration

Kein großer Workspace-Umbau.

Ergänze optional:

- `seasonalEvaluations?: SeasonalEvaluation[]` im Workspace
- ruhige Komponente, z. B. `ReisezeitHinweise`
- Desktop und Mobile analog zur bestehenden optionalen Safety-Naht
- nur rendern, wenn wirklich Evaluation/Summary sichtbar sein soll

Semantische Trennung:

- Safety: `Sicherheit & Störungen`
- Seasonal: z. B. `Reisezeit & Saison`

Keine permanente leere Karte.

Keine nicht funktionierenden Buttons. Falls `Bessere Reisezeiten ansehen` noch keinen echten source-backed Flow besitzt, **nicht als tote CTA einbauen**.

`Trotzdem so planen` wird in dieser Foundation nicht improvisiert persistiert; das kommt sauber im späteren Workspace-/Decision-Flow.

---

## 20. Guest / Account

Seasonal Engine selbst arbeitet auf `Trip` und ist storage-neutral.

- Guest und Account gleiche Domain
- kein separater Local-Seasonal-Truth-Pfad
- kein DB-only Verhalten
- keine Account-Pflicht nur für Evaluation

Wenn serverseitig Evaluations geliefert werden, beide Workspaces können dieselbe prop/contract nutzen.

---

## 21. Dokumentation / ADRs

Während der Implementierung erstellen/aktualisieren:

- `docs/TRAVEL_TIMING_SEASONAL.md` – Fachdokument
- `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ARCHITECTURE_AUDIT.md`
- `docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `JETNITY_HANDOFF.md`
- `ROADMAP.md`
- `ARCHITECTURE.md`
- `DECISIONS.md` – ADRs

ADRs mindestens für:

1. eigene Seasonal Truth-Domäne vs Safety
2. compute-on-read / keine DB-Persistenz
3. recurring window semantics
4. Evidence/Freshness/Reference Period Trennung
5. fail-closed timezone/geo behavior

Keine Dokumentation darf nach Abschluss noch behaupten, Safety sei aktiv oder Seasonal noch nicht begonnen, wenn das nicht mehr stimmt.

---

## 22. Pflicht-Testmatrix

`docs/TRAVEL_TIMING_SEASONAL_FOUNDATION_ACCEPTANCE.md` vollständig umsetzen.

Zusätzlich bewusst adversarial testen:

- malformed nested arrays / null rows / wrong enum runtime types
- invalid source URLs / future checkedAt / invalid dates
- `freshUntil` before checkedAt
- conflicting outcomes same key/scope/window
- same semantics different evidence URL
- provider > maxFacts
- provider timeout vs throw
- empty provider rows
- recurring `12-15 → 01-15`
- exact boundary days inclusive/exclusive klar dokumentiert
- Feb 29
- multi-stage same country different regions
- same place repeated different months
- route contact between stage windows
- UTC+14 / UTC-12 date edge
- Safety tests prove `seasonal_pattern` stays rejected in Safety

---

## 23. UI-Audit / Device Parity

Bestehenden Trip-Workspace-UI-Audit erweitern um Seasonal states, mindestens:

- no provider / no card product path
- seasonal unavailable when explicitly evaluated
- timing notice
- mixed tradeoff
- insufficient context
- stale/recheck
- conflicting source
- multi-destination seasonal state

Auf WebKit + Chromium und bestehender 8-Viewport-Matrix.

Keine horizontale Überläufe, keine abgeschnittenen Controls, keyboard/focus korrekt, keine Bedeutung nur über Farbe.

---

## 24. Full Gate vor Übergabe an ChatGPT

Auf **exakt finalem Runtime-Head** ausführen und Ergebnis versionieren:

- `npm test` – vollständig (Baseline 1481/1481)
- Typecheck
- Lint
- Hygiene / exports / dead / deps
- API-Schutz
- schema-bezug
- Production build – alle Seiten/Routes
- DB rights / RLS / security / parallelität unverändert
- UI-Audit WebKit + Chromium / 8 Viewports
- Git diff hygiene / keine Secrets

Dann:

1. `git fetch origin`
2. Branch gegen aktuellen `origin/main` prüfen
3. **0 behind** herstellen, ohne gültige Arbeit zu verlieren
4. finalen Runtime-Head pushen
5. GitHub Actions auf exakt diesem Head SUCCESS
6. Vercel Preview auf exakt diesem Head READY/SUCCESS
7. erst danach Docs-Lock, falls nötig; Runtime-SHA klar dokumentieren

---

## 25. Kosten / Migration / Provider

Für diesen Auftrag gelten harte Grenzen:

- **0 neue laufende Providerkosten**
- kein Providervertrag
- kein Live Secret
- keine Production-Migration
- Standardziel keine DB-Migration überhaupt

Falls eine kostenpflichtige oder migrationspflichtige Entscheidung nötig wird: nicht ausführen; Product Owner fragen.

---

## 26. Übergabe / Abschlussstatus

Wenn technisch fertig:

- PR bleibt Draft
- keine eigene Merge-Freigabe erteilen
- keine Production-Migration
- keine Provider-Aktivierung

Abschlussmeldung muss enthalten:

- Branch
- Draft PR
- finaler Runtime-Head
- finaler Docs-Head, falls abweichend
- origin/main SHA und ahead/behind
- Testzahlen
- UI-Audit
- Build
- DB-Gates
- GitHub Actions Run
- Vercel Deployment
- Kosten
- Migrationen
- bekannte Nicht-Blocker / spätere Gates
- exakter nächster Schritt: unabhängiger ChatGPT-Review

---

## 27. Stop-Kriterium

Nach Umsetzung und Fixes aus unabhängigen Reviews nicht endlos perfektionieren.

Merge-blocking bleibt nur ein konkreter/reproduzierbarer oder direkt code-derived Defekt mit relevantem Einfluss auf:

- Seasonal Truth / Evidence / Freshness
- falsche saisonale Warnung / falsche Entwarnung
- Safety-vs-Seasonal-Trennung
- Geo-/Zeit-/Recurring-Window-Wahrheit
- Cross-domain Source of Truth
- Security / Client Trust / Secrets
- Guest/Account-Parität
- Datenverlust
- Production Rollout / Migration / Provider-Gate
- zentrale Foundation-Funktionalität

Style, theoretische Mikro-Härtung und provider-spezifische Details, die erst beim realen Adapter geprüft werden können, sind keine Foundation-Endlosschleife.

---

## 28. Leitsatz

> **Seasonal sagt nicht, ob die Reise „gut“ oder „schlecht“ ist. Jetnity erkennt belastbar, welcher typische saisonale Kontext zu dieser konkreten Reisezeit und diesem konkreten Ort passt, erklärt mögliche Auswirkungen und lässt die Entscheidung beim Nutzer.**
