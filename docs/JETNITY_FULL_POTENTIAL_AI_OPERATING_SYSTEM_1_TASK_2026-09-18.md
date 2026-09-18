# Jetnity – Full-Potential AI Operating System 1 – Binding Task

Stand: 18. September 2026  
Issue: #488  
Branch: `governance/full-potential-ai-operating-system-1`  
Canonical base: `main@0c83af42f8dd8c7572f531f5c2d766f4c0dba3f2`

## 1. Product-Owner priority directive

Normal Jetnity product development is temporarily **ON HOLD**.

Exclusive active meta-scope:

> **JETNITY FULL-POTENTIAL AI OPERATING SYSTEM**

Do not start a normal product/runtime/security/account/provider/UX slice until this operating system has been canonically integrated and independently verified.

The current parked product slice is PR #487 / Issue #486 at exact head:
`12d070a79c35fbb9f03d1302833eee8561ec17bd`

It is a safe Draft STOP point and must not be resumed, merged, or followed by Security Event Writer 1 inside this slice.

Issue #440 contains the canonical temporary Product-Owner override.

## 2. Reuse before add

Read and extend, do not replace:

- `JETNITY_START_HERE.md`
- `AGENTS.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`
- `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
- `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`
- `docs/ACTIVE_WORK_STATUS.md`
- current new-chat checkpoint
- `.cursor/rules/*`
- current `.github/workflows/ci.yml`
- current `package.json`

Do not invent a second authority chain or competing agent governance.

## 3. Known contradiction that MUST be fixed

Current main has contradictory Always-Apply Cursor rules:

- `.cursor/rules/jetnity-merge-approval.mdc` correctly gives normal Ready/Merge authority only to ChatGPT / Technical Lead.
- `.cursor/rules/jetnity-progress-persistence.mdc` still says: `Never merge without explicit current Product Owner approval.`
- `.cursor/rules/jetnity-expert-proactivity.mdc` still says: `The Product Owner decides ... every merge.`

The latter two are stale and must be aligned with the canonical Technical-Lead operating standard.

No agent may receive contradictory merge authority after this slice.

## 4. Authority model to encode

### Product Owner — reserved decisions only

Product Owner remains required for:

- fundamental product/business-model direction changes;
- Production/destructive DB/Data/Identity/Security gates;
- large Production RLS/ownership/identity changes;
- fundamental Auth/Session/MFA/AAL changes;
- sensitive passport/MRZ/biometric/document/health data expansion or sensitive external sharing;
- secrets, provider contracts, external contracts/Terms/DPA;
- real paid provider calls / live provider activation;
- real Payments / money movement;
- Public Launch / indexing / domains / Store Live;
- new material recurring costs outside existing budget governance (> USD 100/month unless a stricter existing gate applies);
- decisions explicitly reserved by the Product Owner.

### ChatGPT / Technical Lead / Orchestrator

Autonomously owns normal:

- architecture and product engineering;
- slice selection and prioritisation inside the active operating mode;
- agent graph / model / session / branch topology;
- task scoping and collision boundaries;
- technical/security/privacy/truth decisions that do not cross a special PO gate;
- review verdicts;
- CHANGES REQUIRED routing;
- Ready/Merge for normal scope-faithful PRs after independent exact-head PASS;
- post-merge verification;
- continuity;
- selection/start of the next bounded slice when the operating mode permits it.

Important correction:
`no automatic follow-up slice` applies to Cursor/Guardian/reviewer agents. It must **not** be interpreted as requiring the Product Owner to manually select every next normal slice. The Technical Lead may do so autonomously unless a PO HOLD or special gate says otherwise.

### Cursor

Primary writer. One writer per branch/slice.

Capability-conditional Cursor subagents/cloud agents may be used when the Cursor product exposes them, but they remain subordinate to the branch owner and may not create a second authority chain.

Default:
- read/research/test-analysis subagents are allowed inside the parent's scope;
- a second writer is allowed only on an explicitly separate branch with disjoint file/contract ownership and a TL-defined integration order;
- no subagent/child gets Ready/Merge/follow-up authority.

### Guardian / specialized Grok

Independent challenge/evidence lanes.

Do not create the external Grok team in this slice.

Repository governance must define the future least-privilege roster and setup checklist, but actual external-app creation remains a later Product-Owner action.

Guardian/specialized Grok remains read-only/observer-first except narrowly scoped GitHub comment/evidence permission if later explicitly configured.

## 5. Full-potential agent/reviewer lanes

Extend the existing Multi-Agent Operating System so the TL can route work by risk/domain rather than using every agent for every task.

At minimum define:

- Builder / implementation writer
- Architecture & Truth challenger
- Security & Privacy red team
- QA / Regression hunter
- Release / Continuity auditor
- Product / UX / Opportunity challenger
- Performance / Accessibility reviewer
- Cost / Provider / Quota reviewer

Define for each:
- when to trigger;
- whether writer or read-only;
- allowed evidence sources;
- output contract;
- collision rules;
- escalation path;
- whether Guardian/Grok, Cursor specialist, or either can fill the lane depending on available capability.

Do not claim a tool/capability exists if it is not actually available.

## 6. GitHub Evidence Bus contract

Strengthen the existing standard so every material agent/reviewer handoff has:

- exact main/base SHA;
- exact branch/head SHA;
- agent logical name + generation;
- available session ID;
- model/capability if known;
- files/ownership scope;
- verdict/findings with severity;
- evidence actually checked;
- evidence not checked;
- CI/Vercel/DB/Production bindings where applicable;
- blocker/gate;
- exact next responsible actor;
- explicit STOP point.

Agent UI state alone is never continuity.

## 7. Automated routine/trigger matrix

Encode reusable routines, not bespoke chat habits.

At minimum:
- startup/live-reconstruction routine;
- slice precheck + multi-agent suitability routine;
- task/branch/Draft-PR/dispatch routine;
- same-session CHANGES REQUIRED routine;
- exact-head review routine;
- main-drift/rebase/regate routine;
- high-risk Guardian trigger;
- post-merge verification routine;
- continuity stale-doc audit routine;
- operating-mode/HOLD check before any new dispatch;
- special Product-Owner gate detection.

Routines may describe use of connected skills/tools conditionally, but must never promise unavailable capabilities.

## 8. Mechanical operating-mode enforcement

Create one machine-readable implementation of the canonical operating mode. This is enforcement metadata, not a competing governance source.

Suggested path:
`.jetnity/operating-mode.json`

Required state now:
- mode = `AI_OS_BUILD_HOLD`
- normal product slices blocked
- governance/continuity/evidence work allowed only within explicit path/branch policy
- exact Product-Owner override date/reference
- parked PR #487 resume pointer
- exit condition: Full-Potential AI Operating System integrated + independently verified; a dedicated TL closure changes mode only after that evidence exists
- special PO gates remain in force

Create:
`scripts/operating-mode-guard.mjs`

Add:
`npm run check:operating-mode`

Integrate it into CI.

### Guard requirements

On pull requests while mode is `AI_OS_BUILD_HOLD`:
- fail closed for a non-authorized branch class;
- fail closed if changed files exceed the governance/continuity/enforcement allowlist;
- this branch `governance/full-potential-ai-operating-system-1` must be allowed;
- normal runtime/product paths must be rejected.

On `main` push:
- validate the operating-mode JSON/schema/required references;
- validate canonical governance consistency;
- do not perform a PR-diff hold check.

The guard must also fail if the stale contradictory Cursor phrases reappear:
- `Never merge without explicit current Product Owner approval`
- `The Product Owner decides major product direction and every merge`

Do not use network access, secrets, providers, or paid services.

If implementing PR diff detection requires full Git history, update CI checkout safely (e.g. `fetch-depth: 0`) and document why.

## 9. Cursor Always-Apply enforcement

Update existing rules rather than replacing them.

Required:
- fix merge-authority contradictions;
- add one narrow Always-Apply operating-mode rule if needed;
- rule must tell Cursor to read the machine operating mode before starting work;
- during `AI_OS_BUILD_HOLD`, Cursor must refuse/stop normal product follow-up and point to the current governance meta-scope;
- Cursor still obeys one-writer, exact-head, persistence, no Ready/Merge.

No rule may grant Cursor Production/provider/payment authority.

## 10. Canonical startup/continuity updates

Update the existing startup/status/checkpoint surfaces so a new chat immediately knows:

- PRODUCT DEVELOPMENT HOLD is active;
- full-potential AI OS is exclusive priority;
- PR #487 is parked safely, not lost;
- current governance slice is the active writer;
- normal product follow-up is forbidden until OS closure;
- Technical Lead autonomous normal decision authority remains, constrained by operating mode and special gates;
- external Grok team is not yet created.

Do not erase historical closures.

## 11. Future Grok-app setup pack — documentation only

Within existing Grok/Guardian standard, define the future specialized bot roster and minimum permissions.

Recommended logical roster:
1. Release / Continuity Guardian
2. Security / Privacy Red Team
3. Architecture / Truth Challenger
4. Product / UX / Opportunity Challenger
5. Cost / Performance / Provider Guardian

For each define:
- purpose;
- default read-only systems;
- exact-head report format;
- whether GitHub comment permission is useful;
- forbidden permissions;
- when the TL requests a run.

Do **not** create these bots or grant permissions.

Document exactly what the Product Owner will later need to configure in the external Grok app.

## 12. Collision-safe topology

This foundation is **SINGLE_AGENT** because it owns the shared canonical governance and CI guard.

Branch:
`governance/full-potential-ai-operating-system-1`

No parallel writer may touch the canonical governance files during this slice.

After this foundation is merged and verified, any further AI-OS meta-slices may be parallel only if they have disjoint ownership. The resulting architecture document must propose the next topology, but Cursor must not start those follow-ups.

## 13. Allowed files

Expected allowed ownership:

- `JETNITY_START_HERE.md`
- `AGENTS.md`
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
- `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`
- `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
- `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`
- `docs/ACTIVE_WORK_STATUS.md`
- current 18 Sep new-chat checkpoint if required for current truth
- `.cursor/rules/jetnity-expert-proactivity.mdc`
- `.cursor/rules/jetnity-progress-persistence.mdc`
- optional new `.cursor/rules/jetnity-operating-mode.mdc`
- new `.jetnity/operating-mode.json`
- new `scripts/operating-mode-guard.mjs`
- focused tests for that guard
- `package.json`
- `.github/workflows/ci.yml`
- slice-local architecture/status/handoff/self-review docs

Do not touch product runtime, DB migrations, Supabase config, product UI, provider code or PR #487 branch.

## 14. Required deliverables

Create:
- `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_ARCHITECTURE_2026-09-18.md`
- `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_STATUS_2026-09-18.md`
- `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_HANDOFF_2026-09-18.md`
- `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_SELF_REVIEW_2026-09-18.md`

Architecture doc must include:
- authority matrix;
- agent/reviewer lane matrix;
- branch/PR topology;
- routine trigger matrix;
- GitHub Evidence Bus contract;
- mechanical enforcement design;
- HOLD exit criteria;
- future Grok-app setup checklist;
- remaining OS meta-slices, if any, in exact dependency order.

## 15. Validation

At minimum:
- focused guard tests;
- `npm run check:operating-mode`;
- `npm run typecheck`;
- `npm run lint`;
- `npm test`;
- `npm run check:api-schutz`;
- `npm run check:schema-bezug`;
- `npm run check:dead`;
- `npm run check:exports`;
- `npm run check:deps`;
- `npm run build`;
- exact-head CI;
- exact-head Vercel Preview;
- merge-base current main / behind=0;
- review threads 0.

Test the guard with positive and negative fixtures:
- governance branch + allowed files => pass;
- product/runtime file during HOLD => fail;
- unauthorized branch during HOLD => fail;
- stale merge-authority phrase => fail;
- normal main push validation => pass.

No DB/Auth/Production write.

## 16. Governance

Cursor-Agent: **Jetnity full-potential AI operating system 1**  
Generation: **1**  
Required model: **Cursor Grok 4.6 High Fast** — no Auto/substitution.

One writer. No parallel writer on canonical governance.

Cursor:
- may implement this repository/Cursor governance/enforcement slice;
- must not start normal product work;
- must not create external Grok bots;
- must not grant permissions;
- must not Ready;
- must not merge;
- must not start follow-up meta-slices;
- must STOP FOR TECHNICAL-LEAD REVIEW.

Every new head invalidates older exact-head evidence.
