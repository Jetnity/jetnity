# Jetnity Admin Indexing Status 1 — STATUS

Stand: 22. September 2026  
Status: **R1 CORRECTION / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

Draft PR: #547  
Branch: `feat/admin-indexing-status-1`  
Binding task: `docs/ADMIN_INDEXING_STATUS_1_TASK_2026-09-22.md` v1  
Task seed: `162fefd5b0c26236b8ec1c5ce6550881105375e9`  
Baseline `origin/main`: `9dc8926ef859bcde2dc31dc8b96f2e61e1948f74` (#546 closed; exact main CI `35747010279` SUCCESS and Production READY are TL-stated, not re-claimed here)

Cursor-Agent: **Jetnity admin indexing status 1**, Generation 1  
Required and actual model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-80776dce-2c41-423e-9ab6-c46b8747ff43`  
Session URL: https://cursor.com/agents/bc-80776dce-2c41-423e-9ab6-c46b8747ff43  
Observed display name: `Admin indexing status`  
UI rename: not performed  
Session footer: run-info identity only; no TL UI/model verification claimed.

Mode: `NORMAL`. Parallel writer #545 owns palette/Topbar/admin layout; this slice did not edit those paths. Agent self-review is not Technical-Lead PASS. A new head invalidates older exact-head gates. Exact-head CI / Auth / Preview for the freeze SHA will be reported in a PR comment. No further docs commit solely to stamp those checks.

Cursor does not mark Ready. Cursor does not merge. No follow-up slice.

---

## 1. Implementation plan (from existing contracts)

Goal: one honest, compact, read-only “Indexierungs-Konfiguration” on existing guarded `/admin/system-health`.

| Item | Decision |
| --- | --- |
| Source of truth | Call `oeffentlicherOrigin`, `robotsDokument`, `sitemapOeffentlicheUrls`, optional `htmlRobots` with **one** bounded snapshot |
| Snapshot | `waehleSeoStatusUmgebung` keeps only the five `OriginUmgebung` keys; server adapter reads `process.env` only through that picker |
| UI | New presentational `IndexingStatus` after the existing board; German labels; origins as text; no remote links/fetch/controls |
| Auth | `requireAdminPage({ surface: 'system-health', capability: 'betrieb-lesen' })` remains first; projection only after that await |
| Refresh | Explicit page-load limit; board “Erneut prüfen” is named as not applying |
| Allow meaning | Configuration permits indexing; never PO launch, live crawl, SEO quality, traffic or Production ready |
| Deny meaning | Intentional configuration, not an outage |
| Out of scope | Nav/layout/SEO policy/Auth/DB/API/provider/model/cost; public indexing activation; settings; tracking |

Traveller-context check: not relevant. No traveller credentials are collected or shown.

---

## 2. Owned files

| File | Change |
| --- | --- |
| `app/(admin)/admin/system-health/page.tsx` | Minimal import + post-guard projection + render |
| `components/admin/system-health/IndexingStatus.tsx` | New read-only section |
| `lib/admin/seo-status.ts` | Pure projection + bounded env picker |
| `lib/admin/seo-status-server.ts` | `server-only` snapshot/page loader |
| `lib/admin/seo-status.test.ts` | Projection, leak, UI and page-source tests |
| `scripts/admin-indexing-status-1-render.mjs` | Synthetic SSR + Playwright 390/1440 |
| `scripts/admin-indexing-status-1-verify.mjs` | Focused tests + render (no package.json edit) |
| this STATUS / HANDOFF / SELF_REVIEW + `docs/evidence/admin-indexing-status-1/` | own evidence |

Unchanged on purpose: `lib/seo/*`, `app/robots.ts`, `app/sitemap.ts`, Auth/guards, navigation, AdminSessionProvider, AdminTopbar, Admin layouts, SystemHealthBoard and health runtime/API, public pages, env/config/workflows/package/lock, `docs/ACTIVE_WORK_STATUS.md`.

---

## 3. Tests (local, this persist)

Focused `node --test`:

- `lib/admin/seo-status.test.ts` — 14/14 PASS
- existing `lib/seo/*.test.ts` — run unchanged, PASS

Synthetic browser evidence: `scripts/admin-indexing-status-1-render.mjs` (deny-preview, allow-canonical, deny-long-origin, deny-conflict × 390/1440). Not an authenticated `/admin` session and not a physical-device PASS.

R1: deny copy is one neutral sentence for Preview-deny and conflicting SITE/APP. No reason classifier. No “beabsichtigter Deny / kein Ausfall”.

Typecheck / lint / build / hygiene and exact-head CI/Auth/Preview are recorded after the freeze push, in the PR comment.

---

## 4. Limits

- No live crawler, HTTP probe or Production settings read.
- No authenticated Preview walkthrough of `/admin/system-health` (auth boundary unchanged).
- Deny reasons are not re-derived; only the existing helper result is shown.
- Parallel #545 remains a disjoint writer. TL serializes integration.

## 5. Next actor

Independent Technical-Lead exact-head review of the freeze SHA only. **Not Ready. Not merged. No follow-up slice.**
