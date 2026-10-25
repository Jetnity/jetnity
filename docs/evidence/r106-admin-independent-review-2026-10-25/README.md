# R106 Admin — independent Technical Lead review evidence

This archive preserves the independent review evidence for PR #1007, accepted head `2e67d1b994900da6db9e99140ab1cc772b68badb`, tree `9e12de5ec3532c46ad53893ea7b8bd1559aeddf9`. It supplements the existing author evidence under `docs/evidence/admin-operations-evidence-lifecycle-completion-1/`.

This archive stages the byte-preserved independent review records selected by the Technical Lead. TL PASS [6396807560](https://github.com/Jetnity/jetnity/pull/1007#issuecomment-6396807560) accepted exact2e; ordinary merge produced main41844878 with the same tree. Actual-main acceptance is documented separately in the finite-batch closure and its linked post-merge evidence. These local browser records do not themselves prove a Production deployment.

## Retained contents

The text core is **20 files / 517854 bytes (505.7 KiB)**, plus this README and `archive-manifest.json`. The manifest maps every source file to a archive-relative location and records exact size, SHA256, role, and proof head. Copy originals byte-for-byte; retain embedded historical absolute paths. The mapping resolves those paths after archival.

| Group | Contents and meaning |
| --- | --- |
| `probes/` | Six original scripts: pure and mounted counterexamples, eight-case acceptance, thirty-two-case GET/401 acceptance, and adapter v1/v2. |
| `results/` | Original pure and mounted defect results; R1 eight-case result and independent R1 gap review; direct final-head eight- and thirty-two-case results. |
| `adapter-v1-failure/` | Raw failure manifest, exact two-edit diff, and stderr. Browser launch failed before cases; the observed child later received SIGTERM after its HTTP listener stayed alive. Preserve this failure. |
| `adapter-v2-success/` | Raw final manifest, exact three-edit diff, stdout/stderr, and the independent 94-case author-matrix result. |

The twelve unique root-run screenshots are also retained byte-for-byte: **9,123,321 bytes (8.70 MiB)**. The manifest keeps their original `optional_visual_files` grouping for provenance, and its `visual_selection` records that all twelve were selected. Existing repository author screenshots cover the same named fixtures/viewports but have different bytes; they are distinct executions, not substitutes. The complete selected payload is20 core files +12 images, plus this README and manifest.

## Exact evidence chain

| Head/run | Observation | Interpretation |
| --- | --- | --- |
| `c7dd0ecd8bd48e7ba9009fc4aa3483a2ca40a2da` | Three pure-model counterexamples; three defects reproduced in six mounted cases across both boards. | Successful probe execution means a defect was demonstrated. It is not product acceptance. The pure probe uses a simplified hint helper; the mounted probe uses the real boards/hook/domain helpers. |
| `c12444d735c5d8e8c1c800c5b712ecf48105bdec` | Independent eight-case acceptance succeeded; the accompanying R1 review records remaining malformed-response/current-401 proof gaps and the TTL documentation correction. | Historical R1 evidence. Its CI/Preview snapshot is superseded and must not gate the final head. |
| Final `2e67d1b…`, eight-case probe | 8/8, exit 0; identical before/after source hashes; zero audited external-request attempts and page errors. | Covers GET/props authority and recovery, endpoint A→B→A, future card timestamps, and invalid initial monotonic anchor on both boards. |
| Final `2e67d1b…`, GET/401 probe | 32/32, exit 0; 64 explicit fixture GETs; source bound; zero audited external-request attempts and page errors. | Fourteen actual malformed HTTP-200 shapes and two authoritative HTTP-401 variants on each board. Each has independent pending, completed outcome, and usable recovery. |
| Final `2e67d1b…`, adapter v1 | Browser startup SIGTRAP; no case result; preserved adapter exit 1 and child SIGTERM. | Full Chromium executable selection failed before the matrix. This was not approval denial, nor evidence of a product test regression. |
| Final `2e67d1b…`, adapter v2 | 94/94, child and adapter exit 0; source binding verified; Chrome 140.0.7339.16. | Full existing author matrix executed with the three external setup/output changes described below. It is an independent execution, not a new set of 94 independent test designs. |

The full matrix adapter preserves the original deferred-fetch/loopback fixture and adds no network instrumentation. Do not transfer the eight-/thirty-two-case probes' audited zero-external-request claim to the adapter.

## Source binding and adapter changes

The committed runner is `scripts/admin-operations-evidence-lifecycle-completion-1/run.mjs`, Git blob `5fe62de0f6d7951fe666f88ce5a9f82e0026e457`, SHA256 `6e84c227d56f515ce94fbef108f98801abb61bb3f3b3f0290c101ab800e809f7`. The archive manifest includes the final before-run binding for all seventeen recorded source/config/dependency-manifest files. The raw adapter result retains both identical before/after bindings, the exact accepted tree, and clean status.

V1 removes the runner's explicit `args` line and redirects its evidence directory. It sets the optional executable path to `chromium.executablePath()`, which selected the full Chromium executable in the failed environment.

V2 preserves all fixtures, assertions, product sources, and the runner's working directory. It performs precisely three reviewed substitutions:

1. Remove the original explicit `args: ['--no-sandbox', '--disable-dev-shm-usage']` line.
2. Redirect `const nachweis` into a fresh external evidence directory.
3. Change `if (!browserPfad || !existsSync(browserPfad))` to `if (browserPfad && !existsSync(browserPfad))`, allowing an omitted executable path while still rejecting a supplied invalid path.

V2 omits `OPERATIONS_EVIDENCE_CHROMIUM`. Playwright therefore selects its normal installed headless browser. The script introduces no extra launch flags; Playwright itself supplies its normal default arguments. If `HOME` exists, it is inherited unchanged. The two exact adapter diffs and the canonical v1/v2 scripts are retained; the source copies inside each run are duplicates and omitted from the minimal core.

## Portable replay of the final checks

Use a clean checkout at the explicit full accepted SHA and Node 22 (the recorded runtime was 22.23.4). Provision dependencies from that checkout's `package-lock.json` and its compatible local Playwright browser before running the probes. The observed dependency versions are Playwright 1.55.0, esbuild 0.25.9, Tailwind 3.4.17, PostCSS 8.5.23, and Autoprefixer 10.4.21. Dependencies and browsers are deliberately not vendored in the archive.

Probe source snapshots use a `.txt` archive suffix so they cannot be discovered as repository test/runtime code. Copy only the three current replay scripts into a fresh external directory and remove that suffix before executing; preserve historical counterexamples/v1 as frozen records. The commands below are instructions, not additional recorded executions. Replace the example absolute paths with the actual locations. Run sequentially. The scripts require an exact clean HEAD, record source hashes, and emit fresh evidence under `/tmp/r106-review-evidence` without changing tracked repository files.

```bash
R106_NODE='/absolute/path/to/node22'
R106_REPO='/absolute/path/to/clean/2e67-checkout'
R106_ARCHIVE='/absolute/path/to/archived-review'
R106_REPLAY='/absolute/path/to/fresh/external-replay-directory'
R106_HEAD='2e67d1b994900da6db9e99140ab1cc772b68badb'
PLAYWRIGHT_BROWSERS_PATH='/absolute/path/to/provisioned/playwright-browsers'
export PLAYWRIGHT_BROWSERS_PATH
mkdir -p /tmp/r106-review-evidence
mkdir -p "$R106_REPLAY"
cp "$R106_ARCHIVE/probes/admin-mounted-acceptance.mjs.txt" "$R106_REPLAY/admin-mounted-acceptance.mjs"
cp "$R106_ARCHIVE/probes/admin-mounted-get401-acceptance.mjs.txt" "$R106_REPLAY/admin-mounted-get401-acceptance.mjs"
cp "$R106_ARCHIVE/probes/admin-author-matrix-adapter-v2.mjs.txt" "$R106_REPLAY/admin-author-matrix-adapter-v2.mjs"

"$R106_NODE" "$R106_REPLAY/admin-mounted-acceptance.mjs" --repo "$R106_REPO" --head "$R106_HEAD"
"$R106_NODE" "$R106_REPLAY/admin-mounted-get401-acceptance.mjs" --repo "$R106_REPO" --head "$R106_HEAD"
"$R106_NODE" "$R106_REPLAY/admin-author-matrix-adapter-v2.mjs" --repo "$R106_REPO" --head "$R106_HEAD"
```

Each mounted probe generates a new timestamped JSON. The adapter creates a new random run directory with its exact diff, logs, source bindings, and author output. Output directory names, time readings, and PNG bytes are not expected to match an old run byte-for-byte. Case outcomes and source binding must be reviewed explicitly. Do not substitute the later merged-main SHA while calling the result a rerun of this accepted-head evidence.

The original counterexample scripts are historical and not parameterized: they read `/tmp/jetnity-r106-o-review` at the original defective SHA and write fixed filenames under `/tmp/r106-review-evidence`. The pure script does not independently assert HEAD. Reproduce them only in a separate disposable environment with the original checkout/hash verified and an empty output directory; never run them over this archive or relabel their asserted failures as acceptance. Native Node 22 TypeScript stripping can execute the pure `.ts` source; the mounted `.mjs` script requires the same installed frontend dependencies/browser. V1 is kept for failure provenance; use v2 for the normal full-matrix replay.

To verify a copied text core before committing it:

```bash
python - "$R106_ARCHIVE" <<'PYVERIFY'
from pathlib import Path
import hashlib, json, sys
root = Path(sys.argv[1])
manifest = json.loads((root / 'archive-manifest.json').read_text())
for item in manifest['core_files'] + manifest['optional_visual_files']:
    path = root / item['archive_relative_path']
    data = path.read_bytes()
    assert len(data) == item['bytes'], str(path)
    assert hashlib.sha256(data).hexdigest() == item['sha256'], str(path)
print(f"Verified {len(manifest['core_files']) + len(manifest['optional_visual_files'])} original files")
PYVERIFY
```

## Existing durable evidence and exclusions

The author matrix and harness sources, production code, immutable TASK/PLAN, and owned lane handoff/report are already in Git. The author final result at `docs/evidence/admin-operations-evidence-lifecycle-completion-1/run-1792924786492/result.json` records 94/94 on `3fb6893b2c0b4927f6e98d71e031b739a46c29c1`, Chrome 148.0.7778.96. Its 94 case-name sequence and all five runtime digests match the root's final run; it remains a distinct execution and is not recopied here. The final author commit changes only owned documents/evidence after that proof head.

The existing author R1 result `run-1792923659785/result.json` and aborted-R2 explanation `run-1792924636541/result.json` also remain in the repository. The latter documents the `documentElement`/`MutationObserver` harness initialization abort; it is separate from the independent adapter v1 browser-startup failure.

Excluded items are individually explained in the manifest: generated `node_modules` symlinks, temporary bundles/browser files, committed runner copies available by Git hash, repeated adapter-source copies, and the preparation manifests whose complete contents appear in the retained result manifests. The two adapted runners can be reconstructed from the committed runner and exact archived diffs; their original SHA256 values remain in the manifests. V1's empty stdout is represented by its recorded empty-file hash.

These are bounded local mounted-component checks with controlled props, clocks, and deferred fetch. They do not establish hosted authentication, Next-router behavior, Supabase/RLS, Production health, native CI, or a post-merge deployment. The root Technical Lead owns those live gates and the finite-batch completion record.
