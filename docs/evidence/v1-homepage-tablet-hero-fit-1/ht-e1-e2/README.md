# HT-E1 / HT-E2 correction evidence

Same session as the first freeze. Old `../screens` and `../audit-*.json` are immutable.

`html { font-size: 32px }` is text simulation.

## What this round adds

- Full first-hero element screenshots (viewport width × full hero height).
- Scrolled viewport images that show destination + CTA at 1024/200% and 1440/200%.
- Matched baseline 1024/200% using homepage blob `1bd46c82` (`195f6bc5`), then restore `bc272ae9`.
- Raw overflow offenders with selector, bounds, `firstHeroDescendant`, `painted`, `computedDisplay`.
- `assert.mjs` fails if geometry/interaction/overflow deltas are wrong. No class-string tests.

## Honesty

`hero.right === 1024` is not “all descendants fit”. Hidden-card descendants can still report boxes (`painted=false`). Visible first-hero painted overflow is empty after the xl fix and non-empty on the matched baseline (squeezed card). Document `overflowX` stays 148 on both sides (navbar + later Pro/inspiration). Destination placeholder can clip at 200% inside the existing `StartzielForm`; CTA remains complete. That form is read-only.

## Re-run

```bash
node docs/evidence/v1-homepage-tablet-hero-fit-1/ht-e1-e2/capture.mjs
node docs/evidence/v1-homepage-tablet-hero-fit-1/ht-e1-e2/assert.mjs
```
