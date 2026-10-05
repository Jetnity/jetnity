# Jetnity – Assistant Runtime 1 Task

Stand: 17. September 2026  
Status: **PRODUCT-OWNER APPROVED FOR PREVIEW/DEVELOPMENT / ACTIVE CODING TASK / NO PRODUCTION ACTIVATION**

GitHub issue: #434  
Product-Owner gate: #433  
Canonical base: `15aa125addf39b15dcb50a1cdf8dece661796fc5`  
Branch: `feat/phase-1-assistant-runtime-1`

Cursor-Agent: **Jetnity assistant runtime 1**  
Generation: **1**  
Required parent model: **Claude Opus 5 High**

Do not use Auto for this slice. If Claude Opus 5 High is unavailable, stop and report rather than silently substituting another parent model.

---

## Technical-Lead coding task

Status: **ACTIVE CODING CANDIDATE / PHASE 1 JETNITY CORE / SINGLE_AGENT / PO-APPROVED PREVIEW+DEVELOPMENT ONLY**

Product-Owner approval: #433.

Canonical base: `main@15aa125addf39b15dcb50a1cdf8dece661796fc5`

Cursor-Agent: **`Jetnity assistant runtime 1`**  
Generation: **1**  
Required parent model: **Claude Opus 5 High**  
Do not use Auto for this slice. If the selected parent model is unavailable, stop and report instead of silently changing the parent model.

## Goal

Build the first bounded real truth-aware in-trip Assistant runtime on top of the already accepted privacy-minimized `assistantTruthContextProjizieren()` foundation.

The Assistant may create **generated suggestion / advisory output only**. It must not become Official, Provider, Commercial, Account, Traveller or Trip truth.

## Binding live facts

- `main` exact base above is 0 ahead / 0 behind at dispatch.
- Assistant Truth Context 1 is closed and accepted.
- Production and develop currently accept only `model_usage.funktion in ('reisevorschlag','reiseaenderung')`.
- Product Owner has approved adding a third semantic value `reisebegleiter` on **develop only** for this slice.
- Existing OpenAI model architecture is server-only, fail-closed, cost-guarded, timeout-bounded.
- Preview/development model pathway is already authorized; Production activation remains closed.

## Required implementation

### 1. Additive model-usage contract
Create a new repository migration extending the existing `model_usage_funktion_werte` CHECK with `reisebegleiter`.

Requirements:
- additive only;
- preserve existing `reisevorschlag` and `reiseaenderung`;
- update the TypeScript `Modellfunktion` union;
- update deterministic DB-contract tests and model docs only where needed;
- no second cost bucket; Assistant shares the existing global/per-user limits unless the Technical Lead later authorizes otherwise;
- do not weaken RLS, grants, RPC security or cost reservations.

**Apply/verify on Supabase develop only. Do not apply to Production.**

### 2. Reuse the accepted Assistant truth allowlist
Use `lib/reisebegleiter/kontext.ts` as the source of Assistant context.

Do not bypass, broaden or duplicate the allowlist.

The model input must not include:
- passport/document numbers;
- MRZ;
- document scans/images;
- biometrics;
- health records;
- auth/session/account/email identifiers;
- provider raw payloads or secrets;
- booking URLs;
- price/availability/commercial ranking truth;
- Official `contextFingerprint`;
- Official source/action URLs unless a separately accepted contract already allows the exact safe representation.

Multi-Traveller, Multi-Citizenship and Multi-Document remain peer options. No default/primary/preferred credential inference.

### 3. Bounded Assistant runtime
Create a server-only Assistant execution path that:
- validates the user input;
- uses existing model-state / kill-switch logic;
- books cost through `kontingentBeanspruchen('reisebegleiter', ...)`;
- uses existing server-only OpenAI Responses API call infrastructure;
- records usage through the existing completion path;
- has deterministic schema validation;
- fails closed on malformed model output;
- never logs prompt, response, secret, traveller-sensitive context or full trip contents;
- performs no hidden retry loop;
- does not silently fall back into another semantic model function.

Reuse existing model routing/pricing infrastructure when safe. Do not create a new model provider.

### 4. Output contract
Assistant output is **generated suggestion**, not truth.

At minimum the schema/presentation must distinguish:
- a concise answer/explanation;
- uncertainty / missing evidence;
- suggested next steps;
- references to already-known Jetnity states only when they are present in the input context.

It must never:
- claim `unknown` / `unavailable` / `stale` / `recheck_needed` as certain or `not_required`;
- invent Official requirements;
- invent provider prices/availability;
- claim a booking exists unless trusted Jetnity truth says so;
- auto-apply a trip mutation;
- persist model output as Official/Provider/Commercial truth.

