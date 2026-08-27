# TW6-B Gate 0 / Gate 0B / Gate-B-Playbook – Status

Stand: 27. August 2026  
Status: **Gate 0 auf `main`. Gate 0B Vier-Datei-Vertrag in diesem Prep-PR. Production Gate A PASS. Gate B weiterhin BLOCKED / nicht freigegeben. PR #87 bleibt Draft.**

> **Do not blindly trust this file — live verify first.**

## 1. Was abgeschlossen ist

PR #89 (`TW6-B Gate 0: migrations-only + transactional apply playbook`) wurde nach unabhängigem Technical-Lead-PASS auf Exact Head `986fa8b7592286731e44ab46d36a8f299531d669` gemergt.

Merge-Commit:

`5fc4d1b873f1fa7aff8e4064163275bf30f9ce98`

Damit lagen die drei geprüften TW6-B-Migrationen dauerhaft auf `main`, zusammen mit dem bounded transaktionalen Gate-B-Playbook. Kein übriger Runtime-Code aus PR #87 wurde durch Gate 0 integriert.

Exact-Head Evidence PR #89:

- GitHub Actions Run `33023062522`: SUCCESS
- Vercel Preview: SUCCESS/READY
- Post-Merge `main` CI Run `33023988403`: SUCCESS

## 2. Gate 0B – Zero-Stage Production Rollout Provenance

Technical-Lead Finalreview auf PR #87 Exact Head `b93a6fff213b3bb61a9efde84050f46fc0673cf4`: Runtime-/Zero-Stage-Fix PASS auf Development. Neuer Blocker **P1-TW6-B-ROLLOUT-08**: das auf `main` versionierte Playbook wendete nur `26220000 → 26230000 → 26240000` an. Ein Production-Gate-B-Apply hätte den behobenen 0-Stage-Fehler erneut geöffnet.

Dieser Slice ist ein **separater migrations-/rollout-only Prep-PR** gegen aktuellen `main` `f683855fa82a6ae5663228b2c9dfa605755fc47d`. Kein Runtime-/UI-Code aus PR #87.

| Datei | SHA-256 | Herkunft |
| --- | --- | --- |
| `20260826220000_trip_day_stage_assignment_source.sql` | `ab06e875e88f69b009837e1c8873e5322199da812b62f4ac1065a028f73cf883` | unverändert, Gate 0 / PR #89 |
| `20260826230000_trip_day_stage_assignment_source_fail_closed.sql` | `7e2e30246f1d9976b868751a6cc79087e537bbd36fb8f0dabf829b98258117a9` | unverändert, Gate 0 / PR #89 |
| `20260826240000_trip_day_stage_assignment_mode.sql` | `7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb` | unverändert, Gate 0 / PR #89 |
| `20260827010000_reise_anlegen_zero_stage_fail_closed.sql` | `b516bfff24e9e6f5dd909a9cfd4e76aa1a54708b067d1a5d3e935b8482c6adf1` | byte-identisch von `b93a6fff` |

`20260827010000` ist bereits auf Development angewendet und wird hier **nicht** erneut angewendet. Production bleibt unangetastet.

## 3. Gate-B-Playbook – Vier-Datei-Vertrag

Implementiert in:

- `lib/rollout/gate-b-tw6-bundle.ts`
- `scripts/db/gate-b-tw6-bundle.ts`
- `docs/TRIP_WORKSPACE_TW6_GATE_B_APPLY_PLAYBOOK.md`

Vertrag:

1. Write-Gate committed setzen und verifizieren.
2. `26220000` → `26230000` → `26240000` → `27010000` plus exakte History in **einer** Transaktion.
3. Keine öffentlich executable Zwischenwahrheit.
4. Finalen Mode-Vertrag inkl. 0-Stage fail-closed und Commercial-Gate-A vor Grant-Restore prüfen.
5. Bei Fehler `ROLLBACK`; Write-Gate bleibt geschlossen.
6. Grants erst nach PASS exakt aus Snapshot wiederherstellen.

`db:anwenden` lehnt alle vier Versionen dateiweise ab.

Final Verify muss zusätzlich beweisen:

- 0 Stages → fail-closed, kein `single_destination`
- finaler RPC = `27010000`-Semantik
- genau vier Gate-B-Versionen in `schema_migrations`
- neue Requests minten kein `legacy_fallback`
- Commercial-Gate-A-Nullung und Guard-Trigger bleiben

## 4. Production Gate A – PASS

Product Owner hat am 27. August 2026 ausschließlich Gate A freigegeben:

1. `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
2. danach `20260824180000_trip_items_flug_handelsfelder_guard`

Beide wurden auf Production angewendet und vollständig verifiziert.

Vollständige Evidence: `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`.

## 5. Explizit NICHT ausgeführt

Production enthält weiterhin **nicht**:

- `20260826220000`
- `20260826230000`
- `20260826240000`
- `20260827010000`
- AAL2 `20260826090000`
- Development-AAL2-Version `20260826052735`

Auf Production existiert weiterhin weder `day_stage_assignment_source` noch `day_stage_assignment_mode`.

Damit ist TW6-B Gate B nicht still aktiviert worden.

Development enthält alle vier Versionen bereits. Dieser Slice wendet sie dort nicht erneut an.

## 6. PR #87

PR #87 (`feat/tw6-rest-progressive-stages`) bleibt Draft und wird in diesem Slice nicht weiter mit Rollout-Code vermischt.

Nach Merge von Gate 0B auf `main` muss PR #87 erneut mit dem dann aktuellen `main` synchronisiert und auf neuem Exact Head gegatet werden. Das ist ein späterer Auftrag.

## 7. P0 / P1 / P2 / P3

| ID | Klasse | Lage |
| --- | --- | --- |
| P0 | — | keine aktuell aus Gate A bekannten |
| P1-TW6-B-ROLLOUT-08 | P1 | **dieser Slice:** Vier-Datei-Vertrag provenance-sicher auf `main` vorbereiten |
| TW6-B-PREP-P1-01 | P1 | Gate B bleibt ohne separate Product-Owner-Freigabe blockiert |
| TW6-B-PR87-P1-REBASE | P1 | PR #87 muss nach Gate-0B-Merge gegen neuen `main` neu eingeordnet werden |
| TW6-B-PREP-P2-01 | P2 | Development enthält das Vier-Datei-Bundle bereits; dort nicht erneut blind anwenden |
| TW6-B-PREP-P3-01 | P3 | `db:anwenden` stoppt auf frischen Umgebungen beim Bundle |

## 8. STOP

**Kein Gate B. Kein Production-Apply. Kein AAL2. Kein Direction A. Kein PR-#87-Merge. Kein Folgeslice.**

Nächster Schritt nach Exact-Head-Evidence dieses Prep-PRs: unabhängiger Technical-Lead-Review des Vier-Datei-Vertrags. Erst danach kann PR #87 re-synchronisiert und eine separate Product-Owner-Freigabe für Gate B angefragt werden.
