# GetYourGuide Visual Discovery Foundation 1 — SELF-REVIEW

Date: 26 October 2026.
Author: Jetnity GetYourGuide Visual Discovery Foundation 1 — Cursor Generation 1.
This is the author's review. It is not an independent Technical-Lead PASS.

## Holds

1. The application renderer and mapping stay null and empty. Tests that inject a renderer must set `herkunft` to `pruefung`. A caller that passes an open gate with `herkunft: 'anwendung'` is forced back to the closed seam.
2. The original day id is computed before the native `?? ersterTag` fallback and is the only id the GetYourGuide block receives.
3. Country inspiration is a separate scope. The no-days view passes `angeforderteTagId={null}` and does not invent a day.
4. The public descriptor is frozen to three keys. Duplicate mappings return null instead of the first match. A land mapping is not a city mapping.
5. `suchlebenszyklus.ts` and the native card path were not edited.
6. No widget attributes, script URL, Analyzer, consent platform, package, workflow, global CSS or production setting was added.
7. The partner account id appears in the task and in the work packet. It does not appear in application or library code. The boundary test asserts that.

## Residual risks I am not calling done

- The official manual widget, destination ids, SPA refresh, Analyzer scope and consent are still unknown. See the work packet.
- Headless Chromium is not a phone. 200% text is a root font-size of 32px, not an operating-system text setting.
- The overflow check uses the document scroll width and ignores elements inside an `overflow-x` scroller, because the existing day chips sit in that scroller. It does not claim those chips are fully visible without scrolling.
- Local PostgreSQL proofs fail in this environment because the binaries are absent. That was true before this slice and is not fixed here.
- `AktivitaetenBereich` still has its pre-existing effect warning. I did not restyle that native state update.
- Refs used by the explicit action are written in `useLayoutEffect`, and the dispose effect captures the renderer after that write. A user click cannot land before layout. I am not claiming a concurrent render started by something other than this block was tested.
- Root startup docs were left untouched on purpose. A later reader who looks only at `ACTIVE_WORK_STATUS.md` will not see this slice. The owned status and handoff are the continuity for it.
- Main was not merged. If main moves after this review, the head must be re-read. This author does not rebase without a Root instruction.

## Not claimed

No live offer, no booking, no commission, no Preview, no CI on this head, no Ready and no merge.
