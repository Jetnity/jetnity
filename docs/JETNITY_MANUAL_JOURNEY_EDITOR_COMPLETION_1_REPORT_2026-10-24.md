# Manual Journey Editor Completion 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379` — https://cursor.com/agents/bc-02fbe98d-97ba-4c0b-a3b0-10857d784379
Model: `grok-4.7-high-fast` (`originalModelName`). No Auto fallback.
Issue: #998. Draft PR: #1001. Branch: `fix/manual-journey-editor-completion-1`.

## Status

Partially finished as an author delivery. Local proof for the bounded editors is recorded. Independent Technical-Lead exact-head review has not happened. This is not Ready and not merged.

## Git

| | SHA |
| --- | --- |
| main, fetched this turn | `0c37d318c47a758f06634448d6e0de3856bbc6a6` |
| merge-base | `0c37d318c47a758f06634448d6e0de3856bbc6a6` |
| accepted plan / harness `headAtRun` | `e763caa51b0213bd3c0e71afe948b00ab402eb5d` |
| delivery | the commit that adds this report, parent `e763caa5`, expected **5 ahead / 0 behind** |

The harness ran on the uncommitted implementation while HEAD was still the accepted plan. `headAtRun` is therefore the parent. The byte binding is `sourceSha256` in the new `result.json`. Hash those four files in this commit to confirm it.

## Umgesetzt

- Flight editor key is `` `${reise.id}:${item.id}` ``. A stable generation cell drops a draft when the trip or item changes on the same instance, and a late completion cannot close or unlock the new target. Domain and throw errors increment the existing focus counter. The route-readback wrapper stores the trip id and ignores a late match for a different trip. Booking actions are unchanged.
- Stay editor key includes the trip id. Open focuses Check-in. Escape closes unless a write is in flight. `aria-invalid` follows the current `unterkunftZeitraumSchema` result while validation is armed. One `role="alert"` remains. Domain and throw errors move focus and keep the draft.
- Connection treats a new `reise.id` as a full reset and a preset change as an update of clean fields only. User-edited values, times, connection number, and note stay. Success still clears only number and note, and only in the submitting generation. The thrown or rejected alert is: `Ob die Verbindung gespeichert wurde, konnten wir nicht bestätigen. Deine Eingabe bleibt erhalten. Prüfe deinen Reiseplan vor einem erneuten Versuch. Ein erneuter Versuch kann eine zweite Verbindung anlegen.`
- Local classes on the connection form and flight field cells keep controls inside 320 CSS px at root font-size 32px. Shared classes, schemas, and `TripIntegratedDay` are unchanged.
- The generation cell is a `useState` object mutated in render and in the submit handler. `react-hooks/immutability` is disabled only inside the three editor functions and on the one flight readback assignment. A ref write during render is `react-hooks/refs`, and a state setter is not visible to the in-flight closure before the next render.

Named connection hash, from `export function ManuelleVerbindung` through EOF: `22979037efebac48a119551fe9825cb3dbf90dd991c9294ac317ca499cb252f8`. The seed hash `10fe6c8f0ec2bb976a53678ac3df9b100bcafe55baa97a72f4081a22bb368360` is lineage only.

## Files

- `components/trips/FlugBestand.tsx`
- `components/trips/UnterkunftBestand.tsx`
- `components/trips/MobilitaetBereich.tsx`
- `lib/trips/manual-journey-editor-completion-1.ts`
- `lib/trips/manual-journey-editor-completion-1.test.ts`
- `lib/trips/unterkunft-manuell.test.ts` — react substitute now has `useEffect` / `useLayoutEffect` no-ops and functional `setState`. Assertions unchanged.
- `lib/trips/organisieren-action-recovery-1.test.ts` — named hash and test title only.
- `scripts/organisieren-action-recovery-1/harness.mjs` — `VERBINDUNG_HASH`, `VERBINDUNG_ABGELEHNT`, and `JETNITY_R105_C_EVIDENCE_DIR`.
- `scripts/manual-mobility-pending-draft-guard-1/harness.mjs` — `THROWN` and the same evidence override.
- `scripts/manual-journey-editor-completion-1/**`
- `docs/evidence/manual-journey-editor-completion-1/**`
- this status, report, self-review, and handoff

