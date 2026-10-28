# Viator Sandbox Affiliate Foundation 1 — STATUS

28 October 2026. Cursor Generation 1. Draft PR #1079. Not Ready. Not merged.

## State

S1 offline foundation is implemented on `feat/viator-sandbox-affiliate-foundation-1`. The immutable task file is unchanged. `lib/activities/factory.ts` still returns null. No Viator content is served to a browser.

Real Sandbox HTTP is **BLOCKED**. `scripts/viator-sandbox-foundation-1/status.ts` printed `liveSandbox: BLOCKED`, `keyPresent: false`, `zugang: disabled`. No `VIATOR_SANDBOX_API_KEY` is present in this environment, and none was requested or written.

## Verification on this working tree

- Focused unit tests: 17 pass, 0 fail (`lib/providers/viator/activities/*.test.ts`).
- `npx eslint lib/providers/viator/activities scripts/viator-sandbox-foundation-1 --max-warnings 0`: pass.
- `npm run lint`: exit 0. Pre-existing warnings remain in unrelated admin files. No new Viator warning.
- `npm run typecheck` (`next typegen && tsc -p tsconfig.json --noEmit`): pass. An earlier run failed on union narrowing; that was fixed before this green run.
- `npm run build`: pass.
- `node scripts/exporte.mjs`: no uncalled export.
- `node scripts/erreichbarkeit.mjs`: no unreached file.
- `node scripts/operating-mode-guard.mjs`: PASS.
- Mode NORMAL. Merge-base remains `71e07c71d06e7c4ef26ed6e8d40080bb9ea24382`.

Native App/Auth CI and Vercel Preview for this head start only after push. They are fixture/code smoke, not live provider QA.

## Next

Independent Technical Lead R1 on the exact pushed head. Cursor does not mark Ready and does not merge.
