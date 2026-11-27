"""Synthetic tests: 50-pass research imports cannot publish or partially complete."""
import importlib.util
import io
import json
import multiprocessing
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
import unittest

local_spec = importlib.util.spec_from_file_location(
    "local_offline", Path(__file__).with_name("official-truth-local-offline-run.py"))
local = importlib.util.module_from_spec(local_spec)
local_spec.loader.exec_module(local)

spec = importlib.util.spec_from_file_location("batch", Path(__file__).with_name("official-truth-50-pass-import.py"))
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)
COUNTS = {"destinations": 1, "passports": 50, "researchRecords": 50,
          "topicSlots": 1300, "sourceEntries": 0, "accepted": 0, "published": 0}


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.base = Path(tempfile.mkdtemp(prefix="jetnity-batch-test-"))
        self.addCleanup(lambda: shutil.rmtree(self.base))
        self.source = self.base / "source"
        self.source.mkdir()
        self.out = self.base / "out"
        self.calls = []

        def read_file(root, relative, max_bytes):
            data = (root / relative).read_bytes()
            if len(data) > max_bytes:
                raise ValueError("too_large")
            return data

        def prepare(root, dest, out):
            self.calls.append(dest)
            out.mkdir()
            (out / "manifest.json").write_text(json.dumps({
                "destination": dest, "status": "RESEARCH_ONLY", "publicationAuthority": "none",
                "sourceVerification": "NOT_RUN", "ownerPublicationApproval": False,
                "passportPriority": [f"{x:02d}" for x in range(50)],
                "inputHashes": {"passportPriority": "same"},
            }) + "\n")
            return dict(COUNTS)

        def verify(out):
            data = json.loads((out / "manifest.json").read_text())
            if data["publicationAuthority"] != "none":
                raise ValueError("unauthorized")
            return dict(COUNTS)

        self.adapter = {"read_file": read_file, "strict_json": json.loads,
                        "prepare": prepare, "verify": verify}

    def test_all_five_atomic_research_only(self):
        result = b.prepare(self.source, self.out, list(b.ORDER[:5]), self.adapter)
        self.assertEqual(result, {"destinations": 5, "passports": 250, "topicSlots": 6500,
                                  "blockedCountries": 0, "blockedPassports": 0,
                                  "accepted": 0, "published": 0})
        self.assertEqual(self.calls, list(b.ORDER[:5]))
        self.assertEqual(b.verify(self.out, self.adapter), result)
        manifest = json.loads((self.out / "manifest.json").read_text())
        self.assertEqual(manifest["methodApproval"], "NOT_APPROVED")
        self.assertEqual(manifest["visitorOutcome"], "derzeit nicht verfügbar")
        self.assertFalse(manifest["officialSourcesVerified"])

    def test_failed_country_leaves_no_partial_import(self):
        good = self.adapter["prepare"]

        def fail(root, dest, out):
            if dest == "FR":
                raise ValueError("third_country_refused")
            return good(root, dest, out)

        self.adapter["prepare"] = fail
        with self.assertRaises(ValueError):
            b.prepare(self.source, self.out, list(b.ORDER[:5]), self.adapter)
        self.assertFalse(self.out.exists())

    def test_order_existing_output_and_tamper_refused(self):
        for bad in ("IT,AT", "AT,IT,PT", "AT,,IT", "DE", ""):
            with self.assertRaises(ValueError):
                b.selected(bad)
        b.prepare(self.source, self.out, ["AT"], self.adapter)
        with self.assertRaises(ValueError):
            b.prepare(self.source, self.out, ["AT"], self.adapter)
        target = self.out / "packages" / "AT" / "manifest.json"
        target.write_bytes(target.read_bytes() + b" ")
        with self.assertRaises(ValueError):
            b.verify(self.out, self.adapter)

    def test_known_unsplit_frames_are_parked_without_approval(self):
        good = self.adapter["prepare"]
        for country in ("HR", "NL"):
            source = self.source / "records" / "dest" / country
            source.mkdir(parents=True)
            (source / "index.json").write_text(json.dumps({
                "schema": "jetnity-entry-requirements-research-v2.2",
                "status": "RESEARCH_ONLY", "dest_id": country, "destination_iso2": country,
            }))

        def check(root, country, out):
            if country in ("HR", "NL"):
                raise ValueError("split_frame_identity")
            return good(root, country, out)

        self.adapter["prepare"] = check
        result = b.prepare(self.source, self.out, list(b.ORDER[:8]), self.adapter)
        self.assertEqual(result["destinations"], 6)
        self.assertEqual(result["blockedCountries"], 2)
        self.assertEqual(result["blockedPassports"], 100)
        self.assertEqual(result["accepted"], 0)
        self.assertEqual(b.verify(self.out, self.adapter), result)
        self.assertFalse((self.out / "packages" / "HR").exists())
        self.assertFalse((self.out / "packages" / "NL").exists())
        (self.out / "blocked" / "HR.json").write_text("{}")
        with self.assertRaises(ValueError):
            b.verify(self.out, self.adapter)

    def test_unpinned_archive_refused_before_extract(self):
        target = self.base / "bad.tar.xz"
        target.write_bytes(b"tampered")
        with self.assertRaises(ValueError):
            b.extract_pinned_archive(target, self.base)
        self.assertFalse((self.base / "unpacked").exists())

    def test_catalog_dry_run_does_not_import_or_promote(self):
        self.assertEqual(len(b.ORDER), 206)
        self.assertEqual(b.ORDER[:13], ("AT", "IT", "FR", "ES", "PT", "GR", "HR", "NL", "GB", "US", "TR", "TH", "AE"))
        self.assertLess(b.ORDER.index("CN"), b.ORDER.index("CN-HK"))
        self.assertLess(b.ORDER.index("CN-HK"), b.ORDER.index("CN-MO"))
        before = set(self.base.rglob("*"))
        report = b.dry_run(list(b.ORDER))
        self.assertEqual(set(self.base.rglob("*")), before)
        self.assertEqual(report["profiles"], 10300)
        self.assertEqual(report["historicalTopicSlots"], 267800)
        self.assertEqual(report["coreSlots"], 61800)
        self.assertEqual(report["optionalSlots"], 41200)
        self.assertEqual(report["legalEvidenceSlots"], 0)
        self.assertEqual(report["sourceAssignments"], 0)
        self.assertEqual(report["published"], 0)
        self.assertEqual(report["accepted"], 0)
        self.assertEqual(report["importCapableProfiles"], "NOT_ASSESSED")
        self.assertFalse(report["archiveVerifiedThisRun"])
        self.assertEqual(report["payloadImport"], "STOP_PRIVATE_PAYLOAD_PATH_MISSING")
        self.assertEqual(report["localRepackSha256"],
                         "6545eb28cdffab00a2c7864626abe602d4df240a477bb28b73fe73f78520744b")
        self.assertEqual(report["coreCompleteProfiles"], 0)
        self.assertEqual(b.ACCEPTED_ARCHIVE_SHA256[b.LOCAL_REPACK_SHA256], "local_repack_variant")
        self.assertEqual(report["specialDestinations"], ["CN-HK", "CN-MO"])
        self.assertEqual(report["structuralHoldDestinations"], ["HR", "NL"])
        self.assertEqual(len(report["extraSliceDestinationsInScope"]), 9)
        self.assertIn("SO", {item["nationality"] for item in report["topicHolds"]})

    def test_checkpoint_is_append_only_idempotent_and_conflicts(self):
        checkpoint = self.base / "checkpoint.jsonl"
        identity = b.charge_identity("ab" * 32, self.base / "checkpoint-id", ["AT", "IT", "FR"])
        event = {**identity, "destination": "AT", "planDigest": "a" * 64, "action": "quarantined",
                 "accepted": 0, "published": 0}
        self.assertTrue(b.append_checkpoint(checkpoint, event)["appended"])
        snapshot = checkpoint.read_bytes()
        second = {**identity, "destination": "IT", "planDigest": "b" * 64, "action": "quarantined",
                  "accepted": 0, "published": 0}
        self.assertTrue(b.append_checkpoint(checkpoint, second)["appended"])
        self.assertTrue(checkpoint.read_bytes().startswith(snapshot))
        self.assertFalse(b.append_checkpoint(checkpoint, event)["appended"])
        self.assertEqual(checkpoint.read_bytes().count(b"\n"), 2)
        with self.assertRaisesRegex(ValueError, "checkpoint_conflict"):
            b.append_checkpoint(checkpoint, {**event, "planDigest": "c" * 64})
        self.assertEqual(checkpoint.read_bytes().count(b"\n"), 2)
        plan = b.resume_plan(checkpoint, ["AT", "IT", "FR"])
        self.assertEqual(plan["done"], ["AT", "IT"])
        self.assertEqual(plan["remaining"], ["FR"])
        self.assertEqual(plan["published"], 0)
        b.append_checkpoint(checkpoint, {**identity, "destination": "FR", "planDigest": "d" * 64,
                                          "action": "quarantined", "accepted": 0, "published": 0})
        with self.assertRaisesRegex(ValueError, "checkpoint_identity_mismatch"):
            b.append_checkpoint(checkpoint, {**identity, "archiveSha256": "cd" * 32, "destination": "GB",
                                             "planDigest": "e" * 64, "action": "quarantined",
                                             "accepted": 0, "published": 0})
        broken = self.base / "gap.jsonl"
        b.append_checkpoint(broken, event)
        b.append_checkpoint(broken, {**identity, "destination": "FR", "planDigest": "d" * 64,
                                     "action": "quarantined", "accepted": 0, "published": 0})
        with self.assertRaisesRegex(ValueError, "checkpoint_gap"):
            b.resume_plan(broken, ["AT", "IT", "FR"])
        data = bytearray(checkpoint.read_bytes())
        data[8] ^= 1
        checkpoint.write_bytes(bytes(data))
        with self.assertRaises(ValueError):
            b.read_checkpoint(checkpoint)

    def test_repo_path_and_payload_import_stop(self):
        inside = Path(__file__).resolve().parent.parent / "official-truth-checkpoint.jsonl"
        event = {**b.charge_identity("ab" * 32, self.base / "checkpoint-id", ["AT"]), "destination": "AT",
                 "planDigest": "a" * 64, "action": "quarantined", "accepted": 0, "published": 0}
        with self.assertRaisesRegex(ValueError, "checkpoint_inside_repo"):
            b.append_checkpoint(inside, event)
        self.assertFalse(inside.exists())
        with self.assertRaisesRegex(ValueError, "PRIVATE_PAYLOAD_PATH_MISSING"):
            b.import_payload()
        with self.assertRaises(ValueError):
            b.selected("AT,AT")
        with self.assertRaises(ValueError):
            b.selected("CN-HK")

    def test_resumable_prefix_is_kept_and_repeat_does_not_append(self):
        good = self.adapter["prepare"]

        def fail(root, country, package):
            if country == "IT":
                raise ValueError("second_country_refused")
            return good(root, country, package)

        self.adapter["prepare"] = fail
        out = self.base / "resume"
        names = list(b.ORDER[:2])
        identity = b.charge_identity("ab" * 32, out, names)
        with self.assertRaisesRegex(ValueError, "second_country_refused"):
            b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        self.assertTrue((out / "packages" / "AT").is_dir())
        self.assertFalse((out / "packages" / "IT").exists())
        self.assertFalse((out / "manifest.json").exists())
        self.assertEqual((out / "checkpoint.jsonl").read_bytes().count(b"\n"), 1)
        self.adapter["prepare"] = good
        self.calls.clear()
        result = b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        self.assertEqual(self.calls, ["IT"])
        self.assertEqual(result["destinations"], 2)
        self.assertEqual(result["published"], 0)
        self.assertEqual(result["accepted"], 0)
        sealed = (out / "checkpoint.jsonl").read_bytes()
        self.calls.clear()
        repeat = b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        self.assertEqual(self.calls, [])
        self.assertEqual((out / "checkpoint.jsonl").read_bytes(), sealed)
        self.assertEqual(repeat, result)
        self.assertEqual(b.verify(out, self.adapter, identity), result)

    def test_split_hr_and_nl_stay_held(self):
        for country in ("HR", "NL"):
            source = self.source / "records" / "dest" / country
            source.mkdir(parents=True)
            (source / "index.json").write_text(json.dumps({
                "schema": "jetnity-entry-requirements-research-v2.2",
                "status": "RESEARCH_ONLY", "dest_id": country, "destination_iso2": country,
                "file_layout": "split",
            }))
        result = b.prepare(self.source, self.out, list(b.ORDER[:8]), self.adapter)
        self.assertEqual(result["blockedCountries"], 2)
        self.assertNotIn("HR", self.calls)
        self.assertNotIn("NL", self.calls)
        seal = json.loads((self.out / "manifest.json").read_text())
        self.assertEqual({row["reason"] for row in seal["blocked"]}, {"ambiguous_index_hold"})
        self.assertEqual(b.verify(self.out, self.adapter), result)

    def test_research_root_cannot_replace_archive_pin(self):
        with self.assertRaisesRegex(ValueError, "research_root_not_archive_pin"):
            b.pinned_archive_required(None, self.source)
        with self.assertRaisesRegex(ValueError, "research_root_not_archive_pin"):
            b.pinned_archive_required(self.source, self.source)

    def test_output_inside_git_worktree_is_refused(self):
        tree = self.base / "worktree"
        (tree / ".git").mkdir(parents=True)
        with self.assertRaisesRegex(ValueError, "output_refused"):
            b._outside(tree / "private", Path("/absent/repo"), self.source)
        self.assertFalse((tree / "private").exists())

    def test_local_archive_run_stays_unauthorized_and_redacted(self):
        original = self.base / "plan-original"
        private = self.base / "plan-private"
        original.mkdir()
        private.mkdir()
        archive = original / "repack.xz"
        archive.write_bytes(b"not-the-repack")
        output = private / "out"
        kept = sorted(path.name for path in original.iterdir())
        plan = local.redacted_plan(archive, output)
        self.assertFalse(plan["archiveVerifiedThisRun"])
        self.assertFalse(plan["archivePathRecorded"])
        self.assertEqual(plan["payloadImport"], "STOP_PRIVATE_PAYLOAD_PATH_MISSING")
        self.assertEqual(plan["legalEvidenceSlots"], 0)
        self.assertNotIn(str(archive), json.dumps(plan))
        with self.assertRaisesRegex(ValueError, "LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED"):
            local.run(archive, output, authorized=False)
        with self.assertRaisesRegex(ValueError, "LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED"):
            local.run(archive, output, authorized=True)
        self.assertFalse(output.exists())
        self.assertEqual(sorted(path.name for path in original.iterdir()), kept)
        self.assertEqual(archive.read_bytes(), b"not-the-repack")
        self.assertEqual(len(plan["codeHead"]), 40)
        self.assertIn("official-truth-research-package.py", plan["scriptHashes"])

    def test_resume_adopts_package_written_before_the_journal(self):
        out = self.base / "adopt"
        names = ["AT"]
        identity = b.charge_identity("ab" * 32, out, names)
        first = b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        journal = (out / "checkpoint.jsonl").read_bytes()
        (out / "checkpoint.jsonl").unlink()
        self.calls.clear()
        second = b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        self.assertEqual(self.calls, [])
        self.assertEqual(second, first)
        self.assertEqual(b.verify(out, self.adapter, identity), first)
        self.assertEqual((out / "checkpoint.jsonl").read_bytes(), journal)
        kept = (out / "manifest.json").read_bytes()
        other = dict(identity)
        other["codeHead"] = "a" * 40
        with self.assertRaisesRegex(ValueError, "git_commit_identity"):
            b.prepare_resumable(self.source, out, names, self.adapter, identity=other)
        self.assertEqual((out / "manifest.json").read_bytes(), kept)

    def test_structural_hold_does_not_abort_the_following_destination(self):
        good = self.adapter["prepare"]

        def fail(root, country, package):
            if country == "IT":
                raise ValueError("slice_core")
            return good(root, country, package)

        self.adapter["prepare"] = fail
        out = self.base / "hold-on"
        names = list(b.ORDER[:3])
        identity = b.charge_identity("cd" * 32, out, names)
        result = b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        self.assertEqual(result["destinations"], 2)
        self.assertEqual(result["blockedCountries"], 1)
        self.assertEqual(result["published"], 0)
        seal = json.loads((out / "manifest.json").read_text())
        self.assertEqual(seal["blocked"][0]["reason"], "slice_core")
        self.assertTrue((out / "packages" / "FR").is_dir())
        self.assertEqual(b.verify(out, self.adapter, identity), result)

    def test_concurrent_lock_and_foreign_charge_do_not_overwrite(self):
        folder = self.base / "shared"
        folder.mkdir(mode=0o700)
        ready = self.base / "ready"
        stop = self.base / "stop"
        process = multiprocessing.Process(target=_hold_charge, args=(str(folder), str(ready), str(stop)))
        process.start()
        for _ in range(100):
            if ready.exists():
                break
            time.sleep(0.02)
        try:
            with self.assertRaisesRegex(ValueError, "checkpoint_busy"):
                b.acquire_charge(folder)
        finally:
            stop.write_text("stop")
            process.join(3)
        self.assertFalse(process.is_alive())
        out = self.base / "foreign"
        names = ["AT"]
        identity = b.charge_identity("ab" * 32, out, names)
        original = b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        package = (out / "packages" / "AT" / "manifest.json").read_bytes()
        foreign = b.charge_identity("ef" * 32, out, names)
        with self.assertRaisesRegex(ValueError, "checkpoint_identity_mismatch"):
            b.prepare_resumable(self.source, out, names, self.adapter, identity=foreign)
        self.assertEqual((out / "packages" / "AT" / "manifest.json").read_bytes(), package)
        self.assertEqual(b.verify(out, self.adapter, identity), original)

    def test_symlink_journal_and_output_inside_source_are_refused(self):
        target = self.base / "journal-target.jsonl"
        link = self.base / "journal-link.jsonl"
        link.symlink_to(target)
        identity = b.charge_identity("ab" * 32, self.base / "link", ["AT"])
        event = {**identity, "destination": "AT", "planDigest": "a" * 64,
                 "action": "quarantined", "accepted": 0, "published": 0}
        with self.assertRaisesRegex(ValueError, "symlink_refused"):
            b.append_checkpoint(link, event)
        self.assertFalse(target.exists())
        names = ["AT"]
        inside = self.source / "inside"
        with self.assertRaisesRegex(ValueError, "output_refused"):
            b.prepare_resumable(self.source, inside, names, self.adapter,
                                identity=b.charge_identity("ab" * 32, inside, names))

    def test_offline_charge_repeats_the_same_charge(self):
        out = self.base / "offline"
        names = ["AT"]
        identity = b.charge_identity("ab" * 32, out, names)
        report = local.offline_charge(self.source, out, names, self.adapter, identity)
        self.assertEqual(report, {"published": 0, "accepted": 0, "legalEvidenceSlots": 0,
                                  "destinations": 1, "blockedCountries": 0})

    def test_unbound_package_is_not_adopted(self):
        out = self.base / "adopt"
        names = ["AT"]
        identity = b.charge_identity("ab" * 32, out, names)
        b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        package = (out / "packages" / "AT" / "manifest.json").read_bytes()
        (out / "checkpoint.jsonl").unlink()
        (out / "packages" / "AT.charge.json").unlink()
        with self.assertRaisesRegex(ValueError, "unbound_package"):
            b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        self.assertEqual((out / "packages" / "AT" / "manifest.json").read_bytes(), package)
        self.assertFalse((out / "checkpoint.jsonl").exists())

    def test_schema_two_without_charge_is_refused(self):
        out = self.base / "resume"
        names = list(b.ORDER[:2])
        identity = b.charge_identity("ab" * 32, out, names)
        b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        seal_path = out / "manifest.json"
        seal = json.loads(seal_path.read_text())
        self.assertEqual(seal["schema"], 2)
        del seal["charge"]
        seal_path.write_text(json.dumps(seal) + "\n")
        with self.assertRaisesRegex(ValueError, "charge_missing"):
            b.verify(out, self.adapter, identity)

    def test_same_basename_is_a_different_output(self):
        out = self.base / "left" / "quarantine"
        out.parent.mkdir()
        names = ["AT"]
        identity = b.charge_identity("ab" * 32, out, names)
        b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        other = self.base / "right" / "quarantine"
        shutil.copytree(out, other)
        with self.assertRaisesRegex(ValueError, "output_identity_mismatch"):
            b.verify(other, self.adapter, identity)

    def test_journal_hold_contradiction_stops(self):
        good = self.adapter["prepare"]

        def fail(root, country, package):
            if country == "IT":
                raise ValueError("slice_core")
            return good(root, country, package)

        self.adapter["prepare"] = fail
        out = self.base / "hold-on"
        names = list(b.ORDER[:3])
        identity = b.charge_identity("cd" * 32, out, names)
        b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        seal_path = out / "manifest.json"
        seal = json.loads(seal_path.read_text())
        seal["blocked"][0]["reason"] = "tracker_row_conflict"
        seal_path.write_text(json.dumps(seal) + "\n")
        with self.assertRaisesRegex(ValueError, "hold_reason_mismatch"):
            b.verify(out, self.adapter, identity)

    def test_verify_waits_for_the_charge_lock(self):
        out = self.base / "resume"
        names = list(b.ORDER[:1])
        identity = b.charge_identity("ab" * 32, out, names)
        b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        ready = self.base / "ready"
        stop = self.base / "stop"
        process = multiprocessing.Process(target=_hold_charge, args=(str(out), str(ready), str(stop)))
        process.start()
        for _ in range(100):
            if ready.exists():
                break
            time.sleep(0.02)
        try:
            with self.assertRaisesRegex(ValueError, "checkpoint_busy"):
                b.verify(out, self.adapter, identity)
        finally:
            stop.write_text("stop")
            process.join(3)
        self.assertFalse(process.is_alive())
        self.assertEqual(b.verify(out, self.adapter, identity)["published"], 0)

    def test_local_run_does_not_read_without_acceptance(self):
        original = self.base / "closed-original"
        private = self.base / "closed-private"
        original.mkdir()
        private.mkdir()
        archive = original / "closed.xz"
        archive.write_bytes(b"closed")
        archive.chmod(0)
        output = private / "out"
        try:
            with self.assertRaisesRegex(ValueError, "LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED"):
                local.run(archive, output, authorized=True)
            mismatched = {"gitCommit": "a" * 40, "scriptHashes": b.execution_script_hashes(),
                          "archiveSha256": "ab" * 32, "fixture": True}
            with self.assertRaisesRegex(ValueError, "git_commit_identity"):
                local.run(archive, output, acceptance=mismatched)
            mismatched["gitCommit"] = b.repository_commit()
            mismatched["scriptHashes"] = "{}"
            with self.assertRaisesRegex(ValueError, "script_hash_mismatch"):
                local.run(archive, output, acceptance=mismatched)
        finally:
            archive.chmod(0o600)
        self.assertFalse(output.exists())
        self.assertEqual(archive.read_bytes(), b"closed")
        self.assertEqual([path.name for path in original.iterdir()], ["closed.xz"])

    def test_fixture_cannot_claim_a_real_pin(self):
        original = self.base / "claimed-original"
        private = self.base / "claimed-private"
        original.mkdir()
        private.mkdir()
        archive = original / "claimed.xz"
        archive.write_bytes(b"not-a-pin")
        archive.chmod(0)
        output = private / "out"
        acceptance = {"gitCommit": b.repository_commit(), "scriptHashes": b.execution_script_hashes(),
                      "archiveSha256": b.LOCAL_REPACK_SHA256, "fixture": True}
        try:
            with self.assertRaisesRegex(ValueError, "fixture_cannot_replace_pin"):
                local.run(archive, output, acceptance=acceptance, destinations=["AT"], adapter=self.adapter)
        finally:
            archive.chmod(0o600)
        self.assertFalse(output.exists())
        self.assertEqual([path.name for path in original.iterdir()], ["claimed.xz"])

    def test_cli_cannot_open_the_archive(self):
        archive = self.base / "cli.xz"
        archive.write_bytes(b"cli")
        archive.chmod(0)
        output = self.base / "cli-out"
        importer = Path(__file__).with_name("official-truth-50-pass-import.py")
        runner = Path(__file__).with_name("official-truth-local-offline-run.py")
        try:
            prepared = subprocess.run(
                [sys.executable, str(importer), "prepare", "--archive", str(archive), "--output", str(output)],
                check=False, capture_output=True, text=True)
            self.assertEqual(prepared.returncode, 1)
            self.assertIn("local_gate_required", prepared.stderr)
            flagged = subprocess.run(
                [sys.executable, str(runner), "--archive", str(archive), "--output", str(output),
                 "--after-tl-acceptance"],
                check=False, capture_output=True, text=True)
            self.assertEqual(flagged.returncode, 2)
            self.assertIn("LOCAL_ARCHIVE_RUN_NOT_AUTHORIZED", flagged.stderr)
            imported = subprocess.run([sys.executable, str(importer), "import"], check=False, capture_output=True, text=True)
            self.assertEqual(imported.returncode, 2)
            self.assertIn("PRIVATE_PAYLOAD_PATH_STOP", imported.stderr)
        finally:
            archive.chmod(0o600)
        self.assertFalse(output.exists())
        self.assertEqual(archive.read_bytes(), b"cli")

    def test_fixture_run_prepares_resumes_and_verifies(self):
        original = self.base / "run-original"
        private = self.base / "run-private"
        original.mkdir()
        private.mkdir(mode=0o700)
        archive = original / "fixture.tar.xz"
        _fixture_archive(archive)
        before = archive.read_bytes()
        archive.chmod(0o444)
        output = private / "out"
        kept = sorted((path.name, path.lstat().st_mode, path.lstat().st_size) for path in original.iterdir())
        acceptance = {"gitCommit": b.repository_commit(), "scriptHashes": b.execution_script_hashes(),
                      "archiveSha256": b.digest(archive), "fixture": True}
        report = local.run(archive, output, authorized=False, acceptance=acceptance,
                           destinations=["AT"], adapter=self.adapter)
        self.assertEqual(archive.read_bytes(), before)
        self.assertEqual(archive.stat().st_mode & 0o777, 0o444)
        self.assertEqual(sorted((path.name, path.lstat().st_mode, path.lstat().st_size)
                                for path in original.iterdir()), kept)
        self.assertFalse(report["archiveVerifiedThisRun"])
        self.assertTrue(report["fixture"])
        self.assertEqual(report["legalEvidenceSlots"], 0)
        self.assertEqual(report["published"], 0)
        self.assertEqual(report["accepted"], 0)
        self.assertEqual(report["payloadImport"], "STOP_PRIVATE_PAYLOAD_PATH_MISSING")
        self.assertEqual(report["diagnosis"]["status"], "not_run_tree_absent")
        self.assertEqual(report["diagnosis"]["legalEvidenceSlots"], 0)
        self.assertTrue(report["diagnosis"]["inventoryIsNotAPass"])
        encoded = json.dumps(report)
        self.assertNotIn(str(archive), encoded)
        self.assertNotIn(str(output), encoded)
        package = (output / "packages" / "AT" / "manifest.json").read_bytes()
        journal = (output / "checkpoint.jsonl").read_bytes()
        (output / "checkpoint.jsonl").unlink()
        resumed = local.run(archive, output, acceptance=acceptance, destinations=["AT"], adapter=self.adapter)
        self.assertEqual((output / "packages" / "AT" / "manifest.json").read_bytes(), package)
        self.assertEqual((output / "checkpoint.jsonl").read_bytes(), journal)
        self.assertEqual(archive.read_bytes(), before)
        self.assertEqual(archive.stat().st_mode & 0o777, 0o444)
        self.assertEqual(sorted((path.name, path.lstat().st_mode, path.lstat().st_size)
                                for path in original.iterdir()), kept)
        self.assertEqual(resumed["published"], 0)
        self.assertEqual(resumed["legalEvidenceSlots"], 0)
        identity = b.charge_identity(b.digest(archive), output, ["AT"])
        self.assertEqual(b.verify(output, self.adapter, identity)["accepted"], 0)

    def test_gated_run_diagnoses_the_temporary_tree_and_returns_sums_only(self):
        original = self.base / "diagnose-original"
        private = self.base / "diagnose-private"
        original.mkdir()
        private.mkdir(mode=0o700)
        archive = original / "research.tar.xz"
        _research_tree_archive(archive)
        before = archive.read_bytes()
        archive.chmod(0o444)
        output = private / "out"
        acceptance = {"gitCommit": b.repository_commit(), "scriptHashes": b.execution_script_hashes(),
                      "archiveSha256": b.digest(archive), "fixture": True}
        report = local.run(archive, output, acceptance=acceptance, destinations=["AT"], adapter=self.adapter)
        diagnosis = report["diagnosis"]
        self.assertEqual(diagnosis["status"], "collected")
        self.assertEqual(diagnosis["legalEvidenceSlots"], 0)
        self.assertEqual(diagnosis["published"], 0)
        self.assertTrue(diagnosis["inventoryIsNotAPass"])
        self.assertEqual(diagnosis["pairsExamined"], 206 * 50)
        self.assertEqual(diagnosis["destinationsExamined"], 206)
        self.assertEqual(sum(diagnosis["profileStatus"].values()), diagnosis["pairsExamined"])
        self.assertNotIn("findings", diagnosis)
        self.assertNotIn("candidates", diagnosis)
        encoded = json.dumps(report)
        self.assertNotIn(str(archive), encoded)
        self.assertNotIn(str(output), encoded)
        self.assertNotIn(str(original), encoded)
        self.assertFalse(any(path.name.startswith(".jetnity-local-src-") for path in private.iterdir()))
        self.assertFalse(any(path.name.startswith(".jetnity-local-src-") for path in original.iterdir()))
        self.assertEqual(archive.read_bytes(), before)
        self.assertEqual(archive.stat().st_mode & 0o777, 0o444)

    def test_original_directory_rejects_aliases_and_keeps_its_bytes(self):
        original = self.base / "protected"
        private = self.base / "protected-private"
        original.mkdir()
        private.mkdir()
        archive = original / "fixture.tar.xz"
        _fixture_archive(archive)
        payload = archive.read_bytes()
        archive.chmod(0)
        names = sorted(path.name for path in original.iterdir())
        try:
            for output in (original / "inside", original, self.base, private / ".." / "protected" / "out"):
                with self.assertRaisesRegex(ValueError, "output_refused"):
                    local.run(archive, output, authorized=True)
            alias = self.base / "protected-alias"
            alias.symlink_to(original, target_is_directory=True)
            with self.assertRaisesRegex(ValueError, "symlink_refused"):
                local.run(archive, alias / "out", authorized=True)
            tree = self.base / "other-worktree"
            (tree / ".git").mkdir(parents=True)
            with self.assertRaisesRegex(ValueError, "output_refused"):
                local.run(archive, tree / "out", authorized=True)
            self.assertEqual([path.name for path in tree.iterdir()], [".git"])
            os.link(archive, private / "linked-out")
            with self.assertRaisesRegex(ValueError, "hardlink_refused"):
                local.run(archive, private / "linked-out", authorized=True)
            (private / "linked-out").unlink()
        finally:
            archive.chmod(0o644)
        self.assertEqual(sorted(path.name for path in original.iterdir()), names)
        self.assertEqual(archive.read_bytes(), payload)
        self.assertFalse(any(path.name.startswith(".jetnity-local-src-") for path in original.iterdir()))

    def test_writable_original_is_not_opened(self):
        original = self.base / "writable-original"
        private = self.base / "writable-private"
        original.mkdir()
        private.mkdir()
        archive = original / "fixture.tar.xz"
        _fixture_archive(archive)
        payload = archive.read_bytes()
        acceptance = {"gitCommit": b.repository_commit(), "scriptHashes": b.execution_script_hashes(),
                      "archiveSha256": b.digest(archive), "fixture": True}
        archive.chmod(0o200)
        try:
            with self.assertRaisesRegex(ValueError, "archive_not_readonly"):
                local.run(archive, private / "out", acceptance=acceptance, destinations=["AT"],
                          adapter=self.adapter)
        finally:
            archive.chmod(0o644)
        self.assertFalse((private / "out").exists())
        self.assertEqual(archive.read_bytes(), payload)
        self.assertEqual([path.name for path in original.iterdir()], ["fixture.tar.xz"])

    def test_schema_two_cannot_drop_to_schema_one(self):
        out = self.base / "downgrade"
        names = ["AT"]
        identity = b.charge_identity("ab" * 32, out, names)
        b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        self.assertEqual(b.verify(out, self.adapter, identity)["published"], 0)
        with self.assertRaisesRegex(ValueError, "charge_identity_missing"):
            b.verify(out, self.adapter)
        manifest = (out / "manifest.json").read_bytes()
        journal = (out / "checkpoint.jsonl").read_bytes()
        binding = (out / "packages" / "AT.charge.json").read_bytes()
        lock = out / "charge.lock"

        def restore() -> None:
            (out / "manifest.json").write_bytes(manifest)
            (out / "checkpoint.jsonl").write_bytes(journal)
            (out / "packages" / "AT.charge.json").write_bytes(binding)
            if not lock.exists():
                lock.write_bytes(b"")

        def rewrite(mutate) -> None:
            seal = json.loads(manifest)
            mutate(seal)
            (out / "manifest.json").write_text(json.dumps(seal) + "\n")

        try:
            rewrite(lambda seal: seal.__setitem__("schema", 1))
            with self.assertRaisesRegex(ValueError, "schema_downgrade_refused"):
                b.verify(out, self.adapter, identity)
            restore()
            rewrite(lambda seal: seal.pop("sealVersion"))
            with self.assertRaisesRegex(ValueError, "schema_downgrade_refused"):
                b.verify(out, self.adapter, identity)
            restore()
            rewrite(lambda seal: seal.pop("charge"))
            with self.assertRaisesRegex(ValueError, "charge_missing"):
                b.verify(out, self.adapter, identity)
            restore()
            (out / "checkpoint.jsonl").unlink()
            with self.assertRaisesRegex(ValueError, "journal_incomplete"):
                b.verify(out, self.adapter, identity)
            restore()
            lock.unlink()
            with self.assertRaisesRegex(ValueError, "charge_lock_missing"):
                b.verify(out, self.adapter, identity)
            self.assertFalse(lock.exists())
            restore()
            rewrite(lambda seal: (seal.__setitem__("schema", 1), seal.pop("sealVersion", None), seal.pop("charge", None)))
            (out / "checkpoint.jsonl").unlink()
            lock.unlink()
            with self.assertRaisesRegex(ValueError, "schema_downgrade_refused"):
                b.verify(out, self.adapter, identity)
            self.assertFalse(lock.exists())
            restore()
            rewrite(lambda seal: (seal.__setitem__("schema", 1), seal.pop("sealVersion", None), seal.pop("charge", None)))
            (out / "checkpoint.jsonl").unlink()
            lock.unlink()
            (out / "packages" / "AT.charge.json").unlink()
            with self.assertRaisesRegex(ValueError, "schema_downgrade_refused"):
                b.verify(out, self.adapter, identity)
            restore()
            foreign = dict(identity)
            foreign["archiveSha256"] = "cd" * 32
            with self.assertRaisesRegex(ValueError, "checkpoint_identity_mismatch"):
                b.verify(out, self.adapter, foreign)
            body = json.loads(binding)
            body["planDigest"] = "ab" * 32
            (out / "packages" / "AT.charge.json").write_text(json.dumps(body) + "\n")
            with self.assertRaisesRegex(ValueError, "unbound_package"):
                b.verify(out, self.adapter, identity)
        finally:
            restore()


