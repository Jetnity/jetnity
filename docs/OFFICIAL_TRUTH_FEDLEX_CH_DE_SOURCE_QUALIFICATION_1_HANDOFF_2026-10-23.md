# Fedlex CH–DE source qualification 1 — handoff

Date: 23 October 2026
Issue: #977
Draft PR: #978
Branch: `docs/official-truth-fedlex-ch-de-source-qualification-1`

## Identity

- Writer: **Jetnity Official Truth Fedlex CH-DE Source Qualification 1 — Cursor Generation 1**
- Session: https://cursor.com/agents/bc-9b199fb1-5a2e-4e18-b939-632fd811b7e4
- `bcId`: `bc-9b199fb1-5a2e-4e18-b939-632fd811b7e4`
- Model: `grok-4.7-high-fast` (`originalModelName` from this run). Dispatch requested Grok 4.7 High Fast. Confirmed again before this correction. No fallback.
- Immutable TASK: `docs/OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_TASK_2026-10-23.md`
- TASK blob: `8488a556a73cbdd5367da226170899ac7c2cb74e`
- Seed head: `0c48bd53475b30f851221aab957175e050cb1abf`
- Seed tree: `93b8ea601abcbbcc1db2724f8d6ee3ed44f15ef4`
- Start main / merge-base: `5269b9192a2300c6c03fc8659964583130d2d1d1`
- First delivery, now superseded as the review head: `e1bb544f518949f17491202047b18432e871f850`, tree `0dea1e61e988814582882d3495f45f58784151f8`
- Re-read main immediately before this correction: `8f64d5fdb819065791235879822b1074205899c0`, mode NORMAL
- Merge-base: still `5269b9192a2300c6c03fc8659964583130d2d1d1`
- Ahead / behind at that re-read, before this correction commit: 2 ahead / 4 behind
- No rebase, merge, cherry-pick, or force-push
- Review head and tree: the commit that adds this correction. Record the SHA from git after the commit. Do not review `e1bb544f` as current.

## What the reviewer should read

1. [Packet](OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_PACKET_2026-10-23.md) — corrected sections A–E, D1–D6, and the revised findings.
2. [Self-review](OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_SELF_REVIEW_2026-10-23.md) — author limits only.
3. [Status](OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_STATUS_2026-10-23.md) and [plan](OFFICIAL_TRUTH_FEDLEX_CH_DE_SOURCE_QUALIFICATION_1_PLAN_2026-10-23.md).

## Result in one paragraph

Review-fix V1 keeps the historical German HTML receipt for SR 0.142.112.681, consolidation applicability 15 December 2020. Annex I Art. 1 covers a national of the other contracting party who produces a valid passport; the narrower ordinary-passport, tourism, and direct-route cell sits inside that rule, while the canonical scope still cannot encode those distinctions. Annex I Art. 5 remains the public-order, security, and health limit. The conditional reuse basis is Copyright Act Art. 5, Publications Act Arts. 19 and 19a, Publications Ordinance Arts. 47 and 49 from the 1 July 2022 consolidation, and the hashed Fedlex introduction asset authorising commercial and other reuse under the broadcasters conditions. The legal-information index still cites repealed Art. 48(2). The broadcasters and legal-information routes were JavaScript shells; their index text is not a body hash. The admin.ch paragraph is not a permission-letter demand. A provisional amending protocol signed 2 March 2026 would replace Annex I only on entry into force and has not displaced the 2020 consolidation. `validFrom` and `validUntil` stay unaccepted. The treaty GET stays dormant. No operator and no time window were named.

## Checks actually run

- Run identity and `originalModelName` before the first retrieval and again before this correction. Same `bcId`.
- Operating mode `NORMAL` on the branch and on `origin/main` `8f64d5fdb819065791235879822b1074205899c0`.
- Public reads listed in the packet for the second window: PublG, PublV, the static introduction asset, the EDA page, the protocol PDF, the Parliament page, and a `dateDocument` `2026-03-02` SPARQL query with zero bindings. WebSearch supplied index text only.
- The treaty `...-html-9.html` and the Copyright Act `...-html-7.html` were not re-fetched.
- `requirementsProviderAus()` on this branch returns null. Application contracts empty. Pilot availability false. Confirmed by the existing files, not by executing the pilot.
- No `npm test`, typecheck, lint, production build, database command, or Jetnity probe. Not claimed.
- `git diff --check` on the correction commit.

## Stop

Independent Technical-Lead review of the correction commit. Cursor does not mark Ready, does not merge, and does not start the dormant acquisition or any other follow-up.
