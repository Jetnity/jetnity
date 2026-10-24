# R105 C independent final-head runners — PREPARED, NOT EXECUTED

Prepared on 24 October 2026 for the root Technical Lead. No final-head execution has occurred. Root must supply the final integrated exact checkout, full head and full tree before running.

## Commands

Each runner takes exactly the same positional arguments: `REPO FULL_HEAD FULL_TREE`.

```sh
node /tmp/jetnity-r105-c-final-independent-mLxGm4/flight/run.mjs /tmp/EXACT_CHECKOUT FULL_HEAD FULL_TREE
node /tmp/jetnity-r105-c-final-independent-mLxGm4/stay/run.mjs /tmp/EXACT_CHECKOUT FULL_HEAD FULL_TREE
node /tmp/jetnity-r105-c-final-independent-mLxGm4/preset/run.mjs /tmp/EXACT_CHECKOUT FULL_HEAD FULL_TREE
```

The checkout path must match `/tmp/jetnity-[A-Za-z0-9._-]+`. Heads and trees must each be 40 lowercase hexadecimal characters. Browser runners need permission for a loopback-only HTTP listener and an isolated local Chromium process. They use the retained Chromium binary at `/tmp/jetnity-r104-browsers/chromium-1187/chrome-linux/chrome`, and dependencies from the supplied checkout's node_modules. No personal browser or hosted environment is used.

Every invocation creates a fresh unique output directory, copies its runner and fixture there, and writes `result.json`, screenshots where applicable, and `manifest.json`. No historical output is overwritten. Exact HEAD/tree, clean checkout and source bytes against Git are checked before testing. Source hashes, HEAD/tree and clean status are checked again at the end. Failure flags, unexpected case counts, source drift and harness errors all produce a nonzero exit.

## Flight — nine existing cases unchanged

The nine flight-case body is byte-identical to the original prepared `/tmp/jetnity-r105-c-v3-independent-runner/run.mjs`. Its SHA-256 is `b0a796ba0d59493d5611f9a52f3ab06b8d9e3f1304f847b453dc82c50c663e6c`. The copied mount fixture is byte-identical. The original runner and fixture were not modified.

Only the runner envelope changes: explicit tree argument, automatic input-directory resolution, fresh output prefix, asynchronous read-only Git commands, clean/source-byte checks, eight source bindings, exactly-nine-case acceptance, nonzero exit on false case/status, and output artifact manifest. `flight/adaptation.diff` records these changes.

Success status: `THREE_CONTROLS_AND_SIX_OWNERSHIP_CASES_PASS`, exactly nine true case flags, empty browser diagnostics and `cleanExactSource: true`.

## Stay — six reproduced failures unchanged, three current-owner controls added

The six original two-stay regression case body is byte-identical to `/tmp/jetnity-r105-c-stay-focus-ahsghe/run.mjs`. Its SHA-256 is `839a419a29b4305af749cf52f3bbfeebd2798baee95da041e8361daf206d58b1`. The copied mount fixture is also byte-identical. The prior failure evidence directory was not changed.

Three additional cases leave B untouched and test ordinary A success/domain/rejection. They require exact focus on A's existing trigger or genuine error alert, appropriate saved/error/draft/pending state, one callback and unchanged B state. These controls prevent a blanket suppression of callback focus from passing the regression.

The runner envelope is parameterized and strengthened as described above. `stay/adaptation.diff` records both envelope changes and the explicit three-control addition.

Success status: `NINE_STAY_CASES_PASS`, exactly nine true case flags, empty browser diagnostics and `cleanExactSource: true`.

## Preset — bounded pure helper regression

The actual helper normalizes A(origin `a\u001fb`, destination stage `c`) and B(origin `a`, destination stage `b\u001fc`). Distinct normalized tuples must have distinct keys. Repeated evaluation and an equivalent copied input object must retain the same key. The runner does not re-prove full Trip schema validity; it tests the actual normalized helper and key function. It has no browser, server or network access.

Success status: `PRESET_KEY_REGRESSION_PASS`, exactly three true case flags and `cleanExactSource: true`.

## Verification performed while preparing

Only JavaScript syntax checks and source/delta/hash comparisons. No browser launch, application execution or final acceptance was performed. These test runners are local synthetic evidence helpers, not product changes, a layout/hosted-account pass or Technical-Lead integration authorization.
