# PR #37 – ChatGPT Final Closure Review

Stand: 23. August 2026  
Status: **REQUEST CHANGES – vier letzte konkrete Closure-Blocker**

PR: #37 `Travel Safety & Disruption Intelligence – provider-neutrale Foundation`  
Branch: `feat/travel-safety-disruption-intelligence`  
Geprüfter PR-Head vor diesem Review-Dokument: `7efd9d040a0a78162714649675ee0da0de47e436`  
Runtime-Head der Cursor-Re-Review-Fixes: `cace9408`  
Base/main: `91e644b279c802c5a5d7a88135ed8ab9c4229a34`  
Stand beim Review: **16 ahead / 0 behind**, Draft, offen, mergeable.  
Remote auf `7efd9d04`: GitHub Actions Run `32614891912` **SUCCESS**, Vercel **SUCCESS**.

## Ergebnis der bisherigen Review-Fixes

Die vier Findings aus `docs/PR37_CHATGPT_REREVIEW.md` wurden im Kern professionell adressiert:

- checked-empty ist von Provider-Unavailable getrennt;
- vollständig malformed Providerzeilen werden nicht mehr als sauberer Empty-Check behandelt;
- Runtime-Input wird in `safetyFactNormalisieren(unknown)` grundsätzlich defensiver gelesen;
- Transit-Land ohne Stage wird bei feineren Geo-Scopes fail-closed behandelt;
- Traveller-Slots statt bloßem Code-Flatten werden verwendet;
- Context-/Event-Fingerprint wurden auf v2 erweitert.

Lokale Nachweise laut Acceptance/Cursor: `npm test` **1429/1429**, Typecheck/Lint/Hygiene grün, Build **38/38**, UI-Audit **886/886**. Production unverändert, kein Live-Provider, keine Safety-Migration.

Der Abschlussreview geht gemäß Product-Owner-Mandat trotzdem über grüne Testzahlen hinaus. Die folgenden vier Fälle sind direkt aus dem aktuellen Runtime-Code reproduzierbar und betreffen Safety-Truth, falsche Warnung/Entwarnung oder zentrale Foundation-Semantik.

---

## Closure-Blocker 1 – Unknown/Timeout/Stale/Conflict kann im UI und API als scheinbar sauberer Check erscheinen

### Betroffene Dateien

- `lib/safety/status.ts`
- `lib/safety/anzeige.ts`
- `app/api/safety/evaluate/route.ts`
- `lib/safety/engine.ts`

### Reproduzierbarer Pfad

`leerEvaluation()` erzeugt für Timeout/Throw/Malformed/Conflict u. a. Evaluations mit `presentationClass = 'unknown'` und `freshness = 'source_temporarily_unavailable'`, `never_checked`, `recheck_needed` oder ähnlichen nicht-current Zuständen.

`SafetySummary.unavailable` erkennt aktuell aber nur:

- `freshness === 'provider_unavailable'` oder
- `evidenceStatus === 'unavailable'`.

Damit gilt z. B. bei einem Provider-Timeout:

1. Engine => `freshness = source_temporarily_unavailable`, `evidenceStatus = unknown`.
2. `summary.unavailable === false`.
3. API => `status: 'ok'`.
4. `safetyZusammenfassungText()` sieht keine critical/important/information-Evaluation und fällt auf:
   `Keine aktuelle Safety-Warnung für den geprüften Reiseausschnitt.`

Dasselbe Grundproblem betrifft stale/recheck-needed, malformed/never-checked, conflict und andere unknown-Zustände ohne aktuelle Warnung.

Das ist eine falsche Entwarnungswirkung und widerspricht der bindenden Policy: **Bei unzureichender Evidence keine Scheinsicherheit / keine Entwarnung.**

### Required fix

Die Summary/API-Semantik muss mindestens unterscheiden:

- **checked-clean**: Provider erfolgreich, belastbarer Check, 0 aktuelle akute Warnungen;
- **unavailable / temporarily unavailable**: Quelle nicht verfügbar/Timeout/Throw;
- **unknown / recheck required / insufficient**: Check nicht belastbar, stale, malformed, konfliktbehaftet oder Kontext unvollständig;
- **current evaluations**: Information/Important/Critical.

