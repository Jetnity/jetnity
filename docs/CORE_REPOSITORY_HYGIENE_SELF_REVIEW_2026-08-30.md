# Core Repository Hygiene Self-Review – 2026-08-30

Author-agent: `Jetnity core repository hygiene audit 1`  
Type: adversarial self-review. **This is not an independent Technical-Lead PASS.**

## 1. Scope vs diff

Assigned: Issue #273 / task `docs/CORE_REPOSITORY_HYGIENE_AUDIT_TASK_2026-08-30.md`. Audit-only. Classify the current repository. Revalidate historical sanitation findings. Stop.

Intended write-set:

1. `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`
2. `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`
3. `docs/evidence/CORE_REPOSITORY_HYGIENE_INVENTORY_2026-08-30.json`
4. `docs/CORE_REPOSITORY_HYGIENE_STATUS_2026-08-30.md`
5. this file
6. `docs/CORE_REPOSITORY_HYGIENE_HANDOFF_2026-08-30.md`

Hard non-scope observed:

- no delete/move/rename/edit of runtime, config, migrations, assets, `.cursor`, `.github`;
- no Production / Supabase / Vercel / provider write;
- no Auth / Traveller / Provider / Commercial Truth change;
- no branch / PR / issue / tag close or delete;
- no global TL continuity edit (`JETNITY_HANDOFF.md`, `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md`, ROADMAP / ARCHITECTURE / DECISIONS);
- no Ready; no merge; no follow-up slice.

An accidental dirty `next-env.d.ts` from the environment was restored and not committed.

Review-fix after TL CHANGES REQUIRED on `e1bbf7fd`: corrected the stale local `origin/main` pointer (it was older than live `main`, not newer); stopped presenting superseded stamp SHAs as the current PR head; recorded `jetnity-bets` decommission and active `main` protection as resolved; left recovery-bucket B-03 and all D/U/B file leftovers unchanged.

## 2. Adversarial questions

| Question | Answer |
| --- | --- |
| Did the agent classify `DELETE-CANDIDATE` from age alone? | No. Only 23 files are older than 2026-04-30. Framework/auth/admin/inspiration assets stayed `KEEP`. The three delete candidates have ignore-vs-track, missing importers, or CLI-cache evidence. |
| Could a later agent delete a migration because it mentions `creator_sessions`? | The audit forbids that. All 58 migrations are `HISTORICAL-EVIDENCE`. |
| Could `next-env.d.ts` / `postcss.config.js` / `proxy.ts` be deleted as “old”? | Explicitly protected as framework-required `KEEP`. |
| Did green `check:dead` get treated as “repo is clean”? | No. Tooling limits are documented. CookieConsent is a justified orphan. Assets/CLI temp/hosts/branches/cloud are invisible to that checker. |
| Did the agent copy 28 Aug verdicts without reproducing them? | No. Each historical row was re-checked. Later TL live facts (this review-fix): `jetnity-bets` gone; `main` protection ACTIVE. Other deltas from the original audit: PR #88 CLOSED; 165 merged branches already deleted; remote heads 136 → 65; C3 removed Production `creator-media` source. |
| Did the agent claim Creator/MediaStudio residue is gone without searching? | Search covered app/components/lib/types/config/workflows. Verdict is “no runtime residue”, not “no historical mention”. |
| Did the agent propose deleting CookieConsent as if legal were decided? | No. `BLOCKED/NEEDS-DECISION`. Mounting V1 text is called out as forbidden. |
| Did the agent treat `/privacy` as only an orphan-banner problem? | No. `RegisterForm` is mounted and already links `/privacy`. Build has no page. |
| Did the agent leak secrets into deliverables? | No pooler URL, tokens, user paths, or recovery object paths were copied. Placeholder presence was recorded as booleans. |
| Did the agent start cleanup “because it is obviously safe”? | No. STOP after deliverables. |
| Did the agent edit global TL continuity because persistence policy asked for it? | No. The task forbids those files. Persistence for this slice lives in the six deliverables. |
| Did the agent confuse branch hygiene with repo-file hygiene? | No. Branch/PR axis is B-04 / out of slice. File leftovers are D/U/B rows. |
| Will leftover deletes fail CI if the lock test is forgotten? | Yes. That coupling is documented as a feature, not an obstacle to hide. |
| Is `zod` still unused? | No. The checker exception is stale (`UPDATE-CANDIDATE`), the package is `KEEP`. |
| Was Production Storage re-listed live? | No. Marked unresolved. C3 after-image is historical Production evidence, not re-run. |
| Was unique content on old branches re-absorbed onto this branch? | No. |

## 3. False-positive deletion risks (what a rushed cleanup could break)

| Target | Why a naive delete is wrong |
| --- | --- |
| Any `supabase/migrations/*` | Replay / C3 fail-closed contract / baseline still creates later-dropped tables |
| `public/images/{bali,lisbon,zermatt,amsterdam,hero-bali}*` | Live inspiration and OG |
| `lib/auth/mfa.ts` | Old date, live importers |
| `app/auth/callback/page.tsx` and admin error/loading/not-found | Old date, current routes |
| `postcss.config.js`, `next-env.d.ts`, `proxy.ts` | Framework |
| `components.json` whole file | Only the hooks alias is stale |
| `check-jetnity-setup.ts` | Banner is stale; the gate is required |
| `lib/auth/roles.ts` `creator` | Current RBAC |
| `app/(public)/ui-audit/**` | Production-gated harness, not dead product UI |
| Dated `docs/*` packets | Continuity/review evidence |
| CookieConsent without a legal decision | Product/legal, not a mechanical orphan delete |
| Historical remote branches with unique files | ADR-0184 retention |

## 4. False-negative risks (what this audit might have under-called)

| Risk | Mitigation / residual |
| --- | --- |
| An unused file that is only reached via string `require` / dynamic path | `check:dead` uses static import patterns. Residual: low for app/components/lib; not claimed for scripts’ dynamic SQL. |
| CSS-only or markdown-only asset references | Image `rg` covered common extensions; `prague.jpg` had no hit. Residual: unusual URL encoding not searched. |
| Production HTML still loading `jetnity.ai` / DALL-E URLs | Repo has no such URLs. Confidence on U-01 is **medium**. |
| Dead exports hidden behind re-exports `check:exports` misses | Checker is name-based (ADR-0026 caution). Residual documented. |
| Docs packets that are truly duplicate and deletable | Not classified `DELETE-CANDIDATE`. Residual: docs remain large. |
| Unique-file status of historical branches drifted | Refs exist; contents not re-diffed. Residual: B-04 confidence is on presence, not on 28 Aug unique-file counts. |
| New leftovers added on `origin/main` after `d4a2bba2` | Live GitHub `main` is still exactly `d4a2bba2`. Local pointer `ea797163` was a stale/older ref, not a newer main. Residual: TL should still fetch live `main` before merge. |

## 5. Traveller / security / cost

- Traveller credentials: not collected, not evaluated, not required for leftover classification.
- Security: no live secret reproduced. Tracked CLI temp remains a *future* secret-absorption risk (D-01).
- Cost: no new dependency, provider, or infrastructure.

## 6. Verdict of the author-agent

The audit meets the task acceptance criteria as an evidence packet for independent review. It is **not** a merge recommendation beyond “ready for Technical-Lead review”. It is **not** authorization to clean, Ready, or merge.
