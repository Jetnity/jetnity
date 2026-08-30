# Core Repository Hygiene Matrix – 2026-08-30

Audit head: `c895d16b5c1f42cdb0bed5b44aaaf188d07c5024`  
Vocabulary: exactly one of `KEEP` | `UPDATE-CANDIDATE` | `DELETE-CANDIDATE` | `HISTORICAL-EVIDENCE` | `BLOCKED/NEEDS-DECISION`.

Every `UPDATE-CANDIDATE`, `DELETE-CANDIDATE`, and `BLOCKED/NEEDS-DECISION` row includes the ten required evidence fields.

## 1. Grouped KEEP (current necessity)

Grouped evidence is allowed for broad current areas. Framework-critical roots are listed individually.

| Path / group | Current role | Why KEEP | Age note |
| --- | --- | --- | --- |
| `app/` except missing legal pages | Next.js App Router: public, account, admin, APIs, auth, UI-audit | Build emits these routes; import graph starts here | Some auth/admin shells last touched 2025-09; still mounted |
| `components/` except `CookieConsent.tsx` | UI for trips, account, admin, auth, layout, shadcn | Imported from app/lib; `check:dead` reachable | — |
| `lib/` except notes below | Domain logic, auth, providers, tests | `check:exports` 0 unused; tests 2815 pass | `lib/auth/mfa.ts` old date, live importers |
| `types/supabase.ts` | Generated/maintained DB types | `check:schema-bezug` uses it; no creator-era tables | — |
| `types/trips.ts` | Canonical trip graph type | Imported across trip workspace | — |
| `scripts/` | CI hygiene, DB/auth gates, Playwright UI audits, test shims | npm scripts and CI call them | — |
| `supabase/config.toml` | Local CLI / auth-config contract | `auth:pruefen` compares against it | — |
| `supabase/migrations/*` (58) | Versioned replay | Replay/recovery; see HISTORICAL-EVIDENCE | Includes creator-era create/drop |
| `public/images/{hero-bali.png,bali,lisbon,zermatt,amsterdam}.jpg` | Homepage / OG / inspiration | Concrete `src` / metadata URLs | Files dated 2025-07/09 |
| `.github/workflows/ci.yml` | Only workflow | Current CI contract | One-shot C3 workflows already gone |
| `.cursor/rules/*.mdc` | Agent operating rules | Current operational purpose | — |
| `.cursor/mcp.json` | MCP placeholder config | Env placeholders only | — |
| `styles/globals.css` | Design tokens / Tailwind entry | `components.json` + app styles | — |
| `package.json` / `package-lock.json` | Dependencies and scripts | All deps used or config-exempt | — |
| `tsconfig.json` | TypeScript project | `typecheck` uses it | — |
| `next-env.d.ts` | Next-generated types entry | Framework-required; do not hand-edit | Protect from false-positive delete |
| `proxy.ts` | Next 16 request proxy | Replaces `middleware.ts`; build lists “Proxy” | — |
| `eslint.config.mjs` | Flat ESLint | `npm run lint` | — |
| `postcss.config.js` | PostCSS/Tailwind pipeline | Required despite 2025-09-02 date | Protect from age-only delete |
| `vercel.json` | Vercel project config | Minimal `{version:2}` after cron removal | — |
| `.gitignore` | Ignore rules | Correctly lists temp/branches | Tracked copies are a separate row |
| `.env.example` | Public env contract | Placeholders only | — |
| `check-jetnity-setup.ts` | Prebuild/CI setup gate | `prebuild` + `check:setup:ci` | Copy stale, file required |
| Canonical product docs (`JETNITY_VISION.md`, `JETNITY_PRODUCT_MANDATE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md`, `ROADMAP.md`, `README.md`, `AGENTS.md`) | Product/architecture contracts | Binding sources | Pointer lag: see UPDATE |
| `lib/project-sanitation/closure-invariants.test.ts` | Evidence lock for leftovers | Prevents silent leftover deletion | Must be edited **with** any leftover delete |
| `lib/legal/ap6a-gate0-*` | Legal-foundation inventory | Documents missing pages / orphan banner | Not a substitute for legal text |
| `app/(public)/ui-audit/**` + `lib/ui-audit/freigabe.ts` | Local/Preview UI-audit harness | Production fail-closed | KEEP harness |
| `lib/auth/roles.ts` role `creator` | Current RBAC | Used by admin gates and DB capability tests | Not MediaStudio UI |

