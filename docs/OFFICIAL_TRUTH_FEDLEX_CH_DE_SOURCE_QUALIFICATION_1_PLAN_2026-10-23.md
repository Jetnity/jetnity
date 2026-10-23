# Fedlex CH–DE source qualification 1 — plan

Date: 23 October 2026 (Europe/Zurich)
Issue: #977
Draft PR: #978
Branch: `docs/official-truth-fedlex-ch-de-source-qualification-1`
Writer: **Jetnity Official Truth Fedlex CH-DE Source Qualification 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-9b199fb1-5a2e-4e18-b939-632fd811b7e4
Model confirmed before material research and again before this correction: `originalModelName=grok-4.7-high-fast`

This plan records the work actually done. The immutable TASK stays the assignment. The evidence and the decision table live in the [packet](OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_PACKET_2026-10-23.md).

## Goal

Map the existing narrow CH-national / ordinary CH passport / direct CH→DE tourist visa-duty cell to one official Fedlex publication of the Switzerland–EU free-movement agreement, and record what that publication supports. Separate version identity, the conditional source-use basis, and a dormant later acquisition. Do not activate a source or accept a visa rule.

## Review-fix V1

Technical Lead R101 returned CHANGES REQUIRED on delivery head `e1bb544f518949f17491202047b18432e871f850`. Same writer, same session. The correction replaces four decision errors:

- The Fedlex-specific reuse basis is the Publications Act, the Publications Ordinance consolidation of 1 July 2022, Copyright Act Art. 5, and the hashed data-introduction asset. The admin.ch website paragraph is not a waiver demand. An empty JavaScript shell is not a licence prohibition.
- The 15 December 2020 consolidation date is provenance, not invalidity. Zero triples at the RDF resource `.../20260101` do not explain the UI parameter. The provisional protocol signed 2 March 2026 is the concrete later instrument. Signature is not entry into force.
- The narrower ordinary-passport, tourism, direct-route, and dated-stay subset falls inside the broader nationality-plus-valid-passport rule. The canonical encoding gap stays a software gap.
- 371,444 bytes is an adapter-ceiling dependency. A second identical treaty GET is dormant and is not the immediate next step.

## Review-fix V2

Technical Lead R101 accepted D1–D4 on `c8fae045c0ddf58264280853de35fdd873109b9b` and required one D5 continuity correction. The source-original direction in blob `db9b62a0d2637e40eefe25ee49c0e7a08be3b420` is already binding. This Fedlex representation is not approved for real retention. Global D01–D12 stays separately unsigned and is not that direction. No new retention system, SQL, source read, or main integration is part of this correction. Main moved to `de169965f8318a46bdd350eb14df88b0682fc803` and was not merged.

## Modules and files

Read-only: operating mode, the immutable TASK, the existing CH→DE research contract, the closed application pilot, the empty provider, and the prior FZA/EUR-Lex research gap in the 11 October 2026 owner packet.

Edited in this correction, all already task-owned:

- `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_PLAN_2026-10-23.md`
- `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_PACKET_2026-10-23.md`
- `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_STATUS_2026-10-23.md`
- `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_SELF_REVIEW_2026-10-23.md`
- `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_HANDOFF_2026-10-23.md`

The TASK file stays byte-for-byte unchanged. No runtime, registry, extractor, migration, fixture, workflow, dependency, or existing-document edit.

## Database, API, cost, security

No database call, migration, API route, secret, provider call, or new recurring cost. Public HTTPS reads of the named official pages and the documented Fedlex SPARQL endpoint only. No Jetnity observer, loader, or probe. No raw legal body committed. The treaty HTML and the Copyright Act HTML were not re-fetched. Local `pdftotext` extracted the protocol PDF and is not a repository dependency.

## Risks accepted in the plan

The Fedlex HTML app can return a JavaScript shell. That shell is not the statute and is not a licence prohibition. Index text is labelled as index text. `fedlex.data.admin.ch` robots disallow `/filestore/*`; the historical treaty read used `www.fedlex.admin.ch`. Intranet exemplar URLs are out of bounds. EUR-Lex legal/reuse pages and BP1 pages stay untouched. A consolidation date and a signed protocol are different facts. Main may move; do not rebase.

## Tests

Documentation-only. No runtime, database, or product-build claim. `git diff --check` on the owned Markdown. Identity of head, tree, main, and merge-base recorded at handoff.
