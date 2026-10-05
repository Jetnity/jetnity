# Core Repository Hygiene Audit – Task

Date: 2026-08-30
Issue: #273
Baseline: `main@d4a2bba21e9a247594272adb2a13d6cf0620ff48`
Branch: `audit/core-repository-hygiene-2026-08-30`
Type: **AUDIT-ONLY / NON-DESTRUCTIVE**
Cursor-Agent: **`Jetnity core repository hygiene audit 1`**

## 1. Goal

Build a complete, current, evidence-based hygiene inventory of the repository that is now the only Jetnity codebase. The audit must identify what is genuinely part of current Jetnity, what is obsolete legacy residue, what should be updated, and what must remain as historical/replay evidence.

This slice does **not** perform cleanup. It prepares safe later cleanup slices for Technical-Lead review.

## 2. Binding principle

> Age is a signal, never deletion proof.

Files last changed before 2026-04-30 are high-priority legacy candidates because Jetnity was materially re-architected later, but no file may be classified `DELETE-CANDIDATE` solely because it is old.

Every deletion candidate needs current evidence showing that removal would not break runtime, build, tests, contracts, migration replay, security/privacy, operations, documentation continuity, or recovery.

## 3. Required scope

Audit the current tracked repository comprehensively, with explicit coverage of:

