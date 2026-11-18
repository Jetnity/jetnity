"""Synthetic tests: 50-pass research imports cannot publish or partially complete."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

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


if __name__ == "__main__":
    unittest.main()