## 2. UPDATE-CANDIDATE

### U-01 — V1 image hosts in `next.config.js`

1. **Path:** `next.config.js` (`images.remotePatterns` hosts `oaidalleapiprodscus.blob.core.windows.net` and `jetnity.ai`).
2. **Role:** Next image allowlist. File itself is required.
3. **References:** Host strings occur only in this file, `lib/project-sanitation/closure-invariants.test.ts`, and historical docs. No `app/` / `components/` / `lib/` image URL uses them. Current used hosts: local `/images/*` and dynamic Supabase hostname from `NEXT_PUBLIC_SUPABASE_URL`.
4. **Package/config:** Next.js `images.remotePatterns`.
5. **Age:** File updated 2026-08-28 for Next 16; the two host entries are older V1 residue.
6. **Risk if changed:** Removing unused hosts reduces allowlist surface. Residual risk if an unseen CMS/user URL still points at those hosts (none found in repo). Lock test will fail until updated.
7. **Class:** `UPDATE-CANDIDATE`
8. **Confidence:** medium (repo-complete; cannot prove no Production HTML still embeds old URLs).
9. **Later slice:** Runtime-config micro-PR: drop the two hosts; update lock test; keep Supabase pattern.
10. **PO approval:** not required for removing unused allowlist entries; required if `jetnity.ai` is still an intended public asset domain.

### U-02 — `components.json` alias `@/hooks`

1. **Path:** `components.json` → `aliases.hooks` = `@/hooks`.
2. **Role:** shadcn/ui codegen config. Not imported by Next at runtime.
3. **References:** Alias only. Directory `hooks/` does not exist. `check:dead` watches `hooks/` if present.
4. **Package/config:** shadcn schema; no npm package depends on the alias existing.
5. **Age:** last commit 2025-09-02.
6. **Risk if changed:** Removing or correcting the alias cannot break current imports (there are none). A later `shadcn add` might recreate `hooks/`.
7. **Class:** `UPDATE-CANDIDATE`
8. **Confidence:** high
9. **Later slice:** Config-hygiene: remove unused alias or add hooks only when a real hook module exists.
10. **PO approval:** no

### U-03 — Stale `zod` exception in `scripts/pakete.mjs`

1. **Path:** `scripts/pakete.mjs` (`ABSICHTLICH` map entry `zod`).
2. **Role:** unused-dependency checker. `zod` itself is `KEEP`.
3. **References:** `zod` is imported in `lib/trips/schema.ts`, flights/hotels/activities/mobility/rental-cars/route/safety/seasonal/readiness/reisevorschlag/reiseaenderung schemas and actions, and import helpers.
4. **Package/config:** `check:deps` / ADR-0026 exception text.
5. **Age:** exception predates current Zod usage.
6. **Risk if changed:** Removing the exception is documentation-accurate; `check:deps` already reports 0 unused because `zod` is imported.
7. **Class:** `UPDATE-CANDIDATE`
8. **Confidence:** high
9. **Later slice:** Drop the stale `ABSICHTLICH` entry and adjust DECISIONS wording if a later docs slice touches ADR-0026.
10. **PO approval:** no

### U-04 — “Mega Pro” copy in `check-jetnity-setup.ts`

1. **Path:** `check-jetnity-setup.ts` header and banner.
2. **Role:** Required setup gate (`prebuild`, `check:setup:ci`).
3. **References:** npm scripts; CI.
4. **Package/config:** none beyond `tsx`.
5. **Age:** comment since V1-era naming; file still updated 2026-08-20.
6. **Risk if changed:** Cosmetic only.
7. **Class:** `UPDATE-CANDIDATE`
8. **Confidence:** high
9. **Later slice:** Rename banner to current product name.
10. **PO approval:** no

### U-05 — Tailwind `content/**` glob

1. **Path:** `tailwind.config.js` `content` includes `./content/**/*.{md,mdx}`.
2. **Role:** Current Tailwind config (`KEEP` file).
3. **References:** No top-level `content/` directory. Admin route `app/(admin)/admin/content/page.tsx` is unrelated.
4. **Package/config:** `tailwindcss`.
5. **Age:** glob likely from Mega Pro scaffold (file also has later 2026-08-20 edits).
6. **Risk if changed:** Removing the glob is a no-op today.
7. **Class:** `UPDATE-CANDIDATE`
8. **Confidence:** high
9. **Later slice:** Drop the unused glob.
10. **PO approval:** no

