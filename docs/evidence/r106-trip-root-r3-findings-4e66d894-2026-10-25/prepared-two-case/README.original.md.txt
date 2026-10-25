# R106 T — two residual cases at exact R2 head

Prepared only. **Not executed by this helper.** Root owns review and execution.

The source-bound probe `trip-r2-residual-acceptance.ts` accepts exactly `4e66d8948046423656feb6b95b8562e546e82b19`, with the existing Node 22 / committed manifest / checkout-head / source-blob guard. Its mounted bundle and bundle metadata must be freshly generated for this same head. All earlier five-case scripts and results remain untouched.

## Case 1: later canonical absence

Account create A is accepted and then confirmed by a later matching raw canonical delivery. Both the raw canonical trip and displayed trip contain A. The probe then types a new draft and delivers a fresh same-trip raw canonical snapshot **and** displayed trip without A. It waits for the account delivery counter to advance.

It records the old confirmation, all remaining ref receipts and messages, draft values, canonical input refs and write/read/delete counts. It asserts no additional writes, no local delete, retained new draft, and no unqualified current-visible confirmation for the absent ref. Honestly labelled history is allowed. This case does not confuse display lag with a canonical absence.

Source rationale: `EigeneReisevorbereitung.tsx` 124–129 selects the latest intent for every absent ref; 296–297 renders its unchanged message. Workflow 603–610 / 655 excludes confirmed and reconciled receipts from later read classification. TASK 4.6/4.7 and PLAN 174–178 already make updated props and removed targets explicit boundaries.

## Case 2: unopened B edit control receives keyboard focus

The complete inspected list and unchanged Host have no parent `onFocusCapture` or equivalent ownership handler. The unopened `Titel bearbeiten` button at list line 417 has no `onFocus`; its click handler invalidates ownership only when activated. The list's existing row has `tabIndex=-1`.

After create A is pending, the probe first uses an ordinary trusted pointer click on B's existing non-control title. If that naturally focuses B's row, trusted Tab then moves to its unopened edit button. The probe logs trusted pointer/key/focus events without intercepting or changing them. A is then accepted and a matching guest read completes. B's button must keep focus.

If this browser does not naturally focus the existing row from the pointer click, the probe records that fact and explicitly focuses that **existing production row** to arrange the trusted Tab move. Such a result is labelled a **bounded onFocus-contract test**, not a complete ordinary keyboard journey. No extra control, private React property, direct React handler call, synthetic KeyboardEvent or handler removal is used. The output records which arrangement occurred.

The create-submit focus variant is omitted because it adds no distinct principle and could be masked by earlier already-instrumented focus transitions.

## Setup differences and boundaries

The probe reuses the inspected production list/hook and unchanged author `flaeche.tsx` Host through the existing guarded builder. No product or Host source is adapted. Review-only additions are two new sequences, callback-count snapshots and passive DOM event logging. Playwright uses its normal default browser launch with no added flags. External requests are aborted and counted.

The page is unstyled HTML at 390×844. This proves neither project CSS/layout nor native-device accessibility. It is not real guest storage, full TripWorkspace, the full Next router, hosted Account, Supabase/RLS or Production evidence. Case 1 controls canonical props; case 2 controls deferred guest callback/read results.

## Invocation

From the exact checkout, after root creates a committed manifest and guarded bundle for `4e66d894`:

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/r106-review-browsers \
/root/.npm/_npx/52027bd8fc0022aa/node_modules/node/bin/node \
  --import ./scripts/server-only-test-register.mjs --import tsx \
  /tmp/r106-review-evidence/trip-r2-residual-acceptance.ts \
  --repo /tmp/jetnity-r106-t-r2-review \
  --head 4e66d8948046423656feb6b95b8562e546e82b19 \
  --sources <committed-4e-source-manifest.json> \
  --bundle <guarded-4e-bundle.js> --bundle-info <guarded-4e-bundle-info.json> \
  --out <fresh-external-residual-result.json>
```

The placeholder paths must be replaced explicitly. Existing outputs cannot be overwritten. A setup/fixture failure is not automatically a product finding. Retain the observed arrangement and detailed case output when assessing either assertion.
