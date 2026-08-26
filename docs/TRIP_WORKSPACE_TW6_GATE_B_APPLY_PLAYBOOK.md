# Gate-B Apply-Playbook – TW6-B Mode-Bundle

Stand: 26. August 2026  
Status: **OPERATIV VORBEREITET. NICHT auf Production ausgeführt. Production-Apply hart blockiert.**

Zugehöriger Review: Technical-Lead Finalreview auf PR #87 Exact Head `0b7d6cfd5b34ffd3e9c0a96779ee51df999bcc67` – **PLAN PASS / PRODUCTION EXECUTION BLOCKED**.

Dieses Playbook gilt nur für:

- `20260826220000_trip_day_stage_assignment_source.sql`
- `20260826230000_trip_day_stage_assignment_source_fail_closed.sql`
- `20260826240000_trip_day_stage_assignment_mode.sql`

Nicht für AAL2, nicht für Direction A, nicht für TW-7/8/9, nicht für Multi-Ziel-UI.

## 1. Warum `db:anwenden` verboten ist

`26220000` und `26230000` enthalten noch den proportionalen CTE und können `legacy_fallback` minten. Jede Datei endet mit `GRANT EXECUTE … TO authenticated`. Ein per-file-`COMMIT` würde eine öffentlich executable Zwischenwahrheit erzeugen.

`npm run db:anwenden` lehnt diese drei Versionen deshalb ausdrücklich ab.

## 2. Hash-Vertrag

Byte-identisch mit dem geprüften PR-#87-Stand:

| Datei | SHA-256 |
| --- | --- |
| `20260826220000_trip_day_stage_assignment_source.sql` | `ab06e875e88f69b009837e1c8873e5322199da812b62f4ac1065a028f73cf883` |
| `20260826230000_trip_day_stage_assignment_source_fail_closed.sql` | `7e2e30246f1d9976b868751a6cc79087e537bbd36fb8f0dabf829b98258117a9` |
| `20260826240000_trip_day_stage_assignment_mode.sql` | `7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb` |

Weicht eine Datei ab, bricht das Playbook ab. Keine stille Semantikänderung.

## 3. Verbindliche Reihenfolge

Voraussetzung: Gate A (`20260824160000` dann `20260824180000`) ist bereits angewendet und verifiziert. AAL2 (`20260826052735` / Repo `20260826090000`) bleibt ausgeschlossen.

1. **Datei-Hashes prüfen.**
2. **Grant-Snapshot** von `authenticated`/`anon` für `INSERT public.trips` und `EXECUTE public.reise_anlegen(jsonb)`.
3. **Write-Gate committed setzen** und verifizieren:
   - `REVOKE EXECUTE ON FUNCTION public.reise_anlegen(jsonb) FROM authenticated, public, anon;`
   - `REVOKE INSERT ON TABLE public.trips FROM authenticated;`
   - `has_table_privilege` / `has_function_privilege` müssen für `authenticated` und `anon` false sein.
4. **Eine PostgreSQL-Transaktion:**
   - Body `26220000` + History-Insert
   - Body `26230000` + History-Insert
   - Body `26240000` + History-Insert
   - erneutes Write-Gate (die Dateien grannten `EXECUTE` wieder)
   - Verify des finalen Mode-Vertrags
   - `COMMIT` nur bei PASS
5. Bei Verify-Fehler: Exception → `ROLLBACK`. Write-Gate aus Schritt 3 bleibt geschlossen. Keine Grant-Wiederherstellung.
6. Nach sichtbarem PASS: vorherige Grants **exakt** aus dem Snapshot wiederherstellen.

History-Insert, identisch zu `db:anwenden`:

```sql
insert into supabase_migrations.schema_migrations (version, name, statements)
values (<version>, <name>, array[<exakter Dateibody>])
```

Keine manuell erfundene History. `statements[1]` muss byte-identisch mit der ausgeführten Datei sein.

## 4. Verify vor Wiederöffnung

PASS nur wenn alles wahr ist:

- Spalte `public.trips.day_stage_assignment_mode` existiert, `NOT NULL`, Default `legacy_fallback`
- Spalte `day_stage_assignment_source` existiert nicht mehr
- Constraint `trips_day_stage_assignment_mode_check` erlaubt genau `legacy_fallback`, `unassigned`, `single_destination`, `explicit`
- `public.reise_anlegen(jsonb)` ist Mode-aware
- kein proportionaler CTE `greatest(1, ceil(t.nr::numeric * e.anzahl / greatest(t.anzahl, 1)))`
- RPC weist `_assignment_mode` nie auf `legacy_fallback` zu
- `schema_migrations` enthält genau die drei Versionen

Altbestandssemantik: vorhandene Rows dürfen `legacy_fallback` behalten. Neue Requests minten ihn nicht.

## 5. Aufrufe

```bash
npm run db:gate-b-tw6-bundle
npm run db:gate-b-tw6-bundle -- --entwicklung
npm run db:gate-b-tw6-bundle -- --schreiben --entwicklung --write-gate-roundtrip
npm run db:gate-b-tw6-bundle -- --schreiben --entwicklung --fail-path
npm run db:gate-b-tw6-bundle -- --schreiben --entwicklung --apply
```

`--apply` auf Development bricht ab, wenn die drei Versionen bereits existieren. Es setzt dann kein Write-Gate.

Jeder Production-Aufruf, auch mit `--schreiben --produktion --projekt-ref`, endet mit `PRODUCTION EXECUTION BLOCKED`.

## 6. Rollback

| Lage | Pflicht |
| --- | --- |
| Transaktion scheitert | `ROLLBACK`. Source-/Mode-Zwischenstand existiert nicht. Write-Gate bleibt geschlossen. |
| Nach erfolgreichem Bundle, vor App-Merge | Mode-Spalte und Mode-aware RPC behalten **oder** Write-Gate belassen. |
| Nach Gate B | **Verboten:** Gate-A-`reise_anlegen` wiederherstellen, solange `day_stage_assignment_mode NOT NULL DEFAULT legacy_fallback` existiert. |

## 7. Was dieser Slice nicht tut

- kein Production-Write
- kein Ready/Merge
- keine Multi-Ziel-UI
- kein AAL2
- kein Direction A
- kein TW-7/8/9
