# Jetnity – V1 Admin Security KPI Taxonomy Alignment 1 STATUS

Stand: 21. September 2026  
Status: **IMPLEMENTATION ON DISPATCH BRANCH / DRAFT / NOT READY / NOT MERGED / STOP FOR TECHNICAL-LEAD REVIEW**

Issue: #503  
Draft PR: #504  
Branch: `fix/v1-admin-security-kpi-taxonomy-alignment-1`  
Binding task: `docs/V1_ADMIN_SECURITY_KPI_TAXONOMY_ALIGNMENT_1_TASK_2026-09-21.md`  
Canonical base: `main@d1949e23b3dda30b7482265822e7e1279f244228`  
Dispatch head: `df5c2a1861139432c5286fe11da7eb2feed3cc03`

Cursor-Agent: **Jetnity V1 admin security kpi taxonomy alignment 1**, Generation 1  
Required parent model: **Cursor Grok 4.6 High Fast** — confirmed (`originalModelName=cursor-grok-4.6-high-fast`)  
Session: `bc-1ef7e31e-c82e-4545-b5ac-67117b3730a7`

This file is point-in-time evidence. Every new head invalidates older exact-head gates. Agent self-review is not Technical-Lead PASS. Final gate IDs belong in the PR comment on the frozen head, not in a later evidence-only commit.

Runtime event ingestion remains **OPEN**. This slice does not claim Finding 5.2 closed.

---

## 1. Goal

Close RH-10.1 and RH-10.2: Admin Security UI and aggregator classify login failures and anomalies with one canonical presentation predicate.

Do not invent a producer. Do not claim ingestion completeness. Historical types stay readable.

## 2. Implemented

Shared helper `lib/admin/security-event-taxonomy.ts`:

- `istAufgezeichneterLoginFehler` — exact `auth_failed` | `login_failed`
- `istAufgezeichneteAuffaelligkeit` — `anomaly*` | exact `bot` | `suspicious` | `ddos`

Consumers:

- `components/admin/security/SecurityWidget.tsx` 24h KPIs `failed` / `suspicious` now call the helper. Variable names kept so coverage-truth source contracts still match.
- `lib/admin/kennzahlen.ts` `fasseSicherheitslageZusammen()` now calls the same helper. `/api/admin/security/summary` inherits the alignment.

Preserved:

- honest incomplete-ingestion copy in `ADMIN_EHRLICHE_TEXTE`
- `data === null` → KPI `null` / em dash
- 24h KPIs still from unfiltered `aufgezeichneteEvents = data?.events`
- search still filters only the table
- IP blocklist remains not enforced
- no schema / migration / RLS / writer / producer

Focused tests: `lib/admin/security-event-taxonomy.test.ts` plus the historical-type case in `lib/admin/kennzahlen.test.ts`.

## 3. Changed files versus canonical `main@d1949e23`

Expected after the implementation commit:

- `components/admin/security/SecurityWidget.tsx`
- `lib/admin/kennzahlen.ts`
- `lib/admin/kennzahlen.test.ts`
- `lib/admin/security-event-taxonomy.ts`
- `lib/admin/security-event-taxonomy.test.ts`
- `docs/ACTIVE_WORK_STATUS.md`
- `docs/V1_ADMIN_SECURITY_KPI_TAXONOMY_ALIGNMENT_1_TASK_2026-09-21.md` (dispatch head)
- `docs/V1_ADMIN_SECURITY_KPI_TAXONOMY_ALIGNMENT_1_DECISION_2026-09-21.md`
- `docs/V1_ADMIN_SECURITY_KPI_TAXONOMY_ALIGNMENT_1_STATUS_2026-09-21.md`
- `docs/V1_ADMIN_SECURITY_KPI_TAXONOMY_ALIGNMENT_1_HANDOFF_2026-09-21.md`
- `docs/V1_ADMIN_SECURITY_KPI_TAXONOMY_ALIGNMENT_1_SELF_REVIEW_2026-09-21.md`

Not touched: `package.json`, `supabase/`, `#494` harness, `#497` reconciliation docs, sibling P2-fix ownership, producer/writer files.

## 4. Traveller-context check

Not relevant. Admin operational recorded-event presentation only. No traveller credentials collected or inferred.

## 5. Hard exclusions held

- no Supabase migration / RLS / Auth config / Production mutation
- no provider / secret / paid action
- no product redesign
- no blocklist enforcement
- no Ready / merge / follow-up

## 6. Local and exact-head gates

Not claimed in this file at persist time. Run focused + required repository gates, then freeze the head. Put final IDs in the PR #504 comment on that exact SHA.

## 7. Residual risks

- Finding 5.2 ingestion remains OPEN. Zero recorded matching rows is not proof of zero real events.
- Widget KPI window is 24h; summary aggregator window is 7 days. Taxonomy now matches; windows still differ.
- `startsWith('anomaly')` remains the inherited prefix contract.
- `/admin/security` is auth-gated; this environment has no admin session for a logged-in Preview click.
- IP blocklist remains not enforced.

## 8. Next step

After local + exact-head CI/Auth/Vercel are on the frozen head: **STOP FOR TECHNICAL-LEAD REVIEW**. Do not Ready. Do not merge. Do not start a follow-up slice.