PASSPORTS = ("IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR "
              "GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL").split()


def _research_record(adapter, country: str, nationality: str) -> dict:
    record = {key: {} for key in adapter["CORE"]}
    record.update({
        "schema": adapter["SCHEMA"], "status": "RESEARCH_ONLY", "nationality": nationality,
        "destination_iso2": country, "researched_at": "2026-11-12T20:00:00+01:00",
        "sources": [{"ref": "S1", "role": "primary_destination_official",
                     "url": "https://example.invalid/source", "retrieved_at": "2026-11-12T20:00:00+01:00"}],
        "conflicts": [], "cross_check_result": "no_second_source", "external_writes": [],
    })
    return record


def _research_index(adapter, country: str) -> dict:
    return {
        "schema": adapter["SCHEMA"], "status": "RESEARCH_ONLY", "dest_id": country,
        "destination_iso2": country, "file_layout": "split", "external_writes": [],
        "expected_nationality_slices": PASSPORTS,
        "slice_files": [f"records/dest/{country}/{code}.json" for code in PASSPORTS],
        "slices_by_nationality": {code: index for index, code in enumerate(PASSPORTS)},
        "nationality_slices": [{"nationality": code, "file": f"records/dest/{country}/{code}.json"}
                               for code in PASSPORTS],
        "migration": {"from": f"records/dest/{country}.json", "unsplit_preserved_0444": True,
                      "to": f"records/dest/{country}/index.json + records/dest/{country}/{{NAT}}.json"},
    }


