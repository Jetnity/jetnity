# Fedlex CH–DE source qualification 1 — plan

Date: 23 October 2026 (Europe/Zurich)
Issue: #977
Draft PR: #978
Branch: `docs/official-truth-fedlex-ch-de-source-qualification-1`
Writer: **Jetnity Official Truth Fedlex CH-DE Source Qualification 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-9b199fb1-5a2e-4e18-b939-632fd811b7e4
Model confirmed before material research: `originalModelName=grok-4.7-high-fast`

This plan is the bounded reconstruction of the work actually done. The immutable TASK stays the assignment. The evidence and the decision table live in the [packet](OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_PACKET_2026-10-23.md).

## Goal

Map the existing narrow CH-national / ordinary CH passport / direct CH→DE tourist visa-duty cell to one official Fedlex publication of the Switzerland–EU free-movement agreement, and record what that publication does and does not prove. Separate version identity, source-use basis, and a smallest later acquisition proposal. Do not activate a source or accept a visa rule.

## Modules and files

Read-only: operating mode, the immutable TASK, the existing CH→DE research contract, the closed application pilot, the empty provider, and the prior FZA/EUR-Lex research gap in the 11 October 2026 owner packet.

Writes, all new:

- `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_PLAN_2026-10-23.md`
- `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_PACKET_2026-10-23.md`
- `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_STATUS_2026-10-23.md`
- `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_SELF_REVIEW_2026-10-23.md`
- `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_HANDOFF_2026-10-23.md`

No runtime, registry, extractor, migration, fixture, workflow, dependency, or existing-document edit. The local `next-env.d.ts` dirty tree is an environment artifact and is not part of this delivery.

## Database, API, cost, security

No database call, migration, API route, secret, provider call, or new recurring cost. Public HTTPS reads of the named official pages and the documented Fedlex SPARQL endpoint only. No Jetnity observer, loader, or probe. No raw legal body committed.

## Risks accepted in the plan

The Fedlex HTML app can return a JavaScript shell. That shell is not a licence and not the statute. `fedlex.data.admin.ch` robots disallow `/filestore/*`; the same current HTML file is published on `www.fedlex.admin.ch`, whose robots allow `/`. Intranet exemplar URLs are out of bounds. EUR-Lex legal/reuse pages and BP1 pages stay untouched. A consolidation date is not current legal force. Main may move; do not rebase.

## Tests

Documentation-only. No runtime, database, or product-build claim. `git diff --check` on the owned Markdown. Identity of head, tree, main, and merge-base recorded at handoff.
