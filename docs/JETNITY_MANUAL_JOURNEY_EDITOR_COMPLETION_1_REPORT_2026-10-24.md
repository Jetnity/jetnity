# Manual Journey Editor Completion 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379` — https://cursor.com/agents/bc-02fbe98d-97ba-4c0b-a3b0-10857d784379
Model: `grok-4.7-high-fast` (`originalModelName`). No Auto fallback.
Issue: #998. Draft PR: #1001. Branch: `fix/manual-journey-editor-completion-1`.

## Status

Partially finished as an author review-fix delivery. Local proof for the bounded editors is recorded. Independent Technical-Lead exact-head review of this head has not happened. This is not Ready and not merged.

## Git

| | SHA |
| --- | --- |
| main, fetched this turn | `0c37d318c47a758f06634448d6e0de3856bbc6a6` |
| merge-base | `0c37d318c47a758f06634448d6e0de3856bbc6a6` |
| accepted plan | `e763caa51b0213bd3c0e71afe948b00ab402eb5d` |
| reviewed code | `c2220a1a2677ab3d25f9701dbfbdb7f586f626a6` |
| runtime / harness `headAtRun` | `0ce2a3faf21baea965c8e9cbbdf35f3181079fcc` |
| runtime tree | `fa09e196e22cffa554836efcb4c7206db89cbc00` |
| evidence and these docs | the commit that adds this report, parent `0ce2a3fa` |

The runtime commit is **6 ahead / 0 behind**. After this evidence commit the branch is **7 ahead / 0 behind**. No sibling merge and no main synchronization.

## Umgesetzt

C-P2-CODE-01. The three editors no longer mutate a shared state object during render. Generation and the last seen target are React state, so a discarded speculative render drops those updates. `useLayoutEffect` copies the committed generation and trip or item id into primitive refs. `passt()` reads those refs. `schreibt` is a boolean ref set in the submit handler before the await, which keeps the synchronous duplicate-submit lock, and cleared in `finally` only when the committed identity still matches, or in the layout effect when that identity has committed a change. The same pattern is in the flight editor, the stay editor, and `ManuelleVerbindung`. The flight readback wrapper no longer assigns `reiseSpiegel.id` during render. `reiseIdRef` is updated in the readback layout effect.

C-P2-CODE-02. A saved flight graph whose trip id is not the rendered trip clears the pending readback during render. If the saved item's row is `aria-expanded="true"`, the layout effect clears the pending readback and does not focus or publish the saved-graph status. A matching closed editor still focuses the row button and sets `Flugroute gespeichert. Der gespeicherte Flug ist ausgewählt.` The local close status `Flugroute gespeichert.` still appears when the submitting generation succeeds, before the graph arrives. Booking and rental behavior are unchanged.

C-P2-PROOF-03. The mounted fixture keeps a separate record, payload, and captured outcome per request. `release` settles the oldest open request for that channel. `deliver` applies the saved flight segments or stay dates only when the current trip and item still match the request context. An aborted `startTransition` with a suspending sibling records a committed view with no fallback. Behavior cases and layout measurements are separate counts.

The thrown or rejected connection alert is unchanged: `Ob die Verbindung gespeichert wurde, konnten wir nicht bestätigen. Deine Eingabe bleibt erhalten. Prüfe deinen Reiseplan vor einem erneuten Versuch. Ein erneuter Versuch kann eine zweite Verbindung anlegen.`

Named connection hash, from `export function ManuelleVerbindung` through EOF: `75e3838db77f502469a8e5f4705c182ccaa1e50dbc53ff6fd162d07bf8de118a`. The previous delivery hash `22979037efebac48a119551fe9825cb3dbf90dd991c9294ac317ca499cb252f8` and the seed hash `10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360` are lineage only.

## Files

- `components/trips/FlugBestand.tsx`
- `components/trips/UnterkunftBestand.tsx`
- `components/trips/MobilitaetBereich.tsx`
- `lib/trips/organisieren-action-recovery-1.test.ts` — named hash only
- `scripts/organisieren-action-recovery-1/harness.mjs` — named hash only in this review fix
- `scripts/manual-journey-editor-completion-1/harness.mjs`
- `scripts/manual-journey-editor-completion-1/mount.tsx`
- `docs/evidence/manual-journey-editor-completion-1/**`
- this status, report, self-review, and handoff

