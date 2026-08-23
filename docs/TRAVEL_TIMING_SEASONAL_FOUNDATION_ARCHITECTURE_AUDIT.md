# Travel Timing & Seasonal Intelligence – Foundation Architecture Audit

Stand: 23. August 2026  
Status: **Ist-Audit gegen aktuellen `origin/main` verifiziert; Implementierung auf Feature-Branch gestartet**  
Ursprüngliche Audit-Basis: `main` @ `211f8b2e176127ec7cb7be370bd52c5b6c94b42c`  
Verifizierte Arbeitsbasis: `origin/main` @ `cd220beb44d90ae376feeb8de9db8a3afb808d60`

Verbindlich:

- `docs/TRAVEL_TIMING_SEASONAL_INTELLIGENCE_POLICY.md`
- `docs/PROVIDER_INTEGRATION_READINESS_POLICY.md`
- `docs/TRAVEL_SAFETY_DISRUPTION_INTELLIGENCE_POLICY.md`
- `docs/PRODUCT_QUALITY_STANDARD.md`
- `docs/LOGIC_STANDARD.md`
- `docs/UX_INFORMATION_ARCHITECTURE_STANDARD.md`
- `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`

---

## 0. Executive Summary

| Bereich | Ist-Stand | Konsequenz für Seasonal |
| --- | --- | --- |
| Trip Graph | kanonischer `Trip` für Guest + Account | wiederverwenden, kein Seasonal-Schattenmodell |
| Foundation D | Route-/Transit-Truth vollständig auf `main` + Production | einzige Route-/Transit-Wahrheit |
| Foundation E | Traveller Context vollständig auf `main` + Production | Seasonal ist grundsätzlich traveller-neutral; Citizenship nicht unnötig sammeln |
| Readiness | provider-neutral, fail-closed, Evidence/Freshness/Fingerprint | Architekturprinzipien wiederverwenden, Regulatory-Truth nicht vermischen |
| Safety | `lib/safety/` provider-neutral, compute-on-read, kein DB-Schema, Port `null` | engste technische Schwester; Truth-Klassen strikt getrennt halten |
| Safety Seasonal Guard | Safety kennt `nature='seasonal_pattern'`, verwirft diese Facts aber bewusst | Seasonal braucht **eigene Domain/Engine/Port**, nicht Safety-Warnungen umdeuten |
| Workspace | Safety ist optional in der Übersicht; `Jetzt wichtig` noch nicht als großer Intelligence-Layer gebaut | nur minimale Seasonal-Naht, kein großer Workspace-Umbau |
| Provider | kein echter Seasonal-/Weather-/Climate-Provider | Factory `null`, Test-Doubles only |
| DB | keine abgeleitete Safety-Tabelle | Empfehlung: auch Seasonal zunächst compute-on-read, keine Migration |

**Architektur-Empfehlung:** eigene provider-neutrale Domäne `lib/seasonal/`, compute-on-read, separater Provider-Port, getrennte Evidence-/Freshness-Semantik, harte Fail-Closed-Grenzen, keine echte Datenquelle, keine DB-Migration und nur minimale Workspace-Einbettung.

---

## 1. Bestehende Wahrheit, die Seasonal wiederverwenden muss

### 1.1 Trip / Stages / Dates

Kanonischer Anwendungstyp bleibt `Trip` aus `types/trips.ts`.

Relevante Felder:

- `Trip.startDate`, `Trip.endDate`
- `Trip.stages[]`: `id`, `countryCode`, `placeId`, `latitude`, `longitude`, `arrivalDate`, `departureDate`
- `Trip.days[]`: `stageId`, `dayDate`
- `Trip.items`: über Stage/Day verknüpfte Flights, Stays, Activities, Mobility, Rental Cars usw.

Seasonal darf keine Orts-/Datumswahrheit aus Titeln, Notizen oder LLM-Text ableiten.

### 1.2 Route Truth

Foundation D ist die einzige kanonische Flight-/Transit-Quelle:

- `lib/route/domain.ts`
- `lib/route/ableitung.ts`
- `routeFactsAusGraph(...)`
- Flight-Itinerary in `trip_items.metadata.routeItinerary`

Seasonal darf Transit-/Airport-/Routebezug nur daraus ableiten. Keine Rekonstruktion aus Item-Titeln.

### 1.3 Traveller Context

Foundation E unterstützt mehrere Staatsbürgerschaften und Dokumente. Für typische saisonale Klima-/Erreichbarkeitsmuster sind diese Daten **nicht automatisch relevant**.

Verbindliche Datensparsamkeit:

> Seasonal darf Citizenship, Residence oder Dokumente nur dann in einen späteren Providervertrag aufnehmen, wenn eine konkrete fachliche Seasonal-Entscheidung davon tatsächlich abhängt. Der heutige Foundation-Port bleibt traveller-neutral.

