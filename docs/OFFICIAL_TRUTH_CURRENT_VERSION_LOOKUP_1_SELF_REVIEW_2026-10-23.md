# Official Truth Current-Version Lookup 1 — SELF_REVIEW

Date: 23 October 2026 (Europe/Zurich)
Writer: **Jetnity Official Truth Current-Version Lookup 1 — Cursor Generation 1**
Session: https://cursor.com/agents/bc-16e2789c-fc9b-4bbc-925b-ba43273b6cc3
Actual model: `grok-4.7-high-fast`

This self-review is not a Technical-Lead PASS. It does not authorize Ready or merge.

## Scope check

The change stays inside the allowlist: the new lookup directory, one focused test, one CLI-named migration `20261023153726_official_truth_current_version_lookup_1.sql`, and task-owned PLAN/STATUS/SELF_REVIEW/HANDOFF. TASK V1, V2 and V3 blobs are unchanged. No custody module, provenance module, shared schema, package, workflow, role, or table was edited.

The migration creates one `SECURITY DEFINER` function, revokes `PUBLIC`, and grants `EXECUTE` only to the existing `ot_original_reader`. It does not create a table, role, policy, or writer. It is installed only inside the disposable cluster. Hosted apply is not authorized.

## Correctness

Selection order is witness lock, count ceilings, accepted-set completeness, receipt presence and byte ceilings, then verification of every accepted receipt. A missing or mismatched competitor refuses the whole lookup. Two still-active matches return `ambiguous` with a null fingerprint. Terminal `withdrawn`, `conflicted`, `superseded` and `expired` events drop that version only after it has been classified. Source withdrawal, profile withdrawal and expiry without that event still fail inside `readCandidate` and are not turned into success.

The second synthetic receipt is a proof-time shift of the admitted `regulations.example` primary cell. It does not invent a source, profile, or domain. Supersession is an explicit lifecycle event, not an inference from the newer receipt.

The calendar adjustment calls `contentEvidenceVersionV2` from the focused test. A non-test importer would fail the existing content-identity allowlist. No allowlist amendment was required.

## Findings

| Level | Finding |
| --- | --- |
| P0 | None observed in the local proof. |
| P1 | `origin/main` moved from `5269b9192a2300c6c03fc8659964583130d2d1d1` to `de169965f8318a46bdd350eb14df88b0682fc803` by merging #972 and #973. Path sets are disjoint. This branch was not rebased. Integration belongs to the Technical Lead. |
| P2 | The migration is hosted-UNAPPLIED. Applying it, or treating the returned fingerprint as a reusable positive cache, would cross the task boundary. |
| P2 | CI and Preview on the final head were not available as local evidence. A green check on an older head does not bind this head. |
| P3 | Full `eslint .` still reports 146 pre-existing warnings and 0 errors. Four pre-existing suite skips remain. |

## Residual risk

`LocalPgError` keeps the SQLSTATE and not the message. Structured outcomes are rows. `check_head` and `readCandidate` failures stay exceptions (`25000`, `55000`). A caller that ignores the open-transaction contract can release the SHARE lock between selection and custody proof. The TypeScript entry does not open that transaction itself; the proof and the function comment state that the caller owns it.