TASK V1, addendum V1, and the accepted PLAN were not edited. `ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, ROADMAP, and ADR files were not edited.

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

Mounted, exit 0, caseCount 16, Chrome `148.0.7778.96`:

```
node scripts/manual-journey-editor-completion-1/harness.mjs
```

Scenarios: flight valid/schema/domain/reject/retry, add/remove 1–4, multi-leg and over-four refusal, same-section replacement and late readback, stay focus/validation/Escape/replacement/unmount, connection pending/domain/unconfirmed, preset/trip/late result. Layouts 280, 320, 360, 390, 430, 768, 1280, landscape 844×320, and 320 at root 32px. At 320/32, `scrollWidth` is 320 and connection `maxRight` is 296.88. `reducedMotion` is recorded true. Geometry is CSS viewport and root font-size, not native zoom and not a device.

Regression reruns, both exit 0, both under the lane folders:

```
JETNITY_R105_C_EVIDENCE_DIR=docs/evidence/manual-journey-editor-completion-1/r103-manual-mobility-pending-draft-guard \
  node scripts/manual-mobility-pending-draft-guard-1/harness.mjs
JETNITY_R105_C_EVIDENCE_DIR=docs/evidence/manual-journey-editor-completion-1/r104-organisieren-action-recovery \
  node scripts/organisieren-action-recovery-1/harness.mjs
```

An absolute override throws `must be a repo-relative path`. `docs/evidence/organisieren-action-recovery-1` throws `must stay inside docs/evidence/manual-journey-editor-completion-1`. Sha256 of the 16 historical files in `docs/evidence/manual-mobility-pending-draft-guard-1` and `docs/evidence/organisieren-action-recovery-1` was identical before and after those reruns.

Playwright's own Chromium binary is missing (`chromium_headless_shell-1187`). The harness fell back to the Chrome channel. That failure is stored on `browser.launchErrors`. It is not a pass of Playwright Chromium.

## Build

`npm run typecheck` exit 0. `npm run lint` exit 0 with 0 errors and 144 warnings. The only warning in the three editor files is the pre-existing `UNTERBEREICHE` unused-type warning. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` exit 0. Schema-bezug prints pre-existing LOCAL/UNAPPLIED RPC notes (`admin_account_counts_v1`, `darf_official_truth_freigeben`, `official_truth_*`, `trip_regulatory_context_save_v1`).

`npm run build` exit 0. Next.js 16.4.1 compiled successfully, TypeScript finished, 26 static pages generated. `check:setup` reported one environment warning: no `.env` / `.env.local` in this VM. Browserslist caniuse-lite is 13 months old and was not updated.

`db:*` and `auth:pruefen` were not run. This lane does not change schema or auth.

## Security

No new route, secret, service role, or auth change. Callbacks in the harness are in-memory. Thrown connection errors are not shown. The unconfirmed alert does not claim the write was rolled back. Already-sent writes are not described as cancelled.

## Datenbank

No migration, RLS, grant, or generated type change.

## Kosten

No new dependency, provider, model call, or running cost.

## Dokumentation

This report, STATUS, SELF_REVIEW, and HANDOFF. TASK, addendum, and accepted PLAN stay immutable. Global continuity files stay TL-only.

## Offene Punkte

Technical-Lead exact-head review. CI App/Auth/Vercel and Preview for this head. Screen reader, native zoom, and a physical device.

## Risiken

The connection create contract is still not exactly-once. A deliberate retry after the unconfirmed alert can create a second connection. The immutability disable is local and should be read in review. `headAtRun` is the parent; use `sourceSha256`.

## Nächster Schritt

Technical Lead reviews this exact delivery commit. Author stops. No Ready, merge, issue close, or follow-up.
