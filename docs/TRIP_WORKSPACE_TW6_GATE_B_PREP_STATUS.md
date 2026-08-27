# TW6-B Gate 0 / Gate-B-Playbook – Status

Stand: 27. August 2026  
Status: **Gate 0 integriert. Production Gate A PASS. Gate B weiterhin BLOCKED / nicht freigegeben. PR #87 bleibt Draft.**

> **Do not blindly trust this file — live verify first.**

## 1. Was abgeschlossen ist

PR #89 (`TW6-B Gate 0: migrations-only + transactional apply playbook`) wurde nach unabhängigem Technical-Lead-PASS auf Exact Head `986fa8b7592286731e44ab46d36a8f299531d669` gemergt.

Merge-Commit:

`5fc4d1b873f1fa7aff8e4064163275bf30f9ce98`

Damit liegen die drei geprüften TW6-B-Migrationen dauerhaft auf `main`, zusammen mit dem bounded transaktionalen Gate-B-Playbook. Kein übriger Runtime-Code aus PR #87 wurde durch Gate 0 integriert.

Exact-Head Evidence PR #89:

- GitHub Actions Run `33023062522`: SUCCESS
- Vercel Preview: SUCCESS/READY
- Post-Merge `main` CI Run `33023988403`: SUCCESS

## 2. Kanonische TW6-B-Dateien auf main

| Datei | SHA-256 |
| --- | --- |
| `20260826220000_trip_day_stage_assignment_source.sql` | `ab06e875e88f69b009837e1c8873e5322199da812b62f4ac1065a028f73cf883` |
| `20260826230000_trip_day_stage_assignment_source_fail_closed.sql` | `7e2e30246f1d9976b868751a6cc79087e537bbd36fb8f0dabf829b98258117a9` |
| `20260826240000_trip_day_stage_assignment_mode.sql` | `7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb` |

Runtime-Code aus PR #87 bleibt getrennt.

## 3. Gate-B-Playbook

Implementiert in:

- `lib/rollout/gate-b-tw6-bundle.ts`
- `scripts/db/gate-b-tw6-bundle.ts`
- `docs/TRIP_WORKSPACE_TW6_GATE_B_APPLY_PLAYBOOK.md`

Vertrag:

1. Write-Gate committed setzen und verifizieren.
2. `26220000` + `26230000` + `26240000` plus exakte History in **einer** Transaktion.
3. Keine öffentlich executable 26220000-/26230000-Zwischenwahrheit.
4. Finalen Mode-Vertrag vor Grant-Restore prüfen.
5. Bei Fehler `ROLLBACK`; Write-Gate bleibt geschlossen.
6. Grants erst nach PASS exakt aus Snapshot wiederherstellen.

`db:anwenden` lehnt das Bundle dateiweise ab.

## 4. Production Gate A – PASS

Product Owner hat am 27. August 2026 ausschließlich Gate A freigegeben:

1. `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
2. danach `20260824180000_trip_items_flug_handelsfelder_guard`

Beide wurden auf Production angewendet und vollständig verifiziert.

Finale Production-History enthält exakt:

- `20260824160000` → `reise_anlegen_flug_handelsfelder_ohne_nachweis`
- `20260824180000` → `trip_items_flug_handelsfelder_guard`

Verifikation:

- RPC verwirft untrusted Flight-Handelsfelder: PASS
- Route-Itinerary bleibt erhalten: PASS
- `authenticated` RPC EXECUTE = true / `anon` = false: PASS
- Guard-Trigger count=1 / enabled: PASS
- Trigger-Scope korrekt: PASS
- Guard Role-Boundary korrekt: PASS
- Insert-Strip: PASS
- Update-Preserve: PASS
- Guard-Funktion für authenticated/anon nicht direkt executable: PASS
- Production Flight-Items: 0
- Production-Projekt danach: `ACTIVE_HEALTHY`

Vollständige Evidence: `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`.

## 5. Explizit NICHT ausgeführt

Production enthält weiterhin **nicht**:

- `20260826220000`
- `20260826230000`
- `20260826240000`
- AAL2 `20260826090000`
- Development-AAL2-Version `20260826052735`

Auf Production existiert weiterhin weder `day_stage_assignment_source` noch `day_stage_assignment_mode`.

Damit ist TW6-B Gate B nicht still aktiviert worden.

## 6. PR #87

PR #87 (`feat/tw6-rest-progressive-stages`) bleibt Draft.

Der frühere PLAN-PASS / PRODUCTION EXECUTION BLOCKED war auf einem älteren `main`. Seitdem wurden PR #89 und weitere Continuity-Commits integriert. Deshalb gilt vor jeder Fortsetzung zwingend:

- aktuellen `main` verifizieren
- Merge-Base und Ahead/Behind neu bestimmen
- echten Diff gegen aktuellen `main` prüfen
- Konflikte/Drift auflösen
- Shared Contracts erneut prüfen
- Exact-Head GitHub Actions und Vercel erneut verlangen
- Production-Grenzen neu lesen

Kein alter PASS darf als aktuelle Merge- oder Production-Freigabe verwendet werden.

## 7. P0 / P1 / P2 / P3

| ID | Klasse | Lage |
| --- | --- | --- |
| P0 | — | keine aktuell aus Gate A bekannten |
| TW6-B-PREP-P1-01 | P1 | Gate B bleibt ohne separate Product-Owner-Freigabe blockiert |
| TW6-B-PR87-P1-REBASE | P1 | PR #87 muss gegen aktuellen `main` neu eingeordnet und re-gegatet werden |
| TW6-B-PREP-P2-01 | P2 | Development enthält das Bundle bereits; dort nicht erneut blind anwenden |
| TW6-B-PREP-P3-01 | P3 | `db:anwenden` stoppt auf frischen Umgebungen beim Bundle; frühere offene Migrationen separat betrachten |

## 8. STOP

**Kein Gate B. Kein AAL2. Kein Direction A. Kein PR-#87-Merge. Kein Folgeslice.**

Nächster Schritt ist ausschließlich der unabhängige Technical-Lead-Re-Review von PR #87 gegen den aktuellen `main`. Erst nach neuem PASS kann eine separate Product-Owner-Freigabe für Gate B überhaupt angefragt werden.