Nur ein echter checked-clean-Zustand darf eine sachliche „keine aktuelle Warnung im geprüften Scope“-Aussage erzeugen. Unknown darf niemals auf diese Copy fallen.

API darf Timeout/Throw nicht als generisches `status: ok` melden. Die konkrete öffentliche Statusform darf klein bleiben, muss aber semantisch fail-closed sein.

### Pflicht-Regressionstests

1. Provider Timeout => API/View **nicht** clean/ok; Copy enthält ausdrücklich keine Entwarnung.
2. Provider Throw => gleiches Verhalten.
3. Vollständig malformed Response => unknown, keine Clean-Copy.
4. stale/recheck-needed Evidence ohne aktuelle Warnung => keine Clean-Copy.
5. Conflict ohne current Warning => keine Clean-Copy.
6. `evaluate() => []` => weiterhin checked-clean, nicht unavailable/unknown.
7. Seasonal-only erfolgreicher Check => keine akute Warnung und nicht unavailable; keine globale Aussage „Reise ist sicher“.

---

## Closure-Blocker 2 – Zeitliche Relevanz wird noch gegen die gesamte Reise statt den konkret betroffenen Reiseteil geprüft

### Betroffene Dateien

- `lib/safety/relevanz.ts`
- `lib/safety/kontext.ts`
- `lib/route/domain.ts`
- ggf. `lib/safety/fingerprint.ts`

### Reproduzierbarer Fall A – Etappe

Mehrzielreise:

- Florenz: 12.–14. September
- Rom: 15.–16. September
- Gesamtreise: 12.–16. September

Safety-Fact:

- Scope: kanonisch Florenz
- Event: 15.–16. September

Aktuell:

- räumlich wird Florenz korrekt als betroffene Stage gefunden;
- `zeitlicheRelevanz()` prüft aber nur `kontext.startDate/endDate` der **gesamten Reise**;
- Gesamtreise und Event überschneiden sich => `affected`;
- Jetnity kann deshalb Florenz warnen, obwohl der Traveller Florenz nach belegten Stage-Daten bereits verlassen hat.

### Reproduzierbarer Fall B – Transit

Route ZRH → DOH → BKK:

- Transit DOH z. B. am 12. September
- Gesamtreise bis 16. September
- akute DOH-Störung erst 15. September

Airport-Scope DOH ist räumlich exakt, aber die Zeitprüfung gegen die Gesamtreise kann die Route weiterhin als betroffen markieren, obwohl der Transit bereits vorbei ist.

Das ist eine konkrete falsche zeitliche Betroffenheit. Der ursprüngliche Foundation-Task verlangt ausdrücklich Stage-/Item-/Day-/Route-Zeiten, soweit strukturiert vorhanden.

### Required fix

Zeitliche Relevanz muss die **räumlich betroffenen Refs** und deren beste vorhandene strukturierte Zeitwahrheit berücksichtigen:

- Stage-Ref => `arrivalDate/departureDate`, soweit vorhanden;
- Airport/Route-Ref => Foundation-D Route-Segmente / Segmentdaten für den konkreten Airport bzw. Transit, soweit vorhanden;
- Day/Item später nur, wenn der räumliche Match tatsächlich auf diesen Ref reicht;
- fehlen feinere Zeiten => konservativer dokumentierter Fallback auf breiteren Trip-Kontext / insufficient, aber keine erfundene Präzision.

Bei mehreren räumlichen Treffern:

- mindestens ein belegter zeitlicher Overlap => affected nur für passende Refs;
- alle belegbar außerhalb => not_affected;
- kein Overlap, aber mindestens ein zeitlich unklarer relevanter Ref => insufficient_context.

Keine automatische Reiseänderung.

### Fingerprint-Folge

Sobald Route-Segmentdaten für Safety-Temporalität verwendet werden, muss `safetyContextFingerprint()` auch genau die verwendeten Route-Zeitfakten deterministisch abdecken. Der Foundation-D-Pfadfingerprint allein enthält nicht sämtliche Segmentdaten/-zeiten.

