# Jetnity Dependency Advisory Triage 1 — PLAN

Date: 2026-10-25. Lane **S** of R107. Tracking [#1016](https://github.com/Jetnity/jetnity/issues/1016). Parent [#1011](https://github.com/Jetnity/jetnity/issues/1011). Draft PR [#1021](https://github.com/Jetnity/jetnity/pull/1021).

**This document is the plan. It is not the audit.** No advisory was retrieved, no registry audit command was run, and no package, lockfile, config, workflow or runtime file was changed to produce it. Every advisory row stays **untriaged** until the same session is authorized to execute the design below.

## 1. Identity, model and stop

| Fact | Value |
| --- | --- |
| Logical agent | Jetnity Dependency Advisory Triage 1 — Cursor Generation 1 |
| Generation | Fresh Generation 1. No R106 session was reused. |
| Requested runtime | Grok 4.7 High Fast / `grok-4.7-high-fast` |
| Actual `originalModelName` | `grok-4.7-high-fast` |
| Session | [bc-ace2870d-6fe3-4d6f-9213-676752ad3b9b](https://cursor.com/agents/bc-ace2870d-6fe3-4d6f-9213-676752ad3b9b) |
| Run title | The run-title API accepted `Jetnity Dependency Advisory Triage 1 — Cursor Generation 1`. No separate screenshot of the agents list was taken. |

Authoritative model evidence is the cloud-run field `originalModelName`. This session did not select Auto and did not substitute another model.

This revision answers Technical-Lead plan review R1 on head `b0d44c3e7f7483027bb13cb97d54c37b4e049843` / PLAN blob `c05bea9947ac9eb35365ac8bbfa875fc5856bca0`. It is the same session and the same logical agent. It changes only this PLAN.

**STOP** after this revised plan is committed on `audit/r107-dependency-advisory-triage-1`. The immutable TASK stays byte-identical. No status, report, self-review, handoff, evidence directory, inventory script, test, audit command or second document is part of this delivery. Root re-reviews this exact plan head before any of that work.

## 2. Authority actually read

Operating mode is `NORMAL` in `.jetnity/operating-mode.json` (updated 2026-09-21). Special Product-Owner gates remain in force. This lane is the Owner-authorized read-only advisory triage from the R107 intake [comment 6399573707](https://github.com/Jetnity/jetnity/issues/751#issuecomment-6399573707) and the live batch [#1011](https://github.com/Jetnity/jetnity/issues/1011).

Also read for this plan: `AGENTS.md`; `JETNITY_START_HERE.md`; `docs/JETNITY_TECHNICAL_LEAD_CURSOR_AGENT_OPERATING_STANDARD.md`; `docs/ACTIVE_WORK_STATUS.md`; `docs/JETNITY_R106_FINITE_BATCH_CLOSURE_HANDOFF_2026-10-25.md`; `docs/JETNITY_MULTI_AGENT_SLICE_PLANNING_STANDARD.md`; `docs/JETNITY_V1_BINDING_BUILD_ORDER_2026-09-01.md`; `docs/JETNITY_THREE_PHASE_PRODUCT_STRATEGY_2026-09-01.md` via the startup pointer and ADR-0204 phase order already binding in the build-order file; the TASK; `package.json`; `package-lock.json`; `.github/workflows/ci.yml`; `next.config.js`; `postcss.config.js`; `tailwind.config.js`; `vercel.json`; `scripts/pakete.mjs`; the historical Sharp/Next audit script `scripts/next-16-4-1-security-patch-p1/audit.mjs` (cited only as a script this lane will not run); the public log lines of Actions run [40202059080](https://github.com/Jetnity/jetnity/actions/runs/40202059080); and, for R1, [npm audit v10](https://docs.npmjs.com/cli/v10/commands/npm-audit/), [npmrc v10](https://docs.npmjs.com/cli/v10/configuring-npm/npmrc/), [npm config v10](https://docs.npmjs.com/cli/v10/using-npm/config/), and [package-lock.json v10](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json/).

R106 is closed. O, A and T stay stopped. This plan does not reopen them. Dated blocks inside `JETNITY_START_HERE.md` and `docs/ACTIVE_WORK_STATUS.md` that still say "current" are historical snapshots. Live evidence used here is the fetched `origin/main` and the files above.

V1 binding build order §§1–13 and the three-phase order are unchanged. This lane adds no product surface, provider, account, trip or admin behavior. The intake's separate traveller-serialization P1 belongs to lane T. Traveller-context collection is not relevant here and is not added.

## 3. Live baseline at plan time

Fetched `origin/main` during this session.

| Ref | SHA |
| --- | --- |
| `origin/main` | `a74c443c6be3f064f150fcf021ab6154bda325e5` |
| Main tree at that SHA | `c1fe5a50b0da710ef425674057f782b1dff6f8bc` |
| Plan parent / TASK seed | `7e5395855ca7d6215756e79f4f389d13b03e865c` |
| Seed tree | `2c012cc208ebde23058131609178c1fe87c9d2ea` |
| Merge-base | `a74c443c6be3f064f150fcf021ab6154bda325e5` |
| Ahead / behind before the first plan commit | **1 ahead / 0 behind** |
| Reviewed plan head | `b0d44c3e7f7483027bb13cb97d54c37b4e049843` |
| Ahead / behind at this R1 edit, after re-fetch | **2 ahead / 0 behind** |

The seed's sole parent is `a74c443c6be3f064f150fcf021ab6154bda325e5`. The seed commit adds only the TASK. TASK blob `4a4b686fbcc429a4041012f3d967b3f5d1767bc0` matches the dispatch pin. `origin/main` was still `a74c443c6be3f064f150fcf021ab6154bda325e5` when this R1 edit was written. If `origin/main` moves before audit execution, this session reports the new ahead/behind and waits. It does not rebase or merge.

The R1 commit advances this branch by one docs commit. The user-facing delivery comment carries that new head and this file's blob. This file cannot name its own new commit SHA.

## 4. Pinned inputs

Confirmed at seed `7e5395855ca7d6215756e79f4f389d13b03e865c`:

| File | Git blob | SHA-256 |
| --- | --- | --- |
| `package.json` | `e6187432cb8f224c10281b7b476bb24eb8ef1c1b` | `d564cf2944c55fad83a9797311d6abefb446ccd107023d1f007aac2c6ef5d90c` |
| `package-lock.json` | `4c64e03d16a54ae6c648dc3e40c88d6b94c5cfbe` | `5f0575fdeb1750fc2316a25d01d0fc6383dd52bfea7457124f42453446d807de` |

Lockfile format: npm lockfileVersion **3**, top-level keys `name`, `version`, `lockfileVersion`, `requires`, `packages`. There is no top-level `dependencies` map and no lockfile `overrides` entry. `requires` is true.

Local tooling available for the later read-only pass: Node `v22.23.4`, npm `10.9.7`. `engines.node` is `22.x`. CI uses `actions/setup-node` with `node-version: 22.x`. No tracked `.npmrc` exists. The later metadata commands use the child boundary in §6.2. They do not print npm config, the environment, or any npmrc, and they do not acquire credentials.

## 5. Source-confirmed graph facts

These facts were read from the lockfile and CI log. They are not advisory classifications.

- **611** non-root `packages` entries, **562** unique names.
- **24** names resolve to more than one version. The matrix key is lockfile path + name + version. The duplicate names are `@emnapi/runtime`, `@eslint-community/eslint-utils`, `ansi-regex`, `ansi-styles`, `balanced-match`, `brace-expansion`, `debug`, `emoji-regex`, `eslint-visitor-keys`, `fast-glob`, `fsevents`, `glob-parent`, `globals`, `ignore`, `json5`, `lru-cache`, `minimatch`, `picomatch`, `react-is`, `resolve`, `semver`, `string-width`, `strip-ansi`, `wrap-ansi`.
- Flag counts on those 611 entries: `dev: true` **455**, `optional: true` **94**, `peer: true` **1** (`react-is@19.1.1`), `hasInstallScript` **4** (`esbuild@0.25.9`, `fsevents@2.3.3`, nested `fsevents@2.3.2`, `unrs-resolver@1.12.2`), `os` **81**, `cpu` **80**, `link` **0**, `extraneous` **0**.
- Direct production ranges and the single top-level locked version:

| package.json dependency | Requested | Locked `node_modules/<name>` |
| --- | --- | --- |
| `@radix-ui/react-dropdown-menu` | `^2.1.16` | `2.1.16` |
| `@radix-ui/react-slot` | `^1.2.3` | `1.2.3` |
| `@supabase/ssr` | `^0.6.1` | `0.6.1` |
| `@supabase/supabase-js` | `^2.50.2` | `2.57.2` |
| `class-variance-authority` | `^0.7.1` | `0.7.1` |
| `clsx` | `^2.1.1` | `2.1.1` |
| `lucide-react` | `^0.525.0` | `0.525.0` |
| `next` | `16.4.1` exact | `16.4.1` |
| `react` | `19.2.8` exact | `19.2.8` |
| `react-dom` | `19.2.8` exact | `19.2.8` |
| `recharts` | `^3.1.2` | `3.1.2` |
| `sonner` | `^2.0.5` | `2.0.7` |
| `tailwind-merge` | `^3.3.1` | `3.3.1` |
| `zod` | `^3.25.76` | `3.25.76` |

- Direct devDependency ranges whose top-level lock entry is `dev: true`: `autoprefixer@10.4.21`, `eslint@9.39.5`, `eslint-config-next@16.4.1`, `playwright@1.55.0`, `tailwind-scrollbar-hide@4.0.0`, `tailwindcss@3.4.17`, `tailwindcss-animate@1.0.7`, `tsx@4.20.5`, `typescript@5.9.3`.
- Direct devDependencies whose top-level lock entry has **no** `dev: true` flag, with the lockfile parent that explains it:
  - `postcss@8.5.23` is also an exact dependency of `next@16.4.1`. The same instance is a build tool (`postcss.config.js` loads `tailwindcss/nesting`, `tailwindcss`, `autoprefixer`) and a Next dependency.
  - `@types/react@19.2.18` and `@types/react-dom@19.2.5` are type dependencies of production `@radix-ui/*` packages.
  - `@types/node@22.20.1` is a dependency of `@types/ws`, which is a dependency of `@supabase/realtime-js@2.15.5`.
- Production lock edge, already present, still untriaged: `@supabase/supabase-js@2.57.2` depends on `@supabase/realtime-js@2.15.5`, which depends on `ws@^8.18.2`, resolved as `node_modules/ws@8.18.3` (`dev` false, `optional` false). Application source imports `@supabase/supabase-js` and `@supabase/ssr` from `lib/supabase/server.ts`, `lib/supabase/client.ts`, `proxy.ts`, and other account/auth/readiness modules. No literal `ws` or `@supabase/realtime-js` import was required to establish this lock edge. The later walker still has to classify whether realtime code is reachable. The edge alone is not an exploit finding.
- `next@16.4.1` optional dependencies include the platform `@next/swc-*` packages and `sharp@^0.35.5`, resolved as optional `node_modules/sharp@0.35.5`. `next.config.js` asks for image formats `image/avif` and `image/webp`. Script files `scripts/official-jetnity-favicon-1-render.mjs` and the historical `#950` audit script import `sharp`. There is no root `middleware.ts` or `instrumentation.ts`. `proxy.ts` is an application-server Supabase entry.
- `package.json` `overrides.simple-swizzle` is `0.2.2`. The lockfile contains **zero** `simple-swizzle` and **zero** `overrides` strings. The override is inert in this pinned graph. The remediation packet will leave it unchanged and will not treat it as an active pin.
- `vercel.json` is `{ "version": 2 }` only. It does not record an install command, an omit-dev flag, or a runtime package list.
- Plan-time source sample for the later walker, not a finished reachability pass: 131 files under the searched tree contain `use client`, and 24 contain `use server`. The authorized scan will recount from `app`, `components`, `lib`, `hooks`, `scripts`, `proxy.ts` and the three config files, excluding `node_modules`, `.next` and `docs/evidence`.

### Three different graphs

| Graph | What was actually observed | What it does not prove |
| --- | --- | --- |
| Locked / resolved | 611 lockfile entries at blob `4c64e03d` | Which optional or platform packages an installer selects |
| GitHub Actions install on `a74c443c` | Run 40202059080, both the Typecheck job and the Auth job, at `2026-10-25T14:24:43Z`: `added 532 packages, and audited 533 packages` and `11 vulnerabilities (2 moderate, 9 high)`, followed by the stock `npm audit fix` hint. CI's only install command is `npm ci`. There is no audit step and the log does not name the 11 findings. | The advisory IDs, the omitted package names, or the Vercel deployment closure |
| Workspace install | Installed consistency is **UNVERIFIED**. npm's hidden lockfile `node_modules/.package-lock.json` has a different role and content from the repository lockfile ([hidden lockfiles](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json/#hidden-lockfiles)). A different hash is not evidence of an inconsistent install. This plan does not investigate the installed tree. | A deployed runtime. The audited graph remains the pinned repository lockfile only. |

Deployed Vercel/Production package selection is **UNKNOWN**. This lane will not probe Production, Preview, or the deployment bundle.

The count gap **611 locked entries versus 533 audited installed packages** is expected to include optional platform packages, and it is only an aggregate. The audit will explain any current-count delta from **11** in three separate columns: registry change since `2026-10-25T14:24:43Z`, full lockfile versus the installed subset, and npm's habit of folding several GHSA rows into one package count. A different count is not automatically a new vulnerability, and an unchanged count is not a clearance.

## 6. Audit design, after this plan is accepted

### 6.1 Inventory

`scripts/dependency-advisory-triage-1/inventory.mjs` will be a plain Node script. It reads `package.json` and `package-lock.json` and writes a sanitized inventory JSON. It does not import npm, does not spawn an installer, and does not read `node_modules`.

For every non-root entry it records: lock path, name, version, requested ranges from each parent, `dev`/`optional`/`peer` booleans, `os`, `cpu`, `libc` when present, `hasInstallScript`, integrity, and every parent chain to the root through `dependencies`, `optionalDependencies` and `peerDependencies`. Peer edges stay labeled peer and do not count as an installed path. A missing `dev: true` means "not exclusively a dev edge". The script recomputes exclusivity by walking edges from the root `devDependencies` versus `dependencies`.

`scripts/pakete.mjs` (`npm run check:deps`) stays frozen. It is the direct-dependency usage guard, including its `OHNE_IMPORT` set (`next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `eslint`, `eslint-config-next`, the two Tailwind plugins) and the intentional `zod` exception. A missing application import in that guard is not an advisory result. The new walker may reuse the same literal import/require patterns. It will not modify the guard.

### 6.2 Current advisory retrieval

`npm audit` without `fix` or `signatures`, with `--package-lock-only`, is a public registry report of the lockfile graph. npm v10 submits that description to the configured registry's bulk advisory endpoint and does not install. `--omit` still changes which dependency types are submitted. npm's default for `omit` is `dev` when `NODE_ENV=production`, and otherwise empty. A package type named in both `include` and `omit` is included. Command-line flags outrank `npm_config_*` environment variables, which outrank project, user, global, and builtin npmrc files. An empty `npm_config_*` value is treated as true, so the child must not set an empty omit or include variable.

The audited graph is still the pinned repository files. The commands run in a disposable directory so they do not load a project `.npmrc` or the repository worktree. `HOME` and `CODEX_HOME` are not pointed at that directory.

Disposable layout, created only under `/tmp` and rejected if its path is inside `HOME` or `CODEX_HOME`:

```text
/tmp/jetnity-r107-s-meta.<random>/
  project/package.json          # byte copy of the pinned file
  project/package-lock.json     # byte copy of the pinned file
  empty-user.npmrc              # zero bytes, mode 0600
  empty-global.npmrc            # zero bytes, mode 0600
  cache/                        # empty directory
  tmp/                          # empty directory
  snapshots/                    # pre-command worktree bytes, outside the repo
```

Before the copy, SHA-256 of the repository `package.json` and `package-lock.json` must match §4. After the copy, SHA-256 of the two copies must match §4. The project directory must contain only those two names. There is no `.npmrc` beside them. If either check fails, stop with `INPUT_DRIFT` and do not invoke npm.

The child is started with `env -i`. The allowlist is only: `PATH`; the existing `HOME` value unchanged; `USER` and `LOGNAME` when already present; `LANG` and `LC_ALL=C.UTF-8`; `TMPDIR` set to the disposable `tmp` directory; `NODE_ENV=development`. The child does not receive `CODEX_HOME`, `npm_config_*`, `NPM_CONFIG_*`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `NODE_OPTIONS`, `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `http_proxy`, `https_proxy`, `all_proxy`, or `NO_PROXY`. The parent environment is not printed. `npm config` is not run. If npm cannot run under this allowlist, record `CONFIG_BOUNDARY_UNMET` and do not retry with the ambient environment.

Both audit invocations use the same cwd (`project`), the same child environment, and these explicit flags: `--json`, `--package-lock-only`, `--ignore-scripts`, `--offline=false`, `--registry=https://registry.npmjs.org`, `--userconfig=<disposable>/empty-user.npmrc`, `--globalconfig=<disposable>/empty-global.npmrc`, `--cache=<disposable>/cache`, `--audit-level=info`. They do not pass `fix`, `signatures`, `--force`, `--global`, or `--prefix`.

Explicit dependency sets, which are the evidence of what was submitted:

| Set | Additional flags | Types submitted |
| --- | --- | --- |
| Full lock graph | `--include=prod --include=dev --include=optional --include=peer` and no `--omit` | prod, dev, optional, and peer |
| Omit-dev lock graph | `--omit=dev --include=prod --include=optional --include=peer` and no `--include=dev` | prod, optional, and peer |

`NODE_ENV=development` makes npm's documented omit default empty. The include flags are still required, because an inherited production omit must not define the full set. Include wins over omit, so the omit-dev command must not also include `dev`.

`npm view <name>@<candidate> version dependencies peerDependencies --json` uses the same child environment, cwd, registry, userconfig, globalconfig, cache, `--ignore-scripts`, and `--offline=false`. It does not take include or omit flags, because it reads one public packument rather than a dependency set. It is not an install. It is used only after a primary advisory names a candidate version.

npm's builtin npmrc, at the npm installation's own `npmrc`, has no documented replacement flag and remains loaded. This pass does not read or print it. Retained audit JSON is accepted only when it does not name a registry host other than `registry.npmjs.org`. Any other host, or a response that cannot be checked, is `CONFIG_BOUNDARY_UNMET`: discard the body, do not quote it, and stop that npm source. Ambient HTTP proxies are not forwarded; a resulting network failure is `REGISTRY_UNAVAILABLE`, not a reason to restore the proxy. The POSIX default cache is `~/.npm`. `--cache` points at the empty disposable cache instead. The disposable directory, including that cache, is deleted after the receipts are copied. It is not committed.

Exit 0 or 1 with parseable JSON is `REGISTRY_AUDIT_OK`. With `--audit-level=info`, exit 1 means the JSON reports at least one vulnerability. Any other exit, non-JSON stdout, or a missing network is `REGISTRY_UNAVAILABLE` for that command. A write inside the repository worktree is `UNSAFE_TOOL` and follows §10.4. Do not fall through to `npm ci`, `npx`, or a second installer.

Primary per-advisory record, unauthenticated. `curl` uses the same `env -i` allowlist, `curl -q` so it does not read a curlrc, no `--netrc`, and no `Authorization` header:

- `GET https://api.github.com/advisories/{GHSA}` with `Accept: application/vnd.github+json` and a descriptive User-Agent.
- The canonical advisory URL `https://github.com/advisories/{GHSA}`.
- A maintainer/vendor page only when that GHSA or the package's public GitHub security listing cites it.
- NVD only when the GHSA cites a CVE and the GHSA payload lacks the affected/fixed range.

OSV `https://api.osv.dev/v1/querybatch` is an aggregator cross-check. It is stored separately and labeled aggregator. When OSV and the GHSA disagree, the row keeps both statements and the exposure stays unresolved. OSV does not mint a fixed version.

Each retained primary record stores the advisory id, affected range, fixed range or the explicit absence of a fix, published/updated timestamps from the payload, retrieval timestamp, and the canonical URL. Missing fields stay missing. No advisory id is invented. Historical evidence files such as `docs/evidence/next-16-4-1-security-patch-p1/residual-audit.json` are prior lockfiles' snapshots. They are not inputs to the current matrix.

The `npm view` invocation specified above is the only registry metadata read used to confirm a candidate and its `peerDependencies`.

### 6.3 Version decision

The npm audit JSON is the first statement of which locked instances the registry currently calls vulnerable. A small local comparator may corroborate simple ranges (`<`, `<=`, `>`, `>=`, hyphen ranges, and a single `||`). Any range outside that subset, or any disagreement with the registry statement, is `RANGE_UNPARSEABLE` or `RANGE_DISAGREEMENT`. Those instances stay in the matrix as unresolved. They are not classified unaffected.

### 6.4 Exposure classes

One instance may receive more than one class. Official CVSS/severity stays in its own column. Jetnity priority is a separate column.

| Class | Evidence required |
| --- | --- |
| `application-server` | A parent chain reaches a production dependency, and a literal import chain reaches a module that is a server entry (`proxy.ts`, route handlers, `use server`, or a shared module imported by those files without a client boundary). Next's own production dependencies are in the Next server/build closure even when application source never names them. |
| `client-bundle` | A literal import chain reaches a file whose first directive is `use client`, or a shared module imported by such a file. `experimental.optimizePackageImports` for `lucide-react` is recorded as a client bundling constraint for that package. |
| `build-ci` | The package is loaded by `postcss.config.js`, `tailwind.config.js`, `next.config.js`, ESLint, TypeScript, `package.json` scripts, or `.github/workflows/ci.yml`, or it is a Next build dependency (`postcss`, optional `sharp`, optional `@next/swc-*`). |
| `development-only` | Every lockfile path from the root stays inside root `devDependencies`, and the build/CI class does not apply. `dev: true` supports this class and is not sufficient by itself. |
| `type-declaration-only` | The name is `@types/*`, or the only parents are `@types/*`, and no runtime import exists. TypeScript erasure is the working assumption. It is still not a vulnerability clearance if an advisory exists. |
| `optional-platform` | `optional: true` and any `os`/`cpu`/`libc` constraint. Record whether the constraint text allows `linux` and `x64`. That record is lockfile evidence. It does not prove which packages the ubuntu installer selected, and it does not by itself set priority. |
| `NOT_ASSESSED` | Non-literal dynamic import, code only on a held or sibling branch, or deployed output. Workspace `node_modules` is not an input; installed consistency stays **UNVERIFIED**. |

Absence of an application import is not absence of the package. Framework, optional and script edges stay in the matrix.

Held lanes are not opened: #985/#982, #917, #913/#911, #937/#936, Bern #934, and the other recorded holds. Reachability that would require those trees is `NOT_ASSESSED`, with the issue number as the reason. Sibling branches T, D, W and M are not read and are not merged. Their later runtime merges can change reachability and are an integration recheck, not an input to this matrix.

### 6.5 Priority, kept separate from severity

Official severity stays in its own column. Jetnity priority is a scheduling judgment. It uses four inputs that the report states on every assessed row: the advisory's described impact, the exposure classes actually evidenced, confidence in that classification, and the uncertainties that remain. This lane does not demonstrate an exploit. Every P0 is therefore **provisional**: it asks for urgent Technical-Lead attention and states that exploitability was not shown.

Impact, taken only from the primary advisory text:

- `concrete`: the advisory names a confidentiality, integrity, or availability effect and the condition required for that effect.
- `partial`: it names an effect, and this pass did not find that condition in the traced code.
- `absent`: the retrieved primary payload does not describe an effect. Severity is not used as a substitute description.

Exposure bucket, after §6.4. A row can match more than one class; the highest priority applies. `U` is a floor and never a reason to go lower.

| Bucket | When it applies |
| --- | --- |
| A | `application-server` and/or `client-bundle` |
| B | `build-ci`, and not A |
| C | `development-only`, and not A or B |
| D | `type-declaration-only`, with positive evidence that the package does not execute, and not A, B, or C |
| U | any `NOT_ASSESSED` chain, held-lane boundary, dynamic import, unknown deployment selection, or optional/platform package whose build, development, or deployment context is still unknown |

| Official severity | A | B | C | D | U |
| --- | --- | --- | --- | --- | --- |
| critical | provisional P0 when impact is `concrete` and the advisory's required condition is present in traced shipped code; otherwise provisional P1 | provisional P1 | provisional P1 | P2 | provisional P0 when impact is `concrete`; otherwise provisional P1 |
| high | provisional P0 under that same concrete-condition test; otherwise provisional P1 | provisional P1 | provisional P2 | P2 | provisional P1 |
| moderate | provisional P1 | provisional P2 | provisional P2 | P3 | provisional P1 |
| low | P2 | P3 | P3 | P3 | P2 |
| info | P2 | P3 | P3 | P3 | P2 |
| missing | provisional P1, severity cell left unknown | provisional P2, severity unknown | provisional P2, severity unknown | provisional P2, severity unknown | provisional P1, severity unknown |

The concrete-condition test is stricter than severity plus a production lock path plus one nearby precondition. The condition named by the advisory has to be present in the traced shipped code. A lock edge, a single import of a parent package, or an advisory sentence alone does not meet it. Those rows stay on the provisional P1 side of column A.

An `os`/`cpu` constraint that excludes `linux` `x64` is recorded on the row and does not select column D or a P3 cell. While deployment is unknown, or a build or development context can still load the package, bucket U remains and the U column is the floor. P3 from a platform constraint is available only when deployment os/cpu is positively evidenced and excluded, build and development use are positively ruled out, and U is absent. This pass expects deployment to stay unknown, so that P3 gate is not expected to open.

Confidence is `high` only when every parent chain was classified with the evidence in §6.4. Otherwise it is `limited`, and any unclassified chain keeps bucket U. Held reachability and unknown reachability use column U. They are not moved to D, C, or P3.

A row that was not assessed stays `untriaged`. A failed registry call, a missing primary field, or a range disagreement does not move the row into the table.

No row is called safe, no-vulnerability, or accepted. During the audit delivery, provisional P0 and provisional P1 are posted on PR #1021 with the advisory URL, locked version, the table cell used, the remaining unknown, and an explicit statement that exploitability was not demonstrated. This lane does not patch them.

This plan flags **no** package finding. No current advisory payload was retrieved. The historical aggregate of 11 remains untriaged.

### 6.6 Minimal remediation packet

For each assessed affected path the report will propose one smallest next change, or an explicit `NO_FIX_IN_PRIMARY`:

1. Name the nearest parent Jetnity directly declares (`package.json` dependencies or devDependencies). `next` and `eslint-config-next` move only as a pair when a Next advisory or a shared transitive requires a Next bump. `react` and `react-dom` are exact-pinned together. `@types/react` / `@types/react-dom` follow a React major, and they are not bumped alone for a runtime advisory.
2. Candidate fixed version comes from the primary advisory's fixed range. Confirm the candidate exists with the unauthenticated `npm view` metadata read. Record Next's `peerDependencies.react` before recommending a Next version. If that peer range excludes `react@19.2.8`, the proposal stops as a joint React decision and does not silently include a React bump.
3. Prefer a direct parent release that brings the fixed transitive. Propose one `package.json` override only when no such parent release exists, the primary advisory names a fixed version, and the override is inside that version's major. State that this lockfile currently ignores the inert `simple-swizzle` override, so a future override is effective only after a later, separately authorized lockfile update. This lane will not run that update.
4. List the exact files a later slice would touch. Expected files are `package.json` and `package-lock.json`, plus consumers only when an API change is visible in the parent changelog cited by the advisory. No mass latest, no framework replacement, no `npm audit fix`, no `--force`.
5. Group atomic fixes. Unrelated advisories stay in separate proposed slices. Expected verification for a future fix slice, not for this audit: typecheck, lint, the five hygiene guards, production build, `npm test`, and a fresh registry audit of the new lock. Node remains 22.x.
6. Residual risk and the evidence that would still be UNKNOWN after that fix, including deployed selection until a later install log names packages.

## 7. File ownership

### This plan commit

- Add only `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_PLAN_2026-10-25.md`.
- Leave `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_TASK_V1_2026-10-25.md` byte-identical.

### After exact-head plan acceptance, same session

| Path | Role |
| --- | --- |
| `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_STATUS_2026-10-25.md` | Lane status, head binding, drift |
| `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_REPORT_2026-10-25.md` | Matrix, reconciliation, remediation packet |
| `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_SELF_REVIEW_2026-10-25.md` | Author self-review. Not a Technical-Lead PASS |
| `docs/JETNITY_DEPENDENCY_ADVISORY_TRIAGE_1_HANDOFF_2026-10-25.md` | Stop / handoff |
| `scripts/dependency-advisory-triage-1/inventory.mjs` | Lockfile inventory |
| `scripts/dependency-advisory-triage-1/validate-evidence.mjs` | Evidence consistency checks |
| `docs/evidence/dependency-advisory-triage-1/**` | Sanitized raw public metadata and command receipts |

No other path is in scope. In particular this lane does not edit `docs/ACTIVE_WORK_STATUS.md`, `JETNITY_START_HERE.md`, `ROADMAP.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `.jetnity/operating-mode.json`, `package.json`, `package-lock.json`, `next.config.js`, `vercel.json`, or `.github/workflows/ci.yml`.

Pre-existing worktree fact, observed before the first plan commit and left unstaged: `next-env.d.ts` differs by the generated import paths `./.next/types/...` versus `./.next/dev/types/...`. This lane does not stage or regenerate that file. Recovery of a command-caused change uses the byte snapshot in §10.4. A blanket `git restore` is not used, including on this already-dirty file.

## 8. Frozen contracts and reuse

| Contract | Use |
| --- | --- |
| TASK V1 blob `4a4b686f` | Scope. Not edited. |
| Lockfile v3 `packages` graph | Sole audited package graph |
| `scripts/pakete.mjs` | Frozen direct-dep hygiene. Not an advisory oracle |
| `scripts/next-16-4-1-security-patch-p1/audit.mjs` | Historical `#950` control. It loads `sharp` and reads the hidden lockfile. This lane will not run it. Installed consistency stays **UNVERIFIED**; that script is not how this lane would verify it. |
| CI `npm ci` on Node 22.x | Existing installation gate. The published summary lines are the historical 11-count baseline. |
| `next@16.4.1`, `eslint-config-next@16.4.1`, `react@19.2.8`, `react-dom@19.2.8` | Coupled exact pins. A proposal that splits them must say why. |
| Integration order T → S → D → W → M | Report-only. No sibling merge or cherry-pick. |
| Holds #985/#982, #917, #913/#911, #968, #748, #626, #937/#936, Bern #934, #944, #585, #960, #957 | Unchanged. No alternate route. |
| Ruleset 21875372 | Not modified. |
| USD 100 / month infrastructure boundary | Unchanged. This audit adds no service. |

Multi-agent suitability remains the TASK's `MULTI_AGENT` decision. This lane's ownership is disjoint from T, W, M and D. Shared product contracts are read-only.

## 9. State and failure matrix

| State | Meaning | Next action |
| --- | --- | --- |
| `INPUT_BOUND` | Blobs and SHA-256 match §4 | Inventory |
| `INPUT_DRIFT` | Either pinned file changed | Stop. Do not assess a different graph. |
| `MAIN_DRIFT` | `origin/main` is no longer `a74c443c` | Report ahead/behind. Do not rebase. |
| `GRAPH_PARSED` | 611 entries and parent chains emitted | Advisory retrieval |
| `GRAPH_PARSE_FAILED` | Lockfile JSON or required fields unreadable | Stop. No partial safe list. |
| `REGISTRY_AUDIT_OK` | Exit 0 or 1 and parseable JSON | Primary GHSA fetch |
| `REGISTRY_UNAVAILABLE` | Network, HTTP failure, rate limit, non-JSON | Record the gap per source. Do not invent ids. Continue only for sources that returned primary payloads. |
| `CONFIG_BOUNDARY_UNMET` | The child allowlist cannot run npm, the disposable path is inside `HOME` or `CODEX_HOME`, or the response names a non-public registry | Stop that npm source. Do not fall back to ambient config or credentials. |
| `UNSAFE_TOOL` | A repository worktree path changed during the child command | Apply §10.4. Stop the registry pass. |
| `RESTORE_UNATTRIBUTED` | A changed path has no pre-command byte snapshot, or the snapshot cannot be written back identically | STOP and report. Do not restore any other path. |
| `ADVISORY_PRIMARY_OK` | GHSA payload has id, range, URL, timestamps | Version decision |
| `ADVISORY_PRIMARY_GAP` | Payload missing a required field | Row stays unresolved for that field |
| `RANGE_DECIDED` | Registry statement and local comparator agree | Exposure classification |
| `RANGE_DISAGREEMENT` / `RANGE_UNPARSEABLE` | Comparator cannot confirm | Keep the instance unresolved |
| `CONTEXT_CLASSIFIED` | At least one class in §6.4 has the evidence in that row | Priority |
| `NOT_ASSESSED` | Held tree, dynamic import, or deployed bundle | Keep bucket U in §6.5. Do not lower priority. |
| `REMEDIATION_PROPOSED` | Candidate version and parent named from primary evidence | Packet only. No edit. |
| `NO_FIX_IN_PRIMARY` | Primary advisory has no fixed release | Say so. Do not guess a version. |
| `P0_P1_FLAGGED` | Provisional P0 or provisional P1 posted on PR #1021 with the §6.5 cell, URL, and the non-exploit statement | Implementation remains unassigned |
| `EVIDENCE_VALID` | Validator exit 0 | Hand off for TL review |
| `EVIDENCE_INVALID` | Duplicate id, pinned-input hash disagreement, missing include/omit evidence, or an unsanitized secret-shaped string | Fix the evidence set in this session. Do not relabel it valid. |

Denied or failed commands are recorded. They are not replaced with an install, a token, a Production query, or a held-lane checkout.

## 10. Proof plan for the authorized audit

Before and after the registry commands, record:

- `git rev-parse HEAD`, `git rev-parse HEAD^{tree}`, `git merge-base HEAD origin/main`, `git rev-list --left-right --count origin/main...HEAD`
- SHA-256 and `git rev-parse HEAD:package.json HEAD:package-lock.json`
- `git status --porcelain=v1` and the §10.4 snapshot hashes
- `node --version`, `npm --version`, and the exact argv, including every `--include` and `--omit`
- exit code and a short stderr excerpt with home-directory paths and token-like strings removed

### 10.4 Pre-command bytes and restoration

Immediately before the child starts, and before any npm or curl process:

1. Record `git status --porcelain=v1`.
2. Copy the exact worktree bytes of every dirty tracked path, including the already-dirty `next-env.d.ts` when it is dirty, into `snapshots/` in the disposable directory. Record each snapshot's SHA-256.
3. For the watched clean paths `package.json`, `package-lock.json`, and `next-env.d.ts` when it is clean, record the HEAD blob bytes and their SHA-256 as that path's snapshot.
4. The watched set is the union of the dirty paths and those three paths. A path outside that set is not eligible for later restoration.

After the child exits, recompute the same worktree hashes.

- A path whose bytes still match its snapshot, including a still-dirty `next-env.d.ts`, is left untouched.
- A watched path whose bytes differ is restored by writing the snapshot bytes back over that one path. The write is checked by SHA-256. This is the whole restoration. It is not `git restore`, `git checkout`, `git reset`, or a directory-wide clean.
- A new untracked path in the repository, a change to a path that has no snapshot, or a snapshot that cannot be written back with the same SHA-256 is `RESTORE_UNATTRIBUTED`. Stop. Report the path and the before/after porcelain lines. Do not restore any other path and do not continue the registry pass.

The metadata commands use the disposable project as cwd so the repository is not their output directory. A repository change is still handled only by the rules above.

Evidence files under `docs/evidence/dependency-advisory-triage-1/`:

- `input-binding.json`
- `lockfile-inventory.json`
- `npm-audit-lockfile.json` and `npm-audit-lockfile-omit-dev.json`
- `advisories/{GHSA}.json` for each primary payload actually retrieved
- `osv-crosscheck.json`, labeled aggregator
- `ci-baseline-40202059080.txt` containing only the install summary lines cited in §5
- `commands.txt` and `validation.json`

`validate-evidence.mjs` fails unless all of the following hold:

- input SHA-256 and blobs match §4, or a later authorized head whose package blobs still match §4
- `package.json` and `package-lock.json` match their pre-command snapshots
- `commands.txt` shows the full set with all four `--include` values and no `--omit`, and the omit-dev set with `--omit=dev`, `--include=prod`, `--include=optional`, `--include=peer`, and no `--include=dev`
- every matrix row has an advisory id, lock path, version, primary https URL, retrieval time, official severity, impact, exposure bucket, Jetnity priority, confidence, and remaining uncertainty
- every id in the matrix exists in a retained primary payload
- `(advisory id, lock path)` is unique
- npm's aggregate count, the unique GHSA count, and the historical 11 are all present and reconciled in the three delta columns
- no file contains `node_modules` bulk or a credential-shaped string (`_authToken=`, `Bearer `, `ghp_`, `github_pat_`). Naming an excluded variable such as `npm_config_*` in `commands.txt` is allowed; a value for it is not.
- OSV-only rows are not labeled primary

The report's triage table columns are: advisory id, canonical URL, official severity, impact, locked name/version/path, direct or transitive, parent chain, dev/optional/peer/os/cpu, exposure classes, exposure bucket, Jetnity priority, provisional flag, confidence, remaining uncertainty, fixed version or `NO_FIX_IN_PRIMARY`, proposed atomic group, files a later slice would touch.

Local `npm test`, lint, typecheck, and `next build` stay unrun for this lane. Installed consistency is **UNVERIFIED**, and `next build` rewrites `next-env.d.ts`. Those commands are not evidence about the pinned lockfile. Native PR CI, which runs `npm ci` on a clean checkout, remains the installation-backed project gate for the docs branch. The local proof this lane owns is the validator plus `git diff --check`. A later local project-command failure is recorded as its own environment result and is not repaired with `npm ci`.

The two conditional browser skips, 181 existing lint warnings, guest cross-tab non-atomicity, and full-unmount limits stay existing limits. This audit does not adopt them as new passes.

## 11. Costs and evidence limits

- Cost: **USD 0**. Unauthenticated registry, GitHub Advisory, and OSV reads. No new package, host, secret, or provider.
- The audit is about lock blob `4c64e03d` at the assessed head. Any later lockfile change invalidates it.
- CI run 40202059080 proves an aggregate installed-tree summary on ubuntu-latest at that timestamp. It does not prove advisory identity or Production contents.
- Deployed runtime, optional sharp/SWC selection by name, and held-lane reachability stay UNKNOWN unless the authorized pass obtains a primary source that actually answers them. This plan does not expect the pass to obtain deployed bytes. Unknown deployment keeps exposure bucket U and does not lower priority. Workspace installed consistency stays **UNVERIFIED** and is not inferred from the hidden lockfile.
- The builtin npmrc remains on the config search path. The child boundary does not read or print it. A response that does not stay on `registry.npmjs.org` stops that npm source.
- No exploit, payload, or vulnerability demonstration is in scope.
- Author self-review is not acceptance. Cursor does not Ready, merge, close #1016, write `main`, or start a follow-up slice.

## 12. Allowlist exception

**None requested.**

The TASK already forbids audit-time installation and already points at the existing CI install as installation evidence. A disposable `npm ci` would name the packages inside the 532-package ubuntu subset, and it would still leave the Vercel closure unknown. That command is outside this lane. This plan completes the matrix by labeling install selection and deployment at the evidence quality the frozen boundary allows. It does not ask for the boundary to move.

## 13. Decision packet requested from the Technical Lead

R1 is incorporated in §§4–11: the sanitized child environment and the explicit full and omit-dev sets, the hidden-lockfile correction, the severity/context priority table, and snapshot restoration. Re-review this plan head. If it is accepted, authorize this same session to execute §§6–10 only, writing only the files in §7. If `origin/main` has moved, the authorization should say whether to continue on the drifted base or to wait. No Owner confirmation is required for that internal gate. No package upgrade is authorized by acceptance of this plan.
