# V1 Homepage Tablet Hero Fit 1 — Adversarial self-review

Stand: 21. September 2026  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS**

## 1. Did we implement only accepted VUX-8?

Yes. Two coordinated first-hero classes. No copy, branding, destination/CTA semantics, other sections, issue-110 intent, or VUX-6 peek mandate.

## 2. Did we only hide the card and leave a wasted column?

No. Grid columns and card visibility move together to `xl`. After 1024/1023/1279: `columnCount=1`, `emptySecondColumn=false`, card width 0. After 1280+: two columns and a ~401px card.

## 3. Is the 1024 before actually compiled CSS on this baseline?

Yes. Seed homepage source (no `page.tsx` edit yet) on reused `localhost:3000`. Card 195.35px; tags truncated. #506 PNG is historical context only.

## 4. Is 200% text an honest proof?

Labeled as `html { font-size: 32px }` simulation. Required 1024/1440 content remains present. 1024 overflowX 148 is pre-existing (same value and offenders on restored `lg` homepage): navbar + Pro glow + inspiration cards. First hero stayed viewport-bounded. 1440/200% decorative tags can still ellipsize; that is existing `truncate`, not a new 1024 squeeze.

## 5. Did we invent overflow-hidden or smaller type to pass?

No. No new `overflow-hidden` on the card, no shorter fake labels, no `text-[…]` reduction.

## 6. Behavior / mutations

Focus `#travel-idea`, Tab to `Reise planen`, empty submit shows the existing validation string. Attempts 0 / completed unexpected 0. Claiming “we intercepted a live POST” would be false. The abort is armed.

## 7. Sibling / main drift

#531 merged onto live main after this branch started. This writer did not rebase. Reporting 3 ahead / 9 behind is required honesty, not a defect of the hero CSS.

## 8. Verdict

Author self-review: VUX-8 is addressed with coordinated `xl` display and genuine before/after compiled-CSS geometry. **Not TL PASS.**