### U-06 — `docs/` navigation / canonical-pointer lag

1. **Path:** `docs/` as a set (607 files); plus root `JETNITY_START_HERE.md` / `JETNITY_HANDOFF.md` / `docs/ACTIVE_WORK_STATUS.md` pointer freshness.
2. **Role:** Continuity and evidence. Required as a corpus.
3. **References:** Agents/start-here point at a small canonical set; the rest is dated slice packets. No `docs/EVIDENCE_INDEX.md`.
4. **Package/config:** none.
5. **Age:** mixed; volume grew 371 → 607 since 28 Aug.
6. **Risk if changed:** Mass-deleting docs would destroy replay/review evidence. Editing global TL pointers is **out of this audit’s write-set**.
7. **Class:** `UPDATE-CANDIDATE` (index / pointer refresh only)
8. **Confidence:** high that navigation is hard; low that any specific dated packet is deletable.
9. **Later slice:** Optional index; TL-owned pointer refresh after this PR. No mass move.
10. **PO approval:** no for an index; yes before discarding unique historical docs.

### U-07 — `.gitignore` heatmap comment

1. **Path:** `.gitignore` comment mentioning heatmap (historical API note in 2025-09-03 commit message; file still the current ignore set).
2. **Role:** Ignore rules are current and required.
3. **References:** No runtime `heatmap` module.
4. **Package/config:** git.
5. **Age:** 2025-09-03.
6. **Risk if changed:** Comment-only.
7. **Class:** `UPDATE-CANDIDATE` (comment hygiene only; **do not** delete `.gitignore`)
8. **Confidence:** high
9. **Later slice:** Optional comment cleanup when touching the file for untrack.
10. **PO approval:** no

## 3. DELETE-CANDIDATE

Deletion is **not** performed in this slice. Each row has evidence stronger than age. Any later delete must also update `lib/project-sanitation/closure-invariants.test.ts`.

### D-01 — Tracked Supabase CLI temp files

1. **Path group:** `supabase/.temp/cli-latest`, `supabase/.temp/gotrue-version`, `supabase/.temp/pooler-url`, `supabase/.temp/postgres-version`, `supabase/.temp/rest-version`.
2. **Role:** Local Supabase CLI cache. Not a migration. Not replay evidence.
3. **References:** No runtime importer. `.gitignore` already lists `supabase/.temp/`. Lock test and sanitation docs mention the paths. `git ls-files` still tracks them (`H` assume-unchanged).
4. **Package/config:** Supabase CLI local metadata only.
5. **Age:** 2025-07-15 / 2025-09-16. Age is secondary.
6. **Risk if changed:** `git rm --cached` makes ignore take effect. **History rewrite is forbidden.** Current `pooler-url` is a placeholder (no live password). After untrack, a developer’s future CLI run could write a real URL locally and it would stay untracked — that is the desired outcome. Lock test must drop existence asserts.
7. **Class:** `DELETE-CANDIDATE` (untrack, not migration delete)
8. **Confidence:** high
9. **Later slice:** Dedicated untrack PR; do not combine with legal or Auth work.
10. **PO approval:** no for untrack of placeholders. Yes for history rewrite (must not happen).

### D-02 — Tracked `supabase/.branches/_current_branch`

1. **Path:** `supabase/.branches/_current_branch`
2. **Role:** CLI “current branch” marker. Content: `main`.
3. **References:** None in runtime. `.gitignore` lists `supabase/.branches/`. Still tracked.
4. **Package/config:** Supabase CLI.
5. **Age:** 2025-07-15.
6. **Risk if changed:** Same as D-01. Not a git branch. Not a migration.
7. **Class:** `DELETE-CANDIDATE`
8. **Confidence:** high
9. **Later slice:** Same untrack PR as D-01.
10. **PO approval:** no

### D-03 — `public/images/prague.jpg`

