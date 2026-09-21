# V1 Homepage Tablet Hero Fit 1 — Handoff

Stand: 21. September 2026  
Status: **FROZEN / NOT TL FINAL / NOT READY / NOT MERGED**

## Owner

**Jetnity V1 homepage tablet hero fit 1**, Generation 1  
Session `bc-c2e8ff5a-c507-40a7-b0ac-0ed324dd45da`  
Model Cursor Grok 4.6 High Fast (`originalModelName=cursor-grok-4.6-high-fast`)  
No Auto / no substitute. Immediate review fixes reuse this exact session.

## Delivered

1. STATUS plan locked before the `page.tsx` edit.
2. Compiled-CSS before-proof on unchanged seed homepage: 1024×768 card **195.35px**, tags truncated (`Natur · Kulinarik` client 36 / scroll 84). Historical #506 `home_initial_1024` used only as context.
3. Coordinated `xl` display: two-column grid and decorative card now start together at 1280px. No empty second column when the card is hidden.
4. After-proof at 360/390/768/1023/1024/1279/1280/1440/1920 plus 1024/1440 @32px. 1440/1920 keep the branded card (~401px, tags complete at 100% text).
5. Keyboard/CTA interaction unchanged. Empty submit shows the existing list-validation message. Mutation attempts/completed 0.
6. 1024/200% document overflow attributed to pre-existing navbar / later sections; matched on restored baseline `lg` homepage.

## Changed-path manifest

| Path | Why |
| --- | --- |
| `app/(public)/page.tsx` | two first-hero class changes only |
| `docs/V1_HOMEPAGE_TABLET_HERO_FIT_1_TASK_2026-09-21.md` | binding task (seed) |
| `docs/V1_HOMEPAGE_TABLET_HERO_FIT_1_{STATUS,HANDOFF,SELF_REVIEW,DECISION}_2026-09-21.md` | own continuity |
| `docs/evidence/v1-homepage-tablet-hero-fit-1/**` | capture harness + before/after images + geometry |

Read-only: `StartzielForm`, `GastCreateLink`, navbar, tokens, other homepage sections, #531/#532 files, package/workflows, DB/Auth/provider.

## What a successor must know

- Product/runtime source is `da8db642`. Freeze docs commit will advance HEAD without further runtime edits.
- Live main moved to `65db24b6` because **#531 merged**. This branch is **3 ahead / 9 behind**. Do **not** treat that as authorization to rebase from this writer.
- #532 remains an active Draft and is behind. Do not start or reuse its session.
- Integration remains Technical-Lead-owned. Latest documented order was 531 → 532 → 534 unless TL updates it after the #531 merge.
- Stay Draft. No Ready. No merge. No follow-up slice from Cursor.

## Honest limits

- Local Chromium 148 / compiled Next CSS. Not authenticated Preview/Safari/hardware/WCAG.
- Text-200 scenes are `html { font-size: 32px }`.
- Zero mutation count ≠ observed POST intercept.
- `next-env.d.ts` may be dirtied by `next dev` / `typegen`; not owned, not committed.

## Next owner

Independent Technical Lead. Verify exact freeze head, live main CI/Auth/direct Production separately, and decide whether this presentation slice waits for #532 or is reviewed in parallel. Cursor stops here.
