# Integrated-main representative refresh

Same session as HT-E1/HT-E2. Old `../screens`, `../audit-*.json` and `../ht-e1-e2/**` stay immutable.

Authorized single merge of exact main `d89ed0b01070e47f93918fa64126ff0aeb18a17b` into this PR. This directory records only the required 1024/1440 normal and 200% compiled-CSS/interaction proof on the integrated source. Not a new general audit.

`html { font-size: 32px }` is text simulation.

## Re-run

```bash
node docs/evidence/v1-homepage-tablet-hero-fit-1/integrated-d89ed0b0/capture.mjs
node docs/evidence/v1-homepage-tablet-hero-fit-1/integrated-d89ed0b0/assert.mjs
```
