## TASK V1 — Official Truth Human Read-only Audit Preparation 1

8 November 2026. Completion of the still-undelivered explicit Owner requests [6709757456](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6709757456), [6714046350](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6714046350), and [6720761325](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6720761325). This is a finite source-artifact preparation task; it is not a new live execution route or a platform-clearance decision.

### Verified baseline and purpose
Fresh main `b4a5afb95f6c4c39842755ddbe780128348ca0a5`, tree `d09865e91093960026a61e003b43c78342b6a43a`, mode NORMAL. #1155 is CLOSED/completed; #1156/#1157 merged and actual-main/Production verified. The old Fix15 failure is not current work. #917 remains APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING, installed ledger UNKNOWN, Stage2 NOT_ATTEMPTED. #1139 and the separate #1131 integration hold remain open.

Deliver a concrete standalone SQL source file and independent static review for the Owner's requested public/private audit. No AI executes this SQL against Development, Production, or any database in this task. No credentials, connections, hosted inventory, fallback route or operator-execution instructions are part of this task.

### Ownership and allowed files
Single implementation author: **Jetnity Official Truth Human Read-only Audit Preparation 1 — Codex Generation 1**; intended session `/root/human_audit_writer`. No Cursor session or UI rename is claimed. Root retains publication, PASS, Ready and merge authority; separate reviewers are read-only.
Branch: `docs/official-truth-human-readonly-audit-1-20261108`.
Allowed new source area: `docs/audits/official-truth-human-readonly-2026-11-08/`.
Deliverables: `public-private-catalog.sql` and concise German `README.md`; Root adds immutable task/review/hash evidence after independent review. No existing runtime, migrations, package commands, dependencies, auth/roles/permissions, CI or held diff changes.

### Acceptance criteria
1. Exact transaction envelope `BEGIN READ ONLY;` ... `ROLLBACK;`; catalogue-only SELECT content, preferably one statement/snapshot. No DML, DDL, writable CTE, SELECT INTO, COPY, DO/CALL/EXECUTE, role/grant/revoke/configuration changes, locks, sequences, files, network, extensions, dynamic SQL or application-function invocation.
2. Use only explicit `pg_catalog` relations and independently allowlisted built-in operations. Never evaluate table/view rows, stored defaults, policies, constraints, triggers or target function bodies. Do not use decompilers whose formatting could invoke user-defined type output; fingerprint raw catalog definition fields instead and document exact fingerprint semantics.
3. Both public and private are explicit requested schemas; absence is distinguishable from zero objects. Describe schemas, relations/columns, RLS and policies, routine security/configuration, relevant ACL/default ACL and inherited/effective privileges, and relevant FK/trigger/view/dependency metadata without claiming behavioral security proof.
4. No keys/tokens/PII/user rows or free text potentially containing them: no raw function bodies, policy/default/check expressions, comments, configuration values, credentials, login names or unreviewed identifiers in outputs. Use allowlisted known identifiers or consistent opaque object identifiers where needed; unknown values remain redacted/unknown. Hashes are comparison aids, not proof of correct behavior or absence of secrets.
5. Read-only mode alone is not asserted to forbid every possible side effect. The reviewed query's actual relation/function/operator/cast paths must establish its narrower no-write/no-application-execution claim.
6. The source includes no hardcoded assertion that the actual connected target is Dev. Intended target `yfvbxvijcorffwxbxahl` is documentation, not SQL-attested fact. No migration-history or auth rows are added beyond this Owner-selected public/private metadata scope.
7. README lists exact evidence/limitations for a future voluntarily supplied human result: unchanged script/hash, independent execution context binding to Development, UTC time/full output and errors, read-only/rollback outcome; no credentials requested. A human result may be assessed as evidence, but is not automatic platform clearance, Stage1 acceptance, #1139 closure or activation.
8. Preserve the distinction between static source review, SQL syntax review, real execution and completed DB acceptance. Never mark NOT_EXECUTED as PASS of a live database.

### Gates / STOP
Author delivers source plus self-review and stops. Root and at least one independent security/privacy reviewer inspect every statement and all emitted fields, with non-executing static checks where available. Any correction stays with the same author/session and new bytes invalidate prior source acceptance. Final exact artifacts, SHA256, review scope and NOT_EXECUTED boundary are persisted in this repository before the user receives them.
No real source/retention/key/witness/provider/Production/paid/public-launch action. Existing approval is not requested again. No copied/reimplemented #1131 or #985 diff. **Do not mark Ready. Do not merge. Do not start a follow-up slice.**
