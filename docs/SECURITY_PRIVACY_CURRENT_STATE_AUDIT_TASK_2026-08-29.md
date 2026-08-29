# Security & Privacy Current-State Audit Task — 2026-08-29

## Objective

Perform a repository-first, evidence-based audit of Jetnity's current security and privacy posture without changing productive runtime behavior. The goal is to identify concrete risks, architectural gaps, stale assumptions and prioritized remediation tasks that can later be implemented in controlled slices.

## Binding principles

1. Live repository/configuration evidence wins over historical documentation.
2. Audit findings must distinguish confirmed defect, likely risk, documentation debt and unknown/not-verifiable.
3. No finding may be marked resolved merely because a document says so; verify code/config/tests where possible.
4. Do not weaken existing Auth, MFA/AAL, RLS, ownership, guest/account, provider trust or Commercial Provenance boundaries.
5. No secrets, credentials, production tokens, user data or sensitive payloads may be copied into audit artifacts.
6. Keep Product Owner gates intact for privacy/legal content, production activation, provider credentials and any paid/external service.

## Required audit scope

- Auth/session architecture, MFA/TOTP, AAL handling, email confirmation and OAuth boundaries.
- Authorization and ownership checks across API routes, server actions, RPCs and database access paths.
- Supabase RLS intent as represented in migrations/schema/tests; identify authenticated exposure and SECURITY DEFINER risks.
- Service-role/admin privilege usage and whether normal product paths can accidentally bypass ownership.
- Guest → Account transition security and ownership transfer assumptions.
- Traveller/passport/document sensitivity boundaries and storage exposure risks.
- Provider/Commercial Truth trust boundaries, client-forgeability risks and server-only separation.
- Secret handling, environment-variable usage, logging/telemetry redaction and accidental client exposure.
- CSRF/CORS/origin assumptions where relevant, redirects/deeplinks and open-redirect risks.
- Input validation, body/response size limits, abuse/rate-limit surfaces and SSRF-style outbound request risks.
- File/upload/storage boundaries if present.
- Admin endpoints, admin RPCs and privilege escalation surfaces.
- Privacy/data-minimization concerns, retention/deletion/export gaps visible in the codebase.
- Legal runtime gaps that materially affect privacy/security posture, while keeping legal content decisions out of scope.
- Dependency/configuration/security-header posture where repository evidence supports conclusions.
- Existing security tests/guards and important missing test coverage.

## Explicit non-scope

- No productive code changes.
- No database/Supabase mutation.
- No Vercel/Production mutation.
- No secret rotation or credential access.
- No external penetration testing against production.
- No destructive security testing.
- No legal-policy drafting or approval.
- No provider activation, paid calls or Commercial Provenance minting.
- No Ready/Merge and no follow-up implementation slice.

## Required deliverables

Create/update only audit/continuity documentation on this branch:

1. `docs/SECURITY_PRIVACY_CURRENT_STATE_AUDIT_2026-08-29.md`
2. `docs/SECURITY_PRIVACY_CURRENT_STATE_AUDIT_STATUS_2026-08-29.md`
3. `docs/SECURITY_PRIVACY_CURRENT_STATE_AUDIT_HANDOFF_2026-08-29.md`
4. `docs/SECURITY_PRIVACY_CURRENT_STATE_AUDIT_SELF_REVIEW_2026-08-29.md`
5. A proposed prioritized remediation backlog with P0/P1/P2/P3 severity, affected files/contracts, verification evidence and safe slice boundaries.

## Quality bar

- Cite exact repository paths and, where useful, symbols/migrations/tests.
- Every P0/P1 finding must include concrete evidence and a plausible exploit/failure condition, not speculation.
- Explicitly call out unknowns and evidence gaps.
- Avoid architecture churn: recommend the smallest robust fix consistent with Jetnity standards.
- Identify findings that can safely run in parallel versus those that must wait for shared-contract ownership.
- Re-check `origin/main` before handoff and document baseline/main drift.

## STOP condition

After audit, self-review and documentation are complete, STOP for independent ChatGPT Technical-Lead review. Do not implement fixes, mark the PR Ready, merge it, or start a follow-up slice.