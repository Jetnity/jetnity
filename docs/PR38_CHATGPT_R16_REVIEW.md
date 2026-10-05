# PR #38 – ChatGPT Independent Review R16

Stand: 24. August 2026  
Status: **REQUEST CHANGES – R15-Blocker 30 im `FlugOption`-Pfad geschlossen; neuer R16-Blocker 31: untrusted `routeItinerary` kann dieselbe Surface-Evidence weiterhin selbst behaupten**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Geprüfter Runtime-Head: `5cc4488e3b30aeb3c8afe1eb2ff7bc9627987e88`  
Docs-Lock vor R16: `3d632ca048633d96b389327522468ce6a0592f5f`  
PR-Zustand vor diesem Review-Dokument: **open, Draft, mergeable, nicht gemergt**

## 1. R16-Urteil

R15-Blocker 30 ist im konkret korrigierten `FlugOption`-Pfad substanziell geschlossen:

- `itineraryAusFlugOption()` setzt keine Surface-Evidence mehr aus bloßer Segment-Array-Nachbarschaft.
- Untrusted `FlugOption` mit `LAX→JFK` + `SFO→NRT` bleibt ohne Surface-Evidence.
- Extra-Felder wie ein eingeschleustes `surfaceFromAirportCode` werden durch das `FlugOption`-Schema nicht in die gelesene Option übernommen.
- `provider` und `externalRef` werden nicht als Surface-Beweis verwendet.
- Die R15-Regressionssuite deckt den korrigierten Pfad, Save→Reload, Guest/Account-Parität und Cross-Domain-Fingerprints ab.
- GitHub Actions Run `32675079113` ist SUCCESS auf exakt Runtime `5cc4488e3b30aeb3c8afe1eb2ff7bc9627987e88`.
- Vercel Preview `dpl_CxwJcoU3PcMddaGKDaXvJAxZuBMj` ist READY auf exakt diesem Runtime-Head.

**Noch kein Closure/PASS.** R16 findet einen zweiten, unabhängigen Browser→Server-Pfad zur exakt gleichen unbewiesenen Surface-Truth.

## 2. Merge-Blocker 31 – Browser-/LocalStorage-`routeItinerary` darf `surfaceFromAirportCode` weiterhin selbst zur Truth erklären

### Betroffene Stellen

- `lib/route/schema.ts`
- `lib/trips/schema.ts`
- `lib/trips/aktionen.ts`
- `lib/trips/anlegen.ts`
- `lib/route/kanonisieren.ts`
- `lib/route/itinerary.ts`
- `lib/route/chronologie.ts`
- `supabase/migrations/20260824120000_flug_route_itinerary_surface_evidence.sql`
- Guest→Account / Save→Reload / Route-Fingerprint / Readiness / Safety / Seasonal

### Konkretes Problem

Der R15-Fix schützt `FlugOption`, aber `FlugRouteItinerary` hat eine zweite Trust-Grenze.

`lib/route/schema.ts` dokumentiert selbst, dass eine Route-Itinerary aus **Browser, Local Storage oder metadata** kommen kann. Trotzdem akzeptiert `segmentSchema` das Feld:

```ts
surfaceFromAirportCode: iata.nullable().optional()
```

Ein Gast-/Browser-Entwurf kann deshalb direkt eine strukturell gültige `routeItinerary` mit einer selbst behaupteten Surface-Evidence liefern.

Der Serverpfad schützt diese Provenance heute nicht:

1. `gastreiseUebernehmen()` akzeptiert die untrusted Nutzlast über `reiseNutzlastSchema`.
2. `reiseAusNutzlastAnlegen()` lädt nur die IATA-Referenzen serverseitig und ruft `reiseNutzlastRouteKanonisieren()` auf.
3. `reiseNutzlastRouteKanonisieren()` liest die Browser-Itinerary mit `flugRouteItineraryLesen()` und gibt sie an `itineraryKanonisieren()`.
4. `itineraryKanonisieren()` verwirft Client-Land/Stadt korrekt, **erhält aber jedes syntaktisch gültige `surfaceFromAirportCode`**.
5. Die Development-DB-Funktion `public.flug_route_itinerary_metadata(text,jsonb)` erhält ebenfalls jedes syntaktisch gültige `surfaceFromAirportCode` und persistiert es.
6. `chronologie.ts` behandelt diese Angabe als explizite Surface-Evidence, wenn sie dem vorherigen Destination-IATA entspricht.

