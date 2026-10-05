# PR #38 – ChatGPT Independent Re-Review R3

Stand: 23. August 2026  
Status: **REQUEST CHANGES – R3: R2-Kernfixes bestätigt, zwei konkrete Merge-Blocker offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Main bei R3: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
Gelockter R2-Runtime-Head: `aa6cafa2f4997c22081dff35fe950a18190e7886`  
PR-/Docs-Head zu R3-Beginn: `8d238e38ff8d94f74a5b5240f370c330837324c0`  
Sync zu R3-Beginn: **15 ahead, 0 behind** `main`  
PR-Zustand: **open, mergeable, Draft, nicht gemergt**

## 1. R3-Urteil

Der unabhängige R3-Re-Review wurde nach `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md` nicht nur als Check der neuen Tests, sondern erneut an den betroffenen Truth-/Trust-Boundaries durchgeführt.

Bestätigt geschlossen sind die Kernteile der beiden R2-Fixes:

- fehlende / `null` / leere / falsch typisierte `evidenceClass` wird für normale Seasonal-Providerfacts nicht mehr automatisch zu `seasonal_pattern` normalisiert;
- Duplicate Stage-/Day-/Item-IDs und die im R2-Review konkret benannten dangling bzw. widersprüchlichen Stage-/Day-/Item-Referenzen werden an der untrusted API-Grenze verworfen; `tripAusSeasonalAnfrage()` repariert `day.stageId` nicht mehr still zu `null`.

Trotzdem gibt es noch **kein Closure/PASS**. Der R3-Review hat zwei direkt code-abgeleitete Defekte gefunden, die das verbindliche Stop-Kriterium erfüllen:

1. der Safety-vs-Seasonal-Teil von R2-Blocker 5 ist noch nicht vollständig geschlossen: abgewiesene akute Klassen werden intern und API-seitig weiterhin als `seasonal_pattern` materialisiert;
2. die untrusted Seasonal-API akzeptiert rückwärts laufende kanonische Reisedatumsbereiche und kann daraus falsches `not_applies` erzeugen.

PR #38 bleibt Draft. Kein Mark Ready und kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.

---

## 2. R2-Blocker 5 – Missing-class-Default geschlossen, Acute-Klassifikation noch merge-blocking

### Was korrekt repariert wurde

`lib/seasonal/normalisieren.ts` liest normale Providerfacts nun mit:

```ts
const evidenceClass = enumLesen(zeile.evidenceClass, SEASONAL_EVIDENCE_CLASSES)
if (!evidenceClass) return null
```

Damit erzeugen `undefined`, `null`, `''`, falsche Runtime-Typen und unbekannte Klassen keine belastbare Seasonal-Truth. Die Regressionen decken diese Fälle sowie `partial_invalid` bei gemischter Antwort ab.

### Verbleibendes Problem

Für `active_warning`, `acute` und `acute_event` erzeugt `seasonalFactNormalisieren()` jedoch weiterhin einen internen Fact mit:

```ts
evidenceClass: 'seasonal_pattern'
acuteRejected: true
```

Danach erzeugt `seasonalAusFacts()` beim acute-only-Fall eine `leerEvaluation()` mit `factKey: 'acute_rejected'`. `leerEvaluation()` setzt aber ebenfalls fest:

```ts
evidenceClass: 'seasonal_pattern'
acuteRejected: false
```

Damit wird eine **explizit als falsche Safety-Domäne erkannte Providerklasse in der API-visible Evaluation weiterhin als `seasonal_pattern` bezeichnet**. Gleichzeitig ignoriert `seasonalAnsicht()` `factKey === 'acute_rejected'` für Truth-Gaps; eine acute-only Providerantwort kann dadurch in `checked_empty` / `complete=true` und damit API-`ok` enden, obwohl keine belastbare Seasonal-Antwort vorlag, sondern ausschließlich falsche Domain-Truth geliefert wurde.

Das ist exakt die Grenze, die R2-Blocker 5 zusätzlich zum Missing-Default schließen sollte: `active_warning` / `acute_event` dürfen ausschließlich als abgewiesene falsche Domain-Klasse behandelt und **niemals** zu Seasonal Pattern umklassifiziert werden.

Der Domain-Typ unterstützt bereits `SeasonalEvaluation.evidenceClass: SeasonalEvidenceClass | 'rejected_acute'`, verwendet diese explizite Klasse im aktuellen Pfad jedoch nicht.

### Warum merge-blocking

- API-visible Provider-/Evidence-Metadaten behaupten die falsche Truth-Klasse;
- die Safety-vs-Seasonal-Grenze ist ein harter Foundation-Invariant;
- eine acute-only falsche Domain-Antwort kann wie ein vollständiger Seasonal-Check enden;
- bestehende Regressionen prüfen nur `kein Hinweis` / `factKey`, nicht die API-visible `evidenceClass`, `acuteRejected`-Semantik und Gesamtstatus.

