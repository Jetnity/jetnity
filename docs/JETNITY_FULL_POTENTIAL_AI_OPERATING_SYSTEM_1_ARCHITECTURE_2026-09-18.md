# Jetnity – Full-Potential AI Operating System 1 – Architecture

Stand: 18. September 2026  
Status: **FOUNDATION ARCHITECTURE / EXTENDS CANONICAL GOVERNANCE / NOT A COMPETING SYSTEM**  
Issue: #488  
Draft PR: #489  
Branch: `governance/full-potential-ai-operating-system-1`  
Canonical base: `main@0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2`

This slice extends the existing Technical-Lead, Multi-Agent, Slice-Planning and Guardian standards. `.jetnity/operating-mode.json` is enforcement metadata only.

## 1. Authority matrix

| Decision class | Product Owner | ChatGPT / Technical Lead | Cursor writer | Guardian / specialized Grok | Cursor subagent |
| --- | --- | --- | --- | --- | --- |
| Fundamental product / business / build-order change | **Required** | Recommends | No | Challenge only | No |
| Production / destructive DB / Identity / Security | **Required** | May prepare read-only evidence | No | Challenge only | No |
| Large Production RLS / ownership / identity | **Required** | May design, not apply | No | Challenge only | No |
| Fundamental Auth / Session / MFA / AAL | **Required** | May design, not apply | No | Challenge only | No |
| Sensitive passport / MRZ / biometric / document / health expansion or sensitive external sharing | **Required** | May design, not apply | No | Challenge only | No |
| Secrets, provider contracts, Terms / DPA | **Required** | May draft questions | No | No | No |
| Real paid provider calls / live provider activation | **Required** | No silent activation | No | No paid calls | No |
| Real payments / money movement | **Required** | No | No | No | No |
| Public Launch / indexing / domains / Store Live | **Required** | No | No | No | No |
| New material recurring cost > USD 100/month unless a stricter gate applies | **Required** | Must stop and ask | No | Flag only | No |
| Explicitly reserved PO decisions / HOLD | **Required** | Obeys | Obeys | Obeys | Obeys |
| Normal architecture / product engineering | Informed | **Owns** | Implements tasked slice | Challenges | Parent-scoped only |
| Slice selection inside allowed operating mode | Informed | **Owns autonomously** | No | No | No |
| Agent graph / model / session / branch topology | Informed | **Owns** | One assigned writer | No | No second chain |
| Review verdicts / CHANGES REQUIRED routing | Informed | **Owns** | Same-session fix only | Evidence input | No |
| Ready / Merge for normal scope-faithful PRs after independent exact-head PASS | Informed | **Owns** | **Never** | **Never** | **Never** |
| Post-merge verification | Informed | **Owns** | No | Optional evidence | No |
| Next bounded slice after HOLD exit | Informed | **Owns autonomously** unless HOLD/special gate | No automatic follow-up | No automatic follow-up | No |

`no automatic follow-up slice` binds Cursor, Guardian and reviewer agents. It does not require the Product Owner to pick every next normal slice.

## 2. Agent / reviewer lane matrix

Two layers, not one collapsed roster:

1. **Permanent Grok Intelligence & Assurance roles** (canonical target of ten, documentation only): Chief of Staff, Guardian, Market & Traveller Intelligence, Provider & Commercial Intelligence, Travel Truth & Regulation Intelligence, Product & UX Explorer, Growth & Discoverability, Analytics & Experimentation, FinOps & Reliability, Security & Privacy Red Team. Defined in `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md` §13a. Responsibilities must not be silently collapsed into five generalists.
2. **Engineering/review lanes** (scope-dependent, not 1:1 with the ten bots): Builder, Codebase Explorer, Architecture & Truth, Security & Privacy review, DB / RLS specialist, QA / Regression, UX / Accessibility, Performance, Cost / Quota, Release / Continuity, Documentation / Continuity. Canonical table: `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` §2a.

Summary:

- **Builder** is the only writer on a branch.
- All other listed lanes are read-only challenge/evidence unless the tasked writer already owns that documentation slice.
- Guardian/Grok means the separate Product-Owner Guardian app. Cursor Grok 4.6 High Fast is a Cursor implementation model and must never be labelled Guardian or any of the nine future identities.
- A Cursor specialist may fill a read-only lane only when that capability is actually available and the Technical Lead scoped it that way. Missing capability is documented as `not checked`, never invented.
- Chief of Staff coordinates Grok specialists; it does not replace the Technical Lead.

## 3. Branch / PR topology

This foundation is **SINGLE_AGENT** because it owns the shared canonical governance files and the CI guard.

| Item | Value |
| --- | --- |
| Branch | `governance/full-potential-ai-operating-system-1` |
| Issue / PR | #488 / #489 Draft |
| Base | `main@0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2` |
| Parallel writers on these files | **Forbidden** |
| Parked product PR | #487 at `12d070a79c35fbb9f03d1302833eee8561ec17bd` — do not resume, merge or follow |

After this foundation is merged and independently verified, later AI-OS meta-slices may run in parallel **only** with disjoint file/contract ownership and a Technical-Lead-defined integration order.

## 4. Routine trigger matrix

Two catalogs:

**Engineering operating routines now** — `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` §11.1:

1. startup / live reconstruction;
2. operating-mode / HOLD check before any new dispatch;
3. special Product-Owner gate detection;
4. slice precheck + multi-agent suitability;
5. task / branch / Draft-PR / dispatch;
6. same-session CHANGES REQUIRED;
7. exact-head review;
8. main-drift / rebase / regate;
9. high-risk Guardian trigger (TL prompt, PO runs separate app);
10. post-merge verification;
11. continuity stale-doc audit.

