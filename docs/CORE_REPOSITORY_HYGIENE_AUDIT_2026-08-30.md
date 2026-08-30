# Core Repository Hygiene Audit – 2026-08-30

Date: 2026-08-30  
Issue: [#273](https://github.com/Jetnity/jetnity/issues/273)  
Draft-PR: [#277](https://github.com/Jetnity/jetnity/pull/277)  
Cursor-Agent: `Jetnity core repository hygiene audit 1`  
Type: **AUDIT-ONLY / NON-DESTRUCTIVE**  
Audit head: `c895d16b5c1f42cdb0bed5b44aaaf188d07c5024`  
Task baseline: `main@d4a2bba21e9a247594272adb2a13d6cf0620ff48`  
Local `origin/main` pointer at audit time: `ea79716315304c1289b094811d80f8880c09e615` (docs-only GitHub branch-hygiene record; newer than the task baseline)

> Age is a signal, never deletion proof. This slice classifies. It does not delete, move, rename, mount, or clean anything.

Companion files:

- `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`
- `docs/evidence/CORE_REPOSITORY_HYGIENE_INVENTORY_2026-08-30.json`
- `docs/CORE_REPOSITORY_HYGIENE_STATUS_2026-08-30.md`
- `docs/CORE_REPOSITORY_HYGIENE_SELF_REVIEW_2026-08-30.md`
- `docs/CORE_REPOSITORY_HYGIENE_HANDOFF_2026-08-30.md`

## Executive summary

The current tracked repository is a single Jetnity V2 codebase. The live product surface is Trip Builder / Trip Workspace, Account/Traveller, Admin, and provider search APIs. Hygiene checks on this exact head are green: `check:dead` / `check:exports` / `check:deps` / `check:api-schutz` / `check:schema-bezug` / `typecheck` / `lint` (0 errors, 135 documented warnings) / `test` (2815/2815) / `build`.

**Creator Hub / MediaStudio / Feed / Blog / Render are not present as current runtime.** Their remaining repository traces are historical migrations, decommission evidence, and a still-current RBAC role name (`creator`) plus the capability `inhalte-moderieren`. Those are not leftover MediaStudio pages.

The still-actionable **repository** leftovers from the 26/28 August sanitation inventories remain, and they now have current evidence:

1. Tracked Supabase CLI temp/branch metadata despite `.gitignore`.
2. Unreferenced `public/images/prague.jpg`.
3. Unmounted `CookieConsent` with stale V1 “Views/Likes” copy, plus live `/privacy` and `/terms` 404s from the register flow.
4. Unused V1 image hosts in `next.config.js`.
5. `components.json` alias `@/hooks` with no `hooks/` directory.
6. Documentation volume and canonical-pointer lag (607 `docs/` files; no docs index).

Green CI hygiene does **not** prove asset, branch, cloud, or documentation cleanliness. `check:dead` only walks the TS/JS import graph from Next entrypoints and explicitly keeps `CookieConsent` as a justified orphan.

A later delete of the CLI temp files or `prague.jpg` must update `lib/project-sanitation/closure-invariants.test.ts` in the same slice. That test currently **locks the leftovers in place**.

This slice did not edit runtime, config, migrations, assets, global TL continuity, branches, or PRs. **STOP for independent Technical-Lead review.**

## Top findings (risk / value)

| Rank | Finding | Class | Why it matters | Later slice |
| ---: | --- | --- | --- | --- |
| 1 | Tracked `supabase/.temp/*` (5 files) and `supabase/.branches/_current_branch` despite ignore rules | `DELETE-CANDIDATE` | Ignore does not apply to already-tracked files. The group can later absorb real CLI secrets. Current `pooler-url` is a placeholder, not a live secret. | Untrack (`git rm --cached`) + update lock test. No history rewrite. |
| 2 | Live `/register` links to `/privacy`; `/privacy` and `/terms` have no App Router pages | `BLOCKED/NEEDS-DECISION` | User-visible 404 from a mounted flow. Legal text must not be invented. CookieConsent is a second, unmounted, stale-copy problem. | Legal/PO slice (AP-6a follow-on). Do not silently mount CookieConsent. |
| 3 | Unmounted `CookieConsent.tsx` with V1 “Views/Likes” copy | `BLOCKED/NEEDS-DECISION` | Only justified `check:dead` orphan. Linking `/privacy` would publish false measurement claims if mounted. | Same legal slice: honest text, delete, or keep orphan. |
| 4 | `public/images/prague.jpg` (1.8 MB) has no runtime/docs image reference | `DELETE-CANDIDATE` | Dead asset. Age (2025-09-02) is only a signal; the deletion proof is missing importers plus unused public path. | Asset-hygiene micro-PR + lock-test update. |
| 5 | V1 `images.remotePatterns` hosts `jetnity.ai` and Azure DALL-E blob | `UPDATE-CANDIDATE` | No current runtime URL uses either host. Allowlist is leftover attack/config surface. | Runtime-config micro-PR + lock-test update. |
| 6 | `components.json` alias `hooks` → `@/hooks` but `hooks/` does not exist | `UPDATE-CANDIDATE` | Harmless to Next runtime today; misleading for shadcn/codegen. | Config-hygiene micro-PR. |
| 7 | `scripts/pakete.mjs` still lists `zod` as an unused-but-kept exception | `UPDATE-CANDIDATE` | `zod` is imported across trip/provider schemas. The exception is stale documentation inside the checker. | Checker-comment cleanup. |
| 8 | `docs/` = 607 files, almost all flat; canonical pointers lag this audit | `UPDATE-CANDIDATE` | Continuity risk, not a delete case. This slice must not edit global TL files. | Optional docs-index / pointer refresh by Technical Lead. |
| 9 | `lib/project-sanitation/closure-invariants.test.ts` asserts leftovers still exist | `KEEP` | False-positive protection: a naive delete PR will fail CI until the lock is updated on purpose. | Couple any leftover-delete with this test. |
| 10 | Hygiene tools do not see assets, CLI temp, image hosts, branches, or cloud | `KEEP` (tooling limit) | Green `check:dead`/`check:deps` is not a sanitation proof. | Documented limit; do not treat CI green as cleanup done. |

No P0 live secret was found in the tracked tree. `pooler-url` contains the literal placeholder `[YOUR-PASSWORD]`, no JWT prefix, and no `service_role` / `sk_live` token.

## Area-by-area conclusions

### `app/` — `KEEP`

32 pages, 22 route handlers, plus layouts, `sitemap.ts`, `robots.ts`, `manifest.ts`, `proxy.ts` (Next 16 request boundary). Build route table matches the intended V2 surface: `/`, `/planen`, `/reisen`, `/account/*`, `/admin/*`, search APIs, auth callback/password, UI-audit harness (Production 404 via `uiAuditSeiteAktiv`).

No `/privacy`, `/terms`, `/impressum`, or `/datenschutz` page exists. That absence is a legal gap (`BLOCKED/NEEDS-DECISION`), not a reason to delete other routes.

Old-but-used files (last commit before 2026-04-30) remain current: `app/auth/callback/page.tsx`, `app/auth/update-password/layout.tsx`, `app/(admin)/admin/{error,loading,not-found}.tsx`. Age is not deletion proof.

### `components/` — `KEEP` except CookieConsent

97 tracked files. Trip Workspace, Account, Admin, Auth, layout, and shadcn `ui/` are live. `SkipToContentLink` is mounted in public/account/admin layouts. `FooterSitzung` is imported by `Footer`.

`components/layout/CookieConsent.tsx` is the only import-graph orphan and is classified separately.

### `lib/` — `KEEP`

675 files. Current domains: trips, auth, readiness, flights/hotels/activities/mobility/rental-cars, route, traveller, account, commercial-provenance, providers, legal (AP-6a inventory), project-sanitation lock test.

`lib/auth/mfa.ts` last changed 2025-09-02 but is imported by `LoginForm` and admin MFA step-up. Later AP-5 work added sibling modules; this file stayed stable. **KEEP.**

`lib/auth/roles.ts` still lists role `creator` and capability `inhalte-moderieren`. These are the current RBAC contract, not MediaStudio runtime. Capability cleanup is an Auth gate, not a hygiene delete.

### `supabase/` — split

| Path | Class |
| --- | --- |
| `supabase/migrations/*.sql` (58 files) | `HISTORICAL-EVIDENCE` / replay-required. Never delete because they are old or mention creator-era names. |
| `supabase/config.toml` | `KEEP` (local CLI / auth-config contract). |
| `supabase/.temp/*` | `DELETE-CANDIDATE` (tracked CLI cache). |
| `supabase/.branches/_current_branch` | `DELETE-CANDIDATE` (tracked CLI state, content `main`). |

`.gitignore` already lists `supabase/.temp/` and `supabase/.branches/`. `git ls-files -v` reports assume-unchanged (`H`) on the tracked temp files. That does not untrack them.

### `types/` — `KEEP`

`types/supabase.ts` and `types/trips.ts` are the current schema/trip contracts. `types/supabase.ts` contains **no** `creator_sessions`, `blog_posts`, `render_jobs`, or `creator-media` identifiers.

### `scripts/` — `KEEP`

39 files. CI hygiene, auth/db gates, UI-audit Playwright harnesses, and test shims (`server-only-empty.js` / `.mjs`) are used. No one-shot creator-media workflow scripts remain in `.github/workflows/`.

Stale comments (`Mega Pro` in `check-jetnity-setup.ts`; leftover `zod` exception in `pakete.mjs`) are `UPDATE-CANDIDATE`, not script deletion.

### `public/` including `public/images/` — mostly `KEEP`

| Asset | Current reference | Class |
| --- | --- | --- |
| `hero-bali.png` | `app/layout.tsx`, public layout metadata, homepage | `KEEP` |
| `bali.jpg`, `lisbon.jpg`, `zermatt.jpg`, `amsterdam.jpg` | `lib/places/inspiration.ts` | `KEEP` |
| `prague.jpg` | none in app/components/lib except sanitation lock test | `DELETE-CANDIDATE` |

### `.cursor/` — `KEEP`

Four operational rules plus `.cursor/mcp.json` using `${env:SUPABASE_ACCESS_TOKEN}` / `${env:SUPABASE_PROJECT_REF}` placeholders. No secret values in the file.

### `.github/workflows/` — `KEEP`

Only `ci.yml`. Historical one-shot creator-media C2/C3 workflows are already gone from this tree. CI runs setup, typecheck, lint, tests, API-Schutz, schema-Bezug, dead/exports/deps, and production build. Auth-config job is fail-closed on missing secrets (not run in this environment).

CI still cannot see unreferenced images, tracked CLI temp, unused image hosts, remote branches, or cloud projects.

### `styles/` — `KEEP`

`styles/globals.css` is the Tailwind / design-token entry referenced by `components.json`.

### Root source/config files

| File | Class | Note |
| --- | --- | --- |
| `package.json` / `package-lock.json` | `KEEP` | Next 16.3.3, React 19.2.8, Node 22.x. All declared deps used or config-only. |
| `tsconfig.json` / `next-env.d.ts` | `KEEP` | Framework-required. `next-env.d.ts` must not be hand-edited. |
| `next.config.js` | `KEEP` file / `UPDATE-CANDIDATE` image hosts | Typed routes, Supabase storage pattern, leftover V1 hosts. |
| `proxy.ts` | `KEEP` | Next 16 replacement for `middleware.ts`. No `middleware.ts` remains. |
| `eslint.config.mjs` | `KEEP` | Current Next 16 flat config. |
| `tailwind.config.js` | `KEEP` / low `UPDATE-CANDIDATE` | Scans nonexistent `./content/**`. Harmless. |
| `postcss.config.js` | `KEEP` | Old (2025-09-02) and still required. |
| `components.json` | `KEEP` / `UPDATE-CANDIDATE` alias | shadcn config. |
| `vercel.json` | `KEEP` | `{ "version": 2 }` after cron removal. |
| `.gitignore` | `KEEP` | Correctly ignores temp/branches; tracked copies remain. |
| `.env.example` | `KEEP` | Placeholders only. |
| `check-jetnity-setup.ts` | `KEEP` / low `UPDATE-CANDIDATE` copy | Still the prebuild/CI setup gate. |
| `AGENTS.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md`, `JETNITY_*`, `README.md`, `ROADMAP.md` | `KEEP` as current contracts | Pointer freshness is a TL continuity concern; this slice must not edit them. |

### `docs/` — structural only

607 tracked files. Almost all sit flat under `docs/`. Subdirectories are only `docs/history/` (2 files) and `docs/evidence/` (2 files before this audit).

| Structural bucket | Class | Meaning |
| --- | --- | --- |
| Canonical current pointers (`JETNITY_START_HERE.md`, `JETNITY_HANDOFF.md`, `docs/ACTIVE_WORK_STATUS.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `DECISIONS.md`) | `KEEP` + pointer-lag `UPDATE-CANDIDATE` | Still the intended entry set. They currently describe AP-10-S1 as the last runtime baseline and “no active Cursor agent”, which is stale relative to this audit. Not editable in this slice. |
| Task / status / handoff / self-review / ADR / acceptance / evidence | `HISTORICAL-EVIDENCE` | Required continuity. Do not mass-delete. |
| Duplicate/overlapping slice packets | `HISTORICAL-EVIDENCE` | Navigation problem, not proven safe deletion. |
| Missing `docs/EVIDENCE_INDEX.md` / docs index | `UPDATE-CANDIDATE` | Optional later index. No mass move in a hygiene-delete slice. |

Documentation is **not** a delete target in this or the immediate follow-up runtime-hygiene slices.

## Historical sanitation findings — current revalidation

Source clues: `docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md` and ADR-0184. Verdicts below are from **this** head, not copied.

| 26/28 Aug finding | Current evidence | Current class |
| --- | --- | --- |
| Tracked `supabase/.temp/*` | Still 5 tracked files; ignore rules present; assume-unchanged `H` | **still actionable** `DELETE-CANDIDATE` |
| Tracked `supabase/.branches/_current_branch` | Tracked; content `main` | **still actionable** `DELETE-CANDIDATE` |
| `pooler-url` production-ref + placeholder | Placeholder `[YOUR-PASSWORD]` present; no JWT / service_role / sk_live | **still actionable** as untrack; **not** a live-secret incident |
| `public/images/prague.jpg` | Tracked; no app/lib/component/docs image src; lock test requires existence | **still actionable** `DELETE-CANDIDATE` |
| Dead `CookieConsent` + `/privacy` 404 | Still only `check:dead` orphan; V1 Views/Likes text; `/privacy` and `/terms` absent from build routes; `RegisterForm` still links `/privacy` | **still actionable** `BLOCKED/NEEDS-DECISION` |
| V1 image hosts in `next.config.js` | Still only config + lock test + docs | **still actionable** `UPDATE-CANDIDATE` |
| `components.json` `@/hooks` | Alias present; `hooks/` absent | **still actionable** `UPDATE-CANDIDATE` |
| Remote-branch explosion | Separate 30 Aug branch-hygiene deleted 165 merged refs. Live remote heads now **65**. Remaining historical unique-evidence branches still exist. | **superseded as “136 heads”**; remaining branch axis is **out of this slice** |
| Open historical drafts #52/#50/#40/#39/#28 | All five still OPEN. **#88 is now CLOSED** (2026-08-29) but its branch remains. #135 MERGED. | **partially changed**; no close/delete in this slice |
| `jetnity-bets` cloud | No product-code hit. Only historical branch-hygiene evidence names. | **PO-gate / out of repo-file cleanup** |
| Unique docs only on #39/#40/#52/#88 branches | Those branches still exist. PR #88 close did not delete the inventory branch. | **still actionable** on the **branch** axis, not this repo-file audit |
| `chore/account-admin-team-prep` unique docs | Branch still exists | **still actionable** / branch retention |
| V1 Creator/Heatmap/Amadeus tables | Absent from `types/supabase.ts` | **resolved** in runtime types |
| `@supabase/auth-helpers-*` | Banned in setup-check; not in `package.json` | **resolved** |
| P2-TA-06 `documents[0]` | Not a current runtime finding in this audit | **resolved** (prior integration) |
| Hygiene ≠ asset/branch/cloud proof | Confirmed against current checkers | **current** |
| `main` branch protection off | Not re-proven from GitHub settings in this environment; continuity docs still say `protected=false` | `BLOCKED/NEEDS-DECISION` / governance; **unresolved live setting** |
| Docs volume / no index | 371 → **607** files | **still actionable** `UPDATE-CANDIDATE` |
| `check:deps` stale `zod` exception | Exception still in `pakete.mjs`; `zod` is now imported widely | **stale exception** `UPDATE-CANDIDATE` |
| “Mega Pro” copy in setup-check | Still present | `UPDATE-CANDIDATE` (cosmetic) |
| Temp/duplicate SHA branches | Largely addressed by the later merged-branch delete; not this slice | **out of scope** |
| No `jetnity-travel` ref | Still no product-code hit | **resolved** as non-finding |
| Archive tags / UI-audit harness / admin placeholders / migrations / ADRs | Still present and required | `KEEP` / `HISTORICAL-EVIDENCE` |
| Creator-media Production storage | C3 after-image on this baseline says source bucket/policies/objects are gone; recovery bucket is Production-only | **repo runtime residue: none**; Production recovery is **not a repo file** |

## Does Creator / MediaStudio runtime residue still exist?

**No current Creator-Hub / MediaStudio / Feed / Blog / Render runtime residue exists in `app/`, `components/`, `lib/`, `types/`, `package.json`, `next.config.js`, or `.github/workflows/`.**

Reproduced this head:

- Zero matches for `MediaStudio`, `creator-media`, `media-studio`, `creator_hub`, `CreatorFeed`, `render-pipeline` in application TypeScript.
- `types/supabase.ts` has no creator-session / blog / render tables.
- Creator-media C3 one-shot workflows are not in the tree.
- Remaining `creator*` hits are: RBAC role `creator`; capability tests in `scripts/db/sicherheit.mjs`; historical comments; and **migrations that create then drop** the old tables/policies.

Those migrations and the C2/C3 evidence docs are `HISTORICAL-EVIDENCE`. Deleting them would break replay and recovery proof.

The word `creator` in the role model is **current product RBAC**, not a leftover MediaStudio screen. Changing it is an Auth/authorization gate (`BLOCKED/NEEDS-DECISION` if someone proposes removal).

## What later cleanup may do — and must not do

Allowed as **later** Technical-Lead-gated slices (not started here):

1. Untrack CLI temp/branch files; update the sanitation lock test.
2. Delete `prague.jpg`; update the lock test.
3. Remove unused V1 image hosts; update the lock test.
4. Fix `components.json` alias and stale checker comments.
5. Legal/PO decision for `/privacy`, `/terms`, and CookieConsent.

Must not happen in a “hygiene cleanup” without a separate gate:

- any Supabase migration delete or rewrite;
- Auth / Traveller / Provider / Commercial Truth changes;
- mounting CookieConsent with V1 text;
- inventing legal copy;
- Production/Vercel/provider writes;
- branch/PR/tag deletion from this audit;
- history rewrite;
- `jetnity-bets` / recovery-bucket cloud action.

## Traveller context

Not applicable to the leftover files themselves. No traveller credential collection or evaluation is proposed. Legal-page work later must stay data-minimized and must not invent visa/eligibility rules.

## Explicit non-claims

- This audit did not mutate Production, Supabase, Vercel, or providers.
- This audit did not live-re-inventory Storage buckets; C3 after-image is accepted as the last recorded Production source-removal proof, not re-executed.
- Branch protection was not freshly queried from GitHub settings.
- `auth:pruefen` and DB privilege/RLS live scripts were not run (secrets / Production read).
- Unreferenced is not always delete-safe; the three delete candidates above have stronger-than-age evidence **and** a coupled lock test.
