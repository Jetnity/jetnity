# TW6-B Gate 0 / Gate 0B / Gate-B-Playbook – Status

Stand: 27. August 2026  
Status: **Gate 0 und Gate 0B sind auf `main`. Production Gate A PASS. Production Gate B weiterhin BLOCKED / nicht freigegeben / nicht angewendet. PR #87 bleibt Draft und muss nach Gate 0B gegen den neuen `main` neu synchronisiert und vollständig re-gegatet werden.**

> **Do not blindly trust this file — live verify first.**

## 1. Gate 0 – integriert

PR #89 (`TW6-B Gate 0: migrations-only + transactional apply playbook`) wurde nach unabhängigem Technical-Lead-PASS auf Exact Head `986fa8b7592286731e44ab46d36a8f299531d669` gemergt.

Merge-Commit:

`5fc4d1b873f1fa7aff8e4064163275bf30f9ce98`

Damit lagen die ersten drei geprüften TW6-B-Migrationen dauerhaft auf `main`, zusammen mit dem bounded transaktionalen Gate-B-Playbook. Kein übriger Runtime-Code aus PR #87 wurde durch Gate 0 integriert.

## 2. Gate 0B – integriert durch PR #91

Der unabhängige Technical-Lead-Re-Review von PR #87 Exact Head `b93a6fff213b3bb61a9efde84050f46fc0673cf4` hatte den Blocker **P1-TW6-B-ROLLOUT-08** identifiziert: das damalige Gate-B-Playbook endete nach `26240000`, obwohl `26240000` 0 Stages als `single_destination` ableiten konnte. Ein späteres Production-Gate-B-Apply hätte damit die auf Development bereits behobene Zero-Stage-Lücke wieder geöffnet.

PR #91 (`TW6-B Gate 0B: Zero-Stage Production Rollout Provenance`) hat diesen Rollout-Vertrag migrations-/rollout-only korrigiert und wurde nach unabhängigem Technical-Lead-PASS gemergt.

Evidence:

- PR-#91 Exact Head: `1da3ae0a01c6d5bb1f2325a2ca528922823c9611`
- Base / Merge-Base: `f683855fa82a6ae5663228b2c9dfa605755fc47d`
- Ahead / Behind: `2 / 0`
- Exact-Head GitHub Actions Run `33031870276`: SUCCESS
- Exact-Head Vercel `dpl_9QJSE9UeQNfehoLjdEa3PPXfyvLs`: READY
- Merge-Commit: `a2e46f38dcfbbea286e37960c7993adbbd06136a`
- Post-Merge `main` GitHub Actions Run `33053499406`: SUCCESS
- Post-Merge Vercel Production `dpl_2UjcAyoJ3D4Puuqehu3izDtcXDtj`: READY auf exakt dem Merge-SHA

Kein Runtime-/UI-Code aus PR #87 wurde durch PR #91 integriert.

## 3. Kanonischer Vier-Datei-Vertrag

| Datei | SHA-256 | Herkunft |
| --- | --- | --- |
| `20260826220000_trip_day_stage_assignment_source.sql` | `ab06e875e88f69b009837e1c8873e5322199da812b62f4ac1065a028f73cf883` | unverändert, Gate 0 / PR #89 |
| `20260826230000_trip_day_stage_assignment_source_fail_closed.sql` | `7e2e30246f1d9976b868751a6cc79087e537bbd36fb8f0dabf829b98258117a9` | unverändert, Gate 0 / PR #89 |
| `20260826240000_trip_day_stage_assignment_mode.sql` | `7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb` | unverändert, Gate 0 / PR #89 |
| `20260827010000_reise_anlegen_zero_stage_fail_closed.sql` | `b516bfff24e9e6f5dd909a9cfd4e76aa1a54708b067d1a5d3e935b8482c6adf1` | byte-identisch vom geprüften PR-#87-Head `b93a6fff` |

Verbindliche Reihenfolge:

`26220000 → 26230000 → 26240000 → 27010000`

`20260826240000` wurde nicht umgeschrieben. `27010000` ist additiv und schließt die Zero-Stage-Lücke.

## 4. Gate-B-Playbook – Vertrag

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

Final Verify verlangt:

