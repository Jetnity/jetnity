"""Local offline execution for one pinned archive. No database and no network.

The archive is not opened unless an external acceptance record matches the
checked-out commit and the hashes of the four execution scripts. A boolean flag
is not that record. This module does not create the record and does not mark
any commit accepted. Reports contain checksums and counts only.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
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
    parent = output.parent if output.parent.exists() else output
    batch.require(not batch._inside_git_worktree(parent), "local_output_inside_worktree")
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


def _acceptance_gate(acceptance: dict | None) -> dict:
    """Refuse before any archive byte is read. A boolean is not acceptance."""
    if not isinstance(acceptance, dict):
        raise ValueError("LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED")
    if acceptance.get("gitCommit") != batch.repository_commit():
        raise ValueError("git_commit_identity")
    if acceptance.get("scriptHashes") != batch.execution_script_hashes():
        raise ValueError("script_hash_mismatch")
    claimed = acceptance.get("archiveSha256")
    if not batch._hex(claimed, 64):
        raise ValueError("archive_identity")
    return acceptance


def _checkout_clean() -> bool:
    repo = Path(__file__).resolve().parent.parent
    completed = subprocess.run(
        ["git", "-C", str(repo), "status", "--porcelain", "--untracked-files=normal"],
        check=False, capture_output=True, text=True)
    batch.require(completed.returncode == 0, "git_status_unreadable")
    return completed.stdout == ""


def run(archive: Path, output: Path, authorized: bool = False, acceptance: dict | None = None,
        destinations: list[str] | None = None, adapter=None) -> dict:
    """Preflight, unpack, prepare, resume, verify, and return a redacted report.

    ``authorized`` is ignored. The archive stays closed until ``acceptance``
    matches this checkout. A fixture acceptance cannot carry a real archive pin.
    """
    del authorized
    redacted_plan(archive, output)
    record = _acceptance_gate(acceptance)
    claimed = record["archiveSha256"]
    fixture = record.get("fixture") is True
    if claimed in batch.ACCEPTED_ARCHIVE_SHA256 and fixture:
        raise ValueError("fixture_cannot_replace_pin")
    if claimed in batch.ACCEPTED_ARCHIVE_SHA256:
        batch.require(_checkout_clean(), "checkout_not_clean")
    elif not fixture:
        raise ValueError("unreviewed_archive")
    file_sha = batch.digest(archive)
    batch.require(file_sha == claimed, "archive_identity")
    names = list(destinations) if destinations is not None else list(batch.ORDER)
    batch.require(names == list(batch.ORDER[:len(names)]) and names, "destination_order_refused")
    parent = output.parent.resolve(strict=True)
    staging = Path(tempfile.mkdtemp(prefix=".jetnity-local-src-", dir=str(parent)))
    os.chmod(staging, 0o700)
    try:
        root = batch.extract_pinned_archive(archive, staging, fixture=fixture)
        identity = batch.charge_identity(file_sha, output, names)
        chosen = adapter if adapter is not None else batch.original_adapter()
        first = batch.prepare_resumable(root, output, names, chosen, identity=identity)
        second = batch.prepare_resumable(root, output, names, chosen, identity=identity)
        verified = batch.verify(output, chosen, identity)
        batch.require(first == second == verified, "offline_charge_mismatch")
    finally:
        shutil.rmtree(staging, ignore_errors=True)
    batch.require(batch.digest(archive) == file_sha, "archive_changed")
    batch.require(verified["published"] == 0 and verified["accepted"] == 0, "offline_charge_promoted")
    report = {
        "schema": 2,
        "kind": "jetnity_local_offline_report",
        "classification": "RESEARCH_ONLY",
        "archivePathRecorded": False,
        "outputPathRecorded": False,
        "archiveVerifiedThisRun": file_sha in batch.ACCEPTED_ARCHIVE_SHA256 and not fixture,
        "legalEvidenceSlots": 0,
        "coreCompleteProfiles": 0,
        "published": 0,
        "accepted": 0,
        "payloadImport": "STOP_PRIVATE_PAYLOAD_PATH_MISSING",
        "destinations": verified["destinations"],
        "blockedCountries": verified["blockedCountries"],
        "codeHead": batch.repository_commit(),
        "fixture": fixture,
    }
    encoded = json.dumps(report)
    batch.require(str(archive) not in encoded and str(output) not in encoded, "report_path_leak")
    return report


def offline_charge(root: Path, output: Path, destinations: list[str], adapter, identity: dict) -> dict:
    """Synthetic prepare/resume/verify without archive bytes.

    This is not the local execution path. ``run`` is that path.
    """
    batch.require(identity.get("archiveSha256") != "0" * 64, "null_archive_sha_refused")
    first = batch.prepare_resumable(root, output, destinations, adapter, identity=identity)
    second = batch.prepare_resumable(root, output, destinations, adapter, identity=identity)
    verified = batch.verify(output, adapter, identity)
    batch.require(first == second == verified, "offline_charge_mismatch")
    batch.require(verified["published"] == 0 and verified["accepted"] == 0, "offline_charge_promoted")
    return {"published": 0, "accepted": 0, "legalEvidenceSlots": 0,
            "destinations": verified["destinations"], "blockedCountries": verified["blockedCountries"]}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--after-tl-acceptance", action="store_true")
    parser.add_argument("--acceptance", type=Path)
    values = parser.parse_args()
    try:
        if values.archive is None or values.output is None:
            raise ValueError("local_arguments_missing")
        record = None
        if values.after_tl_acceptance:
            if values.acceptance is None:
                raise ValueError("LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED")
            record = json.loads(values.acceptance.read_text(encoding="utf-8"))
        elif values.acceptance is not None:
            raise ValueError("LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED")
        report = run(values.archive, values.output, acceptance=record)
        print(json.dumps(report, separators=(",", ":")))
    except (ValueError, OSError) as error:
        print(f"LOCAL_OFFLINE_REFUSED {error} accepted=0 published=0", file=sys.stderr)
        raise SystemExit(2)


if __name__ == "__main__":
    main()