### Pflicht-Regressionstests

1. Florenz-Stage endet 14.09., Florenz-Event beginnt 15.09. => **not_affected** für Florenz trotz Gesamtreise bis 16.09.
2. Gleiches Event am 13.09. => affected Florenz.
3. Zwei Stages: Event überschneidet nur eine Stage => nur diese Stage in `affectedRefs`.
4. DOH-Transit am 12.09., DOH-Event erst 15.09. => Route nicht affected.
5. DOH-Event während belegtem Transitdatum => Route affected.
6. Route-Datum fehlt => insufficient/breiter konservativer Fallback, nie erfundene genaue Entwarnung.
7. Änderung eines Safety-relevanten Route-Segmentdatums ändert den Context-Fingerprint / gleichwertige Invalidation.

---

## Closure-Blocker 3 – Feinere Geo-Scopes können bei „Stage im Land + Route ebenfalls im Land“ noch fälschlich `not_affected` liefern

### Betroffene Dateien

- `lib/safety/relevanz.ts`
- `lib/safety/scope.ts`

### Ursache

Der Re-Review-Fix führt `routeLandOhneStage()` ein. Diese Hilfe gibt jedoch ausdrücklich `false` zurück, sobald **irgendeine Stage im selben Land** existiert.

Damit wird die Route nur als Unknown-Faktor berücksichtigt, wenn keine Stage dieses Landes existiert.

Das reicht nicht.

### Reproduzierbarer Fall

Beispiel:

- eine Stage liegt in Mumbai/IN und hat einen kanonischen Place + Koordinaten;
- die Flugroute berührt/transitiert zusätzlich DEL/IN;
- Fact ist City/Place/Polygon im Raum Delhi;
- die Mumbai-Stage matcht den Delhi-Scope belegbar nicht;
- für den Route-Punkt DEL besitzt die Safety-Foundation aber keine kanonische City-/Polygon-Membership.

Aktuell kann der City-/Place-/Geometry-Pfad bereits wegen der vorhandenen Mumbai-Stage `not_affected` zurückgeben. `routeLandOhneStage()` wird wegen der Stage IN unterdrückt.

Die Route berührt jedoch Indien. Ohne belastbare feinere Membership des Route-Punkts ist Delhi für die Route **nicht ausgeschlossen**. Korrekt ist mindestens `insufficient_context`, nicht `not_affected`.

### Required fix

Route-Land-Berührung muss unabhängig davon betrachtet werden, ob zusätzlich eine Stage im selben Land existiert.

Für finer-than-country Scopes:

- exakter Stage-Match => affected Stage;
- exakter Airport/Corridor-Match => affected Route;
- Stage(s) im Land klar außerhalb **plus** Route im selben Land ohne belastbare feinere Route-Membership => insufficient_context;
- nur wenn Stage **und Route** den feineren Scope belastbar ausschließen oder das Land gar nicht berühren => not_affected.

Keine City-/Region-Zuordnung aus Route-Displaynamen raten.

### Pflicht-Regressionstests

1. Stage Mumbai + Transit DEL + City Delhi => nicht `not_affected`; ohne kanonische Route-City-Membership `insufficient_context`.
2. Stage Mumbai + Transit DEL + Place Delhi => insufficient_context.
3. Stage Mumbai mit Koordinaten außerhalb Delhi-Polygon + Transit DEL ohne Route-Koordinaten => insufficient_context.
4. Stage/Route ausschließlich anderes Land => weiterhin not_affected.
5. Exakter Airport DEL => weiterhin affected Route/Flight.
6. Reverse/mehrere Routepunkte ändern die Fachsemantik nicht.

---

## Closure-Blocker 4 – Decision-Signatur / Event-Fingerprint / strikte Temporal-Normalisierung sind noch nicht semantisch vollständig

### Betroffene Dateien

- `lib/safety/normalisieren.ts`
- `lib/safety/konflikt.ts`
- `lib/safety/fingerprint.ts`
- `lib/safety/scope.ts`
- `lib/safety/evidence.ts`

