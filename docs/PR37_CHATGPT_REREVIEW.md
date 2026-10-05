# PR #37 – ChatGPT Independent Re-Review

Stand: 23. August 2026  
Status: **REQUEST CHANGES – vier konkrete Closure-Blocker**

PR: #37 `Travel Safety & Disruption Intelligence – provider-neutrale Foundation`  
Branch: `feat/travel-safety-disruption-intelligence`  
Geprüfter PR-Head vor diesem Review-Dokument: `31678cd82640659125af6f7afa8c734c3d2d1b79`  
Runtime-Head der Cursor-Fixes: `01096bb3dc2969d7372b71fc9ab6eae16e3ea4c4`  
Base/main: `91e644b279c802c5a5d7a88135ed8ab9c4229a34`  
Stand beim Review: **12 ahead / 0 behind**, Draft, offen, mergeable.

## Ergebnis der ursprünglichen vier Review-Fixes

Die vier Findings aus `docs/PR37_CHATGPT_INDEPENDENT_REVIEW.md` sind im Kern korrekt adressiert:

- Evidence-Freshness ist vom Event-Zeitfenster getrennt und hat Max-Age/Fresh-Until.
- Admin-Region/City-Matching ist deutlich fail-closed verbessert.
- Decision-Signature enthält Traveller-Abhängigkeit/Citizenship-Mengen; `maxFacts` wird nicht mehr abgeschnitten.
- Provider-Aufruf besitzt Timeout/Abort und fällt auf `source_temporarily_unavailable` zurück.

Remote-Nachweise auf `31678cd8`: GitHub Actions SUCCESS, Vercel SUCCESS. Runtime-Nachweise: 1410/1410 Tests, Build 38/38, UI-Audit 886/886 laut Acceptance/PR.

Trotzdem bleiben nach direkter Codeprüfung vier konkrete, hochwirksame Foundation-Fehler.

---

## Closure-Blocker 1 – erfolgreicher Provider mit 0 Facts wird als `unavailable` fehlklassifiziert

### Betroffene Dateien

- `lib/safety/engine.ts`
- `lib/safety/status.ts`
- `app/api/safety/evaluate/route.ts`

### Reproduzierbarer Pfad

Ein aktiver, erfolgreicher Provider darf legitim `[]` liefern, wenn im angefragten Reiseausschnitt keine relevanten akuten Safety-Facts existieren.

Aktuell:

1. `safetyAuswerten()` erhält `[]` und gibt über `safetyAusFacts()` ebenfalls `[]` zurück.
2. `safetyAnsicht(reise, [])` berechnet `unavailable` über `liste.every(...)`.
3. `[].every(...) === true`.
4. Die API antwortet deshalb mit `status: 'unavailable'` und "Sicherheitshinweise können derzeit nicht geprüft werden" – obwohl der Provider erfolgreich geantwortet hat.

Damit werden zwei fachlich verschiedene Zustände vermischt:

- **Provider erfolgreich geprüft, 0 relevante Facts**
- **Provider/Quelle nicht verfügbar**

Das ist Truth-semantisch falsch.

### Zusätzlich

Nicht valide Provider-Zeilen dürfen nicht dadurch zu einem leeren Array kollabieren, das anschließend wie ein erfolgreicher sauberer Check interpretiert wird. `checked-empty`, `invalid/unknown` und `unavailable` müssen unterscheidbar bleiben.

### Required fix

Führe eine eindeutige semantische Unterscheidung ein, ohne Fake-Entwarnung:

- erfolgreicher Provider + 0 valide relevante akute Facts => **checked / keine aktuelle Safety-Warnung im geprüften Scope**, aber niemals globale Aussage "Reise ist sicher";
- unavailable/timeout/throw => unavailable/temporarily unavailable;
- malformed/invalid response => unknown/fail-closed, nicht checked-clean.

### Pflicht-Regressionstests

1. Provider `evaluate() => []` => API/View **nicht unavailable**; keine Warnung; keine globale Safe-Behauptung.
2. Provider throw/timeout => weiterhin unavailable/temporarily unavailable.
3. Nichtleere, vollständig malformed Providerantwort => unknown/fail-closed und **nicht** checked-clean.
4. Seasonal-only Facts => keine akute Warnung, aber erfolgreiche Providerprüfung darf nicht als unavailable erscheinen.

---

## Closure-Blocker 2 – Provider-Zeilen sind noch nicht vollständig runtime-fail-closed

### Betroffene Dateien

- `lib/safety/normalisieren.ts`
- `lib/safety/scope.ts`
- `lib/safety/engine.ts`
- `lib/safety/provider.ts`

### Reproduzierbare Fehler

Der Port ist TypeScript-typisiert, aber die Task-Regel verlangt ausdrücklich Runtime-Validierung jeder untrusted Providerantwort.

