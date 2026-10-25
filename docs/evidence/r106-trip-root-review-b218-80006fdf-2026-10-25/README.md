# R106 Trip — independent review evidence through the R1 delivery

This archive preserves the independent local review evidence for Trip PR #1009 at **`b218c33d9d00c19f3705aba8bd208cc455272659`** and **`80006fdf1443ca9d75d8c481246821354da16000`**. It records the original defects, eight passing narrow R1 acceptance cases, and five failing deeper R1 assertions. **The eight passes did not constitute acceptance of the complete Trip change.**

Archive preparation created only this README and `trip-root-evidence-archive-inventory-2026-10-25.json` under `/tmp`. The inventory helper performed no probe, browser, native test, platform operation, repository edit or archive copy. The Technical Lead subsequently selected and copied the byte-preserved records for the finite closure; no new behavior execution occurred during copying. Original source and result bytes remain unchanged. The inventory supplies source paths, proposed archive-relative paths, byte counts, SHA256 values and expected Git blob identities for byte-for-byte copying by the Technical Lead.

Suggested durable destination: `docs/evidence/r106-trip-root-review-b218-80006fdf-2026-10-25/`. Store this document as `README.md` and the inventory as `archive-inventory.json`.

## Minimal contents

| Group | Files | Original bytes | Meaning |
| --- | ---: | ---: | --- |
| Executed evidence and shared replay tools | 19 | 94,087 | Nine frozen source files and ten original result/binding JSON files. |
| Prepared future R2 probes | 5 | 32,080 | Three frozen scripts, their exact preparation diff and preservation record. **NOT EXECUTED.** |
| Total selected originals | **24** | **126,167** | About 123.2 KiB, excluding this README and inventory. |

All executable sources have proposed filenames ending in **`.ts.txt` or `.mjs.txt`**. These are data copies, preventing incidental native test or lint discovery. The inventory's `replayBasename` records the executable name to restore in a fresh external replay directory. No source bytes should be rewritten during archival, including embedded historical absolute paths.

The selected groups are:

- `probes/`: the original b218 pure/mounted counterexamples; the common guard and guarded builder; the five-case pure and three-case mounted acceptance probes; and the three scripts which demonstrated the remaining R1 regressions.
- `history/b218c33d/`: original defect observations.
- `history/guard-refusal/`: two intentional old-head admission refusals, each with zero behavior cases.
- `results/80006fdf/`: all two passing and three failing result files, retained in full with their source bindings and detailed observations.
- `bindings/`: the executed 800 bundle's metadata, input blobs and SHA256. The generated bundle itself is omitted.
- `prepared-r2/`: future-head preparations only. They must not be listed among executed results.

## Evidence chain and exact counts

| Head / artifact group | Recorded observation | Interpretation |
| --- | --- | --- |
| b218 pure counterexamples | Four reported groups: repeat without read; ignored later account match after absence; ignored match after conflict; ignored unknown reconciliation on both Account and Guest. | The fourth group includes two seams. These are four reported groups, not a new claim of four separately registered native tests. The script asserts the presence of defects. |
| b218 mounted counterexamples | Three cases: A steals search focus; unknown retry produces two writes and zero reads on the same ref; later matching account delivery remains `absent_uncertain`. | Actual production list and hook under the inspected deferred synthetic Host. Successful execution demonstrates defects, not product acceptance. |
| Old-head guard checks | Two `NOT_VERIFIED` reports; zero observations each. | Intentional refusal to run acceptance on b218, before product behavior. Neither passing product tests nor new product failures. |
| 800 original pure acceptance | **5 PASS / 0 FAIL.** | Unknown retry is blocked before read; accepted absence/conflict recover; unknown matches reconcile conservatively on both seams. |
| 800 original mounted acceptance | **3 PASS / 0 FAIL.** | Search focus survives; unknown repeat waits for a read; later account matching delivery recovers. |
| 800 same-ref pure regression | **0 PASS / 1 FAIL.** | Reclassifying old conflicting A removes the lock for newer pending B. A competing delete order is admitted. No actual writer is invoked by this pure probe. |
| 800 mounted lock/focus regressions | **0 PASS / 3 FAIL.** | Two set callbacks plus one delete callback occur while B remains unresolved; both B status-button focus and B delete-confirmation focus are stolen by late A completion. |
| 800 mounted post-delete regression | **0 PASS / 1 FAIL.** | A successful absent read leaves two visible ref elements, including one false current-state confirmation. The stale editor offers Save, but clicking it causes **zero extra writes** and explains the absent target. |
| Future R2 preparations | **0 executed cases.** | Five planned behavioral cases across three scripts. No new candidate SHA, compatibility finding or executed result is supplied by this archive. |

The b218 results identify Node **22.23.4**, and the mounted result identifies Chromium **140.0.7339.16**. The 800 root-run results record the same versions. Every retained mounted result reports **zero external requests**. None of these mounted probes loads actual project CSS or executes the real guest storage seam.

