# R105 B — targeted layout diagnosis at 84c496c0

**Root-confirmed bounded P2 layout failure.** This separate note supersedes only the pending-cause diagnosis in the [earlier failed-run archive](../r105-b-tl-84c496c0-2026-10-24/README.md). All 31 paths of that archive, including its dated pending-diagnosis README, remain byte-identical. The original montage failure remains a failure; no final layout PASS, Ready, merge or Production acceptance follows.

Exact head **84c496c037cff9e14102ff0fe3e6686fee33d5a6**, complete tree **3996b1bbe5eb11197c6e6450f0288d2ecbb3120c**. Root's targeted capture ran **2026-10-24T23:11:52.600750+00:00–2026-10-24T23:11:55.913903+00:00** and retained the clean exact source and stylesheet before/after. Its result SHA-256 is `fdd3278f3daec5b594a7a6c405a920414179b26dfb03afc8fb87b4c8bb32f23d`. The actual command still exited **1** on `liste 320 Überlauf 37`; the diagnostic successfully captured that existing failure immediately before the unchanged assertion.

## Actual DOM measurements

| Surface | Recorded measurement |
| --- | --- |
| Viewport / document root | 320×700 px; client width 320 px; scroll width 357 px; root font 32 px |
| Heading `Bestätigte Buchungen` | Heading box width 320 px; text Range right edge **356.921875 px**; computed font size **60 px**, line height **72 px**, letter spacing **−2.4 px** |
| Heading wrapping | `white-space: normal`, `overflow-wrap: normal`, `word-break: normal`; the long word can exceed the available width |
| `Planpunkt öffnen` link | Left **41 px**, right **329.875 px**, width **288.875 px** inside the card's **238 px** content area; a second roughly 10 px viewport overrun is present in the DOM |

The measured computed font family is the global system-UI stack. The separately preserved static analysis confirms that `app/layout.tsx` imports the project globals and does not establish a special Next-font-class requirement for this surface. Its DejaVu font advances are explicitly static estimates (`browserMeasurement: false`), not a claim that the browser's resolved glyph font was independently identified.

**Root visually inspected the single actual 320×700 viewport screenshot** `captured-failure/capture/overflow-320.png` and confirmed the bounded failure. The screenshot was requested with `fullPage: false`; it is not a full-document capture. The Planpunkt/card finding is additionally supported by recorded DOM rectangles, not a claim that every off-screen card was visually inspected. This is not the complete 56-measurement/seven-state montage acceptance, native zoom, a real device, a screen reader or a hosted Production probe.

## Instrumentation and authorship

`controller/diagnostic-run.py` is the current Root controller used for the completed capture. Its inserted capture block reproduces `captured-failure/diagnostic-montage.ts` exactly from the already archived adapted montage. Removing that capture block reconstructs the prior source; the original overflow assertion remains. The source-author metadata belongs to **Jetnity Account Booking Folder Completion 1 — Cursor Generation 1**, session **bc-a34030c7-4c19-4c9f-863f-193cfdfa34da**, model **grok-4.7-high-fast**. Root performed the targeted browser capture and visual inspection. The helper produced only the preserved read-only static diagnosis. The archival reviewer copied and hash-checked artifacts without running a test or browser.

The first capture attempt under `initial-observer-tool-error/` failed in Root's added instrumentation with `ReferenceError: __name is not defined`. Its controller assertion then stopped before `result.json` was written. Those four existing original files are preserved; no result record is invented, and this observer-tool error is not classified as a new product failure. The current controller is not misrepresented as the initial controller version.

Both attempts' available passive observer records retain their original diagnostic arrays. The initial tool error and the later successful diagnostic capture do not rewrite the original action PASS / montage FAIL outcomes. The static helper's earlier hypothesis wording remains unchanged as evidence of its own read time; this new note records Root's later bounded P2 classification.

## Limits and integrity

CSS remains **LOCAL_PROJECT_POSTCSS_COMPILATION**, SHA-256 `6ea356ae1284e432eae27e9511923cf43550a4f80b34ac63c7235424e1f22af8`, not an assertion of Next Production-CSS byte equality. Browser work used the isolated synthetic surface only. Native CI, Preview, hosted account/database truth, Production state and a complete TL verdict remain separate.

`archive-manifest.json` maps all **13 original diagnostic artifacts** to their original absolute paths, byte sizes, SHA-256 and Git blobs. One screenshot and the complete DOM capture are included without editing. No original failure-archive file is changed. Any correction and subsequent proof must occupy a new version.
