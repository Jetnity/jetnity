# Core Repository Hygiene Status – 2026-08-30

Status: **AUDIT COMPLETE / DRAFT / READY FOR INDEPENDENT TL REVIEW / NO READY / NO MERGE / NO CLEANUP**

## Exact identity

| Feld | Wert |
| --- | --- |
| Issue | [#273](https://github.com/Jetnity/jetnity/issues/273) |
| Draft-PR | [#277](https://github.com/Jetnity/jetnity/pull/277) |
| Branch | `audit/core-repository-hygiene-2026-08-30` |
| Cursor-Agent | `Jetnity core repository hygiene audit 1` |
| Task | `docs/CORE_REPOSITORY_HYGIENE_AUDIT_TASK_2026-08-30.md` |
| Task baseline | `d4a2bba21e9a247594272adb2a13d6cf0620ff48` |
| Packet / stamp head that CI gated | `fcedca1d26df1c687d7155918cf25b99d6c11ed2` |
| Baseline ancestor of audit start | yes |
| Local `origin/main` pointer | `ea79716315304c1289b094811d80f8880c09e615` |
| Node / npm | v22.14.0 / 10.9.7 |
| Environment | Cloud agent workspace; `node_modules` present |

The first commit on this branch is the task file only. Runtime/config/migration/asset trees were not edited.

## Commands and results (reproducible)

All commands were run from `/workspace` against start HEAD `c895d16b5c1f42cdb0bed5b44aaaf188d07c5024` before the deliverable files existed. The six docs were then committed as `5c0a931d1fde2e26d95c82abe151607dddecbaa8`. Adding docs does not change the runtime results.

| Command | Exit | Result |
| --- | ---: | --- |
| `git ls-files \| wc -l` | 0 | 1603 tracked files |
| `git ls-files docs/ \| wc -l` | 0 | 607 |
| `npm run check:dead` | 0 | 391 start points, 893 reachable, 1 justified orphan `components/layout/CookieConsent.tsx` |
| `npm run check:exports` | 0 | 768 files, 0 unused exports |
| `npm run check:deps` | 0 | 0 unjustified unused packages |
| `npm run check:api-schutz` | 0 | 12/12 admin routes use `requireAdminApi()` |
| `npm run check:schema-bezug` | 0 | 21 tables/views + 20 functions in `types/supabase.ts` exist for referenced names |
| `npm run typecheck` | 0 | `next typegen` + `tsc --noEmit` |
| `npm run lint` | 0 | 0 errors, 135 warnings (existing Next-16 warn-level rules) |
| `npm test` | 0 | 2815 pass / 0 fail / 0 skipped |
| `npm run check:setup:ci` | 0 | required files/imports/tsconfig/next images OK; 1 warning: no `.env`/`.local` in this environment |
| `npm run build` | 0 | compiled; 22 static pages generated; no `/privacy` or `/terms` route |

Reference command transcripts: `/tmp/hygiene-audit/*.txt` on the audit machine (not committed).

## GitHub CI / Preview on exact stamp head

Recorded after the GitHub notification. These jobs ran on `fcedca1d26df1c687d7155918cf25b99d6c11ed2`. A later docs-only stamp of this CI paragraph will move the branch tip; that newer tip is not claimed green here.

| Gate | ID | Head | Result |
| --- | --- | --- | --- |
| Actions run `CI` | [33330291602](https://github.com/Jetnity/jetnity/actions/runs/33330291602) | `fcedca1d` | **SUCCESS** |
| `Typecheck, Lint & Build` | job `99307547958` | `fcedca1d` | **SUCCESS** |
| `Auth-Konfiguration gegen config.toml` | job `99307547842` | `fcedca1d` | **SUCCESS** (ran; not skipped) |
| Vercel Preview | `9trwANQ6TteDrtdZnWitRbzysAPv` | `fcedca1d` | **SUCCESS** |
| Earlier task-only CI | [33329928407](https://github.com/Jetnity/jetnity/actions/runs/33329928407) | `c895d16b` | **SUCCESS** |

Green CI still does not prove asset, branch, or cloud cleanliness.

### Targeted read-only inspections

| Check | Result |
| --- | --- |
| Tracked `supabase/.temp/*` + `.branches/_current_branch` | 6 files still tracked; `.gitignore` already ignores both dirs |
| `pooler-url` secret scan (presence only) | `[YOUR-PASSWORD]` present; no `eyJ`, `service_role`, `sb_secret`, `sk_live` |
| `public/images/prague.jpg` importers | no app/component/lib image `src`; lock test requires file |
| Other `public/images/*` | referenced from layout/homepage or `lib/places/inspiration.ts` |
| `hooks/` directory | does not exist |
| `content/` directory | does not exist |
| CookieConsent importers | none except tests / dead-code exception |
| `/privacy` `/terms` pages | no page files; absent from build route table |
| `RegisterForm` `/privacy` link | present |
| Creator/MediaStudio in app/components/lib/types | no runtime hits |
| `types/supabase.ts` creator/blog/render tables | no matches |
| `.github/workflows/` | only `ci.yml` |
| `.cursor/mcp.json` | env placeholders only |
| Live remote heads | 65 |
| Historical PRs | #88 CLOSED; #135 MERGED; #28/#39/#40/#50/#52 OPEN |
| Unique-evidence branches | still present (see matrix B-04) |

## Not run / unresolved

These are documented gaps, not guessed pass/fail:

| Check | Why not run / unresolved |
| --- | --- |
| `npm run auth:pruefen` locally | Not executed in this workspace (no local secrets). CI job `Auth-Konfiguration gegen config.toml` **SUCCESS** on `fcedca1d` / run `33330291602`. |
| `db:rechte` / `db:rls` / `db:sicherheit` / `db:advisors` | Need a database. This slice does not change schema or RLS. |
| GitHub branch-protection API | Continuity docs still say `protected=false`. Not freshly queried. |
| Production Storage live list | C3 after-image not re-executed. Recovery bucket is Production-only. |
| Unique-file re-diff of historical branches vs `main` | Refs confirmed present; contents not re-copied (ADR-0184: do not absorb as current truth). |
| External hotlinks to `/images/prague.jpg` | Cannot be proven from the repository. |

## Unresolved blockers for *cleanup* (not for this audit)

This audit itself is not blocked. Later cleanup is blocked on:

1. Independent Technical-Lead review of these deliverables.
2. Coupled update of `lib/project-sanitation/closure-invariants.test.ts` before leftover deletes.
3. Product Owner / Legal decision before CookieConsent mount or legal-page text (B-01).
4. Separate gates for cloud, Auth capability retirement, and unique-branch deletion.

## Writes in this slice

Only the six task deliverables (plus the pre-existing task file). No runtime, config, migration, asset, workflow, or global TL continuity file was edited.

An accidental local `next-env.d.ts` drift from environment typegen was restored and not committed.

## STOP

No cleanup implemented. PR remains Draft. Do not mark Ready. Do not merge. Do not start a follow-up slice from this agent/session.
