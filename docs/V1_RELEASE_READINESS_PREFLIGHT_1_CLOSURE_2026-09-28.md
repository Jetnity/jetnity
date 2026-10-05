# Jetnity – V1 Release Readiness Preflight 1 – Technical-Lead Closure

Stand: 28. September 2026  
Status: **MERGED / POST-MERGE VERIFIED / NO LAUNCH VERDICT / WAITING FOR EXTERNAL RESPONSES**

## 1. Accepted preflight

Issue #602: **CLOSED / completed**  
PR #603: **MERGED**

Accepted exact head:

`5c2f0ef25c90ccdbda5bef06ff38db7a38420fcc`

Technical-Lead FINAL PASS review:

`5343161510`

Merge:

`d961a5402fc363a481918f1a5830aff22dcc878e`

The preflight remains a **readiness map**, not the final V1 Release Readiness Gate and not a public-launch approval.

## 2. Exact-head and post-merge gates

Accepted head:
- GitHub Actions `36466410801`: **SUCCESS**
- Vercel Preview `dpl_Fd6xxmKdbUtQPi2F3aYMFN8MS7N8`: **READY**
- GitHub unresolved review threads: **0**
- Vercel unresolved toolbar threads: **0**

Post-merge:
- GitHub Actions `36467497747`: **SUCCESS**
- Vercel Production `dpl_HjBdggZpQx79CvPjdrTeigxtJf3M`: **READY**
- deployment Git SHA: `d961a5402fc363a481918f1a5830aff22dcc878e`
- alias includes `jetnity.com`

No runtime, database, provider, payment, indexing or launch mutation was introduced by this docs/evidence merge.

## 3. Independent Technical-Lead Production readback

The agent correctly disclosed that its own Supabase Management read path failed. During independent Technical-Lead review, Production `qscbgcdmivbbnzrcyegn` was re-read directly.

Confirmed:
- migration history contains `20260927230000_reise_graph_kaskade_tiefe`;
- Edge Function `account-delete-v1`: **ACTIVE v1**;
- `verify_jwt=true`;
- bundle SHA256 `b338776f80c35d70393deb31b1843a190b153244f8ed246720f0b5802f96a3cc`.

Current Supabase Security Advisor readback returned **WARN**, not ERROR/P0, for:
1. GraphQL schema visibility of public reference/user/admin tables;
2. authenticated-callable SECURITY DEFINER functions.

Independent catalog review confirmed:
- RLS is enabled on all advisor-flagged tables;
- user-owned traveller/trip/profile data remains constrained by `auth.uid()` or reviewed ownership/capability rules;
- admin/ops tables remain protected by `darf_betrieb_lesen()` / `darf_betrieb_eingreifen()`;
- public `airports` and `places` are intentionally readable reference data;
- account-visit SECURITY DEFINER RPCs derive the actor from `auth.uid()`;
- admin aggregate SECURITY DEFINER RPCs gate through `darf_betrieb_lesen()`, which requires moderator-or-higher plus current AAL2.

This evidence does **not** convert Security Gate B to PASS. Finding 5.2 / persistent security-event ingestion remains open and the current advisor warnings remain subject to final security-gate review.

## 4. Accepted current V1 posture

The accepted preflight does not identify a justified ungated V1-critical implementation slice while the current external dependencies are unresolved.

Current external waits:
- **KAYAK** — inquiry sent / waiting for response (#395);
- **Sherpa** — Travel Requirements API / Sandbox inquiry sent / waiting for response (#294);
- **IATA Timatic** — business enquiry sent / waiting for response (#294).

No provider or Official Truth source is selected.

Still not authorized automatically:
- signup/account creation;
- additional Terms/DPA/commercial-contract acceptance;
- API credentials or secret use;
- Sandbox/live calls;
- fees/spend;
- runtime adapters;
- Production provider activation;
- public indexing/launch.

## 5. Other current residuals

The following remain separate from the external-response wait:
- finding 5.2 / persistent security-event ingestion;
- retention decision/enforcement;
- Terms/privacy consent-version persistence;
- future provider DPAs/licensing/caching/attribution review;
- alerting/operational detection;
- final backup/recovery evidence;
- real provider / Official Truth E2E;
- whole-journey device/browser/performance/accessibility release proof;
- final V1 Release Readiness Gate A–O;
- explicit Product-Owner public-launch approval.

#585 PrivacyBee wording remains deferred by Product-Owner decision and is not a current engineering task. It must be re-reviewed at the later legal-signoff/readiness point.

## 6. Exact next action

**WAIT FOR THE FIRST MATERIAL EXTERNAL RESPONSE FROM KAYAK, SHERPA OR IATA TIMATIC.**

When a response arrives:
1. Technical Lead reviews the complete reply and every linked term first;
2. no signup, acceptance, credential use, API call, spend or implementation follows automatically;
3. any provider/source choice or contractual commitment remains a Product-Owner gate;
4. only after that review may a bounded integration/evaluation slice be proposed.

If no external response has arrived, do **not** manufacture another provider-independent V1-critical implementation slice merely to keep Cursor busy.

## 7. Writer state

Cursor agent:
- **Jetnity V1 release readiness preflight 1**
- Generation 1
- session `bc-d56c0f51-0d18-46bb-b614-5839a109a18a`
- model `grok-4.7-high-fast`
- state: **COMPLETED / NOT ACTIVE / DO NOT RESTART**

No current Cursor/runtime writer is authorized by this closure.

Live evidence always wins over this dated closure.