### 5. Minimal in-trip UI
Add one bounded Assistant surface inside the existing Trip Workspace / in-trip flow.

Requirements:
- no floating site-wide chatbot;
- no new equal-rank top-level domain;
- compact, accessible, mobile/desktop coherent;
- clear generated/advisory framing;
- loading/error/disabled states are honest;
- the Production-disabled state must degrade safely;
- no commercial/provider calls mounted merely because Assistant UI renders;
- no auto-run on page load.

### 6. Tests / adversarial regressions
Add focused tests for at least:
- third `Modellfunktion` contract;
- cost reservation still happens before any model call;
- blocked/disabled model state performs zero call;
- Assistant context comes only from accepted projection;
- sensitive excluded fields cannot reach model input;
- unknown/unavailable/stale semantics are preserved;
- malformed/refused/incomplete/schema-invalid model outputs fail closed;
- no automatic trip mutation/persistence;
- no model call on simple UI mount;
- no provider/commercial call introduced;
- Production remains disabled by configuration contract;
- existing Reisevorschlag/Reiseänderung usage still passes unchanged.

### 7. Develop-only DB application/evidence
After the migration exists and local/repository tests pass:
- apply the migration to Supabase **develop** only;
- verify live CHECK constraint includes exactly `reisevorschlag`, `reiseaenderung`, `reisebegleiter`;
- verify RLS/grants/policies relevant to `model_usage` remain equivalent;
- run relevant Supabase security advisor checks and document findings;
- **do not apply to Production**.

### 8. Paid Preview/development evidence
Product Owner authorizes bounded paid Assistant calls in Preview/development under existing spend controls.

Requirements:
- only after cost/kill-switch/schema gates are proven;
- keep evidence bounded/minimal;
- no Production call;
- do not increase monthly infrastructure/service commitment above existing approved ceiling;
- record only safe operational evidence, never prompt/output secrets or sensitive trip data.

## Multi-Agent Suitability

**Decision: SINGLE_AGENT**

Reason: the usage-contract migration, model cost gate, truth-context wiring, output schema, server action and minimal UI share central contracts. Parallel writers would increase risk of cost bypass, truth divergence and migration collision.

## Hard non-scope

Do NOT:
- apply any migration to Production;
- enable `JETNITY_MODELL_AKTIV` in Production;
- add Production OpenAI secrets;
- perform Production paid model calls;
- change provider contracts/secrets/live calls;
- allocate Commercial Provenance writer authority;
- change Auth/MFA/AAL/session architecture;
- change Traveller/Citizenship/Document persistence contracts;
- persist sensitive passport/MRZ/scan/biometric/health data;
- auto-apply trip changes;
- add World Map, Destination Essentials, PWA, notifications or homepage scope;
- change public indexing/domain cutover;
- start another slice.

## Required validation on final exact head

Provide:
- exact base SHA;
- exact final head SHA;
- merge-base / ahead / behind;
- complete changed-file list;
- targeted Assistant tests;
- existing model-cost/DB-contract tests;
- relevant truth-context tests;
- full test suite if feasible;
- TypeScript;
- lint;
- Production build;
- GitHub Actions on exact head;
- Vercel Preview on exact head;
- develop Supabase migration + live constraint/RLS/grant verification;
- bounded paid Preview/development Assistant-call evidence;
- mobile + desktop acceptance evidence;
- console/runtime error check;
- scope/non-scope proof;
- adversarial self-review;
- Cursor session evidence if available.

## Agent governance

- **Do not mark Ready.**
- **Do not merge.**
- **Do not start a follow-up slice.**
- **Do not use GitHub Copilot as a substitute coding agent.**
- Re-fetch `origin/main` before final handoff and report drift.
- Every changed head invalidates earlier exact-head gates.
- Agent self-review is not Technical-Lead PASS.
- If a Product-Owner gate not explicitly approved above is encountered, stop.
- Final state: **STOP FOR TECHNICAL-LEAD REVIEW**.


## Technical-Lead dispatch rule

This task is versioned before material implementation. The Cursor agent must treat the GitHub issue and this file as the binding scope. Live evidence wins over stale text if repository state changes after dispatch.

The agent must not interpret the Product-Owner approval as authorization for:
- Production migration;
- Production model activation;
- Production paid calls;
- provider activation;
- public launch;
- any follow-up slice.

Before final handoff, create/update the usual repository evidence for STATUS, HANDOFF and SELF_REVIEW for this exact slice and exact final head.
