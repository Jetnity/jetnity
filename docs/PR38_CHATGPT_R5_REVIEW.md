# PR #38 – ChatGPT Independent Re-Review R5

Stand: 23. August 2026  
Status: **REQUEST CHANGES – R4-Blocker 8–9 bestätigt geschlossen, zwei neue Merge-Blocker 10–11 offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Main bei R5: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
R4-Runtime-Head: `f077d4d1e45366dd7dfa50bf2f98461d71b8279c`  
PR-/Docs-Head zu R5-Beginn: `37f1ec4317c13ba007a1bd75283ed6102c6acc8b`  
Sync zu R5-Beginn: **24 ahead, 0 behind** `main`  
PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 1. R5-Urteil

Der unabhängige R5-Re-Review wurde nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` und dem verbindlichen Stop-Kriterium durchgeführt.

Die beiden R4-Fixes sind **bestätigt geschlossen**:

- **Blocker 8:** konkrete Stage-/Route-Kontakte werden zeitlich einzeln gegen das Seasonal-Fenster geprüft; eine gröbere, geordnete aber widersprüchliche Top-Level-Hülle kann diese Kontakte nicht mehr vorzeitig zu `not_applies` machen. Fehlen konkrete Kontaktzeiten, wird auf `insufficient_context` degradiert.
- **Blocker 9:** wenn `item.stageId` fehlt, kann die vorhandene `item.dayId → day.stageId`-Beziehung konservativ für Item-Impact verwendet werden. Eine widersprüchliche Doppelbeziehung wird nicht still entschieden. Betroffene Activities können dadurch korrekt `needs_recheck` und `check_activity` auslösen.

Exact-Head-Evidenz für Runtime `f077d4d1` wurde unabhängig verifiziert:

- GitHub Actions Run `32645477815`: **SUCCESS** auf exakt `f077d4d1e45366dd7dfa50bf2f98461d71b8279c`
- Vercel Deployment `dpl_zm3hQgmNLkLG6aagbdPePF1Jqyr7`: **READY**, Commit exakt `f077d4d1...`
- `npm test` laut Exact-Head-Gate: **1559/1559**
- Production-Build Exit 0, UI-Audit 1014/1014, DB/Security-Gates grün
- Docs-Lock `37f1ec43`: GitHub Actions **SUCCESS**, Vercel Deployment `dpl_3dhDgLcKScd9LVCGHpFAyPbkXryC` **READY**
- Diff `f077d4d1 → 37f1ec43`: nur Dokumentation, keine Seasonal-Runtime-Änderung

Trotzdem gibt es noch **kein Closure/PASS**. Der adversarielle R5-Durchgang findet zwei konkrete Truth-/Provider-Grenzdefekte, die das Stop-Kriterium erfüllen.

---

## 2. Merge-Blocker 10 – Provider-Port verliert die konkrete zeitliche Topologie, die R4 jetzt als Source of Truth priorisiert

### Betroffene Dateien

- `lib/seasonal/provider.ts`
- `lib/seasonal/kontext.ts`
- indirekt `lib/seasonal/engine.ts`
- Contract-/Provider-Regressionen

### Verbindlicher Vertrag

`docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` verlangt bei provider-neutralen Funktionen ausdrücklich:

> Ist der Provider-Port vollständig genug, damit ein echter Adapter später keinen Produktumbau erzwingt?

Der Foundation-Auftrag verlangt für den Seasonal Trip Context mindestens:

- Trip dates
- Stages inklusive IDs, Ort und `arrival/departure`
- Days/Dates soweit relevant
- Foundation-D Route Facts / Routekontakte
- relevante Item-Refs

R4 hat zusätzlich fachlich festgelegt: **konkrete Stage-/Route-Kontakte haben bei der zeitlichen Relevanz Vorrang vor einer gröberen Top-Level-Hülle**.

### Problem

`SeasonalProviderAnfrage` und `providerAnfrageAusKontext()` übertragen aktuell nur:

- `contextFingerprint`
- Top-Level `startDate`
- Top-Level `endDate`
- flache `countryCodes[]`
- flache `airportCodes[]`
- flache `placeIds[]`

Sie übertragen **nicht**, welches Land/Place/Airport zu welchem konkreten zeitlichen Kontakt gehört, insbesondere keine:

- Stage-ID + `arrivalDate/departureDate`
- Place-ID + Stage-Zeitfenster
- Airport-/Route-Kontakte + deren einzelne Datums-/Zeitfenster

Damit kann ein späterer echter Adapter die von R4 nun verbindlich priorisierte zeitliche Wahrheit nicht aus dem Provider-Request rekonstruieren.

### Reproduzierbarer Fall

Tripgraph:

- Top-Level: `2026-09-01 → 2026-09-05`
- Bangkok-Stage: `2026-09-12 → 2026-09-16`
- R4 korrekt: konkrete Bangkok-Stage gewinnt bei lokaler Relevanz.

Der Provider-Request enthält trotzdem nur `startDate=2026-09-01`, `endDate=2026-09-05` plus `TH`/Bangkok-Place-ID. Ein echter Forecast-/Seasonal-Adapter kann daraus nicht erkennen, dass er für Bangkok `12.–16.09.` prüfen muss. Er kann den benötigten Fact deshalb bereits **vor** der lokalen R4-Relevanzprüfung auslassen.

Dasselbe Problem besteht bei Multi-Destination / repeated destination: Die flachen Mengen `placeIds[]` und `airportCodes[]` enthalten keine Zuordnung zu den jeweiligen Reisezeitfenstern.

### Warum merge-blocking

- Der Fix von Blocker 8 ist an der lokalen Relevanz korrekt, aber nicht bis zur Provider-Grenze geschlossen.
- Ein echter Adapter würde für `forecast_outlook` bzw. zeitgebundene Seasonal-Facts zusätzliche Jetnity-seitige Request-Architektur benötigen.
- Der globale Review-Standard verlangt ausdrücklich einen ausreichend vollständigen Provider-Port.
- Multi-Destination- und konkrete Stage-/Route-Zeitwahrheit können sonst bereits beim Abruf verloren gehen.

### Erforderliche Korrektur

Den provider-neutralen Request minimal, aber vollständig genug machen. Keine provider-spezifischen Schemas erfinden.

Geeignete Lösung z. B. durch strukturierte kanonische Targets/Kontakte:

- Stage-Targets mit stabiler ID, Country/Place/Geo und `arrivalDate/departureDate`
- Route-/Airport-Kontakte mit Airport/Route-Identifier und getrennten Start-/Endkontakten
- weiterhin Top-Level Trip dates als grobe Hülle
- keine Labels/LLM/Citizenship-Daten, die nicht fachlich nötig sind
- deterministische Reihenfolge

Alternativ ist eine andere provider-neutrale Struktur zulässig, solange ein Adapter alle decision-relevanten Stage-/Route-Zeitkontakte ohne Rückgriff auf UI oder Provider-Rohdaten erhält.

### Pflicht-Regressionen

Mindestens:

1. R4-Widerspruchsfall: Provider-Testdouble sieht Bangkok `12.–16.09.` trotz Top-Level `01.–05.09.`.
2. Zwei Destinationen mit unterschiedlichen Stage-Zeitfenstern bleiben im Request getrennt zuordenbar.
3. Wiederholtes gleiches Place/Airport in getrennten Reiseperioden bleibt als getrennte Kontakte erhalten.
4. Route-/Airport-Kontakte behalten ihre einzelnen Zeiten und werden nicht zu Min/Max verschmolzen.
5. Reihenfolge des Tripgraphen ändert bei fachlich identischer Wahrheit nicht den kanonischen Provider-Request.
6. Keine Citizenship-/Document-/LLM-Felder gelangen in den Seasonal-Port.

---

## 3. Merge-Blocker 11 – `temporarily_unavailable` kann explizite Acute-/Safety-Klasse wieder als `seasonal_pattern` materialisieren

### Betroffene Dateien

- `lib/seasonal/normalisieren.ts`
- `lib/seasonal/engine.ts`
- Normalisierungs-/Engine-/API-Regressionen

### Verbindlicher Vertrag

Die Acceptance sagt ausdrücklich:

- Safety bleibt für acute/active warnings zuständig;
- `active_warning` / akute Event-Truth darf Seasonal intern/API-sichtbar **nicht** als `seasonal_pattern` materialisieren;
- sichtbare abgewiesene Klasse ist `rejected_acute`.

### Problem

In `seasonalFactNormalisieren()` wird `availability` **vor** `evidenceClass` ausgewertet.

Bei:

```ts
{
  evidenceClass: 'active_warning',
  availability: 'temporarily_unavailable',
  ...
}
```

kehrt der Normalizer bereits im Availability-Zweig zurück mit:

```ts
evidenceClass: 'seasonal_pattern'
acuteRejected: false
sourceTemporarilyUnavailable: true
```

Die spätere `SEASONAL_ABGEWIESENE_KLASSEN`-Prüfung wird nie erreicht.

`seasonalAusFacts()` klassifiziert diese Zeile anschließend als `temporarily`, nicht als `acute`. Bei acute-only + unavailable entsteht deshalb API-sichtbar erneut eine unavailable Evaluation mit Default-`evidenceClass: seasonal_pattern` und `acuteRejected=false`.

Damit existiert weiterhin ein direkt reproduzierbarer Pfad, auf dem eine explizite Active-Warning-/Acute-Klasse intern und API-sichtbar als Seasonal Pattern materialisiert wird.

### Warum merge-blocking

- direkte Verletzung der harten Safety-vs-Seasonal-Truth-Grenze;
- untrusted Providerdaten können die falsche Domain-Klassifikation durch Kombination zweier erlaubter Felder auslösen;
- genau die Problemklasse des R3-Fixes ist dadurch an einer kombinierten Failure-Semantik noch offen;
- grüne Tests decken aktuell `temporarily_unavailable` und `active_warning` separat, nicht in Kombination.

### Erforderliche Korrektur

Für jede explizite abgewiesene Acute-/Safety-Klasse muss gelten:

- niemals `seasonal_pattern` materialisieren;
- `rejected_acute` / `acuteRejected=true` bleibt erhalten oder die kombinierte Zeile wird vollständig fail-closed verworfen;
- `temporarily_unavailable` darf diese Domain-Klassifikation nicht überschreiben;
- Engine-/Summary-Verhalten bleibt honest unknown/unavailable und erzeugt keinen Seasonal-Hinweis.

Die konkrete Prioritäts-/Mehrfachstatusmodellierung ist implementierungsfrei, solange die Truth-Grenze eindeutig bleibt.

### Pflicht-Regressionen

Mindestens für `active_warning`, `acute`, `acute_event` jeweils:

1. `availability='temporarily_unavailable'` + Acute-Klasse → intern/API niemals `seasonal_pattern`.
2. `acuteRejected` bzw. fail-closed Domain-Semantik bleibt eindeutig.
3. acute-only + temporarily unavailable → kein `checked_empty`, kein `ok`, keine Seasonal-Hinweis-Copy.
4. gültiger Seasonal-Fact + acute/unavailable-Zeile → gültiger Fact darf sichtbar bleiben, Gesamtstatus darf die abgewiesene/fehlende Truth nicht falsch als clean/favorable darstellen.
5. normales `seasonal_pattern + temporarily_unavailable` bleibt fachlich unavailable ohne Timing-Aussage.

---

## 4. Was R5 ausdrücklich als geschlossen bestätigt

- Erst-Review-Blocker 1–4
- R2-Blocker 5/6-Kernfälle: Missing-Class und Tripgraph-Integrität
- R3 Residual rejected-acute für normale Availability sowie Reverse-Date
- R4 Blocker 8: lokale konkrete Stage-/Route-Zeitkontakte überstimmen keine grobe Top-Level-Hülle mehr falsch
- R4 Blocker 9: Day→Stage-basierter konservativer Item-Impact
- aktuelle Runtime `f077d4d1`: CI/Preview/Gates grün
- keine Seasonal-DB-Migration, kein Live-Provider, keine Secrets, keine neuen laufenden Kosten

## 5. Bewusst nicht als Merge-Blocker hochgestuft

- In-process Rate-Limit bleibt Preview/Dev-Naht; globaler kommerzieller Schutz gehört zum späteren Live-Provider-Gate.
- `seasonalProviderAus()` bleibt absichtlich `null`.
- kein persistiertes `Trotzdem so planen` in diesem Foundation-Scope.
- Account-`tripId`-Serverload bleibt spätere Naht.
- title-only Geo bleibt fail-closed unknown/insufficient.
- Provider-spezifische Parameter, Auth, Lizenz-/Kostenlogik oder konkrete API-Schemas gehören ausdrücklich **nicht** in diesen Fix. Blocker 10 verlangt nur den Jetnity-seitig vollständigen provider-neutralen Zeit-/Target-Vertrag.

## 6. R5 Stop-Kriterium / nächster Schritt

Cursor soll **ausschließlich Blocker 10 und 11** schließen und die beschriebenen adversarial Regressionen ergänzen.

Danach vollständiges Exact-Head-Gate auf dem neuen Runtime-Head:

- Typecheck / Lint / Tests
- Production-Build
- UI-Audit
- DB-/Security-Gates, soweit unverändert mit bestehendem Standard
- GitHub Actions auf exakt dem Runtime-Head
- Vercel Preview auf exakt dem Runtime-Head
- `0 behind main`

Danach R6 als unabhängiger Closure-Re-Review. R6 blockiert nur noch bei einem konkreten reproduzierbaren oder direkt code-abgeleiteten Defekt mit relevantem Einfluss auf Truth, Provider-Port, Security, Source-of-Truth, Cross-Domain, Release oder zentrale Foundation-Funktionalität. Keine theoretische Perfektionsschleife nach Erreichen dieses Stop-Kriteriums.

PR #38 bleibt **Draft**. Kein Mark Ready, kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.