### Erforderliche Korrektur

- abgewiesene akute Klassen dürfen intern und in `SeasonalEvaluation` **nicht** `seasonal_pattern` tragen;
- dafür die bereits modellierte `rejected_acute`-Semantik oder einen fachlich gleichwertigen expliziten rejected-domain-Zustand verwenden;
- API-visible Evaluation muss bei einem abgewiesenen akuten Fact `acuteRejected=true` bzw. fachlich gleichwertig transportieren;
- eine Providerantwort, die ausschließlich falsche Acute-/Safety-Domain-Facts enthält, darf nicht als sauberer `checked_empty` / vollständiger Seasonal-Check missverstanden werden; ohne echten Safety-Handoff mindestens fail-closed `unknown` bzw. explizit rejected-domain;
- ein gültiger Seasonal-Fact darf weiterhin als Seasonal-Fact verarbeitet werden; ein zusätzlich falsch-domainiges Acute-Fact darf aber nirgendwo als Seasonal Pattern erscheinen.

### Pflicht-Regressionen

Mindestens:

- `active_warning`, `acute`, `acute_event` → kein Seasonal-Hinweis, API-visible Klasse `rejected_acute` bzw. gleichwertig, niemals `seasonal_pattern`;
- `acuteRejected` bzw. gleichwertiger Rejection-Marker bleibt in der Evaluation erhalten;
- acute-only Providerantwort → kein clean `checked_empty` / vollständiges `ok`;
- gültiger Seasonal-Fact + Acute-Fact → Seasonal-Fact bleibt sichtbar, Acute-Fact bleibt ausdrücklich falsche Domain und wird nicht umklassifiziert;
- Missing-/null-/malformed-Class-Regressionen bleiben grün.

---

## 3. Neuer Merge-Blocker 7 – rückwärts laufende Trip-/Stage-Datumsbereiche können falsches `not_applies` erzeugen

### Betroffene Dateien

- `lib/seasonal/schema.ts`
- `lib/seasonal/relevanz.ts`
- indirekt `lib/seasonal/kalender.ts`
- API-/Schema-/Relevanz-Regressionen

### Verbindlicher Invariant

Der Seasonal Context darf ausschließlich aus kanonischen Trip Facts entstehen. Der kanonische `reiseSchema`-Vertrag weist bereits eine Reise mit `endDate < startDate` ausdrücklich als ungültig zurück (`Die Rückreise liegt vor der Abreise`). Der Seasonal-Auftrag verlangt zusätzlich ausdrücklich: **incomplete context niemals in `not_applies` verwandeln**.

### Problem A – Seasonal API prüft nur einzelne Kalenderdaten, nicht die Reihenfolge

`seasonalAnfrageSchema` validiert aktuell, dass `startDate`, `endDate`, `arrivalDate` und `departureDate` jeweils existierende Kalenderdaten sind. Es prüft aber nicht:

- bei vorhandenen Top-Level-Daten: `startDate <= endDate`;
- bei einer Stage mit beiden Daten: `arrivalDate <= departureDate`.

Ein untrusted Client kann also einen rückwärts laufenden Datumsbereich durch `safeParse()` bringen.

### Problem B – der Relevanzpfad macht daraus eine fachliche Negativaussage

`zeitAufRefsAnwenden()` prüft zunächst den Top-Level-Tripkontakt gegen das Seasonal Window. Ergibt dieser Vergleich `before` oder `after`, wird **sofort** `relevance: 'not_applies'` zurückgegeben, bevor die konkret betroffenen Stage-Kontakte ausgewertet werden.

Die zugrunde liegende Date-only-Vergleichslogik geht von einem geordneten Tripintervall aus und validiert `tripStart <= tripEnd` nicht selbst.

### Direkt reproduzierbarer Fall

Untrusted Request:

- `startDate = 2026-09-20`
- `endDate = 2026-09-10`  ← rückwärts, aktuell im Seasonal-Schema akzeptiert
- passende Thailand-Stage: `2026-09-12` bis `2026-09-16`
- belastbarer Thailand-Seasonal-Fact mit Travel Window, das `2026-09-12` bis `2026-09-16` trifft

Der Top-Level-Vergleich kann das Event als `before` klassifizieren, weil dessen Ende vor dem malformed `tripStart` liegt. `zeitAufRefsAnwenden()` liefert daraufhin `not_applies`, obwohl die konkrete passende Stage das Seasonal Window tatsächlich überschneidet.

Das ist keine kosmetische Validierungslücke: malformed Client-Truth kann eine reale relevante Seasonal-Wahrheit in eine Negativaussage verwandeln.

