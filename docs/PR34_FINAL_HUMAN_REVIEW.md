# PR #34 – Final Human / Architecture / UX / Security / Truth Review

Stand: 22. August 2026  
Status: **technisch review-bestanden; Product-Owner-Entscheidung offen; kein Merge ohne ausdrückliche Freigabe**

Branch: `feat/route-transit-intelligence`  
PR: #34 – Foundation D – Route & Transit Intelligence  
Geprüfter Code-Head: `f55a8dcf1491575d5b0370bafec3934d9b7b884b`  
Geprüfter Docs-Head vor diesem Review-Nachtrag: `472acdf83045b05211309c2fe28a61b01b9d9b9e`

## Ergebnis

Der finale unabhängige Review findet **keinen weiteren Foundation-D-Blocker**.

Die vier Review-Runden schließen die relevante Route-Truth-Kette vollständig:

1. Guest→Account-Persistenz ist fail-closed und atomar (`ADR-0113`).
2. Der normale Client-Pfad verwirft Browser-Country-Facts und kanonisiert über `public.airports` (`ADR-0114`).
3. Ein direkter `reise_anlegen(jsonb)`-RPC kann die Country-Truth nicht umgehen (`ADR-0115`).
4. Direkte Eigentümer-INSERTs/UPDATEs auf `trip_items.metadata` werden durch den DB-Guard ebenfalls kanonisiert (`ADR-0116`).

Der Round-4-Trigger `trip_items_route_itinerary_schuetzen` schützt `BEFORE INSERT OR UPDATE OF metadata, kind` jede persistierte Flight-`routeItinerary`. Andere Metadata-Schlüssel bleiben erhalten; Nicht-Flight-Zeilen werden nicht unnötig verändert; ungültige Route-Metadata wird fail-closed entfernt.

`routeFactsAusGraph()` liest ausschließlich `kind = 'flight'` und validierte `routeItinerary`; Titel, Notizen und Ortsnamen werden nicht zu Route Truth.

## Unabhängig verifiziert

- PR #34 ist offen, Draft, mergeable und nicht gemergt.
- aktueller PR-Head vor diesem Review-Nachtrag: `472acdf8...`; er liegt genau einen Docs-Commit vor dem geprüften Code-Head `f55a8dcf...`.
- GitHub CI auf `472acdf8...`: success.
- Vercel-Status auf `472acdf8...`: success.
- Development enthält die drei Foundation-D-Migrationen `20260822130000`, `20260822140000`, `20260822150000`.
- Der Round-4-Trigger existiert tatsächlich auf Development und ist `BEFORE INSERT OR UPDATE OF metadata, kind` auf `public.trip_items`.
- Die kanonische DB-Funktion baut Route-Punkte aus IATA + `public.airports`; Client-Country-/City-Werte werden nicht als Truth übernommen.
- Production enthält keine der drei Foundation-D-Migrationen und bleibt unverändert.
- dokumentierter DoD auf Code-Head `f55a8dcf...`: `npm test` 1295/1295, Typecheck/Lint/Hygiene grün, Auth 55/55, DB-Security 200/200, Trip Workspace Audit 726/726 ohne Fehler, Build 38/38, CI success, Preview READY.

## Bewusst offene Punkte – keine PR-#34-Blocker

- ohne Airport-Referenz bleibt Country `null`;
- Official Transit Requirements bleiben ohne echten Requirements-Provider `unknown`;
- Mehrfachstaatsbürgerschaften / mehrere Reisedokumente bleiben der verbindliche nächste Readiness-/Traveller-Context-Schritt vor Provider-Aktivierung;
- Gesamt-Destination für spätere First-Class-Multi-City/Open-Jaw-Reisen muss später explizit am Graphende definiert werden;
- zeitabhängiges Connection-Risk gehört in einen eigenen späteren Block.

## Merge-/Production-Gate

**Technisch review-bestanden bedeutet nicht Merge-Freigabe.**

- PR #34 bleibt Draft.
- Nicht Mark Ready ohne Product-Owner-Entscheidung.
- Kein Merge ohne ausdrückliche aktuelle Product-Owner-Freigabe.
- Keine Production-Migration ohne separates Product-Owner-Gate.
- Keine Provider-/Secret-/Kostenaktivierung.

## Empfehlung

Foundation D ist aus Human-/Architecture-/UX-/Security-/Truth-Sicht **technisch bereit für die Product-Owner-Entscheidung**. Der Product Owner kann jetzt entweder weitere Produkt-/UX-Änderungen verlangen oder später ausdrücklich die Merge-Freigabe erteilen.
