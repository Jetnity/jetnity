# Jetnity – P2-TA-03 Draft-PR #117 Description

Stand: 28. August 2026  
Zweck: **kanonischer PR-Body-Text für Finding 3 des Technical-Lead-Reviews `5046697270`**

`ManagePullRequest` lehnt ein Body-Update ab, weil die aktuelle Beschreibung nicht agent-managed ist. `gh pr edit` liefert `Resource not accessible by integration`. Der untenstehende Text ist der geforderte, aktuelle Docs-only-Scope. Technical Lead kann ihn 1:1 in PR #117 übernehmen.

---

## Status

**AUDIT / ARCHITECTURE / CONTINUITY ONLY / DRAFT / NO AP-5 RUNTIME**

Tracks Issue #116. Closes no runtime issue.

Author agent: `Account plattform audit vorbereitung 5`

This PR reconstructs the missing canonical Account Platform implementation plan for AP-5–AP-12 against current `main`. The historical file on Draft-PR #39 / `audit/account-platform` remains historical evidence and is not copied as current truth.

### Final docs-only scope

- new canonical `docs/ACCOUNT_PLATFORM_IMPLEMENTATION_PLAN.md`
- ADR-0179 (canonical plan reconstruction)
- ADR-0178 nachtrag: P2-TA-06 is integrated
- P2-TA-03 status / handoff / self-review
- continuity pointers in Start Here, Handoff, Roadmap, Active Work, Binding Build Order, Architecture
- historical nachträge **below** unchanged original `Status:` lines
- TL review-fix: AP-5 preserves the existing `secure_password_change` reauthentication contract; no invented current-password submit

### Reconciliation results

- AP-1–AP-4 stay **integrated** and are not re-planned
- P2-TA-06 / PR #113 stays **integrated**; not rebuilt
- Current Traveller truth remains trip-scoped
- AP-7 remains a Shared-Contract + Product-Owner gate; no registry contract is invented
- AP-5–AP-12 numbering is retained (no silent build-order change)
- AP-5 later UI must keep `auth.email.secure_password_change` / reauthentication; `security_update_password_require_current_password` stays off unless a separately approved Auth contract changes it
- D0-P1-03 Legal-404 is documented as AP-6a / Legal-PO residual
- Marketing cannot create a second consent/account truth

### Exact-head evidence

Live-`main` at authoring: `43aef6431aeea619ea896d456e16579b1034b9dd` (always re-check).

Previous reviewed Author-Head `bcc02d4d`: Actions `33127504563` SUCCESS; Vercel Inspector `JB2ZYdCM51TwWRCHKK9m2YFwBYMn` READY.

This review-fix creates a newer head. Re-check exact-head Actions/Vercel on the latest SHA before Ready/Merge.

### Non-scope (held)

No AP-5 runtime, no AP-6a runtime, no AP-7, no Auth/MFA/AAL/RLS/Identity change, no migration, no Config change, no sensitive traveller-document persistence, no provider/TW-8/search/homepage/public-indexing work, and no Supabase branch mutation.

### Review

Draft remains Draft. Do not mark Ready or merge before independent Technical-Lead re-review on the exact author head.

Supabase live correction remains: default `main` `qscbgcdmivbbnzrcyegn` ACTIVE_HEALTHY; non-default `develop` ACTIVE_HEALTHY. No branch mutation.
