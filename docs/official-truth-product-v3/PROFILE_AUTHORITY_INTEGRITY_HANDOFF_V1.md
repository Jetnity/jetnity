<!-- PAI1_FIX1_CURRENT_BEGIN -->
## PAI1-FIX1 — current source-only correction, 12 November 2026

New replacement author: **Jetnity Profile Authority Integrity1 — Codex Generation2**, session `/root/pai_fix`; the original Generation1 session is unreachable in the current thread, and the Product Owner's standing replacement-session authorization applies.
Sole parent: `a686e608f597ffa82d44fc9d3992b9b566b89688`; base tree: `b4f54fad7d9981f8b7676b42b271bf6740a17f48`.
Selected [PAI1-FIX1 task](https://github.com/Jetnity/jetnity/pull/1196#issuecomment-6829530744); [actual CI4139 failure](https://github.com/Jetnity/jetnity/pull/1196#issuecomment-6829449466).
The only executable source edit adds distinct `claim_reset`, `sub_reset`, and `claims_value` result labels to the existing three-expression `setClaims()` SELECT.
All calls, arguments, parameter, false flag, order, await, assertions, ten proof groups and resource limits remain exact; the wire reader, installer, baseline and wrapper are unchanged.
Current native: **62649 UTF-8 bytes**, SHA-256 `926ba90156ef7ea279a34fb64d2bdb3fe66eb3c07bc149dccc858ebe36f20cf7`, Git blob `7fefc442cfbd7344fa9cbe992bcd733803e1c094`.
**NOT_RUN / NOT_INSTALLED / NOT_TL_PASS**: no project, parser, compiler, test, native, SQL, CI, hosted, official-source or ref action was performed by this replacement author.
The earlier SOURCE-V1/A1 material below is preserved historical evidence; this section records the current revision.
<!-- PAI1_FIX1_CURRENT_END -->

# Profile Authority Integrity 1 — author handoff V1

## State and exact selection

**SOURCE ONLY — UNPUBLISHED — NOT EXECUTED — NOT INSTALLED — NOT TL PASS.** Author: **Jetnity Profile Authority Integrity1 — Codex Generation1**, the new exact session selected by Root in [#1139 / SOURCE-V1](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6825593411), with [A1](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6825665177). This package addresses a selected profile-authority prerequisite for CH→DE. It does not put an entry answer online.

Sole source parent: `fa8bd1d02ea67cf69ba3df9fea5a3d39a35a7474`. Base tree: `d58c49fa41e28f203623dab56998dacf11eaabd3`. The complete base inventory has 9,486 non-tree leaves. The sorted UTF-8 stream `path<TAB>mode<TAB>type<TAB>sha<LF>` has SHA-256 `3893a6aaa16111dfba0af90e401674420040bb4c17b3ee4143eb1aa1467f9622`. Delivery must preserve every one of those mode/type/blob identities and add exactly the eight paths in the manifest. The immutable candidate commit/tree and final eight blob pins belong in the external Root delivery receipt; no self-referential commit digest is invented inside its own tree.

Root owns independent source review, execution selection, integration with accepted HMA/current main, mandatory PG17 routing, publication, Ready, merge and any hosted apply. No branch, PR, ref, hosted account or live database object is created by this source author. Immediate review fixes return to this same reachable session; any changed head requires complete independent re-gating.

## Actual evidence bound

The actual Dev receipts are [E10B](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6825177327), [E10C](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6825374617), [E10D](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6825438601) and [E18B](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6824905662). Their full text and exact body pins are appended to the Task document. `observed-baseline.json` contains the finite E10 result objects and seven full definitions; E18B is separately labeled as a transcription of the actual prose receipt.

Those receipts identify Dev `yfvbxvijcorffwxbxahl`, develop, parent `qscbgcdmivbbnzrcyegn`, PostgreSQL 170006, database/current/session `postgres`. They contain metadata, not live account rows or attack execution. Native fixture identities are synthetic and are not the actual numeric metadata OIDs. Production equality and actual exploitation are not claimed.

The selected findings remain **OPEN until independent native review and the selected actual Dev install/readback**:

| Finding | Actual old definition permits | New selected refusal |
| --- | --- | --- |
| E10-IDENTITY-01 | Manager A retains their role and rebinds an unchanged Owner profile to a different controlled Auth UID B without a profile | Every UPDATE preserves both `id` and `user_id`, before any exception. |
| E10-STATUS-02 | Existing status rule lacks the application's target-rank restriction | Foreign status changes need actual manager/AAL2 authority, known actor/old target ranks and a strictly higher rank, except actual Owner. |
| E10-DELETE-03 | Existing DELETE RLS allows a manager to delete a higher-rank foreign profile | The same strict foreign rank rule applies; own-profile DELETE stays available. |

The weaker proposed sequence in which A first deletes their own profile is explicitly disproved by the authored native case: A loses their profile role and the next ordinary foreign update affects no row. No broader takeover story is asserted.

## Additive runtime contract

The installer creates exactly `public.profil_autoritaet_integritaet_pruefen_v1()` and `profiles_autoritaet_integritaet_v1`. The function is PL/pgSQL, trigger-returning, SECURITY INVOKER, VOLATILE, PARALLEL UNSAFE, CALLED ON NULL INPUT, owner postgres, with `search_path=pg_catalog`, no arguments/defaults and owner-only EXECUTE. The trigger is enabled `O`, BEFORE UPDATE OR DELETE, ROW, on exactly `public.profiles`, with no WHEN clause, column subset, arguments or transition relation.

Identity mutations fail with `23514` even for privileged maintenance. A status-preserving UPDATE returns unchanged NEW after identity checks, leaving unchanged INSERT and role enforcement to the existing old trigger. An ordinary own status change refuses; own DELETE returns unchanged OLD. A foreign status/delete decision uses the actual `darf_konten_verwalten()`, `aktuelle_rolle()` and `rollenrang()` helpers, compares **OLD.role**, requires both ranks to exist and permits only a strictly lower target except for actual actor role `owner`. Allowed DELETE always returns OLD.

Missing `auth.uid()` alone is insufficient. Only exact actual `current_user` postgres or service_role retains existing NULL-actor status/delete maintenance. A JWT role string, inherited membership, arbitrary BYPASSRLS principal or caller-provided flag cannot enter that exception. Malformed UID conversion remains an error. The new guard contains no setters, row writes, role switching, dynamic SQL or catch-and-allow.

Guard body: 1,828 UTF-8 bytes; SHA-256 `b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d`. Every old helper/trigger body is independently reconstructed from the received definitions and pinned unchanged:

| Existing function | Body bytes | SHA-256 |
| --- | ---: | --- |
| `aktuelle_rolle` | 92 | `41b223309c2228d87a0ac273ac31cc9ffcaa7e3ac406059d00818b947b09cbd0` |
| `aktuelles_admin_aal2` | 66 | `d3cf53b48caba5d05eef08d940f1199b7ad58a8a78acefd1e899fda0c502ff1a` |
| `darf_konten_verwalten` | 90 | `35e41fdae08f4663ffd9f58b3e7912b7faf13661ab0159c67067ad43f43498ab` |
| `hat_rolle_mindestens` | 123 | `367f630edefe6788750c6cabe7f5cb1b32d7c01ee4e3246d60632bf5ccd77f10` |
| `profil_kerndaten_aus_auth` | 352 | `05f4673d2bd0e2236a8b6047c29b2105d787e4f55792d0f1b8251547cc8f8422` |
| `profil_rollenwechsel_pruefen` | 2440 | `382d8bc00583596ef719b4185d47645baec410f71c2a7ebfb8e1c4df08ba8351` |
| `rollenrang` | 249 | `56d5753e4ccb189c2472c02a2737b6662c182381d03bf4de1954d069829fe850` |

The retained triggers are `profiles_kerndaten_aus_auth` (AFTER INSERT, type 5) and `profiles_rollenwechsel` (BEFORE INSERT OR UPDATE, type 23). The new trigger has type 27. The installed candidate never replaces any of the seven functions or the two old trigger bindings.

## Installer and concurrency

The complete candidate is one explicit READ COMMITTED transaction with lock timeout 2 seconds, statement timeout 10 seconds and a bounded SHARE ROW EXCLUSIVE lock on the profile table. It requires the selected PG17 family, actual NOSUPERUSER LOGIN/INHERIT/BYPASSRLS postgres creator with matching session identity, exact observed schema ACL/creator rights and scoped function defaults, no incoming postgres membership, no profile inheritance, no incoming profile FK and no new-name/overload collision.

Before creation it binds the finite observed table/column/default/constraint/policy shape and all seven full function definitions/attributes/ACLs and two old trigger forms. It also captures the full local retained catalog: relation and all attributes, defaults, constraints, indexes, policies, old triggers/functions, public namespace, creator defaults, relevant principals and memberships. It verifies that entire raw snapshot unchanged before COMMIT. Local numeric OIDs remain bound through that before/after snapshot; foreign Dev numeric OIDs are not used as portable authority.

The function is created under the actually observed defaults. Before revoking anything the installer rejects unexpected grantees, grantors, privileges or grant options. It removes only the known PUBLIC/service_role execution exposure from this one new function, checks effective denial for anon/authenticated/authenticator/service_role, verifies the complete new function/trigger form and only then commits. Global defaults, old ACLs, roles, policies and schema exposure remain untouched.

**A1 external precondition remains open:** the table lock serializes target writes/table DDL, not independent privileged edits of helper functions/default ACLs/roles. Root must establish operator quiescence through actual apply and readback. A source assertion, supplied flag, count or snapshot does not prove this. No global catalog lock or new permission is proposed.

The recovery document provides transaction-failure handling and fail-closed forward repair. It deliberately contains no executable removal that restores the known vulnerability, no trigger disable, DELETE suppression or data purge. A collision is a refusal, not idempotent success.

## Mandatory native proof authored, not run

The wrapper has no skip or environment-dependent success path. It calls the native proof with a 130,000-ms wrapper timeout. Source has one 90,000-ms effect budget and reuses the unchanged existing 35,000-ms complete lifetime drain. There is no earlier unjoined cleanup race. The inventory is capped at three owned clusters, 16 cumulative connections and 4,096 cumulative wire operations; successful source flow uses one main cluster and two cleanup-witness clusters.

The existing local-cluster helper only creates owned Unix-socket fixtures; the source refuses an actual server outside PG17. Root must explicitly place the wrapper in the mandatory PG17 CI family before publication. Default Core/PG16 discovery is not an accepted execution path. No CI/package/selector file is changed by this eight-file task.

| Mandatory group | Concrete proof encoded |
| --- | --- |
| PAI1-01 | Execute the three original defects on the exact old synthetic contract; prove loss of authority after own deletion in the false single-account sequence. |
| PAI1-02 | Wrong creator, changed old body, disabled old trigger, unexpected creator default and both new-name collisions refuse atomically and preserve the actual pre-attempt state. |
| PAI1-03 | A real separate NOSUPERUSER LOGIN postgres installs the unchanged SQL; complete raw old catalog remains equal; repeated install refuses; original attacks and simultaneous role/status evasion refuse. |
| PAI1-04 | Both identity keys refuse for user/manager/Owner and exact privileged NULL actors; identical keys, own ordinary fields and immutable upsert UPDATE behavior are checked. |
| PAI1-05 | All 24 manager/target rank pairs exercise both foreign status and DELETE, including equal/higher refusals and Owner exception; own semantics and mixed-row statement atomicity are checked. Dependent data-modifying CTEs also force an allowed effect before the forbidden row, proving rollback without depending on scan order. |
| PAI1-06 | Existing self-INSERT/role restrictions and Owner succession stay valid; missing/malformed/unknown claims/ranks and fake service-role claim stay closed. A temporary fixture policy makes NULL-actor rows visible so the actual restricted caller reaches the unchanged INVOKER guard; it is removed before readback. |
| PAI1-07 | The unchanged accepted private PG1 implementation denies B after rejected rebind and accepts the unchanged original synthetic Owner binding. A temporary fixture-only caller bridge delegates to the real private functions without changing their owner-only ACL, then is removed. |
| PAI1-08 | A separate actual synthetic Auth-owner connection deletes an Auth user; the real FK cascade removes profile/session rows; a temporary INVOKER observer records the actual profile DELETE principal, required to be postgres. Observer removal precedes final comparison. Existing postgres/service_role NULL-actor maintenance still works. |
| PAI1-09 | Exact observed baseline, old object identities/definitions/rights, effective new-function denial and exactly three user profile triggers are checked; temporary policy/schemas/observer are gone. |
| PAI1-10 | Actual in-flight pg_sleep is observed before ordinary failure and real timeout; the original pending promise is joined, all owned connections close and all owned clusters stop. A deliberately thrown false cause must remain failure. |

All runtime ordinary user calls use an actual restricted authenticated connection with synthetic fixture claims. The actual creator is a separate postgres login; bootstrap-superuser is used only for owned fixture preparation, intentional adversarial setup and independent inspection. Service maintenance uses the actual existing service_role execution principal, not a user claim substituted for it.

Fixture reset uses actual Auth-owner DELETE and FK cascade, never TRUNCATE or guard disable. The candidate's own before/after raw-catalog comparison is exact and unmodified. The separate end-of-many-DML comparison excludes only legitimate physical counters/freeze horizons `relpages`, `reltuples`, `relallvisible`, `relfrozenxid`, `relminmxid`, because autovacuum can change them during deliberate row churn. It retains every OID, `relfilenode`, definition, binding, ACL, default and role field. No such normalization exists in the installer.

### Synthetic distinctions that remain explicit

Actual live profile numeric OIDs are preserved in evidence but never recreated as fixture OIDs. The actual UUID default expression was observed; its provider schema/body was not. The owned fixture therefore uses an explicitly synthetic public UUID adapter, and neither asserts equality of that adapter with a live extension nor changes the actual default. Two fixture indexes exercise index preservation without claiming the receipts returned a complete live index inventory. The actual installer snapshots whatever full local index catalog exists and preserves it.

The Auth helper bodies are copied from the already selected PG1 fixture source and independently checked by the authored query; their explicit body pins are jwt `fed2a8ac0349ffaba807c1b574698bfb1348825b8ef5163ad72d8408386f5e3e` and uid `9ab5ea099e74ec09e83b1505c51a3647791195aed7c742dcc3f257dfc7d2f300`. Auth rows, sessions, JWT settings, test mail addresses and runtime role memberships are synthetic. The cascade context is a mandatory future observation, not an already observed result. A service credential is never offered as signed Owner/AAL2 evidence.

## Finite prerequisite source pins

| Source path | Exact Git blob | SHA-256 |
| --- | --- | --- |
| `scripts/db/official-truth-v3-private-owner-guards-1/install-candidate.sql` | `9a8144e27405f93b9c0e5d003923efe8883bb4b4` | `3e21495ff40f66337b004fadc98599cd336c19c31bb4f6e4f9013c2c01f02bd2` |
| `scripts/db/official-truth-v3-private-owner-guards-1/native.ts` | `21886dbcbcaea1e04817df3fdd7eb7344a44c460` | `2db1e629b5d425fb0161f6d22458714c5487762ade36448d40d0ed89e84abbf0` |
| `scripts/db/official-truth-integrated-pilot-1/local-cluster.ts` | `dc5a2583cd540b83062e8662cdb4b6af4befb376` | `f6d21b3fef8f0ad41a8ac3951972ea5cba0394cfe41037eba8d0258ed508aa10` |
| `scripts/db/official-truth-integrated-pilot-1/pg-wire.ts` | `c8bae7b92950a318e6555aaad930002c6726ca3e` | `57f3b01f5624889a41e8e8832cbebf49da9100fbb4dec6ffe25f769a44a4aaf8` |
| `scripts/db/official-truth-atomic-version-refresh-1/test-lifetime.ts` | `b1a81a0f63fb0debaffa4db739adbb483ac1efc5` | `e7a6a5deb652019209fd9e4bd2f1ce71bef3c15a4988838ab5b35f147dbbee68` |

The native source self-checks the SQL, baseline JSON and four imported/read runtime prerequisites before owned-cluster work. The manifest also pins the PG1 native source used as Auth-fixture provenance. All existing dependency leaves stay byte-exact.

## Inert validation completed and runtime gates left open

The author read the complete task/A1 and all four actual receipts, reconciled the exact selected paths, independently reproduced seven old body SHA-256 pins, composed the additive SQL and mandatory proof source, checked pure text/JSON/source-pin consistency and prepared a complete-tree preservation proof. Immutable delivery must be read back byte-for-byte and its exact one-parent tree validated before Root receives it.

**No compiler, parser, linter, project test, native cluster, SQL, build, hosted metadata, hosted mutation or official-source request was run.** These are authored assertions, not observed PASS results. No tests are described as successful, no production equivalence is established and no open E10/E18/E24 gate is closed.

The next exact step is independent Root review of the immutable eight-file commit and all pins. Root then selects actual parser/compiler/native execution and mandatory PG17 routing/integration, retains the actual receipts, re-gates every changed head, and only afterward considers a separately bound Dev apply/readback with external operator quiescence. The #917 denied action and #1131 branch remain excluded.

| Risk class | State in this handoff |
| --- | --- |
| P0 | No global production assessment is claimed from this finite source task. |
| P1 | The three evidenced old-contract authority gaps remain open until real reviewed installation/readback. Auth cascade preservation is a blocking native regression gate. |
| P2 | All new SQL/type/native assertions are unexecuted; PG17 CI routing and integration are still Root work. Helper/default/role quiescence is an external apply precondition. |
| P3 | Synthetic fixture/provider distinctions and source-age drift must remain visible in later receipts; every changed head invalidates prior gates. |

## Primary documentation consulted

[PostgreSQL 17 CREATE TRIGGER](https://www.postgresql.org/docs/17/sql-createtrigger.html) and [PostgreSQL 17 trigger overview](https://www.postgresql.org/docs/17/trigger-definition.html) support the selected BEFORE ROW semantics, alphabetic trigger order, INSERT/UPDATE behavior and ordinary triggers firing during FK actions. The exact actual cascade invoker is deliberately proved by the authored native observer rather than inferred from those general pages. [Supabase changelog](https://supabase.com/changelog) was checked as required by the Supabase skill; this package introduces no SDK or platform version upgrade.


## FIX1 source preservation and next step

Exactly five existing paths change: Native and these four PAI evidence documents; every other 9,533 parent leaf must retain mode/type/blob identity. The old Native is 62,605 UTF-8 bytes, SHA-256 `b6576c95203080decd985d2759fad8482248190d7e91780119c8485e0f12623f`, Git blob `74ee8cad74835c6e6fa6757cfefb40d878704898`. One exact SELECT replacement is reversible to the complete original bytes. Historical CI4139 failed at PAI1-01 with `local_pg_duplicate_column`; no complete PAI runtime PASS is claimed. Root must independently review, select coherent integration with the other #1196 fixes and run full fresh gates before any Dev decision. #917's denied action and #1131 remain excluded.
