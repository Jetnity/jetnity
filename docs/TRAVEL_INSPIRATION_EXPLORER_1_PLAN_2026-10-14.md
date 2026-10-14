# Reise-Inspiration Explorer 1 — implementation plan

Writer: **Jetnity Reise-Inspiration Explorer 1 — Codex Generation 1**. Actual Codex session `01a1399d-7921-70d3-81b0-1974081a4852` (environment and app rename response). One writer, no subagents.

## Reconstructed start

Live main `ef8ca0fa4bdc4c557a00e79b58061e52c09faf50`, mode NORMAL; seed `84d4f9781f3fd57f411a0e3ffdbbb2bf65e1eb87`; immutable TASK blob `146b2959deea7848d86c608ab25a14a2ca89c3ed` independently matched locally. #942/6164499263 and current #751 read, alongside startup/operating/active-work documents and the integrated #939 report. Older startup references to open #727 etc. are historical; #751 supersedes them. No newer #748 material returned after 2026-10-14T08:30:15Z. No `/entdecken` route collision found.

Own clone at `work/jetnity`, branch `feat/travel-inspiration-explorer-1`, own npm install and `.next`, app port 3541 (available at precheck). No other checkout changed. Network-restricted clone first failed DNS; approved network clone succeeded. No local credentials inspected/copied.

## Integrated EX-01–05 implementation

1. Add public server route with canonical metadata and explicit noindex, bounded initial URL state, four server-rendered destinations and working native GET form.
2. Add a pure presentation module keyed by the existing place IDs, reusing catalogue identities, images and ideas. Add only original descriptions and editorial themes. Preserve unchanged `zielHref` semantics.
3. Enhance the form with local search and one theme, bounded URL history, clear/reset/count/empty behavior. Group a continuous typing edit into one history entry; theme/reset are separate history steps. Native details expose the editable idea without hidden selection state.
4. Add only one homepage discovery link; direct cards, hero and section order remain unchanged. Feature-local responsive styling uses existing tokens and image component, visible focus, 44px targets and 16px inputs.
5. Test pure normalization/search/handoff edge cases, then the actual Next routes with isolated local synthetic place responses: homepage → search/theme → details → populated `/planen` editable form. Cover no-JS, back/forward/reload, image failure and 360/390/768/1440 viewport sizes. No native-device/zoom claim.

## Boundaries, risks and gates

Only TASK §4 paths will change. No DB/schema/migration/API/Auth/RLS/Trip/map/shared-registry/package/workflow/global-style change, no new service or recurring cost. The existing plan route owns guest/account decisions and server confirmation. Local place fixtures are synthetic HTTP responses, not a hosted database read or an authentication proof. Browsing never creates a trip or calls a model.

Risks: URL/SSR hydration divergence; history clutter; stale expanded details; no-JS fallback; inaccessible wrapping controls; local native test platform failures. Focused development tests first; final setup/mode/type/lint/full tests/API/schema/dead/exports/deps/build, original exact-head CI/Auth outputs and Preview evidence after code is stable. Retain failed attempts and limitations.

DEV-PREP-1 remains first-response-success / readback blocked / second not attempted. No replay, alternate access, Supabase action, credentials/App/backup/Bern work. #937 remains paused. Global continuity documents are read-only under this TASK; this feature's plan/report/handoff plus the PR receipt carry the implementation record. Author stops Draft for independent TL review; no Ready, merge, force-push or follow-up.

## Explicit scope amendment, 14 October 2026

The full suite exposed a frozen `next/image` consumer inventory in `lib/security/next-16-3-8-security-upgrade-1.test.ts`. The new component legitimately adds one consumer. The author prepared the exact additive one-line diff and asked for scope arbitration under TASK §4. The human user explicitly answered **„Diese eine Zeile freigeben“** in this same session. Only `components/inspiration/explorer-1/Inspirationskarte.tsx` is added to that expected inventory. No assertion is removed or weakened; package pins, image-host allowlist and advisory checks stay unchanged. The immutable TASK is not edited.
