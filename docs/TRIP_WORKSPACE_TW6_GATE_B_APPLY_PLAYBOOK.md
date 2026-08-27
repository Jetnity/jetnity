# Gate-B Apply-Playbook – TW6-B Mode-Bundle

Stand: 27. August 2026  
Status: **OPERATIV VORBEREITET auf den Vier-Datei-Vertrag. NICHT auf Production ausgeführt. Production-Apply hart blockiert.**

Zugehöriger Auftrag: Technical-Lead Finalreview PR #87 Exact Head `b93a6fff213b3bb61a9efde84050f46fc0673cf4` – **RUNTIME/CORRECTION PASS, PRODUCTION ROLLOUT CHANGES REQUIRED** (P1-TW6-B-ROLLOUT-08). Dieser Slice ist Gate 0B, migrations-/rollout-only.

Dieses Playbook gilt nur für:

- `20260826220000_trip_day_stage_assignment_source.sql`
- `20260826230000_trip_day_stage_assignment_source_fail_closed.sql`
- `20260826240000_trip_day_stage_assignment_mode.sql`
- `20260827010000_reise_anlegen_zero_stage_fail_closed.sql`

Nicht für AAL2, nicht für Direction A, nicht für TW-7/8/9, nicht für Multi-Ziel-UI, nicht für übrigen PR-#87-Runtime-Code.

## 1. Warum `db:anwenden` verboten ist

`26220000` und `26230000` enthalten noch den proportionalen CTE und können `legacy_fallback` minten. `26240000` leitet `single_destination` noch mit `stageCount <= 1` ab und würde 0 Stages akzeptieren. Jede Datei endet mit `GRANT EXECUTE … TO authenticated`. Ein per-file-`COMMIT` würde eine öffentlich executable Zwischenwahrheit erzeugen.

`npm run db:anwenden` lehnt deshalb alle vier Versionen ausdrücklich dateiweise ab.

## 2. Hash-Vertrag

Die ersten drei Dateien bleiben byte-identisch mit dem geprüften Gate-0-Stand (PR #89).  
`20260827010000` ist byte-identisch mit dem geprüften PR-#87-Head `b93a6fff213b3bb61a9efde84050f46fc0673cf4`.

| Datei | SHA-256 |
| --- | --- |
| `20260826220000_trip_day_stage_assignment_source.sql` | `ab06e875e88f69b009837e1c8873e5322199da812b62f4ac1065a028f73cf883` |
| `20260826230000_trip_day_stage_assignment_source_fail_closed.sql` | `7e2e30246f1d9976b868751a6cc79087e537bbd36fb8f0dabf829b98258117a9` |
| `20260826240000_trip_day_stage_assignment_mode.sql` | `7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb` |
| `20260827010000_reise_anlegen_zero_stage_fail_closed.sql` | `b516bfff24e9e6f5dd909a9cfd4e76aa1a54708b067d1a5d3e935b8482c6adf1` |

Weicht eine Datei ab, bricht das Playbook ab. Keine stille Semantikänderung. `20260826240000` darf nicht umgeschrieben werden.

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
   - Body `27010000` + History-Insert
   - erneutes Write-Gate (die Dateien grannten `EXECUTE` wieder)
   - Verify des finalen Mode-Vertrags inkl. 0-Stage fail-closed und Commercial-Gate-A
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
- `public.reise_anlegen(jsonb)` ist die `27010000`-Semantik
- kein proportionaler CTE `greatest(1, ceil(t.nr::numeric * e.anzahl / greatest(t.anzahl, 1)))`
- RPC weist `_assignment_mode` nie auf `legacy_fallback` zu
- 0 Stages sind fail-closed (`_stage_count < 1` → `22023`); kein `_stage_count <= 1`
- `single_destination` nur bei genau einer Stage
- Commercial-Gate-A-Nullung der Flug-Handelsfelder bleibt im RPC
- Trigger `trip_items_flug_handelsfelder_schuetzen` bleibt enabled
- `schema_migrations` enthält genau die vier Versionen

Altbestandssemantik: vorhandene Rows dürfen `legacy_fallback` behalten. Neue Requests minten ihn nicht.

## 5. Aufrufe

```bash
npm run db:gate-b-tw6-bundle
npm run db:gate-b-tw6-bundle -- --entwicklung
npm run db:gate-b-tw6-bundle -- --schreiben --entwicklung --write-gate-roundtrip
npm run db:gate-b-tw6-bundle -- --schreiben --entwicklung --fail-path
npm run db:gate-b-tw6-bundle -- --schreiben --entwicklung --apply
```

`--apply` auf Development bricht ab, wenn eine der vier Versionen bereits existiert. Es setzt dann kein Write-Gate. Development hat alle vier bereits; dort nur verifizieren, nicht erneut anwenden.

Jeder Production-Aufruf, auch mit `--schreiben --produktion --projekt-ref`, endet mit `PRODUCTION EXECUTION BLOCKED`.

## 6. Rollback

| Lage | Pflicht |
| --- | --- |
| Transaktion scheitert | `ROLLBACK`. Source-/Mode-/Zero-Stage-Zwischenstand existiert nicht. Write-Gate bleibt geschlossen. |
| Nach erfolgreichem Bundle, vor App-Merge | Mode-Spalte und `27010000`-RPC behalten **oder** Write-Gate belassen. |
| Nach Gate B | **Verboten:** Gate-A-`reise_anlegen` wiederherstellen, solange `day_stage_assignment_mode NOT NULL DEFAULT legacy_fallback` existiert. **Verboten:** bei vorhandener Mode-Spalte auf `26240000` stehen bleiben, weil 0 Stages dann wieder `single_destination` würden. |

## 7. Was dieser Slice nicht tut

- kein Production-Write
- kein Ready/Merge
- keine Multi-Ziel-UI
- kein AAL2
- kein Direction A
- kein TW-7/8/9
- kein erneutes Development-Apply der bereits sitzenden vier Versionen
