# Intelligent Admin Analyst Runtime 1 — Status

Stand: 21. September 2026  
Status: **IA-R1 / IA-R2 ADDRESSED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

Issue: #515  
Draft PR: #518  
Branch: `feat/intelligent-admin-analyst-runtime-1`  
Binding task: `docs/INTELLIGENT_ADMIN_ANALYST_RUNTIME_1_TASK_2026-09-21.md`  
Accepted contracts reused, not rewritten: Foundation 1 DECISION / SOURCE_MATRIX / RUNTIME_TASK

Cursor-Agent: **Jetnity intelligent admin analyst runtime 1**, Generation 1  
Required model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-d984b8d4-cc45-4889-96ec-2a10599881c4`  
Run URL: https://cursor.com/agents/bc-d984b8d4-cc45-4889-96ec-2a10599881c4

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. Synthetic renders are not authenticated Preview/Production proof. Exact-head CI / Auth / Vercel / thread IDs belong in a **PR comment** after this persist, not in a later evidence-only commit.

---

## 1. Result

One read-only `Aktuelle Hinweise` section is composed on existing `/admin` immediately before `AdminNaechsteSchritte`. It derives operational attention from `SystemHealthBericht` only.

IA-CR1 preserved:

- `betrieb-lesen` + AAL via `evaluateAdminAccess({ capability: 'betrieb-lesen', surface: 'admin-home-analyst' })` before any source load;
- every `AdminDenial`, including both lookup failures, yields zero loader calls and `observationScope: 'none'`;
- process-shared collector reuse is labelled `process-recent`, not current-session proof;
- exported `projiziereBreakGlassSystemHealth` strips database-backed airports facts, including cached success/failure;
- session-wording overlay never turns a failed/unknown read into a successful-read claim.

IA-CR2 preserved:

- original `checkedAt` is not rewritten;
- freshness comes from original timestamp + evaluation clock;
- unknown and stale remain;
- no universal “höchstens 30s” / “at most 30s old” in hint, limitations or insight copy.

IA-R1 (review `5269977192` on `1a224b64`): each insight keeps the **item/check timestamp that owns its freshness**. `sourceCheckedAt` remains the collection time. Mixed clocks and item-local missing/invalid timestamps are executable tests.

IA-R2: the view renders Beobachtet as an accessible `<time dateTime>` plus a German age (`vor 90 Sekunden` / `Prüfzeitpunkt unbekannt`). Invalid strings never become `dateTime`.

Deterministic only. `modelExplanation.enabled=false`. `writeActions=[]`. Safe next hop `/admin/system-health` investigate only. No live Copilot/Execute claim.

Traveller-context intelligence does not apply: operator Admin A–C, no traveller credentials.

---

## 2. Git evidence (at this persist)

`origin/main` was fetched once. **No rebase. No sibling merge.**

| Item | Value |
| --- | --- |
| Task / PR baseline | `main@19a91a2594127eb2b6104b68da69786194e13865` |
| Live `origin/main` after fetch | `19a91a2594127eb2b6104b68da69786194e13865` — identical to baseline |
| Dispatch / seed head | `e90e2622e0f9cadd0d32b21b674289c42f457ddf` |
| Ahead / behind vs live main before this persist | **4 ahead / 0 behind** (seed + copy + derivation + home compose) |
| Rebase | **not done** |
| Sibling PRs | #516 Workspace and #517 guest-adoption not edited or merged |

Exact freeze SHA is the commit that records this STATUS plus evidence. It is reported in the PR comment after push.

Local `main` had been a stale snapshot pin at `d3d42047` before fetch. Live remote main is the dispatch baseline.

---

## 3. Owned files

Allowed runtime set only:

- `lib/admin/analyst/typen.ts`
- `lib/admin/analyst/system-health-insights.ts` + `.test.ts`
- `lib/admin/analyst/laden.ts` + `.test.ts`
- `lib/admin/analyst/lagehinweise-render.test.ts`
- `lib/admin/analyst/index.ts`
- `components/admin/home/AdminLagehinweise.tsx`
- `app/(admin)/admin/page.tsx`
- `lib/admin/ehrliche-zustaende.ts` + additive `.test.ts`
- this STATUS / HANDOFF / SELF_REVIEW / TASK
- `docs/evidence/intelligent-admin-analyst-runtime-1/`

Not written: System Health collector/cache/guard, roles/capabilities, Security widgets, provider-ops, package/lockfile, workflows, DB/RLS/migrations, finance/Ads/Bexio/CRM, Foundation 1 specification docs, `docs/ACTIVE_WORK_STATUS.md`, #516/#517 files.

---

## 4. Verification (local, before freeze)

| Check | Result |
| --- | --- |
| Analyst T-* + loader + render | **42/42 pass** (`lib/admin/analyst/*.test.ts` + additive honest-copy) |
| Required regressions | **84/84 pass** including System Health, navigation, admin-access, honest-copy |
| Full `npm test` | **3559/3559 pass** |
| `npx tsc -p tsconfig.json --noEmit` | **pass** |
| ESLint on owned files | **pass** after removing unused import |
| `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` | **pass** (0 orphans, 0 unused exports, no new API) |
| `npm run build` | **pass** — `/admin` remains dynamic; no new route |
| Synthetic render | attention / coverage / denied / stale / break-glass at 320 / 390 / 1280 |
| Authenticated Preview click-through | **BLOCKED_ACCESS** — no login/secret/bypass |

---

## 5. Limits

- Synthetic HTML/Playwright screenshots use an approximated token sheet. They prove copy, ranking, hop, denial and break-glass projection — not branded Preview pixels.
- No real-device pass. No blanket accessibility claim.
- Process cache remains shared across allowed callers. That is accepted and labelled, not isolated.
- Expected `not_configured` platforms stay coverage. No token-setup recommendation.

---

## 6. Stop

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE / AUTHORIZATION / SOURCE-TRUTH / VISUAL REVIEW.**

No Ready. No merge. No follow-up slice by Cursor. No new source, model, secret, paid call, Production activation or Grok routine.
