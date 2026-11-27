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
        "codeHead": batch.current_code_head(),
        "archiveVerifiedThisRun": False,
        "legalEvidenceSlots": 0,
        "coreCompleteProfiles": 0,
        "published": 0,
        "accepted": 0,
        "payloadImport": "STOP_PRIVATE_PAYLOAD_PATH_MISSING",
        "authorized": False,
    }


def run(archive: Path, output: Path, authorized: bool = False) -> dict:
    plan = redacted_plan(archive, output)
    if not authorized:
        raise ValueError("LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED")
    batch.pinned_archive_required(archive, None)
    identity_sha = batch.digest(archive)
    batch.require(identity_sha == batch.LOCAL_REPACK_SHA256, "unreviewed_archive")
    staging_parent = output.parent
    batch.require(staging_parent.is_dir() and not staging_parent.is_symlink(), "local_output_refused")
    staging = staging_parent / ".jetnity-local-preflight"
    if staging.exists():
        raise ValueError("local_preflight_exists")
    staging.mkdir(mode=0o700)
    try:
        root = batch.extract_pinned_archive(archive, staging)
        inventory = batch.confirm_pinned_inventory(root)
    finally:
        import shutil
        shutil.rmtree(staging, ignore_errors=True)
    plan.update({"archiveVerifiedThisRun": True, "authorized": True, **inventory,
                 "archiveSha256": identity_sha})
    plan.pop("archivePathRecorded", None)
    return plan


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
