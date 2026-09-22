# Registration Consent Interaction 1 — SELF-REVIEW

Stand: 22. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

Issue: #539  
Draft PR: #540  
Branch: `fix/registration-consent-interaction-1`  
Binding task: `docs/REGISTRATION_CONSENT_INTERACTION_1_TASK_2026-09-22.md`

This document argues against the implementation. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the repair

| Attack | Result |
| --- | --- |
| Keep the custom `role="checkbox"` and only stop the label | Rejected. Runtime showed two callbacks per click. One native control is the required contract. |
| Hide the native input with `sr-only` (1×1) and click only the visual | Rejected. Before evidence: input was 1×1; iOS/label activation stayed unreliable. The input is now the 44px hit target. |
| Precheck consent or enable submit by default | Rejected. `useState(false)` and `disabled={loading \|\| !accept}` remain. |
| Change `handleRegister` consent validation, password or email rules | Rejected. Untouched. |
| Follow legal links by toggling consent | Rejected. Links keep `/terms` and `/privacy` and `stopPropagation`. |
| Real signup in the harness | Rejected. Submit is intercepted locally. No credentials. Network except the local harness is aborted. |
| Claim physical iPhone PASS from Chromium 390 | Rejected. Recorded as emulated. WebKit did not launch. |
| Merge later main `#538` into this PR | Rejected. Disjoint Admin slice. Drift reported only. |
| Edit global continuity / ACTIVE_WORK / START_HERE | Rejected. Only this slice's STATUS / HANDOFF / SELF_REVIEW / evidence plus owned component/tests. |
| Mark Ready or merge | Rejected. |

## 2. Residual risks this slice does not close

- Real iPhone / Safari / production `/register` is still unverified by this writer.
- `/terms` and `/privacy` still 404. Unchanged legal-foundation finding.
- OAuth on `/register` still does not require the checkbox. Unchanged inventory lock.
- Playwright WebKit host libraries are missing in this environment.
- Later `origin/main@5fee5f66` (#538) is not in this merge-base. Integration is a TL decision.

## 3. Compliance with the binding task

| Requirement | Met? | Note |
| --- | --- | --- |
| Reproduce hydrated activation before fixing | Yes | `interact-before.json`: one click → `[true, false]`, stayed unchecked |
| Single native checkbox + native label activation | Yes | No custom `role="checkbox"`; RegisterForm `htmlFor="terms"` |
| Preserve exported API / ref / checked / onCheckedChange / indeterminate | Yes | |
| 44px touch, pointer, Tab/Space, disabled silent | Yes | After Chromium cases |
| Legal links navigate without toggle | Yes | Harness + RegisterForm `stopPropagation` |
| Default unchecked; submit gated; no consent bypass | Yes | |
| No Auth/DB/signup/role writes | Yes | |
| Disjoint from #538 | Yes | |
| STOP for TL; no Ready/merge/follow-up | Yes | |

## 4. What remains before Technical-Lead review

Exact-head GitHub CI, Auth job, Vercel Preview, review-thread/visual gates and an independent TL verdict on the implementation head. Those are not claimed here.
