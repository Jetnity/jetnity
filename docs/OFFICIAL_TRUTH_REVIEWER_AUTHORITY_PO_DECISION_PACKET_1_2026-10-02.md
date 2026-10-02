# Official Truth Reviewer Authority — Product-Owner Decision Packet 1

Date: 2 October 2026
Issue: #739
Baseline: `main@aa506fd68d95a9c242e10cf746da57acf737250f`
Status: **PRODUCT-OWNER AUTHORITY GATE / DECISION ONLY / NO AUTH OR RUNTIME CHANGE**

## 1. Why a Product-Owner decision is now required

The Official Truth chain now has:

- accepted Evidence and Rule Candidate foundations;
- Rule Review Packet and deterministic packet identity;
- advisory review suggestions;
- a pure Rule Review Decision Intent;
- a corrected binding acceptance architecture.

The next current-V1 path requires a **server-verified human/operator authority** before any fact-entry or Rule acceptance path may be implemented.

No current Jetnity capability is authorized for that authority.

The binding #731 architecture explicitly states that:
- moderator/read capabilities are not acceptance authority;
- `betrieb-eingreifen` is not acceptance authority;
- silently reusing `konfiguration-verwalten` would allow every admin with that capability to mint Official Truth and is itself an authority decision;
- adding or remapping a capability is a major Auth/role/data-plane decision and therefore a Product-Owner gate.

The Technical Lead may prepare this packet but must not choose the authority on the Product Owner's behalf.

## 2. Current verified role/capability model

Current roles, in increasing authority:

`user < creator < moderator < operator < admin < owner`

Current capabilities:

| Capability | Minimum role | Current meaning |
| --- | --- | --- |
| `betrieb-lesen` | moderator | read operational/security/payment surfaces |
| `betrieb-eingreifen` | operator | operational interventions |
| `konten-verwalten` | moderator | account role/status management |
| `inhalte-moderieren` | moderator | review/moderate other users' content |
| `konfiguration-verwalten` | admin | system configuration; currently no table surface |

Jetnity keeps TypeScript and database authority in lockstep:
- every capability in `CAPABILITY_MINIMUM` has a matching `public.darf_*()` function;
- CI fails when the application and database capability sets diverge;
- current admin access still requires verified `auth.getUser()`, sufficient role/capability and **current AAL2**;
- break-glass may open the surface but does not carry database authority and must not mint Official Truth.

## 3. Decision options

### Option A — dedicated owner-only capability — Technical-Lead recommendation

Add a new capability:

`official-truth-freigeben`

Initial V1 minimum role:

`owner`

Binding authority:
- verified server identity;
- `currentLevel === 'aal2'`;
- `grant === 'role'`;
- dedicated capability check;
- break-glass forbidden for fact entry/acceptance;
- no request-body role, reviewer or AAL assertions;
- no model/plugin authority.

Why this is the recommended prelaunch choice:
- it gives Official Truth its own explicit authority instead of hiding it under an unrelated capability;
- it preserves least privilege at the point where Jetnity can create regulatory truth used for travellers;
- the current role model is threshold-based, not per-user capability assignment. An `admin` minimum would therefore allow every admin account to exercise this authority;
- owner-only is easy to widen later, while recovering from an overly broad acceptance authority is harder;
- lowering the minimum to `admin` later would require another explicit Product-Owner authority decision.

This approval would authorize a later bounded implementation slice for the new capability and matching database authority function. It would **not** by itself authorize the endpoint, persistent reviewer decision/audit store, retention policy, Production migration, or automatic Official Truth acceptance.

### Option B — dedicated admin-level capability

Add the same dedicated capability but set minimum role to `admin`.

Advantages:
- semantic separation from configuration remains correct;
- future policy can target Official Truth authority independently.

Trade-off:
- because Jetnity capabilities are currently role-threshold based, every admin and owner would immediately satisfy the application-level capability once the change is activated;
- broader authority than Option A at a very sensitive trust boundary.

This remains a valid Product-Owner choice, but is not the Technical Lead's recommended prelaunch default.

### Option C — reuse `konfiguration-verwalten`

Use existing admin-level `konfiguration-verwalten`.

Advantages:
- no new capability name.

Disadvantages:
- conflates system configuration with regulatory truth acceptance;
- grants Official Truth authority to every admin with that existing capability;
- makes later auditing and privilege review less explicit;
- directly crosses the authority decision that #731 deliberately left unresolved.

Not recommended.

### Rejected design — direct role checks or break-glass

Do not implement:
- `role === 'owner'` or `role === 'admin'` as a new one-off authorization path outside the capability model;
- `ADMIN_ALLOWED_EMAILS` / break-glass as Official Truth authority;
- a client-supplied reviewer/role/AAL field;
- a service-role secret as proof that the human reviewer was authorized.

Those would create competing authority systems or bypass the established fail-closed model.

## 4. What approval of Option A would authorize

Only the next bounded authority-foundation implementation may be prepared:
- add `official-truth-freigeben` to the canonical capability model with minimum role `owner`;
- add the matching database `darf_official_truth_freigeben()` authority function through the normal reviewed migration path;
- update the existing application/database capability alignment tests;
- prove AAL2 and role-grant behavior remains fail closed;
- preserve break-glass as non-data-plane authority;
- Development-first verification if a hosted database apply becomes necessary.

It does **not** authorize:
- changing a user's role;
- granting a real person a new role;
- a Production migration/apply;
- an Official Truth acceptance endpoint;
- persistent reviewer-decision/audit storage;
- a retention period;
- calling `regelKandidatAkzeptieren` from a live endpoint;
- automatic/model acceptance;
- provider/model/network calls;
- secrets, paid calls, public launch or indexing.

Those remain separate steps/gates.

## 5. Gate immediately after capability foundation

Even after the authority capability exists, cross-request fact entry still needs a server-held binding between:
- verified reviewer;
- exact `reviewPacketKey`;
- decision state;
- timestamp/provenance.

Choosing and implementing persistent reviewer decision/audit storage and its retention policy is a separate Product-Owner/security gate. The existing #626 7-day security-event retention does not automatically apply.

## 6. Technical-Lead recommendation

**Approve Option A: a dedicated `official-truth-freigeben` capability with V1 minimum role `owner`, current AAL2, role grant only, and no break-glass authority.**

This is the narrowest responsible prelaunch authority and keeps the path reversible: Jetnity can later broaden the minimum role after real operational evidence, without weakening the trust boundary now.

## 7. Product-Owner decision requested

Choose exactly one:

- **APPROVE A** — dedicated `official-truth-freigeben`, minimum role `owner` — recommended.
- **APPROVE B** — dedicated `official-truth-freigeben`, minimum role `admin`.
- **APPROVE C** — reuse `konfiguration-verwalten` at its current admin threshold.
- **HOLD** — do not allocate Official Truth reviewer authority yet.

Until one choice is explicit, no capability/auth/data-plane implementation may start.

No option here authorizes Production, persistent audit storage, a live acceptance endpoint, model acceptance or public launch.
