# R107-M self-review — 2026-10-25

Author: **Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1**. This note is not an independent Technical-Lead review and not a PASS.

Reviewed tree for the runtime proof: `b93520b622c470b208281da73092da4622e3829c` at `ddd1f7eace34519996ec686223d684102a933baa`.

## What I checked

- Invalid collection addresses return before `from('trips')`. The 251-row walk calls `reisenSammlungLaden` and sees six `limit(49)` reads.
- Literal wires for `*`, `\`, `"`, and `a,b)` match the plan, including the backslashes `zitiere` adds. U+2028-only and U+2029-only search trim to an empty needle. U+754C repeated 120 times is the 626-character cursor.
- Timestamp checks use the zone group, not the fractional-second group. Impossible dates, `24:00`, seven fractional digits, and offsets beyond `15:59` fail. The original timestamp text is not rewritten.
- Archive classification accepts only `{ ok: true, wert: null }`. The mounted proof covers a duplicate click, a negative message, `{ ok: true }` without `wert`, the exact success object, one refresh, and absence moving the record to the protocol without clearing the acknowledgement.
- Navigation proof covers A → B → A before the URL moves, a late own landing, return to A superseding B while late B props stay off the list, history as a `url` intent, disabled retry and continuation while the URL and the adopted result differ, the same error releasing only on a new result object, the 8000ms lease, a newer commit surviving the old lease, and a synchronous `push` throw that leaves the newer clear intent.
- The collection id and a DOM mark set on the same document survive those transitions. A new document starts without that mark. `useId()` is `_r_0_` on each fresh root, so the proof does not treat that string as a cross-document identity.
- `KontoReisenGruppen.tsx`, `archiv-aktionen.ts`, `suchfilter.ts`, `liste-grenze.ts`, and the TASK file are unchanged. `reisenLaden` source assertions still require cap 200, one `from('trips')`, and `lese<`.

## What I will not claim

I did not run hosted SQL, RLS, a signed-in browser session, Production, or a physical device. The mounted page is esbuild plus the project CSS, not the Next router. `npm test` is not green in this VM because `initdb` is absent. I did not mark Ready and I did not merge.

## Residual risk

The visible navigation intent is state so render does not read a ref. A history `url` intent is opened in an effect on the next paint. The mounted proof waits two animation frames and sees it. A click that lands in that same unfinished frame is not a separate case.

`router.refresh()` follows the live URL. The UI disables that control while the adopted result is a different address. A forced click returns before `refresh`. That is a client guard, not a server lock.

The device-calendar effect warns under `react-hooks/set-state-in-effect`. Removing it would classify groups during hydration. I kept the effect.
