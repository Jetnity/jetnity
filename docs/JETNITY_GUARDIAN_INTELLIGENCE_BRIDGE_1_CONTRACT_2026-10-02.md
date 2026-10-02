# Guardian Intelligence Bridge 1 — Contract

Date: 2 October 2026
Issue: #747
Canonical inbox: [#748](https://github.com/Jetnity/jetnity/issues/748)
Draft PR: [#750](https://github.com/Jetnity/jetnity/pull/750)
Branch: `os/guardian-intelligence-bridge-1`
Baseline re-read: `main@3775955f6c4e958b26259d98cb9a0bc35dc2075f` (`Merge #743: add owner-only Official Truth reviewer capability`)
Logical agent: **Jetnity Guardian Intelligence Bridge 1**
Generation: **1**
Binding task: `docs/JETNITY_GUARDIAN_INTELLIGENCE_BRIDGE_1_TASK_2026-10-02.md`

This contract is repository continuity. It does not configure the external Guardian / Chief-of-Staff workspace, and it does not prove that workspace can post to GitHub.

## 1. Canonical inbox

[Issue #748](https://github.com/Jetnity/jetnity/issues/748) is the persistent canonical GitHub evidence inbox for material reports from:

- Jetnity Guardian;
- Jetnity Chief of Staff;
- approved read-only Grok intelligence roles named in `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`.

#748 stays open across reports. Handling one report does not close the inbox.

Ordinary Daily automation remains bound by `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_2_DAILY_AUTOMATION_V2_CONTRACT_2026-09-18.md` §6 point 6: the Daily routine does not write GitHub by default. A `NO_MATERIAL` brief stays in the external workspace. This contract adds one later path for a **material** report, as a structured #748 comment, when an already-connected GitHub capability permits it.

## 2. Authority

Guardian remains read-only toward the repository. It may report. It does not fix code, open a branch, open a PR, set Ready, or merge.

Chief of Staff may synthesize and route. A synthesis comment stays evidence. It cites the underlying raw `report_id` values in `evidence_refs`. It does not replace, hide, or delete the raw report.

A #748 report is challenge input. It does not:

- authorize a code change;
- authorize Cursor to fix anything;
- constitute Technical-Lead PASS, CHANGES REQUIRED, BLOCKED, or NO-GO;
- authorize Ready or merge;
- authorize Production, database, Auth, provider, payment, indexing, or launch action;
- replace a Product-Owner gate.

Cursor may consume a finding only when the current versioned task explicitly binds that `report_id` and the latest Technical-Lead receipt on #748 for that id is `CONFIRMED` or `PARTIAL`. `PARTIAL` authorizes only the confirmed part named in that task. `NOT_REPRODUCED`, `STALE`, `SUPERSEDED`, and a report with no Technical-Lead receipt authorize nothing.

## 3. Material threshold

Post a report to #748 only when it is material. A report is material when any of these is true:

- severity is `P0` or `P1`;
- `needs_tl_review` is `true`;
- `needs_po_decision` is `true`;
- a finding of class `RISK` bears on current `main`, an exact head under review, a release gate, or a reserved Product-Owner gate.

`NO_MATERIAL` daily output stays off #748.

## 4. Report envelope

Each report comment starts with this marker line:

```text
jetnity_guardian_inbox: report
```

Required fields:

| Field | Rule |
| --- | --- |
| `report_id` | Stable id from §5. |
| `source_agent` | Canonical role name. |
| `generated_at` | ISO-8601 timestamp with timezone. Metadata only. Not part of `report_id`. |
| `observed_main_sha` | Full `origin/main` SHA observed at generation. |
| `observed_heads` | Relevant PR, issue, and exact-head SHAs. Empty array when none. |
| `scope` | What was examined. |
| `findings` | Each item has `class` = `FACT` \| `INFERENCE` \| `RISK` \| `OPPORTUNITY` \| `RECOMMENDATION`, `severity` = `P0` \| `P1` \| `P2` \| `P3` or `none`, and a sanitized `summary`. |
| `evidence_refs` | URLs, SHAs, repository paths, issue/PR numbers, or hashes. |
| `systems_checked` | Systems actually read. |
| `systems_not_checked` | Systems explicitly not read. |
| `needs_tl_review` | `true` or `false`. |
| `needs_po_decision` | `true` or `false`. |
| `supersedes_report_id` | Previous `report_id`, or empty. |

The comment body is sanitized summary and references. It contains no secret, token, PAT, webhook credential, environment value, or raw traveller/passport/MRZ/biometric/health payload. When a finding cannot be stated without that payload, name the data class and a hash or location only.

## 5. Dedupe and idempotency

`report_id` is `gib1:` plus the lowercase hex SHA-256 of the canonical JSON object below. Canonical JSON uses UTF-8, sorted object keys, no insignificant whitespace, and arrays sorted and de-duplicated.

```json
{
  "evidence_refs": [],
  "finding_fingerprint": "",
  "observed_heads": [],
  "observed_main_sha": "",
  "scope": "",
  "source_agent": ""
}
```

`finding_fingerprint` is the lowercase hex SHA-256 of the canonical JSON array of `{ "class", "severity", "summary" }` objects, sorted by `class`, then `severity`, then whitespace-normalized `summary`.

Before posting, read #748 comments. If a comment whose marker is `jetnity_guardian_inbox: report` already contains that `report_id`, do not post again. A Technical-Lead receipt that merely cites the id is not a report and does not satisfy this match.

A changed finding set, a changed evidence set, or a recheck on a new `observed_main_sha` or head is a new `report_id`. Set `supersedes_report_id` to the prior id. Reusing an id for different content is a contract break. Creating a second id for identical canonical content is a duplicate and must not be posted.

## 6. Technical-Lead receipt

The Technical Lead may acknowledge a report with a later #748 comment. The comment starts with:

```text
jetnity_guardian_inbox: tl_receipt
```

Required fields: `report_id`, `classification`, and `linked_work` when a remediation issue or PR exists.

`classification` is exactly one of:

- `CONFIRMED`
- `PARTIAL`
- `NOT_REPRODUCED`
- `STALE`
- `SUPERSEDED`

The latest receipt for a `report_id` is the current triage state. Receipts are not reports and are not deduped by `report_id`. A receipt does not edit or delete the original report.

## 7. Stale heads

A report whose `observed_main_sha` or bound exact head is not the live head under review stays in #748 as history. It cannot gate, block, or authorize the current head until a recheck posts a new `report_id` that names the current SHA and sets `supersedes_report_id`. The Technical Lead marks the old report `STALE` when that is the triage result. Cursor does not apply a stale report to a newer head.

## 8. Startup read

A new Technical-Lead chat, during startup and live reconstruction, reads unread and material #748 comments after `JETNITY_START_HERE.md` and a fresh `origin/main` read.

- **Unread:** no later `tl_receipt` on #748 names that `report_id`.
- **Material:** §3.

An unread report is evidence waiting for triage. It is not a confirmed defect and not a task assignment.

Guardian runs that can read GitHub do the same before claiming continuity is current. This slice does not start those runs.

## 9. External history

Artifacts under the external workspace paths such as `/workspace/jetnity/intelligence/routing/staging/...` remain source history. This bridge does not read them, rewrite them, or copy them into git. Cursor does not mutate that workspace from this slice.

Automatic posting to #748 is **not proven**. In this session, `issue_read` comments for #748 returned an empty list. The issue was created at `2026-10-02T17:09:16Z`. Silence is not success. The earliest proof is a real report comment on #748, independently read after the external system posts it.

The one-time setup text is `docs/JETNITY_GUARDIAN_INTELLIGENCE_BRIDGE_1_EXTERNAL_SETUP_PROMPT_2026-10-02.md`. It has not been sent by this slice.

If the external system has no GitHub issue-comment capability, it reports that once and stops. It does not recruit the Product Owner as a permanent copy path, and it does not request a new token, PAT, webhook, or credential.

## 10. Separate from Issue #746

[Issue #746](https://github.com/Jetnity/jetnity/issues/746) is a separate read-only adversarial audit of Official Truth acceptance preconditions. It shares the same baseline SHA and the same calendar day. It is not the inbox, not this writer, and not implemented here.

This contract does not classify #746's targets, does not change acceptance runtime, and does not open a remediation slice. A later material report about those targets belongs on #748 under this envelope. A Cursor fix for any of them waits for a Technical-Lead receipt and a separately versioned task.

## 11. Boundaries of this slice

In force:

- machine mode `NORMAL` in `.jetnity/operating-mode.json`;
- `AI_OS_BUILD_HOLD` is historical metadata inside that file, not the live mode;
- Draft #750 stays Draft;
- Cursor does not Ready, merge, or start a follow-up slice;
- no product runtime, Auth, database, Supabase, provider, or model change;
- no ruleset mutation;
- no new secret, token, PAT, webhook, or paid service.

Exact next step: independent Technical-Lead review of the exact branch tip. After that review, the Product Owner may paste the external setup prompt once. This contract does not perform that paste.