The 800 JSON files do not contain a process-exit field. Their recorded verdicts and each preserved script's `process.exitCode` rule distinguish successful assertions from failure, while root separately reported the executions. Do not invent missing exit records or a full TAP log.

Root issued R1 CHANGES REQUIRED [6396293132](https://github.com/Jetnity/jetnity/pull/1009#issuecomment-6396293132), then R2 CHANGES REQUIRED [6396794207](https://github.com/Jetnity/jetnity/pull/1009#issuecomment-6396794207); the same Cursor session acknowledged R2 in [6396795123](https://github.com/Jetnity/jetnity/pull/1009#issuecomment-6396795123). These references are attributed to the root/session record and were not re-polled during archival preparation.

## Source identity and its limits

The exact trees independently read during inventory are:

- b218 tree: `c54a3260e9bc6c91d352321d11f5a4607effb6ba`.
- 800 tree: `1234fa81fe5292a1a6d5ed93621a951cf8378ace`.

| Source | b218 Git blob | 800 Git blob |
| --- | --- | --- |
| Personal list | `7ee1b7bda392bd9db5bcec3320d9b703c8c63fed` | `8be6d7fb3c5782173e97d07a82e24459d9f46608` |
| Lifecycle hook | `b86f551765c49ab64b7a7bdb782172fcf876c751` | `a11b25652281e9d04be29aad7e0d9cf53c28e4e1` |
| Pure workflow | `80ac9973f315345832692ae0907ebdc2deb6adb4` | `7db0b86f68fca58a499b35e49ee60b541f23bc37` |
| Synthetic `flaeche.tsx` Host | `e1a27c1f659625cbdafb92e70ce929e90a3b98d6` | `e1a27c1f659625cbdafb92e70ce929e90a3b98d6` |

The inventory independently compared **all 62 unique input blobs recorded by the 800 results** against committed Git tree objects, with no mismatches. The original bundle metadata contains 61 recorded repository inputs; the mounted reports add the imported fixture. The original bundle SHA256 is `f0bf1752fed1e90efcd2dd9d840a253cfe2e27aefb094df2a76369359d7c7184`. These are source/correspondence checks, not a new behavior run.

The b218 provenance is weaker and remains honestly labelled. Its pure script verifies the workflow blob, but uses a head label whose exact checkout was checked separately in the contemporaneous review. Its mounted script hardcodes its head label and consumes a separately generated bundle without recording the bundle's source inputs. **Do not retroactively claim that the modern manifest guard existed for that historical run.** The inventory retains the exact Git references and measures the old bundle's current hash only as an excluded-artifact record.

Earlier session history reported a nested-git `EPERM` stop and a Chromium `SIGTRAP` startup stop. No standalone raw Trip log for those setup failures was found among the inspected artifacts. This archive does not reconstruct missing logs, count them as behavior cases, or describe them as approval denials. Both intentional guard-refusal JSON files are preserved separately.

## What is deliberately excluded

The generated b218 and 800 JavaScript bundles, installed dependencies/browsers, and full **7,130-path** 800 Git tree manifest are omitted. Their relevant hashes, reasons and local locations are recorded in the inventory. The 800 bundle can be rebuilt using the retained builder and exact Git sources; the full manifest can be regenerated from the commit. Do not vendor `node_modules` or browser binaries.

Production code, the author Host, immutable TASK/PLAN and owned author evidence already exist in the exact Git commits. They need not be copied into this archive. Nine key code/config/fixture paths are pinned in the inventory for each historical head. Original preparation READMEs are preserved locally; this document consolidates their replay instructions and proof boundaries.

## Portable replay and byte preservation

The following commands are **instructions only**, not new execution records. Use a clean exact-head checkout, Node 22 and dependencies/browser matching its lockfile. Do not run `.txt` source copies in place or write outputs over this archive.

First verify the later archive copy and restore executable sources to a fresh external directory. The script preserves their bytes and places the common module alongside each probe so relative imports resolve:

```bash
python - /absolute/path/to/archive /absolute/path/to/new-replay-directory <<'PY'
from pathlib import Path
import hashlib, json, sys
archive, replay = map(Path, sys.argv[1:])
inventory = json.loads((archive / 'archive-inventory.json').read_text())
replay.mkdir(exist_ok=False)
items = inventory['coreFiles'] + inventory['preparedR2Files']
for item in items:
    data = (archive / item['proposedArchiveRelativePath']).read_bytes()
    assert len(data) == item['bytes'], item['sourcePath']
    assert hashlib.sha256(data).hexdigest() == item['sha256'], item['sourcePath']
    if item['replayBasename']:
        with (replay / item['replayBasename']).open('xb') as output:
            output.write(data)
print(f'Verified {len(items)} original artifacts; restored source only, no probes run')
PY
```

For an **800 historical re-run**, set explicit paths and regenerate the manifest from committed Git objects, not working-tree files:

```bash
R106_T_NODE='/absolute/path/to/node22'
R106_T_REPO='/absolute/path/to/clean/800-checkout'
R106_T_RUN='/absolute/path/to/new-replay-directory'
R106_T_HEAD='80006fdf1443ca9d75d8c481246821354da16000'
PLAYWRIGHT_BROWSERS_PATH='/absolute/path/to/provisioned/playwright-browsers'
export PLAYWRIGHT_BROWSERS_PATH

python - "$R106_T_REPO" "$R106_T_HEAD" "$R106_T_RUN/sources.json" <<'PY'
from pathlib import Path
import json, subprocess, sys
repo, head, destination = sys.argv[1:]
raw = subprocess.run(['git', '-C', repo, 'ls-tree', '-r', '-z', head],
                     check=True, capture_output=True).stdout
files = {}
for record in raw.split(b'\0'):
    if not record:
        continue
    metadata, path = record.split(b'\t', 1)
    mode, kind, digest = metadata.decode().split(' ')
    if kind == 'blob':
        files[path.decode()] = digest
with Path(destination).open('x') as output:
    json.dump({'head': head, 'files': files}, output)
PY

cd "$R106_T_REPO"

r106_t_pure() {
  "$R106_T_NODE" --import ./scripts/server-only-test-register.mjs --import tsx \
    "$R106_T_RUN/$1" --repo "$R106_T_REPO" --head "$R106_T_HEAD" \
    --sources "$R106_T_RUN/sources.json" --out "$R106_T_RUN/$2"
}

r106_t_pure trip-pure-acceptance.ts original-pure.json
r106_t_pure trip-r1-regression-pure-80006fdf.ts same-ref.json

"$R106_T_NODE" "$R106_T_RUN/trip-build-acceptance-bundle.mjs" \
  --repo "$R106_T_REPO" --head "$R106_T_HEAD" \
  --sources "$R106_T_RUN/sources.json" \
  --bundle "$R106_T_RUN/host.js" --out "$R106_T_RUN/bundle-info.json"

r106_t_mounted() {
  "$R106_T_NODE" --import ./scripts/server-only-test-register.mjs --import tsx \
    "$R106_T_RUN/$1" --repo "$R106_T_REPO" --head "$R106_T_HEAD" \
    --sources "$R106_T_RUN/sources.json" \
    --bundle "$R106_T_RUN/host.js" --bundle-info "$R106_T_RUN/bundle-info.json" \
    --out "$R106_T_RUN/$2"
}

r106_t_mounted trip-mounted-acceptance.ts original-mounted.json
r106_t_mounted trip-r1-regression-mounted-80006fdf.ts controls.json
r106_t_mounted trip-r1-post-delete-history-80006fdf.ts post-delete.json
```

Run sequentially and retain each actual exit/result. The historical 800 regression invocations are expected to exit unsuccessfully because their **correct-behavior assertions fail**. Do not discard those outputs, stop reporting after the eight narrower passes, or relabel the entire run PASS. A fresh bundle is validated against its own metadata; time-generated refs and output timestamps are not expected to match the historical JSON byte-for-byte.

The original b218 scripts use fixed imports under `/tmp/jetnity-r106-t-review` and fixed output filenames under `/tmp/r106-review-evidence`. Replay them only in a fresh disposable environment with those paths, an independently verified exact b218 checkout, and an empty output directory. The modern acceptance builder deliberately rejects b218; do not disable its guard. Rebuild the historical Host directly from `scripts/trip-personal-preparation-workflow-completion-1/flaeche.tsx` with the existing esbuild configuration: IIFE bundle, automatic JSX, `@` alias to the exact checkout, production React define and the process banner preserved in the retained builder. Then execute the frozen historical probes with the existing TS loader/register. A completed counterexample probe means the old defect was reproduced.

All mounted probes use Playwright's normal default Chromium launch with synthetic adapters and no personal browser profile. They abort and count external requests. Use the normal execution permission mechanism if the environment requires it; do not modify browser flags to route around a blocked startup.

## Future R2 remains unexecuted

The three files under `prepared-r2/` reject both b218 and 800 and require an explicit new full SHA. Their preparation diff and SHA256 record show that the behavior/assertion bodies remain byte-identical to the executed 800 scripts; only head admission and an API-review reminder changed.

Before a future run, independently revalidate the new workflow exports, returned intent/order/lock shapes, real fixture/builder signatures, actual list/hook controls, and the `flaeche.tsx` deferred bridge semantics. Generate a **new committed manifest and new guarded bundle for that exact head**. A fixture mismatch is not automatically a product defect and is never a passing result. Any necessary external adaptation must be separately versioned and preserve these behavioral invariants.

Archive the new head's actual results separately. Do not overwrite the 800 failures, move them under a new SHA, or count preparation files as executed evidence.

## Boundary

This archive establishes bounded local production-list/hook and pure-workflow observations with controlled canonical deliveries and deferred callbacks. It does not establish real `TripWorkspace` guest-storage CRUD, the full Next router, hosted Account, Supabase/RLS, project-CSS acceptance, native device/zoom/screen-reader behavior, native CI, Vercel Preview, Production, final merge readiness or post-merge acceptance. Those remain separate Technical-Lead gates. No additional test family or scope is introduced by archival preparation.