**Future Grok automation catalog** — documented only, not scheduled: Daily Repository/CI Pulse; Market Radar; Traveller Pain-Point Radar; Provider/Commercial Change Radar; Travel Truth/Regulation Radar; Product/UX Synthetic Journey Review; Growth/Discoverability Review; Analytics/Experiment Review; FinOps/Reliability Watch; Security/Privacy Adversarial Review; Weekly Strategic Opportunity Synthesis; Milestone Whole-Jetnity Audit; PR/CI/Release triggered reviews.

Chief of Staff later consolidates those into **JETNITY DAILY INTELLIGENCE BRIEF** and **JETNITY WEEKLY STRATEGIC BRIEF**. Schemas live in `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md` §13a. This slice does not generate briefs or create schedules.

Routines may use connected skills/tools only when those tools are actually present. This slice does not claim browser, billing, Supabase-write or external Grok-admin capability.

## 5. GitHub Evidence Bus contract

Canonical contract: `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md` §4.1.

Every material handoff must include exact base/head SHAs, agent name/generation, available session ID, known model/capability, ownership scope, findings with severity, evidence checked, evidence not checked, CI/Vercel/DB/Production bindings or an explicit not-checked statement, blocker/gate, next responsible actor, and an explicit STOP. Agent UI state is not continuity.

## 6. Mechanical enforcement design

| Piece | Role |
| --- | --- |
| `.jetnity/operating-mode.json` | Current mode, HOLD facts, parked PR pointer, exit condition, branch/path policy |
| `scripts/operating-mode-guard.mjs` | Deterministic local/CI guard; no network, secrets, providers or paid services |
| `npm run check:operating-mode` | CLI entry |
| CI `Operating mode` step | Runs on every PR and on `main` push |
| `fetch-depth: 0` | Required so the guard can diff the PR against the exact base SHA without APIs |

Behaviour:

- **PR + `AI_OS_BUILD_HOLD`:** fail closed on unauthorized branch class; fail closed if any changed path is outside the governance/continuity/enforcement allowlist; `governance/full-potential-ai-operating-system-1` is authorized; `app/`, `lib/`, `supabase/` and other runtime prefixes are rejected unless later explicitly allowlisted, which this foundation does not do.
- **`main` push:** validate JSON/schema/required references and canonical file presence; scan Always-Apply Cursor rules for the two stale merge-authority phrases; do **not** run the PR-diff hold check.
- **Always:** fail if those stale phrases reappear in `.cursor/rules/*`.

This guard does not replace Technical-Lead review and does not grant Cursor any merge or Production authority.

## 7. HOLD exit criteria

Mode may leave `AI_OS_BUILD_HOLD` only when **all** are true:

1. this foundation is merged to `main`;
2. post-merge CI and relevant Vercel Production evidence exist on the exact merge SHA;
3. an independent Technical-Lead PASS recorded the operating system as integrated;
4. a **dedicated** Technical-Lead closure updates `.jetnity/operating-mode.json` and the startup surfaces.

Parked PR #487 is not unparked by this exit. Unparking it is a separate TL decision after HOLD lift.

## 8. Future Grok-app setup checklist

Documentation only. Canonical ten-role pack: `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md` §13a.

Product Owner later, not this slice, role by role:

1. decide whether any identity beyond the existing Guardian app is actually needed now; do not pre-create all ten;
2. if created, name it exactly (`Jetnity Chief of Staff`, `Jetnity Market & Traveller Intelligence`, `Jetnity Provider & Commercial Intelligence`, `Jetnity Travel Truth & Regulation Intelligence`, `Jetnity Product & UX Explorer`, `Jetnity Growth & Discoverability`, `Jetnity Analytics & Experimentation`, `Jetnity FinOps & Reliability`, `Jetnity Security & Privacy Red Team`);
3. install least-privilege GitHub permissions (read + optional comment write; never contents write, admin, secrets, merge);
4. keep Vercel/Supabase/billing/Production-admin disconnected until a separate connection decision for that exact role;
5. do not start daily/weekly schedules merely because the catalog exists;
6. never treat `@cursor` as Guardian or as any future Grok identity.

## 9. Remaining OS meta-slices — exact dependency order

Cursor must **not** start these.

| Order | Slice | Dependency | Parallelism after this foundation is on `main` | Owner |
| --- | --- | --- | --- | --- |
| 0 | **This foundation** — shared governance + mechanical HOLD | none | SINGLE_AGENT now | Cursor writer of #489, then TL review |
| 1 | Independent Technical-Lead exact-head review + optional Guardian prompt | this PR head | serial | Technical Lead; PO runs Guardian if requested |
| 2 | Ready/Merge + post-merge verification of this foundation | TL PASS | serial | Technical Lead only |
| 3 | Optional Evidence-Bus prompt/template pack | foundation on `main` | may be parallel with 4 if file ownership is disjoint from `operating-mode.json` / CI guard | later tasked writer |
| 4 | Optional routine-prompt pack for startup/review/regate | foundation on `main` | may be parallel with 3 if disjoint | later tasked writer |
| 5 | External specialized Grok-app creation + permissions | PO decision; docs already exist | not a Cursor writer slice | Product Owner only |
| 6 | Dedicated HOLD-exit / mode-change closure | OS integrated + independently verified | serial; owns `.jetnity/operating-mode.json` | Technical Lead |
| 7 | Decision on parked PR #487 | HOLD lifted or explicit PO/TL unpark | serial, separate branch | Technical Lead; do not start Writer 1 from this slice |

No normal product/runtime slice appears in this order while HOLD is active.