1. **Path:** `public/images/prague.jpg` (~1.8 MB)
2. **Role:** Static public asset. Not referenced by inspiration, OG, or homepage.
3. **References:** `rg` over app/components/lib/docs (excluding sanitation lock/docs that name the finding) shows no `/images/prague.jpg`. Sister city images **are** referenced from `lib/places/inspiration.ts`. Lock test asserts the file exists.
4. **Package/config:** none.
5. **Age:** 2025-09-02 Mega Pro commit. Not sufficient alone.
6. **Risk if changed:** Removing a never-linked public file cannot break current routes. External bookmarks to `/images/prague.jpg` would 404 (no product link found). Lock test must be updated.
7. **Class:** `DELETE-CANDIDATE`
8. **Confidence:** high for this repository; medium for unknown external hotlinks (no product obligation found).
9. **Later slice:** Asset-hygiene micro-PR with D-01/D-02 or separately.
10. **PO approval:** no

## 4. HISTORICAL-EVIDENCE

Do **not** classify these as `DELETE-CANDIDATE` because they are old or mention dead product names.

| Path / group | Why it must remain |
| --- | --- |
| `supabase/migrations/20260815060111_baseline.sql` through `20260830183009_creator_media_c3_policy_decommission.sql` (all 58) | Replay order. Baseline still *creates* `creator_sessions`; later migrations drop them. Deleting “old” files breaks history. |
| `supabase/migrations/20260817110000_legacy_entfernen.sql`, `20260817120200_creator_sessions_entfernen.sql`, `20260830155711_legacy_storage_policies_cleanup.sql`, `20260830183009_creator_media_c3_policy_decommission.sql` | Proof of creator/storage decommission. |
| `docs/PROJECT_SANITATION_*_2026-08-28.md` | ADR-0184 retention plan. |
| `docs/LEGACY_*CREATOR*`, `docs/CREATOR_MEDIA_C2_*`, `docs/CREATOR_MEDIA_C3_*` | Phase 0 / C2 / C3 evidence. |
| `docs/GITHUB_BRANCH_HYGIENE_*` + `docs/evidence/GITHUB_BRANCH_HYGIENE_*.json` | Restore manifest for 165 deleted merged refs. |
| `docs/history/*` | Pre-PR113 snapshots. |
| Dated `*_TASK/_STATUS/_HANDOFF/_SELF_REVIEW/_ACCEPTANCE` packets | Review/continuity. Navigation pain ≠ delete proof. |
| ADR entries in `DECISIONS.md` (including ADR-0184) | Binding decisions. |
| `scripts/db/sicherheit.mjs` / `rechte.mjs` comments naming `blog_posts` / `creator_sessions` | Current security tests; names are historical explanation. |

## 5. BLOCKED/NEEDS-DECISION

### B-01 — CookieConsent orphan + legal routes 404

1. **Path group:** `components/layout/CookieConsent.tsx`; missing `app/**/privacy/page.tsx` and `app/**/terms/page.tsx`; live link in `components/auth/RegisterForm.tsx`; contract in `lib/legal/ap6a-gate0-vertrag.ts`.
2. **Role:** CookieConsent is an unmounted banner with V1 “Cookies/LocalStorage … Views/Likes” copy and `href="/privacy"`. Register is a **mounted** flow that already links `/privacy`. AP-6a lists `/privacy` and `/terms` as required legal routes without pages.
3. **References:** CookieConsent: no `from '@/components/layout/CookieConsent'` except tests. RegisterForm: used by `/register`. Build route table has no `/privacy` or `/terms`. Footer does not link privacy (by AP-6a inventory).
4. **Package/config:** `check:dead` justified orphan. `localStorage` key `jetnity:cookie-consent:v1` only if mounted.
5. **Age:** CookieConsent last commit 2025-09-02. Legal gap is current.
6. **Risk if changed:** Mounting current copy would publish false V1 social-measurement claims. Inventing privacy/terms text is a legal/PO gate. Deleting CookieConsent without a legal decision is allowed only after PO/TL choose “delete orphan”. Deleting Register’s link without a page is a truth problem the other way.
7. **Class:** `BLOCKED/NEEDS-DECISION`
8. **Confidence:** high on facts; decision is not this agent’s.
9. **Later slice:** AP-6a follow-on / Legal. Options: honest pages + optional honest banner; or remove links and orphan. Do not silently wire CookieConsent.
10. **PO approval:** **yes** before user-visible legal text or mounting a banner.

### B-02 — Capability `inhalte-moderieren` / role name `creator`

