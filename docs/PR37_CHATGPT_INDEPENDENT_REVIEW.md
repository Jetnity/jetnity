# PR #37 – Unabhängiger ChatGPT Review: Travel Safety & Disruption Foundation

Stand: 23. August 2026  
Review-Code-Head: `caa6f7dd2d034b98457e3c79fc89e02f04b2116b`  
PR: #37 `feat/travel-safety-disruption-intelligence` → `main`  
Status: **REQUEST CHANGES / Draft bleibt Draft**

## Gesamturteil

Die Foundation ist strukturell stark und die Remote-Gates sind auf dem geprüften Head grün. Der Review folgt aber ausdrücklich `docs/INDEPENDENT_REVIEW_DEPTH_STANDARD.md`, `docs/PRODUCT_OWNER_REVIEW_DEPTH_MANDATE.md` und dem Stop-Kriterium aus `docs/CURSOR_TRAVEL_SAFETY_DISRUPTION_FOUNDATION_TASK.md`: grüne Tests ersetzen keinen Truth-/Fail-Closed-Review.

Auf dem tatsächlichen Code-Head `caa6f7dd` bestehen vier konkrete merge-blockierende Defektgruppen mit direktem Einfluss auf Safety-/Evidence-Truth, räumliche Betroffenheit, Order-Independence bzw. zentrale Provider-Readiness. Sie sind keine theoretische Mikro-Härtung.

## Bestätigte Stärken

- `safetyProviderAus()` bleibt `null`; kein Live-Provider, keine Secrets, keine Providerkosten.
- Eigene Safety-Domäne statt Readiness-/Seasonal-Vermischung.
- Foundation-D Route Facts werden wiederverwendet.
- Browser-/LLM-Felder können keine Provider-Evidence setzen.
- Country-Level bleibt Country-Level.
- Transit-Airport kann Route betreffen, ohne das Ziel pauschal zu markieren.
- Keine automatische Reiseänderung.
- Kein Safety-DB-Schema / keine Production-Migration.
- `1393/1393` lokale Tests laut Acceptance; CI und Vercel auf dem finalen Docs-Head `caa6f7dd` remote grün.
- Branch war beim Review `0 behind` aktuellem `main` (`91e644b2`).

---

# Merge-Blocker 1 – Freshness vermischt Event-Zeitfenster mit Evidence-Aktualität

Betroffene Dateien:

- `lib/safety/evidence.ts`
- `lib/safety/engine.ts`
- `lib/safety/scope.ts`
- `lib/safety/engine.test.ts`

## Problem A: alte Evidence ohne Event-Ende bleibt unbegrenzt `current`

`safetyEvidenceVertrauenswuerdig()` prüft bei `checkedAt` nur Zukunfts-Skew. `safetyFrische()` besitzt keine maximale Evidence-Altersgrenze bzw. kein separates Evidence-Expiry/Fresh-Until. Wenn ein Fact `checkedAt` besitzt, aber kein `validUntil`, kann eine Jahre alte Abfrage weiterhin `current` bleiben.

Das verletzt die bindende Regel, dass veraltete Safety-Evidence nicht still aktuell weiterlaufen darf.

## Problem B: Event-`validFrom` wird fälschlich als Evidence-`validFrom` benutzt

`temporalScopeLesen()` nutzt Provider-`validFrom` als Beginn des **Event-Zeitfensters**. `evaluationAusFact()` reicht genau diesen Wert anschließend an `safetyFrische({ validFrom: ... })` weiter. `safetyFrische()` setzt dann `never_checked`, solange `now < validFrom`.

Konkreter Fehlerfall:

- heute wurde eine offizielle, aktuelle Störung für morgen geprüft,
- die Störung beginnt morgen und überschneidet sich mit der geplanten Reise,
- `checkedAt` ist aktuell,
- trotzdem wird die Evaluation bis zum Ereignisbeginn `never_checked` / UI `unknown` und kann keine fachlich belegte Warnung zeigen.

Event-Gültigkeit und Evidence-Freshness sind unterschiedliche Achsen und dürfen nicht dieselben Felder teilen.

## Erforderliche Korrektur

- Event-Zeitfenster (`eventStart`/`eventEnd` bzw. bestehendes `temporal`) von Evidence-Freshness/Expiry sauber trennen.
- Definieren, wodurch eine Providerprüfung als aktuell gilt, z. B. explizites provider-neutrales `freshUntil`/`expiresAt` oder eine konservative interne Max-Age-Regel, die später adapterseitig präzisiert werden kann.
- Fehlt ausreichende Freshness-Information, fail closed statt unbegrenzt `current`.
- Ein zukünftig beginnendes, aber **heute aktuell belegtes** Event darf nicht allein wegen seines Event-Starts `never_checked` werden.

