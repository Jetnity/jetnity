# Jetnity – V1 Incident Process 1 HANDOFF

Stand: 18. September 2026  
Status: **TL P3 GATED ON `b4f475ca` / RE-GATE THIS PERSIST HEAD / STOP FOR TECHNICAL-LEAD REVIEW / KEIN READY / KEIN MERGE / KEIN FOLGESLICE**

Binding task: `docs/V1_INCIDENT_PROCESS_1_TASK_2026-09-18.md`  
Canonical runbook: `docs/V1_INCIDENT_PROCESS_RUNBOOK_2026-09-18.md`  
Detailed status: `docs/V1_INCIDENT_PROCESS_1_STATUS_2026-09-18.md`  
Self-review: `docs/V1_INCIDENT_PROCESS_1_SELF_REVIEW_2026-09-18.md`

This document is enough for a new agent or Technical Lead to continue without the chat.

---

## 1. Where the work lives

| | |
| --- | --- |
| Issue | #463 |
| Draft PR | #464 |
| Branch | `docs/v1-incident-process-1` |
| Canonical base | `main@926a8cde1b469b2465b311aafcf84bc18e4770f2` |
| Dispatch head | `953670e5166dd0da93e40a4a8202fbb60d1f4862` |
| Implementation head | `c59d18bcebcfb635d9df4ed4dba58325741b5283` |
| Previous evidence / Guardian-locked head | `c52ccbcb7bb5319fb2535f049b560627b1db6553` |
| P3-fix head | `b4f475cad726db66e0e4a336e3bb749fb55e3c8f` |
| TL P3 | comment `5727375904` / continue `5727378163` |
| Agent | Jetnity V1 incident process 1, Generation 1 |
| Parent model | Cursor Grok 4.6 High Fast (confirmed `originalModelName=cursor-grok-4.6-high-fast`) |
| Session | `bc-6f118f5c-3e96-4426-a6f7-1b89c7d1a6a1` |

Read first:

1. the task and finding 5.5 process vs tooling split
2. the canonical runbook §2.1 Admin Provider & Kosten row (runtime vs sammeln) and §8.4
3. this handoff and STATUS / SELF_REVIEW
4. live PR #464, live `origin/main`, live CI and Vercel on the **current HEAD**

## 2. What changed

Docs-only incident operations runbook, plus TL P3 path correction:

- `lib/admin/provider-ops-board/runtime.ts` owns `USAGE_LIMIT = 200` and `.limit(USAGE_LIMIT)` for the last-30-day `model_usage` read;
- `lib/admin/provider-ops-board/sammeln.ts` evaluates/assembles board state and consumes `liesModelUsage()`.

No runtime, provider, secret, Auth, database or cost change. Incident semantics unchanged.

## 3. What a reviewer should verify first

1. §2.1 no longer attributes the 200-row cap to `sammeln.ts`.
2. All earlier boundaries still hold (no invented monitoring, existing kill switches only, PO gates preserved, tooling half of 5.5 open).
3. `c52ccbcb` CI `35296571456` SUCCESS, Vercel `3kQyXW3WR5zVuDwLWbmzxgJp4D4G` READY, and Guardian PASS are recorded only for that SHA.
4. `b4f475ca` CI `35324826220` SUCCESS and Vercel `8fACsLeNXuHJbFFmNyAhhm5Qv3mG` READY are recorded only for that SHA.
5. Re-fetch exact-head CI / Preview / threads on the **live HEAD** after this persist.

## 4. What this slice does not mean

No incident was simulated. No vendor was chosen. Public V1 Launch remains blocked on automated error-tracking/alerting/log aggregation until a later Product-Owner-gated slice.

## 5. Next step

Re-gate the live HEAD, then **STOP FOR TECHNICAL-LEAD REVIEW**. Do not Ready. Do not merge. Do not start a follow-up slice.
