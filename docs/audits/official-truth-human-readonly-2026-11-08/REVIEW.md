# Independent static source review and continuity

Date: 8 November 2026. Task: **Official Truth Human Read-only Audit Preparation 1**.

**Root static-source decision: STATIC_SOURCE_REVIEW_PASS. SQL_NOT_EXECUTED.**

Both independent reviewers completed a full R1 re-read, independently confirmed the final hashes, found no remaining material source correction and recommended the bounded static acceptance. Root independently agrees after its own full re-review. This accepts the preparation deliverable only.

This record concerns the precise source files below. It is not a hosted database acceptance, platform clearance, production activation, or an exact-head PR merge verdict. GitHub Actions, Vercel and final branch/thread checks are recorded separately in the PR conversation after publication.

## Source identity and responsibility

| File | Bytes | Lines | SHA256 |
| --- | ---: | ---: | --- |
| `public-private-catalog.sql` | 23,965 | 441 | `5c19c183bedd07989e4b5b1ada5a0297d5c109bee6b561c3dae2af5d9eaa3e8c` |
| `README.md` | 14,520 | 84 | `19a5a399963c1f686176465ad4c95178d4dd02e6ffd6ff78c092a5198f513905` |

Base main: `b4a5afb95f6c4c39842755ddbe780128348ca0a5`; base tree: `d09865e91093960026a61e003b43c78342b6a43a`.

Source branch: `docs/official-truth-human-readonly-audit-1-20261108`.

Single source author: **Jetnity Official Truth Human Read-only Audit Preparation 1 — Codex Generation 1**, session `/root/human_audit_writer`. No Cursor UI rename or reachable historical Cursor session is claimed. The author delivered and stopped. Root alone owns publication, TL acceptance, Ready and merge.

Root independently read the complete SQL and README, checked the output paths and reran the nonexecuting parser/AST review. Separate read-only reviewers are `/root/blocker_evidence_review` (security/privacy/write paths) and `/root/release_live_audit` (catalog semantics, compatibility and evidence limits). Their recommendations are inputs to the TL decision, not substitutes for it. No reviewer edited the source.

## Task and correction chain