Dieser Blocker hat drei eng zusammenhängende Ursachen: dieselben Inputs, die eine Safety-Entscheidung verändern, sind noch nicht überall in Normalisierung, Konflikt/Dedup und Fingerprint gleich vollständig modelliert.

### 4A – Duplicate-Facts können über Evidence-Freshness weiterhin order-dependent werden

`entscheidungsSignatur()` enthält aktuell nicht `freshUntil`.

`evidenceBevorzugen()` entscheidet bei gleichem Trust + gleichem `checkedAt` + gleicher URL am Ende mit `return a`.

Damit können zwei Zeilen desselben `factKey` mit identischer fachlicher Signatur, gleichem `checkedAt`/URL, aber unterschiedlichem `freshUntil` je nach Eingabereihenfolge unterschiedlich enden:

- Variante A wählt bereits abgelaufenes `freshUntil` => `recheck_needed`, keine current Warning;
- Variante B wählt zukünftiges `freshUntil` => `current`, Warning möglich.

Input-Reihenfolge darf niemals Safety-Truth ändern.

Auch `updatedAt` kann bei sonstigem Tie Order-dependent im gewählten Fact/Event-Fingerprint bleiben.

### 4B – `scopeIdentitaet()` lässt Felder weg, die Relevanz verändern

Für `place`, `point_radius` und `polygon` wird `countryCode` nicht in die Scope-Identität aufgenommen.

Die Relevance Engine verwendet `countryCode` aber für Route-/Unknown-Fallbacks. Zwei gleiche Geometrien/Place-IDs mit unterschiedlichem Country-Metadatum können deshalb unterschiedlich bewertet werden, aber in Conflict-Signatur/Event-Fingerprint als gleich gelten.

Damit sind Dedup und Invalidation nicht an derselben semantischen Wahrheit ausgerichtet.

### 4C – Event-Fingerprint v2 deckt weiterhin nicht alle evaluation-relevanten Inputs ab

Aktuell fehlen mindestens Inputs, die das tatsächliche Evaluation-Ergebnis ändern können, z. B.:

- `category` (kann Presentation Class ändern),
- `checkedAt` (kann Freshness current ↔ recheck ändern),
- Evidence-Trust bzw. eine äquivalente Trust-Signatur (trusted ↔ untrusted ändert Presentation/EvidenceStatus),
- `nature` / gleichwertige Invalidation für acute ↔ seasonal,
- vollständige Scope-Identität aus 4B.

Beispiel: gleicher Fact/Scope/Severity, aber `category = earthquake` vs `other` kann ohne Severity/Advisory `important_notice` vs `information` erzeugen, während der aktuelle Event-Fingerprint gleich bleiben kann.

Ebenso kann ein neues `checkedAt` eine stale/recheck-Bewertung zu current machen, ohne den Event-Fingerprint zu ändern.

### 4D – „Format passt“ ist bei Kalenderdaten noch nicht dasselbe wie valides Datum

`isoDatumLesen()` / `isoZeitLesen()` prüfen Regex + `Date.parse()`.

JavaScript normalisiert bestimmte unmögliche Kalenderdaten statt sie abzulehnen (z. B. `2026-02-31` kann als Datum im März geparst werden). Ein vorhandenes malformed `validFrom`/`validUntil` kann damit trotz des Re-Review-Fixes weiterhin als scheinbar gültige Zeit in die Safety-Truth gelangen.

Zusätzlich muss ein semantisch unmögliches Fenster `validFrom > validUntil` fail-closed bleiben.

Die Safety-API-Datumsfelder verwenden ebenfalls nur ein Format-Regex und sollten dieselbe echte Kalenderdatum-Validierung wiederverwenden, damit untrusted Trip-Kontext nicht normalisiert statt verworfen wird.

### 4E – vorhandene malformed decision-relevante Typen dürfen nicht still auf Default fallen

Beispiel: `travellerDependent: 'true'` wird aktuell nicht als vorhandenes malformed Boolean verworfen, sondern zu `false` (`zeile.travellerDependent === true`). Dadurch kann ein travellerabhängiger Hinweis als tripweit behandelt werden.

