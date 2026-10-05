# QS-2 Admin AAL2 Closure – Status

Stand: 26. August 2026

Status: **INTEGRATED on `main` via PR #80 / `d3faa2a0`. Application-Guard integriert. Production-Datenebene NICHT angewendet. HISTORICAL REVIEW-EVIDENCE darunter.**

> Aktueller operativer Stand: `docs/CHATGPT_FINAL_CONTINUITY_HANDOFF_CHECKPOINT_2026-08-26.md`. Die folgenden Abschnitte bleiben Evidence der Revalidierung vor dem Merge.

Branch: `fix/qs2-admin-aal2-guard`
Finding: `P1-QS2-01`
Task: `docs/QS2_ADMIN_AAL2_CLOSURE_TASK.md`
ADR: ADR-0169
Draft-PR: #80

## Git-Lage nach Sync

| Größe | Wert |
| --- | --- |
| Aktueller `origin/main` | `3b317bc677c9d868d1fd8ba75bfa3624ea6b7b73` (Merge PR #83 Provider S5-A) |
| Merge-Base | `3b317bc677c9d868d1fd8ba75bfa3624ea6b7b73` |
| Runtime-/Gate-Head dieser Revalidierung | `05f945d7f2783c8c0f68ade33d61cb240629622d` |
| Ahead / Behind vs `origin/main` am Runtime-Head | **18 / 0** |
| Mergeable | `MERGEABLE` |
| `mergeStateStatus` am Runtime-Head nach grüner CI | siehe GitHub; Draft bleibt Draft |
| Ursprüngliche Baseline | `8ab4e666d4963ac98b32de4b0371dfbd6eefc30f` |

Der einzige Merge-Konflikt gegen `main @ 3b317bc` war **ADR-Nummerierung in `DECISIONS.md`**: der Branch hatte Admin-AAL2 zuerst als ADR-0168; `main` belegt 0166–0168 bereits mit Guest→Account, Official-Compatibility und Commercial Provenance. Admin-AAL2 ist deshalb **ADR-0169**. Keine Auth-/Session-/Identity-Laufzeitkollision.

Inzwischen integrierte PRs #81, #82, #83 und #84 überschneiden den Slice-Diff nur in Dokumentation (`ARCHITECTURE.md`, `DECISIONS.md`, `ROADMAP.md`) plus dem bestehenden `lib/seo/index-grenze.test.ts`. Keine Runtime-Datei von D0-2, Guest→Account, Traveller, TW6-A oder Commercial Provenance ist im Slice-Diff.

## Freigaben

Der Product Owner hat am 26. August 2026 zuerst die zentrale verpflichtende Admin-AAL2-Regel und nach dem unabhängigen Technical-Lead-Finding zusätzlich ausdrücklich **Admin RLS AAL2** freigegeben.

Die zweite Freigabe gilt nur für das enge Hardening der bestehenden administrativen DB-Fähigkeiten. Kein allgemeiner RLS-/Ownership-/Rollen-Umbau und keine Production-Migration vor erneutem Review.

## Application-Layer

Admin-Zugang = verifizierte Identität + ausreichende Rolle/Capability bzw. zulässiger Break-Glass-Pfad + `currentLevel === 'aal2'`.

Die Wahrheit sitzt zentral in `evaluateAdminAccess()`:

- Rolle + AAL1 → kein Admin, Step-up `/admin/mfa`
- Rolle + AAL2 → bestehende Rollen-/Capability-Semantik
- Break-Glass + AAL1 → kein Zugang
- Break-Glass + AAL2 → bestehende Break-Glass-Oberfläche, weiterhin keine zusätzlichen DB-Rechte
- unzureichende Rolle + AAL2 → forbidden
- Rollen-Lookup kaputt → lookup-failed
- AAL-Lookup kaputt → aal-lookup-failed / fail closed; wird **nicht** als AAL2 gelesen
- `requireAdminApi()` → maschinenlesbare 403 (`aal2-required`) / 503 (`aal-lookup-failed`), kein HTML-Redirect
- Return-Ziele nur interne Admin-Pfade; Login- und Step-up-Pfade sind ausgeschlossen
- kein TOTP-Faktor → kein Bypass, ehrlicher Weg nach `/account/security`

`/admin/mfa` liegt in `(public)` und nicht hinter `requireAdminPage`; Middleware verlangt weiterhin eine verifizierte Sitzung.

Nach der Integration auf `3b317bc` wurde dieser Vertrag gegen den tatsächlichen Diff erneut gelesen. Keine stillen Auth-/Session-/Identity-Vertragsänderungen ausserhalb dieses Closure-Scope.

## Data-Plane-Hardening

Development-only: `supabase/migrations/20260826090000_admin_aal2_data_plane.sql`.

Die Migration führt `public.aktuelles_admin_aal2()` ein. Nur der signierte Supabase-JWT-Claim `aal='aal2'` ergibt true; fehlender oder anderer Wert ist fail closed. `nextLevel`, Faktor-Existenz oder User-Metadaten werden nicht gelesen.

Alle fünf bestehenden administrativen DB-Fähigkeiten behalten exakt ihre bisherigen Mindestrollen und verlangen zusätzlich aktuelles AAL2:

- `darf_betrieb_lesen()` → moderator + AAL2
- `darf_betrieb_eingreifen()` → operator + AAL2
- `darf_konten_verwalten()` → moderator + AAL2
- `darf_inhalte_moderieren()` → moderator + AAL2
- `darf_konfiguration_verwalten()` → admin + AAL2

Consumer-/Self-Service-Pfade bleiben unverändert. Beispiel: eigenes Profil bleibt über `user_id = auth.uid()` erreichbar; nur der administrative Fremdzugriff über `darf_konten_verwalten()` verlangt AAL2.

`types/supabase.ts` enthält `aktuelles_admin_aal2` noch nicht. Die Anwendung ruft die Hilfsfunktion nicht über den typed Client auf; die Grenze gilt in SQL. Eine Typenerzeugung wäre erst nach einer genehmigten DB-Anwendung sinnvoll und ist **kein** Production-Auftrag.

## Tatsächlicher Diff gegen `origin/main`

21 Dateien, 1257+/27− am Runtime-Head `05f945d7`:

- `ARCHITECTURE.md`
- `DECISIONS.md`
- `ROADMAP.md`
- `app/(public)/admin/login/actions.ts`
- `app/(public)/admin/mfa/AdminMfaStepUp.tsx`
- `app/(public)/admin/mfa/actions.ts`
- `app/(public)/admin/mfa/layout.tsx`
- `app/(public)/admin/mfa/page.tsx`
- `docs/AUTH.md`
- `docs/QS2_ADMIN_AAL2_CLOSURE_STATUS.md`
- `docs/QS2_ADMIN_AAL2_CLOSURE_TASK.md`
- `lib/auth/admin-aal-datenbank.test.ts`
- `lib/auth/admin-aal-wiring.test.ts`
- `lib/auth/admin-aal.test.ts`
- `lib/auth/admin-aal.ts`
- `lib/auth/admin-access.test.ts`
- `lib/auth/admin-access.ts`
- `lib/auth/admin-guard.ts`
- `lib/seo/index-grenze.test.ts`
- `middleware.ts`
- `supabase/migrations/20260826090000_admin_aal2_data_plane.sql`

## Development-Supabase-Evidence

Entwicklungsprojekt: `[REDACTED]` (`develop`). Production `qscbgcdmivbbnzrcyegn` wurde **nicht** migriert. Diese Runde hat **keine** Migration angewandt.

Die frühere Development-Anwendung von `admin_aal2_data_plane` und das adversariale DB-Repro (AAL1 unsichtbar / AAL2 sichtbar, SECURITY-DEFINER-RPC 0 vs 17 Zeilen, `ROLLBACK`) bleiben die letzte belegte Development-DB-Evidence. Sie wurden in dieser Integrationsrunde nicht wiederholt, weil keine Production- oder erneute Development-Anwendung erlaubt war.

Zusätzlicher Source-Contract-Test: `lib/auth/admin-aal-datenbank.test.ts` beweist, dass jede administrative Fähigkeit weiterhin Rolle **und** AAL2 verlangt und dass die AAL-Hilfsfunktion ausschließlich `auth.jwt()->>'aal'` verwendet.

## Security Review dieser Revalidierung

Application, erneut gegen den Diff nach Sync:

- zentrale Wahrheit: `evaluateAdminAccess()` → `applyAdminAal()` → nur `currentLevel`
- Passwortlogin gibt AAL1 nicht nach `/admin` frei; Step-up bleibt session-erhaltend
- Magic-Link-Ziel bleibt `${site}/admin`; AAL1 wird zentral am Guard gestoppt
- Consumer-OAuth/`next` kann `/admin` nicht als Consumer-Ziel setzen
- bestehende AAL1-Sitzung trifft Layout-/API-Guard
- Break-Glass ohne AAL2 wird blockiert
- API bleibt JSON-fail-closed
- Return-Target-Allowlist verhindert Open Redirect
- AAL-Lookup-Fehler ist 503 / fail closed, nicht AAL2

Data Plane:

- Rolle allein reicht nicht mehr für administrative Fähigkeiten
- AAL2 allein reicht ebenfalls nicht; Mindestrolle bleibt erhalten
- SECURITY-DEFINER-Admin-RPCs hängen weiterhin an denselben Fähigkeiten
- Consumer-Ownership-RLS wurde nicht verschärft
- keine neuen Secrets, keine paid calls, keine Provider-/Payment-Produktlogik
- keine Production-Migration

Residual: Noch kein Live-Browser-TOTP gegen ein echtes Admin-Konto in dieser Umgebung. Das ist kein Ersatz für die bereits serverseitig und auf Development-DB belegte AAL-Grenze, bleibt aber ein späterer End-to-End-Nachweis.

## Lokale Gates auf Runtime-Head `05f945d7`

- gezielte AAL2-/Access-/Index-Tests — 65/65 pass
- `npm test` — **2181/2181** pass
- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run check:setup:ci` — pass (1 erwartete Warnung: keine `.env`/`.env.local` in dieser Umgebung)
- `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` — pass
- `npm run auth:pruefen` — 55/55
- `npm run build` — pass (`/admin/mfa` ist eigener Entry, nicht hinter dem Admin-Gruppenlayout)

## Exact-Head GitHub Actions / Vercel auf `05f945d7`

- GitHub Actions CI: [32978317483](https://github.com/Jetnity/jetnity/actions/runs/32978317483) **SUCCESS**
  - Typecheck, Lint, Tests, API-Schutz, Schema-Bezug, Dead/Exports/Deps, Production Build
  - Auth-Konfiguration gegen `config.toml`
- Vercel Preview: [ATQn5xGZMC4pMPy3pMjLfjUGawP1](https://vercel.com/jetnity-e1b93c82/jetnity-app/ATQn5xGZMC4pMPy3pMjLfjUGawP1) **READY** / GitHub-Status `success` am Commit `05f945d7`
- Preview-URL: https://jetnity-app-git-fix-qs2-admin-aal2-guard-jetnity-e1b93c82.vercel.app

Ein nachfolgender Evidence-Commit ändert nur diese Status-/Task-Dateien. Runtime bleibt identisch mit `05f945d7`.

## Review-Threads

Offene Inline-Review-Threads: **0**.

Ein früherer unabhängiger Technical-Lead-Kommentar auf `eab76fbc` (Application stark, Data-Plane damals offen) ist durch die Development-Migration adressiert, aber **nicht** als geschlossen markiert. ChatGPT / Technical Lead macht den letzten unabhängigen Review auf dem heutigen Sync-Stand.

## P0 / P1 / P2 / P3

- **P0:** keines in dieser Revalidierung.
- **P1:** P1-QS2-01 selbst – Application + Development-Data-Plane umgesetzt; Production-Datenebene bleibt absichtlich unverändert, bis Review und gesonderte Freigabe das erlauben. Kein neuer P1.
- **P2:** `types/supabase.ts` kennt `aktuelles_admin_aal2` noch nicht (generierte Typen, keine App-Aufrufer). Kein Live-Browser-TOTP gegen ein echtes Admin-Konto.
- **P3:** Actions-Annotation „Node.js 20 deprecated“ (bestehend). Lokaler Browserslist-Hinweis. Setup-Warnung ohne `.env.local`.

## Parallelität / Production

- `main` ist `3b317bc` und bleibt unangetastet.
- Production-Supabase wurde nicht verändert.
- Keine Secrets, keine neuen laufenden Kosten, kein Admin D–K, kein Folgeslice.
- `docs/ACTIVE_WORK_STATUS.md` wurde nicht geändert.

## Nächster Schritt

**STOPP.** Unabhängiger ChatGPT-/Technical-Lead-Security-Review auf dem synchronisierten Diff, den Gates und der Development-RLS-Evidence. Kein Ready, kein Merge, keine Production-Migration, kein Folgeslice.