def _synthetic_research_root(root: Path, countries: list[str], valid: set[str], migrations: dict,
                             slice_holds: set[str]) -> None:
    """Synthetic pairs only. This is not the Mac archive."""
    adapter = b.original_adapter()
    root.mkdir(parents=True)
    (root / "record-schema.json").write_text(json.dumps({
        "schema": adapter["SCHEMA"], "status": "RESEARCH_ONLY",
        "nationality_slice": {"mandatory_core_fields": list(adapter["CORE"])},
    }) + "\n")
    (root / "passport-priority.csv").write_text(
        "rank,nationality_iso2\n" + "".join(f"{index + 1},{code}\n" for index, code in enumerate(PASSPORTS)))
    tracker = ["dest_id,nationality,record_pointer,conflict"]
    dest = root / "records" / "dest"
    dest.mkdir(parents=True)
    for country in countries:
        folder = dest / country
        folder.mkdir()
        tracker.extend(f"{country},{code},records/dest/{country}/{code}.json," for code in PASSPORTS)
        if country in valid:
            index = _research_index(adapter, country)
            index.pop("migration")
            (folder / "index.json").write_text(json.dumps(index) + "\n")
            for code in PASSPORTS:
                (folder / f"{code}.json").write_text(json.dumps(_research_record(adapter, country, code)) + "\n")
            continue
        for code in PASSPORTS:
            (folder / f"{code}.json").write_text("{}\n")
        if country in b.STRUCTURAL_HOLDS:
            (folder / "index.json").write_text(json.dumps({
                "schema": adapter["SCHEMA"], "status": "RESEARCH_ONLY", "dest_id": country,
                "destination_iso2": country,
            }) + "\n")
            continue
        if country in slice_holds:
            index = _research_index(adapter, country)
            index.pop("migration")
            (folder / "index.json").write_text(json.dumps(index) + "\n")
            continue
        if country in migrations:
            index = _research_index(adapter, country)
            index["migration"] = migrations[country]
            (folder / "index.json").write_text(json.dumps(index) + "\n")
            (dest / f"{country}.json").write_text('{"legacy":"synthetic"}\n')
            continue
        (folder / "index.json").write_text('{"schema":"not-a-documented-schema"}\n')
    (root / "tracker.csv").write_text("\n".join(tracker) + "\n")