- [Explicit Owner request](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6720761325).
- [TASK V1, persisted and read back](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6724680370); an exact copy is in `TASK.md`.
- [TL CHANGES REQUIRED R1, persisted and read back](https://github.com/Jetnity/jetnity/issues/917#issuecomment-6724858091).

The first freeze was not accepted. Its SQL SHA256 was `fbb8486dd25602b7e26b21c3069d9f196650a82db62e79c62f8ba2a6443aeec0`; README SHA256 was `7360810140d28ae7de42d3773b82bc69916ff0f11e608e48f2bc721cb08a937f`.

Both independent reviewers found the same P2 defect: the sequence branch passed uppercase `S` to `acldefault`, which means FOREIGN SERVER. PostgreSQL requires lowercase `s` for SEQUENCE, while `pg_class.relkind` correctly remains uppercase `S`. Root confirmed this against the PostgreSQL 15 and 18 documentation. The same author/session changed that one byte. Root and the catalog reviewer independently inverted that one byte in memory and reproduced the exact original SQL SHA256, confirming there was no additional SQL change.

The same author also corrected three README statements: raw catalog definition text can contain confidential literals before internal hashing; the effective-privilege matrix is a declared subset and does not evaluate PostgreSQL 17+ MAINTAIN; OIDs and oid-array elements are decimal JSON strings. All new bytes were subject to a fresh complete source review. No runtime or database experiment was used to fix these issues.

## Actual nonexecuting verification

Local parser: **pglast 8.7**, bundled PostgreSQL parser **18.6**. No database client, SQL planning, catalog resolution or connection was used. Parsing the full corrected source accepted exactly:

1. `TransactionStmt`: BEGIN with the sole option `transaction_read_only = 1`.
2. `SelectStmt`: the catalog query and read-only CTEs.
3. `TransactionStmt`: ordinary ROLLBACK, without chaining.

The independent AST inventory and root's one-off restrictive checker found:

- 23 distinct explicitly qualified built-in function names;
- 14 explicitly qualified system catalog relations/views;
- 135 explicit `pg_catalog` casts, including nine fixed, fully qualified catalog `regclass` literals immediately reduced to OIDs;
- 50 explicitly qualified expression operators and one explicitly qualified JSONB sorting operator;
- no noncatalog relation apart from the declared CTEs, application function, decompiler, unknown setting read, writable CTE, SELECT INTO, explicit row lock, external SQL parameter or whole-row projection.

The checker itself was exercised with 14 nonexecuting controls: one permitted catalog count and 13 rejected examples covering writable CTE, SELECT INTO, sequence, configuration mutation, application function/rows/type, decompiler, unqualified operator, simple CASE, foreign sort operator, arbitrary setting and row lock. This is bounded parser/checker evidence, not a universal SQL safety proof or a replacement for the manual dataflow review. The one-off checker was not added to the application or CI.

The 23 reviewed built-ins are `acldefault`, `aclexplode`, `bool_or`, `cardinality`, `count`, `current_setting`, `date_part`, `encode`, `has_column_privilege`, `has_function_privilege`, `has_schema_privilege`, `has_sequence_privilege`, `has_table_privilege`, `jsonb_agg`, `jsonb_build_array`, `jsonb_build_object`, `jsonb_object_agg`, `left`, `pg_has_role`, `sha256`, `statement_timestamp`, `textsend` and `unnest`. Their concrete argument types and output paths were inspected; accepting a function name alone would not establish safety for arbitrary arguments.

## Manual write-path and output review

The transaction envelope alone is not the safety argument. The actual query reads only explicit primitive catalog metadata and never evaluates application rows, view queries, target routines, stored defaults, policies, triggers, constraints or index expressions. It contains no DML/DDL, grants/revokes, role/configuration changes, sequence operation, dynamic SQL, file/network function or decompiler. No arbitrary-type catalog field such as `attmissingval`, statistics value, whole tuple or free-form object name is serialized.

Every emitted field is a fixed label, an allowlisted known identifier, an OID, a built-in code/flag/number/array or the documented digest. CURRENT_USER is used only to look up an OID; its arbitrary role name is not emitted. Raw bodies, configuration, argument names/defaults, policy/check expressions, trigger arguments and rewrite definitions remain internal digest inputs. The digest does not establish that these inputs are free of secrets, and it is not a complete definition signature or behavioral authorization proof.

There is one SHA256/textsend site. Both actual server and client encoding must be exactly UTF8 before that CASE branch is reached; otherwise fingerprints are NULL and a partial status is explicit. No setting is changed and no fallback path exists. The review traced `textsend` through `pq_sendtext` and the encoding conversion routine; matching encodings use the no-conversion branch. These claims assume unmodified, trusted PostgreSQL system catalogs, built-in types and built-in operations. The artifact cannot certify a compromised server.

## Catalog correctness and declared limits

Both requested schemas and all six fixed roles have explicit existence rows. Empty sections still have counts and arrays. NULL object ACLs use hardwired object defaults; explicit empty ACLs are not silently replaced; separate future-object defaults remain separate. NULL column ACLs do not erase table privileges. MEMBER and USAGE are separate. The effective matrix covers only the exact listed roles/privileges and does not include effective MAINTAIN or a full SET ROLE analysis.

The query presents 16 metadata sections, including RLS flags/policies, routine security attributes, relevant FK/trigger/index/rewrite/dependency metadata and the exact ordered fingerprint tuples listed in the README. This is a bounded public/private catalog inventory, not an exhaustive audit of every PostgreSQL object class or all shared/dynamic dependencies. It proves no actual row visibility, owner/AAL2/session authority, API exposure, source trust or hosted activation. The intended PostgreSQL 15–18 field compatibility is a source assessment; actual target version and executability remain unconfirmed.

BEGIN inside an already open transaction can leave the outer transaction in effect; the trailing ROLLBACK can end that outer transaction. The source cannot attest a clean pre-existing transaction context. The result's read-only flag and refusal branch do not retrospectively prove the final ROLLBACK. Actual execution provenance and transaction outcome must therefore be assessed separately.

## Live continuity and remaining boundary

The preceding package is already complete: #1155 closed/completed; #1156 and #1157 merged; baseline main `b4a5afb...` and Production `dpl_8SxokmJXQ81sdPWZwyeu1g2TU1ZA` were independently verified, with Actions run [42492498039](https://github.com/Jetnity/jetnity/actions/runs/42492498039) successful. The initial open-PR inventory contained 12 Drafts; no held PR was readied, merged or copied. See [live reconstruction and current source task](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6724720369) and [prior final package receipt](https://github.com/Jetnity/jetnity/pull/1157#issuecomment-6723285362). Old red-main prose in the prior package handoff/ACTIVE_WORK_STATUS is a superseded intermediate state, not a new repair request.

The original #917 refusal remains historical and unresolved; this source-preparation task did not encounter or clear it. Stage1 remains **APPLY_RESPONSE_SUCCESS / INDEPENDENT_READBACK_PENDING**; its actual installed migration-ledger identity remains **UNKNOWN**. Stage2 remains **NOT_ATTEMPTED**. No original readback was retried, reformulated or routed through another agent; no blind reapply occurred.

No audit query was executed against Development, Production or a local database. No human execution result has been received in this task. A future voluntarily supplied result may be assessed using the exact source/hash, independent Development binding, UTC execution context, complete output/errors and actual transaction completion. An intended project label or successful JSON alone is insufficient. No credentials are required or requested by this artifact.

The public/private report excludes the migration ledger and auth/session rows, so it cannot by itself complete the original Stage1 verification or #1139. #1139 still needs actual hosted owner/account/session authority bound to the already implemented candidate. The independent #1131 integration hold is unchanged. #968's old generic credential-overlap issue was already removed; the concrete future isolated target/client/SSR-auth binding remains open. Source/provider/retention/secret/production/paid/public-launch gates remain in force. The prior entry feature remains **SQL_UNAPPLIED / FEATURE_NOT_LIVE**.

The source defect found in this review is corrected. Existing P1 hosted-baseline/authority/target/activation risks, P2 dependency/privacy limitations and P3 inherited lint/optional-layout findings are not resolved by this documentation-only change. No product-wide P0/P1-free or launch-ready claim is made.

Author STOP; no automatic follow-up slice. The next new external evidence is the explicitly reserved human/approved baseline result or legitimate clearance, to be independently assessed within its actual scope. This source delivery is not permission to execute a previously held operation.

## Primary technical references

- [PostgreSQL READ ONLY](https://www.postgresql.org/docs/current/sql-set-transaction.html).
- [PostgreSQL 15 privilege and ACL functions](https://www.postgresql.org/docs/15/functions-info.html).
- [PostgreSQL 18 privilege and ACL functions](https://www.postgresql.org/docs/18/functions-info.html).
- [Default ACL semantics](https://www.postgresql.org/docs/17/catalog-pg-default-acl.html).
- [pg_proc metadata](https://www.postgresql.org/docs/15/catalog-pg-proc.html).
- [Type categorization source](https://doxygen.postgresql.org/jsonfuncs_8c_source.html) and [JSONB output source](https://doxygen.postgresql.org/jsonb_8c_source.html).
- [textsend source](https://doxygen.postgresql.org/varlena_8c_source.html), [pq_sendtext source](https://doxygen.postgresql.org/pqformat_8c_source.html), [encoding source](https://doxygen.postgresql.org/mbutils_8c_source.html).

These references describe PostgreSQL behavior. They are not evidence of Jetnity's installed database state.
