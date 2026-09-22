# Intelligent Admin Model Usage Attention 1 — Status

Stand: 22. September 2026  
Status: **IMPLEMENTED / DRAFT / NOT READY / NOT MERGED / STOP FOR INDEPENDENT TECHNICAL-LEAD REVIEW**

Issue: #537  
Draft PR: #538  
Branch: `feat/intelligent-admin-model-usage-attention-1`  
Binding task: `docs/INTELLIGENT_ADMIN_MODEL_USAGE_ATTENTION_1_TASK_2026-09-22.md`  
Accepted contracts reused, not rewritten: Foundation 1 DECISION / SOURCE_MATRIX / RUNTIME_TASK §10

Cursor-Agent: **Jetnity intelligent admin model usage attention 1**, Generation 1  
Required model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-2c6673c9-be6c-4de3-a735-0516448e7fdd`  
Run URL: https://cursor.com/agents/bc-2c6673c9-be6c-4de3-a735-0516448e7fdd  
UI rename: no programmable session-rename capability was exposed; logical name is repository/PR evidence only.

This file is point-in-time evidence. Agent self-review is not Technical-Lead PASS. Synthetic renders are not authenticated Preview/Production proof. Exact-head CI / Auth / Vercel / thread IDs belong in a **PR comment** after this persist, not as a later invented pass.

---

## 1. Result

One read-only `Modellnutzung` card is composed on existing `/admin` immediately after `AdminLagehinweise` and before `AdminNaechsteSchritte`. It derives status and freshness from the existing ProviderOpsBoard `model-usage` item only.

Contracts preserved:

- `evaluateAdminAccess({ capability: 'betrieb-lesen', surface: 'admin-home-model-usage' })` before any board loader access;
- every `AdminDenial` yields zero board-loader calls, exact denial, no source facts and no investigate hop;
- allowed break-glass / `reachesDatabase === false` yields zero board-loader calls, `not_attributed`, no cached available/empty/unavailable values and no hop;
- only allowed role access invokes `ladeProviderOpsBoardFuerSeite()`;
- unique `model-usage` item required; missing/duplicate/malformed is `partial_failed`, not first-match or healthy fallback;
- unrelated parent items are discarded and cannot become this source’s incident;
- empty ≠ null spend; unavailable ≠ empty; unknown ≠ empty;
- available is coverage, never healthy finances/budget/limit;
- foundation_only / disabled / not_configured are conservative coverage with no activation recommendation;
- original `item.checkedAt` plus evaluation now and TTL 120000; board `checkedAt` and `metadata.juengsteCreatedAt` are not substituted;
- missing/invalid/future timestamps stay `unknown` with `ageMs: null` (future is not clamped to fresh);
- stale available/empty is attention and cannot produce a current all-clear;
- process-recent on loaded snapshots; A then B keep the original time; no “in dieser Sitzung”;
- closed copy map only; raw detail/metadata/free text discarded;
- one fixed investigate link `/admin/provider-ops`; `writeActions=[]`; `modelExplanation.enabled=false`;
- existing #518 System Health runtime and tests unchanged.

Traveller-context intelligence does not apply: operator Admin home, no traveller credentials.

---

## 2. Git evidence (at this persist)

| Item | Value |
| --- | --- |
| Task / PR baseline | `main@fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee` |
| Task seed | `94843032d28cb94056224f2ed275b45c8e7874d4` |
| Live `origin/main` at handoff re-read | `fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee` |
| Merge-base | `fb4c9ece0a139e2ceebc85dcba35effd0bb5ceee` |
| Ahead / behind vs live main before this persist | **2 ahead / 0 behind** (seed + implementation). This persist adds the wrap/evidence/docs commit. |
| Rebase | **not done** |
| Sibling integration | **not done** |

Exact freeze SHA is the commit that records this STATUS plus evidence. It is reported in the PR comment after push.

---

## 3. Owned files

Allowed runtime set only:

- `lib/admin/analyst/model-usage-typen.ts`
- `lib/admin/analyst/model-usage-insights.ts` + `.test.ts`
- `lib/admin/analyst/model-usage-laden.ts` + `.test.ts`
- `lib/admin/analyst/model-usage-render.test.ts`
- `components/admin/home/AdminModellnutzungHinweis.tsx`
- `app/(admin)/admin/page.tsx` — additive composition only
- `lib/admin/ehrliche-zustaende.ts` + additive `.test.ts`
- this STATUS / HANDOFF / SELF_REVIEW / TASK
- `docs/evidence/intelligent-admin-model-usage-attention-1/`

Not written: existing System Health/analyst source files and tests, provider-ops-board collector/runtime/bewertung, auth/roles/guard, API routes, middleware, database/schema/migrations, package/lockfiles, global startup/status/build-order/governance, Homepage/Trip/Account/Guest files, Grok bots/routines.

---

## 4. Verification (local, before freeze)

| Check | Result |
| --- | --- |
| Model-usage permission/truth/time/privacy/render tests | **pass** (`model-usage-*.test.ts` + additive honest-copy) |
| Existing #518 analyst/loader/render + ehrliche-zustaende | **pass** |
| Admin-access / AAL wiring / provider-ops-board regressions | **pass** |
| `npx tsc -p tsconfig.json --noEmit` | **pass** |
| ESLint on owned files | **pass** |
| `check:exports` / `check:api-schutz` / `check:dead` | **pass** (12 Admin routes, no new API; 0 unused exports; 0 orphan modules) |
| Synthetic render | available / empty / unavailable / unknown / stale / denied / break-glass at 320 / 390 / 1280; 200% text on empty/unavailable/stale; focus shot on investigate link |
| Overflow measurements | all recorded cases/viewports `overflowing: false`, `cardsBeyondShell: 0` |
| CSS | `styles/globals.css` compiled, 105145 bytes |
| Authenticated Preview click-through | **BLOCKED_ACCESS** — no login/secret/bypass |

Local `npm run build` **passed** (Next.js 16.3.3 /admin remains dynamic). Exact-head GitHub CI / Auth / Vercel IDs belong in the PR freeze comment after this persist.

---

## 5. Limits

- Synthetic HTML/Playwright screenshots use compiled product CSS. They prove component copy, status/freshness, hop, denial and break-glass isolation — not an authenticated `/admin` Preview session.
- No real-device pass. No blanket accessibility claim.
- Process-wide ProviderOpsBoard cache remains shared across allowed role callers. That is accepted and labelled `process-recent`, not isolated.
- The bounded read remains rolling 30 days / max 200 rows. This slice does not display costs, row counts or newest usage timestamps.
- Existing authorized Admin credentials were not available. BLOCKED_ACCESS is honest, not a manufactured auth proof.

---

## 6. Stop

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE / AUTHORIZATION / SOURCE-TRUTH / VISUAL REVIEW.**

No Ready. No merge. No follow-up slice by Cursor. No new source, model, secret, paid call, Production activation or Grok routine.
