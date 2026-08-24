# PR #38 – ChatGPT Independent Review R15

Stand: 24. August 2026  
Status: **REQUEST CHANGES – R14-Blocker 29 geschlossen; neuer R15-Blocker 30: Surface-Evidence wird aus untrusted Segment-Array erfunden**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Geprüfter Runtime-Head: `771c63a97f93f442dbc3856dc4218ce458dfecdf`  
Docs-Lock vor R15: `096beb1fd4be60e4a45a42454dd76d6b69d2e23e`  
PR-Zustand: **open, Draft, nicht gemergt**

## 1. R15-Urteil

R14-Blocker 29 ist substanziell geschlossen:

- Development-Funktion `public.flug_route_itinerary_metadata(text,jsonb)` erhält gültiges `surfaceFromAirportCode`.
- Ungültiges Surface-IATA fail-closed.
- `anon` hat kein EXECUTE; `authenticated` hat EXECUTE; Funktion bleibt SECURITY INVOKER.
- GitHub Actions Run `32673505102` ist SUCCESS auf exakt Runtime `771c63a9`.
- Vercel Deployment `dpl_FhcvfAb7tPL17xYDd5Bm38tpzCqU` ist READY und trägt `githubCommitSha=771c63a97f93f442dbc3856dc4218ce458dfecdf`.
- Docs-Lock `096beb1f` ist genau ein nachfolgender Docs-Commit; dessen CI Run `32674333396` ist SUCCESS.

Noch kein Closure/PASS. R15 findet einen neuen konkreten Truth-Defekt **vor** der DB-Persistenzgrenze.

## 2. Merge-Blocker 30 – `surfaceEvidenceSetzen()` adelt jede untrusted Segment-Lücke zu Surface-Truth

### Betroffene Stellen

- `lib/flights/schema.ts`
- `lib/flights/aktionen.ts`
- `lib/flights/uebernahme.ts`
- `lib/route/itinerary.ts`
- `lib/route/chronologie.ts`
- `supabase/migrations/20260824120000_flug_route_itinerary_surface_evidence.sql`
- Guest→Account / Route-Fingerprint / Readiness / Safety / Seasonal

### Konkretes Problem

`lib/flights/schema.ts` dokumentiert ausdrücklich, dass die Flugoption, die in die Reise wandert, **aus dem Browser kommt und untrusted input ist**. `flugOptionSchema` prüft Form/IATA/Datumsfelder, aber nicht, dass Segmente innerhalb eines Legs eine bewiesene zusammenhängende Reihenfolge oder einen explizit belegten Ground-/Airport-Change haben.

Trotzdem setzt `lib/route/itinerary.ts` in `surfaceEvidenceSetzen()` bei jedem Array-Nachbarn mit `previous.destination !== current.origin` automatisch:

```ts
return { ...segment, surfaceFromAirportCode: dest }
```

Damit wird aus bloßer deklarierter Array-Nachbarschaft eine neue Sequence-Evidence erzeugt.

### Konkretes Gegenbeispiel

Eine syntaktisch gültige, aber unverbundene Browser-Flugoption mit einem Leg und zwei Segmenten:

1. `LAX → JFK`
2. `SFO → NRT`

enthält **keine** externe Ground-/Surface-Evidence.

Der aktuelle Pfad ist aber:

1. `flugKontoUebernahmeSchema` akzeptiert die Struktur, weil beide Segmente formal gültig sind.
2. `flugInReiseUebernehmen()` nimmt die Browser-Option serverseitig entgegen.
3. `alsFlugMomentaufnahme()` ruft `itineraryAusFlugOption()` auf.
4. `surfaceEvidenceSetzen()` sieht `JFK !== SFO` und setzt am zweiten Segment `surfaceFromAirportCode='JFK'`.
5. `chronologie.ts` akzeptiert damit die gemischte Kante `JFK ⇢ SFO` als Surface-Evidence.
6. Die neue R14-DB-Funktion persistiert diese Evidence anschließend korrekt und dauerhaft.

Damit kann genau die unbewiesene Segment-Nachbarschaft, die R12/R13 fail-closed behandeln sollten, über den Flugübernahmepfad wieder zu `chronologieBewiesen=true` werden.

Das ist nicht nur theoretisch: Die Server-Action kommentiert selbst, dass die Option aus dem Browser kommt und erneut nur gegen das Jetnity-Schema geprüft wird. Es gibt an dieser Stelle keinen serverseitigen Provider-Snapshot/opaque selection token, der beweist, dass diese konkrete Surface-Kante wirklich vom Provider stammt.

### Warum Blocker 29 dadurch nicht rückgängig gemacht wird

Die neue DB-Migration ist an sich richtig: **gültige bereits vorhandene Evidence soll Persistenz überleben.**

