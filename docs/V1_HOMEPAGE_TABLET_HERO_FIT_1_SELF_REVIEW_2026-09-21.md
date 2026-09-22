# V1 Homepage Tablet Hero Fit 1 — Adversarial self-review

Stand: 22. September 2026  
Status: **AGENT SELF-REVIEW AFTER AUTHORIZED MAIN MERGE — NOT A TECHNICAL-LEAD PASS**

## 1. Did we implement only accepted VUX-8?

Yes. Two coordinated first-hero classes. No copy, branding, destination/CTA semantics, other sections, issue-110 intent, or VUX-6 peek mandate.

## 2. Did we only hide the card and leave a wasted column?

No. Grid columns and card visibility move together to `xl`. After 1024/1023/1279: `columnCount=1`, `emptySecondColumn=false`, card width 0. After 1280+: two columns and a ~401px card.

## 3. Is the 1024 before actually compiled CSS on this baseline?

Yes. Seed homepage source (no `page.tsx` edit yet) on reused `localhost:3000`. Card 195.35px; tags truncated. #506 PNG is historical context only.

## 4. Is 200% text an honest proof?

Labeled as `html { font-size: 32px }` simulation. First-round hero clips omitted the form (y 751.5 / 905.16). Correction-round `hero-full` and scrolled `form-cta` images show destination + CTA. OverflowX 148=148 vs matched baseline blob `1bd46c82` with raw painted/unpainted offenders. Hidden-card ghost boxes are `painted=false`. Destination placeholder can clip at 200% inside unchanged `StartzielForm`; CTA is complete. 1440/200% decorative tags can still ellipsize.

## 5. Did we invent overflow-hidden or smaller type to pass?

No. No new `overflow-hidden` on the card, no shorter fake labels, no `text-[…]` reduction.

## 6. Behavior / mutations

Focus `#travel-idea`, Tab to `Reise planen`, empty submit shows the existing validation string. Attempts 0 / completed unexpected 0. Claiming “we intercepted a live POST” would be false. The abort is armed.

## 7. Sibling / main drift

#531 merged onto live main after this branch started. This writer did not rebase. Reporting 3 ahead / 9 behind is required honesty, not a defect of the hero CSS.

## 8. Did HT-E2 actually assert?

Yes. `ht-e1-e2/assert.mjs` fails on wrong column/card/overflow/interaction measurements. It passed after the painted-flag honesty fix. It does not read class strings from `page.tsx`.

## 9. Did the authorized main merge stay inside the grant?

Yes. One `--no-ff` merge of exact `d89ed0b0`. Not a rebase. `origin/main` still matched that SHA. Guest/account files were taken from main and not edited. `PublicNavbar.tsx` was not touched. Hero page blob remains `bc272ae9`. Old evidence remains. Only representative 1024/1440 proof was added.

## 10. Verdict

Author self-review: HT-E1/HT-E2 remain closed; the authorized main merge plus representative refresh are ready for independent TL review of the **new exact head**. **Not TL PASS. Not Ready.**
