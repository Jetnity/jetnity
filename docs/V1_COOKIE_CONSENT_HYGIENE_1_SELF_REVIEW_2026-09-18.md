# Jetnity – V1 Cookie Consent Hygiene 1 SELF-REVIEW

Stand: 18. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #475  
Draft PR: #477  
Branch: `fix/v1-cookie-consent-hygiene-1`  
Binding task: `docs/V1_COOKIE_CONSENT_HYGIENE_1_TASK_2026-09-18.md`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the deletion

| Attack | Result |
| --- | --- |
| Mount the banner instead of deleting it | Rejected. Copy is factually false (Views/Likes measurement does not exist) and `/privacy` 404s. Task forbids a replacement banner. |
| Rewrite the banner with invented honest legal text | Rejected. No legal-content generation. Absence of a banner is the truthful current state because no non-essential tracker exists. |
| Keep the file as a justified orphan | Rejected. The exception existed only to preserve a stale false claim. |
| Leave the dead-code exception after deletion | That would be a stale exception for a missing file. Removed. |
| Leave tests asserting the orphan still exists | That would fail required full repository tests. Inverted to lock absence. |
| Add analytics/tracking so a banner would become necessary | Rejected. No tracker. Future tracker = separate explicit consent/legal gate. |
| Expand cookie/localStorage processing | Rejected. The only consent key lived in the deleted orphan. |
| Create `/privacy`, `/terms` or imprint | Rejected. Out of scope. Finding 1.1 remains open. |
| Touch Data Export, Auth, Supabase, provider, secrets or cost | Rejected. |
| Edit global continuity docs | Rejected. Only this slice's TASK / STATUS / HANDOFF / SELF_REVIEW plus the allowed runtime/test/exception files. |
| Mark Ready or merge | Rejected. |

## 2. Residual risks this slice does not close

- `/privacy` and `/terms` still 404. Register still links them. That is finding **1.1**, not this slice.
- No data export or account deletion. Findings **2.1** / **2.2**.
- Historical docs and `DECISIONS.md` still mention the former orphan. Those are continuity/history files and were not rewritten in this slice.
- A later agent could reintroduce a tracker without a consent gate. The focused inventory test now fails if known tracker packages or the old consent artefact return; that is a lock, not a legal program.

## 3. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| Precheck: no runtime importer | Yes | Confirmed before delete |
| Precheck: no non-essential tracker | Yes | Confirmed before delete |
| Delete CookieConsent.tsx | Yes | |
| Remove only the dedicated dead-code exception | Yes | `ABSICHTLICH` now empty |
| Update focused legal/sanitation tests | Yes | Presence locks inverted to absence |
| Preserve no-banner/no-tracking runtime | Yes | Root layout unchanged |
| No replacement legal text or consent UX | Yes | |
| Persist future-tracker invariant | Yes | Test comment + STATUS/HANDOFF + inventory lock |
| Persist STATUS / HANDOFF / SELF_REVIEW | Yes | This set |
| No legal pages / tracker / DB / provider / cost / Ready / merge / follow-up | Yes | |

## 4. What remains before Technical-Lead review

Local gates, exact-head GitHub CI, exact-head Vercel Preview, review/Vercel-thread state and a live `origin/main` drift report. Those are not claimed here because they do not yet exist for the implementation head.
