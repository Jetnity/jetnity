# Official Truth Acceptance Preconditions Adversarial Audit 1 — Handoff

Date: 2 October 2026
Issue: #746
Draft PR: #749
Branch: `docs/official-truth-acceptance-preconditions-audit-1`
Baseline: `main@3775955f6c4e958b26259d98cb9a0bc35dc2075f`
Logical agent: **Jetnity Official Truth acceptance preconditions adversarial audit 1**, Generation 1
Required model: Grok 4.7 High Fast. Not Auto.
Session: https://cursor.com/agents/bc-eeec9607-5592-4bb3-b1ab-c3816351fd5b

This handoff is continuity for the next reader. It is not a Technical-Lead PASS, not Ready, and not a merge.

## State

Read-only audit against `main@3775955f6c4e958b26259d98cb9a0bc35dc2075f`. The branch was 0 behind `origin/main` at fetch. No runtime, test, migration, or global continuity file was edited. #741 was not implemented. #626 was not touched.

Issue #746 does not contain the verbatim Guardian memo. The report classifies the nine claim areas in the binding task. The classifications live in `docs/OFFICIAL_TRUTH_ACCEPTANCE_PRECONDITIONS_ADVERSARIAL_AUDIT_1_REPORT_2026-10-02.md`.

## Blockers before #741

Autonomous promotion is not safe on this chain.

1. **F1 P1.** The registry and host are caller input. A probe labeled `not-a-government.example` as `official_authority` and the retrieval proof accepted `https://www.not-a-government.example/rules`. The catalog RPC is `LOCAL/UNAPPLIED` and is not consulted.
2. **F2 P1 for the store path.** A caller hash field is rejected on the envelope. The dormant store can still accept a hand-built candidate whose hash never met a snapshot.
3. **F3 P1.** The same snapshot hash at a different URL on the same caller source returned `unchanged_source_content`.
4. **F5 P1 as a capability.** The review key is a checksum. It does not bind the validity window. An expired `validUntil` of `2020-01-02` still returned `proceed_to_trusted_fact_entry` on a 2026 clock, and the key did not change when that window was added.
5. **F7 P1.** The intent object has no reviewer, grant, registry, freshness result, or server witness.
6. **F8 P1.** `regelKandidatAkzeptieren` remains necessary. It does not check the packet, the catalog, freshness dates, or `grant`.
7. **F9 P1.** A live fact-entry route must require `grant === 'role'`. `requireAdminPage` succeeds for break-glass. No such route exists today.

## Do not treat these as #741 blockers by themselves

- **F4 P2** while the snapshot stays a return value. Persisting `sourceSnapshot` or the raw URL is a Product-Owner sensitive-storage gate.
- **F6 P2.** Contradictory suggestions are accepted, including `supports_candidate` with conflict reasons and no citations. #734 does not read suggestions. The #741 gate must keep that isolation.
- **F10.** HOLD mode, a live Production store, an unmerged #743, a successful caller hash override, and a same-source review packet were not reproduced. The same-source packet claim is superseded by the #731 architecture reconciliation.

## Next step

Independent Technical-Lead exact-head review of this branch tip. After PASS, the Technical Lead can choose the first remediation Draft. This writer does not open it.

Recommended first remediation, still not started: a pure slice that refuses Official Truth retrieval unless the registry is the server-held catalog object. No Development apply, no Production apply, no route, no call to `regelKandidatAkzeptieren`.

## Boundaries that stay

- Cursor does not Ready and does not merge.
- `requirementsProviderAus()` stays `null`.
- No provider, model, secret, cost, indexing, or launch change came from this audit.
- `docs/ACTIVE_WORK_STATUS.md` and the other global current-state files were left unchanged because the binding task allows only the three lane documents.
- One regulatory cell per packet. A second credential option stays another key.
