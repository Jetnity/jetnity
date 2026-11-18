"""Atomic 50-passport research-only import into private filesystem quarantine.

Never writes a database, triggers an Official Truth method, or publishes travel advice.
The existing validated per-destination adapter owns all research record checks.
A separate, Owner-approved V3 importer is required for positive Dev facts.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import runpy
import shutil
import stat
import sys
import tarfile
import tempfile

ORDER = ("AT", "IT", "FR", "ES", "PT", "GR", "HR", "NL", "GB", "US", "TR", "TH", "AE")
ARCHIVE_SHA256 = "6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5"
MAX_ARCHIVE_BYTES = 8 * 1024 * 1024
MAX_UNPACKED_BYTES = 256 * 1024 * 1024
MAX_FILE_BYTES = 8 * 1024 * 1024
MAX_MEMBERS = 20_000


def require(value: bool, reason: str) -> None:
    if not value:
        raise ValueError(reason)


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def original_adapter():
    source = Path(__file__).with_name("official-truth-research-package.py")
    require(source.is_file() and not source.is_symlink(), "reviewed_adapter_missing")
    return runpy.run_path(str(source))


def extract_pinned_archive(archive: Path, staging: Path) -> Path:
    entry = archive.lstat()
    require(stat.S_ISREG(entry.st_mode) and 0 < entry.st_size <= MAX_ARCHIVE_BYTES, "invalid_archive")
    require(digest(archive) == ARCHIVE_SHA256, "unreviewed_archive")
    target = staging / "unpacked"
    target.mkdir(mode=0o700)
    with tarfile.open(archive, "r:xz") as package:
        members = package.getmembers()
        require(0 < len(members) <= MAX_MEMBERS, "archive_member_limit")
        seen: set[str] = set()
        total = 0
        for member in members:
            name = member.name
            segments = name.split("/")
            require(name.startswith("entry-requirements/") and not name.startswith("/")
                    and all(part not in ("", ".", "..") for part in segments)
                    and name not in seen and (member.isfile() or member.isdir())
                    and not member.issym() and not member.islnk(), "unsafe_archive_member")
            seen.add(name)
            if member.isfile():
                require(0 <= member.size <= MAX_FILE_BYTES, "archive_file_limit")
                total += member.size
                require(total <= MAX_UNPACKED_BYTES, "archive_unpacked_limit")
        package.extractall(target, members=members, filter="data")
    source = target / "entry-requirements"
    require(source.is_dir() and not source.is_symlink(), "archive_missing_research")
    return source


def selected(raw: str) -> list[str]:
    names = raw.split(",")
    require(1 <= len(names) <= len(ORDER) and names == list(ORDER[:len(names)]), "destination_order_refused")
    return names


def manifest_at(path: Path, adapter) -> dict:
    raw = adapter["read_file"](path, "manifest.json", 256 * 1024)
    return adapter["strict_json"](raw)


def prepare(root: Path, out: Path, destinations: list[str], adapter) -> dict:
    source = root.resolve(strict=True)
    repo = Path(__file__).resolve().parent.parent
    parent = out.parent.resolve(strict=True)
    dest = parent / out.name
    require(out.name not in ("", ".", "..") and not dest.exists() and not dest.is_symlink()
            and not dest.is_relative_to(repo) and not dest.is_relative_to(source)
            and dest != source and len(destinations) > 0, "output_refused")
    temporary = Path(tempfile.mkdtemp(prefix=".jetnity-50-pass-", dir=parent))
    package_root = temporary / "packages"
    package_root.mkdir(mode=0o700)
    receipts = []
    blocked = []
    try:
        all_passports = None
        all_priority = None
        for country in destinations:
            package = package_root / country
            try:
                counts = adapter["prepare"](source, country, package)
            except ValueError as error:
                # Only the two explicitly observed unsplit v2.2 frames are parked.
                # Every other identity or integrity failure aborts the whole run.
                if country not in ("HR", "NL") or str(error) != "split_frame_identity":
                    raise
                relative = f"records/dest/{country}/index.json"
                index_bytes = adapter["read_file"](source, relative, 8 * 1024 * 1024)
                frame = adapter["strict_json"](index_bytes)
                require(isinstance(frame, dict) and frame.get("schema") == "jetnity-entry-requirements-research-v2.2"
                        and frame.get("status") == "RESEARCH_ONLY" and frame.get("dest_id") == country
                        and frame.get("destination_iso2") == country and frame.get("file_layout") != "split"
                        and not package.exists() and all_priority is not None, "unsplit_frame_identity_refused")
                held = temporary / "blocked"
                held.mkdir(mode=0o700, exist_ok=True)
                (held / f"{country}.json").write_bytes(index_bytes)
                os.chmod(held / f"{country}.json", 0o600)
                blocked.append({"country": country, "reason": "unsplit_research_frame_not_importable",
                                "indexSha256": hashlib.sha256(index_bytes).hexdigest()})
                continue
            require(counts == adapter["verify"](package) and counts["passports"] == 50
                    and counts["topicSlots"] == 1300 and counts["accepted"] == 0
                    and counts["published"] == 0, "research_validation_refused")
            record = manifest_at(package, adapter)
            require(record["destination"] == country and record["status"] == "RESEARCH_ONLY"
                    and record["publicationAuthority"] == "none"
                    and record["sourceVerification"] == "NOT_RUN"
                    and record["ownerPublicationApproval"] is False
                    and len(record["passportPriority"]) == 50, "research_authority_refused")
            if all_passports is None:
                all_passports = record["passportPriority"]
                all_priority = record["inputHashes"]["passportPriority"]
            require(record["passportPriority"] == all_passports
                    and record["inputHashes"]["passportPriority"] == all_priority, "passport_order_drift")
            receipts.append({"country": country, "manifestSha256": digest(package / "manifest.json"),
                             "counts": counts})
        total = {"destinations": len(receipts), "passports": len(receipts) * 50,
                 "topicSlots": len(receipts) * 1300, "blockedCountries": len(blocked),
                 "blockedPassports": len(blocked) * 50, "accepted": 0, "published": 0}
        seal = {"schema": 1, "kind": "jetnity_50_pass_research_quarantine",
                "classification": "RESEARCH_ONLY", "publicationAuthority": "none",
                "methodApproval": "NOT_APPROVED", "visitorOutcome": "derzeit nicht verfügbar",
                "officialSourcesVerified": False, "sourceMonitoringActivated": False,
                "scope": "research-file validation, not source/legal verification",
                "destinationOrder": destinations, "priorityFileSha256": all_priority,
                "counts": total, "packages": receipts, "blocked": blocked}
        with (temporary / "manifest.json").open("x", encoding="utf-8") as stream:
            os.chmod(temporary / "manifest.json", 0o600)
            json.dump(seal, stream, ensure_ascii=False, separators=(",", ":"))
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        # Exclusive output reservation. The complete seal becomes visible LAST.
        dest.mkdir(mode=0o700)
        try:
            os.rename(package_root, dest / "packages")
            if blocked:
                os.rename(temporary / "blocked", dest / "blocked")
            os.rename(temporary / "manifest.json", dest / "manifest.json")
        except BaseException:
            shutil.rmtree(dest)
            raise
        return total
    finally:
        shutil.rmtree(temporary, ignore_errors=True)


def verify(path: Path, adapter) -> dict:
    require(not path.is_symlink(), "quarantine_root_refused")
    root = path.resolve(strict=True)
    require(root.is_dir(), "quarantine_root_refused")
    seal = adapter["strict_json"](adapter["read_file"](root, "manifest.json", 64 * 1024))
    require(seal["kind"] == "jetnity_50_pass_research_quarantine"
            and seal["classification"] == "RESEARCH_ONLY"
            and seal["publicationAuthority"] == "none"
            and seal["methodApproval"] == "NOT_APPROVED"
            and seal["officialSourcesVerified"] is False
            and seal["sourceMonitoringActivated"] is False
            and seal["visitorOutcome"] == "derzeit nicht verfügbar", "authority_seal_invalid")
    countries = selected(",".join(seal["destinationOrder"]))
    require(isinstance(seal.get("packages"), list) and isinstance(seal.get("blocked"), list)
            and len(countries) == len(seal["packages"]) + len(seal["blocked"]), "quarantine_package_count")
    prepared = {r["country"]: r for r in seal["packages"]}
    blocked = {r["country"]: r for r in seal["blocked"]}
    require(len(prepared) == len(seal["packages"]) and len(blocked) == len(seal["blocked"])
            and set(prepared).isdisjoint(blocked) and set(prepared) | set(blocked) == set(countries),
            "quarantine_country_partition")
    priority = seal["priorityFileSha256"]
    for country in countries:
        if country in blocked:
            record = blocked[country]
            require(country in ("HR", "NL") and record["reason"] == "unsplit_research_frame_not_importable"
                    and not (root / "packages" / country).exists(), "blocked_scope_changed")
            payload = adapter["read_file"](root, f"blocked/{country}.json", 8 * 1024 * 1024)
            frame = adapter["strict_json"](payload)
            require(hashlib.sha256(payload).hexdigest() == record["indexSha256"]
                    and frame.get("schema") == "jetnity-entry-requirements-research-v2.2"
                    and frame.get("status") == "RESEARCH_ONLY" and frame.get("dest_id") == country
                    and frame.get("destination_iso2") == country and frame.get("file_layout") != "split",
                    "blocked_original_changed")
            continue
        p = root / "packages" / country
        record = prepared[country]
        require(digest(p / "manifest.json") == record["manifestSha256"]
                and adapter["verify"](p) == record["counts"], "quarantine_package_invalid")
        package = manifest_at(p, adapter)
        require(package["inputHashes"]["passportPriority"] == priority
                and package["publicationAuthority"] == "none", "quarantine_priority_drift")
    expected = {"destinations": len(prepared), "passports": len(prepared)*50,
                "topicSlots": len(prepared)*1300, "blockedCountries": len(blocked),
                "blockedPassports": len(blocked)*50, "accepted": 0, "published": 0}
    require(seal["counts"] == expected, "quarantine_seal_counts_invalid")
    return expected


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("prepare", "verify"))
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--research-root", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--destinations", default="AT,IT,FR,ES,PT")
    values = parser.parse_args()
    try:
        adapter = original_adapter()
        if values.mode == "verify":
            require(values.archive is None and values.research_root is None, "verify_inputs_refused")
            total = verify(values.output, adapter)
        else:
            require((values.archive is None) != (values.research_root is None), "exactly_one_source")
            destinations = selected(values.destinations)
            staging = Path(tempfile.mkdtemp(prefix=".jetnity-50-pass-src-", dir=values.output.parent.resolve(strict=True)))
            try:
                root = extract_pinned_archive(values.archive, staging) if values.archive else values.research_root
                total = prepare(root, values.output, destinations, adapter)
            finally:
                shutil.rmtree(staging)
        print(json.dumps(total, separators=(",", ":")))
    except (ValueError, OSError, KeyError, TypeError, RuntimeError, tarfile.TarError, RecursionError):
        print("RESEARCH_ONLY_50_PASS_IMPORT_REFUSED accepted=0 published=0", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
