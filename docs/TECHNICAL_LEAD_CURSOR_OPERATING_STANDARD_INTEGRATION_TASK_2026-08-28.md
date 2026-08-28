# Task – Technical Lead / Cursor Operating Standard Integration

Stand: 28. August 2026  
Status: **HISTORISCHE SLICE-SPEC / PR #142 MERGED**

> Historische Authoring-Task von PR #142. Current Truth: `docs/CHATGPT_PR142_POST_MERGE_NEW_CHAT_CHECKPOINT_2026-08-28.md`. Der Body unten bleibt Pre-Merge-Evidence.

Agent: `Cursor-Agent: Jetnity quality security audit 3`

Baseline at task creation:

`main @ 3b119ae34843b40d043ed921070c60e35dd1517a`

Authority:

- explicit Product-Owner decision from 28 August 2026;
- `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md` on this branch.

## Goal

Make the new Technical-Lead/Cursor operating standard impossible to miss for future chats and agents, without changing runtime, product behavior, Branch Protection, Production, Supabase or any special gate.

## Required work

1. Re-fetch `origin/main` before editing and before handoff.
2. Read fully:
   - `JETNITY_START_HERE.md`
   - `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`
   - `docs/TECHNICAL_LEAD_MERGE_AUTONOMY_SUPERSESSION_2026-08-26.md`
   - `docs/JETNITY_TECHNICAL_LEAD_AUTONOMY_POLICY.md`
   - `docs/JETNITY_AGENT_WORKSTREAM_GOVERNANCE.md`
   - `docs/JETNITY_AGENT_SESSION_ROTATION_STANDARD.md`
3. Update `JETNITY_START_HERE.md` minimally so the new operating standard is mandatory early reading for every new ChatGPT Technical Lead and so the exclusive merge-authority rule is explicit.
4. Update the autonomy / agent-governance documents only where needed to remove ambiguity:
   - only ChatGPT / Technical Lead may Ready/Merge;
   - Cursor agents never Ready/Merge;
   - normal PRs may be autonomously merged by the Technical Lead only after independent exact-head review and when the Technical Lead is fully confident it is the best responsible decision;
   - special Product-Owner gates remain unchanged;
   - same-slice review fixes use the same Cursor session; new logical slices use a fresh numbered generation;
   - Draft-PR + versioned task + `@cursor` + independent review + head-bound CHANGES REQUIRED + new-head re-gating + PASS + Technical-Lead-only merge + post-merge verification is the standard workflow.
5. Do not rewrite historical evidence merely to make old files look current. Add supersession references where appropriate.
6. Produce a concise docs-only handoff/self-review if useful; do not create unnecessary documentation duplication.

## Hard non-scope

- no runtime code;
- no schema/migration;
- no Supabase write;
- no RLS/GRANT/REVOKE/SECURITY DEFINER change;
- no Auth/Session/MFA/AAL change;
- no provider activation/secrets/paid calls;
- no TW-8 or other product runtime slice;
- no Branch Protection change;
- no cleanup/deletion;
- no Ready;
- no merge;
- no follow-up slice.

## Acceptance criteria

- A new ChatGPT Technical Lead starting only from `JETNITY_START_HERE.md` is directed to the new operating standard before making changes.
- The repository has no current governance ambiguity that Cursor agents may Ready/Merge.
- Special PO gates remain preserved.
- Session-rotation rules remain consistent.
- No runtime/Production behavior changes.
- Agent stops on the Draft PR for independent Technical-Lead review.