Pflichttests ergänzen:

1. sehr altes `checkedAt`, kein Event-Ende → **nicht `current`**;
2. aktuelles `checkedAt`, Event beginnt während einer zukünftigen Reise → Evidence bleibt current, zeitliche Relevanz wird separat bewertet;
3. Event-Zeitfenster ändert sich → Relevance ändert sich, ohne Evidence-Freshness semantisch zu verfälschen;
4. fehlende/ungültige Freshness-Metadaten → fail closed.

---

# Merge-Blocker 2 – Geo-Relevance kann `not_affected` behaupten, obwohl Jetnity die Lage nicht beweisen kann

Betroffene Dateien:

- `lib/safety/relevanz.ts`
- `lib/safety/scope.ts`
- `lib/places/domain.ts`
- `lib/safety/engine.test.ts`

Dieser Punkt verletzt direkt ADR-0128 und Task §8.5: Fehlen Geofakten für einen belastbaren Vergleich, muss `insufficient_context` / `unknown` entstehen, nicht eine Entwarnungssemantik.

## Problem A: `admin_region` wird aus ungeeigneten Feldern geraten

Für eine administrative Region versucht der Code aktuell u. a.:

```ts
scope.regionCode && etappe.placeId && etappe.placeId.endsWith(scope.regionCode)
```

Kanonische Jetnity-Place-IDs haben jedoch Formen wie `geonames:3173435` oder `airport:ZRH`; sie kodieren **keine administrative Region**. Ein Suffixvergleich ist daher keine belastbare Region-Membership.

Alternativ wird `regionName` mit dem **Stage-Namen** verglichen. Eine Stage `Mailand` beweist aber nicht durch ihren Namen, ob sie in einer Provider-Region `Lombardei` liegt.

Danach führt derselbe Code bei vorhandenem Stage-Place/Koordinaten im selben Land zu `not_affected`. Beispiel:

- Provider-Scope: Region Lombardei / IT,
- Stage: Mailand / IT mit kanonischem GeoNames-Place,
- Jetnity besitzt aktuell keine kanonische Stage→Region-Membership,
- aktueller Code kann `not_affected` liefern, obwohl Mailand tatsächlich in der betroffenen Region liegt.

Das ist eine falsche Entwarnungszuordnung.

## Problem B: City-Name-Fallback ist keine kanonische Identität

Wenn die Quelle für `city` keinen `placeId` liefert, kann gleicher Länder-Code + gleicher freier City-Name als exakter Treffer behandelt werden; bei abweichender Schreibweise kann umgekehrt `not_affected` entstehen. Solange keine kanonische Provider-City-ID auf Jetnity-Place-ID aufgelöst ist, ist Name-Matching keine ausreichende Truth-Grenze.

## Problem C: Polygon/Radius ohne Stage-Koordinaten und ohne Scope-Land kann fälschlich `not_affected` werden

`unklar` wird bei fehlenden Stage-Koordinaten nur gesetzt, wenn `imSelbenLand(etappe)` wahr ist. Hat eine valide Polygon-/Radiusquelle kein `countryCode`, fehlen Jetnity aber Stage-Koordinaten, kann der Code den räumlichen Vergleich nicht durchführen und fällt trotzdem auf `not_affected` zurück.

## Erforderliche Korrektur

- `not_affected` nur dann zurückgeben, wenn die Nicht-Betroffenheit **belegt** ist.
- Admin-Region nur mit belastbarer kanonischer Region-Membership vergleichen. Solange Jetnity diese Relation nicht besitzt: im selben potenziell relevanten Land `insufficient_context`, nicht Suffix-/Name-Raten.
- City ohne gemeinsame kanonische Place-ID/vergleichbare belastbare Referenz nicht über bloßen Namen zur sicheren Match-/No-Match-Truth erheben.
- Polygon/Radius bei fehlenden notwendigen Stage-Koordinaten → `insufficient_context`, wenn Nicht-Betroffenheit nicht anderweitig beweisbar ist.
- Keine neue Geo-DB nur für diesen Fix erfinden. Falls aktuelle Daten nicht reichen, ehrlich unknown bleiben.

Pflichttests ergänzen:

