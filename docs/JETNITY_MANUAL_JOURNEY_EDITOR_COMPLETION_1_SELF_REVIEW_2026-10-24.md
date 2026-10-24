# Manual Journey Editor Completion 1 — SELF_REVIEW

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`

This is the author's review of the CODE REVIEW V2 repair. It is not a Technical-Lead PASS.

## Scope check

The runtime diff from `9c80c8ff` to `fc099981` is `FlugBestand.tsx`, `scripts/manual-journey-editor-completion-1/harness.mjs`, and `scripts/manual-journey-editor-completion-1/mount.tsx`. The evidence commit adds proof and these four docs. TASK V1, addendum V1, and the accepted PLAN were not rewritten. Booking lifecycle, rental form behavior, shared CSS, schemas, and `TripIntegratedDay` were not edited. No sibling branch was merged. Lint configuration was not weakened. The `react-hooks/immutability` suppression stays removed.

## Correction of the previous author report

The STOP on `9c80c8ff` said late R1 success, domain, and reject ran for all three editors. The harness at that head armed R1 as success and varied R2. That sentence was wrong. This head's three cases `connection-late-r1-success-domain-reject-r2-pending`, `flight-late-r1-success-domain-reject-r2-pending`, and `stay-late-r1-success-domain-reject-r2-pending` arm R1 through success, domain, and reject. R2 is armed as success and is the request that remains pending. After R1, the assertions are R2's draft, lock, absence of R1's success/domain/throw text, and stable focus. R2 then completes as success. This matrix does not also vary R2 through domain and reject.

## Findings

### P0

None found in the local proof.

### P1

None found in the local proof.

### P2

- `docs/evidence/manual-journey-editor-completion-1/result.json` records `headAtRun` `fc0999815fe1b002f3b56978842d8653966466d8`. That is the runtime commit. The commit that adds this review also adds the evidence and does not change `components`, `lib`, or `scripts`. `sourceSha256` binds the four implementation files.
- Browser proof used Chrome `148.0.7778.96` after Playwright Chromium `chromium_headless_shell-1187` failed to launch. That is recorded. It is not Playwright Chromium, not native zoom, and not a device.
- CI, Preview, hosted account, and a screen reader were not run for `fc099981` or for the evidence commit. Native CI `40106541141` is `c2220a1a`, not this head.
- Live `origin/main` is `43124e28` after #999 merged. This branch was not rebased. Merge-base remains `0c37d318`.

### P3

- `npm run lint` on the runtime tree is exit 0 with 144 warnings and 0 errors. The only warning in the edited editor files is the pre-existing `UNTERBEREICHE` unused-type warning.
- `check:schema-bezug` exit 0 prints pre-existing LOCAL/UNAPPLIED RPC notes. They are not this lane.
- `check:setup` during build warned that this VM has no `.env` / `.env.local`. The production build still exited 0.
- caniuse-lite is 13 months old. It was not updated.
- R103 and R104 `result.json` files keep the original harness author and session strings. `rerun-provenance.json` is the lane binding. Historical evidence stayed byte-identical (16 files). R103 `wide-1280-pending.png` changed by a few bytes on the rerun.

## Behavior the author rechecked in evidence

- `flight-other-row-readback-keeps-focus`: after A's saved graph is delivered, B's `12:00` stays, B's form stays open, focus stays on `Abflugzeit (optional)`, and the selection sentence is absent.
- `flight-saved-graph-new-draft` still keeps `12:00` focused on the same row. `flight-saved-graph-readback` still publishes the selection sentence on the closed editor.
- Connection, flight, and stay each keep R2 locked and intact for late R1 success, domain, and reject, then R2 completes as success alone.
- `connection-aborted-transition-releases-lock` waits for the suspend witness, sees committed origin `Zürich HB` and `suspend` false, then abandons and unlocks on that same success.
- `flight-speculative-trip-keeps-readback` waits for the same witness, sees committed trip `trip-flight`, then delivers the readback after abandon.
- At 320 CSS px and root 32px, page `scrollWidth` equals 320 and connection `maxRight` is 296.88.

## Not a pass

Author self-review does not authorize Ready or merge.
