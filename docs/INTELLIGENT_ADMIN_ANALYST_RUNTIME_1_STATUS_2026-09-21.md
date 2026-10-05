# Intelligent Admin Analyst Runtime 1 — Status

Stand: 21. September 2026  
Status: **#516 MAIN INTEGRATED / REVIEWED RUNTIME UNCHANGED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TECHNICAL-LEAD RE-REVIEW**

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

IA-R1 (review `5269977192` on `1a224b64`, remaining branch in `5270094225` on `ffff328c`):

- item/check insights keep the timestamp that owns freshness;
- `keinSignalInsight` now uses the airports-owning item timestamp, not collection time;
- `sourceCheckedAt` remains collection time;
- mixed-clock attention, mixed-clock fresh no-signal, and item-local missing/invalid cases are executable tests.

IA-R2: Beobachtet is an accessible `<time dateTime>` plus German age. Fixed UTC instants carry an explicit `UTC` label. Invalid strings never become `dateTime`.

IA-R3: synthetic captures compile `styles/globals.css` via postcss + tailwind + autoprefixer (103597 bytes). Manifest records overflow/focus measurements. All required 320/390/1280 cases reported `overflowing: false` and `cardsBeyondShell: 0`. Product layout was not changed to satisfy the old approximated harness.

Deterministic only. `modelExplanation.enabled=false`. `writeActions=[]`. Safe next hop `/admin/system-health` investigate only. No live Copilot/Execute claim.

Traveller-context intelligence does not apply: operator Admin A–C, no traveller credentials.

---

## 2. Git evidence (at this persist)

Second authorized main integration after TL merged #516. **No rebase. No sibling branch merge. Reviewed Admin runtime unchanged.**

| Item | Value |
| --- | --- |
| Task / PR baseline | `main@19a91a2594127eb2b6104b68da69786194e13865` |
| Reviewed runtime head | `1355fc78b52e7b2e664f19116160f5173aeebdcb` |
| Live `origin/main` integrated | `039e62ff2f3245ed006de02f7d4c9fbac661b3ee` (#516 workspace usability, after #517) |
| Dispatch / seed head | `e90e2622e0f9cadd0d32b21b674289c42f457ddf` |
| Previous freezes (historical) | `ffff328c` and `1355fc78` — invalidated by this persist |
| Ahead / behind vs live main after this merge | **13 ahead / 0 behind** before the handoff persist |
| Rebase | **not done** |
| Conflicts | none — #516 files are disjoint Workspace UI/date paths |
| Sibling branches | #516 and #517 entered only via main; neither sibling branch was merged |

Exact freeze SHA is the commit that records this STATUS plus recaptured evidence. It is reported in the PR comment after push.

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

Not written by this writer: System Health collector/cache/guard, roles/capabilities, Security widgets, provider-ops, package/lockfile, workflows, DB/RLS/migrations, finance/Ads/Bexio/CRM, Foundation 1 specification docs, `docs/ACTIVE_WORK_STATUS.md`. #516 and #517 files arrived only through authorized main integrations.

---

## 4. Verification (local, before freeze)

| Check | Result |
| --- | --- |
| Analyst T-* + loader + render + IA-R1/IA-R2/no-signal | **46/46 pass** (`lib/admin/analyst/*.test.ts` + additive honest-copy) |
| Required System Health / admin-access / honest-copy regressions | **44/44 pass** |
| `npx tsc -p tsconfig.json --noEmit` | **pass** |
| ESLint on owned files | **pass** |
| Synthetic render | attention / coverage (mixed-clock 30s) / denied / stale / break-glass at 320 / 390 / 1280 with compiled product CSS |
| Overflow measurements | all cases/viewports `overflowing: false`, `cardsBeyondShell: 0` |
| Authenticated Preview click-through | **BLOCKED_ACCESS** — no login/secret/bypass |

---

## 5. Limits

- Synthetic HTML/Playwright screenshots now use compiled product CSS. They still prove component copy, ranking, hop, denial and break-glass projection — not an authenticated `/admin` Preview session.
- No real-device pass. No blanket accessibility claim.
- Process cache remains shared across allowed callers. That is accepted and labelled, not isolated.
- Expected `not_configured` platforms stay coverage. No token-setup recommendation.

---

## 6. Stop

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE / AUTHORIZATION / SOURCE-TRUTH / VISUAL REVIEW.**

No Ready. No merge. No follow-up slice by Cursor. No new source, model, secret, paid call, Production activation or Grok routine.