TASK V1, addendum V1, and the accepted PLAN were not edited. `ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, and ADR files were not edited. Shared classes, schemas, booking lifecycle, and `TripIntegratedDay` were not edited.

## Tests

Focused node tests, exit 0: 103 pass, 0 fail, 0 skipped.

```
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/trips/flug-manuell.test.ts \
  lib/trips/flug-route-form-validation.test.ts \
  lib/trips/unterkunft-manuell.test.ts \
  lib/trips/manual-journey-editor-completion-1.test.ts \
  lib/trips/organisieren-action-recovery-1.test.ts
```

Mounted, exit 0, Chrome `148.0.7778.96`, port `44439`, `headAtRun` `0ce2a3fa`:

```
node scripts/manual-journey-editor-completion-1/harness.mjs
```

`behaviorCount` 18. `layoutCount` 9. The 18 behavior cases are listed in `docs/evidence/manual-journey-editor-completion-1/rerun-provenance.json`. They include the aborted preset transition, independent R1/R2 locks for connection, flight, and stay, and saved-graph readback for normal success, changed context, and a newly opened draft. Layouts are 280, 320, 360, 390, 430, 768, 1280, landscape 844×320, and 320 at root 32px. At 320 CSS px and root 32px, `scrollWidth` is 320 and connection `maxRight` is 296.88. Geometry is CSS viewport and root font-size, not native zoom and not a device.

Regression reruns, both exit 0, both under the lane folders, after the runtime commit:

```
JETNITY_R105_C_EVIDENCE_DIR=docs/evidence/manual-journey-editor-completion-1/r103-manual-mobility-pending-draft-guard \
  node scripts/manual-mobility-pending-draft-guard-1/harness.mjs
JETNITY_R105_C_EVIDENCE_DIR=docs/evidence/manual-journey-editor-completion-1/r104-organisieren-action-recovery \
  node scripts/organisieren-action-recovery-1/harness.mjs
```

An absolute override throws `must be a repo-relative path`. `docs/evidence/organisieren-action-recovery-1` throws `must stay inside docs/evidence/manual-journey-editor-completion-1`. Sha256 of the 16 historical files was identical before and after. R103 `sourceBlob` and R104 component blobs match `0ce2a3fa`. Their `result.json` author and session strings are inherited from the old harnesses. The lane binding is `rerun-provenance.json`.

Playwright's own Chromium binary is missing (`chromium_headless_shell-1187`). The harness used the Chrome channel. That is recorded on `browser.launchErrors`.

## Build

Executed on runtime head `0ce2a3fa` before this evidence commit. This evidence commit does not change `components`, `lib`, or `scripts`.

`npm run typecheck` exit 0. `npm run lint` exit 0 with 0 errors and 144 warnings. The immutability suppression is gone. The only warning in the three editor files is the pre-existing `UNTERBEREICHE` unused-type warning. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` exit 0. Schema-bezug prints pre-existing LOCAL/UNAPPLIED RPC notes (`admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_*`, `trip_regulatory_context_save_v1`).

`npm run build` exit 0. Next.js 16.4.1 compiled successfully. `check:setup` reported one environment warning: no `.env` / `.env.local` in this VM. Browserslist caniuse-lite is 13 months old and was not updated.

`db:*` and `auth:pruefen` were not run. This lane does not change schema or auth. CI App/Auth/Vercel for `0ce2a3fa` and for this evidence commit are NOT VERIFIED. Native run `40106541141` is green on `c2220a1a` only.

## Security

No new route, secret, service role, or auth change. Harness callbacks are in-memory. The unconfirmed alert does not claim the write was rolled back. Already-sent writes are not described as cancelled.

## Datenbank

No migration, RLS, grant, or generated type change.

## Kosten

No new dependency, provider, model call, or running cost.

## Dokumentation

This report, STATUS, SELF_REVIEW, HANDOFF, and `rerun-provenance.json`. TASK, addendum, and accepted PLAN stay immutable. Global continuity files stay TL-only.

## Offene Punkte

Technical-Lead exact-head review. CI App/Auth/Vercel and Preview for this head. Screen reader, native zoom, and a physical device.

## Risiken

The connection create contract is still not exactly-once. A deliberate retry after the unconfirmed alert can create a second connection. A discarded render cannot unlock or relock the committed request; a committed target change still invalidates it.

## Nächster Schritt

Technical Lead reviews the evidence commit, whose runtime parent is `0ce2a3fa`. Author stops. No Ready, merge, issue close, or follow-up.
