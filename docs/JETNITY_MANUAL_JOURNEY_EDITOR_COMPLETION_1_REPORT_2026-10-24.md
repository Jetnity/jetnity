# Manual Journey Editor Completion 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379` — https://cursor.com/agents/bc-02fbe98d-97ba-4c0b-a3b0-10857d784379
Model: `grok-4.7-high-fast` (`originalModelName`). No Auto fallback.
Issue: #998. Draft PR: #1001. Branch: `fix/manual-journey-editor-completion-1`.

## Status

Partially finished as an author review-fix delivery for CODE REVIEW V3. Local proof for the bounded flight editor is recorded. Independent Technical-Lead exact-head review of this head has not happened. This is not Ready and not merged.

## Git

| | SHA |
| --- | --- |
| live `origin/main`, fetched this turn | `43124e28f0c2ac366d25a86787f055b885b1fc00` |
| merge-base with that main | `0c37d318c47a758f06634448d6e0de3856bbc6a6` |
| accepted plan | `e763caa51b0213bd3c0e71afe948b00ab402eb5d` |
| CODE REVIEW V3 head | `52779d7f5307b7de5389e76e982c2eb208aa04c6` |
| CODE REVIEW V3 tree | `886ef27c9fd48cdb08c3d9bd10c88112d46dd28b` |
| runtime / harness `headAtRun` | `ecdaef7b7ecb24b34b3bc482810ed646a405c807` |
| runtime tree | `2169a040ae2b25d19f8a0fdd77c875603a660687` |
| evidence and these docs | the commit that adds this report, parent `ecdaef7b` |

`43124e28` is the merge of #999. This branch does not contain it. Against live main the runtime commit is **10 ahead / 16 behind**. Against the merge-base it is **10 ahead / 0 behind**. After this evidence commit the branch is **11 ahead** of the merge-base and **11 ahead / 16 behind** live main. No rebase and no main synchronization.

## Umgesetzt

C-P2-CODE-02. `routeSpeichern` reads `oberflaecheRef.current` before `await onFlugRouteManuell`. It stores that generation only when the ref is still equal after the callback. A later click, change, or keydown cannot be adopted by the older save. `ManuelleFlugRoute` receives that same ref and reads it before the same await. Success closes the form and sets `Flugroute gespeichert.` without calling `knopf.focus()` when the generation has moved. Domain text and the throw sentence `Die Flugroute konnte nicht gespeichert werden. Bitte versuche es erneut.` still render, and the draft stays, but `fokusVersuch` does not run when the generation has moved. Escape, cancel, and the synchronous validation path still focus, because those are the current interaction. A matching closed editor whose generation has not moved still focuses its row button, and the graph effect still sets `Flugroute gespeichert. Der gespeicherte Flug ist ausgewählt.`

The thrown or rejected connection alert is unchanged. Named connection hash, from `export function ManuelleVerbindung` through EOF: `75e3838db77f502469a8e5f4705c182ccaa1e50dbc53ff6fd162d07bf8de118a`. `MobilitaetBereich.tsx` was not edited.

## Files

- `components/trips/FlugBestand.tsx`
- `scripts/manual-journey-editor-completion-1/harness.mjs`
- `docs/evidence/manual-journey-editor-completion-1/**`
- this status, report, self-review, and handoff

`UnterkunftBestand.tsx`, `MobilitaetBereich.tsx`, and `mount.tsx` are unchanged from `52779d7f`. TASK V1, addendum V1, and the accepted PLAN were not edited. Shared classes, schemas, booking lifecycle, and `TripIntegratedDay` were not edited.

## Tests

Focused node tests, exit 0, on the runtime tree before `ecdaef7b` was committed: 103 pass, 0 fail, 0 skipped.

```
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/trips/flug-manuell.test.ts \
  lib/trips/flug-route-form-validation.test.ts \
  lib/trips/unterkunft-manuell.test.ts \
  lib/trips/manual-journey-editor-completion-1.test.ts \
  lib/trips/organisieren-action-recovery-1.test.ts
```

Mounted, exit 0, after `ecdaef7b`, Chrome `148.0.7778.96`, port `41287`, `headAtRun` `ecdaef7b7ecb24b34b3bc482810ed646a405c807`:

