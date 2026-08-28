# Jetnity – Node 22 Runtime Consistency Status

Stand: 28. August 2026  
Status: **IMPLEMENTED / DRAFT-PR #147 / STOP FOR INDEPENDENT TECHNICAL-LEAD EXACT-HEAD REVIEW / NO READY OR MERGE BY AUTHOR**  
Workstream: Ops / Runtime contract  
Logical Cursor-Agent: **`Cursor-Agent: Jetnity runtime consistency 1`**

## 1. Live baseline / transport

| Fakt | Wert |
| --- | --- |
| Repository | `Jetnity/jetnity` |
| Task-Baseline `main` | `4ec83f36426c636443d43692d6875e92e9e3b54a` |
| Branch | `ops/node22-runtime-consistency-2026-08-28` |
| Draft-PR | [#147](https://github.com/Jetnity/jetnity/pull/147) |
| Exact Head | der Commit dieses Status-Stamps; live am PR #147 prüfen |
| Logical Cursor-Agent | `Cursor-Agent: Jetnity runtime consistency 1` |
| Preferred visible title | `Jetnity runtime consistency 1` |
| Observed Cursor run title | `Jetnity node 22 consistency` |
| Cloud-Run | https://cursor.com/agents/bc-91130f08-c80a-44a3-92dd-7796b779eab8 |
| Rename | keine unterstützte Rename-Fähigkeit; UI nicht als umbenannt behauptet |
| Generation | 1. Keine Wiederverwendung einer Account-/Provider-/Audit-Generation. |

Titel-Mismatch ist non-blocking nach `docs/JETNITY_CURSOR_VISIBLE_AGENT_NAME_GATE.md`.

## 2. What this slice implements

One reproducible Node.js runtime contract: **Node 22.x**.

Inspected before edit:

- GitHub CI `.github/workflows/ci.yml`: both `setup-node` jobs already `22.x`. Unchanged.
- Vercel project settings already `22.x`. Not mutated.
- `package.json` `engines.node` was `>=20.9`.
- `package-lock.json` mirrored the same broad root engine range.
- `@types/node` was `24.0.7` (Node-24 type line).

Implemented:

- `engines.node` pinned to `22.x`.
- Lockfile root metadata regenerated with npm (`npm install --package-lock-only --ignore-scripts`).
- `@types/node` aligned to the maintained Node 22 line: exact `22.20.1`.
- npm pulled the required subtree `undici-types@6.21.0` (was `7.8.0` under the Node-24 types). No other dependency records were hand-edited.

No application feature, no Next.js/React/Supabase upgrade, no Auth/RLS/schema/config change, no Vercel setting mutation, no Branch Protection change, no AP-7-S2, no provider/TW runtime.

## 3. Files changed

Runtime / tooling:

- `package.json`
- `package-lock.json`

Continuity / contract docs:

- `docs/NODE22_RUNTIME_CONSISTENCY_TASK_2026-08-28.md`
- `docs/NODE22_RUNTIME_CONSISTENCY_STATUS_2026-08-28.md`
- `docs/NODE22_RUNTIME_CONSISTENCY_HANDOFF_2026-08-28.md`
- `docs/NODE22_RUNTIME_CONSISTENCY_SELF_REVIEW_2026-08-28.md`
- `docs/ACTIVE_WORK_STATUS.md`
- `DECISIONS.md` (ADR-0004 superseded; ADR-0188)
- `ARCHITECTURE.md` (Node stack line)
- `README.md` (local Node prerequisite)
- `ROADMAP.md` (current ops slice)
- `JETNITY_START_HERE.md` (current-state pointer)
- `JETNITY_HANDOFF.md` (current-state pointer)

CI workflow inspected, not changed.

## 4. Validation

Required commands and results are stamped in the self-review after they have actually been run. Do not treat this section as green until that stamp exists.

Required:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

Exact-Head GitHub CI and Vercel Preview remain live evidence for the independent Technical Lead. Local gates do not replace them.

## 5. Non-scope held

- no Next.js/React/Supabase upgrade
- no application feature work
- no Supabase migration/config/schema/RLS/Auth change
- no Vercel project-setting mutation
- no Branch Protection change
- no AP-7-S2
- no provider/TW/runtime feature slice
- no Ready and no merge by the author/agent

## 6. Residual risks

- Vercel Preview/Production must still prove that `engines.node: "22.x"` removes the `Node.js Version Override` warning. That is live hosting evidence, not a local claim.
- `22.x` is a line pin, not a patch pin. CI/Vercel may still move within Node 22.
- Local developers on Node 20 will now fail `engines` checks if their package manager enforces them.
- `main` Branch Protection remains `protected=false`.
- This author self-review is not a Technical-Lead PASS. Any new push invalidates prior review evidence.

## 7. Exact next step

Independent ChatGPT / Technical-Lead exact-head review of Draft-PR #147. No Ready. No merge by the author. No product follow-up from this slice.
