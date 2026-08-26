# TW6-B Gate 0 / Gate-B-Playbook – Vorbereitungsstand

Stand: 26. August 2026  
Status: **Draft-Vorbereitung. Nicht Ready. Nicht mergen. Production unverändert.**

> **Do not blindly trust this file — live verify first.**

## 1. Auftrag

Operativer Vorbereitungs-Slice nach Technical-Lead **PLAN PASS / PRODUCTION EXECUTION BLOCKED** auf PR #87 Exact Head `0b7d6cfd5b34ffd3e9c0a96779ee51df999bcc67`.

Nur:

1. migrations-only Provenance der drei geprüften TW6-B-Dateien gegen `main`
2. bounded transaktionales Gate-B-Playbook
3. sichere Prüfung gegen Development/Test

Nicht: Multi-Ziel-UI, übriger PR-#87-Runtime-Code, AAL2, Direction A, TW-7/8/9, Ready, Merge, Production-Apply.

## 2. Live-Git bei Erstellung

| Fakt | Wert |
| --- | --- |
| `origin/main` | `1d558ef56cc275d429f4076c7a8877c3791947a7` |
| Branch | `cursor/tw6-gate-b-prep-a4c4` |
| Quelle der drei Dateien | PR #87 Exact Head `0b7d6cfd5b34ffd3e9c0a96779ee51df999bcc67` |
| Runtime-Code aus PR #87 | **nicht** übernommen |

## 3. Datei-Hashes

`cmp` gegen PR #87 und SHA-256:

| Datei | SHA-256 |
| --- | --- |
| `20260826220000_trip_day_stage_assignment_source.sql` | `ab06e875e88f69b009837e1c8873e5322199da812b62f4ac1065a028f73cf883` |
| `20260826230000_trip_day_stage_assignment_source_fail_closed.sql` | `7e2e30246f1d9976b868751a6cc79087e537bbd36fb8f0dabf829b98258117a9` |
| `20260826240000_trip_day_stage_assignment_mode.sql` | `7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb` |

Development-History `statements[1]` für dieselben Versionen trägt dieselben SHA-256-Werte. Production wurde nicht gelesen/geschrieben.

## 4. Playbook

Implementiert in `lib/rollout/gate-b-tw6-bundle.ts` und `scripts/db/gate-b-tw6-bundle.ts`.  
Vertrag: `docs/TRIP_WORKSPACE_TW6_GATE_B_APPLY_PLAYBOOK.md`.

`PRODUCTION_APPLY_FREIGEGEBEN = false`.

## 5. P0 / P1 / P2 / P3

| ID | Klasse | Lage |
| --- | --- | --- |
| P0 | — | keine |
| TW6-B-PREP-P1-01 | P1 | Production-Apply bleibt blockiert, bis PO-Gates für Commercial und Gate B getrennt vorliegen und der Technical Lead das Playbook unabhängig reviewed |
| TW6-B-ROLLOUT-P1-04/05/06/07 | P1 | im Plan geschlossen; dieser Slice realisiert Gate 0 + P2-02, führt sie nicht auf Production aus |
| TW6-B-PREP-P2-01 | P2 | Development hat das Bundle bereits; `--apply` darf dort nicht erneut laufen |
| TW6-B-PREP-P3-01 | P3 | `db:anwenden` auf frischen Umgebungen stoppt, sobald die drei Dateien offen sind; frühere offene Dateien müssen separat betrachtet werden |

## 6. STOP

Kein Ready. Kein Merge. Kein Production-Write. Kein Folgeslice.