---

## 2. Safety als Schwesterarchitektur – wiederverwenden, aber nicht vermischen

Safety ist seit PR #37 auf `main`:

- eigene Truth-Domäne `lib/safety/`
- `safetyProviderAus()` ist `null`
- compute-on-read, keine Safety-Tabelle
- serverseitiger Port + strict runtime normalization
- Evidence/Freshness/Conflict/Geo/Temporal/Impact/Presentation getrennt
- `POST /api/safety/evaluate` ist geschlossen, `private, no-store`, payload-limitiert, rate-limited
- Browser-/LLM-Felder dürfen keine Official Evidence setzen
- Timeout/invalid/partial responses sind fail-closed
- Date-only und zonenlose lokale Routezeiten werden nicht als erfundene UTC-Instants interpretiert

Besonders wichtig: `SafetyNature = 'acute' | 'seasonal_pattern'`, aber die Safety-Engine filtert `seasonal_pattern` bewusst aus. Das ist eine **Truth-Grenze**: Seasonal Pattern darf nicht zu Safety-Warnung werden.

### Konsequenz

Seasonal soll dieselben Architekturqualitäten besitzen, aber nicht `SafetyEvaluation` wiederverwenden oder Safety-Severity umetikettieren.

Erlaubt ist nur die Extraktion wirklich generischer Low-Level-Helfer (z. B. streng validierte Kalender-/Zeit-/Geo-Primitiven) in ein neutral benanntes Shared-Modul, **wenn**:

1. Semantik identisch ist,
2. Safety-Regressionstests vollständig grün bleiben,
3. keine Safety-/Seasonal-Domain-Typen in das Shared-Modul lecken,
4. die Extraktion kleiner und verständlicher ist als semantische Duplikation.

Kein großer Safety-Refactor in diesem Block.

---

## 3. Seasonal Truth braucht eigene Evidenzklassen

Die Policy verlangt mindestens die Trennung:

1. `seasonal_pattern` / Climatology
2. `official_seasonal_risk_window`
3. `forecast_outlook`
4. `active_warning` / Event – **gehört zu Safety und darf Seasonal nicht als Seasonal-Wahrheit anzeigen**

Damit Seasonal provider-ready ist, muss der interne Vertrag mindestens unterscheiden:

- **Travel window**: wann das Muster für die Reise gilt
- **Reference period**: aus welchem historischen/klimatologischen Zeitraum die Aussage stammt
- **Evidence freshness**: wann die Quelle/Providerantwort geprüft/aktualisiert wurde

Diese drei Zeitachsen dürfen nicht vermischt werden.

### Wiederkehrende Fenster

Ein Monatslabel allein ist nicht präzise genug. Die Foundation muss wiederkehrende saisonale Fenster deterministisch modellieren, z. B.:

- `annual_recurring`: Month/Day → Month/Day, inkl. Jahreswechsel (`11-01` → `03-31`)
- `absolute`: konkretes Start-/Enddatum für eine offiziell definierte Periode / Forecast

Leap-Day und ungültige Kalenderwerte fail-closed.

---

## 4. Geo-Truth

Seasonal benötigt mindestens diese Präzisionsstufen:

- country
- admin region
- city/place
- point/radius, wenn Quelle und Tripkoordinaten dies erlauben
- airport/route nur, wenn die Quelle explizit Transport-/Transitbezug besitzt

Regeln:

- feinere Quelle darf nicht pauschal auf das ganze Land hochgestuft werden
- fehlen kanonische Membership/Koordinaten, bleibt `insufficient_context`
- Country-Level-Quelle darf Country-Level bleiben
- Stage `countryCode`, `placeId`, lat/lon und Foundation-D-Route sind die zulässigen Trip-Facts
- title-only Aktivitäten/Hotels erzeugen keine erfundene Geo-Betroffenheit

---

## 5. Temporal Truth

Seasonal ist überwiegend kalendertagbasiert. Trotzdem gelten die bei Safety hart erarbeiteten Zeitzonenregeln:

- Date-only ist ein zonenloser Kalendertag, kein UTC-Instant
- Foundation-D `HH:mm` ist lokale Ortszeit ohne Zeitzone
- kein stilles Anhängen von `Z`
- Date/clock ↔ UTC-Instant bleibt innerhalb einer möglichen globalen Offset-Hülle `insufficient_context`, wenn keine belastbare Zone/Offset-Truth vorliegt
- wiederholte Routekontakte bleiben einzelne Kontaktfenster, kein künstliches Min/Max-Dauerfenster

Für `annual_recurring` muss die Engine das Travel Window auf die tatsächlich berührten Reisejahre projizieren und Jahreswechsel korrekt behandeln.