class RealAdapterHoldTests(unittest.TestCase):
    def setUp(self):
        self.base = Path(tempfile.mkdtemp(prefix="jetnity-real-hold-"))
        self.addCleanup(lambda: shutil.rmtree(self.base))
        self.adapter = b.original_adapter()

    def test_migration_hold_keeps_the_following_destination_and_one_journal_line(self):
        countries = list(b.ORDER[:8])
        root = self.base / "tree"
        _synthetic_research_root(root, countries, valid={"IT"}, migrations={"AT": None, "FR": []},
                                 slice_holds={"ES"})
        original = (root / "records/dest/AT.json").read_bytes()
        index_before = (root / "records/dest/AT/index.json").read_bytes()
        out = self.base / "out"
        identity = b.charge_identity("cd" * 32, out, countries)
        first = b.prepare_resumable(root, out, countries, self.adapter, identity=identity)
        self.assertEqual(first["published"], 0)
        self.assertEqual(first["accepted"], 0)
        self.assertEqual(first["blockedCountries"], 7)
        self.assertEqual(first["destinations"], 1)
        self.assertTrue((out / "packages" / "IT").is_dir())
        self.assertFalse((out / "packages" / "AT").exists())
        seal = json.loads((out / "manifest.json").read_text())
        reasons = {row["country"]: row["reason"] for row in seal["blocked"]}
        self.assertEqual(reasons["AT"], "ambiguous_split_and_legacy")
        self.assertEqual(reasons["FR"], "ambiguous_split_and_legacy")
        self.assertEqual(reasons["ES"], "slice_identity")
        self.assertEqual(reasons["HR"], "unsplit_research_frame_not_importable")
        self.assertEqual(reasons["NL"], "unsplit_research_frame_not_importable")
        self.assertEqual(seal["legalEvidenceSlots"], 0)
        self.assertEqual(seal["schema"], 2)
        journal = (out / "checkpoint.jsonl").read_bytes()
        self.assertEqual(journal.count(b"\n"), len(countries))
        self.assertEqual((root / "records/dest/AT.json").read_bytes(), original)
        self.assertEqual((root / "records/dest/AT/index.json").read_bytes(), index_before)
        second = b.prepare_resumable(root, out, countries, self.adapter, identity=identity)
        self.assertEqual(second, first)
        self.assertEqual((out / "checkpoint.jsonl").read_bytes(), journal)
        self.assertEqual(b.verify(out, self.adapter, identity), first)
        diagnosis = self.adapter["diagnose"](root)
        self.assertEqual(diagnosis["legalEvidenceSlots"], 0)
        self.assertEqual(diagnosis["pairsExamined"], 206 * 50)
        self.assertFalse(any(row["destination"] == "AT" for row in diagnosis["candidates"]))
        self.assertIn("ambiguous_split_and_legacy", [row["code"] for row in diagnosis["findings"] if row["destination"] == "AT"])
        held = (out / "blocked" / "AT.json").read_bytes()
        seal["blocked"][0]["reason"] = "tracker_row_conflict"
        (out / "manifest.json").write_text(json.dumps(seal) + "\n")
        with self.assertRaisesRegex(ValueError, "hold_reason_mismatch"):
            b.verify(out, self.adapter, identity)
        seal["blocked"][0]["reason"] = "ambiguous_split_and_legacy"
        (out / "manifest.json").write_text(json.dumps(seal) + "\n")
        (out / "blocked" / "AT.json").write_bytes(held + b" ")
        with self.assertRaisesRegex(ValueError, "blocked_original_changed|hold_digest_mismatch"):
            b.verify(out, self.adapter, identity)
        (out / "blocked" / "AT.json").write_bytes(held)
        binding = json.loads((out / "blocked" / "AT.charge.json").read_text())
        binding["charge"]["archiveSha256"] = "ab" * 32
        (out / "blocked" / "AT.charge.json").write_text(json.dumps(binding) + "\n")
        with self.assertRaisesRegex(ValueError, "checkpoint_identity_mismatch|unbound_package"):
            b.verify(out, self.adapter, identity)

    def test_unknown_adapter_error_still_stops(self):
        countries = ["AT"]
        root = self.base / "stop-tree"
        _synthetic_research_root(root, countries, valid=set(), migrations={}, slice_holds=set())
        out = self.base / "stop-out"
        identity = b.charge_identity("ce" * 32, out, countries)
        real = self.adapter["prepare"]

        def explode(source, country, package):
            raise ValueError("not_a_structural_hold")

        self.adapter["prepare"] = explode
        try:
            with self.assertRaisesRegex(ValueError, "not_a_structural_hold"):
                b.prepare_resumable(root, out, countries, self.adapter, identity=identity)
        finally:
            self.adapter["prepare"] = real
        self.assertFalse(out.exists())
        self.assertTrue(callable(real))

    def test_full_catalog_hold_is_bound_and_is_not_a_priority_pass(self):
        countries = list(b.ORDER)
        root = self.base / "catalog"
        late = countries[16]
        later = countries[40]
        self.assertNotIn(late, b.STRUCTURAL_HOLDS)
        self.assertNotIn(later, b.STRUCTURAL_HOLDS)
        self.assertGreater(countries.index(later), 17)
        _synthetic_research_root(root, countries, valid=set(), migrations={late: None, later: []}, slice_holds=set())
        pairs = [path for path in (root / "records/dest").glob("*/*.json") if path.stem in PASSPORTS]
        self.assertEqual(len(pairs), 206 * 50)
        out = self.base / "catalog-out"
        identity = b.charge_identity("cf" * 32, out, countries)
        first = b.prepare_resumable(root, out, countries, self.adapter, identity=identity)
        self.assertEqual(first["destinations"], 0)
        self.assertEqual(first["blockedCountries"], 206)
        self.assertEqual(first["passports"], 0)
        self.assertEqual(first["accepted"], 0)
        self.assertEqual(first["published"], 0)
        seal = json.loads((out / "manifest.json").read_text())
        self.assertEqual(seal["legalEvidenceSlots"], 0)
        self.assertIsNone(seal["priorityFileSha256"])
        self.assertFalse(seal["priorityBound"])
        self.assertEqual(seal["destinationOrder"], countries)
        reasons = {row["country"]: row["reason"] for row in seal["blocked"]}
        self.assertEqual(reasons[late], "ambiguous_split_and_legacy")
        self.assertEqual(reasons[later], "ambiguous_split_and_legacy")
        self.assertEqual((out / "checkpoint.jsonl").read_bytes().count(b"\n"), 206)
        self.assertFalse(any((out / "packages" / country).exists() for country in countries))
        journal = (out / "checkpoint.jsonl").read_bytes()
        second = b.prepare_resumable(root, out, countries, self.adapter, identity=identity)
        self.assertEqual(second, first)
        self.assertEqual((out / "checkpoint.jsonl").read_bytes(), journal)
        self.assertEqual(b.verify(out, self.adapter, identity), first)


