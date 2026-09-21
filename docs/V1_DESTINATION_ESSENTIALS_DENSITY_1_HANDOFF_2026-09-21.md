# V1 Destination Essentials Density 1 — Handoff

Stand: 21. September 2026  
For: ChatGPT / Technical Lead. Old-head gates do not approve a changed head.

## What to open

1. Draft PR #522 / issue #521  
2. Binding task `docs/V1_DESTINATION_ESSENTIALS_DENSITY_1_TASK_2026-09-21.md`  
3. STATUS / SELF_REVIEW with this prefix  
4. Evidence `docs/evidence/v1-destination-essentials-density-1/`  
   - `manifest.json` — product tree `6f8cd923`, clean, compiled CSS 104346 bytes  
   - before/after 390 and 1024: `screenshots/empty-three-{before,after}_{390x844,1024x768}.png`  
   - mixed keyboard: `screenshots/mixed-after_390x844.png`  
   - long names / 200% text: `empty-long-names-after_390x844.png`, `empty-large-text-after_390x844.png`

## Look-first

| Question | Evidence |
| --- | --- |
| All-empty collapse | compact `data-destination-essentials-dichte="kompakt"`; leerText once; ordered stages/dates |
| Zero destinations | still only `leerText`; no compact list |
| Mixed / unknown / stale / unavailable / contradictory | full path; see density-1 tests |
| Height | 390: 790.5 → 292 (−498.5); 1024: 790.5 → 268 (−522.5) |
| Overflow | false on every captured case |
| Details keyboard | mixed: SUMMARY focused, Enter opens details, official source focused, `min-h-11` 44px |
| Derivation unchanged | `lib/trips/destination-essentials.ts` not edited; existing suite green |

## Source vs evidence

| Layer | SHA | Role |
| --- | --- | --- |
| Assigned / live main at freeze fetch | `1103407b` | #518 baseline; 0 behind |
| Task seed | `866fbce0` | versioned task only |
| Tested product tree | `6f8cd923` | implementation + tests + harness; clean for screenshots |
| Evidence/docs freeze | later commit on top of `6f8cd923` | artifacts + STATUS/HANDOFF/SELF_REVIEW only |

## Integration

TL order remains **#520 → #524 → #522**. This writer did not merge or edit siblings. If #520/#524 land first, TL chooses one integration boundary; this agent does not rebase autonomously.

## Stop

**STOP FOR INDEPENDENT TECHNICAL-LEAD CODE + VISUAL/INTERACTION REVIEW.**  
No Ready, no PR merge, no follow-up slice by Cursor.
