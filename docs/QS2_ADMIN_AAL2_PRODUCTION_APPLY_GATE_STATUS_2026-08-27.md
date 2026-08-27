# Jetnity – Admin AAL2 Production Apply Gate – Status

Stand: 27. August 2026  
Issue: #101  
Finding: `P1-AAL2-PROD-01`  
Cursor-Agent: `Jetnity quality security audit`  
Branch: `cursor/aal2-prod-apply-gate-b13d`  
Draft-PR: #102  
Status: **TL CHANGES REQUIRED BEHOBEN / DRAFT / STOPP / KEIN READY / KEIN MERGE / KEIN PRODUCTION APPLY**  
Review: `5043150656` auf Head `e056f1a1a6bb40cd3b2b46f88c8156f1dc4d3aad`  
Neuer Exact Head: `05ef8f84d82fbde3d8af9ad3804d9d9d12e8f1db`

Task: `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_TASK_2026-08-27.md`  
Playbook: `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_PLAYBOOK_2026-08-27.md`

---

## 1. Live-Verifikation vor dem Review-Fix

| Check | Stand |
| --- | --- |
| `origin/main` | `b20e54cba4932d515977285a46de1c1207d3c4b4` |
| Branch vor Sync | `e056f1a1a6bb40cd3b2b46f88c8156f1dc4d3aad` |
| Merge-Sync | `d8903819` – `DECISIONS.md` scope-treu (ADR-0175-Nachträge + ADR-0176 von `main`) |
| TW-7-Continuity | nicht inhaltlich geändert; `main`-Stand übernommen |
| Alignment-Datei | unverändert, Blob `4d24d28ff5789a253d0abc6ebd8aa0d6e22a2375` |
| Production-Apply | **nicht ausgeführt** |

---

## 2. Review-Fix `5043150656`

1. `historyInsertSql()` / `sqlStatement()` terminieren jedes Statement. Test prüft die exakte `;\n\ncommit;`-Grenze.
2. Harte Contract-Verification läuft in derselben Transaktion: Migration → History → Verify → COMMIT. Post-Commit Verify bleibt zusätzlich.
3. `profiles_*` und Trip/Traveller-RLS werden als Preflight-Snapshot gelesen und nach Apply exakt verglichen. Keine Pretty-Print-Suche nach `user_id = auth.uid()`.
4. History-Verify prüft nur exakte Version/Name und Statement-Existenz. Der JS-Bytevergleich `historyStimmtMitDatei()` prüft das gespeicherte Statement gegen die gepinnte Datei. Das SQL-Literal `admin_aal2_data_plane_alignment` wird nicht mehr im Statement-Text gesucht.
5. Fail-Path auf Development: `CREATE OR REPLACE` von `darf_betrieb_lesen` + History-Insert + absichtlicher Fehler. Nach Rollback sind Capability-Definition und History unverändert. Zusätzlich Parse-/Rollback-Probe der Apply-Transaktion.

Nicht geändert: Alignment-SQL, Phase-3.1-Grenze, TW-7-Continuity, Production.

---

## 3. Gates dieses Review-Fixes

| Gate | Ergebnis |
| --- | --- |
| Targeted `aal2-prod-apply` + `ci-schutz` | 22 passed, 10 suites, exit 0 |
| `npm test` | 2335 passed, 0 failed, 432 suites, exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | no errors, no warnings, exit 0 |
| `check:dead` | 763 reachable, 1 justified orphan (`CookieConsent.tsx`), exit 0 |
| `check:exports` | 650 files, 0 unused exports, exit 0 |
| `check:deps` | 0 unused / 0 missing, exit 0 |
| `check:api-schutz` | 12 admin routes, all `requireAdminApi()`, exit 0 |
| `check:schema-bezug` | 17 tables/views, 19 functions, exit 0 |
| `npm run build` | exit 0; 46 static pages |
| `npm run db:aal2-prod-apply` | lokale Probe PASS, kein Write |
| `npm run db:aal2-prod-apply -- --entwicklung-probe` | Parse-Probe PASS; Fail-Path PASS; Capability + History unverändert |

Production wurde nicht beschrieben und nicht angewendet.

---

## 4. Nächster Schritt

Unabhängiger Technical-Lead-Finalreview auf Exact Head `05ef8f84d82fbde3d8af9ad3804d9d9d12e8f1db`. Kein Ready. Kein Merge. Kein Production-Apply.
