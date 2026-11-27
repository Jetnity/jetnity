"""Local offline preflight for the pinned repack. No database and no network.

The Mac archive is not opened by this module unless a later Technical-Lead
acceptance sets authorized=True. Reports contain checksums and counts only.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import importlib.util

_SPEC = importlib.util.spec_from_file_location(
    "official_truth_50_pass_import", Path(__file__).with_name("official-truth-50-pass-import.py"))
assert _SPEC and _SPEC.loader
batch = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(batch)


def redacted_plan(archive: Path, output: Path) -> dict:
    """Identity plan only. Does not read archive bytes and does not create output."""
    batch.require(not archive.is_symlink() and not output.is_symlink(), "local_symlink_refused")
    batch.require(not batch._inside_git_worktree(output.parent if output.parent.exists() else output),
                  "local_output_inside_worktree")
    return {
        "schema": 1,
        "kind": "jetnity_local_offline_plan",
        "classification": "RESEARCH_ONLY",
        "archivePathRecorded": False,
        "outputPathRecorded": False,
        "localRepackSha256": batch.LOCAL_REPACK_SHA256,
        "localRepackBytes": batch.LOCAL_REPACK_BYTES,
        "passportCsvSha256": batch.PRIORITY_CSV_SHA256,
        "trackerSha256": batch.TRACKER_SHA256,
        "codeHead": batch.repository_commit(),
        "scriptHashes": batch.execution_script_hashes(),
        "archiveVerifiedThisRun": False,
        "legalEvidenceSlots": 0,
        "coreCompleteProfiles": 0,
        "published": 0,
        "accepted": 0,
        "payloadImport": "STOP_PRIVATE_PAYLOAD_PATH_MISSING",
        "authorized": False,
    }


def run(archive: Path, output: Path, authorized: bool = False) -> dict:
    """The Mac archive run stays closed. Authorization does not open the file."""
    redacted_plan(archive, output)
    raise ValueError("LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED")


def offline_charge(root: Path, output: Path, destinations: list[str], adapter, identity: dict) -> dict:
    """Prepare, resume and verify one synthetic charge. No archive bytes are read here."""
    batch.require(identity.get("archiveSha256") != "0" * 64, "null_archive_sha_refused")
    first = batch.prepare_resumable(root, output, destinations, adapter, identity=identity)
    second = batch.prepare_resumable(root, output, destinations, adapter, identity=identity)
    verified = batch.verify(output, adapter)
    batch.require(first == second == verified, "offline_charge_mismatch")
    batch.require(verified["published"] == 0 and verified["accepted"] == 0, "offline_charge_promoted")
    return {"published": 0, "accepted": 0, "legalEvidenceSlots": 0,
            "destinations": verified["destinations"], "blockedCountries": verified["blockedCountries"]}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--after-tl-acceptance", action="store_true")
    values = parser.parse_args()
    try:
        if values.archive is None or values.output is None:
            raise ValueError("local_arguments_missing")
        report = run(values.archive, values.output, authorized=values.after_tl_acceptance)
        print(json.dumps(report, separators=(",", ":")))
    except (ValueError, OSError) as error:
        print(f"LOCAL_OFFLINE_REFUSED {error} accepted=0 published=0", file=sys.stderr)
        raise SystemExit(2)


if __name__ == "__main__":
    main()
