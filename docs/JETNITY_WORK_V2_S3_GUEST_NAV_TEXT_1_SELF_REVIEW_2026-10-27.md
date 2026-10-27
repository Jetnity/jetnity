# V2-S3 Guest Navigation and Large Text 1 — SELF_REVIEW

Author review only. Not an independent Technical-Lead PASS. Not Ready. Not merged.

## Scope check

Owned paths match the task. The mode-nav source test was updated because it locked the overlapping `grid-cols-2` layout. The harness stubs Supabase and `next/link` only inside the Playwright bundle. Production imports are unchanged.

`ACTIVE_WORK_STATUS.md` and `DECISIONS.md` were not edited. The signal is an in-scope notification on the existing store, not a new schema or a second guest authority. Recording it in those shared docs would leave this lane. The omission is deliberate. A later docs lane can point at this handoff.

## Behaviour I checked in source

- Failed `schreibenVersuch` returns false and does not schedule the event. `schreibenMuss` still throws `SpeicherFehler`.
- `gastreiseAnlegen` still throws `GastreiseBestehtFehler` before a second write.
- `sitzung !== 'gast'` still passes `aktiv: null` into `genericCreateCtaFuerSitzung`.
- Invalid active JSON still returns `aktiv: null` from `gastspeicherLaden()` without deleting the bytes.
- Event name `jetnity:gastspeicher-aktualisiert` has no trip id. `detail` is omitted.
- No `postMessage`, BroadcastChannel, polling, or storage schema change.
- `text-sm` is still the label size. `sm:whitespace-nowrap` remains for the scrolling row. Sticky class and `detail === 0` remain.

## What the mounted harness actually did

Headless Chromium, synthetic session stub:

- Guest page A creates A, discards, creates B. Header and footer on A and on a second page in the same browser context follow A, then the empty create target, then B. Navigation entry count stays 1.
- A forged `StorageEvent.newValue` of `trip-injected` does not change the href and does not write.
- Malformed `{` written in the other page fail-closes the observer and leaves `{` stored. The observer's write counter does not increase.
- A context seeded with guest bytes and `sitzung=konto` stays on "Reise planen". `sitzung=halten` stays on "Reise planen" until the stub resolves a guest session, then it reads the current bytes.
- Label rectangles at 320/390/768/1440 and root 16px/32px do not overlap. Text boxes sit inside the buttons. Computed font size is 14px or 28px. Document `scrollWidth` does not exceed `clientWidth` by more than 1px. After scroll, the 72px sticky header does not cover the buttons. Enter sets `{ ansicht: 'organisieren', tastatur: true }`. A pointer click sets Vorbereitung with `tastatur: false`.

## R1 browser launch

`5671377921` required the four mounted tests to execute on the GitHub Ubuntu runner. The hook no longer depends only on the Playwright-managed headless shell. I ran both launch paths locally: managed Chromium `140.0.7339.16` and, with that cache hidden, system Chrome `148.0.7778.96`. Both completed 5 tests, 0 failures, 0 skipped.

The hosted runner then executed the same hook. Run `40549850593`, App job `122350326327`, commit `1477653a2a4ced3aff3a351d3357cdc646ad5ebf`, logged `guest-nav-browser kanal=chrome version=155.0.8059.39`. All four mounted subtests passed there. Job TAP was 7483 tests, 7481 pass, 0 fail, 0 cancelled, 2 skipped. Auth job `122350326756` passed. The Vercel status on that commit is success. This self-review does not turn that into a Technical-Lead PASS.

## Residual risk

- Below 640px the four modes are a vertical list instead of a 2×2 grid. That is the stack chosen so a 28px single word cannot collide. From 640px up they remain one scrolling row.
- The writing document does not observe its own raw `localStorage.setItem`. Only Jetnity's confirmed active-key writes, and other documents' `storage` events, refresh the CTA.
- Author screenshots and this review do not replace Technical-Lead review. The green hosted run is exact to `1477653a`.
- Local `npm test` is not fully green on this machine: 7360 pass, 11 fail, 5 skip. The failures are missing local PostgreSQL 16 binaries in official-truth proofs. The hosted App job on `1477653a` did not show those failures.
