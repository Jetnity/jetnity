# PR #38 – Cursor-Auftrag für R16-Blocker 31

Stand: 24. August 2026  
Status: **verbindlicher nächster Runtime-Fix – nur Blocker 31 schließen; kein Mark Ready, kein Merge, keine Production-Migration**

Review-Quelle: `docs/PR38_CHATGPT_R16_REVIEW.md`

## 1. Ziel

Schließe ausschließlich R16-Blocker 31:

> Eine untrusted Browser-/LocalStorage-/Guest-`routeItinerary` darf `surfaceFromAirportCode` nicht allein durch syntaktische Plausibilität zu belegter Route-/Surface-Truth machen.

Der R15-Fix im `FlugOption`-Pfad bleibt bestehen. Der neue Defekt liegt am zweiten Intake-Pfad der bereits geformten `routeItinerary`.

## 2. Reproduktion, die nach dem Fix fail-closed bleiben muss

Ein untrusted Client liefert in einem Leg:

1. `LAX → JFK`
2. `SFO → NRT` mit `surfaceFromAirportCode='JFK'`

Es gibt keine serverseitig belegte Evidence für `JFK ⇢ SFO`.

Nach vollständigem Server-/DB-Pfad muss deshalb gelten:

- keine geadelte Surface-Evidence;
- `chronologieBewiesen=false`;
- keine erfundene Connection/Airport-Change-Truth;
- Guest→Account, Save→Reload, Readiness, Safety und Seasonal sehen dieselbe fail-closed Truth.

## 3. Erlaubte Architektur

Bevorzugt ist eine klare Trust-Grenze:

- untrusted Browser-/LocalStorage-/Guest-Input: Surface-Evidence strippen oder ablehnen;
- trusted/persisted/serverseitig erzeugte Evidence: nur über einen ausdrücklich getrennten Contract erhalten;
- falls innerhalb des aktuellen Foundation-Scopes kein sauberer trusted Surface-Schreibpfad existiert, bleibt eine Lücke bewusst `unknown`.

Spätere Provider-Evidence darf nur server-verifiziert/opaque oder gleichwertig vertrauenswürdig werden. Eine spätere explizite Nutzerdeklaration braucht eine eigene Evidence-Klasse (`user`) und darf nicht still wie Provider-/Server-Evidence wirken.

## 4. Nicht erlaubt

- `provider` oder `externalRef` aus dem Browser als Trust-Beweis verwenden;
- Country-/City-/Distance-Heuristiken zur Surface-Truth machen;
- nur den `FlugOption`-Parser weiter härten und den direkten `routeItinerary`-Pfad offen lassen;
- syntaktisch gültige IATA allein als Evidence-Provenance behandeln;
- bestehende angewandte Migrationen rückwirkend umschreiben;
- Production-Migration ausführen;
- Seasonal-Provider aktivieren, Secrets hinzufügen oder laufende Kosten erzeugen.

## 5. Pflichtstellen prüfen

Mindestens:

- `lib/route/schema.ts`
- `lib/trips/schema.ts`
- `lib/trips/aktionen.ts`
- `lib/trips/anlegen.ts`
- `lib/route/kanonisieren.ts`
- `lib/route/itinerary.ts`
- `lib/route/chronologie.ts`
- `lib/route/domain.ts`
- `lib/route/r15-flugoption.test.ts`
- `supabase/migrations/20260824120000_flug_route_itinerary_surface_evidence.sql`
- tatsächliche Development-Funktion `public.flug_route_itinerary_metadata(text,jsonb)`

## 6. Pflicht-Regressionen

1. Manipulierte Guest-/Browser-`routeItinerary` `LAX→JFK`, `SFO→NRT`, `surfaceFromAirportCode='JFK'` bleibt nach Server-Kanonisierung chronology unknown.
2. Guest→Account adelt dieselbe Clientbehauptung nicht.
3. Save→Reload adelt dieselbe Clientbehauptung nicht.
4. DB-/Schreibvertrag persistiert keine beliebige Client-Surface-Behauptung als belegte Truth.
5. R15: `FlugOption`-Extra-Felder, `provider`, `externalRef` erzeugen weiterhin keine Surface-Evidence.
6. Kontinuierlicher `ZRH→DOH→BKK` bleibt bewiesen.
7. `CDG⇢ORY` darf nur mit ausdrücklich zulässiger Evidence-Quelle bewiesen sein; falls der aktuelle Foundation-Scope keine trusted Quelle besitzt, fail-closed `unknown` statt erfundener Beweis.
8. Route-Fingerprint, Readiness, Safety und Seasonal bleiben vor/nach Persistenz und Guest→Account konsistent.
9. Alle R1–R15-Regressionen bleiben grün.
10. DB-Rechte/RLS/Security/Parallelität bleiben grün.

## 7. Exact-Head-Gate nach dem Fix

Auf dem neuen Runtime-Head vollständig nachweisen:

- `npm test`
- Typecheck
- Lint / Hygiene
- Production-Build
- vollständiger UI-Audit wie bisher
- DB Rechte / RLS / Security / Parallelität
- GitHub Actions **SUCCESS auf exakt dem Runtime-Head**
- Vercel Preview **READY auf exakt demselben Runtime-Head**
- Development-Verifikation der relevanten DB-Truth
- Production unverändert

Danach Dokumentation/ADRs/Active Status aktualisieren und **nicht** selbst Closure behaupten.

## 8. Danach

Unabhängiger ChatGPT-Re-Review **R17**.

Nur wenn R17 keinen neuen konkreten relevanten Truth-/Security-/SoT-/Cross-Domain-/Provider-/Release-Defekt findet, kann der Technical Lead das technische Closure/PASS nach Stop-Kriterium dokumentieren.

**PR bleibt Draft. Kein Mark Ready. Kein Merge ohne ausdrückliche Product-Owner-Freigabe.**