Aktuell kann z. B. ein Array mit einem nicht-Objekt-Element den Array-Check passieren:

- `provider.evaluate() => [null as any]`
- `safetyFactNormalisieren()` greift auf `roh.category` zu
- Runtime-TypeError statt fail-closed Safety-Evaluation.

Ebenso kann ein falscher Runtime-Typ bei `travellerCitizenshipCodes` (z. B. String statt Array) bei `.map()` crashen.

Daneben werden vorhandene, aber malformed decision-relevante Zeitfelder still zu `null` normalisiert:

- malformed `validFrom` / `validUntil` kann ein eigentlich begrenztes Event zu einem offenen Zeitfenster machen;
- malformed `freshUntil` kann still auf den generischen 7-Tage-Max-Age-Fallback fallen.

Das kann falsche Betroffenheit oder falsche Aktualität erzeugen.

### Required fix

- `safetyFactNormalisieren()` muss echte `unknown`-Runtime-Inputs sicher behandeln und niemals werfen.
- Nicht-Objekt-Zeile / falsche Container-Typen => invalid/fail-closed.
- Vorhandene malformed decision-relevante Temporal-/Freshness-Felder dürfen nicht still als "nicht vorhanden" interpretiert werden.
- Invalid rows dürfen den gesamten Providerpfad nicht als 500 verlassen.
- Eine bewusst fehlende optionale Angabe bleibt zulässig; **vorhanden aber ungültig** ist etwas anderes als fehlend.

### Pflicht-Regressionstests

1. Provider liefert `[null]` / Primitive => kein Throw/500, fail-closed unknown.
2. `travellerCitizenshipCodes: 'CH'` oder Objekt => kein Throw; invalid/fail-closed.
3. vorhandenes malformed `validFrom` => keine Warn-Truth.
4. vorhandenes malformed `validUntil` => keine Warn-/Entwarn-Truth.
5. vorhandenes malformed `freshUntil` => nicht `current` durch stillen Fallback.
6. valide fehlende optionale Felder bleiben kompatibel.

---

## Closure-Blocker 3 – feinere Geo-Scopes können Transitroute noch fälschlich als `not_affected` ausschließen

### Betroffene Dateien

- `lib/safety/relevanz.ts`
- `lib/safety/kontext.ts`
- Foundation-D `RouteFacts`

### Reproduzierbarer Fall

`bangkokRouteReise()` besitzt ZRH → **DOH (QA Transit)** → BKK, aber keine Stage in Qatar.

Für einen Fact mit z. B.:

- `spatialScope = { kind: 'admin_region', countryCode: 'QA', ... }`

prüft der aktuelle Admin-Region-Pfad nur `kontext.stages`. Weil keine Stage QA existiert, liefert er `not_affected`.

Die kanonische Route Truth weiß jedoch, dass die Reise Qatar/DOH transitieren wird. Ohne kanonische Regionszugehörigkeit des Transit-Airports kann Jetnity nicht beweisen, dass die Route außerhalb der Region liegt. Das korrekte Ergebnis ist in diesem Fall mindestens `insufficient_context`, nicht `not_affected`.

Dasselbe strukturelle Problem kann feinere `city` / `place` / `point_radius` / `polygon`-Scopes betreffen, wenn die Route ein Land berührt, aber nur Stages für das Feingeometrie-Matching betrachtet werden.

### Required fix

Für feinere-than-country Scopes gilt:

- Wenn **weder Stage noch Route** den Scope schneiden => `not_affected` nur bei belegbarer Negation.
- Wenn die Route das relevante Land/den relevanten Transit-Kontext berührt, aber Jetnity die feinere Membership/Geometrie des Route-Punkts nicht belastbar vergleichen kann => `insufficient_context`.
- Airport-/Corridor-Scopes bleiben weiterhin exakt über Foundation-D Route Truth prüfbar.
- Keine City-/Region-Zuordnung aus Display-Namen raten.

### Pflicht-Regressionstests

1. ZRH→DOH→BKK + Admin-Region QA ohne kanonische Airport-Region => `insufficient_context`, nicht `not_affected`.
2. Derselbe Transit + City/Place QA ohne vergleichbare kanonische Route-Membership => nicht still `not_affected`.
3. Point/Polygon QA + Transit QA ohne Route-Koordinaten => `insufficient_context`.
4. Eindeutig anderes Land ohne Stage/Route-Schnitt => weiterhin `not_affected`.
5. Exakter Airport-Scope DOH => weiterhin `affected` Route/Flight.

---

## Closure-Blocker 4 – Traveller-Fail-Closed und Fingerprints sind semantisch noch nicht vollständig

### Betroffene Dateien

- `lib/safety/engine.ts`
- `lib/safety/fingerprint.ts`
- `lib/readiness/party.ts` / Foundation-E Traveller Truth

### 4A – partielle Traveller-Daten können falsches `not_affected` erzeugen

