# CH→DE Source-to-Workspace V2.1 — Self-review

## M1–M4 self-review — current scope

This is author self-review, not independent TL acceptance. Reviewed private ACLs, closed synthetic source admission, byte/key handling, immutable metadata, SQLSTATE rollback, existing closure reuse, transaction isolation, ACK uncertainty, quotas, absolute expiry and independent-witness restore refusal. The native proof exercises structural positives and refusal paths; real accepted-store/provider integration remains unproven. [Contract and limitations](OFFICIAL_TRUTH_CH_DE_SOURCE_TO_WORKSPACE_V2_1_M1_M4_CONTRACT_2026-10-11.md).

No existing foundation guard, timeout, test assertion, Auth/RLS boundary, Source Registry, real profile, dependency or provider is weakened. Two implementation errors found during local development (SQL reserved/special syntax and calling the existing historical reader under READ COMMITTED) were corrected before delivery. The existing reader remains REPEATABLE READ / READ ONLY; a separate guard transaction holds current lifecycle state. Calendar-relative synthetic rehashing preserves strict support ordering.

Remaining material risks: no managed production key/log/backup policy; local witness is not a durable independent production anchor; no legacy accepted-claim projection/refresh adapter; 128-KiB atomic source admission not established by the synthetic V1 fixture; no competent legal/privacy certification; unchanged 19 dependency findings including three production highs. No P0/P1-free or production-safe certification is claimed.

## G2 self-review — STOP for independent R2

The G2 SQL grant was applied as permission to investigate/implement an indispensable reader, not mistaken for hosted or retention approval. Inventory found four missing durable edges M1–M4 (CONTRACTS), activating G2's explicit missing-schema stop. No new reader RPC, grant, table or authority-returning success variant has been added. The extended native diagnostic reads catalog metadata only, in one read-only repeatable-read transaction; it does not infer semantics solely from field names or certify hosted state. Function/writer inspection establishes why transient fingerprint coordinates are not custody/history. Existing local provenance is not relabelled as the accepted store.

New diagnostic assertions intentionally require reassessment if a later schema supplies the missing contract; they never heal or approve absent provenance. Both user roles and service_role remain denied. No actual accepted record, current revocation, historical legal validity, cross-account positive read, transaction retry resolution or positive structural accepted read was demonstrated by this change. The existing unknown-path regressions and full native foundation suite remain meaningful within their own boundaries. All previously reserved gates remain closed; audit risk remains open. This is author review only, with the exact stopped decision in OWNER_PACKET.

## Initial author record — superseded for current G2 status

Author: **Jetnity Official Truth CH-DE Source-to-Workspace V2 1 — Codex Generation 1**. This is an author self-review, never TL FINAL PASS.

- Authority: no accepted DTO, registry/profile injection, transport callback, environment secret or local SQL diagnostic can produce a non-null provider. Getter/cycle/oversize and foreign fields refuse. Foundation consumer fence retained unchanged after removing a rejected import.
- Scope: exact canonical selected option checked; no first-passport fallback, nationality inference from residence/issuer or cross-traveller selection. Generic passport never asserted ordinary. Purpose/direct-route/date legal coverage remains gated.
- Storage: actual native16.15 role denial, unsupported writer read operation and zero promoted rows verified. Existing local provenance schema was not repurposed as regulatory authority. No new RPC/grants/migration or hosted operation.
- Integration: existing server/engine arrays match under unknown output; Preparation/Destination Essentials show no official result, source, timestamp or action. No frontend/API changes or runtime harness imports.
- Compatibility: no source limit, V1/V2 hash, registry, provider, Auth/RLS/AAL or global Trip/Rule contract changed. TASK blob unchanged; #913 untouched.
- Research: only official primary pages; full-response gaps, cached rendering, unknown legal validity and retention are explicit. No snippets/hashes/full responses committed.
- Testing: focused new tests and repaired regression set pass; final full serial native test and hygiene results are recorded in STATUS/evidence. Initial failures are documented, no assertions skipped or lowered.
- Security: npm audit is **not green**; unchanged dependency risks require G7. No packages changed or paid services enabled.
- Delivery: only existing branch/Draft928; final external receipt must bind actual commit/tree/check statuses. Any later code commit invalidates previous exact-head gates.

**Author conclusion: ready for independent review of a PARTIAL / GATED negative-path delivery, not approval of a working trusted accepted reader or real visa result.** G1–G7 are separate decisions. No Ready/merge request is made and no autonomous follow-up is authorized.