- `app/`
- `components/`
- `lib/`
- `supabase/`
- `types/`
- `scripts/`
- `public/` with explicit `public/images/`
- `.cursor/`
- `.github/workflows/`
- `styles/`
- root source/config files, including at least `.env.example`, `.gitignore`, `AGENTS.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `DESIGN_SYSTEM.md`, `JETNITY_HANDOFF.md`, `JETNITY_PRODUCT_MANDATE.md`, `JETNITY_START_HERE.md`, `JETNITY_VISION.md`, `README.md`, `ROADMAP.md`, `check-jetnity-setup.ts`, `components.json`, `eslint.config.mjs`, `next-env.d.ts`, `next.config.js`, `package.json`, `package-lock.json`, `postcss.config.js`, `proxy.ts`, `tailwind.config.js`, `tsconfig.json`, `vercel.json`;
- `docs/` at structural level: canonical/current pointers vs task/evidence/history vs duplicate/stale continuity. Do not attempt to delete documentation in this slice.

Also re-check historical sanitation findings against the current baseline, including at minimum:

- tracked `supabase/.temp/*`;
- tracked `supabase/.branches/_current_branch`;
- any tracked Supabase CLI pooler/temp metadata;
- `public/images/prague.jpg` or equivalent old assets;
- dead/unmounted `CookieConsent` and `/privacy` relationship;
- obsolete image hosts in `next.config.js` such as old Jetnity/DALL-E hosts;
- `components.json` aliases whose target directories do not exist;
- old Creator/MediaStudio/Feed/Blog/Render names or compatibility residue;
- stale dependencies or scripts;
- root files that appear old but are still framework-required;
- docs volume/navigation and canonical-pointer ambiguity.

Historical findings are clues only. Reproduce current evidence; do not copy old verdicts.

## 4. Classification vocabulary

Each relevant path/finding must receive exactly one primary class:

- `KEEP` – current runtime/build/contract/operational necessity or clearly valid current source.
- `UPDATE-CANDIDATE` – necessary concept/file but content/config is stale, misleading, inconsistent or structurally suboptimal.
- `DELETE-CANDIDATE` – current evidence supports later safe removal; no deletion in this slice.
- `HISTORICAL-EVIDENCE` – not runtime-current but required for migration replay, audit trail, recovery, ADR/decision continuity, or historical proof.
- `BLOCKED/NEEDS-DECISION` – cannot be safely resolved without Product Owner, Technical Lead, legal/provider/security decision, or a separate live-environment gate.

Do not invent a sixth class.

## 5. Evidence required per candidate

For every `UPDATE-CANDIDATE`, `DELETE-CANDIDATE`, and `BLOCKED/NEEDS-DECISION`, record at minimum:

1. exact path or bounded path group;
2. current role/purpose;
3. current references/importers/callers/routes or explicit evidence of none;
4. relevant package/build/config dependency;
5. Git age only as secondary signal where useful;
6. runtime/build/security/privacy/data/replay risk if changed;
7. primary classification;
8. confidence: `high`, `medium`, or `low`;
9. recommended later remediation slice;
10. whether Product Owner approval would be required before that remediation.

For broad `KEEP` areas, grouped evidence is allowed, but core contracts and framework-critical root files must be explained individually enough to prevent accidental deletion.

## 6. Mandatory technical checks

Use current repository evidence, not assumptions. At minimum:

- enumerate tracked files/tree and top-level inventory;
- inspect imports/references with repository search and local static analysis;
- inspect Next.js route reachability under `app/`;
- inspect component/lib/types importers and exports;
- inspect `package.json` scripts/dependencies and compare with actual imports/tooling;
- run existing dead-code/dependency checks if available;
- run `npm run typecheck` or repository equivalent;
- run lint/tests/build where practical for audit evidence;
- inspect static asset references from code/config/docs;
- inspect Supabase migration directory vs non-migration temp/branch metadata;
- distinguish migration/replay evidence from disposable CLI state;
- inspect root config files against current Next.js/Tailwind/PostCSS/TypeScript usage;
- inspect `.github/workflows/` for current referenced workflows vs one-shot leftovers;
- inspect `.cursor/` for current operational purpose and accidental secrets/obsolete config without exposing secret values;
- search current repository for old Creator/MediaStudio-era nouns and classify every surviving runtime/config occurrence;
- compare relevant findings with the existing hygiene checks so false confidence from CI gaps is documented.

If a check cannot be completed reliably, mark it explicitly as unresolved instead of guessing.

## 7. Hard safety / non-scope

The Cursor Agent must **not**:

- delete, move, rename or edit any current runtime source file;
- change `app/`, `components/`, `lib/`, `types/`, `scripts/`, `public/`, root configs, `.cursor/`, `.github/`, or existing `supabase/` content;
- create, modify, rename or delete a Supabase migration;
- delete historical migration files even if old;
- perform any Supabase, Vercel, provider, domain, payment or Production write;
- change Auth/MFA/AAL/RLS/Ownership/Identity contracts;
- alter Account/Traveller/Trip/Provider/Commercial Truth behavior;
- close/delete branches, PRs, tags, issues or repositories;
- change branch protection/rulesets;
- introduce dependencies;
- implement any cleanup recommendation;
- edit global TL continuity files (`JETNITY_HANDOFF.md`, `JETNITY_START_HERE.md`, `docs/ACTIVE_WORK_STATUS.md`, ROADMAP/ARCHITECTURE/DECISIONS) as part of the audit;
- mark the PR Ready;
- merge;
- start any follow-up slice.

Allowed writes are limited to the task-specific audit deliverables listed below.

No secrets, personal data, private object paths, tokens, credentials or sensitive user data may be copied into audit files.

## 8. Required deliverables

The agent may create/update only these task-specific outputs (plus this task file only if a factual correction is strictly necessary and called out):

1. `docs/CORE_REPOSITORY_HYGIENE_AUDIT_2026-08-30.md`
   - executive summary;
   - top findings ranked by risk/value;
   - area-by-area conclusions;
   - explicit answer whether old Creator/MediaStudio runtime residue still exists.
2. `docs/CORE_REPOSITORY_HYGIENE_MATRIX_2026-08-30.md`
   - evidence-backed path/finding classification matrix.
3. `docs/evidence/CORE_REPOSITORY_HYGIENE_INVENTORY_2026-08-30.json`
   - machine-readable inventory/summary with no sensitive content.
4. `docs/CORE_REPOSITORY_HYGIENE_STATUS_2026-08-30.md`
   - exact head, commands/checks/results, unresolved blockers.
5. `docs/CORE_REPOSITORY_HYGIENE_SELF_REVIEW_2026-08-30.md`
   - scope self-review, false-positive/false-negative risks.
6. `docs/CORE_REPOSITORY_HYGIENE_HANDOFF_2026-08-30.md`
   - concise handoff for independent TL review; no merge recommendation beyond “ready for TL review”.

Do not create additional cleanup plans, migrations, runtime patches, global continuity changes, one-shot workflows or unrelated documentation.

## 9. Acceptance criteria

The audit is ready for Technical-Lead review only when:

- all required scope areas were inspected against the exact baseline or an explicitly recorded newer head;
- all previous sanitation findings in §3 were revalidated;
- all current Creator/MediaStudio-era runtime/config references were identified and classified;
- all delete candidates have evidence stronger than file age;
- no existing migration is proposed for deletion merely because it is legacy;
- framework-required old files are protected from false-positive deletion;
- current CI/dead-code/dependency tooling limits are explained;
- outputs contain no secret/user data;
- no non-scope file was changed;
- audit commands and results are reproducible;
- the agent stops after task deliverables.

## 10. STOP

After producing the six task-specific deliverables and running audit checks:

**STOP.**

Do not implement cleanup. Do not mark Ready. Do not merge. Do not start another slice. Wait for independent Technical-Lead review.
