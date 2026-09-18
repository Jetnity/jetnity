# Jetnity – V1 Production Auth Verification 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #479  
Draft PR: #480  
Evidence head: `82c0f564865894ee4639a59f966db75cafb11878`

This document cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on Phase A

| Attack | Result |
| --- | --- |
| Call `authKonfigurationSetzen` / PATCH the Auth config | Rejected. Reader and helper contain no write path. |
| Call `projektSchluessel` and print keys | Rejected. |
| Dump raw `GET /config/auth` JSON | Rejected. Formatter uses an explicit key allowlist. |
| Print unknown / secret-like keys from a fixture | Rejected by tests. |
| Treat missing audit fields as empty/PASS | Rejected. Incomplete evidence throws. |
| Run against a branch or a different project ref | Rejected by `produktionLesenAuftrag` + `produktionsZiel`. |
| Replace or skip Development `auth:pruefen` | Rejected. Temporary step is additive and exact-branch-only. |
| Edit `docs/AUTH.md` / QS2 / global continuity | Rejected. |
| Create a test user or exercise live reset/register | Rejected. |
| Mark Ready or merge #480 | Rejected. |
| Start Phase B from this dispatch | Rejected. |

---

## 2. Residual risks / observations for the Technical Lead

- Production currently reports `site_url=http://localhost:3000` and an empty `uri_allow_list`. That is live 3.6 evidence. This slice must not change those values.
- HIBP is enabled. The four requested rate limits match the documented Development numbers. TOTP enroll/verify are enabled. `mfa_allow_low_aal` is false. Unverified-email sign-in is false.
- The exact-branch CI trigger is temporary by design and must be cleaned in Phase B.
- Persisting these docs creates a new head and invalidates exact-head CI/Preview on `82c0f564`.
- This agent did not perform a second independent Management-API GET outside CI.
- Traveller-context intelligence is not applicable: no traveller credential is collected or inferred.

---

## 3. Recommendation

Accept Phase A as read-only evidence if the job log on `82c0f564` / `105602766085` matches the snapshot recorded in the status file. Re-gate the persist head if FINAL PASS requires exact-head on the docs commit. Do not Ready or merge from this document. Do not rewrite Production-truth docs until Phase B is explicitly dispatched.
