# R106 Trip — R3 findings from independent residual review at 4e66d894

This separate append-only archive preserves the residual review of exact R2
head **`4e66d8948046423656feb6b95b8562e546e82b19`** on 2026-10-25. The corrected
second run reached **three actual failing product assertions in two P2 finding
families**. Root reports issuing R3 CHANGES REQUIRED in
[PR #1009 comment 6397931035](https://github.com/Jetnity/jetnity/pull/1009#issuecomment-6397931035).
That action is attributed to the root session record; archival preparation did
not re-query or write GitHub.

The first run is retained separately: cases 1 and 3 stopped on probe setup
TypeErrors, while case 2 reached a genuine focus assertion and failed. The setup
errors are **not product findings**. Nothing in either raw result is rewritten
to hide this distinction.

No new product execution, browser launch, test, repository edit or platform
write occurred while preparing this archive. The existing 110 evidence files
(the previous 86 plus the separate 24-file R2 archive) and five staging
manifests/maps remain unchanged.

## Evidence chronology and case classification

| Version or result | What is preserved | Interpretation |
| --- | --- | --- |
| Original two-case preparation | Exact source and original README | Never executed. Retained as preparation history; it contributes no passing or failing product case. |
| Three-case v1 | Exact source and original README | Used for raw run 1. Cases 1 and 3 contain adjacent parenthesized bridge statements without explicit terminators. |
| Raw run 1 | Three observations labelled `FAIL` by its unchanged generic reporter | Case 1: setup TypeError. Case 2: actual trusted pointer/Tab focus failure. Case 3: setup TypeError. Count **one product assertion failure**, not three. |
| v2 setup correction | Exact v2 source, six-semicolon diff and provenance JSON | Exactly six statement terminators were added. Assertions, sequence, fixture, product source and exact-head admission were unchanged. |
| Raw run 2 | Three observations labelled `FAIL` | All three reached actual product assertions. No setup TypeError is reported. They describe **two P2 finding families**, not three unrelated root causes. |

Both runs record Node **22.23.4**, Chromium **140.0.7339.16**, zero external
requests, and the same source-bound synthetic Host bundle. The two focus
observations both record `pointerNaturallyFocusedExistingRow: true` and
`programmaticRowFocusFallbackUsed: false`.

### Separate process-exit attestation

Root reports process exit **1** for run 1 and run 2. The raw JSONs have no process
exit field. This statement records the root attestation separately; no missing
exit field, command transcript or TAP output has been invented or inserted into
the raw results. The scripts' original exit rules remain inspectable.

## The two P2 finding families

### P2 — historical receipts still assert current visibility after observed absence

Run 2 case 1 first establishes an accepted Account create and a later matching
canonical confirmation. It then supplies a fresh same-trip raw canonical snapshot
**and** displayed trip without A; the observation generation advances from 2 to
3. The remaining historical receipt still exposes the unqualified status
“Gespeichert und im aktuellen Stand sichtbar.” The report records one such false
current-visible receipt. The newer draft stays intact, and callback counts stay
at one write, zero deletes and one read. No local delete is used in this case.

Run 2 case 3 reaches the same invariant through ordinary local discard. After a
confirmed create, the named-delete callback rejects. A later successful
expected-trip read observes A absent and conservatively reconciles the unknown
delete. Activating that receipt's actual `Versuch lokal verwerfen` button makes
the older create's unqualified current-visible confirmation appear again.
The newer draft remains, and counts before/after discard stay at one write, one
delete and two reads.

These observations concern **misleading current-state receipt semantics**.
They do not show an extra write, recreation of the deleted data, a repeated
delete, draft loss, or proof that an uncertain earlier operation did or did not
execute. Honest historical records and a correctly worded completed-deletion
receipt remain allowed.

### P2 — late completion steals trusted keyboard focus from unopened B edit

Case 2 is a product assertion failure in both runs. While A is pending, a trusted
pointer click on B's existing non-control title naturally focuses B's production
`tabIndex=-1` row. A trusted Tab then focuses B's unopened `Titel bearbeiten`
button. Passive event records preserve the trusted pointerdown, focusin,
keydown(Tab) and button focusin sequence. After A completes and its controlled
matching read arrives, focus moves to A's confirmed row instead of remaining on
B's edit button.

The source contains a clearly labelled fallback that could explicitly focus the
existing row if pointer behavior differed. **Neither retained execution used
that fallback.** No inserted control, React private property, direct React
handler invocation, synthetic KeyboardEvent or removed handler produced the
recorded failure. The recorded callback counts are one write, zero deletes and
one read.

## Setup-error provenance

The v1 statements beginning with `(window as any)` were adjacent without explicit
semicolons. JavaScript parsed the following parenthesized expression as a call on
the preceding bridge return value. This caused the reported
`kanonischSetzen(...) is not a function` and `reiseSetzen(...) is not a function`
errors before the affected assertions.

Root versioned v2 instead of overwriting v1. The retained diff adds one semicolon
on each of lines **83, 84, 98, 99, 204 and 205**, increasing the source by exactly
six bytes. Archival verification independently checked the line correspondence
and unchanged remaining bytes. The provenance JSON's
`nextExecution: NOT_EXECUTED_AT_PREPARATION` remains accurate for when that record
was created; raw run 2 is the subsequent execution.

| Artifact | SHA-256 |
| --- | --- |
| Three-case v1 source | `1ea683e1930ea23fe672d751bdb3d594e03a08515f67f406b057c5ddca7ea8d6` |
| Corrected v2 source | `cadc046f5e192da84aa6471e2d0d3285c6bc16844fce091c7487b4f80322372f` |
| Raw run 1 | `a7c1c306ddc88f5ed7aa4fdbd2ffb03e42a089301b3bd604c1fb9e561fe68dca` |
| Raw run 2 | `98b6f573c0c30f7c2e89d1b44eeb0507bf122aa0a462af2cf324b11af64a8ebc` |

## Source and scope binding

Both raw reports contain the same **62 verified repository source blobs** as the
already archived R2 controls result. They use the same separate synthetic Host
bundle SHA-256
`b3880f04d20f832d4fdd0d4003eeb33a0b045c17c9188f9be9153651532d6c40`.
Archival checks compare those bindings to the exact committed Git tree and the
unchanged retained Host metadata. Probe/run association is supported by root's
contemporaneous execution record and the versioned setup provenance; the raw
result JSONs themselves do not contain a probe-source hash.

Common replay sources and existing bindings are reused by verified relative
reference:

- `../r106-trip-root-review-b218-80006fdf-2026-10-25/probes/trip-acceptance-common.mjs.txt`
- `../r106-trip-root-review-b218-80006fdf-2026-10-25/probes/trip-build-acceptance-bundle.mjs.txt`
- `../r106-trip-root-r2-4e66d894-2026-10-25/bindings/trip-4e66d894-root1.bundle-info.json`
- `../r106-trip-root-r2-4e66d894-2026-10-25/bindings/source-binding-metadata.json`
- `../r106-trip-root-r2-4e66d894-2026-10-25/results/trip-r2-controls-4e66d894-run1.json`
- `../r106-trip-root-r2-4e66d894-2026-10-25/workspace/workspace-r4-result.json`

The preceding R2 archive's **five narrower assertions and three Workspace
scenarios remain passing within their stated scope**. Its 198 checked Workspace
source paths are source bindings, not 198 test cases. Those passes neither
reproduce nor negate these residual sequences. No old passing result is edited
or relabelled, and none of the R3 failures is counted as a Workspace-storage
failure.

All residual cases use the actual production personal list/hook under unchanged
author `flaeche.tsx`, with synthetic deferred callbacks and controlled canonical
deliveries. The page is unstyled HTML at 390×844. The records establish no project
CSS/layout, real guest storage, actual TripWorkspace integration, full Next
router, hosted Account, Supabase/RLS, Production, device/screen-reader, native CI,
Vercel, merge or postmerge acceptance. No extra writes or data recreation are
claimed. The earlier Workspace report's `fullCentralRowGuardCoverage: false`
also remains unchanged.

## Archive contents

`prepared-two-case/` preserves the original unexecuted source and README.
`v1/` preserves the executed three-case v1 source and original README.
`v2/` preserves the six-semicolon correction. `setup/` preserves the exact diff
and provenance JSON. `results/` contains both complete raw result files.
`bindings/source-binding-metadata.json` records metadata correspondence checks,
case classifications, exclusions and relative reuse. It is an archival record,
not a new behavior result.

Executable sources and original preparation READMEs are stored as `.txt` without
changing their bytes. Historical filenames mentioned inside the original
READMEs are preserved; use this archive's explicit replay map to distinguish the
unexecuted two-case preparation from three-case v1 and v2. The archive contains
no generated bundle, dependency tree, browser binary or rewritten product file.

`archive-manifest.json` lists all files except itself, their byte counts,
SHA-256/Git-blob identities and source locations. A separate staging append
manifest lists only this new archive and does not change existing upload maps.
No new tracking, GitHub or repository write is part of this archival step.

## Replay instructions — not new execution records

Keep the sibling archives in their existing relative positions. Verify every
retained/referenced file and restore sources into a new external directory:

```bash
python - /absolute/path/to/this/archive /absolute/path/to/new-replay <<'PY'
from pathlib import Path
import hashlib, json, sys
archive, replay = (Path(x).resolve() for x in sys.argv[1:])
manifest = json.loads((archive / 'archive-manifest.json').read_text())
assert not replay.exists(), 'Fresh replay directory required'
verified = []
for item in manifest['files'] + manifest['sharedReferences']:
    source = (archive / item['archiveRelativePath']).resolve()
    data = source.read_bytes()
    assert len(data) == item['bytes'], source
    assert hashlib.sha256(data).hexdigest() == item['sha256'], source
    verified.append((item, data))
replay.mkdir()
for item, data in verified:
    relative = item.get('replayRelativePath')
    if relative:
        target = replay / relative
        assert target.resolve().is_relative_to(replay)
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open('xb') as output:
            output.write(data)
print('Verified bytes and restored sources only; no probes executed')
PY
```

Use Node 22, a clean exact `4e66d894` checkout and its existing matching
dependencies/default Chromium. As documented in the previous R2 archive,
regenerate `host-sources.json` from `git ls-tree -r -z` of the exact commit and
rebuild a fresh guarded Host bundle using the restored
`trip-build-acceptance-bundle.mjs`. Do not reuse a metadata path that names a
different checkout/bundle or remove its provenance guards.

After creating that new manifest and bundle, the corrected v2 command is:

```bash
R106_T_NODE=/absolute/path/to/node22
R106_T_REPO=/absolute/path/to/clean/4e66d894/checkout
R106_T_REPLAY=/absolute/path/to/new-replay
PLAYWRIGHT_BROWSERS_PATH=/absolute/path/to/provisioned/playwright-browsers
export PLAYWRIGHT_BROWSERS_PATH

cd "$R106_T_REPO"

"$R106_T_NODE" --import ./scripts/server-only-test-register.mjs --import tsx \
  "$R106_T_REPLAY/host/trip-r2-residual-acceptance-v2.ts" \
  --repo "$R106_T_REPO" \
  --head 4e66d8948046423656feb6b95b8562e546e82b19 \
  --sources "$R106_T_REPLAY/host-sources.json" \
  --bundle "$R106_T_REPLAY/host-new.js" \
  --bundle-info "$R106_T_REPLAY/host-new-bundle-info.json" \
  --out "$R106_T_REPLAY/residual-v2-new.json"
```

On the retained defective head, the corrected assertions are expected to fail
with exit 1; preserve that result. v1 is retained for setup-error provenance and
is not the corrected replay target. The original two-case preparation has never
been executed and must not acquire an invented historical result. All output
paths must be fresh. A changed product head needs independently reviewed,
separately versioned admission and fresh gating; do not weaken this exact-head
probe merely to execute on a later candidate.
