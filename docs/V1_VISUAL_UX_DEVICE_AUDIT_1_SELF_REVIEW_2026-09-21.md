# V1 Visual UX & Device Audit 1 — Adversarial self-review

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS OR VISUAL ACCEPTANCE**

Reviewed artefact: `docs/V1_VISUAL_UX_DEVICE_AUDIT_1_REPORT_2026-09-21.md`

A feature/audit author's own review cannot replace an independent Technical-Lead visual/product PASS.

---

## 1. Where this audit is most likely to be wrong

### 1.1 Severity is judgement

VUX-2 (ISO dates) is the only finding that is a hard display defect. VUX-1/VUX-3 as P1 can be downgraded: the product already has a kompakt header, honest guest copy, and truthful “no invented provider” language that earlier slices required. A reviewer may call VUX-3 a P2 vocabulary polish and VUX-1 a P2 density note.

I kept P1 because the Product Owner asked whether a newcomer sees location, state and next action **without scrolling or decoding jargon**. On 390, they do not.

### 1.2 VUX-4 scroll cause is inferred

I have two screens after tapping Flüge/Unterkunft that start mid-panel. I did not instrument `scrollIntoView` / focus. The sticky back control exists in source. A reviewer may treat VUX-4 as “capture method scrolled” rather than a product jump. I still report it because a second from-top recapture showed the same missing chrome.

### 1.3 OCR / vision doubling is not a product defect

Several screenshot descriptions from the vision helper doubled letters (`Deereine`). DOM `h1` text is the correct German (`Deine ganze Reise. Einfach an einem Ort.`). Tight tracking is brand (`letter-spacing: -4.29px` at 1440). I did **not** file a typography-corruption finding.

### 1.4 Date input `mm/dd/yyyy` is environment-bound

Seen in Chrome on this VM despite `lang="de"` and Playwright `de-CH`. I did not promote it to a finding.

### 1.5 I did not walk Account, Admin, or paid search

BLOCKED_ACCESS is correct. A later reader must not quote this PR as “the site was visually accepted.”

### 1.6 Complex fixture is synthetic and incomplete

Days 7/9/10 were omitted on purpose in the fixture. Missing day chips are **not** a product bug. Dual-citizenship party was injected; prep was only partly on screen — not a registry visual pass.

### 1.7 Main moved during the run

#494 merged after dispatch. I did not rebase or recapture. UI files did not change. If a reviewer wants “exact live main HEAD” screens, they need a new capture SHA.

### 1.8 Existing a11y audit is not a visual PASS

21/21 reflow/keyboard OK can be misread as “mobile UX is done.” That script never asks whether the first viewport shows the next action.

---

## 2. Where I believe the audit is solid

- Real browser, not CSS reading  
- Product SHA bound on every capture  
- No invented user-study or conversion claims  
- No product edits  
- No paid calls  
- Overflow 0 independently confirmed by the existing a11y script  
- Strengths listed so a repair does not flatten the brand  
- Three small scopes instead of a redesign  

---

## 3. What I would challenge if I were TL

1. Is VUX-1 just “long title fixture”? A short “Bali” title would show more Übersicht. I used a long title **because** the task asked for long place names; a short-title recapture was not done.  
2. Should VUX-7 exist? Planen idea-first is an accepted product order. I filed layout, not a demand to invert the page.  
3. Scope C will churn many copy tests. TL may want B first (one file) then A.

---

## 4. Transport amendment (same session, not a new audit)

21 September 2026: JPEG review copies were derived from the eight named existing PNGs with Pillow 12.3.0. Original PNG SHA-256 values match `c8d30e9f`. Findings VUX-1…8 and scopes A/B/C were **not** changed. `home_initial_1024.jpg` is the only size-budget exception (27892 B) so VUX-8 remains judgeable. These JPEGs are lossy review transport, not new captures and not a visual PASS.

## 5. Stop

No Ready. No merge. No self-acceptance.
