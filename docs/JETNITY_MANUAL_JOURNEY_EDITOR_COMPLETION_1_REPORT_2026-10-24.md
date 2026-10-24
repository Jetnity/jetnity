# Manual Journey Editor Completion 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379` — https://cursor.com/agents/bc-02fbe98d-97ba-4c0b-a3b0-10857d784379
Model: `grok-4.7-high-fast` (`originalModelName`). No Auto fallback.
Issue: #998. Draft PR: #1001. Branch: `fix/manual-journey-editor-completion-1`.

## Status

Partially finished as an author review-fix delivery for CODE REVIEW V2. Local proof for the bounded editors is recorded. Independent Technical-Lead exact-head review of this head has not happened. This is not Ready and not merged.

## Git

| | SHA |
| --- | --- |
| live `origin/main`, fetched this turn | `43124e28f0c2ac366d25a86787f055b885b1fc00` |
| merge-base with that main | `0c37d318c47a758f06634448d6e0de3856bbc6a6` |
| accepted plan | `e763caa51b0213bd3c0e71afe948b00ab402eb5d` |
| CODE REVIEW V2 head | `9c80c8ffa95589d8be4922ca1eb55ecdf627df7f` |
| CODE REVIEW V2 tree | `933511932b486d848e75f5a510aa812ce49f9158` |
| runtime / harness `headAtRun` | `fc0999815fe1b002f3b56978842d8653966466d8` |
| runtime tree | `7374d03f43d12e5ce7f026a58bf837d2b86ddbb3` |
| evidence and these docs | the commit that adds this report, parent `fc099981` |

`43124e28` is the merge of #999 (lane A). This branch does not contain it. Against live main the runtime commit is **8 ahead / 16 behind**. Against the merge-base it is **8 ahead / 0 behind**. After this evidence commit the branch is **9 ahead** of the merge-base and **9 ahead / 16 behind** live main. No rebase, no sibling merge, and no main synchronization. Lane A files in that merge do not overlap `FlugBestand.tsx`, `UnterkunftBestand.tsx`, or `MobilitaetBereich.tsx`.

## Umgesetzt

C-P2-CODE-02. `FlugBestand` keeps a flight-surface generation. Click, change, and keydown whose target is inside `[data-flug-editor]` advance it. The save callback stores that generation with the pending readback. Render clears the pending readback when the trip id or the generation no longer matches. The layout effect also clears it when any flight editor in the section is `aria-expanded="true"`, so it does not focus a row or publish `Flugroute gespeichert. Der gespeicherte Flug ist ausgewählt.` A matching closed editor with the same generation still focuses its row button and sets that sentence. The local close status `Flugroute gespeichert.` still appears when the submitting generation succeeds, before the graph arrives. The save click is part of the generation, so an ordinary single-editor success still reads back. Booking clicks sit outside `[data-flug-editor]`. Booking and rental behavior are unchanged. The parent trip remains the graph. Readback only skips focus and status.

C-P2-PROOF-03. Each held request keeps its own payload and captured outcome. `release` settles the oldest request. For connection, flight, and stay, one behavior case arms R1 as `success`, then `domain`, then `reject`, switches committed context, arms R2 as `success`, and asserts the pending outcomes are `[r1, 'success']`. After R1 settles, R2 stays `aria-busy`, keeps its draft, shows neither success nor domain nor throw text, and keeps the same focused element. R2 then completes as success alone. R2's own outcome in this matrix is success.

The aborted connection transition and the speculative flight-trip transition wait until the fixture-only `Never()` child increments `suspendRenders`. `committed()` is read after that witness. It still shows the pre-transition preset or trip, and `suspend` is false, because the speculative render was not committed. Only then does the case abandon or resolve. Product components are not instrumented.

`flight-other-row-readback-keeps-focus` mounts two real rows in one `FlugBestand`. Row A saves `11:30` and the graph is held. Row B opens, receives `12:00`, and keeps focus on `Abflugzeit (optional)` after A's graph is delivered. The selection sentence does not appear. B's form and `12:00` stay.

The thrown or rejected connection alert is unchanged: `Ob die Verbindung gespeichert wurde, konnten wir nicht bestätigen. Deine Eingabe bleibt erhalten. Prüfe deinen Reiseplan vor einem erneuten Versuch. Ein erneuter Versuch kann eine zweite Verbindung anlegen.`

Named connection hash, from `export function ManuelleVerbindung` through EOF: `75e3838db77f502469a8e5f4705c182ccaa1e50dbc53ff6fd162d07bf8de118a`. `MobilitaetBereich.tsx` was not edited in this repair. The `9c80c8ff` hash and the seed hash `10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360` are lineage only.

## Files

- `components/trips/FlugBestand.tsx`
- `scripts/manual-journey-editor-completion-1/harness.mjs`
- `scripts/manual-journey-editor-completion-1/mount.tsx`
- `docs/evidence/manual-journey-editor-completion-1/**`
- this status, report, self-review, and handoff