```
node scripts/manual-journey-editor-completion-1/harness.mjs
```

`behaviorCount` 20 named scenario groups. `layoutCount` 9 measurements. The new group `flight-pending-a-newer-b-keeps-focus` runs 6 times: success, domain, and reject, each with B open and with B cancelled. For the cancelled success path it marks B's `Flugroute ändern` button after cancel, then asserts that same element after A's callback and again after A's graph. The selection sentence stays absent. After the graph, row A shows `11:30`. Domain and reject keep A's `11:30` draft and show `Route abgelehnt.` or the flight throw sentence while focus stays on B's marked control. The earlier same-row draft, completed-A-then-open-B, current-operation readback, R1/R2, and suspend cases remain in the other groups. At 320 CSS px and root 32px, `scrollWidth` is 320 and connection `maxRight` is 296.88. `pageErrors` is empty.

One earlier post-commit harness attempt timed out in `awaitSuspend` while `npm run build` was still running. The isolated rerun above passed, including that suspend witness. The pre-commit harness on the same source also passed.

Regression reruns, both exit 0, after the runtime commit:

```
JETNITY_R105_C_EVIDENCE_DIR=docs/evidence/manual-journey-editor-completion-1/r103-manual-mobility-pending-draft-guard \
  node scripts/manual-mobility-pending-draft-guard-1/harness.mjs
JETNITY_R105_C_EVIDENCE_DIR=docs/evidence/manual-journey-editor-completion-1/r104-organisieren-action-recovery \
  node scripts/organisieren-action-recovery-1/harness.mjs
```

Sha256 of the 16 historical files was identical before and after. R104 flight blob `a0d356466e9a28f31ae0249e42670bd099887b85` matches `HEAD:components/trips/FlugBestand.tsx`. R103 `sourceBlob` `a3b1fbac4494001daa3aef7da2b21c4106d3ceec` matches Mobilitaet. Their author strings are inherited. R103 `result.json` did not change. Its `wide-1280-pending.png` changed by a few bytes.

Harness sha256 `ecc0f3d86bb77e45461aaea3b9896b9b03e3094f28b9cad43dab0cc210d75d54`. Mount sha256 `c37e1b3a9e96afcea9fa5080b3425ede530fd73d7d423466d91e980fc5570c37`. Playwright Chromium `chromium_headless_shell-1187` did not launch. The Chrome channel was used.

## Build

Executed on runtime head `ecdaef7b` before this evidence commit. This evidence commit does not change `components`, `lib`, or `scripts`.

`npm run typecheck` exit 0. `npm run lint` exit 0 with 0 errors and 144 warnings. No warning is in `FlugBestand.tsx`. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` exit 0. Schema-bezug prints the pre-existing LOCAL/UNAPPLIED RPC notes. `npm run build` exit 0. Next.js 16.4.1 compiled successfully. `check:setup` warned that this VM has no `.env`. caniuse-lite is 13 months old and was not updated.

`db:*` and `auth:pruefen` were not run. CI App/Auth/Vercel for `ecdaef7b` and for this evidence commit are NOT VERIFIED. Native run `40106541141` is green on `c2220a1a` only.

## Security

No new route, secret, service role, or auth change. An older flight error stays visible and does not claim the write was cancelled. The connection unconfirmed alert is unchanged.

## Datenbank

No migration, RLS, grant, or generated type change.

## Kosten

No new dependency, provider, model call, or running cost.

## Dokumentation

This report, STATUS, SELF_REVIEW, HANDOFF, and `rerun-provenance.json`. TASK, addendum, and accepted PLAN stay immutable.

## Offene Punkte

Technical-Lead exact-head review. CI App/Auth/Vercel and Preview for this head. Screen reader, native zoom, and a physical device. Synchronization onto `43124e28` waits for an explicit Technical-Lead instruction.

## Risiken

The connection create contract is still not exactly-once. A programmatic focus that is not a click, change, or keydown inside a flight editor does not advance the surface generation. Booking clicks outside `[data-flug-editor]` do not either.

## Nächster Schritt

Technical Lead reviews the evidence commit, whose runtime parent is `ecdaef7b`. Author stops. No Ready, merge, issue close, rebase, or follow-up.
