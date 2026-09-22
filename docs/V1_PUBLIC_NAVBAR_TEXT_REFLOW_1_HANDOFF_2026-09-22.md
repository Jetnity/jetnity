# V1 Public Navbar Text Reflow 1 — Handoff

Stand: 22. September 2026  
Status: **IMPLEMENTATION COMMITTED / AFTER-EVIDENCE PENDING / DRAFT / NOT READY / NOT MERGED**

## For the next reader

This is Generation 1 of **Jetnity V1 public navbar text reflow 1**, session `bc-27f8ce53-e09e-43d6-9778-7a131c6cdec4`. Immediate review fixes reuse this session. Not #532 and not #534.

Read: task, STATUS, DECISION, this handoff, SELF_REVIEW, live Draft PR #536, then live `origin/main` and parallel #534.

## Exclusive ownership

Runtime write: `components/layout/PublicNavbar.tsx` presentation/layout only.  
Own docs/evidence listed in STATUS.  
#534 owns `app/(public)/page.tsx` first hero. TL integrates #534 first, this PR second. No autonomous merge/rebase.

## What changed

Natural `min-h-[72px]` wrap row, `min-w-0` clusters, menu uses remaining viewport instead of `100dvh-72px`. Session/sign-out/GastCreateLink/routes unchanged.

## Stop rule

Cursor does not mark Ready, merge, or start a follow-up slice. Independent Technical Lead reviews the exact freeze head.
