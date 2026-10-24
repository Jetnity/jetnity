# Manual Journey Editor Completion 1 — SELF_REVIEW

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`

This is the author's review of the delivery commit. It is not a Technical-Lead PASS.

## Scope check

The diff stays on the accepted allowlist: three editors and their callsites, the flight readback wrapper, the pure helper and its test, the stay-test react substitute, the named connection hash and the two expected thrown/rejected sentences, the evidence-directory override, the new harness, the new evidence tree, and these four docs. TASK V1, addendum V1, and the accepted PLAN were not rewritten. Booking lifecycle, rental form behavior, shared CSS, schemas, and `TripIntegratedDay` were not edited. No sibling branch was merged.

## Findings

### P0

None found in the local proof.

### P1

None found in the local proof.

### P2

- `react-hooks/immutability` is disabled for the body of `ManuelleFlugRoute`, `UnterkunftZeitraum`, and `ManuelleVerbindung`, and for `reiseSpiegel.id = reise.id` in `FlugBestand`. The generation object has to change in the same render that sees a new target, before effects, so an in-flight completion cannot close or unlock the new form. A `useState` setter is stale inside that closure. A `ref.current` write during render is `react-hooks/refs`. The flight validation substitute also nulls object refs, so the cell cannot be an object ref. Review should read those blocks rather than treat the disable as blanket permission.
- `docs/evidence/manual-journey-editor-completion-1/result.json` records `headAtRun` `e763caa51b0213bd3c0e71afe948b00ab402eb5d` because the harness ran before this commit. `sourceSha256` is the binding for the four implementation files.
- Browser proof used Chrome `148.0.7778.96` after Playwright Chromium `chromium_headless_shell-1187` failed to launch. That is recorded. It is not Playwright Chromium, not native zoom, and not a device.
- CI, Preview, hosted account, and a screen reader were not run for this head. The existing Vercel comment on #1001 belongs to the plan seed, not this delivery.

### P3

- `npm run lint` is exit 0 with 144 warnings and 0 errors. The only warning in the edited editor files is the pre-existing `UNTERBEREICHE` unused-type warning. It was not changed.
- `check:schema-bezug` exit 0 prints pre-existing LOCAL/UNAPPLIED RPC notes. They are not this lane.
- `check:setup` during build warned that this VM has no `.env` / `.env.local`. The production build still exited 0.
- caniuse-lite is 13 months old. It was not updated.
- R103 and R104 `result.json` files keep the original harness author and session strings. Only their output directory was redirected. Historical evidence stayed byte-identical (16 files).

## Behavior the author rechecked in evidence

- Same-section flight replacement does not submit the old item, and a late readback does not select another trip.
- Stay correction clears `aria-invalid` on the corrected field and keeps one alert.
- Connection preset updates only clean fields. A same-mount trip change ignores a late success. The primary alert states that the outcome is unconfirmed and that a deliberate retry can create a second connection.
- At 320 CSS px and root 32px, page `scrollWidth` equals 320 and the connection controls stay inside the viewport.

## Not a pass

Author self-review does not authorize Ready or merge.
