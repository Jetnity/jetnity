# PR #31 – Production-Migration-Abnahme

Stand: 22. August 2026  
Branch: `feat/rental-car-foundation`  
PR: #31 – Foundation B – Mietwagen

## Freigabe

Der Nutzer hat die Production-Migration ausdrücklich separat freigegeben.

Freigegebene Migration:

`20260821200000_trip_items_rental_car.sql`

Repository-Migrationsblob vor der Übernahme: `98ae8de2b197741263c30213368d73aee75292c0`.

## Vor der Übernahme verifiziert

- PR #31 war Ready for Review, offen, mergefähig und nicht gemergt.
- Der aktuelle Ready-Head `13a48f1bdd6951e70ce0632ae4646f72334f232e` war ein reiner Dokumentationscommit nach der iPhone-Abnahme.
- CI für diesen Head war `completed / success`.
- Supabase Development (`yfvbxvijcorffwxbxahl`) hatte gegenüber Production (`qscbgcdmivbbnzrcyegn`) genau eine zusätzliche Migration: `20260821200000_trip_items_rental_car`.
- Development und Production hatten keine Edge Functions. Damit war die Branch-Übernahme auf genau diese eine Migration eingegrenzt.

## Production-Übernahme

Die Development-Branch `develop` wurde nach der ausdrücklichen Freigabe über den Supabase-Branch-Migrationsweg nach Production übernommen.

Supabase meldete den Merge erfolgreich. Der Main-Branch durchlief anschließend `CREATING_PROJECT` → `RUNNING_MIGRATIONS` → `FUNCTIONS_DEPLOYED`.

Die Production-Migrationshistorie enthält danach kanonisch:

`20260821200000_trip_items_rental_car`

Es wurde kein Provider aktiviert und keine Production-Mietwagensuche eingeschaltet.

## Production-Verifikation

Auf `public.trip_items` vorhanden:

- `rental_supplier`
- `vehicle_class`
- `transmission`
- `rental_evidence`

Verifizierte relevante Constraints:

- `trip_items_kind_werte`
- `trip_items_booking_nur_kommerziell`
- `trip_items_mobility_nur_transfer`
- `trip_items_mobility_modus_nur_transfer`
- `trip_items_rental_nur_mietwagen`
- `trip_items_rental_supplier_laenge`
- `trip_items_vehicle_class_werte`
- `trip_items_transmission_werte`
- `trip_items_rental_evidence_werte`

Bestandsprüfung auf Production nach der Migration:

- ungültige Mietwagenfelder auf Nicht-Mietwagen: **0**
- ungültige `rental_evidence`: **0**
- Transfer-spezifische Mobility-Felder auf Mietwagen: **0**
- gebuchte Zeilen mit nicht erlaubtem `kind`: **0**
- gebuchte Mietwagen mit anderer Quelle als `user`: **0**
- vorhandene Mietwagenzeilen zum Zeitpunkt der Migration: **0**

Funktionsgrenze:

- `public.reise_anlegen(jsonb)` bleibt `SECURITY INVOKER` (`prosecdef=false`).
- `search_path` bleibt `public, pg_temp`.
- `reise_anlegen(jsonb)` enthält die Mietwagenfelder und kann den manuellen Nutzerstatus persistieren.
- `public.reise_aendern(jsonb)` enthält weiterhin keine Mietwagenfelder und wurde durch diese Migration nicht erweitert.

## Weiterhin gesperrt

- kein echter Mietwagenprovider
- keine Productive Mietwagensuche
- keine Provider-Secrets
- kein Merge automatisch durch diesen DB-Schritt

Vor dem Merge müssen Repo-Dokumentation/PR-Status auf diesen tatsächlichen Production-Stand synchronisiert und der finale Head erneut mit CI/Vercel verifiziert werden.