1. Region Lombardei + Stage Mailand ohne kanonische Region-Membership → `insufficient_context`, niemals `not_affected`;
2. gleiches Land, andere **belegt** referenzierte Stadt → `not_affected` weiterhin erlaubt;
3. City nur per nicht-kanonischem Namen / Schreibvariante → kein falsches `not_affected`;
4. Polygon/Radius ohne Scope-Land + Stage ohne Koordinaten → `insufficient_context`;
5. gleiche Fälle mit wirklich kanonischem Place-/Coordinate-Match → `affected`.

---

# Merge-Blocker 3 – Provider-Fact-Verarbeitung ist noch order-dependent und kann relevante Facts verlieren

Betroffene Dateien:

- `lib/safety/normalisieren.ts`
- `lib/safety/konflikt.ts`
- `lib/safety/engine.ts`
- `lib/safety/engine.test.ts`

## Problem A: Konfliktsignatur enthält nicht alle decision-relevanten Felder

`entscheidungsSignatur()` enthält aktuell Category, Status, Nature, Severity, Advisory, Scope und Event-Zeitfenster. Sie enthält jedoch insbesondere nicht:

- `travellerDependent`
- sortierte `travellerCitizenshipCodes`
- den resultierenden Trust-Zustand (`vertrauenswuerdig`) bzw. eine deterministische Evidence-Auswahl

Dadurch können zwei Zeilen desselben `factKey` als „identisch“ dedupliziert werden, obwohl sie für die Entscheidung verschieden sind.

Konkretes order-dependent Beispiel:

- Zeile A: derselbe Fact, `travellerDependent=false`;
- Zeile B: derselbe Fact, `travellerDependent=true`, nur für `RS`;
- alle derzeit signierten Felder sind identisch.

Da die Sortierung bei identischer Signatur keinen weiteren Tie-Breaker besitzt, bleibt faktisch die zuerst gelieferte Zeile erhalten. Bei umgekehrter Provider-Reihenfolge kann dieselbe Reise daher `affected` oder `not_affected` erhalten.

Dasselbe Problem entsteht, wenn zwei semantisch gleiche Zeilen unterschiedliche Trust-Qualität besitzen (z. B. valide vs. ungültige vorhandene Source-URL): URL-Differenz allein soll zu Recht kein semantischer Konflikt sein, aber die Evidence-Auswahl muss trotzdem deterministisch sein und darf die Warnklasse nicht von der Eingabereihenfolge abhängig machen.

## Problem B: `maxFacts` wird durch rohe Input-Reihenfolge abgeschnitten

Die Engine macht aktuell:

```ts
providerFacts.slice(0, SAFETY_GRENZEN.maxFacts)
```

**vor** Normalisierung / Deduplizierung / Konflikterkennung. Liefert ein Provider mehr als 40 Zeilen, kann ein kritischer Fact an Position 41 still verschwinden. Durch Umordnen derselben Facts kann er wieder erscheinen.

Das ist genau die Art order-dependent Safety-Truth, die der Task verbietet.

## Problem C: explizit malformed Normalisierungsfelder dürfen nicht in stärkere Semantik fallen

Beispiel `nature`: ein vorhandener, aber unbekannter Runtime-Wert fällt aktuell auf `'acute'` zurück. Damit kann ein malformed/unerkanntes saisonales Nature-Feld als akutes Safety-Event weiterlaufen. Der Task verlangt für malformed Providerantworten fail closed und die klare Safety-vs-Seasonal-Grenze.

## Erforderliche Korrektur

- Zentrale decision/trust signature bzw. deterministische Merge-Strategie definieren, die alle aktuell entscheidungsrelevanten Semantiken umfasst.
- Traveller-Abhängigkeit und die normalisierte Citizenship-Menge müssen order-independent berücksichtigt werden.
- Evidence-URL-Unterschied allein darf weiterhin kein Konflikt sein; bei mehreren Evidence-Zeilen aber deterministic trust selection oder fail-closed conflict, niemals first-row-wins.
- `providerFacts.length > maxFacts` nicht still durch rohe Reihenfolge abschneiden. Fail closed als Response-Integrity-Problem oder eine fachlich begründete deterministische Strategie verwenden, die keine Warnung aufgrund Position 41 verlieren lässt.
- Explizit vorhandene ungültige Enum-/Semantikwerte nicht in stärkere Default-Semantik (`acute`) umdeuten. Absent/default und malformed unterscheiden.

Pflichttests ergänzen:

