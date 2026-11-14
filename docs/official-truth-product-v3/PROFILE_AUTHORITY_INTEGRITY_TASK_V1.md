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

# Profile Authority Integrity 1 — complete source task and evidence

**State: SOURCE ONLY / UNPUBLISHED / NOT RUN / NOT INSTALLED.**

Exact implementation session: **Jetnity Profile Authority Integrity1 — Codex Generation1**. Technical Lead selection: [#1139 / SOURCE-V1](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6825593411), with [A1](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6825665177). A1 supersedes the original task's drain/wrapper values: **90,000 ms effect, existing 35,000 ms complete drain, 130,000 ms wrapper**.

Sole source parent: `fa8bd1d02ea67cf69ba3df9fea5a3d39a35a7474`; base tree `d58c49fa41e28f203623dab56998dacf11eaabd3`. Exactly eight additive source leaves; all 9,486 existing leaves stay byte-exact. This document does not mark Ready, grant execution authority, close E10 or authorize a hosted installation.

## Complete selected task

The following task and supplement are copied from the actual Root issue comments. Their statements about earlier independent reads are Root's evidence, not claims of actions performed by this source author.

## TL TASK PROFILE-AUTHORITY-INTEGRITY-1 / SOURCE-V1 — prerequisite E10 fix for CH→DE

Selected by Technical Lead, 2026-11-12. New exact implementation session: **Jetnity Profile Authority Integrity1 — Codex Generation1**. This is a bounded prerequisite for the already authorized CH→DE release, not a new travel/product feature. Root alone owns execution selection, publication, Ready, merge and Dev/Production apply.

### Actual evidence and necessity

Current accepted main `fa8bd1d02ea67cf69ba3df9fea5a3d39a35a7474`, tree `d58c49fa41e28f203623dab56998dacf11eaabd3`, 9,486 leaves. Sole source candidate parent must be this exact main. All existing leaves remain byte-exact.

Read the complete actual Dev receipts before authoring:
- E10B #1139 comment 6825177327: profiles columns/ACL/RLS/constraints and full two bound trigger definitions.
- E10C #1139 comment 6825374617: full five current profile authority predicates and complete empty incoming-profile-FK set.
- E10D #1139 comment 6825438601: complete non-dropped column shape, seven function metadata/ACL/body pins and two collision checks.
- E18B #1139 comment 6824905662: current public schema creator rights and scoped default function ACL facts.
- Actual Dev target: `yfvbxvijcorffwxbxahl`, develop, parent `qscbgcdmivbbnzrcyegn`, PostgreSQL 170006; creator/current/session postgres is real NOSUPERUSER LOGIN, not bootstrap superuser.

These actual definitions establish three P1 source findings, without an attack or live account mutation: E10-IDENTITY-01 permits a manager A retaining their role to rebind an unchanged Owner profile to a second controlled Auth UID B with no profile; E10-STATUS-02 lacks the app's target-rank rule; E10-DELETE-03 lacks a foreign target-rank rule. A deletes-own-profile-then-new-request takeover is not the proven case, because A loses its profile role. No claim of Production equality or actual exploitation.

Root independently read the current admin action and legitimate account deletion implementation. Existing Auth hard-delete calls admin.auth.admin.deleteUser(userId,false) only after verified subject/fresh proof and storage/events removal. A broken profile FK cascade would be a material regression. Source pins: account-delete-v1/index.ts `cc07c9b222b210bf2a1b4afa63730a0f39d8123b`; kontoloeschung-ausfuehrung.ts `008d9e5979e94c148545e11c3210963f8f1ab6a1`; kontoloeschung-vertrag.ts `466d06525d309b2c26890a4a3320593d2d08dd5c`; admin/users/actions.ts `bd30b9e108890e17f1d6dc32829c687c089958e1`.

### Selected additive database change — exactly two new live objects

1. `public.profil_autoritaet_integritaet_pruefen_v1()`, RETURNS trigger, plpgsql, SECURITY INVOKER, VOLATILE, PARALLEL UNSAFE, CALLED ON NULL INPUT, no arguments/defaults, fixed search_path=pg_catalog, owner postgres. Fully qualify every called helper. No dynamic SQL, setters, role switching, row writes, authority impersonation or catch-and-allow.
2. `profiles_autoritaet_integritaet_v1`, BEFORE UPDATE OR DELETE ON public.profiles FOR EACH ROW, enabled O, no column list, WHEN, arguments or alternate relation.

Keep every existing function/trigger, table column/default/constraint/index, owner, ACL, RLS policy and role membership unchanged. No existing helper-body rewrite. No historical migration edit, blanket ACL change, data cleanup, profile migration or initial Owner creation.

**Exact behavior:**
- For every UPDATE in every execution context, require both NEW.user_id IS NOT DISTINCT FROM OLD.user_id and NEW.id IS NOT DISTINCT FROM OLD.id. Refuse either change before any privileged exception. No relinking API is added.
- If UPDATE has no actual status change, return unchanged NEW after these identity checks; the unchanged old trigger continues to police role/INSERT behavior.
- For actual status change with an ordinary nonnull auth.uid(), preserve own-status refusal, require actual darf_konten_verwalten() IS TRUE, require known actor and old target rank, and require actor rank > old target rank unless actual current role is owner. Compare OLD.role so a simultaneous role mutation cannot evade this check. The old role trigger remains active.
- For DELETE with actual nonnull auth.uid() equal to OLD.user_id, preserve existing own-profile deletion. Otherwise require the same manager/AAL2/known-rank/strictly-higher-or-owner rule.
- Every allowed DELETE returns unchanged OLD, never NEW/NULL; every allowed UPDATE returns unchanged NEW.
- A null auth.uid() alone is never a maintenance credential. Preserve existing privileged null-actor status/delete maintenance only for exact actual current_user `postgres` or `service_role`; no member-of expansion, arbitrary BYPASSRLS allowlist, JWT role claim, GUC or user-input substitute. These existing trusted principals are not being granted new authority. Identity immutability applies even to them.
- Bind and prove the real PostgreSQL referential-action execution context using synthetic auth.users owner supabase_auth_admin and profiles owner postgres. The existing Auth -> Profile ON DELETE CASCADE must work through an actual synthetic Auth deletion and record the observed trigger invoker context. Do not add supabase_auth_admin or any other null-actor principal by assumption; report if a concrete native/source constraint requires separate Root selection.
- Malformed identity conversion remains an error. Missing/unrecognized ordinary identity or rank must not open foreign writes. No COALESCE unknown target rank to -1 for the new administrative decision.

### Installer and recovery contract

Author a forward-only install candidate with explicit bounded transaction, lock_timeout and statement_timeout. Obtain a bounded table lock before validating/changing the target so concurrent writes/DDL cannot race the install. Check actual PG17 family, exact intended creator, table identity/owner/RLS/ACL and all relevant columns/constraints/policies, exact two old triggers and seven helper definitions/attributes/owners/ACLs from receipts, and absence of both new names/overloads. Do not bind foreign environment numeric OIDs as portable names; bind actual object relationships and capture new local identities. Refuse drift/collision atomically; no automatic correction of unexpected old state.

Normalize only known PUBLIC/service_role defaults on the one newly created trigger function, revoking executable rights on that new object from PUBLIC/anon/authenticated/service_role, leaving only owner authority. Unexpected defaults/rights/grantors must abort rather than be erased globally. Verify complete final new function/trigger form and that the entire old catalog is unchanged before COMMIT. No new schema exposure, schema privilege, role or membership.

There is deliberately **no executable rollback that drops this guard and restores the known vulnerability**. Recovery documentation covers automatic transaction rollback on failed install, fail-closed forward repair, data preservation and explicit operator pause/review if a legitimate flow fails. No CASCADE, table/history purge, trigger disable, DELETE suppression or rollback-to-vulnerable shortcut.

### Eight new source paths only

- scripts/db/profile-authority-integrity-1/install-candidate.sql
- scripts/db/profile-authority-integrity-1/observed-baseline.json
- scripts/db/profile-authority-integrity-1/native.ts
- lib/readiness/profile-authority-integrity-1.test.ts
- docs/official-truth-product-v3/PROFILE_AUTHORITY_INTEGRITY_TASK_V1.md
- docs/official-truth-product-v3/PROFILE_AUTHORITY_INTEGRITY_HANDOFF_V1.md
- docs/official-truth-product-v3/PROFILE_AUTHORITY_INTEGRITY_RECOVERY_V1.md
- docs/official-truth-product-v3/PROFILE_AUTHORITY_INTEGRITY_MANIFEST_V1.json

observed-baseline.json must faithfully contain the finite E10B/C/D facts/full definitions and their receipt provenance; distinguish actual metadata OIDs from portable fixture identities. It must not contain live account data or a fabricated original catalog. No change to CI/package/selector is selected yet. Root later integrates with accepted HMA/main and explicitly adds this wrapper to the mandatory PG17 family before publication; default Core/PG16 execution is not an acceptance path.

### Required native proof (author now, execute only after Root review)

Use actual PG17 owned local clusters and the existing reviewed LocalPgConnection/local-cluster/OwnedTestLifetime, with source pins. A real NOSUPERUSER LOGIN postgres owns the synthetic profiles and applies the unchanged candidate SQL; bootstrap-superuser is restricted to owned fixture preparation, intentional adversarial setup and independent inspection. Runtime calls use actual restricted authenticated connections; JWT settings are labeled synthetic fixture inputs, never a hosted signed-Owner proof.

Use exact E10 baseline helper/trigger bodies, privileges/RLS/constraints and relevant complete profile shape. Distinguish numeric OIDs, uuid default provider and synthetic Auth data from live facts. Avoid merely replacing the predicate with a convenient test helper.

Mandatory cases must prove:
- Original two-account rebind, higher-rank status change and deletion actually pass under the exact synthetic old contract, and the same three actions after install refuse without changing affected rows.
- The false single-account takeover case loses manager role after own deletion and cannot perform the subsequent ordinary foreign update.
- Both id/user_id mutations refuse for user/manager/Owner and privileged null-actor contexts; identical keys and ordinary own-profile fields still work; upsert UPDATE cannot evade identity protection.
- All original self-INSERT role/status and role-change refusals remain; lower-rank management and actual Owner-to-other-account succession still work.
- Status/foreign DELETE matrix: lower target permitted, equal/higher denied for non-Owner, Owner exception allowed, own status denied, own DELETE preserved.
- Missing/malformed ordinary claims, fake role='service_role' claim and unknown actor/target ranks do not grant the new exception.
- Actual synthetic Auth -> Profile FK cascade succeeds with the real observed invoker context and correct OLD return. Existing old functions and triggers stay exactly bound.
- A mixed multirow operation containing one forbidden row rolls back all its changes.
- PG1 still denies synthetic B after rejected rebind and sees the unchanged original Owner binding, without substituting a service key for user authority.
- Exact old-catalog drift/new-name collision refuse atomically; actual restricted creator installs successfully with known scoped defaults and no global rights change. Final metadata proves exactly the two new objects and unchanged baseline.
- Cleanup on ordinary failure and timeout joins the original pending operation, closes all owned connections and stops all owned clusters; falsy errors may not become success.

One overall effect budget 90,000 ms, drain 20,000 ms, wrapper 120,000 ms, at most 3 owned clusters and bounded cumulative connections/operations stated in source/receipt. All proof groups mandatory, no CI skip/env alternate authority. No arbitrary timing increase or unnecessary unrelated regression suite. Root will inspect actual runtime receipts, not an author Self-Review claim.

### Delivery / boundaries

Source-only immutable Git blobs/tree/commit with sole parent fa8bd1…; 9,486 original leaves exactly preserved, exactly eight new leaves. Deliver full pins, complete tree delta, exact old-body preservation, finite prerequisite pins and all actual/unrun distinctions; append this complete task and evidence in Task/Handoff.

No local/project/parser/compiler/test/native/SQL/APT/build execution; no Dev/Production metadata calls or writes by author; no official source GET; no ref/PR mutation, Ready, merge or hosted install. Pure inert text/hash/tree/JSON work only. #917 denied action and #1131 are excluded. The author must stop for independent Root review. E10 remains OPEN until real native review and actual selected Dev apply/readback; this source task does not close E18/E24 or put CH→DE online.


## Complete selected supplement A1

## PROFILE-AUTHORITY-INTEGRITY-1 SOURCE-V1 A1 — real cleanup and apply concurrency limits

Root supplement to #1139 comment 6825593411, 2026-11-12. Same new Profile Authority Integrity1 Generation1 session. No scope/path/authority expansion.

**Actual existing lifetime:** Root independently read the selected current-main OwnedTestLifetime, blob `b1a81a0f63fb0debaffa4db739adbb483ac1efc5`. Its cleanup uses a fixed 35,000-ms bound. The unexecuted source task's 20,000-ms drain was incompatible with mandatory reuse of this actual implementation. Correct the task to 90,000-ms effect (unchanged), existing 35,000-ms complete drain, 130,000-ms wrapper. Do not edit the shared lifetime or wrap its real cleanup in an earlier unjoined race. This corrects a source-task mismatch before any runtime; it is not a retry or a response to a failed timing gate.

**Actual lock coverage:** the selected profiles table lock protects target table writes/DDL, not independent privileged helper-function or default-ACL changes. Bind exact pre/post catalogs as selected and document external operator quiescence for those privileged mutations throughout actual apply and readback. That external condition is a later Root operator precondition; it is not proven by a caller flag, zero row count, catalog snapshot, invented global lock, or this task. Do not claim protection against a concurrent hostile database owner. No global pg_catalog lock, broad ACL, new role or permission is authorized.

The synthetic Auth cascade may use a separate temporary fixture-only INVOKER observer to record the actual FK-DELETE context. The unchanged candidate guard must perform the actual enforcement; remove that observer before final exact-catalog comparison. No real hosted account/Owner mutation or source execution is selected. Continue the eight-file source package and retain all prior evidence/known limitations.


## Evidence provenance

The four following receipts were read in full before authoring. SHA-256 pins cover each exact GitHub comment body as returned, encoded in UTF-8 without an added newline. The appended bodies retain their original text; surrounding headings are not part of those pins.

| Actual receipt comment | UTF-8 bytes | SHA-256 |
| --- | ---: | --- |
| [#1139 / 6825177327](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6825177327) | 14358 | `6d92ce6c0bcd4a4bfc760cb74a20f2b6e0d97d53cc0e24aec0fdbde55573ca1d` |
| [#1139 / 6825374617](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6825374617) | 7067 | `db71cda78f851c9fb748c85837a94335abd7a301d6df361a66265b27b301445f` |
| [#1139 / 6825438601](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6825438601) | 10445 | `67da823deadd306ffef579bb59f2d1d35cfe09f3f78e5943ea912f1600274a81` |
| [#1139 / 6824905662](https://github.com/Jetnity/jetnity/issues/1139#issuecomment-6824905662) | 5065 | `a97b2f5f020c21dd21ba8bcf6fc276eae83ba06c6ba5d3a490cd8bbcf612dbc1` |

Observed-baseline JSON copies the finite E10B/C/D result objects and the full seven definitions. E18B is explicitly represented as a prose-receipt transcription; no unavailable original result object is fabricated. Actual metadata OIDs remain provenance, never fixture OIDs or cross-environment authority.

## Complete actual receipt E10B

## E10B — actual private-guard profile-writer metadata / potential Owner-integrity finding

2026-11-12 13:37:15 UTC. Root independently executed one finite read-only SELECT on exact Dev yfvbxvijcorffwxbxahl, postgres/PostgreSQL170006, session/currentpostgres. Scope: public.profiles metadata, effective privileges on user_id/role/status, its policies/constraints and the two actually bound user-trigger definitions. No personal row, account mutation, signed session or old #917 capability/ledger/Pilot/Grant object was read or changed. This is an independent prerequisite of PG1's direct current-profile authority check, not a repeat of the denied Stage1 readback.

### Actual result
```json
{
  "columns": [
    {
      "name": "user_id",
      "type": "uuid",
      "number": 2,
      "default": null,
      "raw_acl": null,
      "not_null": true
    },
    {
      "name": "role",
      "type": "text",
      "number": 3,
      "default": "'user'::text",
      "raw_acl": null,
      "not_null": true
    },
    {
      "name": "status",
      "type": "text",
      "number": 16,
      "default": "'active'::text",
      "raw_acl": null,
      "not_null": true
    }
  ],
  "receipt": "E10B_PRIVATE_GUARD_PROFILE_WRITER_METADATA_V1",
  "database": "postgres",
  "policies": [
    {
      "name": "profiles_aendern",
      "roles": [
        "authenticated"
      ],
      "using": "((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())",
      "command": "w",
      "permissive": true,
      "with_check": "((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())"
    },
    {
      "name": "profiles_anlegen",
      "roles": [
        "authenticated"
      ],
      "using": null,
      "command": "a",
      "permissive": true,
      "with_check": "(user_id = ( SELECT auth.uid() AS uid))"
    },
    {
      "name": "profiles_lesen",
      "roles": [
        "authenticated"
      ],
      "using": "((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())",
      "command": "r",
      "permissive": true,
      "with_check": null
    },
    {
      "name": "profiles_loeschen",
      "roles": [
        "authenticated"
      ],
      "using": "((user_id = ( SELECT auth.uid() AS uid)) OR darf_konten_verwalten())",
      "command": "d",
      "permissive": true,
      "with_check": null
    }
  ],
  "relation": {
    "oid": "71476",
    "rls": true,
    "owner": "postgres",
    "raw_acl": "{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres,authenticated=arwd/postgres}",
    "force_rls": false
  },
  "constraints": [
    {
      "kind": "p",
      "name": "profiles_pkey",
      "validated": true,
      "definition": "PRIMARY KEY (id)"
    },
    {
      "kind": "c",
      "name": "profiles_role_check",
      "validated": true,
      "definition": "CHECK (rollenrang(role) IS NOT NULL)"
    },
    {
      "kind": "c",
      "name": "profiles_status_check",
      "validated": true,
      "definition": "CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'disabled'::text, 'banned'::text]))"
    },
    {
      "kind": "f",
      "name": "profiles_user_id_fkey",
      "validated": true,
      "definition": "FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE"
    },
    {
      "kind": "u",
      "name": "profiles_user_id_key",
      "validated": true,
      "definition": "UNIQUE (user_id)"
    }
  ],
  "current_user": "postgres",
  "session_user": "postgres",
  "server_version_num": "170006",
  "bound_user_triggers": [
    {
      "oid": "71919",
      "name": "profiles_kerndaten_aus_auth",
      "type": 5,
      "config": [
        "search_path=pg_catalog, public"
      ],
      "enabled": "O",
      "attributes": "",
      "definition": "CREATE TRIGGER profiles_kerndaten_aus_auth AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION profil_kerndaten_aus_auth()",
      "function_oid": "71396",
      "function_owner": "postgres",
      "security_definer": true,
      "function_definition": "CREATE OR REPLACE FUNCTION public.profil_kerndaten_aus_auth()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'pg_catalog', 'public'\nAS $function$\nbegin\n  update public.profiles p\n  set\n    email = coalesce(u.email, p.email),\n    display_name = coalesce(\n      p.display_name,\n      (u.raw_user_meta_data ->> 'full_name'),\n      (u.raw_user_meta_data ->> 'name'),\n      split_part(u.email, '@', 1)\n    )\n  from auth.users u\n  where p.user_id = new.user_id and u.id = new.user_id;\n  return new;\nend\n$function$\n",
      "function_body_sha256": "05f4673d2bd0e2236a8b6047c29b2105d787e4f55792d0f1b8251547cc8f8422"
    },
    {
      "oid": "72440",
      "name": "profiles_rollenwechsel",
      "type": 23,
      "config": [
        "search_path=public, pg_temp"
      ],
      "enabled": "O",
      "attributes": "",
      "definition": "CREATE TRIGGER profiles_rollenwechsel BEFORE INSERT OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION profil_rollenwechsel_pruefen()",
      "function_oid": "72416",
      "function_owner": "postgres",
      "security_definer": true,
      "function_definition": "CREATE OR REPLACE FUNCTION public.profil_rollenwechsel_pruefen()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\ndeclare\n  handelnder uuid := (select auth.uid());\n  rang_handelnder integer;\nbegin\n  if handelnder is null then\n    return new;\n  end if;\n\n  rang_handelnder := public.rollenrang(public.aktuelle_rolle());\n\n  if tg_op = 'INSERT' then\n    if new.user_id = handelnder then\n      if new.role is distinct from 'user' then\n        raise exception 'Ein neues eigenes Profil erhält immer die Rolle user.'\n          using errcode = 'check_violation';\n      end if;\n      if new.status is distinct from 'active' then\n        raise exception 'Ein neues eigenes Profil erhält immer den Status active.'\n          using errcode = 'check_violation';\n      end if;\n      return new;\n    end if;\n\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, Profile für andere Konten anzulegen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n    if rang_handelnder < public.rollenrang('owner')\n       and rang_handelnder <= coalesce(public.rollenrang(new.role), -1) then\n      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n\n    return new;\n  end if;\n\n  if new.role is distinct from old.role then\n    if old.user_id = handelnder then\n      raise exception 'Die eigene Rolle lässt sich nicht ändern.'\n        using errcode = 'check_violation';\n    end if;\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, Rollen zu vergeben.'\n        using errcode = 'insufficient_privilege';\n    end if;\n    if rang_handelnder < public.rollenrang('owner')\n       and (rang_handelnder <= coalesce(public.rollenrang(old.role), -1)\n            or rang_handelnder <= coalesce(public.rollenrang(new.role), -1)) then\n      raise exception 'Diese Rolle liegt nicht unterhalb der eigenen.'\n        using errcode = 'insufficient_privilege';\n    end if;\n  end if;\n\n  if new.status is distinct from old.status then\n    if old.user_id = handelnder then\n      raise exception 'Der eigene Kontostatus lässt sich nicht ändern.'\n        using errcode = 'check_violation';\n    end if;\n    if rang_handelnder is null or rang_handelnder < public.rollenrang('moderator') then\n      raise exception 'Keine Berechtigung, den Kontostatus zu ändern.'\n        using errcode = 'insufficient_privilege';\n    end if;\n  end if;\n\n  return new;\nend\n$function$\n",
      "function_body_sha256": "382d8bc00583596ef719b4185d47645baec410f71c2a7ebfb8e1c4df08ba8351"
    }
  ],
  "runtime_column_privileges": [
    {
      "role": "anon",
      "column": "role",
      "insert": false,
      "select": false,
      "update": false
    },
    {
      "role": "anon",
      "column": "status",
      "insert": false,
      "select": false,
      "update": false
    },
    {
      "role": "anon",
      "column": "user_id",
      "insert": false,
      "select": false,
      "update": false
    },
    {
      "role": "authenticated",
      "column": "role",
      "insert": true,
      "select": true,
      "update": true
    },
    {
      "role": "authenticated",
      "column": "status",
      "insert": true,
      "select": true,
      "update": true
    },
    {
      "role": "authenticated",
      "column": "user_id",
      "insert": true,
      "select": true,
      "update": true
    },
    {
      "role": "authenticator",
      "column": "role",
      "insert": false,
      "select": false,
      "update": false
    },
    {
      "role": "authenticator",
      "column": "status",
      "insert": false,
      "select": false,
      "update": false
    },
    {
      "role": "authenticator",
      "column": "user_id",
      "insert": false,
      "select": false,
      "update": false
    },
    {
      "role": "service_role",
      "column": "role",
      "insert": true,
      "select": true,
      "update": true
    },
    {
      "role": "service_role",
      "column": "status",
      "insert": true,
      "select": true,
      "update": true
    },
    {
      "role": "service_role",
      "column": "user_id",
      "insert": true,
      "select": true,
      "update": true
    }
  ]
}
```

### Root finding requiring bounded review
RLS permits authenticated INSERT/UPDATE/DELETE; effective UPDATE includes user_id, role and status. The BEFORE INSERT OR UPDATE trigger protects changed role/status, but its complete actual body contains no user_id-immutability check. RLS UPDATE permits own user_id OR darf_konten_verwalten() both before and after mutation. It is therefore necessary to verify whether a signed non-Owner who satisfies that account-management predicate could rebind an existing Owner profile's user_id (after resolving a uniqueness collision) without changing role/status. **This is presently a concrete source hypothesis, not a performed exploit or full vulnerability proof.** No current Owner row may be modified as a test.

The ordinary core-data trigger updates email/display_name only. The role check depends on rollenrang, and current account-management semantics must be bound before concluding. E10 remains OPEN; no role-integrity PASS or HMT install/release from flags/body hashes alone. Native synthetic proof and any targeted correction must be separately selected, independently reviewed and fully gated. No global RLS or privilege rewrite selected.

### Exact read-only query
```sql
WITH target AS (
 SELECT c.oid,c.relowner,c.relrowsecurity,c.relforcerowsecurity,c.relacl
 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relname='profiles' AND c.relkind='r'
)
SELECT pg_catalog.jsonb_build_object(
 'receipt','E10B_PRIVATE_GUARD_PROFILE_WRITER_METADATA_V1',
 'database',pg_catalog.current_database(),'session_user',session_user,'current_user',current_user,
 'server_version_num',pg_catalog.current_setting('server_version_num'),
 'relation',(SELECT pg_catalog.jsonb_build_object('oid',t.oid,'owner',pg_catalog.pg_get_userbyid(t.relowner),
   'rls',t.relrowsecurity,'force_rls',t.relforcerowsecurity,'raw_acl',t.relacl::text) FROM target t),
 'columns',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'name',a.attname,'number',a.attnum,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),
   'not_null',a.attnotnull,'raw_acl',a.attacl::text,
   'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum)
   FROM target t JOIN pg_catalog.pg_attribute a ON a.attrelid=t.oid
   LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
   WHERE a.attnum>0 AND NOT a.attisdropped AND a.attname IN ('user_id','role','status')),'[]'::jsonb),
 'runtime_column_privileges',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'role',r.rolname,'column',a.attname,
   'select',pg_catalog.has_column_privilege(r.oid,t.oid,a.attnum,'SELECT'),
   'insert',pg_catalog.has_column_privilege(r.oid,t.oid,a.attnum,'INSERT'),
   'update',pg_catalog.has_column_privilege(r.oid,t.oid,a.attnum,'UPDATE')) ORDER BY r.rolname,a.attname)
   FROM target t CROSS JOIN pg_catalog.pg_roles r JOIN pg_catalog.pg_attribute a ON a.attrelid=t.oid
   WHERE r.rolname IN ('anon','authenticated','authenticator','service_role')
     AND a.attnum>0 AND NOT a.attisdropped AND a.attname IN ('user_id','role','status')),'[]'::jsonb),
 'policies',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'name',p.polname,'command',p.polcmd,'permissive',p.polpermissive,
   'roles',(SELECT pg_catalog.jsonb_agg(CASE WHEN rr=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(rr) END ORDER BY rr) FROM pg_catalog.unnest(p.polroles) rr),
   'using',pg_catalog.pg_get_expr(p.polqual,p.polrelid),'with_check',pg_catalog.pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY p.polname)
   FROM pg_catalog.pg_policy p JOIN target t ON t.oid=p.polrelid),'[]'::jsonb),
 'constraints',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'name',c.conname,'kind',c.contype,'validated',c.convalidated,'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY c.conname)
   FROM pg_catalog.pg_constraint c JOIN target t ON t.oid=c.conrelid),'[]'::jsonb),
 'bound_user_triggers',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'name',g.tgname,'oid',g.oid,'enabled',g.tgenabled,'type',g.tgtype,'attributes',g.tgattr::text,
   'definition',pg_catalog.pg_get_triggerdef(g.oid,true),'function_oid',f.oid,'function_owner',pg_catalog.pg_get_userbyid(f.proowner),
   'security_definer',f.prosecdef,'config',f.proconfig,'function_definition',pg_catalog.pg_get_functiondef(f.oid),
   'function_body_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(f.prosrc,'UTF8')),'hex')) ORDER BY g.tgname)
   FROM pg_catalog.pg_trigger g JOIN target t ON t.oid=g.tgrelid JOIN pg_catalog.pg_proc f ON f.oid=g.tgfoid
   WHERE NOT g.tgisinternal),'[]'::jsonb)
) AS evidence;
```


## Complete actual receipt E10C

## E10C_PROFILE_AUTHORITY_PREDICATES_AND_INCOMING_FK_V1 — actual Dev read-only metadata

Technical Lead receipt, 2026-11-12 13:42 UTC. Target: Dev `yfvbxvijcorffwxbxahl`, branch `develop`, parent `qscbgcdmivbbnzrcyegn`. This is a new, finite profile-authority metadata investigation following E10B (#1139 comment 6825177327), not a replacement for or repetition of the refused #917 capability/ledger/Pilot/Grant readback.

No person, Auth-user, Owner, session, or profile rows were selected or modified; no exploit or native runtime proof was performed. Only the five named profile authority definitions and complete incoming-FK metadata for public.profiles were read.

### Actual complete result

```json
{
  "receipt": "E10C_PROFILE_AUTHORITY_PREDICATES_AND_INCOMING_FK_V1",
  "database": "postgres",
  "current_user": "postgres",
  "session_user": "postgres",
  "profile_predicates": [
    {
      "oid": "72352",
      "name": "aktuelle_rolle",
      "owner": "postgres",
      "config": [
        "search_path=public, pg_temp"
      ],
      "arguments": "",
      "definition": "CREATE OR REPLACE FUNCTION public.aktuelle_rolle()\n RETURNS text\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\n  select p.role\n  from public.profiles p\n  where p.user_id = (select auth.uid())\n  limit 1\n$function$\n",
      "body_sha256": "41b223309c2228d87a0ac273ac31cc9ffcaa7e3ac406059d00818b947b09cbd0",
      "security_definer": true
    },
    {
      "oid": "73031",
      "name": "aktuelles_admin_aal2",
      "owner": "postgres",
      "config": [
        "search_path=pg_catalog"
      ],
      "arguments": "",
      "definition": "CREATE OR REPLACE FUNCTION public.aktuelles_admin_aal2()\n RETURNS boolean\n LANGUAGE sql\n STABLE PARALLEL SAFE\n SET search_path TO 'pg_catalog'\nAS $function$\n  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)\n$function$\n",
      "body_sha256": "d3cf53b48caba5d05eef08d940f1199b7ad58a8a78acefd1e899fda0c502ff1a",
      "security_definer": false
    },
    {
      "oid": "72472",
      "name": "darf_konten_verwalten",
      "owner": "postgres",
      "config": [
        "search_path=pg_catalog"
      ],
      "arguments": "",
      "definition": "CREATE OR REPLACE FUNCTION public.darf_konten_verwalten()\n RETURNS boolean\n LANGUAGE sql\n STABLE PARALLEL SAFE\n SET search_path TO 'pg_catalog'\nAS $function$\n  select public.hat_rolle_mindestens('moderator')\n     and public.aktuelles_admin_aal2()\n$function$\n",
      "body_sha256": "35e41fdae08f4663ffd9f58b3e7912b7faf13661ab0159c67067ad43f43498ab",
      "security_definer": false
    },
    {
      "oid": "72353",
      "name": "hat_rolle_mindestens",
      "owner": "postgres",
      "config": [
        "search_path=public, pg_temp"
      ],
      "arguments": "minimum text",
      "definition": "CREATE OR REPLACE FUNCTION public.hat_rolle_mindestens(minimum text)\n RETURNS boolean\n LANGUAGE sql\n STABLE SECURITY DEFINER\n SET search_path TO 'public', 'pg_temp'\nAS $function$\n  select coalesce(\n           public.rollenrang(public.aktuelle_rolle()) >= public.rollenrang(minimum),\n           false)\n$function$\n",
      "body_sha256": "367f630edefe6788750c6cabe7f5cb1b32d7c01ee4e3246d60632bf5ccd77f10",
      "security_definer": true
    },
    {
      "oid": "72351",
      "name": "rollenrang",
      "owner": "postgres",
      "config": [
        "search_path=pg_catalog"
      ],
      "arguments": "rolle text",
      "definition": "CREATE OR REPLACE FUNCTION public.rollenrang(rolle text)\n RETURNS integer\n LANGUAGE sql\n IMMUTABLE PARALLEL SAFE\n SET search_path TO 'pg_catalog'\nAS $function$\n  select case rolle\n           when 'user'      then 0\n           when 'creator'   then 10\n           when 'moderator' then 20\n           when 'operator'  then 30\n           when 'admin'     then 40\n           when 'owner'     then 50\n         end\n$function$\n",
      "body_sha256": "56d5753e4ccb189c2472c02a2737b6662c182381d03bf4de1954d069829fe850",
      "security_definer": false
    }
  ],
  "incoming_profile_foreign_keys": []
}
```

### Exact query

```sql
SELECT pg_catalog.jsonb_build_object(
 'receipt','E10C_PROFILE_AUTHORITY_PREDICATES_AND_INCOMING_FK_V1',
 'database',pg_catalog.current_database(),'session_user',session_user,'current_user',current_user,
 'profile_predicates',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'name',p.proname,'oid',p.oid,'arguments',pg_catalog.pg_get_function_identity_arguments(p.oid),
   'owner',pg_catalog.pg_get_userbyid(p.proowner),'security_definer',p.prosecdef,
   'config',p.proconfig,'definition',pg_catalog.pg_get_functiondef(p.oid),
   'body_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')) ORDER BY p.proname,p.oid)
   FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname IN (
     'darf_konten_verwalten','aktuelle_rolle','rollenrang','hat_rolle_mindestens','aktuelles_admin_aal2')),'[]'::jsonb),
 'incoming_profile_foreign_keys',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
   'oid',c.oid,'name',c.conname,'relation_schema',n.nspname,'relation',r.relname,
   'validated',c.convalidated,'deferrable',c.condeferrable,'deferred',c.condeferred,
   'definition',pg_catalog.pg_get_constraintdef(c.oid,true)) ORDER BY n.nspname,r.relname,c.conname)
   FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_class r ON r.oid=c.conrelid
   JOIN pg_catalog.pg_namespace n ON n.oid=r.relnamespace
   WHERE c.contype='f' AND c.confrelid='public.profiles'::pg_catalog.regclass),'[]'::jsonb)
) AS evidence;
```

### Root finding / disposition

The actual predicate is `hat_rolle_mindestens('moderator') AND aktuelles_admin_aal2()`; actual rank mapping is user 0, creator 10, moderator 20, operator 30, admin 40, owner 50. The actual current role is selected from public.profiles by auth.uid(). Complete incoming foreign-key metadata for public.profiles is empty.

Combined with E10B, this supports three conditional source findings: E10-IDENTITY-01 (a manager A who retains their own profile can rebind an unchanged Owner role/status row to a second controlled, existing Auth UID B without a profile); E10-STATUS-02 (non-Owner manager can change a higher-ranked foreign profile status through the direct data plane); E10-DELETE-03 (no rank guard on deletion of higher-ranked foreign profiles). These are P1 source findings, not a claim of actual exploitation, production equivalence, or completed synthetic native proof. A one-account sequence that first deletes A's manager profile is not the proven path: A loses its role on the subsequent ordinary request.

E10 remains OPEN and blocks HMT/hosted installation pending a selected bounded fix, independent exact-head review, native proof and actual Dev application/readback. No change to #917 STOP, #1131, real Owner/AAL2 requirements or private-schema exposure. No global ACL/RLS relaxation is authorized by this receipt.


## Complete actual receipt E10D

## E10D_PROFILE_INTEGRITY_INSTALL_SHAPE_V1 — actual Dev metadata

Technical Lead receipt, 2026-11-12. Dev `yfvbxvijcorffwxbxahl`; actual current/session user `postgres`. This finite read-only profile-integrity preflight supplements E10B (6825177327) and E10C (6825374617). It reads complete non-dropped profile column metadata, the seven already-observed profile authority/trigger function attributes and ACLs, and collisions for the two proposed new integrity objects. It reads no account/profile data rows and performs no mutation or exploit. It does not query or repeat any #917 refused ledger/capability/Pilot/Grant action.

```json
{
  "receipt": "E10D_PROFILE_INTEGRITY_INSTALL_SHAPE_V1",
  "database": "postgres",
  "current_user": "postgres",
  "session_user": "postgres",
  "profile_columns": [
    {
      "name": "id",
      "type": "uuid",
      "number": 1,
      "default": "uuid_generate_v4()",
      "raw_acl": null,
      "identity": "",
      "not_null": true,
      "collation": null,
      "generated": ""
    },
    {
      "name": "user_id",
      "type": "uuid",
      "number": 2,
      "default": null,
      "raw_acl": null,
      "identity": "",
      "not_null": true,
      "collation": null,
      "generated": ""
    },
    {
      "name": "role",
      "type": "text",
      "number": 3,
      "default": "'user'::text",
      "raw_acl": null,
      "identity": "",
      "not_null": true,
      "collation": "\"default\"",
      "generated": ""
    },
    {
      "name": "created_at",
      "type": "timestamp with time zone",
      "number": 4,
      "default": "timezone('utc'::text, now())",
      "raw_acl": null,
      "identity": "",
      "not_null": false,
      "collation": null,
      "generated": ""
    },
    {
      "name": "avatar_url",
      "type": "text",
      "number": 6,
      "default": null,
      "raw_acl": null,
      "identity": "",
      "not_null": false,
      "collation": "\"default\"",
      "generated": ""
    },
    {
      "name": "email",
      "type": "text",
      "number": 15,
      "default": null,
      "raw_acl": null,
      "identity": "",
      "not_null": false,
      "collation": "\"default\"",
      "generated": ""
    },
    {
      "name": "status",
      "type": "text",
      "number": 16,
      "default": "'active'::text",
      "raw_acl": null,
      "identity": "",
      "not_null": true,
      "collation": "\"default\"",
      "generated": ""
    },
    {
      "name": "last_seen_at",
      "type": "timestamp with time zone",
      "number": 17,
      "default": null,
      "raw_acl": null,
      "identity": "",
      "not_null": false,
      "collation": null,
      "generated": ""
    },
    {
      "name": "display_name",
      "type": "text",
      "number": 18,
      "default": null,
      "raw_acl": null,
      "identity": "",
      "not_null": false,
      "collation": "\"default\"",
      "generated": ""
    }
  ],
  "profile_functions": [
    {
      "oid": "72352",
      "set": false,
      "kind": "f",
      "name": "aktuelle_rolle",
      "owner": "postgres",
      "config": [
        "search_path=public, pg_temp"
      ],
      "strict": false,
      "raw_acl": [
        "postgres=X/postgres",
        "service_role=X/postgres",
        "authenticated=X/postgres"
      ],
      "returns": "text",
      "defaults": 0,
      "language": "sql",
      "parallel": "u",
      "arguments": "",
      "leakproof": false,
      "volatility": "s",
      "body_sha256": "41b223309c2228d87a0ac273ac31cc9ffcaa7e3ac406059d00818b947b09cbd0",
      "security_definer": true
    },
    {
      "oid": "73031",
      "set": false,
      "kind": "f",
      "name": "aktuelles_admin_aal2",
      "owner": "postgres",
      "config": [
        "search_path=pg_catalog"
      ],
      "strict": false,
      "raw_acl": [
        "postgres=X/postgres",
        "service_role=X/postgres",
        "authenticated=X/postgres"
      ],
      "returns": "boolean",
      "defaults": 0,
      "language": "sql",
      "parallel": "s",
      "arguments": "",
      "leakproof": false,
      "volatility": "s",
      "body_sha256": "d3cf53b48caba5d05eef08d940f1199b7ad58a8a78acefd1e899fda0c502ff1a",
      "security_definer": false
    },
    {
      "oid": "72472",
      "set": false,
      "kind": "f",
      "name": "darf_konten_verwalten",
      "owner": "postgres",
      "config": [
        "search_path=pg_catalog"
      ],
      "strict": false,
      "raw_acl": [
        "postgres=X/postgres",
        "service_role=X/postgres",
        "authenticated=X/postgres"
      ],
      "returns": "boolean",
      "defaults": 0,
      "language": "sql",
      "parallel": "s",
      "arguments": "",
      "leakproof": false,
      "volatility": "s",
      "body_sha256": "35e41fdae08f4663ffd9f58b3e7912b7faf13661ab0159c67067ad43f43498ab",
      "security_definer": false
    },
    {
      "oid": "72353",
      "set": false,
      "kind": "f",
      "name": "hat_rolle_mindestens",
      "owner": "postgres",
      "config": [
        "search_path=public, pg_temp"
      ],
      "strict": false,
      "raw_acl": [
        "postgres=X/postgres",
        "service_role=X/postgres",
        "authenticated=X/postgres"
      ],
      "returns": "boolean",
      "defaults": 0,
      "language": "sql",
      "parallel": "u",
      "arguments": "minimum text",
      "leakproof": false,
      "volatility": "s",
      "body_sha256": "367f630edefe6788750c6cabe7f5cb1b32d7c01ee4e3246d60632bf5ccd77f10",
      "security_definer": true
    },
    {
      "oid": "71396",
      "set": false,
      "kind": "f",
      "name": "profil_kerndaten_aus_auth",
      "owner": "postgres",
      "config": [
        "search_path=pg_catalog, public"
      ],
      "strict": false,
      "raw_acl": [
        "postgres=X/postgres",
        "service_role=X/postgres"
      ],
      "returns": "trigger",
      "defaults": 0,
      "language": "plpgsql",
      "parallel": "u",
      "arguments": "",
      "leakproof": false,
      "volatility": "v",
      "body_sha256": "05f4673d2bd0e2236a8b6047c29b2105d787e4f55792d0f1b8251547cc8f8422",
      "security_definer": true
    },
    {
      "oid": "72416",
      "set": false,
      "kind": "f",
      "name": "profil_rollenwechsel_pruefen",
      "owner": "postgres",
      "config": [
        "search_path=public, pg_temp"
      ],
      "strict": false,
      "raw_acl": [
        "postgres=X/postgres",
        "service_role=X/postgres"
      ],
      "returns": "trigger",
      "defaults": 0,
      "language": "plpgsql",
      "parallel": "u",
      "arguments": "",
      "leakproof": false,
      "volatility": "v",
      "body_sha256": "382d8bc00583596ef719b4185d47645baec410f71c2a7ebfb8e1c4df08ba8351",
      "security_definer": true
    },
    {
      "oid": "72351",
      "set": false,
      "kind": "f",
      "name": "rollenrang",
      "owner": "postgres",
      "config": [
        "search_path=pg_catalog"
      ],
      "strict": false,
      "raw_acl": [
        "postgres=X/postgres",
        "service_role=X/postgres",
        "authenticated=X/postgres"
      ],
      "returns": "integer",
      "defaults": 0,
      "language": "sql",
      "parallel": "s",
      "arguments": "rolle text",
      "leakproof": false,
      "volatility": "i",
      "body_sha256": "56d5753e4ccb189c2472c02a2737b6662c182381d03bf4de1954d069829fe850",
      "security_definer": false
    }
  ],
  "new_trigger_collisions": [],
  "new_function_collisions": []
}
```

Exact query:
```sql
SELECT pg_catalog.jsonb_build_object(
 'receipt','E10D_PROFILE_INTEGRITY_INSTALL_SHAPE_V1',
 'database',pg_catalog.current_database(),'session_user',session_user,'current_user',current_user,
 'profile_columns',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
 'number',a.attnum,'name',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),
 'not_null',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,
 'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid),'raw_acl',a.attacl,
 'collation',CASE WHEN a.attcollation=0 THEN NULL ELSE a.attcollation::pg_catalog.regcollation::text END
 ) ORDER BY a.attnum) FROM pg_catalog.pg_attribute a LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE a.attrelid='public.profiles'::pg_catalog.regclass AND a.attnum>0 AND NOT a.attisdropped),'[]'::jsonb),
 'profile_functions',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
 'oid',p.oid,'name',p.proname,'arguments',pg_catalog.pg_get_function_identity_arguments(p.oid),
 'owner',pg_catalog.pg_get_userbyid(p.proowner),'language',l.lanname,
 'returns',pg_catalog.pg_get_function_result(p.oid),'kind',p.prokind,
 'security_definer',p.prosecdef,'volatility',p.provolatile,'parallel',p.proparallel,
 'strict',p.proisstrict,'leakproof',p.proleakproof,'set',p.proretset,
 'config',p.proconfig,'raw_acl',p.proacl,'defaults',p.pronargdefaults,
 'body_sha256',pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(p.prosrc,'UTF8')),'hex')
 ) ORDER BY p.proname,p.oid) FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace ns ON ns.oid=p.pronamespace
 JOIN pg_catalog.pg_language l ON l.oid=p.prolang
 WHERE ns.nspname='public' AND p.proname IN ('darf_konten_verwalten','aktuelle_rolle','rollenrang','hat_rolle_mindestens','aktuelles_admin_aal2','profil_kerndaten_aus_auth','profil_rollenwechsel_pruefen')),'[]'::jsonb),
 'new_function_collisions',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
 'oid',p.oid,'name',p.proname,'arguments',pg_catalog.pg_get_function_identity_arguments(p.oid)))
 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace ns ON ns.oid=p.pronamespace
 WHERE ns.nspname='public' AND p.proname='profil_autoritaet_integritaet_pruefen_v1'),'[]'::jsonb),
 'new_trigger_collisions',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('oid',t.oid,'name',t.tgname))
 FROM pg_catalog.pg_trigger t WHERE t.tgrelid='public.profiles'::pg_catalog.regclass AND t.tgname='profiles_autoritaet_integritaet_v1'),'[]'::jsonb)
) AS evidence;
```

Disposition: the proposed names are currently absent. Existing function bodies still match E10B/E10C. UUID profile id and Auth user_id are distinct columns. Existing owners, table ACL/RLS and helper bodies must remain intact in the selected additive fix; no metadata receipt is a native pass, Dev install, Owner authorization or public activation.


## Complete actual receipt E18B

## E18B — new Human Method public-surface preflight / independent actual Dev readback

2026-11-12 13:26:29 UTC. Root performed one finite read-only SELECT through the Supabase connector on exact Dev **yfvbxvijcorffwxbxahl**, database postgres, session_user=current_user=postgres, PostgreSQL **170006**. This reads only the public schema ACL, creator function defaults and collisions for four newly proposed public method-wrapper names. It does not read old #917 ledger/capability/Pilot/Grant data, repeat its denied action, touch #1131, create an object or confer Owner/AAL2 authority.

### Actual values
- public schema OID2200, owner **pg_database_owner**.
- Raw schema ACL: `{pg_database_owner=UC/pg_database_owner,=U/pg_database_owner,postgres=U/pg_database_owner,anon=U/pg_database_owner,authenticated=U/pg_database_owner,service_role=U/pg_database_owner}`.
- Actual postgres has USAGE and CREATE. Complete effective non-superuser CREATE set is exactly pg_database_owner (NOLOGIN/INHERIT) and postgres (LOGIN/INHERIT).
- No global creator function default-ACL row returned. Public-specific row OID16493 owned by postgres has exactly EXECUTE for postgres and service_role, both grantor postgres, no grant option: `{postgres=X/postgres,service_role=X/postgres}`.
- No overload/procedure/function collision for public.official_v3_method_stage_draft_v1, public.official_v3_method_approve_v1, public.official_v3_method_revoke_v1, public.official_v3_method_confirm_operation_v1.

### Implication and boundary
The selected future installer must account for PostgreSQL's default public EXECUTE plus this actual per-schema service_role grant, and explicitly remove those privileges only from its four newly created functions within the same transaction, then verify owner+authenticated-only effective EXECUTE. This is not authorization for global defaults/schema/managed-role changes or normalization of unexpected grants. Other defaults, unknown inherited rights, collisions or changed targets must fail closed.

These values support a finite source implementation of four typed SECURITY INVOKER wrappers through the already exposed public schema. **E18/E24 remain OPEN**: no wrapper installed, no schema-cache/HTTP reflection tested, no signed Owner/AAL2 operation, no real method approval. HMA1/PG1 prerequisites and complete exact source review/native/runtime gates remain mandatory; GraphQL exposure must be considered under identical authorization.

### Exact read-only query
```sql
SELECT pg_catalog.jsonb_build_object(
  'receipt','E18B_NEW_HUMAN_METHOD_PUBLIC_SURFACE_PREFLIGHT_V1',
  'database',pg_catalog.current_database(),
  'server_version_num',pg_catalog.current_setting('server_version_num'),
  'session_user',session_user,
  'current_user',current_user,
  'public_schema',(SELECT pg_catalog.jsonb_build_object(
    'oid',n.oid,'owner',pg_catalog.pg_get_userbyid(n.nspowner),
    'raw_acl',n.nspacl::text,
    'creator_usage',pg_catalog.has_schema_privilege(current_user,n.oid,'USAGE'),
    'creator_create',pg_catalog.has_schema_privilege(current_user,n.oid,'CREATE'),
    'effective_non_super_create',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'role',r.rolname,'login',r.rolcanlogin,'inherit',r.rolinherit) ORDER BY r.rolname)
      FROM pg_catalog.pg_roles r WHERE NOT r.rolsuper AND pg_catalog.has_schema_privilege(r.oid,n.oid,'CREATE')),'[]'::jsonb)
  ) FROM pg_catalog.pg_namespace n WHERE n.nspname='public'),
  'creator_function_default_acls',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'oid',d.oid,'scope',CASE WHEN d.defaclnamespace=0 THEN 'global' ELSE ns.nspname END,
    'owner',pg_catalog.pg_get_userbyid(d.defaclrole),'raw_acl',d.defaclacl::text,
    'entries',(SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'grantor',pg_catalog.pg_get_userbyid(a.grantor),
      'grantee',CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_catalog.pg_get_userbyid(a.grantee) END,
      'privilege',a.privilege_type,'grantable',a.is_grantable) ORDER BY a.grantee,a.grantor,a.privilege_type)
      FROM pg_catalog.aclexplode(d.defaclacl) a)
    ) ORDER BY d.defaclnamespace)
    FROM pg_catalog.pg_default_acl d LEFT JOIN pg_catalog.pg_namespace ns ON ns.oid=d.defaclnamespace
    WHERE d.defaclrole=(SELECT oid FROM pg_catalog.pg_roles WHERE rolname=current_user)
      AND d.defaclobjtype='f' AND (d.defaclnamespace=0 OR ns.nspname='public')),'[]'::jsonb),
  'four_new_name_collisions',COALESCE((SELECT pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
    'name',p.proname,'oid',p.oid,'kind',p.prokind,'identity_arguments',pg_catalog.pg_get_function_identity_arguments(p.oid),
    'owner',pg_catalog.pg_get_userbyid(p.proowner)) ORDER BY p.proname,p.oid)
    FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN (
      'official_v3_method_stage_draft_v1','official_v3_method_approve_v1',
      'official_v3_method_revoke_v1','official_v3_method_confirm_operation_v1')),'[]'::jsonb)
) AS evidence;
```


## Author continuation boundary

All work in this author session is inert text, JSON, hashing and immutable Git-object construction. No parser, compiler, project test, PostgreSQL cluster, SQL, hosted metadata query, hosted write, official-source request, ref, PR, Ready or merge has been executed. Exact-head independent Root review is next; author self-review is never Technical-Lead PASS.

Every new candidate head invalidates earlier exact-head gates. Immediate review fixes belong to this same named session while reachable. If Root selects a replacement because a session is unreachable, the Product Owner's standing replacement-session exception must be recorded; it does not remove any independent review or security boundary.


## Complete selected PAI1-FIX1 task

## PAI1-FIX1 — exact baseline claim-query result labels; immediate original-session review-fix

Root selection under CHANGES REQUIRED https://github.com/Jetnity/jetnity/pull/1196#issuecomment-6829449466. Original implementation identity: **Jetnity Profile Authority Integrity1 — Codex Generation1**, original task #1139 comment6825593411/A1 comment6825665177. Return to that original reachable session; if it truly cannot be reached, record the replacement session under the user's standing exception, never impersonate the original.

**Sole source parent:** failed HDP integration commit `a686e608f597ffa82d44fc9d3992b9b566b89688`, tree `b4f54fad7d9981f8b7676b42b271bf6740a17f48`,9538 leaves. No publication or hosted operation is selected.

### Concrete independently read failure and cause

Actual CI4139/run43258240430/Hosted job131322201372: PAI1-01 exits with `local_pg_duplicate_column`, before its original-defect proof completes. Full log159255bytes/SHA256 `3e7a7eb2f7a293a83419fccf087ecf2d67816f2db4f122ed625f878019cfe55c`.

Root read the complete Native blob `74ee8cad74835c6e6fa6757cfefb40d878704898`,62605bytes/SHA256 `b6576c95203080decd985d2759fad8482248190d7e91780119c8485e0f12623f`, and actual unchanged wire reader. `setClaims()` executes one SELECT containing three `pg_catalog.set_config(...)` expressions with no aliases. Each result column is therefore named set_config; the existing wire reader rejects duplicate result-column names. This runs at the first f.update through asHuman, matching the actual first-group failure.

### Narrow correction

Add three explicit distinct result aliases to that one SELECT, for example claim_reset/sub_reset/claims_value. Preserve the three actual set_config expressions, arguments, parameter, false/local flag, order, query count and await. Do not expose their returned claim contents in logs. Change no wire-reader behavior, JWT precedence, simulated identity, fixture rows, old profile/Auth baseline, production SQL, security guard, scenario, assertion, timing, cleanup or role semantics.

Allowed changes: `scripts/db/profile-authority-integrity-1/native.ts` and its four existing PROFILE_AUTHORITY_INTEGRITY Task/Handoff/Recovery/Manifest evidence documents only. The installer, observed-baseline.json, wrapper and all other9533parent leaves stay exact. Retain all ten proof groups, the three real old-contract defects, false one-account sequence refusal, full Auth cascade, original90s effects/35s drain/130s wrapper,3clusters/16connections/4096operations and actual ownership accounting.

Preserve complete prior task/handoff/history and this exact task; report actual old failure honestly. Produce complete before/after pins, one exact forward edit/inverse for Native and full complement proof. Update only affected current pins; historical original pins remain historical. No runtime PASS or Dev correction claim.

SOURCE ONLY: immutable Git objects and inert text/hash/tree comparisons; no project/parser/compiler/test/native/SQL/build/APT/CI/hosted/sourceGET, ref/PR/Ready/merge, real account or credential action. Return exact new commit/tree and full pins, then STOP reachable for independent Root review and coherent full re-gating. All #917/#1131 boundaries remain.


## Retained actual CI4139 failure and correction boundary

## TL CHANGES REQUIRED — HDP1-A1 / CI4139

Exact head `a686e608f597ffa82d44fc9d3992b9b566b89688`, run `43258240430`, attempt1. Root independently read both complete failing logs. No Ready, merge, Dev installation, source/public activation or retry of this unchanged head is selected.

**Core job131322201382:** 108128 bytes, SHA256 `3d20826117e7e24ce8ea3b977aa0b4aa83e4ddef2d3d773c8f6fb193d05c8890`. Typecheck fails at HS1 native.ts(683,40): Promise<Record<string,unknown>> cannot be passed as Promise<void>. Later Core gates did not execute.

**Hosted PG17 job131322201372:** 159255 bytes, SHA256 `3e7a7eb2f7a293a83419fccf087ecf2d67816f2db4f122ed625f878019cfe55c`. Actual signed packages/owned server report PG170012. Six mandatory wrappers executed; 19 tests,10pass,9fail,0cancel,0skip.

- COMPOSED C01 fails with SQLSTATE42601 before any group completes.
- HM04 fails specifically at phase intake_candidate with SQLSTATE42601; all25 owned operations settled, three connections closed and one started cluster stopped. Its own31-group proof is not passed.
- HS1's first atomic prerequisite group passes; its next hostile-grant group encounters42601 instead of the expected guarded refusal. This is a real failure, not acceptable refusal evidence.
- HMT's first group fails withP7903; no HMT group completes. Actual442/442 owned operations, four connections closed, one started cluster stopped.
- PAI1's first baseline-defect group fails with local_pg_duplicate_column from the actual wire reader; no subsequent profile-integrity proof passes.
- The unchanged HMA1 package still passes all eight groups, actual owned waits/rollback/late-writer recovery and terminal cleanup. That does not waive any failure above.

### Immediate versioned original-session review-fix assignments

**HS1/HDP1-FIX1:** original Hosted Intake / HDP1 Generation1 session takes the immediate HS1 type/SQL42601 review-fix. Source parent is this exact failed a686 head. Permitted source edits only within the original eight HS1 package paths: install/recovery/native/wrapper and four HOSTED_INTAKE_STORE evidence documents, plus the three HOSTED_DEV_PACKAGE evidence documents. Diagnose the actual syntax/typed ownership cause first; report it precisely. Repair syntax/types while preserving every role/grantor/dependency/RLS/catalog requirement, every scenario, original effect/drain/deadline limits, actual joins and failure propagation. No catch/skip/expected42601 workaround, relaxed inventory or runtime authority. Any changed self-body/dependency pins must be complete and independently reconstructable. Do not silently rewrite COMPOSED or HM04 source pins; report the exact downstream dependency amendment needed for a separately selected integration.

**HMT1-FIX1:** original Human Method Transport Generation1 session pauses the in-progress UI task with its source retained and immediately diagnoses the actual P7903. Source parent is the same failed a686 head. Permitted source edits only within its original eight HMT package paths (install/recovery/native/wrapper plus four HUMAN_METHOD_TRANSPORT evidence documents). Any correction must retain all four parsed SQL INVOKER wrappers, exact actual Owner/AAL2 PG1 chain, role/ACL/dependency/function-identity checks, unchanged historical receipts, fresh confirmation, every eight Native groups and original resource/cleanup limits. Do not convert a shape/identity refusal into expected success or relax the guard. If the existing redacted SQLSTATE does not identify the cause, report the precise bounded diagnostic source amendment first; do not claim a speculative cause. The UI task remains unfinished, with its A1 dependency parent historical until Root reconciles the corrected integration.

PAI1-FIX1 remains assigned to the original PAI author once its precise baseline query defect is independently identified. No changes to the production wire reader or old profile/Auth baseline are authorized.

All fixes are **SOURCE ONLY**: immutable Git object authoring and inert text/hash/tree inspection; no parser/compiler/project/test/native/SQL/APT/CI/hosted/sourceGET execution or refs/PRs/Ready/merge. Preserve every prior task/handoff/failure verbatim, append the exact fix task, provide complete parent→candidate diff/inverse/full pins and honest NOT_RUN status, then STOP reachable. Root reviews actual changes, selects a coherent new integration head and performs complete fresh exact-head gates. No author self-review substitutes for TL-PASS.

#917's accepted human Stage1 readback stays scoped; the denied action is not repeated, rerouted or delegated. #1131 remains NOT_REQUIRED and untouched. No weakening of user or platform security boundaries.

