# Manual Journey Editor Completion 1 — REPORT

Date: 24 October 2026
Author: **Jetnity Manual Journey Editor Completion 1 — Cursor Generation 1**
Session: `bc-02fbe98d-97ba-4c0b-a3b0-10857d784379`
Model: `grok-4.7-high-fast`

## Umgesetzt

Accepted main `43124e28f0c2ac366d25a86787f055b885b1fc00` is merged into this branch. ADDENDUM V2 was fast-forwarded first. Three review corrections landed in `b356fd9ff1215174511bd59a0eddc27206e47f69`.

A pending stay save reads the manual-stay surface generation before `await`. Opening or editing a different stay editor advances that generation. The older callback still closes on success and still shows the domain or throw text, and it still keeps the draft on failure. It does not focus A's trigger or A's alert when B owns the surface. The same stay editor still focuses its trigger after success and its alert after domain or rejection. Booking clicks outside `[data-aufenthalt-editor]` do not advance the generation.

`vorgabeSchluessel` serializes the existing normalized tuple with `JSON.stringify`. `awaitSuspend` receives the suspend count captured before the speculative transition.

## Tests

Focused node tests, exit 0, on `b356fd9f`: **104 pass, 0 fail, 0 skipped**. The new case is the delimiter preset. The previous 103 cases remain.

```
node --import ./scripts/server-only-test-register.mjs --import tsx --test \
  lib/trips/flug-manuell.test.ts \
  lib/trips/flug-route-form-validation.test.ts \
  lib/trips/unterkunft-manuell.test.ts \
  lib/trips/manual-journey-editor-completion-1.test.ts \
  lib/trips/organisieren-action-recovery-1.test.ts
```

Mounted, exit 0, Chrome `148.0.7778.96`, port `39311`, `headAtRun` `b356fd9ff1215174511bd59a0eddc27206e47f69`:

```
node scripts/manual-journey-editor-completion-1/harness.mjs
```

`behaviorCount` 22 named groups. `layoutCount` 9. `stay-current-owner-focus` runs success, domain, and reject on the two-row stay surface while B stays closed: success focuses A's `Zeitraum ändern` button, and domain/reject focus A's alert. `stay-pending-a-newer-b-keeps-focus` runs the same three outcomes with B open and with B cancelled. Each execution asserts the marked B control after A's callback, one new stay callback for `stay-a`, A's real outcome and draft, and B's open draft or closed button. The six flight ownership executions remain. The suspend cases record `suspendRenders` before the transition and still require the witnessed increment and the committed context. At 320 CSS px and root 32px, `scrollWidth` is 320 and connection `maxRight` is 296.88. Behavior and layout diagnostic lists are empty and were asserted separately.

Regression reruns, both exit 0:

```
JETNITY_R105_C_EVIDENCE_DIR=docs/evidence/manual-journey-editor-completion-1/r103-manual-mobility-pending-draft-guard \
  node scripts/manual-mobility-pending-draft-guard-1/harness.mjs
JETNITY_R105_C_EVIDENCE_DIR=docs/evidence/manual-journey-editor-completion-1/r104-organisieren-action-recovery \
  node scripts/organisieren-action-recovery-1/harness.mjs
```

Historical 16 files stayed sha256-identical. R103 `sourceBlob` `a3b1fbac4494001daa3aef7da2b21c4106d3ceec` matches Mobilitaet. Its `result.json` did not change. `wide-1280-pending.png` changed by a few bytes. R104 flight blob `a0d356466e9a28f31ae0249e42670bd099887b85` matches FlugBestand. Unterkunft blob `72fb6146d72bb30cf796687620894a26a57dd25e` matches this runtime. Connection hash `75e3838db77f502469a8e5f4705c182ccaa1e50dbc53ff6fd162d07bf8de118a`. R103 and R104 author strings are inherited.

Playwright Chromium `chromium_headless_shell-1187` did not launch. The Chrome channel was used.

## Build

On `b356fd9f`: `npm run typecheck` exit 0. `npm run lint` exit 0, **0 errors, 144 warnings**. No warning is in `UnterkunftBestand.tsx` or `FlugBestand.tsx`. `check:dead`, `check:exports`, `check:deps`, `check:api-schutz`, and `check:schema-bezug` exit 0. Schema-bezug prints the pre-existing LOCAL/UNAPPLIED RPC notes. `npm run build` exit 0. Next.js 16.4.1 compiled successfully. `check:setup` warned that this VM has no `.env`. caniuse-lite is 13 months old and was not updated.

`db:*` and `auth:pruefen` were not run. Native App/Auth/Vercel for the evidence commit is a separate exact-head run started by the push. It is not recorded as green in this file.

## Security

No new route, secret, service role, or auth change. An older stay error stays visible and does not claim the write was cancelled. The connection unconfirmed alert is unchanged.

## Datenbank

No migration, RLS, grant, or generated type change.

## Kosten

No new dependency, provider, model call, or running cost.

## Dokumentation

STATUS, REPORT, SELF_REVIEW, HANDOFF, and `docs/evidence/manual-journey-editor-completion-1/rerun-provenance.json` describe this head. TASK, PLAN, and both addenda were not edited.