Ein rückwärts laufender Stage-Bereich kann dieselbe Problemklasse auf Stage-Ebene erzeugen, selbst wenn der Top-Level-Trip breit genug ist.

### Erforderliche Korrektur

An der untrusted Seasonal-API-Grenze fail-closed validieren:

- wenn `startDate` und `endDate` beide vorhanden sind: `startDate <= endDate`;
- wenn `arrivalDate` und `departureDate` einer Stage beide vorhanden sind: `arrivalDate <= departureDate`;
- keine stille Vertauschung / Reparatur von Datumsgrenzen;
- malformed Bereich → Schemafehler und damit HTTP `400`;
- zusätzlich sollte die Relevanz-/Zeit-Hilfslogik so robust bleiben, dass ein unerwartet rückwärts laufender Bereich niemals in `before`/`after`/`not_applies` hochgestuft wird; fail-closed `insufficient` ist der sichere Fallback.

Nicht künstlich in diesen Block gezogen werden Item-Zeitregeln, die aktuell keine direkte räumliche Relevanzentscheidung tragen; der Fix soll die konkret entscheidungsrelevanten Trip-/Stage-Zeitgrenzen schließen.

### Pflicht-Regressionen

Mindestens:

- Top-Level `startDate > endDate` → Seasonal-Anfrage ungültig / API `400`;
- gültige gleiche Start-/Enddaten → erlaubt;
- Stage `arrivalDate > departureDate` → Seasonal-Anfrage ungültig / API `400`;
- Stage mit nur einem der beiden Daten → weiterhin erlaubt und konservativ ausgewertet;
- reproduzierbarer Fall `2026-09-20 → 2026-09-10` + tatsächlich überlappende Stage darf niemals `not_applies` erzeugen;
- direkter Zeit-Helfer mit rückwärts laufendem Kontakt → `insufficient` bzw. gleichwertig fail-closed, nicht `before`/`after`;
- bestehende Recurring-/Leap-Day-/Timezone-Regressionen bleiben grün.

---

## 4. R3 Reality-/Gate-Lock

Zu R3-Beginn unabhängig verifiziert:

- PR #38: **open, Draft, mergeable, nicht gemergt**;
- `main`: `cd220beb44d90ae376feeb8de9db8a3afb808d60`;
- aktueller PR-Head: `8d238e38ff8d94f74a5b5240f370c330837324c0`;
- Branch: **15 ahead, 0 behind** `main`;
- R2-Runtime-Fix: `aa6cafa2f4997c22081dff35fe950a18190e7886`;
- GitHub Actions auf `aa6cafa2`: **SUCCESS**;
- GitHub Actions auf `8d238e38`: **SUCCESS**;
- Vercel Preview auf `aa6cafa2`: **READY**;
- Vercel Preview auf `8d238e38`: **READY**;
- Production/Main blieb `cd220beb`;
- kein Live-Seasonal-Provider, keine Secrets, keine Seasonal-DB-Migration, keine neuen laufenden Kosten.

Wichtig: Zwischen `aa6cafa2` und `8d238e38` wurde neben Dokumentation auch `lib/seasonal/provider.ts` geändert. Der tatsächliche Codeunterschied ist nur ein Kommentar zur bereits vorhandenen `evidenceClass`-Typzeile und ändert keine Runtime-Semantik. Daher ist dies kein zusätzlicher Merge-Blocker; der aktuelle Head besitzt außerdem eigene grüne CI-/Preview-Evidenz.

Der von Cursor dokumentierte Full Gate auf `aa6cafa2` bleibt dennoch nur der Gate-Lock des R2-Runtime-Heads. Nach den hier geforderten R3-Fixes muss der komplette Gate erneut auf exakt dem neuen Runtime-/PR-Head laufen.

---

## 5. Stop-Kriterium / nächster Schritt

Der R3-Review fügt keine Stil- oder Perfektionsschleife hinzu. Beide offenen Punkte sind direkt code-derived und können falsche Truth-/Safety-/Relevance-Semantik erzeugen.

Cursor soll ausschließlich:

1. die verbleibende Acute-/Safety-Klassifikationslücke aus Blocker 5 vollständig schließen;
2. Merge-Blocker 7 für rückwärts laufende Trip-/Stage-Datumsbereiche fail-closed schließen;
3. die oben genannten adversarial Regressionen ergänzen;
4. danach den vollständigen Exact-Head-Gate ausführen und erneut **0 behind** verifizieren.

Danach folgt R4 als finaler unabhängiger Re-Review nach dem Stop-Kriterium. Ein PASS wird nur ausgesprochen, wenn keine weitere konkrete merge-blocking Truth-/Security-/Data-Loss-/Release-Lücke verbleibt.

Bis dahin: **REQUEST CHANGES. PR bleibt Draft. Kein Mark Ready. Kein Merge.**