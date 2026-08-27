# Jetnity – Admin AAL2 Production Apply Gate – Status

Stand: 27. August 2026  
Issue: #101  
Finding: `P1-AAL2-PROD-01`  
Cursor-Agent: `Jetnity quality security audit`  
Branch: `cursor/aal2-prod-apply-gate-b13d`  
PR: #102 – Integrationsvehikel  
Status: **P1-AAL2-PROD-01 NACH LANDUNG VON PR #102 GESCHLOSSEN / KEIN ZWEITER APPLY**  
Post-Apply Evidence: Technical-Lead-Kommentar `5442474653`  
PASS-Review vor Apply: `5043413423`  
Review-Fix vor Apply: `5043150656` auf Head `e056f1a1a6bb40cd3b2b46f88c8156f1dc4d3aad`  
Review-Fix Exact Head (historisch): `4ee402dd4a4c77576b43523d058fff2855ba21eb`  
Docs-Closure Commit (historisch): `4f0909be9093359fa53e5d68ab779dd4db608ece`

Task: `docs/QS2_ADMIN_AAL2_PRODUCTION_APPLY_GATE_TASK_2026-08-27.md`  
Playbook: `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_PLAYBOOK_2026-08-27.md`

---

## Kanonische Wahrheit nach Landung

- Production-AAL2 `20260827170000_admin_aal2_data_plane_alignment` **ist angewendet und verifiziert**.
- Production-History enthält die Version **exakt einmal**.
- `public.aktuelles_admin_aal2()` **ist live**.
- Admin-Capabilities verlangen unveränderte Mindestrolle **UND** `aktuelles_admin_aal2()`.
- `profiles-*`-/Trip-/Traveller-RLS blieb unverändert.
- Frühere Aussagen „kein Production-Apply“, „Apply noch offen“, „STOPP vor Apply“, „Production wurde nicht beschrieben und nicht angewendet“ in diesem Dokument, im Playbook, im Apply-Gate-Task, in der Reconciliation und in älteren ADR-0175-Nachträgen sind **ausdrücklich historische Pre-Apply-Evidence**.
- **Kein zweiter Apply.** Dieser Docs-Closure schreibt Production nicht.

TW-7 / ADR-0176 aus `main` bleibt unangetastet.

---

## 1. Historische Pre-Apply-Evidence (Review-Fix)

Die folgende Tabelle beschreibt den Stand **vor** dem Technical-Lead-Apply. Sie ist keine aktuelle Production-Aussage.

| Check | Historischer Stand vor Apply |
| --- | --- |
| `origin/main` | `b20e54cba4932d515977285a46de1c1207d3c4b4` |
| Branch vor Sync | `e056f1a1a6bb40cd3b2b46f88c8156f1dc4d3aad` |
| Merge-Sync | `d8903819` – `DECISIONS.md` scope-treu (ADR-0175-Nachträge + ADR-0176 von `main`) |
| TW-7-Continuity | nicht inhaltlich geändert; `main`-Stand übernommen |
| Alignment-Datei | unverändert, Blob `4d24d28ff5789a253d0abc6ebd8aa0d6e22a2375` |
| Production-Apply | damals **nicht ausgeführt** — historische Pre-Apply-Evidence |

---

## 2. Historischer Review-Fix `5043150656`

1. `historyInsertSql()` / `sqlStatement()` terminieren jedes Statement. Test prüft die exakte `;\n\ncommit;`-Grenze.
2. Harte Contract-Verification läuft in derselben Transaktion: Migration → History → Verify → COMMIT. Post-Commit Verify bleibt zusätzlich.
3. `profiles_*` und Trip/Traveller-RLS werden als Preflight-Snapshot gelesen und nach Apply exakt verglichen. Keine Pretty-Print-Suche nach `user_id = auth.uid()`.
4. History-Verify prüft nur exakte Version/Name und Statement-Existenz. Der JS-Bytevergleich `historyStimmtMitDatei()` prüft das gespeicherte Statement gegen die gepinnte Datei. Das SQL-Literal `admin_aal2_data_plane_alignment` wird nicht mehr im Statement-Text gesucht.
5. Fail-Path auf Development: `CREATE OR REPLACE` von `darf_betrieb_lesen` + History-Insert + absichtlicher Fehler. Nach Rollback sind Capability-Definition und History unverändert. Zusätzlich Parse-/Rollback-Probe der Apply-Transaktion.

Nicht geändert: Alignment-SQL, Phase-3.1-Grenze, TW-7-Continuity.

„Production unverändert“ in diesem Abschnitt ist historische Pre-Apply-Evidence. Production ist seit Kommentar `5442474653` angewendet.

---

## 3. Historische Gates des Review-Fixes

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

Der Satz „Production wurde nicht beschrieben und nicht angewendet“ aus dem Review-Fix ist historische Pre-Apply-Evidence.

---

## 4. Production-Apply — live verifiziert

Technical Lead hat Production-AAL2 nach PASS-Review `5043413423` und unverändert grünem Live-Preflight angewendet. Scope: **exakt** `20260827170000_admin_aal2_data_plane_alignment.sql`. Keine weitere Migration. Kein zweiter Apply.

Evidence: PR-#102-Kommentar `5442474653` (27. August 2026).

| Check | Live nach Apply |
| --- | --- |
| Production | `qscbgcdmivbbnzrcyegn` |
| Head | `20260827170000` / `admin_aal2_data_plane_alignment` |
| History-Count dieser Version | **1** |
| History-Statement | 5098 Bytes, MD5 `2287c632defa4dce740d968aa28c1290` |
| Datei-Identität | SHA-256 `ac4faa87bf994a1fcbad2212384cb2308695820b63a57dc41ee9a763515ad934`, Git-Blob `4d24d28ff5789a253d0abc6ebd8aa0d6e22a2375` (unabhängig bestätigt aus `main @ b20e54cba4932d515977285a46de1c1207d3c4b4`) |
| `public.aktuelles_admin_aal2()` | **existiert** |
| sechs AAL2-/Capability-Funktionen | `SECURITY INVOKER`, `search_path=pg_catalog`, PUBLIC/anon EXECUTE=false, `authenticated`/`service_role` EXECUTE=true |
| fünf Admin-Capabilities | unveränderte Mindestrolle **UND** `aktuelles_admin_aal2()` |
| `profiles-*` / Trip / Traveller RLS | 35 Policies, MD5 vor und nach Apply `e128e250656cf8d53c386c0a333d8a0e` |
| Advisors | erhoben; keine neue AAL2-spezifische Warnung. Bekannte GraphQL-Exposure-, SECURITY-DEFINER- und Index-Hinweise bleiben fremde Findings |

Dieser Docs-Closure ändert keinen Runtime-, SQL-, Runner-, Migration-, RLS-, Auth- oder Capability-Code. Er schreibt Production nicht.

---

## 5. Endzustand nach Landung

`P1-AAL2-PROD-01` ist nach Landung von PR #102 **geschlossen**.

PR #102 ist das Integrationsvehikel, nicht dauerhaft ein Draft. Das Technical-Lead-Gating des jeweiligen PR-Heads liegt außerhalb dieser kanonischen Live-Wahrheit und schreibt keine bewegliche SHA in dieses Dokument.

**Kein zweiter Apply.** Kein weiterer Production-Write aus diesem Slice.
