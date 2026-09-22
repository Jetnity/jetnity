# Admin Account Counts Independent Verification 1 — SELF-REVIEW

Date: 2026-09-22  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS / NOT GUARDIAN**  
Session: `bc-4a3288b3-eb42-480b-9c37-f74b584e2419`  
Historical product target: `b5bbe211bc82c16da34bc8f48b58f39920af5f5a`  
Authorized identical-tree main: `34686af3a12317d5eb40ab12056a1188298e04c6`

This document argues against the review itself. Green self-review cannot accept #550 or #552.

---

## 1. Attacks on this review

| Attack | Result |
| --- | --- |
| Accept builder 56/56 without re-running | Fail. Exact-source runner and Node tests were re-executed in the first persist (56/56, 10/10). |
| Static scan as SQL PASS | Fail. Real disposable PostgreSQL 16.15 executed candidate, RLS, ACL, window, and cleanup. |
| Use system `16/main` or a remote DSN | Fail. Isolation inspection first; system cluster stayed down; remote keys/args rejected. |
| Import unmerged #550 into the evidence branch | Fail for the first persist: detached worktree only. Later E3 merged **accepted** main `34686af3` after TL PASS **5282850421**, not an unmerged sibling. No rebase/force/cherry-pick. Incoming product files remain byte-unmodified. |
| Treat clock-seam `counts_at` as the candidate | Partial. Seam is a matching 720h reimplementation. Live candidate window was also measured at 2592000s. DST *row inclusion* remains seam-based because the candidate has no time parameter (correct). |
| Treat all 56 checks as SQL permission assertions | Fail. Categories are distinguished. The historical 25 mixed-probe total stays a third class. |
| Miss HOME-only `.psqlrc` | Builder control always set `PSQLRC`. First persist added HOME-only execution + `-X` suppression. E2 persisted a reconstructed executable pair. |
| Relabel start displacement as elapsed duration | Fail at cbba1264 (E1). Reconstructed oracle: spring elapsed 719h, fall 721h. Historical IDs kept as HISTORICAL MISLABEL. |
| Invent an archived original `/tmp` probe script | Fail. E2 is reconstructed after **5282860545**. The first persist helper was session-local and is not archived here. |
| Collapse 25 mixed probes into the E2 9/9 total | Fail. Separate classes, documented. |
| Claim Production 17.6 was re-run | Fail. 16.15 only; limitation stated. |
| Claim `SET ROLE postgres` is a candidate hole | Fail. Harness session_user is initdb superuser. Catalog membership is false. |
| Invent a banned-caller product rule | Fail. Reported as out-of-scope observation only. |
| Query Production to refresh metadata | Fail. Dated TL metadata only. |
| Treat this persist as operating-mode HOLD or a new product TL PASS | Fail. Wording is “corrections verified in the specified local scope”. |
| Ready / merge / wake builder via `@cursor` | Fail. Not done. |

---

## 2. Residual risks I would still challenge

- A later apply that treats this specialist local-scope verification as Production permission would be a governance failure.
- Trusted `postgres` is still broader than the function. That is honest, not least privilege.
- Fixture `auth.users` is the TL-verified subset, not the full live catalog.
- Child env can inherit non-PG secrets (`SUPABASE_ACCESS_TOKEN`) if the parent leaves them set.
- JSON `timestamptz` display follows session TimeZone; instants were compared, not offset strings.
- Authorized present count cannot be 0. UI must not render that as empty product.
- Finding 5.2 / release-gate G / provider gates are untouched.

---

## 3. Dispatch compliance

| Requirement | Met? |
| --- | --- |
| Same independent session, required model, no Auto | Yes — `bc-4a3288b3-eb42-480b-9c37-f74b584e2419`, `cursor-grok-4.6-high-fast` |
| No reuse of builder/continuity sessions | Yes |
| Task file left unchanged | Yes |
| E1 duration labels vs stored instants | Yes — spring 719h shorter, fall 721h longer |
| E2 small executable HOME/DST reproduction | Yes — `repro-home-psqlrc-and-dst.mjs`, 9/9, receipt `e1-e2-repro-run.txt` |
| E3 authorized merge of `34686af3` | Yes — merge `3af1c42f`, no rebase/force/cherry-pick/#551 |
| Incoming product files byte-unmodified | Yes — candidate/bootstrap/runner hashes unchanged |
| Historical target remains `b5bbe211` | Yes — identical tree recorded separately |
| Isolation before execute | Yes |
| Exact candidate + independent adversarial probes | Yes (first persist) |
| Read-only on #551/global docs | Yes |
| Named evidence files only | Yes |
| No Ready / merge of this PR / follow-up | Yes |

---

## 4. What was not claimed

- No Technical-Lead PASS
- No Guardian PASS
- No operating-mode HOLD
- No Production apply or live counts
- No browser UI proof
- No all-clear from self-review or green CI
