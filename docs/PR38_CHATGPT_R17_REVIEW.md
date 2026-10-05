# PR #38 – ChatGPT Independent Review R17

Stand: 24. August 2026  
PR: `#38 Travel Timing & Seasonal Intelligence – provider-neutrale Foundation`  
Branch: `feat/travel-timing-seasonal-intelligence`  
Geprüfter Runtime-Head: `5782401943b41ddd1eea1337c93cb37163210362`  
Docs-Lock vor R17: `865d29e85be1a4d3c3d83679cad4d1dc383f3adf`

## Urteil

**R17 = PASS / Technical Closure.**

Der in R16 gefundene Merge-/Truth-Blocker 31 ist auf dem geprüften Runtime-Head kohärent geschlossen. Der unabhängige R17-Review findet **keinen neuen konkreten relevanten Truth-, Security-, Source-of-Truth-, Cross-Domain-, Provider- oder Release-Defekt** innerhalb des freigegebenen PR-Scopes.

Damit greift das vereinbarte Stop-Kriterium: Der technische Review-Loop von PR #38 endet hier. Dieses PASS ist **keine Product-Owner-Freigabe für Mark Ready, Merge oder Production-Migration**.

## 1. Untrusted Surface-Evidence ist an den aktuellen Grenzen geschlossen

### Browser / LocalStorage / Guest

`lib/route/schema.ts` trennt die Vertrauensgrenzen:

- `flugRouteItinerarySchema` ist der untrusted Parser und kopiert `surfaceFromAirportCode` nicht in das Ergebnis.
- `flugRouteItineraryTrustedSchema` / `flugRouteItineraryTrustedLesen()` existiert getrennt für bereits typisierte bzw. später serverseitig belegte Objekte.

`lib/trips/schema.ts` verwendet für untrusted Trip-/Guest-/Account-Takeover-Nutzlasten den untrusted `flugRouteItinerarySchema`.

`lib/trips/gastspeicher.ts` liest Browser-LocalStorage über `reiseLesen()`. Damit kann ein manipuliertes LocalStorage-Objekt die Surface-Claim nicht als Route-Truth behalten.

### Server-Kanonisierung / Guest→Account

`lib/route/kanonisieren.ts` entfernt Client-Surface explizit über `itineraryOhneClientSurface()` bevor Airport-Referenzen serverseitig neu aufgebaut werden. Die Account-Übernahme kann die Client-Claim deshalb nicht nachträglich adeln.

### DB-Write / DB-Read

Development-Migration `20260824140000_flug_route_itinerary_untrusted_surface.sql` ersetzt die untrusted DB-Kanonisierung so, dass `surfaceFromAirportCode` nicht in die kanonischen Segmente geschrieben wird.

Der Account-DB-Reader `lib/trips/abbildung.ts` liest `trip_items.metadata` über `itineraryAusMetadata()`. `lib/route/metadata.ts` verwendet dort wiederum den untrusted `flugRouteItineraryLesen()`. Auch bereits vorhandenes oder manipuliertes Metadata-Surface wird daher im normalen Read-Pfad nicht zu Trusted Route Truth.

### Safety / Seasonal

Die untrusted Safety-/Seasonal-Request-Schemas verwenden ebenfalls den untrusted Route-Itinerary-Parser. Erst danach wird Route Truth abgeleitet. Ein Browser-Request kann `surfaceFromAirportCode` daher nicht über diese Cross-Domain-Pfade zurück in belegte Truth bringen.

## 2. Unabhängige Live-DB-Probe

Auf Supabase Development `yfvbxvijcorffwxbxahl` wurde R17 erneut read-only geprüft.

Manipulierter Input:

- Segment 1: `LAX → JFK`
- Segment 2: `SFO → NRT`
- eingeschleustes `surfaceFromAirportCode = JFK`

`public.flug_route_itinerary_metadata('flight', ...)` liefert die kanonische Route mit serverseitig aufgelösten Airport-Facts, aber **ohne** `surfaceFromAirportCode`. Damit kann die Client-Claim an dieser persistenten Grenze nicht mehr überleben.

Zusätzlich live verifiziert:

- Funktion bleibt **SECURITY INVOKER** (`security_definer=false`)
- `anon` hat **kein EXECUTE**
- `authenticated` hat **EXECUTE**

Supabase-Migrationsstand:

- Development: `20260824120000` und `20260824140000` vorhanden
- Production: keine der beiden Route-Surface-Migrationen vorhanden

