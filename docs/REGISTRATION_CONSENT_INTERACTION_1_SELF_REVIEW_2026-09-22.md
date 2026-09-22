# Registration Consent Interaction 1 — SELF-REVIEW

Stand: 22. September 2026  
Status: **AGENT SELF-REVIEW OF THE REVIEW CORRECTION — NOT A TECHNICAL-LEAD PASS**

Issue: #539  
Draft PR: #540  
Branch: `fix/registration-consent-interaction-1`  
Binding task: `docs/REGISTRATION_CONSENT_INTERACTION_1_TASK_2026-09-22.md`  
Prior TL review: `5276799852` on `9132adb595d18fd1fd65f8fd14a54d072ec1950b` — CHANGES REQUIRED

This document argues against the correction. It cannot replace an independent Technical-Lead PASS.

---

## 1. Attacks on the correction

| Attack | Result |
| --- | --- |
| Keep `window.innerWidth` / label-box-right as the 200% pass | Rejected. That is the falsely green metric TL measured. Runner now uses `documentElement.clientWidth` / `scrollWidth` and each legal link’s bounding rect. |
| Hide overflow with `overflow-hidden` or clip | Rejected. Words wrap. No clip/hide. |
| Redesign shared `Label` or global CSS | Rejected. Only the RegisterForm consent label/link classNames plus matching harness copy. |
| Change legal copy or destinations | Rejected. Still `Nutzungsbedingungen` → `/terms` and `Datenschutzerklärung` → `/privacy`. |
| Keep harness `preventDefault` so links never navigate | Rejected. That could not prove default navigation or “no label activation”. Links now navigate; consent `change` is observed via `sessionStorage`. |
| Call `focus()` and document it as Tab | Rejected. Runner Tabs from `data-tab-start` until the native checkbox is `activeElement`. |
| Treat node source-string tests as interaction proof | Rejected. File comment plus this review: markup locks only. |
| Claim full `/register` route proof | Rejected. Label/consent-row harness, plus isolated `?layout=consent` for 200%. |
| Claim physical iPhone PASS | Rejected. Chromium emulation only. WebKit did not launch. |
| Precheck consent or weaken submit/handleRegister | Rejected. Untouched. |
| Edit Admin #538 or rebase | Rejected. One ordinary merge of exact `5fee5f66` only, after correction, if main had not moved. |
| Mark Ready or merge the PR | Rejected. |

## 2. Residual risks this correction does not close

- Real iPhone / Safari / production `/register` is still unverified by this writer.
- Isolated 200% layout is the consent row only. A rem-inflated full `/register` card could still overflow for other reasons; that was out of this RC-R1 bound.
- Harness legal navigation hits a local plain-text destination, not the Next app. It proves default `<a href>` behavior and unchanged consent, not product page content.
- `/terms` and `/privacy` still 404. Unchanged legal-foundation finding.
- OAuth on `/register` still does not require the checkbox. Unchanged inventory lock.
- Playwright WebKit host libraries are missing in this environment.
- `overflow-wrap: anywhere` can break German compounds mid-syllable. That is the requested wrap, not a typography redesign.

## 3. Compliance with the binding task and TL findings

| Requirement | Met? | Note |
| --- | --- | --- |
| RC-R1 wrap long legal links in existing consent label | Yes | RegisterForm classNames only |
| RC-R1 measure clientWidth + link bounds + scrollWidth | Yes | `measureConsentOverflow()` |
| RC-R1 recapture 320/390 @ 200% | Yes | screenshots + `layout-200` cases |
| RC-R1 no clip/hide | Yes | wrap only |
| RC-R2 real Tab + name + one native checkbox | Yes | `keyboard-tab-space` |
| RC-R2 actual default link navigation, no harness preventDefault | Yes | request + URL; consent sessionStorage null |
| RC-R2 optional label click | Yes | `optional-label-click` |
| Honest harness vs full RegisterForm | Yes | STATUS/HANDOFF say harness |
| No signup/Auth/DB writes | Yes | |
| Disjoint #538; one authorized main merge | Yes, if live main stayed `5fee5f66` |
| STOP for TL; no Ready/merge/follow-up | Yes | |

## 4. What remains before Technical-Lead re-review

Live exact-head GitHub CI, Auth job, direct Vercel Preview, review-thread/visual gates and an independent TL verdict on the frozen head. Historical `9132adb5` gates do not apply. Those are not claimed here.
