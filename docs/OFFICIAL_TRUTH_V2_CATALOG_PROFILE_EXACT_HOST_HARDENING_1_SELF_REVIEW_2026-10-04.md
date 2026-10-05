# Official Truth v2 Catalog Profile + Exact-Host Hardening 1 — Self-review

Issue #834 / Draft PR #835. Writer Generation 1. **Writer self-review only; not a Technical-Lead PASS.**

## Findings addressed

- A narrow exact-host resolver preserves the general source contract and reuses its existing parsing and blocked-domain checks. Content graph construction and resolution both use it, including an independently checked forged-graph negative case. Parent plus explicit child registration resolves correctly.
- SQL changes the positive host match to equality while retaining descendant-aware blocking and existing canonical HTTPS validation. The shared eligibility function therefore also rejects previously accepted synthetic descendant-host Evidence/Rule support; existing exact-host support remains valid.
- Inert profile pins cannot supply executable trust. The code registry and verifier implementation remain byte-unchanged. Both the typed helper and raw RPC require their respective current tuples; code-profile absence still rejects before a write even though the database seed exists.
- The catalog pin check precedes replay and every insertion. A multi-representation negative case and full table snapshots prove rollback without partial rows. Exact replay stays idempotent and changed replay stays a conflict.
- FK validation is immediate for all existing representation tuples; deferred current-representation validation covers new rows. An incompatible pre-existing unknown tuple makes the entire upgrade roll back. This intentionally fails closed rather than repairing identity.
- Pin grammar, positive version, composite uniqueness, one-current index, RLS, FORCE RLS, zero policies, all direct role privileges and immutable update/delete/truncate are tested against real disposable PostgreSQL. Only the existing service-role catalog RPC is granted; private helper ACLs remain closed.
- S1-like existing GOV.UK rows and every public `read_registry` field survive the migration unchanged. No hosted state was read or written.
- Review of the full suite uncovered older synthetic catalog mocks that overwrote explicit source domains from the shared R2 fixture. Those overrides were removed, and request/final fixture hosts are now explicitly enumerated. No production source, general resolver assertion or adversarial fixture was relaxed.

## Verification and scope

Final full suite: **5,246 pass / 0 fail / 0 skip**. Typecheck, lint, hygiene checks, operating-mode check and isolated production build pass; see REPORT for exact environment and disclosed earlier failures. Missing hosted credentials are never reported as a passed hosted check. Local SQL fixtures create synthetic Evidence/Rule rows solely to test eligibility; no Evidence/Rule feature or persistent registration was added.

Only two allowed runtime files changed. One CLI-generated migration and ten relevant source/catalog/content-identity test files changed, plus REPORT/HANDOFF/SELF_REVIEW. The immutable task and intentionally unapplied migration remain byte-identical. No #833 file overlaps. No source-catalog transport, verifier semantics, Auth/AAL/role policy, Workspace, dependency or central governance change.

## Residual limits

- Local SQL proof cannot certify hosted contents or operational apply readiness. Independently inspect the exact head; a later approved apply must separately verify real tuples and lock impact.
- Pins are deliberately immutable and have no runtime mutator. Future activation/retirement needs a reviewed migration/transition, outside this slice.
- No Ready, merge, hosted apply, Production action or follow-up was performed. #791 stays **NO_SOURCE_FAMILY_PROVEN_YET**.

No remaining defect was identified within this bounded implementation during writer self-review. This observation does not replace independent review or grant acceptance.
