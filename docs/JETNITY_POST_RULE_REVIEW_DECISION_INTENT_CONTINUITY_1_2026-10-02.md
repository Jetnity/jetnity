# Jetnity — Post Rule Review Decision Intent Continuity 1

Date: 2 October 2026
Issue: #735
Baseline: `main@1bdc0db95b4ba2a3fb3e473a90ab60a154a8a87b`
Status: **TECHNICAL-LEAD CONTINUITY / DOCS ONLY / NO ACTIVE WRITER AT BASELINE / LIVE EVIDENCE WINS**

## 1. Current exact baseline

- Repository: `Jetnity/jetnity`.
- Current main at this continuity seed: `1bdc0db95b4ba2a3fb3e473a90ab60a154a8a87b`.
- Merge: #734 — Official Truth Rule Review Decision Intent Contract 1.
- Accepted exact head: `490e710c292a6c54871ebacd175121207eaa06c1`.
- Technical-Lead FINAL PASS review: `5392926174`.
- Issue #733: CLOSED / COMPLETED.
- Post-merge CI `37019452146`: SUCCESS.
- Post-merge Typecheck, Lint & Build `110878456500`: SUCCESS.
- Post-merge Auth-Konfiguration `110878456735`: SUCCESS.
- Exact-main Vercel Production: `dpl_5tCXEHdejQw45juz6mK5mofyNH2c` — READY.
- Production alias includes `jetnity.com`.
- `aliasError=null`.
- No current Cursor writer is intentionally started by this continuity slice.

## 2. Integrated #734 truth

`officialTruthRegelReviewEntscheidungsabsicht` is now on main.

It:
- re-proves the #723 Rule Review Packet and #726 fingerprint from original packet input;
- requires the caller's displayed `reviewPacketKey` to equal the freshly recomputed key;
- accepts only `needs_more_evidence`, `reject_candidate`, or `proceed_to_trusted_fact_entry`;
- derives `ruleScopeKey` and `factKind` from the re-proven packet;
- returns only a pure decision intent.

It does not:
- create `trustedRuleFact`;
- call `regelKandidatAkzeptieren`;
- create accepted lifecycle/state;
- persist a decision;
- authorize a later request;
- add endpoint/Auth/AAL/role/capability/RLS logic;
- add DB/Supabase/migration/store/audit persistence;
- call provider/model/network APIs;
- create secret/cost/Production/indexing/launch authority.

`requirementsProviderAus()` remains `null`.

## 3. Pre-existing consistency residual

Live #717/#723 reject `composed_from_multiple_primary_sources` when the supports share one `sourceId`, returning `same_source_composition` before a Rule Review Packet exists.

The accepted #731 architecture later states that a same-source composed packet can remain review material and that the decision contract may allow `needs_more_evidence` / `reject_candidate` while refusing `proceed_to_trusted_fact_entry`.

Those statements are inconsistent.

#734 did not create this inconsistency and correctly stayed inside its task. The residual must be resolved before a later authenticated review endpoint relies on that case.

The smallest next ungated candidate is a **fresh-prechecked architecture/runtime consistency reconciliation** that decides, from the existing accepted contracts, whether:
1. #731 wording should be corrected to the existing #717/#723 fail-closed behavior; or
2. the earlier candidate/packet behavior should be deliberately changed.

Do not assume option 2. Do not widen runtime merely to match later prose. Prefer preserving the older fail-closed semantics unless the fresh precheck proves a product/truth reason to change them.

## 4. Gates unchanged

- Machine mode remains `NORMAL`.
- #626 remains OPEN / BLOCKED. Do not route around its privileged-role restriction.
- IATA Timatic and Sherpa remain not selected now; first-party Official Truth remains the approved V1 path.
- KAYAK remains waiting for response unless newer live evidence says otherwise.
- No real provider is selected or activated.
- Production/destructive DB/Auth/RLS/identity/security changes remain special Product-Owner gates.
- Selecting or remapping an Official-Truth acceptance capability remains a Product-Owner authority gate.
- Persistent reviewer audit/retention remains a separate Product-Owner/security gate.
- Provider secrets/terms/paid/live calls, payments, public indexing/launch and sensitive passport/MRZ/scan/biometric/health persistence remain gated.
- Budget ceiling remains max USD 100/month; warn before material cost.

## 5. Next Technical-Lead action

1. Reconstruct live main/open PRs/issues before acting.
2. Run a fresh Binding Slice Precheck.
3. If no newer work supersedes this state, reconcile the same-source-composition contract inconsistency in the smallest responsible bounded slice.
4. Do not auto-start an authenticated review endpoint or capability selection until the inconsistency is resolved and the reserved authority boundary is re-evaluated.

Live evidence always wins over this document.
