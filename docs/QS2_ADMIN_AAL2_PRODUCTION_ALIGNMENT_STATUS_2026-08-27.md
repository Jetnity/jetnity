# Jetnity – Admin AAL2 Production Alignment – Status

Stand: 27. August 2026  
Finding: `P1-AAL2-PROD-01`  
Cursor-Agent: `Jetnity quality security audit`  
Branch: `fix/admin-aal2-production-alignment-2026-08-27`  
Draft-PR: #98  
Status: **TL CHANGES REQUIRED BEHOBEN / DRAFT / STOPP / KEIN READY / KEIN MERGE / KEIN PRODUCTION APPLY**  
Review: `5042410938` auf Head `0db2f7f3e3bcf6141551582c4c0a386675342837`  
Neuer Exact Head: *folgt nach Commit dieses Review-Fixes*

Verbindlicher Auftrag: `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_IMPLEMENTATION_TASK_2026-08-27.md`  
Playbook: `docs/QS2_ADMIN_AAL2_PRODUCTION_ALIGNMENT_PLAYBOOK_2026-08-27.md`  
Reconciliation-Gate: `docs/QS2_ADMIN_AAL2_PRODUCTION_RECONCILIATION_TASK_2026-08-27.md`

---

## 1. Live-Verifikation vor Implementierung

Erneut geprüft, bevor Dateien geschrieben wurden:

| Check | Live-Stand |
| --- | --- |
| `origin/main` | `84f54194cf7461c5f785f4da490dba060c93e999` |
| Task-Dokument nannte ursprünglich | `4362502bf23c1c54f721af48c0f7bdd6fcbdee3b` |
| Drift | **ja, dokumentiert.** `main` ist nach PR #97 + Folgecommits weiter. Branch wurde von `84f54194` erstellt, **0 behind / 2 docs-ahead** vor dieser Implementierung. |
| Production Supabase | `qscbgcdmivbbnzrcyegn` (unverändert, nicht beschrieben) |
| Repo Production-Head-Datei | `20260827010000_reise_anlegen_zero_stage_fail_closed.sql` vorhanden |
| Historische Repo-Datei | `20260826090000_admin_aal2_data_plane.sql` unverändert belassen |
| Bevorzugter Alignment-Name | `20260827170000_…` war frei |
| PR #98 | Draft OPEN, MERGEABLE, 0 Review-Threads |
| Konkurrierende AAL2-Implementierungs-PR | keine |

Die Task-STOP-Regel „Baseline weicht ab“ wurde **nicht blind ignoriert**: Die Statusdatei hatte `84f54194` bereits als Start-Baseline festgehalten. Der Branch hängt an genau diesem `main`. Es gab keine neuere AAL2-Runtime auf `main`. Deshalb wurde die Implementierung auf diesem Head fortgesetzt, statt die ältere SHA `4362502b` zu erzwingen.

`docs/ACTIVE_WORK_STATUS.md` und `JETNITY_HANDOFF.md` wurden **nicht** geändert (zentrale Continuity bleibt Technical Lead).

---

## 2. Umgesetzt

1. Neue forward-only Alignment-Migration  
   `supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql`
2. Contract-Tests  
   `lib/auth/admin-aal2-alignment.test.ts`  
   plus bestehende `admin-aal-datenbank.test.ts` / `faehigkeiten-datenbank.test.ts`
3. Consumer-Inventur (14 RLS + 4 SECURITY-DEFINER-RPCs) im Playbook und in Tests
4. Rollout-/Verification-/Recovery-Playbook
5. Dieser Status

Nicht umgesetzt und nicht erlaubt:

- Production-Apply
- Production-RLS-/Capability-Write
- Änderung von `20260826090000_admin_aal2_data_plane.sql`
- Rollen-/Auth-/Consumer-Ownership-Umbau
- `types/supabase.ts`-Regenerierung
- Ready / Merge

---

## 3. Vertrag der neuen Migration

`CREATE OR REPLACE`, idempotent, `SECURITY INVOKER`, `search_path = pg_catalog`.

- `aktuelles_admin_aal2()` = `coalesce((auth.jwt() ->> 'aal') = 'aal2', false)`
- fünf `darf_*()` = unveränderte `hat_rolle_mindestens(...)` **AND** `aktuelles_admin_aal2()`
- Revoke `public`/`anon`, Grant `authenticated`/`service_role`
- keine Policy-, Tabellen- oder Ownership-Mutation

---

## 4. Tests / Gates dieses Autorenlaufs

| Gate | Ergebnis |
| --- | --- |
| `node --import tsx --test lib/auth/admin-aal2-alignment.test.ts lib/auth/admin-aal-datenbank.test.ts lib/auth/faehigkeiten-datenbank.test.ts lib/auth/admin-aal.test.ts` | 48 passed, 4 files, exit 0 (Review-Fix; +1 Current-State-/Rename-Test) |
| `npm test` | 2318 passed, 0 failed, 425 suites, exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | no errors, no warnings, exit 0 |
| `check:dead` | 760 reachable, 1 justified orphan (`CookieConsent.tsx`), exit 0 |
| `check:exports` | 648 files, 0 unused exports, exit 0 |
| `check:deps` | 0 unused / 0 missing, exit 0 |
| `check:api-schutz` | 12 admin routes, all `requireAdminApi()`, exit 0 |
| `check:schema-bezug` | 17 tables/views, 19 functions, exit 0 |
| `npm run build` | exit 0; 46 static pages; existing Edge-Runtime-Warnungen von `@supabase/*` unverändert |

