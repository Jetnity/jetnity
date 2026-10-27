# Activities UX and official GetYourGuide expanded offers 1 — PLAN

Date: 27 October 2026. Writer: Jetnity Activities UX and GetYourGuide Expanded Offers 1 — Cursor Generation 1.

This file records the plan published on Draft PR #1043 before product edits, plus the height decision that the task allowed only after a real load. It does not revise immutable TASK V1.

## Session

`originalModelName`: `grok-4.7-high-fast`. Metadata source: cursor-cloud `run-info`, field source `scm`. Logical name: Jetnity Activities UX and GetYourGuide Expanded Offers 1 — Cursor Generation 1. Session `bc-e917b7cb-fdc2-43ca-9dcd-53a537538210`, https://cursor.com/agents/bc-e917b7cb-fdc2-43ca-9dcd-53a537538210. No Auto fallback.

## Baseline rechecked before and during implementation

`origin/main` `b5e0532c810df8d89749fb0a35380a081f765cab`, tree `f56b72f4c49666fd187cd08c04d6c91216d497a4`. Merge-base with this branch is that commit. Before these implementation commits the branch was 1 ahead / 0 behind, seed `3c0fc3593d0f6fc22b50832b8d3827d29cb37291`. Machine mode `NORMAL`.

## F1

On native `unavailable`, show `Die Suche nach Aktivitäten für diesen Reisetag ist derzeit nicht verfügbar.` Hide the positive coverage sentence only in that state. Rename only that retry to `Suche erneut prüfen`. Leave empty, partial, success and error copy, the hard-off, provider factories and adoption unchanged. A native click must not load GetYourGuide.

## GetYourGuide

After the existing explicit load, the official manual widget requests `data-gyg-number-of-items="12"`. `Mehr Aktivitäten anzeigen` requests a fresh isolated manual widget at 24. `Weniger anzeigen` restores 12. The server allowlist is only 12 and 24. A missing `anzahl` stays 12. The count is presentation state, not lifecycle identity. Partner stays hard-coded `2MQHT6Z` inside the child document. Opaque sandbox, Analyzer, public destination and zero provider requests before load stay.

The official Widgets 101 text allows choosing the manual count and does not prove a maximum of 12 or 24. Real cards are counted only in this QA harness, from `activities.frame` anchors, and are not a runtime catalogue.

## Height

Keep 2400 until a real load’s explicit loader pixel height exceeds it. The first probe did: Portugal and Kreta at 12 were 4685px, and Bangkok at requested 24 was 7744px, while the parent rejected those messages and stayed at `40rem`. Both the child script and `gygHoeheAnnehmen` then moved to the finite cap 12000. No `scrollHeight`, no remembered maximum. CSP SHA-256 recomputed.

## Out of scope

No provider contract, key, Viator, payment, database, Auth, RLS, migration, new cost, public indexing, or follow-up slice. Draft only. Ready and merge stay with the Technical Lead.
