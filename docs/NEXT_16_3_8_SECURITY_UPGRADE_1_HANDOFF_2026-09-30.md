# Jetnity Next.js 16.3.8 Security Upgrade 1 — HANDOFF

Stand: 30 September 2026
Status: **DRAFT IMPLEMENTATION COMPLETE / EXACT-HEAD CI AND PREVIEW PENDING THE PUSHED TIP / NOT READY / NOT MERGED**

## Identity

- Logical agent: Jetnity Next.js 16.3.8 security upgrade 1
- Generation: 1
- Required model: Grok 4.7 High Fast
- Actual `originalModelName`: `grok-4.7-high-fast`
- Cursor session: https://cursor.com/agents/bc-4391c41c-ebdc-485c-b1a2-a6de70b69c1f
- Issue: #654
- Branch: `chore/next-16-3-8-security-upgrade-1`
- Draft PR: #655
- Baseline: `main@8571db776bb58042a8107e341052a36cbbe9a50c`
- Merge-base with current `origin/main`: `8571db776bb58042a8107e341052a36cbbe9a50c`
- Ahead/behind at reconstruction: 1 ahead, 0 behind, before this implementation commit

The branch tip after the final push is the exact head. This file cannot contain the Actions run id of its own commit. Re-read GitHub Actions and the Vercel status for `git rev-parse HEAD` before any Technical-Lead decision. Cursor does not set Ready and does not merge.

## What landed

- `next` and `eslint-config-next` exact-pinned to `16.3.8`
- lockfile movement limited to `next`, `eslint-config-next`, `@next/env`, `@next/eslint-plugin-next`, and `@next/swc-*`
- `next.config.js` unchanged
- audit script and focused test added
- existing framework pin test updated from `16.3.3` to `16.3.8`
- global continuity pointers intentionally not edited

## Package gate

PASS. Official npm `latest` for both packages is `16.3.8`. GitHub release `v16.3.8` is stable and lists all seven 30 Sep advisories. `16.3.7` was not used. No canary.

GitHub still prints the patched patch-digit as `16.3.?`. The release notes and `v16.3.7...v16.3.8` commits are the proof that 16.3.8 is the patched stable target.

## Local result

All required local commands passed except `npm audit`, which exits 1 for pre-existing non-Next findings. Details: `docs/evidence/next-16-3-8-security-upgrade-1/local-gates.json`.

Production-like browser evidence is in `docs/evidence/next-16-3-8-security-upgrade-1/browser-regression.json`. Port 3010 served Next.js 16.3.8. Port 3000 was an older 16.3.3 server and was not used as evidence.

## Advisory result in one paragraph

16.3.3 was version-affected by the image SSRF, metadata-image, self-hosted cache-poisoning, root-catch-all, dev MCP, and the 22 Sep ImageResponse advisories. Only the image allowlist is actually configured. There is no metadata image route, no catch-all, no Pages Router, no Cache Components, no `'use cache'`, no Draft Mode, and no `next/og`. Production is Vercel. The allowlist was audited and left unchanged. 16.3.8 is past the ImageResponse patch `16.3.6`.

## Non-scope held

No Supabase/Auth/RLS, provider, payment, #626, PrivacyBee, tracking, indexing, Production config, or feature work. No runtime/component edit. No follow-up slice.

## Next step

Independent main-chat Technical-Lead security, dependency, and regression review of the exact pushed head. Stay Draft. Cursor never Ready. Cursor never merges.

Global pointers that still say `16.3.3` (`ARCHITECTURE.md`, `ROADMAP.md`, `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`) were out of this slice's write ownership. They should be reconciled only after Technical-Lead acceptance, not in a follow-up implementation slice started by Cursor.