Matrix, lokal belegt:

- AAL1 + privilegierte Rolle => false
- fehlender/leerer/malformed AAL + privilegierte Rolle => false
- AAL2 + unzureichende Rolle => false
- AAL2 + ausreichende Rolle => true
- Mindestrollen unverändert
- Consumer-Self-Service-OR unangetastet
- Break-Glass kein DB-Recht

Historische Datei `20260826090000_admin_aal2_data_plane.sql` unverändert: Git-Blob `4b5d74e75b112b777507c310c000facb36a69d6e`, identisch mit `origin/main`.

`auth:pruefen` nicht ausgeführt: dieser Slice ändert keine Auth-Server-Konfiguration.

---

## 5. Pflicht-Self-Review

| Frage | Ergebnis |
| --- | --- |
| Neue Migration forward-only? | ja, nur `CREATE OR REPLACE` + GRANT/REVOKE |
| Versionskollision? | nein; `20260827170000` war frei und liegt nach Production-Head `20260827010000` |
| Rolle und AAL mit `AND`? | ja, in allen fünf `darf_*()` |
| AAL nur aus `auth.jwt()`? | ja, `auth.jwt() ->> 'aal'` |
| Fehlendes AAL fail-closed? | ja, `coalesce(..., false)` |
| Fünf Mindestrollen unverändert? | ja: moderator / operator / moderator / moderator / admin |
| Grants/Revoke korrekt? | ja: revoke `public`/`anon`, grant `authenticated`/`service_role` |
| Sicherer `search_path`? | ja, `pg_catalog`; zusätzlich explizit `SECURITY INVOKER` |
| Keine Tabellen-/Ownership-/Consumer-RLS-Mutation? | ja |
| 14 RLS + 4 SECURITY-DEFINER-RPCs erfasst? | ja; aktuelle Namen `profiles_lesen` / `profiles_aendern` / `profiles_loeschen`, Current-State CREATE+RENAME+DROP |
| Verification nach späterem Apply dokumentiert? | ja, Playbook Abschnitt 5 |
| Apply bleibt Product-Owner-Gate? | ja; kein Apply in diesem Slice |

---

## 6. Restpunkte für den Technical Lead

- Exact-Head GitHub Actions und Vercel von PR #98 nach diesem Head
- Unabhängige Migration-Semantik-Prüfung
- Development read-only Evidence, dass `CREATE OR REPLACE` die bestehende Dev-Semantik nicht verschiebt
- Production weiterhin **nicht** anwenden
- Review-Threads

Nächster Schritt: erneuter unabhängiger Technical-Lead-Finalreview auf dem neuen Exact Head. Erst bei PASS darf der PR normal integriert werden. **Auch nach Merge bleibt der Production-Apply ein separates Product-Owner-Gate.**

---

## 7. Review-Fix nach `5042410938` (CHANGES REQUIRED)

Live erneut geprüft vor dem Fix: Branch-Head `0db2f7f3e3bcf6141551582c4c0a386675342837`, identisch mit `origin/fix/admin-aal2-production-alignment-2026-08-27` und PR-Head. `origin/main` unverändert `84f54194`. Draft-PR #98 OPEN. Kein Production-Apply.

Korrigiert, ausschließlich die Review-Funde:

1. Consumer-Inventar in `lib/auth/admin-aal2-alignment.test.ts` auf aktuelle Namen `profiles_lesen`, `profiles_aendern`, `profiles_loeschen`.
2. Test wertet den finalen Policy-Stand aus CREATE + `ALTER POLICY … RENAME` + DROP aus. Die Rename-Kette `20260817120300_generisches_profil.sql` ist explizit belegt. Historische `creator_profiles_*`-Namen dürfen nicht mehr der aktuelle Stand sein.
3. Playbook-Inventar auf dieselben `profiles_*`-Namen.
4. `ARCHITECTURE.md` Eingangssatz: Development-History `20260826052735_admin_aal2_data_plane`; historische Repo-Datei `20260826090000_admin_aal2_data_plane.sql`.

Nicht geändert: Alignment-Migration `20260827170000_admin_aal2_data_plane_alignment.sql`, historische `20260826090000`, `types/supabase.ts`, `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_HANDOFF.md`.

Gates dieses Review-Fixes:

| Gate | Ergebnis |
| --- | --- |
| Targeted AAL2/capability | 48 passed, 4 files, exit 0 |
| `npm test` | 2318 passed, 0 failed, 425 suites, exit 0 |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | no errors, no warnings, exit 0 |
| `check:dead` | 760 reachable, 1 justified orphan (`CookieConsent.tsx`), exit 0 |
| `check:exports` | 648 files, 0 unused exports, exit 0 |
| `check:deps` | 0 unused / 0 missing, exit 0 |
| `check:api-schutz` | 12 admin routes, all `requireAdminApi()`, exit 0 |
| `check:schema-bezug` | 17 tables/views, 19 functions, exit 0 |
| `npm run build` | exit 0; 46 static pages |
