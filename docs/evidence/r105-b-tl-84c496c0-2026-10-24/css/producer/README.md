# B CSS provenance runner — prepared only

This runner is prepared for the later final B source. It has **not been executed**.
No CSS, build, browser run, test result, or Technical-Lead PASS is supplied here.

Run only after the Technical Lead has accepted C post-merge and independently
bound the later final B head and original author STOP:

```text
python /tmp/jetnity-r105-b-css-prep/run.py REPO FULL_HEAD FULL_TREE NEW_OUTPUT_DIRECTORY
```

All four arguments are mandatory. REPO must be the absolute exact working-tree
root. Both hashes must be full lowercase SHA-1 values. The output directory must
not exist, must have an existing parent below `/tmp`, and must be outside every
review checkout. The runner refuses overwrites and symlink output paths.

## What a later invocation does

1. Verifies exact HEAD, tree and clean working-tree status. Requires existing
   repository `node_modules`; it performs no install or dependency change.
2. Binds raw working-file bytes to their committed Git blobs and records SHA-256
   for globals CSS, PostCSS/Tailwind/Next configuration, package and lockfile,
   tsconfig, both booking components, the booking/query/data helpers, and the
   original author montage. Rejects ignored files in Tailwind content roots.
3. Starts the adjacent Node helper with **cwd exactly REPO**. Its explicit child
   environment does not inherit credentials, NODE_OPTIONS, NODE_PATH or dotenv
   values. It runs no npm lifecycle or Next command. No global environment or
   repository configuration is edited.
4. Loads the **actual unchanged `postcss.config.js`** through module resolution
   anchored to REPO/package.json, retaining its plugin order and options:
   `tailwindcss/nesting → tailwindcss → autoprefixer`. A changed config shape or
   pipeline fails closed for a narrow preparation review. The source Tailwind
   config is discovered normally from the exact repository cwd, so its relative
   content globs keep their intended meaning.
5. Checks five installed compiler/plugin package versions against the exact
   source lockfile. Records Node version, resolved modules and package/entry
   hashes, command, cwd, source hashes, CSS digest, warnings and child exit.
6. Verifies HEAD/tree/clean/source bytes again. Any error or source change makes
   the sidecar FAILED and the wrapper exits 1. It never resets a checkout or
   retries through a different permission/runtime path.

Successful output consists of two new files:

- `jetnity-b-postcss-<head12>.css`
- `css-provenance-<head12>.json`

An unsuccessful invocation can leave diagnostic output in its newly created
directory. It must not be used as accepted CSS. Permission/subprocess failures
are reported; there is no escalation or alternate execution path in the runner.

## Precise evidence class

This is **locally compiled project PostCSS/Tailwind CSS for a separate synthetic
layout check**. `NODE_ENV=production` selects a declared compiler environment;
it does not turn this into a Next build. No `.next` directory is created,
imitated, searched or consumed. Next bundling/optimization equivalence is not
claimed. Complete native Next build/App/Auth/Vercel gates remain separate.

The CSS helper imports neither application runtime nor a network client. It
loads only the pinned CSS compiler/plugin pipeline and scans project source
through the existing Tailwind configuration. No browser, layout assertion,
hosted service, database, credentials, or personal session is used.

The later Root layout runner must bind its input CSS to this successful sidecar,
keep the author montage provenance separate from independent test evidence,
and use fresh output/screenshot paths. That layout runner is not part of this
preparation. Re-read the later final B sources and narrowly adapt this runner if
required; do not silently substitute another pipeline or weaken its bindings.