Dasselbe Prinzip gilt für vorhandene bekannte decision-relevante Enums: fehlend darf gemäß Vertrag zulässig sein; **vorhanden aber ungültig** darf nicht still wie fehlend/default interpretiert werden, wenn dadurch Warning-/Relevance-Semantik verändert wird.

### Required fix

- Eine zentrale Entscheidungssignatur muss alle semantischen Felder enthalten, die Relevance/Presentation/Freshness ändern, oder die Evidence-Auswahl muss nachweisbar deterministisch und fail-closed dieselbe Semantik abbilden.
- Differierende decision-relevante Freshness-/Scope-Semantik derselben Fact-ID darf nicht input-order-dependent dedupliziert werden.
- `scopeIdentitaet()` muss alle Felder enthalten, die die Relevance Engine tatsächlich nutzt.
- Event-Fingerprint muss alle Inputs abdecken, die Evaluation/Freshness/Presentation verändern, oder durch eine gleichwertig vollständige Invalidation ersetzt werden.
- Kalenderdatum/-zeit strikt validieren, keine `Date.parse`-Normalisierung unmöglicher Daten akzeptieren.
- `validFrom <= validUntil` prüfen, wenn beide gesetzt sind.
- vorhandene malformed Boolean/Enum-Felder, die Entscheidung beeinflussen, fail-closed behandeln.

### Pflicht-Regressionstests

1. Gleicher Fact, gleiches checkedAt/URL, unterschiedliches `freshUntil`; Vorwärts/Rückwärts-Reihenfolge => identisches fail-closed Resultat.
2. Scope point/polygon/place mit decision-relevant verschiedenem `countryCode` => Konflikt oder eindeutig verschiedene Signatur; keine Reihenfolgeabhängigkeit.
3. Category-Wechsel, der Presentation Class ändert => Event-Fingerprint/Invalidation ändert sich.
4. checkedAt-Wechsel current ↔ recheck => Event-Fingerprint/Invalidation ändert sich.
5. trusted ↔ untrusted bei sonst gleichem Fact => Event-Fingerprint/Invalidation ändert sich oder gleichwertige Safety-Invalidation ist nachweisbar.
6. `2026-02-31` / entsprechendes unmögliches ISO-Datetime => invalid/fail-closed.
7. `validFrom > validUntil` => invalid/fail-closed.
8. `travellerDependent: 'true'` => invalid/fail-closed, niemals trip-level Warning.
9. vorhandenes invalides decision-relevantes Enum => kein current Warn-Resultat durch stillen Default.
10. Vollständig konsistente Duplikate bleiben deterministisch dedupliziert.

---

## Explizites Stop-Kriterium nach diesem Fix-Pass

Dieser Review ist der **Final Closure Review** für PR #37.

Nach Behebung dieser vier Gruppen darf Foundation Safety nicht wegen Stil, theoretischer Mikro-Härtung oder hypothetischer provider-spezifischer Details ohne echten Adapter weiter verlängert werden.

Merge-blocking bleibt danach nur ein neuer **konkret reproduzierbarer oder direkt code-derived** Defekt mit relevantem Einfluss auf:

- falsche Safety-Warnung oder falsche Entwarnung,
- Safety-/Evidence-/Freshness-Truth,
- räumliche oder zeitliche Betroffenheit,
- zentrale Order-Independence/Fingerprint-/Invalidation-Funktion,
- Security/Cross-Trip/Cross-User,
- Daten-/Source-of-Truth,
- Production-Rollout/Migration,
- zentrale Foundation-Funktion.

Explizit **nicht** merge-blocking nach diesem Pass:

- In-process Rate-Limit vor Live-Provider-Aktivierung,
- fehlender Account-`tripId`-Load in dieser providerlosen Foundation,
- title-only Geo bleibt unknown,
- großer Workspace/`Jetzt wichtig` kommt später,
- Provider-Auswahl/Vertrag/Secrets/Provider-spezifische Feinheiten,
- reine Style-/Refactor-/Naming-Themen.

## Governance

PR #37 bleibt Draft.  
Kein Mark Ready.  
Kein Merge.  
Keine Production-Migration.  
Kein echter Safety-Provider.
