# R106 Account root evidence — minimal archive inventory

Prepared from existing artifacts on 25 October 2026. **This is an inventory, not a new test run, archive copy, TL PASS or post-integration acceptance.** Exact Account review head: `e2db757d502f97f0dcce48d61e0b0fd87f95caa0`. Root evidence: [comment 6396573716](https://github.com/Jetnity/jetnity/pull/1008#issuecomment-6396573716). Subsequent normal-main synchronization requires new exact-head gates and a separately preserved run.

## Preserved outcomes

| Run | Actual result | Meaning |
| --- | --- | --- |
| Root independent e2, 10:33:55–10:34:03Z |4 pure + 10 mounted = 14 PASS; 0 external requests/page errors;tracked source clean before/after | Bounded acceptance on e2 only |
| Root execution of audited author runner on e2 |39 mounted + 2 contract = 41 PASS; 0 fail/cancel/skip; exit 0; Chromium 140.0.7339.16 | Different proof from the independent 14 cases |
| Original v1 setup on 6b, 10:18:38–10:18:44Z |4 pure PASS; mounted setup stopped at missing `@playwright/test`;overall NOT PASSED | No mounted execution or browser PASS |
| Corrected v2 mounted run on 6b, 10:21:20–10:21:35Z |9 PASS / 1 FAIL among 10 mounted cases | Historical receipt focus was stolen; real product finding retained |

The v1 source also contains an explicit `--no-sandbox` argument. That run failed before launch; no browser was started with that argument and this was not an automatic approval rejection. Keep the old bytes as frozen text and **do not execute v1**. V2 uses the installed `playwright/test` export and `chromium.launch({headless:true})` without that argument. The final e2 probe SHA256 is `117c5f881c222df8de4578a36352f9050a2d2c32b871c3f73468a6d8d7445dc6`.

## Attribution and scope

The root-executed author result hard-codes `author`, `session` and `model` to the original Cursor harness author. Those fields describe **harness provenance, not root's execution identity**. Do not rewrite the original JSON to make it look differently generated. The executor attribution is separately recorded by root comment 6396573716 and this inventory. Its retained TAP footer proves 41 tests; the case array contains 39 mounted records. Only a stdout/stderr tail is retained, not a full TAP log.

Both executions use synthetic action/router boundaries. The independent refresh adapter returns `undefined`; actual props change only when supplied by the probe. No hosted Account, complete Next Router, Supabase/RLS, Production, launch, physical device or screenreader acceptance follows. Root-font 32px is a CSS simulation. Source checks and screenshots are not new visual inspection claims.

## Minimal byte-preserving selection

Suggested later repository destination: `docs/evidence/r106-account-root-preintegration-e2db757d-2026-10-25/`. The Technical Lead selected and copied these original bytes for the finite closure; the inventory helper did not perform a new test run. The companion JSON maps every absolute original path to the proposed relative path and records bytes, SHA256 and Git blob if archived unchanged.

| Proposed archive-relative path | Bytes | Role |
| --- | ---: | --- |
| `probe/account-acceptance-v2.mjs.txt` | 37608 | current independent probe |
| `probe/helpers/independent-actions.ts.txt` | 1577 | executed helper source |
| `probe/helpers/independent-navigation.ts.txt` | 427 | executed helper source |
| `probe/helpers/independent-mount.tsx.txt` | 743 | executed helper source |
| `probe/production-styles.css.txt` | 21425 | exact compiled css |
| `independent-e2/account-acceptance-result.json` | 18282 | root independent acceptance |
| `root-author-run-e2/run-e2db757d.json` | 12871 | root execution of audited author runner |
| `root-author-run-e2/screens/320.png` | 256193 | root execution screenshot |
| `root-author-run-e2/screens/320-root-32.png` | 261609 | root execution screenshot |
| `root-author-run-e2/screens/1280.png` | 378200 | root execution screenshot |
| `history/setup-6b094021/account-acceptance-result.json` | 12452 | historical setup failure |
| `history/focus-6b094021/account-acceptance-result.json` | 15487 | historical product failure |
| `history/setup-6b094021/account-acceptance-v1.mjs.txt` | 35384 | historical runner source do not run |

Original artifacts: **13 files, 1,052,258 bytes**. This README and the inventory JSON are new explanatory metadata. Code/fixture/CSS snapshots use `.txt` archive suffixes to avoid automatic lint/test inclusion; bytes must remain unchanged. Do not repair absolute helper imports inside the frozen snapshots. The executable probe regenerates helpers for an explicitly supplied checkout/output directory.

The three selected e2 root screenshots differ from the committed 268 author screenshots. Exclude the extracted copies under `account-final-e2db-screens/`. Exclude generated JS bundles, compiled modules, dependencies and installed browser files. Earlier run directories, original c761 defect evidence and its INCOMPLETE selector-failure record remain untouched; they are not selected for this minimal R1/final package.

## Source binding checked during inventory

All 11 initial and 26 final independent source pairs, plus all 8 author-runner pairs, match exact e2 Git objects by Git blob and SHA256. The tracked checkout remains clean; its root-run JSON/screens are existing untracked outputs. No product/source bytes were changed. The selected evidence copies preserve the original hashes. The manifest also pins the already committed author runner, mounted tests, mount and action/navigation shims; reference these Git sources instead of copying them again.

The exact e2 independent CSS file is 21,425 bytes, SHA256 `3eb7ce8f2102c2d2576b80dfb5ae8f1e293e87bc853c3e0ae29204bc9f9c7205`. Historical 6b/268 CSS differs. The archive preserves the actual e2 bytes without claiming Next-Production CSS equivalence.

## Commands and safe reproduction

These are reconstructed reproduction commands, **not executions performed by this inventory**. The result JSON records the actual tested head and source bindings.

Independent probe from the durable archive, with fresh external replay/output directories. Replace every absolute placeholder explicitly; do not execute the archival `.txt` file in place:

```bash
R106_A_ARCHIVE='/absolute/path/to/account-review-archive'
R106_A_REPLAY='/absolute/path/to/new-external-replay-directory'
R106_A_OUTPUT='/absolute/path/to/new-external-result-directory'
R106_A_REPO='/absolute/path/to/clean/e2-checkout'
R106_A_NODE='/absolute/path/to/node22'
PLAYWRIGHT_BROWSERS_PATH='/absolute/path/to/provisioned/playwright-browsers'
export PLAYWRIGHT_BROWSERS_PATH

python - "$R106_A_ARCHIVE" "$R106_A_REPLAY" <<'PYRESTORE'
from pathlib import Path
import hashlib, json, sys
archive, replay = map(Path, sys.argv[1:])
manifest = json.loads((archive / 'archive-manifest.json').read_text())
item = next(x for x in manifest['selectedOriginalArtifacts']
            if x['proposedArchiveRelativePath'] == 'probe/account-acceptance-v2.mjs.txt')
data = (archive / item['proposedArchiveRelativePath']).read_bytes()
assert len(data) == item['bytes']
assert hashlib.sha256(data).hexdigest() == item['sha256']
replay.mkdir(exist_ok=False)
with (replay / 'account-acceptance-v2.mjs').open('xb') as output:
    output.write(data)
PYRESTORE

"$R106_A_NODE" "$R106_A_REPLAY/account-acceptance-v2.mjs" \
  --repo "$R106_A_REPO" \
  --expected-head e2db757d502f97f0dcce48d61e0b0fd87f95caa0 \
  --output-dir "$R106_A_OUTPUT" --only all
```

For the audited author runner, first use a **fresh isolated checkout at e2**, with Node 22.23.4 as `node` on PATH. Its child spawns `node`; its per-head screenshot folder can overwrite captures in a reused checkout. Then:

```bash
PLAYWRIGHT_BROWSERS_PATH=/tmp/r106-review-browsers node scripts/account-traveller-management-completion-1/run.mjs
```

The recorded child command is `node --import tsx --test lib/traveller/account-registry-workflow-ui.test.ts`. The historical v1 is archival-only. Do not rerun any test as part of copying this inventory.

## Later finite closure

Append the eventual synchronized-head evidence separately. Preserve these historical outputs, link the final TL and actual-main post-merge facts, and avoid relabelling e2 as the accepted integrated head. This inventory contains no forecast of O's pending post-merge gates or A's future merge.
