# Jetnity — Planning Creation Lifecycle 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Planning Creation Lifecycle 1 — Cursor Generation 1**
Session: `bc-6fcb8c1a-ed18-49b0-a0fc-e2a0006117c5`
https://cursor.com/agents/bc-6fcb8c1a-ed18-49b0-a0fc-e2a0006117c5
Model: `grok-4.7-high-fast`
Issue: #990
Draft PR: #993
Branch: `fix/planning-creation-lifecycle-1`

This report is author evidence. It is not Technical-Lead PASS.

## Pins

- Assigned main: `913cf9353fd33491d2bd3130b3c430cc88990200`
- Merge-base: `913cf9353fd33491d2bd3130b3c430cc88990200`
- Runtime/proof head: `891c2dd13e121ee4dbfc27b07ce542acdab3fc1e`
- Component head inside it: `9f78c85d686565fa0ebc81a9720bfe8e8485d4dd` (TripPlanner, Reiseidee, hook unchanged by the runner fix)
- Ahead / behind that main, before the docs commit: 8 / 0
- TASK V1 blob: `d106810aa4c0138bd1191698a18aed3a1a5c2ba5`, unchanged
- Mode: NORMAL
- Node: v22.23.4

## Changed paths

Runtime:

- `components/trips/usePlanningCreationLifecycle.ts` — sync in-flight guard, mounted generation, pending flag. No action, storage or router.
- `components/trips/TripPlanner.tsx` — manual create recovery, pending lock, stable `clientRef`, stale-completion checks.
- `components/trips/Reiseidee.tsx` — proposal generation and adoption recovery, pending text/examples, stable adoption `clientRef`, stale-completion checks.

Proof and delivery:

- `lib/trips/planning-creation-lifecycle-1.test.ts`
- `scripts/planning-creation-lifecycle-1/**`
- `docs/evidence/planning-creation-lifecycle-1/**`
- PLAN, STATUS, REPORT, SELF_REVIEW, HANDOFF dated 2026-10-24

Readonly seams were not edited. No storage, server, Auth, DB, shared contract, dependency, workflow, config or global style change. No sibling branch was integrated.

## What the UI does

`beginnen` sets the in-flight ref before React paints `laeuft`. A second `beginnen` returns null. `aktuell` is true only for that generation while the instance is mounted. `beenden` clears the lock only for that generation.

Manual submit still runs `gastCreateJetztPruefen` before validation and again immediately before the first await. `clientRef` is minted once when empty and is not replaced on retry. Place confirmation and account create sit in one try/catch. A returned domain error still maps onto the existing field or message. A rejection or throw shows “Die Reise konnte gerade nicht erstellt werden. Deine Angaben bleiben hier. Bitte versuche es erneut.” Guest storage classes keep their existing messages, including a full browser store. After every await, the instance checks `aktuell` before `setState`, before `gastreiseAnlegen`, and before `router.push`. A successful navigation leaves the lock held. An account `reiseAnlegen` that already ran is not treated as cancelled.

Origin, destination, extra stops, reorder, dates, travellers, budget and the wish check the sync guard and are disabled while pending.

Proposal generation checks the guest gate, captures the text, then calls `vorschlagErzeugen`. Domain, rejection and throw restore the button and keep the text. `clientRef` is minted only after a successful proposal. Adoption reuses it. Account adoption and guest place resolution use the same generation check. A rejection or throw of adoption or place resolution shows “Dieser Vorschlag konnte gerade nicht übernommen werden. Er bleibt hier. Bitte versuche es erneut.” A thrown guest write still uses the existing storage sentence. Change and discard stay available after failure and do not clear `clientRef`.

## Acceptance

| # | Criterion | Executed result |
| --- | --- | --- |
| 1 | Guest and account success, validation focus, domain and reject/throw recovery | PASS. Guest success stored the confirmed route and navigated to that id. Account success ignored the existing guest bytes and retried the same `clientRef`. Empty submit focused `#feld-ziel` and called no action. Domain field error, plain domain message, reject and throw each recovered. |
| 2 | One stable draft while pending | PASS. Disabled route, dates, party, budget, wish and proposal text/examples. Same-turn textarea and reorder did not change the submitted payload. |
| 3 | Sync duplicate guard, explicit retry only | PASS. Two `requestSubmit` calls produced one place confirmation and, after release, one account create. Retry is the same button after `beenden`. |
| 4 | Stable `clientRef`, no false cancellation | PASS. Place and account reject/throw retried `trip-` plus the first uuid. The account call count stayed 1 after unmount. |
| 5 | Proposal generation failure and locked text | PASS. Domain, double submit, reject and throw kept the description. Examples were disabled while pending. One uuid after success. |
| 6 | Adoption failure keeps proposal, warning and ref | PASS. Domain, reject and throw kept the warning and `clientRef`. Guest quota still shows the full-storage sentence, then an explicit retry stored that ref. |
| 7 | Unmount, remount, no stale guest write | PASS. Unmount before `gastreiseAnlegen` and before `gastreiseAblegen` left storage empty and did not navigate. Remount after a held place confirmation ignored the late success. |
| 8 | Action-time guest gate, legacy and existing draft | PASS. Existing active draft, invalid `{` bytes and a valid legacy slot blocked create with no action call and no overwrite. Account create left the guest bytes unchanged. |
| 9 | Navigation, change/discard, focus, plain language | PASS. Enter submitted and retried. After a failed adoption, “Beschreibung ändern” cleared the preview and kept the text. Recovery copy does not name hooks, refs or HTTP. |
| 10 | Real components, disclosed stubs | PASS. See stubs below. The mounted runner executed the real components. The ordinary test does not launch that runner and does not assert source text. |
| 11 | 320 / 390 / 1280, keyboard, 200% reflow | PASS. Overflow delta 0 on the compiled styles. Keyboard Enter on travellers and on the retry button. Not a physical device or screen reader. |