Damit kann derselbe Truth-Defekt wie in R15 weiterhin über einen anderen untrusted Input-Pfad entstehen.

### Konkretes Gegenbeispiel

Eine Browser-/LocalStorage-`routeItinerary` enthält in einem Leg:

1. `LAX → JFK`
2. `SFO → NRT`, zusätzlich `surfaceFromAirportCode='JFK'`

Es gibt keinerlei serverseitig belegten Transfer `JFK ⇢ SFO`.

Trotzdem:

- das Route-Schema akzeptiert die Itinerary;
- die serverseitige IATA-Kanonisierung erhält `surfaceFromAirportCode='JFK'`;
- die Development-DB-Kanonisierung erhält und persistiert das Feld;
- die Chronologie kann die gemischte Kette `LAX → JFK ⇢ SFO → NRT` dadurch als bewiesen behandeln.

Der R15-Test gegen eingeschleuste Extra-Felder in `FlugOption` verhindert diesen Pfad nicht, weil hier nicht `FlugOption`, sondern die bereits geformte `routeItinerary` manipuliert wird.

### Live-Development-Reproduktion

Supabase Development: `yfvbxvijcorffwxbxahl`.

Eine read-only SELECT-Probe gegen die aktive Funktion `public.flug_route_itinerary_metadata('flight', ...)` mit genau obigem `LAX→JFK`, `SFO→NRT` und `surfaceFromAirportCode='JFK'` liefert als kanonisches Ergebnis die zweite Strecke **mit erhaltenem `surfaceFromAirportCode='JFK'`** zurück.

Zusätzlich unabhängig verifiziert:

- Funktion ist `SECURITY INVOKER`.
- `anon`: kein EXECUTE.
- `authenticated`: EXECUTE.
- Migration `20260824120000_flug_route_itinerary_surface_evidence` liegt auf Development.
- Dieselbe Migration liegt **nicht** auf Production.

Die DB-Persistenz ist also konsistent mit ihrem aktuellen Vertrag – das Problem ist, dass dieser Vertrag keine Evidence-Provenance von untrusted Browserdaten unterscheidet.

## 3. Warum das ein Merge-Blocker ist

`surfaceFromAirportCode` ist im Domainmodell nicht als `user`, `provider`, `server` oder andere Provenance klassifiziert. Für die Route-Engine ist es schlicht „explizite Surface-Evidence“.

Damit kann untrusted Clientzustand nicht nur Darstellung beeinflussen, sondern eine **belegte kanonische Route-Truth** erzeugen. Diese Truth fließt weiter in:

- Origin/Destination und Connections,
- Route-Fingerprint,
- Readiness,
- Safety,
- Seasonal,
- Guest→Account-Persistenz.

Das verletzt die bereits verbindliche R15-Grenze: Browserfelder dürfen keine Provider-/Route-Evidence allein dadurch werden, dass sie syntaktisch plausibel sind.

## 4. Erforderliche Korrektur

Die Lösung muss die **Quelle der Surface-Evidence** an der Trust-Grenze unterscheiden.

Akzeptable Richtungen:

1. **Fail-closed Foundation:** Browser-/LocalStorage-/Guest-Input darf `surfaceFromAirportCode` nicht als belegte Evidence einbringen. Beim untrusted Intake wird das Feld verworfen/abgelehnt. Ohne serverseitig belegte Quelle bleibt die Lücke `unknown`.
2. **Getrennter trusted Parser/Contract:** Persistierte bzw. serverseitig erzeugte Evidence darf nur über einen explizit trusted Schreibpfad erhalten werden. Der allgemeine Browser-Parser darf nicht derselbe Evidence-Parser sein.
3. **Server-verifizierte Provider-Evidence:** Später über opaque/signed Selection-Snapshot oder äquivalenten provider-neutralen Trust-Contract.
4. **Explizite Nutzerdeklaration nur als eigene Evidence-Klasse:** Falls später gewünscht, muss sie als `user`-Truth modelliert und fachlich entsprechend behandelt werden; sie darf nicht still wie Provider-/Server-Evidence wirken.

Nicht ausreichend:

- nur `FlugOption` weiter härten;
- nur IATA-Form prüfen;
- `provider`/`externalRef` aus dem Browser als Vertrauensbeweis verwenden;
- Country-/Distanz-/Stadt-Heuristiken;
- DB-Persistenz unverändert lassen, wenn der Client dieselbe Evidence weiterhin direkt behaupten kann.