1. traveller-dependent vs. trip-level Duplicate, reverse order → exakt identisches fail-closed Resultat;
2. unterschiedliche Citizenship-Mengen, reverse order → identisch;
3. trusted + untrusted Evidence-Duplicate, reverse order → identisch und keine first-row-wins-Warnklasse;
4. 41+ Facts mit kritischem Fact einmal vorn/einmal hinten → kein unterschiedliches Safety-Ergebnis;
5. explizit malformed `nature` → keine akute Warnung;
6. identische echte Duplikate bleiben deduplizierbar; unterschiedliche URL allein bleibt kein semantischer Konflikt.

---

# Merge-Blocker 4 – Provider-Timeout ist im Port/Engine nicht umgesetzt

Betroffene Dateien:

- `lib/safety/provider.ts`
- `lib/safety/engine.ts`
- `app/api/safety/evaluate/route.ts`
- Tests

Der verbindliche Task verlangt ausdrücklich:

> `timeout / throw / malformed / unavailable => kein erfundener Safety-Fact`

und die Pflicht-Testmatrix nennt:

> `Provider throw/timeout => fail closed.`

Der aktuelle Test deckt nur einen sofortigen `throw` ab. `SafetyProvider.evaluate()` erhält kein Abort-Signal und `safetyAuswerten()` besitzt keine eigene Timeout-Grenze / `Promise.race` / Abort-Logik. `maxDuration = 10` am Next-Route-Handler ist keine fachliche Fail-Closed-Providerbehandlung; bei einem hängenden Provider kann die Plattform die Route beenden, statt eine definierte `source_temporarily_unavailable`-Evaluation zu liefern.

## Erforderliche Korrektur

- provider-neutrales Timeout-Verhalten in der Orchestrierung definieren;
- bevorzugt AbortSignal/Timeout so modellieren, dass ein echter Adapter später sauber abbrechen kann;
- Timeout muss als ehrlicher `source_temporarily_unavailable`/unknown Zustand zurückkommen, nicht als Request-Absturz;
- Timer/Abort sauber aufräumen.

Pflichttests:

1. nie auflösender / länger als Test-Timeout wartender Provider → definierter fail-closed Output;
2. normaler schneller Provider bleibt unverändert;
3. Throw und Timeout bleiben semantisch unterscheidbar nur soweit nötig, beide erzeugen keine Warn-Truth.

---

## Nicht merge-blockierend in diesem Review

Diese Punkte bleiben bewusst **keine** Blocker dieser Foundation, solange kein konkreter Verlust-/Truth-Fall entsteht:

- In-process Rate-Limit vor echtem kostenpflichtigem Production-Provider; separates Provider-Gate bleibt verpflichtend.
- API lädt Account-Reise aktuell nicht per `tripId`. Vor echter Provideraktivierung sollte Account serverseitig bevorzugt kanonisch geladen werden; im jetzigen providerlosen Foundation-Block ist dies ein dokumentiertes Follow-up.
- Keine Safety-Persistenz ist gemäß ADR-0127 akzeptiert.
- `Jetzt wichtig` wird bewusst erst im großen Workspace-Block integriert.
- Title-only Stay/Activity ohne strukturierte Geo-Facts bleibt bewusst nicht geraten.
- Produktionscode nutzt in `tripAusSafetyAnfrage()` aktuell `beispielreise()` als Basisobjekt, überschreibt aber die heute safety-relevanten Felder. Das ist Architekturhygiene und sollte bei Gelegenheit durch einen expliziten neutralen Builder ersetzt werden; es ist in diesem Review kein eigenständiger Truth-Blocker.

## Nächster Schritt

Derselbe Cursor-Agent soll **nur diese vier Defektgruppen** beheben, die dazugehörigen Tests ergänzen und danach das vollständige Abschluss-Gate auf exakt dem neuen finalen Head wiederholen.

Harte Governance bleibt:

- PR #37 bleibt Draft.
- Kein Mark Ready.
- Kein Merge.
- Keine Production-Migration.
- Kein Live-Provider / keine Secrets / keine neuen laufenden Kosten.

Nach Cursor-Fix folgt ein unabhängiger ChatGPT-Re-Review gegen den tatsächlichen neuen Code-Head. Danach gilt das Stop-Kriterium aus dem ursprünglichen Safety-Task: nur noch konkrete, direkt code-derived Defekte mit relevantem Safety-/Evidence-/Geo-/Security-/Cross-Domain-/Rollout-Impact dürfen blockieren.