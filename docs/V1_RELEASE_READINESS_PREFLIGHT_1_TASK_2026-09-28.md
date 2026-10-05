# Jetnity – V1 Release Readiness Preflight 1 – TASK v1

Stand: 28. September 2026  
Issue: #602  
Branch: `audit/v1-release-readiness-preflight-1`  
Canonical dispatch baseline: `main@532e1cf2a0793bc717991ed7e3d23bf896635c42`

## 1. Purpose

Perform a fresh, read-only, evidence-backed preflight against the binding V1 Release Readiness Gate.

This is deliberately **not** the final Release Readiness Gate and must not produce a public-launch verdict. Its job is to tell the Technical Lead exactly what remains after the latest closures, while Sherpa, IATA Timatic and KAYAK external responses are pending.

Live evidence wins over historical docs.

## 2. Required reading

Read completely before classifying:

1. `JETNITY_START_HERE.md`
2. `.jetnity/operating-mode.json`
3. `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
4. `docs/JETNITY_V1_DEFINITION_OF_DONE_2026-09-01.md`
5. `docs/JETNITY_V1_RELEASE_READINESS_GATE_2026-09-01.md`
6. `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`
7. `docs/JETNITY_REMAINING_BUILD_MAP_1_REPORT_2026-09-22.md`
8. `docs/CHATGPT_NEW_CHAT_CHECKPOINT_2026-09-28.md`
9. `docs/ACTIVE_WORK_STATUS.md`
10. latest relevant legal/Auth/account/provider/Official-Truth closure evidence on current main.

Then re-fetch live GitHub current main, open PRs/issues, current Actions and Vercel state. Read-only Supabase evidence is allowed only where genuinely needed to classify Production configuration, and must avoid personal data.

## 3. Current facts to independently verify, not blindly inherit

At dispatch the Technical Lead observed:

- main `532e1cf2a0793bc717991ed7e3d23bf896635c42`;
- machine mode `NORMAL`;
- no active Cursor/runtime writer;
- Terms CH-DE 1.0 live and #587 closed;
- Production account erasure E2E closed;
- PrivacyBee #585 deferred by Product Owner, not a current engineering task;
- KAYAK inquiry sent / waiting;
- Sherpa Official Entry inquiry sent / waiting;
- IATA Timatic business inquiry sent / waiting;
- public indexing remains disabled;
- old open Draft PRs #52/#50/#40/#39/#28 are historical, not active writers.

Re-fetch every mutable fact before using it.

## 4. Gate method

For every Release Readiness section A through O, assign exactly one current preflight state:

- `PASS_CANDIDATE` — current evidence appears sufficient for this preflight, but this is not the final launch PASS;
- `PARTIAL` — meaningful parts are closed, named residuals remain;
- `BLOCKED` — a required external dependency, Product-Owner reserved gate or uncompleted V1 dependency prevents closure;
- `UNKNOWN` — insufficient current evidence; do not infer PASS.

For each section record:

1. current state;
2. exact live/repository evidence;
3. what is already closed and must not be rebuilt;
4. exact residual;
5. whether residual is:
   - `UNGATED_TECHNICAL`
   - `EXTERNAL_RESPONSE`
   - `PRODUCT_OWNER_GATE`
   - `FINAL_RELEASE_PROOF`
   - `LATER_NOT_V1_CRITICAL`;
6. smallest responsible next action;
7. P0/P1/P2/P3 severity with reasoning.

## 5. Mandatory cross-checks

Explicitly reconcile at minimum:

- A Product DoD vs still-missing real commercial and Official Truth paths;
- B Security including current RLS/Auth/MFA/AAL, security-event ingestion residual, advisories, secrets and abuse/cost controls;
- C Privacy/Legal including live Privacy/Imprint/Terms, PrivacyBee residual status, account export/erasure, retention and sensitive-data boundaries;
- D Provider/Commercial/Licensing including current KAYAK waiting state and missing real Flight/Hotel/Activity activation;
- E Entry Requirements / Official Truth including current Sherpa + IATA waiting states and no invented hard truth;
- F Production Configuration including exact Vercel/Supabase/redirect/domain/indexing truth;
- G Monitoring/Logging/Alerting including whether finding 5.2 / persistent security-event ingestion is still open on current main;
- H Backup/Recovery/Incident including existing runbooks and any unverified operational proof;
- I Analytics/Conversion/Revenue including current Admin/account-count and attribution foundations versus real provider revenue absence;
- J Performance/Accessibility and K Mobile/Browser/PWA using existing audits without rerunning closed slices;
- L E2E/Failure/Concurrency and which cases are impossible until real providers/Official Truth exist;
- M Support/Operations;
- N release sequence / launch control;
- O final blocker rules.

Do not elevate a historical P0/P1 if its underlying gap has since been closed. Do not downgrade a real blocker merely because a document exists.

## 6. Duplicate / integration rule

Audit first. Reuse before add. Integrate before duplicate.

Before naming any new slice:
- prove no merged closure already owns it;
- prove it is V1-relevant now;
- prove it does not require a reserved PO/external gate;
- prove the smallest bounded action.

If no ungated implementation slice is justified, say so. A read-only evidence/preflight or waiting state is preferable to speculative code.

## 7. Outputs

Create only:

- `docs/V1_RELEASE_READINESS_PREFLIGHT_1_REPORT_2026-09-28.md`
- `docs/V1_RELEASE_READINESS_PREFLIGHT_1_STATUS_2026-09-28.md`
- `docs/V1_RELEASE_READINESS_PREFLIGHT_1_HANDOFF_2026-09-28.md`
- `docs/V1_RELEASE_READINESS_PREFLIGHT_1_SELF_REVIEW_2026-09-28.md`
- optional bounded evidence files under `docs/evidence/v1-release-readiness-preflight-1/`

Do not edit global continuity files, binding standards, runtime code, package scripts, migrations or configuration.

## 8. Hard boundaries

- docs/evidence only;
- no app/components/lib/hooks/styles/runtime changes;
- no Supabase write, DDL, migration or function deploy;
- no Production mutation;
- no provider contact, signup, Terms/DPA acceptance, credentials, API calls or spend;
- no payment/money movement;
- no public indexing/domain/launch change;
- no new recurring cost;
- no secrets, raw tokens or personal data in evidence;
- no Ready or merge by Cursor;
- no follow-up slice.

## 9. Agent contract

Logical agent: **Jetnity V1 release readiness preflight 1**  
Generation: **1**  
Required model: **Grok 4.7 High Fast**  
Do not use Auto. If the required model is unavailable, STOP and report rather than substitute.

When complete: STOP for independent Technical-Lead exact-head review.