- 0 Stages → fail-closed (`22023`), kein `single_destination`
- genau 1 Stage → `single_destination`
- finaler RPC = `27010000`-Semantik
- genau vier Gate-B-Versionen in `schema_migrations`
- neue Requests minten kein `legacy_fallback`
- Commercial-Gate-A-Nullung und Guard-Trigger bleiben

## 5. Production Gate A – PASS

Product Owner hat am 27. August 2026 ausschließlich Gate A freigegeben:

1. `20260824160000_reise_anlegen_flug_handelsfelder_ohne_nachweis`
2. danach `20260824180000_trip_items_flug_handelsfelder_guard`

Beide wurden auf Production angewendet und vollständig verifiziert.

Vollständige Evidence: `docs/PRODUCTION_GATE_A_EXECUTION_CHECKPOINT_2026-08-27.md`.

## 6. Production Gate B – weiterhin NICHT ausgeführt

Post-PR-#91 read-only erneut verifiziert:

- Production-Projekt `qscbgcdmivbbnzrcyegn`: ACTIVE_HEALTHY
- Gate-A-Versionen: count = 2
- TW6-B `26220000` / `26230000` / `26240000` / `27010000`: count = 0
- `day_stage_assignment_source`: nicht vorhanden
- `day_stage_assignment_mode`: nicht vorhanden
- Guard-Trigger `trip_items_flug_handelsfelder_schuetzen`: vorhanden/enabled

Explizit weiterhin nicht angewendet:

- `20260826220000`
- `20260826230000`
- `20260826240000`
- `20260827010000`
- AAL2 `20260826090000`
- Development-AAL2-Version `20260826052735`

Damit ist TW6-B Gate B nicht still aktiviert worden.

Development `yfvbxvijcorffwxbxahl` enthält dagegen alle vier Gate-B-Versionen und die Zero-Stage-Fail-Closed-Funktion bereits. Dort nicht erneut blind anwenden.

## 7. PR #87 – nächster Runtime-Schritt

PR #87 (`feat/tw6-rest-progressive-stages`) bleibt Draft. Er wurde durch Gate 0 / Gate 0B bewusst nicht mit migrations-/rollout-only Arbeit vermischt.

Nach PR #91 muss er jetzt gegen den neuen `main` neu synchronisiert und auf einem neuen Exact Head vollständig gegatet werden:

- Merge-Base / Ahead / Behind
- aktueller realer Diff
- Scope / Non-Scope
- Shared Contracts
- progressive Multi-Ziel-Semantik
- Day→Stage Mode Contract
- Zero-Stage fail-closed
- Commercial Truth / Gate-A-Semantik
- Security / Ownership
- Exact-Head GitHub Actions
- Exact-Head Vercel
- relevante Supabase-/Production-Grenzen

Kein alter PASS gilt als aktuelle Merge-Freigabe.

## 8. P0 / P1 / P2 / P3

| ID | Klasse | Lage |
| --- | --- | --- |
| P0 | — | keine aktuell aus diesem Gate-0B-Slice |
| P1-TW6-B-ROLLOUT-08 | P1 | **geschlossen durch PR #91:** Vier-Datei-Vertrag inkl. `27010000` auf `main` |
| TW6-B-PREP-P1-01 | P1 | **offen:** Production Gate B bleibt ohne separate Product-Owner-Freigabe blockiert |
| TW6-B-PR87-P1-REBASE | P1 | **offen:** PR #87 nach Gate-0B-Merge gegen neuen `main` synchronisieren/re-gaten |
| TW6-B-PREP-P2-01 | P2 | Development enthält das Vier-Datei-Bundle bereits; dort nicht erneut blind anwenden |
| TW6-B-PREP-P3-01 | P3 | `db:anwenden` stoppt auf frischen Umgebungen beim Bundle; bounded Playbook verwenden |

## 9. STOP / nächster Schritt

**Kein Production Gate B. Kein AAL2. Kein Direction A. Kein PR-#87-Merge ohne neuen unabhängigen PASS. Kein TW-7/8/9-Folgeslice.**

Nächster Schritt ist ausschließlich der unabhängige Technical-Lead-Re-Review von PR #87 gegen den neuen `main` nach PR #91. Falls eine Synchronisierung/Korrektur nötig ist, geht ein präziser Auftrag an:

`Cursor-Agent: Trip workspace audit architecture`

Erst nach neuem Exact Head, neuer CI/Vercel-Evidence und unabhängigem PASS kann der Product Owner separat um Freigabe für Production Gate B gebeten werden.
