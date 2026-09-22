# Admin Account Counts Independent Verification 1 — SELF-REVIEW

Date: 2026-09-22  
Status: **AGENT SELF-REVIEW — NOT A TECHNICAL-LEAD PASS / NOT GUARDIAN**  
Session: `bc-4a3288b3-eb42-480b-9c37-f74b584e2419`  
Product target: `b5bbe211bc82c16da34bc8f48b58f39920af5f5a`

This document argues against the review itself. Green self-review cannot accept #550.

---

## 1. Attacks on this review

| Attack | Result |
| --- | --- |
| Accept builder 56/56 without re-running | Fail. Exact-source runner and Node tests were re-executed in this session (56/56, 10/10). |
| Static scan as SQL PASS | Fail. Real disposable PostgreSQL 16.15 executed candidate, RLS, ACL, window, and cleanup. |
| Use system `16/main` or a remote DSN | Fail. Isolation inspection first; system cluster stayed down; remote keys/args rejected. |
| Merge/cherry-pick #550 into the evidence branch | Fail. Detached worktree only. Evidence PR allowlist is named docs/receipts. |
| Treat clock-seam `counts_at` as the candidate | Partial. Seam is a matching 720h reimplementation. Live candidate window was also measured at 2592000s. DST *row inclusion* remains seam-based because the candidate has no time parameter (correct). |
| Treat all 56 checks as SQL permission assertions | Fail. Categories are distinguished. |
| Miss HOME-only `.psqlrc` | Builder control always set `PSQLRC`. This review added HOME-only execution + `-X` suppression. |
| Claim Production 17.6 was re-run | Fail. 16.15 only; limitation stated. |
| Claim `SET ROLE postgres` is a candidate hole | Fail. Harness session_user is initdb superuser. Catalog membership is false. |
| Invent a banned-caller product rule | Fail. Reported as out-of-scope observation only. |
| Query Production to refresh metadata | Fail. Dated TL metadata only. |
| Ready / merge / wake builder via `@cursor` | Fail. Not done. #550 pointer has no `@cursor`. |

---

## 2. Residual risks I would still challenge

- A later apply that treats this specialist HOLD as Production permission would be a governance failure.
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
| New independent session, required model, no Auto | Yes — `bc-4a3288b3-eb42-480b-9c37-f74b584e2419`, `cursor-grok-4.6-high-fast` |
| No reuse of builder/continuity sessions | Yes |
| Read task + all 12 target files + TL review + freeze | Yes |
| Inspect isolation before execute | Yes |
| Exact candidate + independent adversarial probes | Yes |
| R1 HOME + explicit PSQLRC, including fail-able negative control | Yes |
| R2 720h / DST / oracle / no caller filter | Yes |
| R3 register / stop-before-rm / no foreign kill | Yes |
| R4 RLS-on fixture + trusted owner + SELECT-grant still zero | Yes |
| Read-only on product and #551/global docs | Yes |
| Named evidence files only | Yes |
| Re-read target head start and finish | Yes — still `b5bbe211` |
| No Ready / merge / follow-up | Yes |

---

## 4. What was not claimed

- No Technical-Lead PASS
- No Guardian PASS
- No Production apply or live counts
- No browser UI proof
- No all-clear from self-review or green CI
