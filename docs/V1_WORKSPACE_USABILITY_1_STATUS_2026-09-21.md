# V1 Workspace Usability 1 — Status

Stand: 21. September 2026  
Status: **INTEGRATED + REVIEW-FIX FROZEN FOR INDEPENDENT TL REVIEW / DRAFT / NOT READY / NOT MERGED / AUTHOR SELF-REVIEW ONLY**

## Arbeitsblock / Ziel

Same-session integration/closure: merge authorized `origin/main@66af1539` once, bind R2 evidence to the clean integrated product tree, freeze. No Ready / no PR merge.

## Branch / PR / heads

| Item | Value |
| --- | --- |
| Branch | `fix/v1-workspace-usability-1` |
| Issue | #513 |
| Draft PR | #516 |
| Assigned baseline | `main@19a91a2594127eb2b6104b68da69786194e13865` |
| Integrated main (once) | `66af15397c1bb4e73d8e4012080bb04b7389147d` (#517) |
| Merge commit | `b67adcb6a64359b56c3a89b7a6c6c350ef7d804c` |
| Product tree used for R2 | **`dda36b176d9ca66a7fb2e66a28193a37e8b3e719` (clean)** |
| Prior freeze (invalidated) | `4b5f34f9` then `cdaff642` |
| Agent | **Jetnity V1 workspace usability 1**, Generation 1 |
| Model | Cursor Grok 4.6 High Fast (`cursor-grok-4.6-high-fast`) — no Auto |
| Session | `bc-8a1bf241-3bb4-41f9-8fa1-7f6c5c965bca` |

Exact freeze SHA of the evidence/docs commit belongs in the freeze PR comment only. R2 artifacts record product `dda36b17` / `workingTree: clean`. That is the tested product tree; the later evidence commit is documentation only.

## Live-main integration

TL authorized one merge of `origin/main@66af1539`. Merge completed with **no shared-path conflicts**. Incoming files were #517-owned guest storage/adoption/GastreiseBruecke only. This writer did not edit those files. No sibling branch merge. PR remains unmerged/draft.

## Review findings

| ID | Disposition |
| --- | --- |
| VUX-R1 | Source fix on `cdaff642` stands. UTC calendar round-trip; impossible days empty. |
| VUX-R2 | Source fix on `cdaff642` stands. Recaptured on clean `dda36b17`: open 433 → manual 1038 → booking update 1038 → explicit search 1038 (jump 0). |
| Rapid close | **Return evidence only.** Escape after detail mount + back-control focus. Not a measurement that rAF/timeout were still pending. Overview heading wait-visible; `scrollY` 565. |

## Local gates (author-run, not TL PASS)

| Check | Result |
| --- | --- |
| `npm test` on `cdaff642` | PASS 3539/3539 |
| focused date/workspace tests | independently rerun by TL + author PASS |
| R2 harness on clean `dda36b17` | no open-snap reset; explicit search mounted; rapid-close labelled as return |

## Sicherheit / Kosten

- No secrets, paid provider/model, DB/Auth activation
- #514/#515 files not written by this writer; #517 arrived only via the authorized main merge

## Next step

**ChatGPT / Technical Lead** independent exact-head review of the freeze SHA. Cursor does not Ready, merge the PR, or start a follow-up.
