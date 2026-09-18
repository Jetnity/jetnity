# Jetnity – GitHub hard-enforcement plan

Stand: 18. September 2026  
Status: **PROPOSAL ONLY / NOT ACTIVATED / CURSOR MUST NOT APPLY SETTINGS**  
Issue: #488  
Draft PR: #489

This is the exact external hard-enforcement proposal required by Guardian F1–F3 and the Technical-Lead review of that evidence. The example path `docs/JETNITY_GITHUB_HARD_ENFORCEMENT_PLAN_2026-09-18.md` is this allowlisted OS-1 file.

This slice documents the plan. It does **not** create a GitHub Ruleset, change Branch Protection, add CODEOWNERS, or grant admin settings. Those are a later explicit Product-Owner/admin action after this proposal is reviewed.

## 1. Three layers — do not collapse them

| Layer | What it actually does | What it does not do |
| --- | --- | --- |
| **In-repo CI / HOLD guard** | Fail-closed against ordinary unauthorized product/runtime changes while the **reviewed** enforcement implementation is the one CI executes. PR file/branch checks are anchored to the base/main policy (or bootstrap HOLD). Rename/copy/delete source and destination are classified. HOLD→NORMAL cannot mix product/runtime files in the same PR. | Not tamper-proof. An authorized governance writer can change the guard, workflow, `package.json` scripts, or policy that CI then executes from the PR head. CI cannot prove ten-role setup, Evidence Bus, e2e, or Ruleset facts. |
| **External GitHub enforcement** | Protects `main` and the enforcement plane from direct pushes and bypass-style changes: require a pull request, required checks, conversation resolution, no force-push, no branch deletion, no Cursor/Guardian/Grok bypass actor. | Does not by itself prove independent review of an enforcement rewrite if the only human owner can still approve their own change. |
| **Remaining limitation** | True independent approval of enforcement-plane rewrites requires a **genuinely separate reviewer principal or team**. | A second logical Grok/Guardian/Cursor identity on the same account, browser, login, files or computer context is **not** that boundary. Shared-environment blast radius still applies. |

Do not claim tamper-proof enforcement from CI, from this document, or from naming additional Grok roles.

## 2. Protected enforcement surfaces

Minimum paths that later external GitHub enforcement must cover:

- `.github/workflows/**`
- `.jetnity/operating-mode.json`
- `scripts/operating-mode-guard.mjs`
- `scripts/operating-mode-guard.test.mjs`
- `package.json` where guard/CI scripts are defined
- `.cursor/rules/jetnity-operating-mode.mdc`
- `.cursor/rules/jetnity-merge-approval.mdc`
- `.cursor/rules/jetnity-progress-persistence.mdc`
- `.cursor/rules/jetnity-expert-proactivity.mdc`
- canonical AI-OS / Technical-Lead governance docs, at least:
  - `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
  - `docs/JETNITY_MULTI_AGENT_OPERATING_SYSTEM.md`
  - `docs/JETNITY_GROK_BOT_OPERATING_STANDARD.md`
  - `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`
  - `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_*`

An authorized OS meta-branch may still propose changes to those files. External enforcement exists so those changes cannot land on `main` by direct push, force-push, or actor bypass.

## 3. Minimum recommended non-lockout baseline for `main`

Documented here. **Not activated in this slice.**

| Control | Required in the baseline | Notes |
| --- | --- | --- |
| Require a pull request before merging | Yes | No direct commits to `main`. |
| Require the existing required CI/status checks to pass | Yes | Use the checks this repository already requires. Do not invent new paid checks. |
| Require conversation resolution | Yes | Unresolved review threads block merge. |
| Block force pushes | Yes | |
| Block branch deletion | Yes | Protect `main` from deletion. |
| Cursor / Guardian / Grok bypass actor | **Forbidden** | No bot, app, or Cursor actor may bypass the baseline. |
| Admin / Product-Owner bypass | Emergency exception only | If retained for recovery, it is **not** normal workflow. Record who may use it, for what class of incident, and that it must be followed by a written after-action note. |

Cursor must not turn these settings on. Product Owner / repository admin does that later, then records verification evidence on the HOLD-exit checklist.

## 4. Stronger optional assurance — only after a real second reviewer exists

Documented separately from the non-lockout baseline. **Do not activate now.**

- Path-specific required reviewer, CODEOWNERS, or a Ruleset required-reviewer policy for the enforcement surfaces above.
- Activate only after a **genuinely separate** GitHub user or team exists and can review those paths.
- Do **not** add a fake or nonexistent CODEOWNER.
- Do **not** create a rule that deadlocks the current single-owner repository.
- “Require latest push approval by someone else” needs that separate authorized reviewer. Activating it blindly on a single-owner repo locks the project.

Until that second principal exists, Technical-Lead review of any PR that touches enforcement surfaces is the honest residual control. It is review, not cryptographic or GitHub-enforced independence.

## 5. Authorized branch class — keep, with limits

Keep `governance/full-potential-ai-operating-system-` so later planned OS meta-slices can use numbered suffixes with disjoint ownership after this foundation is on `main`.

The class:

- authorizes HOLD-era governance/continuity/enforcement work against the **base** allowlist only;
- does **not** grant Ready, merge, force-push, Ruleset bypass, Production, or secret authority;
- remains constrained by the base/main HOLD policy, independent Technical-Lead review, and the later external `main` protection in this plan;
- is intentionally wider than the exact branch `governance/full-potential-ai-operating-system-1`. That width is for planned meta-slices, not a bypass.

## 6. HOLD-lift dependency

The agreed GitHub hard-enforcement **baseline** (section 3) must be configured and verified, or an explicit Product-Owner decision must record an accepted limitation, **before** mode may change to `NORMAL`.

The optional stronger reviewer policy (section 4) is not a HOLD-exit blocker unless the Product Owner later makes it one.

Verification belongs on `docs/JETNITY_FULL_POTENTIAL_AI_OPERATING_SYSTEM_1_HOLD_EXIT_CHECKLIST_2026-09-18.md`. CI green on a governance PR does not prove this baseline exists.

## 7. Who may activate what

| Action | Who | When |
| --- | --- | --- |
| Write or amend this proposal | Tasked Cursor writer on an authorized OS branch | This slice / later disjoint docs slice |
| Review the proposal | Technical Lead | Before treating it as the agreed baseline |
| Activate Ruleset / Branch Protection / CODEOWNERS | Product Owner or repository admin only | After review; never by Cursor, Guardian, or Grok |
| Record verification or an accepted limitation | Technical Lead on the HOLD-exit checklist; Product Owner for a limitation | Before dedicated HOLD→NORMAL closure |
