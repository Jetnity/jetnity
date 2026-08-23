# PR #38 – ChatGPT Independent Review R14

Stand: 24. August 2026  
Status: **REQUEST CHANGES – R13-Blocker 28 im TypeScript-Runtime substanziell geschlossen; neuer R14-Blocker 29 an der Persistenzgrenze offen**

PR: `#38 – Travel Timing & Seasonal Intelligence`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Base/Main: `cd220beb44d90ae376feeb8de9db8a3afb808d60`  
Geprüfter Runtime-Head: `2ba324495bcbe0acf9c106a68d7d004f69279930`  
Docs-Lock vor R14: `b3035ffd1f7e9483524ad1089d4730b421edc208`  
PR-Zustand: **open, Draft, nicht gemergt**

## 1. R14-Urteil

R14 wurde unabhängig auf dem tatsächlichen Runtime-Head `2ba32449` durchgeführt.

Exact-Head-Evidence unabhängig bestätigt:

- GitHub Actions Run `32671367206`: **SUCCESS** auf exakt `2ba324495bcbe0acf9c106a68d7d004f69279930`.
- Vercel Deployment `dpl_7mKYGGX5LhTAUUwFYNrBTtrjnsou`: **READY**, `githubCommitSha=2ba324495bcbe0acf9c106a68d7d004f69279930`.
- Nachfolgender Docs-Lock `b3035ffd` hat ebenfalls erfolgreiche CI; er ist kein zweites Runtime-Gate.

R13-Blocker 28 ist auf TypeScript-/Route-Runtime-Ebene substanziell geschlossen:

- Country-Gleichheit allein beweist keine Surface-Kante mehr.
- `surfaceFromAirportCode` wird als explizite Surface-Evidence verwendet.
- `LAX→JFK + SFO→NRT` bleibt ohne Evidence fail-closed.
- `CDG⇢ORY` kann mit expliziter Evidence bewiesen werden.
- R13-Regressionssuite ist vorhanden.

**Noch kein Closure/PASS.** R14 findet einen konkreten Persistenzdefekt: die neu eingeführte Surface-Evidence überlebt die kanonische Supabase-Speichergrenze nicht.

PR #38 bleibt Draft. Kein Mark Ready und kein Merge ohne ausdrückliche Product-Owner-Freigabe.

---

## 2. Merge-Blocker 29 – `surfaceFromAirportCode` wird beim Supabase-Persistieren entfernt

### Betroffene Stellen

- `lib/route/domain.ts`
- `lib/route/schema.ts`
- `lib/route/itinerary.ts`
- `lib/route/chronologie.ts`
- `supabase/migrations/20260822140000_flug_route_itinerary_airport_truth.sql`
- `supabase/migrations/20260822150000_trip_items_route_itinerary_guard.sql`
- `public.flug_route_itinerary_metadata(text,jsonb)` auf der Development-Datenbank
- Trigger `trip_items_route_itinerary_schuetzen`
- Guest→Account / Trip-Reload / Route-Fingerprint / Readiness / Safety / Seasonal

### Konkretes Problem

Der R13-Fix führt im Route-Domainmodell das optionale Feld `surfaceFromAirportCode` ein. `itineraryAusFlugOption()` setzt dieses Feld bei einem belegten Airport-Wechsel innerhalb eines Legs. `chronologie.ts` benötigt genau dieses Feld, damit eine diskontinuierliche Surface-Kante wie `CDG⇢ORY` als bewiesen gelten darf.

Die bestehende kanonische Supabase-Funktion `public.flug_route_itinerary_metadata(text,jsonb)` baut jedes Segment jedoch neu auf und übernimmt nur:

- `origin`
- `destination`
- `departureDate`
- `departureTime`
- `arrivalDate`
- `arrivalTime`

`surfaceFromAirportCode` wird nicht übernommen.

Der bestehende BEFORE-Trigger `trip_items_route_itinerary_schuetzen` ruft genau diese Funktion bei INSERT bzw. UPDATE von `metadata`/`kind` auf.

Damit ist die neue Evidence im TypeScript-Modell vorhanden, wird aber an der persistenten Source-of-Truth-Grenze wieder entfernt.

### Unabhängig auf der aktiven Supabase-Development-Datenbank reproduziert

Development-Branch/Project-Ref: `yfvbxvijcorffwxbxahl`.

1. `pg_get_functiondef(public.flug_route_itinerary_metadata(text,jsonb))` zeigt die aktive Funktion ohne `surfaceFromAirportCode` in der rekonstruierten Segmentstruktur.
2. Der Trigger `trip_items_route_itinerary_schuetzen` ist aktiv als `BEFORE INSERT OR UPDATE OF metadata, kind ON public.trip_items`.
3. Eine reine SELECT-Probe mit einer gültigen `ZRH→CDG`, `ORY→BKK`-Itinerary und `surfaceFromAirportCode='CDG'` liefert als kanonisches Ergebnis dieselben Segmente **ohne** `surfaceFromAirportCode`.

Das ist kein theoretisches Migrationsrisiko, sondern das Verhalten der aktuellen Development-Persistenzgrenze.

### Konkrete Auswirkung