`travellerRelevant()` sammelt nur alle vorhandenen Citizenship-Codes aus `partyVon(reise)`.

Beispiel:

- Reise hat 2 Reisende.
- Reisender A ist vollständig RS.
- Reisender B existiert, aber Citizenship fehlt/ist noch unbekannt.
- Fact ist travellerabhängig und gilt für CH.

Aktuell existiert mindestens ein Code (`RS`), daher ist `codes.length !== 0`; weil CH nicht gefunden wird, folgt `skip` => `not_affected`.

Das ist nicht beweisbar: Reisender B könnte CH sein. Foundation-E-Fail-Closed verlangt bei unvollständiger relevanter Traveller-Menge `insufficient_context`, sofern kein positiver Match bereits Betroffenheit beweist.

### 4B – `safetyContextFingerprint()` ignoriert Traveller Context, obwohl Evaluation ihn benutzt

Der Context-Fingerprint enthält Stages/Days/Items/Route/Daten, aber keine relevante Party/Citizenship-Wahrheit.

Damit können zwei Trips denselben `contextFingerprint` besitzen, obwohl ein travellerabhängiger Fact nach Citizenship-Wechsel ein anderes Ergebnis liefert (`not_affected` ↔ `affected`). Fingerprint und Evaluation sind dadurch semantisch nicht identisch.

### 4C – `safetyEventFingerprint()` deckt nicht alle evaluation-relevanten Eventänderungen ab

Der Event-Fingerprint enthält aktuell u. a. `factKey`, `status`, `updatedAt`, `validUntil`, Scope – aber nicht z. B. `validFrom`, `freshUntil`, `sourceSeverity`, `advisoryClass` oder Traveller-Anwendbarkeit.

Diese Felder können Relevanz, Freshness oder Präsentationsklasse ändern, ohne dass der Event-Fingerprint wechselt.

Das widerspricht dem Foundation-Auftrag zur deterministischen Invalidation bei Event-Zeitfenster/Freshness/decision-relevanter Semantik.

### Required fix

- Travellerabhängige Evaluation muss die **vollständige relevante Traveller-Menge** fail-closed beurteilen: positiver Match => affected; alle relevanten Traveller vollständig bekannt und kein Match => not_affected; mindestens ein relevanter Traveller unvollständig und kein positiver Match => insufficient_context.
- Verwende die bestehende Foundation-E-Party-/Slot-Wahrheit statt nur vorhandene Codes zu flatten.
- Context-/Evaluation-Fingerprint muss alle Trip-Facts enthalten, die die Safety-Evaluation tatsächlich verändern, ohne sensible Dokumentnummern o. Ä. aufzunehmen.
- Event-Fingerprint muss alle decision-/relevance-/freshness-relevanten Eventfelder abdecken oder durch eine gleichwertige, nachweisbar vollständige Invalidation ersetzt werden.

### Pflicht-Regressionstests

1. 2 Reisende: RS vollständig + zweiter Citizenship unbekannt; Fact CH => `insufficient_context`, nicht `not_affected`.
2. Alle relevanten Traveller vollständig, keiner CH => `not_affected`.
3. Mindestens ein CH => `affected`.
4. Citizenship-Wechsel RS→CH verändert Safety Context/Evaluation Fingerprint bzw. äquivalente Invalidation.
5. `validFrom`-Änderung verändert Event-Fingerprint/Invalidation.
6. `freshUntil`-Änderung verändert Event-Fingerprint/Invalidation.
7. `sourceSeverity` oder `advisoryClass`-Änderung, die Präsentationsklasse ändert, verändert Event-Fingerprint/Invalidation.
8. reine Array-/Input-Reihenfolge bleibt semantisch stabil.

---

## Stop-Kriterium für die nächste Runde

Diese vier Findings sind direkt aus aktuellem Code ableitbar und betreffen:

- Safety-/Evidence-Truth,
- falsches `unavailable` / checked-state,
- falsche räumliche Entwarnung bei Transit,
- Fail-Closed Provider-Grenze,
- Traveller-Truth,
- zentrale Fingerprint-/Invalidation-Funktion.

Nach Behebung dieser vier Gruppen darf der nächste Review **nicht** wegen Stil, theoretischer Mikro-Härtung oder provider-spezifischer Details ohne konkreten Adapter weiter verlängert werden.

Merge-blocking bleibt danach nur ein konkreter reproduzierbarer oder direkt code-derived Defekt mit relevantem Einfluss auf Safety-Truth, falsche Warnung/Entwarnung, Security/Cross-Trip/Cross-User, Daten-/Source-of-Truth, Rollout oder zentrale Foundation-Funktion.

## Governance

PR #37 bleibt Draft.  
Kein Mark Ready.  
Kein Merge.  
Keine Production-Migration.  
Kein echter Safety-Provider.