## Failure modes covered

- Place domain error on the destination field, then a plain place message, same draft.
- Place rejection and throw, then success with the same identity.
- Account domain message, rejection and throw, then success with the same identity.
- Guest store `setItem` throw: “Browserspeicher ist voll”, no navigation.
- Existing draft, unreadable active bytes, valid legacy slot: existing gate copy, no overwrite.
- Proposal domain, rejection and throw.
- Adoption domain, rejection and throw, including place-resolution rejection before the guest write.
- Guest adoption quota, then retry.
- Pending discard/change ignored until the adoption failure is applied.
- Late success after unmount and after remount.

## Stubs

Disclosed in `docs/evidence/planning-creation-lifecycle-1/result.json`:

- `next/navigation`, `next/link`
- `reiseorteBestaetigen`, `reiseAnlegen`
- `vorschlagErzeugen`, `vorschlagUebernehmen`, `vorschlagOrteAufloesen`
- synthetic same-origin place search

Real: TripPlanner validation and route controls, mounted proposal preview, guest localStorage writes, `vorschlagAlsReise`, compiled global styles. `hosted`, `personalBrowser`, `modelCall` and `accountWrite` are false.

## Truth, privacy, security, accessibility, performance

The forms still record a chosen route, dates, party size, budget and a free wish. They do not infer citizenship, documents or visas. No new identity field.

No new endpoint, service role, secret, provider or paid call. The pending lock is not authorization. Guest data stays in the existing browser keys. An already-sent account action can still complete on the server; this UI only refuses to apply it after the instance is gone.

Errors stay in `role="alert"` or the existing status summary. Pending forms set `aria-busy`. Recovery controls remain buttons. No horizontal overflow at the measured widths, including a 32px root font.

The guard is a ref plus one boolean. It adds no request and no storage read beyond the existing action-time gate.

## Commands

| Command | Exit | Detail |
| --- | --- | --- |
| `PLANNING_CREATION_CHROMIUM=<Chromium 140.0.7339.16> node scripts/planning-creation-lifecycle-1/run.mjs` | 0 | 25 cases at `891c2dd1`, sha256 `2ce81f246d59e86db489b099962622c1f0780975c3f648673305a11cf5a85e08`. Evidence dir default. Artifact copy not requested. |
| same command without `PLANNING_CREATION_CHROMIUM` | 1 | Failed proof. Did not read or rewrite `result.json`. Not a skip. |
| `node --import ./scripts/server-only-test-register.mjs --import tsx --test lib/trips/planning-creation-lifecycle-1.test.ts` | 0 | 3 tests. Sync guard only. No Playwright launch and no skip. |
| focused `create-entry`, `planning-entry-premium-experience-7`, `mobile-accessibility-1`, `homepage-route-entry-1`, `homepage-natural-route-intent-1` | 0 | 78 tests, 0 fail |
| `npx tsc -p tsconfig.json --noEmit` | 0 | On runtime head `9f78c85d`. Earlier `npm run typecheck` also exited 0 before the guard extraction. |
| eslint on the touched TS/TSX files | 0 | 1 warning, pre-existing `setWarteMs` effect in `Reiseidee.tsx` |
| `npm run check:operating-mode` | 0 | PASS |
| `npm run check:api-schutz` | 0 | 12 admin routes |
| `npm run check:schema-bezug` | 0 | existing LOCAL/UNAPPLIED RPC notes, no new schema use |
| `npm run check:dead` | 0 | 0 orphans, 819 entry points |
| `npm run check:exports` | 0 | 0 unused exports |
| `npm run check:deps` | 0 | 0 unused packages |
| `npm run lint` | 0 | Re-run on `9f78c85d`. 146 warnings, 0 errors. |
| `npm run build` | 0 | Re-run on `9f78c85d`. `check:setup` warning: no `.env` / `.env.local`. Next.js 16.4.1 compiled. |

## Not verified

Physical device, screen reader, hosted account, Production database, provider or model activation, full `npm test`, full App/Auth CI, and Vercel Preview for this head. The mounted browser proof is local and exact-head. Workflow CI will not replay it, because `ci.yml` installs no Playwright browser and this lane does not change that workflow. The earlier seed Preview is not evidence for `891c2dd1`.

## Costs and database

No new running cost. No migration, RLS or type change.

## Residuals

See SELF_REVIEW. No P0 or P1 in this lane.

## Next step

Independent Technical-Lead exact-head review of the final PR head. Do not Ready, merge, close #990, or start a follow-up.
