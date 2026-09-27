# PrivacyBee integration 1 — Status

Date: 2026-09-27
Status: **IMPLEMENTED ON DRAFT PR / NOT READY / NOT MERGED**
Logical writer: **Jetnity PrivacyBee integration 1**, Generation **1**
Session: `bc-a147647d-4bb1-4136-a0a2-045e201f5c6a`
Model: `grok-4.7-high-fast` (`cursor-cloud run-info` `originalModelName`). Required Grok 4.7 High Fast. Not Auto.
Branch: `feat/privacybee-integration-1`
PR: https://github.com/Jetnity/jetnity/pull/579
Base: `4d1888f95aec3395e35c785bcb3e0d83301d5cec`
Task seed: `5277b53ebd0ad7b4591df44dd177c19164211867`
Issue: #577

Exact head is the tip of this branch after the implementation push. The PR body records that SHA. This status is not a Ready mark and not a merge.

## What this slice does

Official PrivacyBee widgets for German `/privacy` and `/impressum` in the existing public layout. Scripts load only when the reviewed activation is on and both the request host and the browser host are exactly `jetnity.com`. Missing `PRIVACYBEE_KILL_SWITCH` keeps that activation. The exact value `aus` is the server kill switch.

PrivacyBee owns the generated text. This repository does not copy it. `/terms` and `/datenschutz` stay unbuilt. No cookie banner, no indexing change, no new cost.

## Verification already run on this writer

| Command | Result |
| --- | --- |
| `npx tsc -p tsconfig.json --noEmit --incremental false` | exit 0 |
| `npm run lint` | exit 0. 146 pre-existing warnings, none in this slice |
| `npm test` | 3944 pass, 0 fail |
| `npm run build` | exit 0. `/privacy` and `/impressum` are dynamic. `/robots.txt` disallow-all. Sitemap stays empty while indexing is off |
| `node scripts/exporte.mjs` | 0 uncalled exports |
| `node scripts/erreichbarkeit.mjs` | 0 orphan files |
| `node scripts/api-schutz.mjs` | pass |
| `node scripts/pakete.mjs` | pass |
| `node scripts/db/verwendung.mjs --pruefen` | pass |
| `git diff --check` | pass |
| Local Playwright on `next start` at `127.0.0.1:3000` | no request to `privacybee`, no vendor script, no custom element. Fallback link and imprint mailto visible. Footer navigates to `/privacy`. `/terms` is 404 |

## Not verified here

Real `https://jetnity.com` visual and network proof. Preview is not Production proof. No Production env write. No deploy by this writer.
