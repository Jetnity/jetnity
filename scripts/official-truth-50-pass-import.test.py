"""Synthetic tests: 50-pass research imports cannot publish or partially complete."""
import importlib.util
import json
import multiprocessing
from pathlib import Path
import shutil
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
        identity = b.charge_identity("ab" * 32, "checkpoint", ["AT", "IT", "FR"])
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
        event = {**b.charge_identity("ab" * 32, "checkpoint", ["AT"]), "destination": "AT",
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
        identity = b.charge_identity("ab" * 32, "resume", names)
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
        self.assertEqual(b.verify(out, self.adapter), result)

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
        archive = self.base / "repack.xz"
        archive.write_bytes(b"not-the-repack")
        output = self.base / "private-out"
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
        self.assertEqual(len(plan["codeHead"]), 40)
        self.assertIn("official-truth-research-package.py", plan["scriptHashes"])

    def test_resume_adopts_package_written_before_the_journal(self):
        names = ["AT"]
        identity = b.charge_identity("ab" * 32, "adopt", names)
        out = self.base / "adopt"
        first = b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        journal = (out / "checkpoint.jsonl").read_bytes()
        (out / "checkpoint.jsonl").unlink()
        self.calls.clear()
        second = b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        self.assertEqual(self.calls, [])
        self.assertEqual(second, first)
        self.assertEqual(b.verify(out, self.adapter), first)
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
        names = list(b.ORDER[:3])
        identity = b.charge_identity("cd" * 32, "hold-on", names)
        out = self.base / "hold-on"
        result = b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        self.assertEqual(result["destinations"], 2)
        self.assertEqual(result["blockedCountries"], 1)
        self.assertEqual(result["published"], 0)
        seal = json.loads((out / "manifest.json").read_text())
        self.assertEqual(seal["blocked"][0]["reason"], "slice_core")
        self.assertTrue((out / "packages" / "FR").is_dir())
        self.assertEqual(b.verify(out, self.adapter), result)

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
        names = ["AT"]
        identity = b.charge_identity("ab" * 32, "foreign", names)
        out = self.base / "foreign"
        original = b.prepare_resumable(self.source, out, names, self.adapter, identity=identity)
        package = (out / "packages" / "AT" / "manifest.json").read_bytes()
        foreign = b.charge_identity("ef" * 32, "foreign", names)
        with self.assertRaisesRegex(ValueError, "checkpoint_identity_mismatch"):
            b.prepare_resumable(self.source, out, names, self.adapter, identity=foreign)
        self.assertEqual((out / "packages" / "AT" / "manifest.json").read_bytes(), package)
        self.assertEqual(b.verify(out, self.adapter), original)

    def test_symlink_journal_and_output_inside_source_are_refused(self):
        target = self.base / "journal-target.jsonl"
        link = self.base / "journal-link.jsonl"
        link.symlink_to(target)
        identity = b.charge_identity("ab" * 32, "link", ["AT"])
        event = {**identity, "destination": "AT", "planDigest": "a" * 64,
                 "action": "quarantined", "accepted": 0, "published": 0}
        with self.assertRaisesRegex(ValueError, "symlink_refused"):
            b.append_checkpoint(link, event)
        self.assertFalse(target.exists())
        names = ["AT"]
        with self.assertRaisesRegex(ValueError, "output_refused"):
            b.prepare_resumable(self.source, self.source / "inside", names, self.adapter,
                                identity=b.charge_identity("ab" * 32, "inside", names))

    def test_offline_charge_repeats_the_same_charge(self):
        names = ["AT"]
        identity = b.charge_identity("ab" * 32, "offline", names)
        out = self.base / "offline"
        report = local.offline_charge(self.source, out, names, self.adapter, identity)
        self.assertEqual(report, {"published": 0, "accepted": 0, "legalEvidenceSlots": 0,
                                  "destinations": 1, "blockedCountries": 0})


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
