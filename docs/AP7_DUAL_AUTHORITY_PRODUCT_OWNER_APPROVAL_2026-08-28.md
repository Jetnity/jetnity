# Jetnity – AP-7 Dual-Authority Product-Owner Approval

Stand: 28. August 2026  
Status: **PRODUCT-OWNER APPROVED ARCHITECTURE / IMPLEMENTATION MAY PROCEED IN SCOPED SLICES / PRODUCTION IDENTITY-RLS-MIGRATION REMAINS SEPARATELY GATED**

## Binding Product-Owner decision

After AP-7 Gate 0 / PR #144 was independently reviewed and merged, the Product Owner explicitly approved the recommended architecture:

> **„Ja, Dual-Authority freigegeben“**

This is the binding architecture decision for AP-7.

## Approved architecture

Jetnity shall use **Dual-Authority** for reusable traveller identity:

1. **Account-owned Traveller Registry** for reusable current traveller identity/facts.
2. **Trip-owned Traveller Snapshot** remains the only Current Truth for a concrete trip.
3. Account-registry edits never silently rewrite existing trip snapshots.
4. No global/default passport or citizenship is invented.
5. Multiple citizenships and multiple documents remain first-class.
6. Any later explicit credential choice must be trip-/route-/destination-/transit-/evaluation-context scoped and evidence-bound, not a global traveller default.
7. Guest → Account trip transfer remains trip-scoped; registry import is a separate explicit opt-in.
8. Core registry remains data-minimised. Passport/document numbers, scans, MRZ, biometrics, health data and equivalent high-sensitivity payloads are not part of the default core model.
9. Collaboration may expose trip snapshots according to future trip permissions, but must not silently expose another user's private account registry.
10. Web and future native clients use the same shared product truth.

Gate-0 architecture evidence: ADR-0186 and `docs/AP7_GATE0_ACCOUNT_TRAVELLER_REGISTRY_ARCHITECTURE_STATUS_2026-08-28.md`.

## What this approval authorizes

The Technical Lead may continue AP-7 in small independently reviewed implementation slices that preserve the approved architecture, including shared domain contracts, pure validation/projection logic, tests and other non-destructive groundwork.

## What remains separately Product-Owner-gated

This approval does **not** itself authorize:

- applying a Production migration;
- changing Production RLS/ownership/GRANT/REVOKE/SECURITY DEFINER semantics;
- destructive or irreversible data migration/backfill;
- storing passport/document numbers, scans, MRZ, biometrics or equivalent sensitive payloads;
- changing fundamental Auth/Session/MFA/AAL behaviour;
- silently importing guest travellers into the account registry;
- changing trip snapshots into live references;
- provider-live/paid activation, payments, public launch or other existing special gates.

Before any such action the Technical Lead must present the exact proposed change, risks and recommendation to the Product Owner and obtain the required approval.

## Continuity

This decision supersedes the earlier Gate-0 state where Dual-Authority was only a recommendation awaiting Product-Owner choice. Live evidence still wins for implementation state, but the architecture choice itself is now approved unless the Product Owner explicitly changes it later.