`UnterkunftBestand.tsx` and `MobilitaetBereich.tsx` are unchanged from `9c80c8ff`. TASK V1, addendum V1, and the accepted PLAN were not edited. `ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, and ADR files were not edited. Shared classes, schemas, booking lifecycle, and `TripIntegratedDay` were not edited.

## Tests

Focused node tests, exit 0, on the runtime tree before `fc099981` was committed: 103 pass, 0 fail, 0 skipped.

```
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/trips/flug-manuell.test.ts \
  lib/trips/flug-route-form-validation.test.ts \
  lib/trips/unterkunft-manuell.test.ts \
  lib/trips/manual-journey-editor-completion-1.test.ts \
  lib/trips/organisieren-action-recovery-1.test.ts
```

Mounted, exit 0, after `fc099981`, Chrome `148.0.7778.96`, port `46145`, `headAtRun` `fc0999815fe1b002f3b56978842d8653966466d8`:

```
node scripts/manual-journey-editor-completion-1/harness.mjs
```

`behaviorCount` 19. `layoutCount` 9. The 19 names are in `rerun-provenance.json`. Layouts are 280, 320, 360, 390, 430, 768, 1280, landscape 844×320, and 320 at root 32px. At 320 CSS px and root 32px, `scrollWidth` is 320 and connection `maxRight` is 296.88. Geometry is CSS viewport and root font-size, not native zoom and not a device. `pageErrors` is empty. `blockedRequests` is empty.

Regression reruns, both exit 0, both under the lane folders, after the runtime commit:

```
JETNITY_R105_C_EVIDENCE_DIR=docs/evidence/manual-journey-editor-completion-1/r103-manual-mobility-pending-draft-guard \
  node scripts/manual-mobility-pending-draft-guard-1/harness.mjs
JETNITY_R105_C_EVIDENCE_DIR=docs/evidence/manual-journey-editor-completion-1/r104-organisieren-action-recovery \
  node scripts/organisieren-action-recovery-1/harness.mjs
```

An absolute override throws `must be a repo-relative path`. `docs/evidence/organisieren-action-recovery-1` throws `must stay inside docs/evidence/manual-journey-editor-completion-1`. Sha256 of the 16 historical files was identical before and after. R103 `sourceBlob` `a3b1fbac4494001daa3aef7da2b21c4106d3ceec` matches `HEAD:components/trips/MobilitaetBereich.tsx`. R104 flight blob `969a224aaa5f11f782f94806d9d635bafeff4476` matches `HEAD:components/trips/FlugBestand.tsx`. Unterkunft blob `7062f1d497a682cc3e98636a21e810f92c1ef597` and Mobilitaet blob match the same commit. Their `result.json` author and session strings are inherited from the old harnesses. The lane binding is `rerun-provenance.json`. R103 `result.json` did not change in this rerun. Its `wide-1280-pending.png` changed by a few bytes and is included.

Playwright's own Chromium binary is missing (`chromium_headless_shell-1187`). The harness used the Chrome channel. That is recorded on `browser.launchErrors`.

Harness sha256 `0809df460a65ce53ac19c99b48db774501a058515b9a1aa8fd94225f597b304d`. Mount sha256 `c37e1b3a9e96afcea9fa5080b3425ede530fd73d7d423466d91e980fc5570c37`.

## Build

Executed on the runtime tree before commit `fc099981`. This evidence commit does not change `components`, `lib`, or `scripts`.

`npm run typecheck` exit 0. `npm run lint` exit 0 with 0 errors and 144 warnings. The immutability suppression stays gone. The only warning in the three editor files is the pre-existing `UNTERBEREICHE` unused-type warning. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` exit 0. Schema-bezug prints pre-existing LOCAL/UNAPPLIED RPC notes (`admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_*`, `trip_regulatory_context_save_v1`).

`npm run build` exit 0. Next.js 16.4.1 compiled successfully. `check:setup` reported one environment warning: no `.env` / `.env.local` in this VM. Browserslist caniuse-lite is 13 months old and was not updated.

`db:*` and `auth:pruefen` were not run. This lane does not change schema or auth. CI App/Auth/Vercel for `fc099981` and for this evidence commit are NOT VERIFIED. Native run `40106541141` is green on `c2220a1a` only.

## Security

No new route, secret, service role, or auth change. Harness callbacks are in-memory. The unconfirmed alert does not claim the write was rolled back. Already-sent writes are not described as cancelled.

## Datenbank

No migration, RLS, grant, or generated type change.

## Kosten

No new dependency, provider, model call, or running cost.

## Dokumentation

This report, STATUS, SELF_REVIEW, HANDOFF, and `rerun-provenance.json`. TASK, addendum, and accepted PLAN stay immutable. Global continuity files stay TL-only.

## Offene Punkte

Technical-Lead exact-head review. CI App/Auth/Vercel and Preview for this head. Screen reader, native zoom, and a physical device. Synchronization onto `43124e28` waits for an explicit Technical-Lead instruction.

## Risiken

The connection create contract is still not exactly-once. A deliberate retry after the unconfirmed alert can create a second connection. A programmatic `button.focus()` after a matching closed-editor readback does not count as a newer editor interaction. A click, change, or keydown inside a flight editor does.

## Nächster Schritt

Technical Lead reviews the evidence commit, whose runtime parent is `fc099981`. Author stops. No Ready, merge, issue close, rebase, or follow-up.
