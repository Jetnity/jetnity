# P2-TA-04 Gate 0 – Live-Katalog-Evidence

Stand: 28. August 2026  
Typ: **READ-ONLY LIVE EVIDENCE**  
Ziel: Production-Projekt `qscbgcdmivbbnzrcyegn` über Supabase Management-API `POST /database/query`.  
Mutation: **keine**.

Maschinenlesbare Rohantwort: `docs/P2_TA04_TRAVELLER_CHILD_WRITE_PATH_GATE0_LIVE_EVIDENCE_2026-08-28.json`

## 1. Identität

- Organization: Jetnity
- Production name: `Jetnity's Project`
- Status: `ACTIVE_HEALTHY`
- Default branch `main`: `FUNCTIONS_DEPLOYED`
- Non-default `develop`: `FUNCTIONS_DEPLOYED`
- Develop-Grants und `party_schreiben.prosecdef` identisch zur Production-Frage dieses Slice

Die Umgebung `SUPABASE_PROJECT_REF` zeigte auf einen nicht-Production-Ref und lieferte `GET /projects/{ref} = 404`. Production wurde deshalb explizit über den bekannten Production-Ref gelesen, nicht über die Default-Env-Ref.

## 2. Authenticated-Grants

Für jede der Tabellen `trip_travellers`, `trip_traveller_citizenships`, `trip_traveller_documents`:

- `authenticated`: SELECT, INSERT, UPDATE, DELETE
- `anon` / `PUBLIC`: keine Einträge in `role_table_grants`

`postgres` und `service_role` haben die üblichen Owner-/Dienstrechte inkl. TRUNCATE/TRIGGER/REFERENCES. Kein aktueller App-Pfad nutzt Service Role für diese Tabellen.

## 3. RLS

`relrowsecurity = true` auf allen drei Tabellen. `relforcerowsecurity = false`.

Je Tabelle vier Policies für `authenticated`: SELECT / INSERT / UPDATE / DELETE mit `user_id = (SELECT auth.uid() AS uid)`.

## 4. Funktionen

`party_schreiben(_payload jsonb)`:

- `prosecdef = false`
- `search_path=public, pg_temp`
- ACL: `authenticated=X`, `service_role=X`, nicht `anon`
- Body enthält `PARTY_LIMIT`, `FOREIGN_CITIZENSHIP`, Insert Parent, Delete Children; **kein** `delete from public.trip_travellers`

`trip_traveller_kinder_limit_pruefen()`:

- `prosecdef = false`
- `FOR NO KEY UPDATE` vorhanden
- Trigger nur AFTER INSERT auf beiden Child-Tabellen

## 5. Fehlende Party-Cap

`check_party_count_constraint` lieferte **0** Zeilen. Es gibt keinen CHECK/Trigger, der `count(trip_travellers)` je Reise auf 20 begrenzt.

## 6. Foundation-E-Migrationen auf Production

Vorhanden: `20260822020000_trip_travellers`, `20260822160000_traveller_context_intelligence`, `20260822170000_traveller_context_fk_delete`, `20260822180000_traveller_context_rereview`.