Production wurde durch R17 nicht verändert.

## 3. Runtime-/Release-Gate

Auf exakt Runtime `5782401943b41ddd1eea1337c93cb37163210362` liegt GitHub Actions Run `32677741683` mit **SUCCESS** vor.

Der dazugehörige Vercel Preview-Deployment `dpl_74A67UxWrCLWviihrsn9hfYqqZDQ` ist **READY** und trägt exakt denselben `githubCommitSha`.

Vom Runtime-Gate dokumentiert:

- `npm test` 1703/1703
- Typecheck / Lint / Hygiene grün
- Production Build Exit 0
- UI-Audit 1014/1014, 0 Fehler, WebKit + Chromium, 8 Viewports
- DB Rechte 51 / RLS Exit 0 / Security 216/216 / Parallelität 7/7

Der nachfolgende Docs-Lock `865d29e8` ist kein zweites Runtime-Gate; dessen GitHub CI ist ebenfalls SUCCESS und sein Vercel Preview READY.

## 4. Production-Unverändert-Nachweis

Vercel Production `jetnity-app.vercel.app` ist weiterhin **READY** auf `main` `cd220beb44d90ae376feeb8de9db8a3afb808d60`.

Supabase Production `qscbgcdmivbbnzrcyegn` ist **ACTIVE_HEALTHY** und endet migrationsseitig bei `20260822180000_traveller_context_rereview`. Die Route-Surface-Migrationen dieses Draft-PRs wurden nicht auf Production angewendet.

## 5. Trusted Reader – R17-Bewertung

`routeFactsAusGraph()` / `routeFactsFuerPunkt()` dürfen in der aktuellen Foundation `surfaceFromAirportCode` an bereits typisierten Objekten über den Trusted Reader auswerten. Das ist erforderlich, damit explizit intern erzeugte bzw. künftig serverseitig belegte Surface-Evidence fachlich modellierbar bleibt.

R17 findet **keinen aktuellen untrusted Produktions-Mapper**, der rohe Browser-/LocalStorage-/Request-/DB-JSON direkt an diesen Trusted-Pfad hängt:

- Guest LocalStorage → `reiseLesen()` → untrusted Parser
- Trip/API-Nutzlast → untrusted Trip-Schema
- Guest→Account → explizites Surface-Stripping vor Kanonisierung
- DB Metadata → `itineraryAusMetadata()` → untrusted Parser
- Safety/Seasonal Request → untrusted Route-Schema

Damit ist der vom Cursor-Agenten genannte Punkt ein **nicht-blockierender zukünftiger Architektur-Invariant**, kein reproduzierbarer R17-Defekt: Ein späterer neuer Mapper darf niemals rohe Client-JSON direkt als typisiertes `TripItem.routeItinerary` deklarieren. Falls später echte Provider-/Server-Surface-Evidence eingeführt wird, braucht sie einen expliziten serverkontrollierten Provenance-/Write-Contract.

## 6. Provider / Kosten / Scope

- `seasonalProviderAus()` bleibt `null`
- kein Live-Seasonal-Provider
- keine neuen Secrets
- keine Seasonal-Tabelle
- keine neuen laufenden Kosten durch R17
- keine Production-Migration

## 7. Technical Closure und harte Product-Owner-Gates

**Technical Closure/PASS für PR #38 ist erreicht.**

Ab hier wird kein weiterer Review-Rundlauf allein aus Vorsicht eröffnet. Ein neuer R18 wäre nur gerechtfertigt, wenn vor Integration ein **konkreter neuer Defekt oder eine relevante neue Runtime-Änderung** entsteht.

Unverändert verbindlich:

- PR #38 bleibt **Draft**.
- **Kein Mark Ready** ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- **Kein Merge** ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- **Keine Production-Migration** ohne separate ausdrückliche Product-Owner-Freigabe.
- Keine Provider-/Secret-/Kosten-Aktivierung ohne die jeweiligen separaten Gates.

## 8. Folge für das Multi-Agent-Team

Mit diesem Technical Closure ist die bisherige Sperre für die konfliktarmen ersten Account- und Admin-Implementierungsslices aufgehoben. Shared Auth/RLS/DB/Privacy/Billing/Traveller-/Route-Contracts bleiben weiterhin Technical-Lead-koordiniert und seriell.

Die gespeicherte Homepage-Produktseiten-Idee bleibt separat pausiert, bis der Product Owner ihre visuelle Preview ausdrücklich starten möchte.