---

## 6. Freshness / Source Truth

Safety nutzt bewusst kurze Freshness-Grenzen für akute Ereignisse. Diese dürfen **nicht** blind auf Seasonal übertragen werden.

Seasonal braucht getrennt:

- `checkedAt`: wann Jetnity/Provider die Quelle geprüft hat
- `publishedAt` / `updatedAt`: Quellenstand
- `freshUntil`: Adapter-/Quellenvertrag für nächste Prüfung, soweit belastbar
- `referencePeriod`: historische/klimatologische Datenbasis
- `validFrom` / `validUntil`: wenn eine offizielle saisonale Periode selbst zeitlich gültig ist

Ohne belastbare Freshness-Semantik darf eine Antwort nicht als `current` behauptet werden. Keine erfundene Default-Gültigkeit nur weil Climatology langsamer altert.

---

## 7. Ergebnis- und UX-Semantik

Seasonal darf keine Safety-Wörter wie `critical_warning`, `do_not_travel` oder pauschal `gefährlich` erben.

Empfohlene Präsentationsklassen:

- `timing_check`
- `timing_notice`
- `information`
- `unknown`

Empfohlene Relevanz:

- `applies`
- `not_applies`
- `insufficient_context`
- `unknown`

Ein Providerfact kann einen source-backed Outcome tragen, z. B.:

- `less_favorable`
- `mixed_tradeoff`
- `favorable_context`
- `unknown`

Jetnity darf daraus **nicht** automatisch `schlechte Reisezeit` machen.

Copy-Grundsatz:

> „Dein Aufenthalt fällt in dieser Region typischerweise in … Das kann … beeinflussen.“

Nicht:

> „Du solltest nicht reisen.“ / „Diese Zeit ist schlecht.“

---

## 8. Cross-Domain Impact

Bestehende Trip-Refs erlauben eine konservative Impact-Ableitung auf:

- stage
- flight / route
- stay
- activity
- mobility / transfer
- rental car
- day plan

Ein Seasonal-Fact darf ein konkretes Item nur als betroffen markieren, wenn die Beziehung über Stage/Day/Route/Geo belegbar ist. Sonst `needs_recheck` / `unknown`.

Preis-/Crowding-/Verfügbarkeitsvorteile dürfen **nicht** erfunden werden. Solche Trade-offs erst, wenn echte Datenquellen dafür existieren.

---

## 9. Workspace Ist-Stand

`TripWorkspace` besitzt aktuell optionale `safetyEvaluations` und `ReiseSicherheit`. Auf Desktop steht Safety oberhalb Readiness; mobil wird Safety in die Übersicht gereicht. `Jetzt wichtig` als endgültige Intelligence-Hierarchie ist noch nicht gebaut.

Seasonal Foundation soll daher:

- eine optionale `seasonalEvaluations`-Naht hinzufügen
- eine ruhige Seasonal-Komponente nur bei übergebenen / sinnvollen Evaluations anzeigen
- keinen großen Workspace-Umbau vorziehen
- Safety und Seasonal visuell/semantisch unterscheidbar halten
- keine permanente leere `Reisezeit`-Karte ohne Evaluation zeigen

Die finale Priorisierung in `Jetzt wichtig` kommt im großen Workspace-Block.

---

## 10. API / Security / Provider-Gate

Empfohlene Naht analog Safety:

- `POST /api/seasonal/evaluate`
- `application/json` only
- hard byte limit
- server-side runtime schema
- `Cache-Control: private, no-store`
- Preview/Dev in-process rate limit zulässig
- Provider timeout + AbortSignal
- Provider factory `null`
- keine Secrets
- keine Browser-/LLM-Evidence
- keine Provider-Rohdaten im Clientbundle
- malformed / partial provider response → fail-closed, niemals clean/favorable by omission

Vor einem echten kostenpflichtigen Production-Provider ist ein global persistenter Rate-/Kosten-Schutz ein separates Gate.

---

## 11. Persistenzentscheidung

Für diese Foundation gibt es keinen nachgewiesenen Bedarf für eine neue DB-Tabelle. Seasonal Truth ist externe, freshness-sensitive, abgeleitete Information.

**Empfehlung: keine DB-Migration.** Compute-on-read analog Safety.

Falls Cursor während der Implementierung doch Persistenz für fachlich zwingend hält: **STOP**, Begründung dokumentieren und vor Migration Product-Owner-/Architecture-Freigabe einholen. Keine Development- oder Production-Migration eigenmächtig.

Eine spätere persistente Nutzerentscheidung wie `Trotzdem so planen` gehört nicht als improvisierter Local-State in diese Foundation. Sie wird im großen Workspace-/Decision-Flow sauber modelliert.

---