def _research_tree_archive(path: Path) -> None:
    """A synthetic research inventory. It is not the Mac archive."""
    adapter = b.original_adapter()
    codes = ("IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR "
             "GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL").split()
    schema = json.dumps({"schema": adapter["SCHEMA"], "status": "RESEARCH_ONLY",
                         "nationality_slice": {"mandatory_core_fields": list(adapter["CORE"])}}).encode()
    priority = ("rank,nationality_iso2\n" + "".join(f"{index + 1},{code}\n" for index, code in enumerate(codes))).encode()
    tracker = b"dest_id,nationality,record_pointer,conflict\n"
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:xz") as package:
        for name, payload in (("record-schema.json", schema), ("passport-priority.csv", priority),
                              ("tracker.csv", tracker)):
            info = tarfile.TarInfo(name)
            info.size = len(payload)
            package.addfile(info, io.BytesIO(payload))
        folder = tarfile.TarInfo("records/dest")
        folder.type = tarfile.DIRTYPE
        folder.mode = 0o700
        package.addfile(folder)
    path.write_bytes(buffer.getvalue())


def _fixture_archive(path: Path) -> None:
    payload = b"synthetic-fixture\n"
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:xz") as package:
        info = tarfile.TarInfo("marker.txt")
        info.size = len(payload)
        package.addfile(info, io.BytesIO(payload))
    path.write_bytes(buffer.getvalue())


def _hold_charge(directory: str, ready: str, stop: str) -> None:
    import fcntl
    import os
    import time as _time
    from pathlib import Path as _Path
    folder = _Path(directory)
    descriptor = os.open(folder / "charge.lock", os.O_CREAT | os.O_RDWR, 0o600)
    fcntl.flock(descriptor, fcntl.LOCK_EX)
    _Path(ready).write_text("ready")
    while not _Path(stop).exists():
        _time.sleep(0.02)
    os.close(descriptor)


if __name__ == "__main__":
    unittest.main()