Der Fehler liegt davor: Jetnity muss zuerst unterscheiden, ob Surface-Evidence wirklich belegt ist. Persistenz darf keine erfundene Evidence verlieren – aber die Runtime darf sie ebenso wenig aus bloßer Array-Differenz erfinden.

### Erforderliche Korrektur

`surfaceEvidenceSetzen()` darf nicht aus `previous.destination !== current.origin` allein eine bewiesene Surface-Kante erzeugen.

Akzeptable Richtungen:

1. **Fail-closed Foundation:** Diskontinuierliche Segmente bleiben unknown, solange keine serverseitig belegte Surface-Evidence existiert.
2. **Server-verifizierte Provider-Evidence:** Die Auswahl wird über einen serverseitigen/opaque/signed Snapshot oder einen anderen neutralen Trust-Contract persistiert; nur daraus darf Surface-Evidence entstehen.
3. **Explizite Nutzerdeklaration als eigene Evidence-Klasse:** Falls Jetnity später manuelle Ground-Transfers zulässt, müssen sie als bewusst bestätigte User-Truth modelliert werden, nicht automatisch aus Array-Lücken entstehen und nicht als Provider-Evidence erscheinen.

Nicht akzeptabel:

- Country-/Distanz-/Stadt-Heuristik;
- bloße Segment-Array-Reihenfolge als Beweis;
- `provider`/`externalRef` aus dem Browser als alleiniger Vertrauensbeweis;
- Rückkehr zum blanket-all-IATA-Fallback.

### Pflicht-Regressionen Blocker 30

1. Untrusted `FlugOption` mit `LAX→JFK`, `SFO→NRT` im selben Leg erzeugt **keine** Surface-Evidence und bleibt chronology unknown.
2. Dieselbe Option in umgekehrter Array-Reihenfolge erzeugt keine andere semantische Truth nur durch Permutation.
3. Echter `CDG⇢ORY`-Airport-Change bleibt nur dann bewiesen, wenn eine zulässige explizite Evidence-Quelle vorhanden ist.
4. Browser-Manipulation von `provider`, `externalRef` oder Segmentarray darf keine Provider-Evidence erzeugen.
5. Save→Reload bewahrt belegte Evidence, erfindet aber keine neue.
6. Guest→Account bewahrt dieselbe Truth-Parität.
7. R13/R14 DB-Persistenzregressionen bleiben grün.
8. Route-Fingerprint/Readiness/Safety/Seasonal sehen dieselbe corrected Truth.
9. Unique continuous `ZRH→DOH→BKK` bleibt bewiesen.
10. Date-Line/Open-Jaw/Multi-City/Roundtrip/Credentials und DB-Rechte/RLS/Security bleiben grün.

## 3. Unabhängig bestätigte R14-Evidence

- PR #38 ist offen, Draft, nicht gemergt.
- Runtime: `771c63a97f93f442dbc3856dc4218ce458dfecdf`.
- Docs-Lock: `096beb1fd4be60e4a45a42454dd76d6b69d2e23e`.
- Runtime CI `32673505102`: SUCCESS.
- Runtime Vercel `dpl_FhcvfAb7tPL17xYDd5Bm38tpzCqU`: READY, exact SHA.
- Development-DB-Funktion entspricht der neuen Migration und erhält `surfaceFromAirportCode`.
- `trip_items` erlaubt authentifizierten Eigentümern INSERT/UPDATE eigener Zeilen; Route-Truth darf daher nicht an implizite Client-Array-Vertrauensannahmen gekoppelt sein.
- Keine Production-Migration wurde durch diesen Review ausgelöst.

## 4. Scope bleibt geschlossen

R15 eröffnet keine Seasonal-Provider-, Secret- oder Kostenanforderung.

Weiterhin:

- `seasonalProviderAus()` bleibt `null`;
- keine Seasonal-Tabelle;
- keine Live-Provider-Aktivierung;
- keine neuen laufenden Kosten;
- Production-Migration weiterhin nur nach separater Product-Owner-Freigabe.

## 5. Stop-Kriterium / nächster Schritt

Nur Blocker 30 kohärent schließen. Danach:

1. Exact-Head-Gate auf neuem Runtime-Head.
2. Unabhängiger ChatGPT-Re-Review **R16**.
3. R16 prüft gezielt Trust-Grenze Browser→Server→Itinerary, Surface-Truth, Persistenzstabilität, Guest/Account-Parität und prior blockers.
4. Wenn R16 keinen neuen konkreten relevanten Defekt findet, nach strengem Stop-Kriterium **technisches Closure/PASS dokumentieren und Review-Schleife beenden**.

PR bleibt Draft. Kein Mark Ready. Kein Merge ohne ausdrückliche Product-Owner-Freigabe.