Ein echter provider-validierter Airport-Wechsel kann zunächst im Browser/Runtime korrekt sein:

`ZRH → CDG ⇢ ORY → BKK`

Vor dem Speichern:

- `surfaceFromAirportCode='CDG'`
- `chronologieBewiesen=true`
- Airport-Change/Surface sichtbar
- kanonischer Fingerprint enthält die Surface-Grenze

Nach Speichern in `trip_items` und erneutem Laden:

- `surfaceFromAirportCode` fehlt
- dieselbe Surface-Lücke wird nach R13 bewusst fail-closed
- `chronologieBewiesen` kann auf `false` wechseln
- Origin/Destination können geleert werden
- Connection/Airport-Change kann verschwinden
- Fingerprint ändert sich
- Readiness kann dadurch stale werden
- Safety und Seasonal sehen einen anderen Route-Truth-Zustand

Damit kann allein das Persistieren/Reloaden derselben realen Reise ihre semantische Route-Truth verändern.

Das verletzt insbesondere:

- Guest/Account-Parität
- Source-of-Truth-Stabilität
- deterministische Fingerprints
- R13-Ziel, echte belegte Surface-Verbindungen dauerhaft korrekt zu unterstützen

Die aktuelle Aussage im Handoff, ältere Surface-Lücken würden nach einem provider-validierten Neu-Schreiben wieder korrekt, ist an der aktuellen DB-Grenze nicht erfüllt: die DB entfernt die neue Evidence erneut.

### Erforderliche Korrektur

Die persistente Route-Itinerary-Kanonisierung muss mit dem neuen Domainvertrag konsistent werden.

Akzeptable Lösung:

- `surfaceFromAirportCode` strukturell validieren und in der kanonischen Persistenz erhalten; oder
- eine äquivalente, explizite provider-neutrale Surface-Evidence persistieren.

Dabei gilt:

- keine Seasonal-Tabelle;
- keine neue laufende Infrastrukturkosten;
- keine Secrets;
- keine Production-Migration ohne ausdrückliche Freigabe;
- falls die bereits angewandte Development-Funktion geändert werden muss, eine nachvollziehbare neue **Route-Persistenz-Migration** verwenden statt eine bereits angewandte Migration still umzuschreiben;
- DB-Kanonisierung muss weiterhin Client-Country/City/Country-Truth verwerfen und fail-closed bleiben;
- Feld/Beweis darf nur in gültiger IATA-Form persistieren;
- persistierter Roundtrip muss dieselbe Route Truth/Fingerprint liefern wie vor dem Speichern.

### Pflicht-Regressionen Blocker 29

1. Provider-/Runtime-Itinerary `ZRH→CDG`, `ORY→BKK` mit `surfaceFromAirportCode='CDG'` → vor Persistenz bewiesen.
2. Kanonische DB-Funktion erhält exakt diese Evidence.
3. Nach DB-Kanonisierung/Reload bleibt `CDG⇢ORY` bewiesen.
4. Fingerprint vor und nach Persistenz ist identisch.
5. Connection/Airport-Change und UI bleiben vor/nach Persistenz identisch.
6. Readiness/Safety/Seasonal sehen vor/nach Persistenz dieselbe Route Truth.
7. Guest→Account-Übernahme verliert die Evidence nicht.
8. Ungültiges `surfaceFromAirportCode` wird fail-closed verworfen/abgewiesen.
9. Surface-Evidence darf keine Client-Länder-/Stadtwerte zur Truth machen.
10. `LAX→JFK + SFO→NRT` ohne Evidence bleibt nach Persistenz fail-closed.
11. R10–R13 Date-Line/Roundtrip/Open-Jaw/Multi-City/Credentials/unknown-order Regressionen bleiben grün.
12. DB Rechte/RLS/Security/Parallelität bleiben grün.

---

## 3. Nicht erneut geöffnet

R14 eröffnet keine Seasonal-Provider-, Secret- oder Kostenanforderung.

Weiterhin:

- `seasonalProviderAus()` bleibt `null`;
- keine Seasonal-Tabelle;
- keine Provider-Live-Aktivierung;
- keine neuen Secrets;
- keine neuen laufenden Kosten.

Eine eventuell notwendige Funktion-/Guard-Migration betrifft ausschließlich die bereits bestehende Route-Persistenzgrenze und darf Production nicht ohne Product-Owner-Freigabe verändern.

---

## 4. Stop-Kriterium / nächster Schritt

Nur Blocker 29 kohärent schließen. Danach:

1. DB-/Runtime-Roundtrip-Regressionen ergänzen.
2. Exact-Head-Gate auf neuem Runtime-Head.
3. Unabhängiger ChatGPT-Re-Review **R15**.
4. R15 prüft insbesondere Persistenzstabilität, Guest/Account-Parität, R13 Surface-Truth, prior blockers, provider-neutrality, no-secret/no-cost und Release-Gates.
5. Wenn R15 keinen neuen konkreten relevanten Defekt findet, nach strengem Stop-Kriterium **technisches Closure/PASS dokumentieren und die Review-Schleife beenden**.

PR bleibt Draft. Kein Mark Ready. Kein Merge ohne ausdrückliche Product-Owner-Freigabe.