## 12. Haupt-Risiken, die im Auftrag explizit getestet werden müssen

1. Seasonal Pattern wird fälschlich Safety Warning.
2. Aktive Warnung wird fälschlich als Historical/Seasonal Kontext angezeigt.
3. Monats-/Jahreswechsel (`Nov–Mar`) wird falsch gematcht.
4. Southern-Hemisphere / verschiedene Jahre werden durch naive Monatslogik falsch bewertet.
5. Date-only wird als UTC-Mitternacht behandelt.
6. Regionale Quelle wird auf ganzes Land hochgestuft.
7. Title-only Item erzeugt Geo-Truth.
8. Stale/unknown Providerantwort erzeugt `alles gut`-Copy.
9. Teilweise malformed Antwort lässt valide positive/negative Zeilen selektiv als clean erscheinen.
10. Doppelte/widersprüchliche Providerfacts sind order-dependent.
11. Wiederholte Destination/Routekontakte werden zu einem künstlichen Dauerfenster verschmolzen.
12. Nutzeränderung von Datum/Ziel invalidiert Evaluation/Fingerprint nicht.
13. Alternative Zeiträume werden ohne source-backed Evidence erfunden.
14. Cross-domain Impact behauptet konkrete Ausfälle ohne belegte Beziehung.
15. Guest und Account erhalten unterschiedliche fachliche Ergebnisse für denselben Trip-Graph.

---

## 13. Definition des empfohlenen Foundation-Ziels

Nach diesem Block soll Jetnity **noch keine echte Aussage über Monsun, Hurrikansaison, Hitze usw. in Production treffen**, weil kein Live-Provider aktiv ist.

Aber Jetnity soll vollständig provider-ready sein für:

> **Trip/Stage/Route + konkrete Reisedaten + source-backed Seasonal Fact → deterministische, evidence-backed, geo-/zeitpräzise, fail-closed Seasonal Evaluation → ruhige Workspace-Darstellung + nachvollziehbare mögliche Auswirkungen.**

Damit kann später ein seriöser Climate-/Seasonal-/Forecast-Provider angeschlossen werden, ohne Domain, Workspace oder Truth-Grenzen neu zu bauen.

---

## 14. Cursor-Verifikation gegen aktuellen Code (23. August 2026)

Vor Runtime-Code wurde das versionierte Audit gegen den tatsächlichen Stand von `origin/main` @ `cd220beb` geprüft.

| Prüfung | Ergebnis |
| --- | --- |
| `git fetch origin` | ausgeführt |
| Branch-Basis | `feat/travel-timing-seasonal-intelligence` von `origin/main` @ `cd220beb` |
| Safety PR #37 auf `main` | ja; Squash-Merge `2cceee0658cc426d66974779b525c8bf9a623534` ist Ancestor |
| Commits `211f8b2e..cd220beb` | nur Dokumente: Acceptance, Cursor-Task, Active-Work-/Handoff-Vorbereitung |
| Runtime-Diff seit Audit-SHA | **leer** – keine Änderung an `lib/`, `app/`, `components/`, `types/` oder Tests |
| `lib/seasonal/` | existiert nicht |
| `lib/safety/` | vollständig vorhanden, `safetyProviderAus()` bleibt `null` |
| `app/api/safety/evaluate/route.ts` | geschlossen, `private, no-store`, Rate-Limit, Body-Cap |
| `seasonal_pattern`-Guard | `engine.ts` filtert `nature === 'seasonal_pattern'` vor Evaluation; Tests 31 / Re-Review / Final belegen Ablehnung |
| Route Truth | `routeFactsAusGraph` in `lib/route/ableitung.ts`; Safety konsumiert sie, dupliziert sie nicht |
| Workspace | optionale `safetyEvaluations` in `TripWorkspace`; Guest/Account übergeben sie nicht; `ReiseSicherheit` bleibt ohne Prop unsichtbar |
| UI-Audit | Safety-Zustände `safety-kein-provider`, `safety-unavailable`, `safety-kritisch-eine-etappe` vorhanden |
| DB | keine Safety-Tabelle; keine Seasonal-Migration nötig oder vorhanden |

**Abweichung Audit ↔ Code:** keine fachliche Runtime-Abweichung. `ARCHITECTURE.md` auf `main` nennt Safety noch als Draft-PR #37; Handoff/Roadmap/Active Work sind bereits auf den gemergten Stand nachgezogen. Dieser Docs-Widerspruch wird im Seasonal-Branch korrigiert, nicht als fehlende Safety-Implementierung missverstanden.

**Konsequenz:** Das Audit bleibt gültig. Seasonal wird als eigene Domäne `lib/seasonal/` gebaut, ohne Safety-Evaluation umzudeuten und ohne Safety-Refactor.
