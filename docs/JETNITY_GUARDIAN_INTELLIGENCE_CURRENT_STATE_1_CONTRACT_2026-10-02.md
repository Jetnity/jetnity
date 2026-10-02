# Guardian Intelligence Current State 1 — Contract

Date: 2 October 2026
Issue: #752
Persistent Current-State issue: [#751](https://github.com/Jetnity/jetnity/issues/751)
Raw MATERIAL inbox: [#748](https://github.com/Jetnity/jetnity/issues/748)
Delivery baseline: `main@ee1d2d32ab50c978f75e6a45f99de5ac551a2b9d` (`Merge #750: add Guardian Intelligence Bridge contract`)
Branch: `docs/guardian-intelligence-current-state-1`
Logical agent: **Jetnity Guardian Intelligence Current State 1**
Generation: **1**
Binding task: `docs/JETNITY_GUARDIAN_INTELLIGENCE_CURRENT_STATE_1_TASK_2026-10-02.md`

This contract is the startup, privacy and lifecycle rule for Guardian intelligence on the public repository. Report envelope, dedupe and Technical-Lead receipt classes remain in `docs/JETNITY_GUARDIAN_INTELLIGENCE_BRIDGE_1_CONTRACT_2026-10-02.md`. This contract does not configure an external bot and does not post to GitHub.

## 1. Two stable issues

#748 remains the permanent raw MATERIAL intake issue.

#751 is the compact live Current-State index.

Raw #748 comments are append-only audit history. Do not delete them. Do not rewrite them. Handling one report does not close #748.

#751 is updated in place. It is not a second copy of the raw inbox. Its body holds only:

- current open or relevant `report_id` values;
- the latest Technical-Lead receipt state for those ids;
- current `main` SHA and live machine mode;
- items waiting for the Technical Lead or the Product Owner;
- the last processed report id and the last processed #748 comment id.

Resolved, `STALE` and `SUPERSEDED` reports are omitted from that compact body. They remain on #748 for audit.

This slice does not introduce monthly or quarterly issue rotation. Stable #748 intake avoids another external reconfiguration. A later physical rotation is optional only when GitHub operational limits justify it, and only under a later versioned task.

## 2. Default startup read

A new Technical-Lead chat reads, in order:

1. live `origin/main` and live `.jetnity/operating-mode.json`;
2. the #751 body;
3. only the #748 reports selected below.

Selected #748 reports are:

1. open or material `report_id` values referenced by the current #751 body;
2. newer unread MATERIAL reports on #748 after the last processed comment marker on #751.

Unread means a comment whose marker line is `jetnity_guardian_inbox: report` and whose `report_id` has no later `jetnity_guardian_inbox: tl_receipt` on #748.

A report is outside the default startup read when the latest receipt classifies it `STALE` or `SUPERSEDED`, or when #751 no longer lists it because the Technical Lead has treated it as resolved. Those comments stay on #748. A reader opens them for audit, not as the default startup set.

An unread report is evidence waiting for triage. It is not a confirmed defect and not a task assignment. Cursor consumes a finding only when the current versioned task explicitly binds that `report_id` and the latest Technical-Lead receipt for that id is `CONFIRMED` or `PARTIAL`. `PARTIAL` authorizes only the confirmed part named in that task.

At the first delivery read of #751 (`updated_at` `2026-10-02T18:22:26Z`), the last processed report marker was `COS-20261002-2010-001` and the last processed comment marker was `5958628250`. The Technical Lead later updated that body. The read at `updated_at` `2026-10-02T18:57:38Z` names the same report and comment `5959311398` as the last processed marker. That later body is the live index. Re-read #751 before treating either marker as current.

## 2a. Event-driven read cadence

The canonical handoff is an event-driven re-read. It is not an hourly poll and it is not a full #748 rescan.

During an active Jetnity Technical-Lead workflow, re-read #751 and the selected #748 reports at each of these boundaries:

1. a new chat, a resumed chat, or a chat after a material pause;
2. immediately after a Cursor agent declares a material slice finished, or stops for Technical-Lead review;
3. immediately after any new material pull-request head that invalidates older Guardian evidence;
4. before Technical-Lead FINAL PASS on a Truth, Security, Auth, database, or release-relevant slice;
5. immediately after merge and post-merge verification, before selecting or dispatching the next slice;
6. before crossing any reserved Product-Owner gate when Guardian or Chief of Staff evidence may be relevant.

Each re-read uses §2. Read #751 first. Then read only newer unread MATERIAL #748 reports after the last processed marker, plus the reports #751 explicitly references as still open. Do not rescan the full #748 history at these boundaries.

The hourly ChatGPT watch remains a backstop. It is not the canonical handoff mechanism. A missed hour does not replace a missed boundary above.

Guardian and Chief of Staff do not emit a #748 report for every git commit. Their trigger is a material event, a material new head, or a material risk. A commit with no material change may produce no #748 report. Absence of a new report after a non-material commit is not a missed handoff. Boundary 3 still requires the §2 re-read. No new #748 comment on that head means no new material report was posted. It does not move older evidence onto the new head.

## 3. Public-repository privacy

Jetnity/jetnity is public.

GitHub intelligence reports and the Current State contain no personal data by default. The forbidden set includes:

- names;
- email addresses;
- phone numbers;
- postal or street addresses;
- user, account or traveller identifiers;
- passport or document numbers;
- MRZ;
- biometrics;
- health information;
- birth dates;
- IP addresses;
- any other directly or indirectly person-identifying value.

Allowed content is a sanitized summary, a repository path, a pull-request or issue id, a commit SHA, or a non-personal hash.

Secrets, tokens, PATs, webhook credentials and environment values stay out of #748 and #751.

When a finding cannot be represented without personal data:

- do not put that payload in #748 or #751;
- name only the data class and a sanitized location or hash where that is safe;
- mark that restricted evidence requires an approved private evidence path.

The Bridge contract's earlier exclusion of passport, MRZ, biometric and health payloads remains in force and is included in this broader set. This contract is the privacy rule for both issues.

## 4. Live mode

Live `.jetnity/operating-mode.json` is authoritative.

On the delivery baseline, `mode` is `NORMAL`.

`AI_OS_BUILD_HOLD` may remain only as historical evidence. A Guardian or Chief-of-Staff routine states HOLD as current only after a fresh live mode read proves that mode. A stored HOLD sentence in an older startup block is not that proof.

## 5. Bridge proof state

Independently read on 2 October 2026 from #748, comment list of two:

| Comment | Marker | Meaning |
| --- | --- | --- |
| `5958412971` | `jetnity_guardian_inbox: report` | `report_id` `COS-20261002-2010-001`, `source_agent` Jetnity Chief of Staff |
| `5958628250` | `jetnity_guardian_inbox: tl_receipt` | same `report_id`, classification `PARTIAL` |

Chief of Staff -> #748 direct MATERIAL posting is proven for `COS-20261002-2010-001` because comment `5958412971` was read from GitHub. That proof is for this report. It is not a certificate that every later run will post.

Jetnity Guardian -> #748 direct MATERIAL posting is not yet proven. This read found no #748 report whose `source_agent` is Jetnity Guardian. Archive file names cited inside the Chief of Staff comment are external workspace names. They are not #748 report comments and do not prove Guardian direct posting. Do not upgrade that state without a later independently read Guardian report on #748.

The Bridge 1 session recorded an empty #748 comment list. That sentence remains the observation of that session. This section is the later read.

## 6. What #751 already says, and what this slice does not change

The first delivery read of the #751 body, `updated_at` `2026-10-02T18:22:26Z`, named main `ee1d2d32ab50c978f75e6a45f99de5ac551a2b9d` and findings F1, F2, F3, F5, F7, F8 and F9 together as the open #741 blocker set. That read is historical.

The Technical Lead later updated the #751 body in place. The read at `updated_at` `2026-10-02T18:57:38Z` remains the live index and names:

- current main `ca40e5b2e133c938070a8d13aafcdcb66fa608fd` (`Merge #755`);
- machine mode `NORMAL`;
- the Chief of Staff proof and the Guardian not-yet-proven state above;
- last processed comment marker `5959311398`, a later `PARTIAL` receipt for `COS-20261002-2010-001`;
- #749 F1 resolved for the binding server-held live/autonomous entry by merged #755, accepted head `057f91ef28be93e27bf283e6e490aa3d7fb5cc94`;
- remaining #741 P1 blockers F2, F3, F5, F7, F8 and F9;
- no Production database apply and no provider, secret, paid or public-launch gate opened by the index.

This slice does not edit that #751 body. It does not implement #741 and does not remediate the remaining findings. It does not modify the #755 runtime files or the #755 lane docs.

The #748 issue body is not edited by Cursor in this slice. The Technical Lead may align it after merge. The #748 issue body still describes a narrower sensitive-payload exclusion. That older issue-body sentence is not permission to post other personal data.

## 7. Boundaries

In force:

- docs and governance only;
- machine mode stays `NORMAL` in `.jetnity/operating-mode.json`, and this slice does not edit that file;
- Draft #754 stays Draft until independent review of this slice. That sentence is the stop rule. After merge, do not infer from this contract that #754 is still open or is the current writer. #751 is the live current-writer index;
- Cursor does not Ready, merge, or start a follow-up slice;
- no product runtime, Auth, database, Supabase, provider, model, Production, ruleset, secret, token, PAT, webhook, or paid-service change;
- no deletion of #748 history;
- no external bot mutation from Cursor.

Exact next step: independent Technical-Lead review of the exact branch tip.
