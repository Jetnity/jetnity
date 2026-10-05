# Jetnity – Production Gate A Execution Checkpoint

Stand: 27. August 2026

Status: **PASS – Gate A auf Production vollständig ausgeführt und verifiziert. Gate B bleibt NICHT freigegeben.**

## Freigabegrenze

Product Owner hat ausschließlich freigegeben:

1. `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis.sql`
2. danach `20260824180000_trip_items_flug_handelsfelder_guard.sql`

Nicht freigegeben und nicht ausgeführt: TW6-B `20260826220000` / `20260826230000` / `20260826240000`, AAL2, Direction A, PR #87 oder andere Production-Migrationen.

## Git / CI Baseline

- `main` vor Production-Gate: `5fc4d1b873f1fa7aff8e4064163275bf30f9ce98`
- Dieser Main enthält PR #89 (TW6-B Gate 0 migrations-only + bounded transactional playbook), aber kein TW6-B Production-Apply.
- Post-Merge GitHub Actions Run `33023988403` auf exakt `5fc4d1b873f1fa7aff8e4064163275bf30f9ce98`: `SUCCESS`.

## Production Preflight

Production-Projekt war `ACTIVE_HEALTHY`.

Vor Gate A:

- `reise_anlegen(jsonb)` vorhanden
- `flug_route_itinerary_metadata(text,jsonb)` vorhanden
- `trip_items` vorhanden
- 0 persistierte `flight`-Items
- `authenticated` durfte `reise_anlegen(jsonb)` ausführen
- `anon` durfte `reise_anlegen(jsonb)` nicht ausführen
- Production-History endete bei `20260824140000`

## Gate A1 – 20260824160000

Ausgeführt: `reise_anlegen_flug_handelsfelder_ohne_nachweis`.

Wirkung:

- Browser-/Client-JSON bleibt keine Providerquelle.
- Für `kind='flight'` werden `price_amount`, `price_currency`, `provider`, `external_ref` und `booking_url` im RPC nicht aus untrusted Input persistiert.
- Route-Itinerary-Helper bleibt erhalten.
- RPC bleibt `SECURITY INVOKER`.
- `authenticated` EXECUTE bleibt erlaubt; `anon` bleibt gesperrt.

Die Supabase-MCP-Ausführung erzeugte technisch zunächst die laufzeitgenerierte History-Version `20260826234655`. Diese wurde unmittelbar nach erfolgreicher semantischer Verifikation mit fail-closed Guards auf die kanonische Repo-Version `20260824160000` normalisiert. Genau eine Source-Zeile existierte, das Ziel war vorher leer. Kein Schema-Rollback und keine zusätzliche Migration wurden ausgeführt.

## Gate A2 – 20260824180000

Erst nach PASS von Gate A1 ausgeführt: `trip_items_flug_handelsfelder_guard`.

Wirkung:

- Trigger `trip_items_flug_handelsfelder_schuetzen` ist genau einmal vorhanden und enabled.
- Scope: `BEFORE INSERT OR UPDATE OF price_amount, price_currency, provider, external_ref, booking_url, kind` auf `public.trip_items`.
- Direkte `authenticated`/`anon`-Writes können bei Flights keine untrusted Handelsfelder setzen.
- Bei bestehenden Flight-Zeilen werden diese Felder bei direkten untrusted Updates auf den alten Werten gehalten.
- Die Triggerfunktion ist für `authenticated` und `anon` nicht direkt ausführbar.

Die Supabase-MCP-Ausführung erzeugte technisch zunächst die laufzeitgenerierte History-Version `20260826234743`. Diese wurde nach erfolgreichem Apply mit denselben fail-closed History-Guards auf `20260824180000` normalisiert.

## Final Verification

Production-History enthält jetzt exakt:

- `20260824160000` → `reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000` → `trip_items_flug_handelsfelder_guard`

Beide History-Einträge tragen jeweils genau ein gespeichertes Statement.

Semantische Verifikation: PASS.

- RPC strippt untrusted Flight-Handelsfelder: PASS
- Route-Itinerary bleibt erhalten: PASS
- RPC-EXECUTE authenticated=true / anon=false: PASS
- Guard-Trigger count=1 / enabled: PASS
- Trigger-Scope korrekt: PASS
- Role-Boundary `authenticated`/`anon`: PASS
- Insert-Strip: PASS
- Update-Preserve: PASS
- Guard-Funktion nicht direkt ausführbar für authenticated/anon: PASS
- Production Flight-Items weiterhin 0
- Production-Projekt danach weiterhin `ACTIVE_HEALTHY`

Explizit verifiziert NICHT angewendet:

- `20260826220000`
- `20260826230000`
- `20260826240000`
- `20260826090000`
- `20260826052735`

Außerdem existiert auf Production weiterhin weder `day_stage_assignment_source` noch `day_stage_assignment_mode`; damit wurde TW6-B nicht still aktiviert.

## Advisor-Nachlauf

Supabase Security- und Performance-Advisors wurden nach dem DDL-Lauf erneut gelesen. Es gibt bestehende Warn-/Info-Funde zu GraphQL-Exposition, älteren Admin-`SECURITY DEFINER`-Funktionen, fehlenden FK-Indizes und ungenutzten Indizes. Kein Advisor-Fund zeigt auf die beiden Gate-A-Funktionen als neue Gate-A-spezifische Fehlkonfiguration. Diese Funde sind separate Quality/Security-Arbeit und wurden in diesem Production-Gate nicht still verändert.

## Nächster Gate-Status

**STOP. Gate B ist weiterhin nicht freigegeben.**

PR #87 bleibt Draft und darf aus diesem Checkpoint nicht automatisch Ready oder gemergt werden. Der nächste mögliche Production-Schritt ist ausschließlich ein separater Product-Owner-Gate für das TW6-B-Bundle unter dem bereits auf `main` liegenden transaktionalen Write-Gate-Playbook. Vor einer solchen Freigabe ist der aktuelle `main`-/PR-#87-/Production-Stand erneut live zu verifizieren.
