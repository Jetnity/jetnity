#!/usr/bin/env python3
"""One-command PRIVATE research staging: AT -> IT -> FR -> ES -> PT.
Uses the owner's exact original 206x50 archive. No DB, network or publication.
Passports and 26 topics stay unavailable until per-rule official qualification.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import stat
import tarfile
import tempfile

ARCHIVE_SHA = "6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5"
PRIORITY_SHA = "4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358"
COUNTRIES = ("AT", "IT", "FR", "ES", "PT")
PREFIX = "entry-requirements/"

def require(ok, message):
    if not ok:
        raise ValueError(message)

def load_local(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    require(spec is not None and spec.loader is not None, "missing_local_adapter")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def stage(archive: Path, output: Path):
    require(not archive.is_symlink() and archive.is_file(), "archive_regular_file_required")
    source = archive.stat()
    require(stat.S_ISREG(source.st_mode) and 0 < source.st_size <= 8 * 1024 * 1024,
            "source_archive_size_refused")
    with archive.open("rb") as original:
        require(hashlib.file_digest(original, "sha256").hexdigest() == ARCHIVE_SHA,
                "original_archive_identity_refused")
    parent = output.parent.resolve(strict=True)
    require(parent.is_dir() and not output.exists() and not output.is_symlink()
            and output.name not in ("", ".", ".."), "new_private_output_required")
    research = load_local("jetnity_original_research_package",
        Path(__file__).with_name("official-truth-research-package.py"))
    eu_proof = load_local("jetnity_eu_research_proof",
        Path(__file__).with_name("official-truth-europe-four-research-proof.py"))
    source_ref_review = load_local("jetnity_ref_reconciliation",
        Path(__file__).with_name("official-truth-source-ref-reconciliation-v1.py"))
    require(eu_proof.proof(archive)["accepted"] == 0, "eu_evidence_review_refused")
    with tempfile.TemporaryDirectory(prefix=".official-truth-five-", dir=parent) as temp_name:
        temp = Path(temp_name)
        root = temp / "entry-requirements"
        root.mkdir(mode=0o700)
        target = temp / "release"
        target.mkdir(mode=0o700)
        with tarfile.open(archive, "r:xz") as bundle:
            entries = bundle.getmembers()
            require(0 < len(entries) <= 12000, "archive_entries_refused")
            seen = set()
            catalog = {}
            for item in entries:
                name = item.name.rstrip("/") if item.isdir() else item.name
                require(name not in seen and (name == "entry-requirements"
                        or name.startswith(PREFIX))
                        and not name.startswith("/")
                        and all(part not in ("", ".", "..") for part in name.split("/"))
                        and (item.isfile() or item.isdir())
                        and item.size <= 32 * 1024 * 1024, "archive_member_refused")
                seen.add(name)
                if item.isfile():
                    catalog[name] = item
            def read_item(relative: str, maximum: int):
                member = catalog.get(PREFIX + relative)
                require(member is not None and member.size <= maximum, "original_record_missing")
                stream = bundle.extractfile(member)
                require(stream is not None, "original_record_unreadable")
                with stream:
                    data = stream.read(maximum + 1)
                require(len(data) == member.size, "original_record_length_refused")
                return data
            priority = read_item("passport-priority.csv", 128 * 1024)
            require(hashlib.sha256(priority).hexdigest() == PRIORITY_SHA,
                    "original_passport_priority_refused")
            passports = research.priority(priority)
            selected = {
                "record-schema.json": 256 * 1024,
                "passport-priority.csv": 128 * 1024,
                "tracker.csv": 32 * 1024 * 1024,
            }
            if PREFIX + "STAGING_RECEIPT.json" in catalog:
                selected["STAGING_RECEIPT.json"] = 64 * 1024
            for country in COUNTRIES:
                selected[f"records/dest/{country}/index.json"] = 8 * 1024 * 1024
                if PREFIX + f"records/dest/{country}.json" in catalog:
                    selected[f"records/dest/{country}.json"] = 8 * 1024 * 1024
                for passport in passports:
                    selected[f"records/dest/{country}/{passport}.json"] = 1024 * 1024
            total = 0
            for name, limit in selected.items():
                data = read_item(name, limit)
                total += len(data)
                require(total <= 96 * 1024 * 1024, "staging_byte_budget_refused")
                dest = root / name
                dest.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
                with dest.open("xb") as f:
                    os.chmod(dest, 0o600)
                    f.write(data)
        counts = {}
        reference_reviews = {}
        for country in COUNTRIES:
            private = target / country
            counts[country] = research.prepare(root, country, private)
            require(research.verify(private) == counts[country], "package_verify_refused")
            require(counts[country]["passports"] == 50
                    and counts[country]["topicSlots"] == 1300
                    and counts[country]["accepted"] == 0
                    and counts[country]["published"] == 0, "release_count_refused")
            reference_reviews[country] = source_ref_review.reconcile(root, country, passports, private)
            require(reference_reviews[country]["reviewedSlots"] == 1300
                    and reference_reviews[country]["positiveLegalRules"] == 0
                    and reference_reviews[country]["published"] == 0,
                    "source_ref_review_release_refused")
            ref_report = private / "source-reference-review.json"
            require(ref_report.is_file() and not ref_report.is_symlink()
                    and ref_report.stat().st_size <= 2 * 1024 * 1024,
                    "source_review_file_bound_refused")
            reference_reviews[country]["reviewJsonSha256"] = hashlib.sha256(
                ref_report.read_bytes()).hexdigest()
        index = {
            "schema": 1, "kind": "official_truth_private_five_country_research",
            "destinationOrder": list(COUNTRIES), "passportsPerDestination": 50,
            "topicsPerDestination": 26, "totalPassports": 250,
            "totalTopicSlots": 6500, "status": "RESEARCH_ONLY",
            "legalRulesVerified": 0, "publicationAuthority": "none",
            "productionAllowed": False, "ownerAAL2Required": True,
            "sourceOfTruth": "original_owner_archive_pinned",
            "unavailableText": "derzeit nicht verfügbar",
            "countryCounts": counts,
            "sourceReferenceReviews": reference_reviews,
        }
        with (target / "private-release-index.json").open("x", encoding="utf-8") as out:
            os.chmod(target / "private-release-index.json", 0o600)
            json.dump(index, out, ensure_ascii=False, separators=(",", ":"))
            out.write("\n")
        require(not output.exists(), "concurrent_output_refused")
        os.rename(target, output)
    return {"destinations": 5, "passports": 250, "topics": 6500,
            "accepted": 0, "published": 0, "classification": "RESEARCH_ONLY"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(stage(args.archive, args.output),
                         separators=(",", ":")))
    except (OSError, ValueError, KeyError, TypeError, RuntimeError, tarfile.TarError):
        raise SystemExit("OFFICIAL_TRUTH_PRIVATE_BUNDLE_REFUSED accepted=0 published=0")
