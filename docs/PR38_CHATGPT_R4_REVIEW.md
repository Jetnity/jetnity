# PR #38 – ChatGPT Independent Re-Review R4

Stand: 23. August 2026  
Status: **REQUEST CHANGES – R3-Fixes bestätigt, zwei konkrete Merge-Blocker 8–9 offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Main bei R4: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
R3-Runtime-Head: `4f9eb1e8c524494fa8ab300bdfe24ec372e9e109`  
PR-Head zu R4-Beginn: `218961b337b585da691d6b310dda24b9653d4568`  
Sync zu R4-Beginn: **20 ahead, 0 behind** `main`  
PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 1. R4-Urteil

Der unabhängige R4-Re-Review wurde nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` und dem verbindlichen Stop-Kriterium durchgeführt.

Die beiden R3-Fixes sind **bestätigt geschlossen**:

- Residual Blocker 5: `active_warning` / `acute` / `acute_event` werden als `rejected_acute` mit `acuteRejected=true` transportiert; acute-only ist fail-closed `unknown` und kein `checked_empty` / vollständiges `ok`.
- Blocker 7: rückwärts laufende Top-Level- und Stage-Datumsbereiche werden an der untrusted API-Grenze abgelehnt; die Kalender-/Relevanzhelfer degradieren unerwartet umgekehrte Intervalle zu `insufficient` statt zu `before` / `after` / `not_applies`.

Die Exact-Head-Evidenz für Runtime `4f9eb1e8` ist unabhängig bestätigt:

- GitHub Actions Run `32643429557`: **SUCCESS**
- Vercel Deployment `dpl_ERBqeUKG7NWQ2agr4GiR5JpAxxit`: **READY**, Commit exakt `4f9eb1e8c524494fa8ab300bdfe24ec372e9e109`
- aktueller Docs-/Evidence-Head `218961b3`: GitHub Actions **SUCCESS**, Vercel **READY**
- zwischen `4f9eb1e8` und `218961b3` liegen nur Dokumentationsänderungen; keine Seasonal-Runtime-Datei wurde verändert
- Branch zu R4-Beginn: **20 ahead, 0 behind** `main`

Trotzdem gibt es noch **kein Closure/PASS**. R4 hat zwei direkt code-abgeleitete Defekte gefunden, die das Stop-Kriterium erfüllen:

1. **Blocker 8:** Ein geordnetes, aber widersprüchliches Top-Level-Reisefenster kann eine konkret überlappende Stage/Route vorzeitig zu `not_applies` machen.
2. **Blocker 9:** Ein Item, dessen Stage-Beziehung über `dayId → day.stageId` eindeutig belegt ist, wird von der Seasonal-Cross-Domain-Impact-Logik nicht der betroffenen Stage zugeordnet.

PR #38 bleibt Draft. Kein Mark Ready und kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.

---

## 2. R3-Fixes – Closure bestätigt

### 2.1 Rejected-Acute

`lib/seasonal/normalisieren.ts` materialisiert abgewiesene Acute-/Safety-Klassen jetzt als:

```ts
evidenceClass: 'rejected_acute'
acuteRejected: true
```

`lib/seasonal/engine.ts` erhält diese Semantik auch in der API-visible Evaluation. `lib/seasonal/status.ts` behandelt eine acute-only Antwort als unvollständig / `unknown`, blendet rejected-domain Facts aus den sichtbaren Seasonal-Hinweisen aus und erzeugt kein cleanes `checked_empty`.

Die Regressionen decken `active_warning`, `acute`, `acute_event`, acute-only und gemischte gültige Seasonal + Acute-Facts ab.

**R3 Residual Blocker 5: geschlossen.**

### 2.2 Reverse-Date

`lib/seasonal/schema.ts` lehnt jetzt ab:

- Top-Level `startDate > endDate`
- Stage `arrivalDate > departureDate`

`lib/seasonal/kalender.ts` und `lib/seasonal/relevanz.ts` degradieren unerwartet umgekehrte Intervalle zusätzlich fail-closed zu `insufficient` statt eine negative Relevanz zu erfinden.

Die R3-Reproduktion `2026-09-20 → 2026-09-10` plus überlappende Thailand-Stage erzeugt nicht mehr falsch `not_applies`.

**R3 Blocker 7: geschlossen.**

---

## 3. Neuer Merge-Blocker 8 – Top-Level-Zeitfenster kann konkreten Stage-/Route-Kontakt falsch überstimmen

### Betroffene Dateien

- `lib/seasonal/relevanz.ts`
- `lib/seasonal/fenster.ts`
- `lib/seasonal/kalender.ts`
- `lib/seasonal/schema.ts` nur als Trust-Boundary-Kontext
- Regressionen in `lib/seasonal/engine.test.ts` / ggf. `fenster.test.ts`

### Verbindlicher Invariant

Der Seasonal-Auftrag verlangt:

- mehrere Destinationen / Stages separat bewerten;
- wiederholte Routekontakte separat bewerten;
- incomplete bzw. widersprüchlicher Kontext darf nicht zu `not_applies` hochgestuft werden;
- feinere, konkrete Trip-Refs dürfen nicht durch eine gröbere widersprüchliche Hülle falsifiziert werden.

### Problem

Der R3-Fix verhindert nur **umgekehrte** Top-Level-Intervalle. Ein Top-Level-Intervall kann aber formal korrekt geordnet und trotzdem zu den konkreten Stage-/Route-Facts widersprüchlich sein.

`zeitAufRefsAnwenden()` macht aktuell zuerst:

```ts
const trip = kontaktImTravelWindow(kontext.startDate, kontext.endDate, fenster)
if (!tripUmgekehrt && (trip === 'before' || trip === 'after')) {
  return { ...raum, relevance: 'not_applies', affectedRefs: [] }
}
```

Damit wird **vor** der Prüfung der bereits räumlich konkret betroffenen Stage-/Airport-Refs global abgebrochen.

### Direkt reproduzierbarer, schema-gültiger Fall

Untrusted Request:

- `startDate = 2026-09-01`
- `endDate = 2026-09-05`  ← korrekt geordnet
- Stage `stage-bkk`:
  - `countryCode = TH`
  - `arrivalDate = 2026-09-12`
  - `departureDate = 2026-09-16`  ← ebenfalls korrekt geordnet
- belastbarer Thailand-Seasonal-Fact:
  - Travel Window `2026-09-12 → 2026-09-16`

`seasonalAnfrageSchema` akzeptiert diesen Request: Es prüft Top-Level- und Stage-Reihenfolge jeweils einzeln, aber keine globale Containment-Beziehung.

Die räumliche Relevanz liefert für Thailand die konkrete Stage als `affectedRef`. Danach vergleicht `zeitAufRefsAnwenden()` jedoch zuerst das gröbere Top-Level-Fenster `2026-09-01 → 2026-09-05` mit dem Seasonal Window und erhält `after`. Der Code gibt sofort `not_applies` zurück und prüft `stage-bkk` nicht mehr – obwohl deren konkrete Daten exakt überlappen.

Das ist kein hypothetischer „unmöglicher“ Graph: Der kanonische `reiseSchema`-Vertrag prüft zwar `trip.endDate >= trip.startDate` und gültige Stage-Referenzen, verlangt aber derzeit **nicht**, dass alle Stage-Daten innerhalb der Top-Level-Tripdaten liegen. Ein solcher Zustand kann daher als kanonisch gelesener/legacy/sequenziell geänderter Trip existieren.

Dasselbe Problem betrifft Route-/Airport-Refs, wenn konkrete Foundation-D-Kontaktdaten der gröberen Top-Level-Hülle widersprechen.

### Warum merge-blocking

- Eine konkret passende Stage/Route kann fälschlich als **nicht zutreffend** dargestellt werden.
- Das ist genau dieselbe Truth-Fehlerklasse wie R3 Blocker 7, nur eine Ebene tiefer.
- `not_applies` ist eine negative fachliche Aussage und darf nicht aus widersprüchlicher gröberer Context-Hülle entstehen.
- Multi-Stage-/Route-Separation ist zentrale Foundation-Funktionalität und explizites Acceptance-Kriterium.

### Erforderliche Korrektur

Bevorzugte fachliche Regel:

- Wenn `räumlicheRelevanz()` bereits konkrete `affectedRefs` besitzt, müssen deren eigenen Kontakte die zeitliche Relevanz bestimmen.
- Ein Top-Level `before` / `after` darf diese konkreten Refs **nicht vorzeitig** zu `not_applies` löschen.
- Konkreter Ref überlappt → `applies`.
- Konkreter Ref klar ausserhalb → kann für diesen Ref entfallen.
- Konkreter Ref unklar / widersprüchlich → `insufficient_context`, nicht `not_applies`.
- Das grobe Top-Level-Fenster darf als Fallback dienen, wenn keine belastbareren konkreten Ref-Kontakte existieren; es darf konkretere Truth nicht überstimmen.

Alternativ wäre eine neue globale Canonical-Trip-Invariante „alle Stage-/Route-Zeiten müssen innerhalb Trip start/end liegen“ denkbar, aber das wäre eine breitere Produkt-/DB-Entscheidung und darf in diesem Seasonal-Fix nicht still erfunden werden. Der Seasonal-Code muss mit dem aktuell gültigen Trip-Vertrag korrekt umgehen.

### Pflicht-Regressionen

Mindestens:

1. Top-Level `2026-09-01 → 2026-09-05`, passende Thailand-Stage `2026-09-12 → 2026-09-16`, Seasonal Window `2026-09-12 → 2026-09-16` → **`applies`**, niemals `not_applies`.
2. Gleiches Muster mit einem konkreten Airport-/Routekontakt ausserhalb der groben Top-Level-Hülle → konkreter überlappender Kontakt darf nicht global verworfen werden.
3. Top-Level klar ausserhalb und **keine** konkreten belastbaren Ref-Kontakte → bisheriges `not_applies` darf erhalten bleiben.
4. Konkrete Refs alle klar ausserhalb → `not_applies` bleibt möglich.
5. widersprüchlicher/fehlender konkreter Ref-Kontakt + grobe Hülle ausserhalb → fail-closed `insufficient_context`, wenn die konkrete räumliche Betroffenheit bereits feststeht.
6. bestehende Reverse-Date-, Recurring-, Leap-Day- und Timezone-Regressionen bleiben grün.

---

## 4. Neuer Merge-Blocker 9 – belegte Day→Stage-Beziehung wird für Item-Impact ignoriert

### Betroffene Dateien

- `lib/seasonal/impact.ts`
- `lib/seasonal/kontext.ts`
- ggf. gemeinsame kleine Helper-Funktion für effektive Item-Stage-Zuordnung
- `lib/seasonal/engine.test.ts`
- API-Regressionen optional in `lib/seasonal/anfrage.test.ts`

### Verbindlicher Invariant

Acceptance §5 verlangt Cross-Domain-Impact auf `stage`, `flight/route`, `stay`, `activity`, `mobility/transfer`, `rental car` und `day plan`.

Ein konkretes Item darf nur direkt `affected` sein, wenn eine Stage-/Day-/Route-/Geo-Beziehung belegt ist; sonst konservativ `needs_recheck` / `unknown`.

Der heutige Trip-Typ trägt sowohl:

- `TripDay.stageId`
- `TripItem.dayId`
- optional `TripItem.stageId`

Damit ist `item.dayId → day.stageId` eine kanonische, strukturierte Beziehung und keine Titel-/Text-Heuristik.

### Problem

`seasonalReisekontext()` übernimmt bei Items `stageId` und `dayId` getrennt. `seasonalImpactAus()` berücksichtigt für Stage-basierten Item-Impact aber ausschließlich:

```ts
if (item.stageId && stageIds.has(item.stageId)) {
  impacts.push(...)
}
```

Die vorhandene, eindeutige Beziehung über `item.dayId → kontext.days[].stageId` wird nicht benutzt.

### Direkt reproduzierbarer, API-gültiger Fall

Request/Trip-Graph:

- Stage `stage-goa`
- Day `day-goa-1` mit `stageId = stage-goa`
- Activity `act-goa` mit:
  - `dayId = day-goa-1`
  - `stageId = null`
- Seasonal-Fact gilt für `stage-goa`
- `affectedDomains = ['activity']`

Dieser Graph ist an der Seasonal-API-Grenze gültig: `item.dayId` zeigt auf einen existierenden Tag; ein `item.stageId` ist optional. `tripAusSeasonalAnfrage()` legt das Item korrekt in genau diesen Tag. Die Day→Stage-Beziehung ist damit explizit und strukturiert belegt.

Trotzdem erzeugt `seasonalImpactAus()` **keinen `activity`-Impact** für `act-goa`, weil `item.stageId` null ist. Separat wird nur ein `day_plan`-Impact für den Tag erzeugt.

Folge: `naechsteAktionAus()` sieht keine Activity und kann z. B. `check_stage` statt des fachlich spezifischeren `check_activity` liefern. Die Foundation verliert damit eine belegte Cross-Domain-Beziehung.

### Warum merge-blocking

- zentrale Cross-Domain-Foundation-Funktionalität wird für einen gültigen Graphen unvollständig abgeleitet;
- der Fehler betrifft nicht nur interne Metadaten, sondern auch die abgeleitete nächste Aktion;
- die Beziehung ist kanonisch vorhanden – Jetnity muss dafür nichts erfinden;
- bestehender Test 27 deckt nur den Fall ab, in dem das Activity-Item **zusätzlich selbst `stageId` trägt** und verfehlt deshalb diese Lücke.

### Erforderliche Korrektur

Konservativ eine effektive Stage-Beziehung für Items ableiten:

1. Wenn `item.stageId` vorhanden und gültig ist → diese direkte Beziehung verwenden.
2. Wenn `item.stageId` fehlt, aber `item.dayId` auf einen Tag mit `day.stageId` zeigt → diese belegte Day→Stage-Beziehung verwenden.
3. Keine Ableitung aus Titel, Item-Text oder bloßem Datum.
4. Bei widersprüchlicher direkter `item.stageId` vs. `day.stageId` an untrusted API-Grenze weiterhin fail-closed; bestehende Schema-Regel nicht lockern.
5. Für interne/legacy Graphen mit widersprüchlicher Doppelbeziehung nicht still einen Gewinner erfinden.

### Pflicht-Regressionen

Mindestens:

1. Activity `stageId=null`, `dayId` zeigt auf Day mit betroffener `stageId` → `activity: needs_recheck` vorhanden.
2. Gleiches für Stay/Transfer/Rental-Car, soweit der Domain-Filter den Typ zulässt.
3. `affectedDomains=['activity']` begrenzt weiterhin auf Activity.
4. Day gehört zu anderer Stage → kein falscher Item-Impact.
5. Item ohne `stageId` und ohne Day→Stage-Beziehung → kein erfundener Stage-Impact.
6. direkte `item.stageId`-Beziehung funktioniert unverändert.
7. `nextAction` wird bei belegter betroffener Activity zu `check_activity`.
8. Guest/Account identischer Graph bleibt identisch.

---

## 5. R4 Reality-/Gate-Lock

Unabhängig verifiziert:

- PR #38: **open, Draft, mergeable, nicht gemergt**
- `main`: `cd220beb44d90ae376feeb8de9db8a3afb808d60`
- R3-Runtime: `4f9eb1e8c524494fa8ab300bdfe24ec372e9e109`
- PR-Head zu R4-Beginn: `218961b337b585da691d6b310dda24b9653d4568`
- Branch: **20 ahead, 0 behind** `main`
- Runtime `4f9eb1e8`: GitHub Actions **SUCCESS** (Run `32643429557`)
- Runtime `4f9eb1e8`: Vercel **READY**, Deployment `dpl_ERBqeUKG7NWQ2agr4GiR5JpAxxit`, Commit-Metadaten exakt `4f9eb1e8`
- aktueller Docs-/Evidence-Head `218961b3`: GitHub Actions **SUCCESS** (Run `32644542681`)
- aktueller Docs-/Evidence-Head `218961b3`: Vercel **READY**, Deployment `dpl_D5XUmap2LVproLHT1MBSkvwzFuHc`
- Diff `4f9eb1e8 → 218961b3`: ausschließlich Dokumentationsdateien, keine Seasonal-Runtime-Änderung
- kein Live-Seasonal-Provider, keine Seasonal-DB-Migration, keine neuen Secrets oder laufenden Kosten

Der von Cursor dokumentierte lokale Full Gate auf Runtime `4f9eb1e8` (`1557/1557`, Typecheck/Lint/Hygiene, Production Build, UI-Audit, DB/Security/Parallelität) ist mit der Remote-Exact-Head-Evidenz konsistent. R4 übernimmt ihn nicht als Fehlerfreiheitsbeweis, sondern nur als Gate-Evidenz.

---

## 6. Stop-Kriterium / nächster Schritt

R4 verlängert den Review nicht wegen Stil, optionaler Architektur oder theoretischer Perfektion. Blocker 8 und 9 sind konkrete, direkt code-abgeleitete Fälle mit Einfluss auf:

- Seasonal Truth / `not_applies`
- Multi-Stage-/Route-Relevanz
- Cross-Domain-Impact
- Nutzeraktion / zentrale Foundation-Funktionalität

Cursor soll ausschließlich:

1. Blocker 8 schließen: konkrete Stage-/Route-Kontakte dürfen nicht von einer widersprüchlichen gröberen Top-Level-Hülle vorzeitig zu `not_applies` gemacht werden;
2. Blocker 9 schließen: belegte `item.dayId → day.stageId`-Beziehung in der konservativen Item-Impact-Ableitung berücksichtigen;
3. die oben genannten adversarial Regressionen ergänzen;
4. danach den vollständigen Exact-Head-Gate auf dem neuen Runtime-Head ausführen und erneut **0 behind** verifizieren.

Danach folgt R5 als unabhängiger Closure-Re-Review nach demselben Stop-Kriterium.

Bis dahin: **REQUEST CHANGES. PR bleibt Draft. Kein Mark Ready. Kein Merge.**