1. **Path:** `lib/auth/roles.ts`; mirrored DB capabilities; `scripts/db/sicherheit.mjs`.
2. **Role:** Current authorization contract. Moderators+ can hold `inhalte-moderieren` even though `creator_sessions` is gone.
3. **References:** Live RBAC, admin navigation tests, DB security scripts.
4. **Package/config:** none extra.
5. **Age:** role model is current V2.
6. **Risk if changed:** Removing the capability or the role name is an Auth/authorization change, not hygiene.
7. **Class:** `BLOCKED/NEEDS-DECISION` **only if proposed for removal**; otherwise the files are `KEEP`.
8. **Confidence:** high
9. **Later slice:** Separate Auth review if product wants to retire the unused capability.
10. **PO approval:** yes for Auth/capability contract change.

### B-03 — Production recovery bucket only

`jetnity-bets` decommission and `main` branch protection are **no longer current BLOCKED findings**. TL live verification (review of `e1bbf7fd`):

- Supabase project list contains only current Jetnity Production; `jetnity-bets` is gone.
- GitHub ruleset `Jetnity main protection` id `21875372` is ACTIVE on `refs/heads/main`; no bypass actors; PR required; conversation resolution required; only merge method `merge`; deletion and force/non-fast-forward blocked; required checks are `Typecheck, Lint & Build`, `Auth-Konfiguration gegen config.toml`, `Vercel`.
- GitHub branch endpoint reports `main protected=true`.
- Earlier packet wording that protection was unqueried / `protected=false` is **historical and superseded**.

B-03 now covers only the private C3 recovery bucket (policy/state unchanged in this review-fix; no Production write).

1. **Path:** Production-only recovery bucket from the C3 after-image. Not a tracked repository file.
2. **Role:** Private recovery copy of decommissioned creator-media bytes. Not current product runtime.
3. **References:** C3 after-image docs. No application importer.
4. **Package/config:** none in this repo.
5. **Age:** n/a (Production object, not a dated repo file).
6. **Risk if changed:** Changing or deleting the recovery bucket is a Production/data decision. This review-fix does not inspect or mutate it.
7. **Class:** `BLOCKED/NEEDS-DECISION`
8. **Confidence:** high that it is out of a repo-file delete slice; recovery-bucket live state was not re-listed here.
9. **Later slice:** Existing Production/recovery gate. Not a follow-up of this audit’s file cleanup list.
10. **PO approval:** **yes** before recovery-bucket mutation or history rewrite. Not required for the already-completed `jetnity-bets` decommission or the now-active main protection ruleset.

### B-04 — Unique docs still only on historical remote branches

1. **Path:** branches (not this tree): `audit/project-sanitation-inventory-2026-08-26`, `audit/account-platform`, `audit/admin-platform`, `docs/chatgpt-technical-lead-handoff-2026-08-24`, `chore/account-admin-team-prep`, `docs/post-pr98-continuity-2026-08-27`, `feat/trip-collaboration-foundation`.
2. **Role:** Possible unique evidence. PR #88 is CLOSED; its branch remains. PRs #28/#39/#40/#50/#52 remain OPEN.
3. **References:** Live `git ls-remote` on 2026-08-30 confirmed the seven refs above. This slice must not close or delete them.
4. **Package/config:** none.
5. **Age:** n/a.
6. **Risk if changed:** Branch-delete without preservation loses unique files. ADR-0184 still applies.
7. **Class:** `BLOCKED/NEEDS-DECISION` on the branch axis (already a separate workstream)
8. **Confidence:** high that refs exist; unique-file contents were not re-diffed in this slice.
9. **Later slice:** Existing GitHub branch/PR hygiene; not this core-repo file audit.
10. **PO approval:** not for leftover merged-ref deletes already specified elsewhere; yes before discarding unique unmerged docs.

## 6. Classification counts (this audit)

| Class | Distinct findings / groups |
| --- | ---: |
| `KEEP` | 1 grouped runtime corpus + individually protected roots |
| `UPDATE-CANDIDATE` | 7 |
| `DELETE-CANDIDATE` | 3 |
| `HISTORICAL-EVIDENCE` | migrations + sanitation/legacy/C3/docs corpus |
| `BLOCKED/NEEDS-DECISION` | 4 |

No sixth class was used.

## 7. Coupling note for any later delete PR

A leftover-delete PR that does not update all of the following will fail or lie:

- `lib/project-sanitation/closure-invariants.test.ts`
- ADR-0184 consequence text (TL docs slice, not this agent)
- `check:dead` only if CookieConsent is removed (B-01, not D-*)