## 5. Pflicht-Regressionen Blocker 31

1. Manipulierte Guest-/Browser-`routeItinerary` mit `LAX→JFK`, `SFO→NRT`, `surfaceFromAirportCode='JFK'` bleibt nach Server-Kanonisierung **chronology unknown**.
2. Guest→Account derselben Nutzlast darf keine Surface-Evidence adeln.
3. Save→Reload darf untrusted Surface-Evidence nicht plötzlich zu belegter Truth machen.
4. Der DB-/Schreibvertrag darf eine beliebige Clientbehauptung nicht allein wegen gültiger IATA-Syntax als belegte Surface-Evidence persistieren.
5. `FlugOption`-R15-Regressionen bleiben grün: Browser-Extra-Felder, `provider`, `externalRef` erzeugen keine Evidence.
6. Ein später zulässiger **trusted** Surface-Evidence-Pfad muss, falls in diesem Foundation-Scope vorhanden, Save→Reload stabil überleben; andernfalls fail-closed `unknown`.
7. Echter `CDG⇢ORY`-Airport-Change ist nur mit einer ausdrücklich zulässigen Evidence-Quelle bewiesen.
8. Kontinuierlicher `ZRH→DOH→BKK` bleibt bewiesen.
9. Route-Fingerprint/Readiness/Safety/Seasonal sehen dieselbe korrigierte Truth vor/nach Persistenz und Guest→Account.
10. R1–R15 Regressionen, Typecheck/Lint/Build/UI, DB-Rechte/RLS/Security/Parallelität bleiben grün.
11. Production bleibt ohne die Development-Migration, solange keine separate Product-Owner-Freigabe vorliegt.

## 6. Infra-/Release-Evidence in R16

Vor diesem Review-Dokument unabhängig bestätigt:

- `main`: `cd220beb44d90ae376feeb8de9db8a3afb808d60`.
- PR #38: open, Draft, mergeable, nicht gemergt; Head `3d632ca048633d96b389327522468ce6a0592f5f`.
- Runtime `5cc4488e`: GitHub CI SUCCESS (`32675079113`) und Vercel READY (`dpl_CxwJcoU3PcMddaGKDaXvJAxZuBMj`).
- Docs-Lock `3d632ca`: GitHub CI SUCCESS (`32675858792`) und Vercel READY (`dpl_GcW1UCPMvVS7yWFExRpseDaNc3Ht`).
- Vercel Production `jetnity-app.vercel.app`: READY auf `main` `cd220beb`.
- Vercel Runtime Errors letzte 24h: keine gefunden.
- Supabase Production `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY.
- Supabase Development `yfvbxvijcorffwxbxahl`: ACTIVE_HEALTHY.
- Migration `20260824120000_flug_route_itinerary_surface_evidence`: Development ja, Production nein.

Supabase Security Advisor meldet bestehende WARNs zur GraphQL-Exponierung verschiedener Tabellen und zu mehreren `SECURITY DEFINER`-RPCs. Diese Warnungen sind nicht automatisch ein Datenleck und werden durch R16 nicht als PR-#38-Regression behauptet; sie bleiben separate Security-Evidence für die spätere zentrale Prüfung.

## 7. Scope bleibt geschlossen

R16 eröffnet keine Seasonal-Provider-, Secret- oder Kostenanforderung.

Weiterhin:

- `seasonalProviderAus()` bleibt `null`;
- keine Seasonal-Tabelle;
- keine Live-Provider-Aktivierung;
- keine neuen Secrets;
- keine neuen laufenden Providerkosten;
- **keine Production-Migration** durch diesen Review.

## 8. Stop-Kriterium / nächster Schritt

Nur Blocker 31 kohärent schließen. Danach:

1. Exact-Head-Gate auf neuem Runtime-Head.
2. Unabhängiger ChatGPT-Re-Review **R17**.
3. R17 prüft gezielt die Evidence-Provenance an allen Browser/LocalStorage/Guest→Server/DB-Grenzen, Save→Reload, Guest/Account-Parität und prior blockers.
4. Wenn R17 keinen neuen konkreten relevanten Defekt findet, nach strengem Stop-Kriterium technisches Closure/PASS dokumentieren und die Review-Schleife beenden.

PR bleibt Draft. **Kein Mark Ready. Kein Merge ohne ausdrückliche Product-Owner-Freigabe.**
