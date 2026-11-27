"""Atomic 50-passport research-only import into private filesystem quarantine.

Never writes a database, triggers an Official Truth method, or publishes travel advice.
The existing validated per-destination adapter owns all research record checks.
A separate, Owner-approved V3 importer is required for positive Dev facts.
"""
from __future__ import annotations

import argparse
import fcntl
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

# Original upload pin. The fixed 206-destination archive pin is separate and
# already reviewed in verify-archive.py. The later repack pin is recorded only
# so this run cannot treat it as re-verified.
ARCHIVE_SHA256 = "6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5"
FIXED_ARCHIVE_SHA256 = "4d8e9804598788a1070016f69ecd6e28c72dfdee78b56aafbd647d23e4243e9d"
LOCAL_REPACK_SHA256 = "6545eb28cdffab00a2c7864626abe602d4df240a477bb28b73fe73f78520744b"
LOCAL_REPACK_BYTES = 2_924_288
PRIORITY_CSV_SHA256 = "4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358"
TRACKER_SHA256 = "33aba1b3640541c2cabe4ec3e7dd569a6db8ed24ce83ef866ebad9255612c153"
COUNTRY_SHA256 = "cbd520a6793b5534156ab4597db83536460b5b5f13254ba21e36ba81a4495123"
ACCEPTED_ARCHIVE_SHA256 = {
    ARCHIVE_SHA256: "original_upload",
    FIXED_ARCHIVE_SHA256: "fixed_206_archive",
    LOCAL_REPACK_SHA256: "local_repack_variant",
}
IDENTITY_KEYS = ("archiveSha256", "passportCsvSha256", "trackerSha256", "codeHead",
                 "scriptHashes", "outputIdentity", "destinationIdentity")
EXECUTION_SCRIPTS = (
    "official-truth-50-pass-import.py",
    "official-truth-research-package.py",
    "official-truth-index-gap-audit.py",
    "official-truth-local-offline-run.py",
)
STRUCTURAL_HOLD_CODES = frozenset((
    "tracker_row_conflict", "tracker_field_conflict", "tracker_conflict_flag", "tracker_coverage",
    "tracker_slice_conflict", "tracker_pointer_mismatch",
    "slice_core", "index_priority_binding", "index_mapping", "index_pointer_identity",
    "index_hash_mismatch", "index_structure_unredacted", "unknown_index_schema",
    "split_frame_identity",
))
HISTORICAL_PREFIX = ("AT", "IT", "FR", "ES", "PT", "GR", "HR", "NL", "GB", "US", "TR", "TH", "AE")
STRUCTURAL_HOLDS = frozenset(("HR", "NL"))
EXTRA_SLICE_DESTINATIONS = frozenset({"AU", "CN-HK", "CN-MO", "KE", "MV", "NZ", "SA", "TZ", "ZA"})
CATALOG = tuple(
    "AD,AE,AG,AI,AL,AM,AO,AR,AS,AT,AU,AW,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BM,BN,BO,BR,BS,BT,BW,BY,BZ,"
    "CA,CD,CF,CG,CH,CK,CL,CM,CN,CN-HK,CN-MO,CO,CR,CU,CV,CW,CY,CZ,DE,DJ,DK,DM,DO,EE,EG,ES,ET,FI,FJ,"
    "FM,FR,GA,GB,GD,GE,GF,GH,GM,GN,GP,GR,GT,GU,GW,GY,HN,HR,HT,HU,ID,IE,IL,IN,IR,IS,IT,JM,JO,JP,KE,"
    "KG,KH,KI,KM,KN,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LS,LT,LU,LV,LY,MA,MC,MD,ME,MG,MH,MK,ML,MM,MN,MP,MQ,"
    "MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NG,NI,NL,NO,NP,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PR,PS,PT,PW,"
    "PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SI,SL,SM,SN,SR,ST,SV,SX,SY,SZ,TC,TD,TG,TH,TJ,TL,TM,TN,"
    "TO,TR,TT,TV,TW,TZ,UA,UG,US,UY,UZ,VC,VE,VG,VI,VN,VU,WS,YE,ZA,ZM,ZW".split(",")
)
MAX_ARCHIVE_BYTES = 25_000_000
MAX_UNPACKED_BYTES = 256 * 1024 * 1024
MAX_FILE_BYTES = 8 * 1024 * 1024
MAX_MEMBERS = 20_000


def _review_order() -> tuple[str, ...]:
    digest = hashlib.sha256(",".join(sorted(CATALOG)).encode()).hexdigest()
    order = HISTORICAL_PREFIX + tuple(code for code in CATALOG if code not in HISTORICAL_PREFIX)
    if (digest != COUNTRY_SHA256 or len(order) != 206 or len(set(order)) != 206
            or not set(HISTORICAL_PREFIX) <= set(CATALOG)
            or len(order) * 50 != 10_300 or len(order) * 50 * 6 != 61_800
            or len(order) * 50 * 4 != 41_200 or "CN-HK" not in order or "CN-MO" not in order
            or order.index("CN") >= order.index("CN-HK") or order.index("CN-HK") >= order.index("CN-MO")):
        raise RuntimeError("country_catalog_pin")
    return order


ORDER = _review_order()


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


def extract_pinned_archive(archive: Path, staging: Path, *, fixture: bool = False) -> Path:
    entry = archive.lstat()
    require(stat.S_ISREG(entry.st_mode) and 0 < entry.st_size <= MAX_ARCHIVE_BYTES, "invalid_archive")
    file_sha = digest(archive)
    if fixture:
        require(file_sha not in ACCEPTED_ARCHIVE_SHA256, "fixture_cannot_replace_pin")
    else:
        require(file_sha in ACCEPTED_ARCHIVE_SHA256, "unreviewed_archive")
    local_repack = (not fixture) and file_sha == LOCAL_REPACK_SHA256
    if local_repack:
        require(entry.st_size == LOCAL_REPACK_BYTES, "repack_size_mismatch")
    target = staging / "unpacked"
    target.mkdir(mode=0o700)
    with tarfile.open(archive, "r:xz") as package:
        members = package.getmembers()
        require(0 < len(members) <= MAX_MEMBERS, "archive_member_limit")
        seen: set[str] = set()
        total = 0
        for member in members:
            name = member.name
            require(not name.startswith("/") and "\\" not in name and name not in seen
                    and all(part not in (".", "..") for part in name.split("/"))
                    and (member.isfile() or member.isdir())
                    and not member.issym() and not member.islnk(), "unsafe_archive_member")
            if not local_repack and not fixture:
                require(name.startswith("entry-requirements/"), "unsafe_archive_member")
            seen.add(name)
            if member.isfile():
                require(0 <= member.size <= MAX_FILE_BYTES, "archive_file_limit")
                total += member.size
                require(total <= MAX_UNPACKED_BYTES, "archive_unpacked_limit")
        package.extractall(target, members=members, filter="data")
    nested = target / "entry-requirements"
    source = nested if nested.is_dir() else target
    require(source.is_dir() and not source.is_symlink(), "archive_missing_research")
    if not fixture:
        confirm_pinned_inventory(source)
    return source


def confirm_pinned_inventory(root: Path) -> dict:
    """Check the pinned CSV and tracker bytes of a tree that was just unpacked.

    This is a check of the supplied file, not a claim that an earlier run
    already verified the PO-Mac archive.
    """
    priority = root / "passport-priority.csv"
    tracker = root / "tracker.csv"
    require(priority.is_file() and not priority.is_symlink() and tracker.is_file()
            and not tracker.is_symlink(), "pinned_inventory_missing")
    require(digest(priority) == PRIORITY_CSV_SHA256, "priority_csv_sha")
    require(digest(tracker) == TRACKER_SHA256, "tracker_sha")
    return {"passportCsvSha256": PRIORITY_CSV_SHA256, "trackerSha256": TRACKER_SHA256}


def selected(raw: str) -> list[str]:
    names = raw.split(",")
    require(1 <= len(names) <= len(ORDER) and names == list(ORDER[:len(names)]), "destination_order_refused")
    return names


def manifest_at(path: Path, adapter) -> dict:
    raw = adapter["read_file"](path, "manifest.json", 256 * 1024)
    return adapter["strict_json"](raw)


def hold_index(adapter, source: Path, country: str) -> tuple[bytes, str, str]:
    """Park HR/NL even when the index is now a correct split. Bytes stay unchanged."""
    index_bytes = adapter["read_file"](source, f"records/dest/{country}/index.json", 8 * 1024 * 1024)
    frame = adapter["strict_json"](index_bytes)
    require(isinstance(frame, dict)
            and frame.get("schema") == "jetnity-entry-requirements-research-v2.2"
            and frame.get("status") in ("RESEARCH_ONLY", "researched", "research_only")
            and frame.get("destination_iso2") == country, "structural_hold_identity_refused")
    if "dest_id" in frame:
        require(frame.get("dest_id") == country, "structural_hold_identity_refused")
    reason = "ambiguous_index_hold" if frame.get("file_layout") == "split" else "unsplit_research_frame_not_importable"
    return index_bytes, reason, hashlib.sha256(index_bytes).hexdigest()


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
            if country in STRUCTURAL_HOLDS:
                require(all_priority is not None and not package.exists(), "structural_hold_without_priority")
                index_bytes, reason, index_sha = hold_index(adapter, source, country)
                held = temporary / "blocked"
                held.mkdir(mode=0o700, exist_ok=True)
                (held / f"{country}.json").write_bytes(index_bytes)
                os.chmod(held / f"{country}.json", 0o600)
                blocked.append({"country": country, "reason": reason, "indexSha256": index_sha})
                continue
            counts = adapter["prepare"](source, country, package)
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
            _extra_ok(country, record)
            receipts.append({"country": country, "manifestSha256": digest(package / "manifest.json"),
                             "counts": counts, "extraNotImported": record.get("extraNotImported")})
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


def _charge_markers(root: Path, seal: dict) -> bool:
    """True when the tree claims, or still carries, a schema-2 charge."""
    if seal.get("schema") == 2 or seal.get("sealVersion") not in (None, 1) or "charge" in seal:
        return True
    if (root / "checkpoint.jsonl").exists() or (root / "checkpoint.jsonl").is_symlink():
        return True
    if (root / "charge.lock").exists() or (root / "charge.lock").is_symlink():
        return True
    for folder_name in ("packages", "blocked"):
        folder = root / folder_name
        if folder.is_symlink():
            return True
        if not folder.is_dir():
            continue
        for child in folder.iterdir():
            if child.name.endswith(".charge.json"):
                return True
    return False


def _verify_charge(root: Path, seal: dict, identity: dict) -> None:
    """Recompute the charge from the checkout, path, and journal. Do not trust the seal alone.

    The caller holds the charge lock and has read the seal under that lock.
    """
    require(isinstance(identity, dict), "charge_identity_missing")
    charge = seal.get("charge")
    require(isinstance(charge, dict), "charge_missing")
    require(charge.get("codeHead") == repository_commit(), "git_commit_identity")
    require(charge.get("scriptHashes") == execution_script_hashes(), "script_hash_mismatch")
    require(charge.get("outputIdentity") == canonical_output_identity(root), "output_identity_mismatch")
    order = seal["destinationOrder"]
    require(isinstance(order, list) and charge.get("destinationIdentity") == hashlib.sha256(
        ",".join(order).encode()).hexdigest(), "destination_identity_mismatch")
    require(_hex(charge.get("archiveSha256", ""), 64) and charge["archiveSha256"] != "0" * 64, "archive_identity")
    require(charge.get("passportCsvSha256") == PRIORITY_CSV_SHA256, "priority_csv_sha")
    require(charge.get("trackerSha256") == TRACKER_SHA256, "tracker_sha")
    require_same_charge(charge, identity)
    prepared = {row["country"]: row for row in seal["packages"]}
    blocked = {row["country"]: row for row in seal["blocked"]}
    rows = read_checkpoint(root / "checkpoint.jsonl")
    require(len(rows) == len(order), "journal_incomplete")
    for row, country in zip(rows, order):
        require(row.get("destination") == country, "journal_order")
        require_same_charge(row, charge)
        if country in blocked:
            require(row.get("action") == "blocked" and row.get("reason") == blocked[country]["reason"],
                    "hold_reason_mismatch")
            payload = (root / "blocked" / f"{country}.json").read_bytes()
            require(hashlib.sha256(payload).hexdigest() == row["planDigest"] == blocked[country]["indexSha256"],
                    "hold_digest_mismatch")
            require(_read_binding(root / "blocked" / f"{country}.charge.json", charge) == row["planDigest"],
                    "unbound_package")
            continue
        require(row.get("action") == "quarantined", "package_action_mismatch")
        require(row["planDigest"] == prepared[country]["manifestSha256"], "package_digest_mismatch")
        require(_read_binding(root / "packages" / f"{country}.charge.json", charge) == row["planDigest"],
                "unbound_package")


def verify(path: Path, adapter, identity: dict | None = None) -> dict:
    require(not path.is_symlink(), "quarantine_root_refused")
    root = path.resolve(strict=True)
    require(root.is_dir(), "quarantine_root_refused")
    lock = None
    lock_path = root / "charge.lock"
    if lock_path.exists() or lock_path.is_symlink():
        _reject_symlink(lock_path)
        lock = acquire_charge(root)
    try:
        return _verify_locked(root, adapter, identity, lock is not None)
    finally:
        release_charge(root, lock)


def _verify_locked(root: Path, adapter, identity: dict | None, locked: bool) -> dict:
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
            require(not (root / "packages" / country).exists(), "blocked_scope_changed")
            payload = adapter["read_file"](root, f"blocked/{country}.json", 8 * 1024 * 1024)
            require(hashlib.sha256(payload).hexdigest() == record["indexSha256"], "blocked_original_changed")
            if record["reason"] in ("unsplit_research_frame_not_importable", "ambiguous_index_hold"):
                frame = adapter["strict_json"](payload)
                split = frame.get("file_layout") == "split"
                require(country in STRUCTURAL_HOLDS
                        and frame.get("schema") == "jetnity-entry-requirements-research-v2.2"
                        and frame.get("status") in ("RESEARCH_ONLY", "researched", "research_only")
                        and frame.get("destination_iso2") == country
                        and (split if record["reason"] == "ambiguous_index_hold" else not split),
                        "blocked_original_changed")
                if "dest_id" in frame:
                    require(frame.get("dest_id") == country, "blocked_original_changed")
            else:
                require(record["reason"] in STRUCTURAL_HOLD_CODES, "blocked_scope_changed")
            continue
        p = root / "packages" / country
        record = prepared[country]
        require(digest(p / "manifest.json") == record["manifestSha256"]
                and adapter["verify"](p) == record["counts"], "quarantine_package_invalid")
        package = manifest_at(p, adapter)
        require(package["inputHashes"]["passportPriority"] == priority
                and package["publicationAuthority"] == "none", "quarantine_priority_drift")
        _extra_ok(country, package)
    expected = {"destinations": len(prepared), "passports": len(prepared)*50,
                "topicSlots": len(prepared)*1300, "blockedCountries": len(blocked),
                "blockedPassports": len(blocked)*50, "accepted": 0, "published": 0}
    require(seal["counts"] == expected, "quarantine_seal_counts_invalid")
    if identity is not None or _charge_markers(root, seal):
        require(identity is not None, "charge_identity_missing")
        require(seal.get("schema") == 2 and seal.get("sealVersion") == 2, "schema_downgrade_refused")
        require(locked, "charge_lock_missing")
        _verify_charge(root, seal, identity)
        return expected
    # Historical atomic seals have no charge, journal, lock, or binding.
    # This is not a charge pass and the local work run never uses it.
    require(seal.get("schema") == 1 and "charge" not in seal and seal.get("sealVersion") in (None, 1),
            "seal_schema_refused")
    return expected


def _extra_ok(country: str, manifest: dict) -> None:
    extra = manifest.get("extraNotImported")
    if country in EXTRA_SLICE_DESTINATIONS:
        priority = manifest.get("passportPriority")
        require(isinstance(extra, dict) and extra.get("use") == "preserved_not_selected"
                and isinstance(priority, list) and extra.get("nationality") not in priority,
                "extra_slice_not_preserved")
        return
    require(extra is None, "unexpected_extra_slice")


def resolve_destinations(raw: str) -> list[str]:
    if raw == "ALL":
        return list(ORDER)
    return selected(raw)


def dry_run(destinations: list[str]) -> dict:
    names = list(destinations)
    require(1 <= len(names) <= len(ORDER) and names == list(ORDER[:len(names)]), "destination_order_refused")
    profiles = len(names) * 50
    return {
        "schema": 1, "kind": "jetnity_universal_importer_dry_run", "classification": "RESEARCH_ONLY",
        "archiveVerifiedThisRun": False, "payloadImport": "STOP_PRIVATE_PAYLOAD_PATH_MISSING",
        "publicationAuthority": "none", "accepted": 0, "published": 0, "legalEvidenceSlots": 0,
        "sourceAssignments": 0, "importCapableProfiles": "NOT_ASSESSED", "destinations": len(names),
        "profiles": profiles, "historicalTopicSlots": profiles * 26, "coreSlots": profiles * 6,
        "optionalSlots": profiles * 4,
        "structuralHoldDestinations": [code for code in names if code in STRUCTURAL_HOLDS],
        "topicHolds": [{"destination": code, "nationality": "SO", "topic": "K2",
                        "reason": "document_recognition_hold"}
                       for code in ("AT", "ES", "GR", "NL") if code in names],
        "extraSliceDestinationsInScope": [code for code in names if code in EXTRA_SLICE_DESTINATIONS],
        "specialDestinations": [code for code in ("CN-HK", "CN-MO") if code in names],
        "catalogDestinations": 206, "catalogProfiles": 10_300,
        "catalogCoreSlots": 61_800, "catalogOptionalSlots": 41_200,
        "priorityCsvSha256Pin": PRIORITY_CSV_SHA256, "trackerSha256Pin": TRACKER_SHA256,
        "localRepackSha256": LOCAL_REPACK_SHA256, "localRepackBytes": LOCAL_REPACK_BYTES,
        "coreCompleteProfiles": 0,
    }


def _hex(value: str, size: int) -> bool:
    return isinstance(value, str) and len(value) == size and all(character in "0123456789abcdef" for character in value)


def repository_commit() -> str:
    """The checked-out commit. This is not an acceptance of that commit."""
    git_path = Path(__file__).resolve().parent.parent / ".git"
    require(git_path.exists() and not git_path.is_symlink(), "git_commit_unreadable")
    if git_path.is_file():
        pointer = git_path.read_text(encoding="utf-8").strip()
        require(pointer.startswith("gitdir: "), "git_commit_unreadable")
        linked = Path(pointer.split(" ", 1)[1])
        git_path = linked if linked.is_absolute() else Path(__file__).resolve().parent.parent / linked
        require(git_path.is_dir() and not git_path.is_symlink(), "git_commit_unreadable")
    head = (git_path / "HEAD").read_text(encoding="utf-8").strip()
    if head.startswith("ref: "):
        ref = git_path / head[5:]
        require(ref.is_file() and not ref.is_symlink(), "git_commit_unreadable")
        head = ref.read_text(encoding="utf-8").strip()
    require(_hex(head, 40), "git_commit_unreadable")
    return head


def execution_script_hashes() -> str:
    directory = Path(__file__).resolve().parent
    hashes = {}
    for name in EXECUTION_SCRIPTS:
        path = directory / name
        require(path.is_file() and not path.is_symlink(), "execution_script_missing")
        hashes[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    return json.dumps(hashes, sort_keys=True, separators=(",", ":"))


def canonical_output_identity(path: Path) -> str:
    """Hash the resolved directory itself, not its basename."""
    parent = path.parent.resolve(strict=True)
    dest = parent / path.name
    require(path.name not in ("", ".", "..") and not dest.is_symlink(), "output_identity")
    return hashlib.sha256(str(dest).encode()).hexdigest()


def charge_identity(archive_sha: str, output: Path, destinations: list[str],
                    csv_sha: str | None = None, tracker_sha: str | None = None,
                    synthetic: bool = False) -> dict:
    require(_hex(archive_sha, 64), "archive_identity")
    require(synthetic or archive_sha != "0" * 64, "null_archive_sha_refused")
    require(isinstance(output, Path), "output_identity")
    require(isinstance(destinations, list) and destinations, "destination_identity")
    return {
        "archiveSha256": archive_sha,
        "passportCsvSha256": csv_sha or PRIORITY_CSV_SHA256,
        "trackerSha256": tracker_sha or TRACKER_SHA256,
        "codeHead": repository_commit(),
        "scriptHashes": execution_script_hashes(),
        "outputIdentity": canonical_output_identity(output),
        "destinationIdentity": hashlib.sha256(",".join(destinations).encode()).hexdigest(),
    }


def require_same_charge(existing: dict, identity: dict) -> None:
    require(all(existing.get(key) == identity[key] for key in IDENTITY_KEYS), "checkpoint_identity_mismatch")


def pinned_archive_required(archive: Path | None, research_root: Path | None) -> None:
    """A unpacked research root is not a substitute for the archive byte pin."""
    require(archive is not None and research_root is None, "research_root_not_archive_pin")


def import_payload() -> None:
    """Actual rule-payload import has no proven private persistence path."""
    raise ValueError("PRIVATE_PAYLOAD_PATH_MISSING")


def _checkpoint_parent(path: Path) -> Path:
    repo = Path(__file__).resolve().parent.parent
    require(path.name not in ("", ".", ".."), "checkpoint_refused")
    parent = path.parent.resolve(strict=True)
    resolved = parent / path.name
    if path.is_symlink() or resolved.is_symlink():
        raise ValueError("symlink_refused")
    require(parent.is_dir() and not parent.is_symlink() and not resolved.is_symlink()
            and not resolved.is_relative_to(repo) and not parent.is_relative_to(repo)
            and not _inside_git_worktree(parent), "checkpoint_inside_repo")
    return resolved


def read_checkpoint(path: Path) -> list[dict]:
    resolved = _checkpoint_parent(path)
    if not resolved.exists():
        return []
    require(resolved.is_file(), "checkpoint_refused")
    data = resolved.read_bytes()
    if data == b"":
        return []
    require(data.endswith(b"\n"), "checkpoint_truncated")
    rows = []
    previous = "0" * 64
    for line in data.splitlines(keepends=True):
        require(line.endswith(b"\n"), "checkpoint_truncated")

        def pairs(values):
            result = {}
            for key, value in values:
                require(key not in result, "checkpoint_chain")
                result[key] = value
            return result

        payload = json.loads(line, object_pairs_hook=pairs)
        require(isinstance(payload, dict) and payload.get("prev") == previous
                and payload.get("seq") == len(rows) + 1, "checkpoint_chain")
        payload["lineSha256"] = hashlib.sha256(line).hexdigest()
        rows.append(payload)
        previous = payload["lineSha256"]
    return rows


def _reject_symlink(path: Path) -> None:
    require(not path.is_symlink(), "symlink_refused")


def _private_directory(path: Path) -> None:
    _reject_symlink(path)
    require(path.is_dir(), "charge_directory_refused")
    require(stat.S_IMODE(path.stat().st_mode) & 0o077 == 0, "unsafe_directory_mode")


_HELD_CHARGES: set[str] = set()


def acquire_charge(directory: Path) -> int | None:
    """Exclusive lock for one charge, taken before the journal is read.

    The same process may re-enter while it already holds the charge. A second
    process gets checkpoint_busy instead of reading a stale journal.
    """
    _private_directory(directory)
    key = str(directory.resolve())
    if key in _HELD_CHARGES:
        return None
    lock_path = directory / "charge.lock"
    _reject_symlink(lock_path)
    descriptor = os.open(lock_path, os.O_CREAT | os.O_RDWR, 0o600)
    try:
        fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError as error:
        os.close(descriptor)
        raise ValueError("checkpoint_busy") from error
    os.chmod(lock_path, 0o600)
    _HELD_CHARGES.add(key)
    return descriptor


def release_charge(directory: Path, descriptor: int | None) -> None:
    if descriptor is None:
        return
    _HELD_CHARGES.discard(str(directory.resolve()))
    os.close(descriptor)


def append_checkpoint(path: Path, event: dict) -> dict:
    require(isinstance(event, dict), "checkpoint_event_refused")
    plan = event.get("planDigest")
    digest_ok = isinstance(plan, str) and len(plan) == 64 and all(character in "0123456789abcdef" for character in plan)
    require(event.get("destination") in ORDER and digest_ok
            and event.get("action") in ("quarantined", "blocked")
            and event.get("accepted") == 0 and event.get("published") == 0
            and event.get("codeHead") == repository_commit()
            and event.get("scriptHashes") == execution_script_hashes()
            and (event.get("synthetic") is True or event.get("archiveSha256") != "0" * 64)
            and all(isinstance(event.get(key), str) and event[key] for key in IDENTITY_KEYS),
            "checkpoint_event_refused")
    resolved = _checkpoint_parent(path)
    _reject_symlink(resolved)
    if resolved.exists():
        require(stat.S_IMODE(resolved.stat().st_mode) & 0o077 == 0, "unsafe_file_mode")
    lock = acquire_charge(resolved.parent)
    try:
        rows = read_checkpoint(resolved) if resolved.exists() else []
        if rows:
            require_same_charge(rows[0], {key: event[key] for key in IDENTITY_KEYS})
        same = [row for row in rows if row.get("destination") == event["destination"]]
        if same:
            require(all(row.get("planDigest") == event["planDigest"] for row in same), "checkpoint_conflict")
            return {"appended": False, "idempotent": True, "lines": len(rows)}
        payload = dict(event)
        payload["seq"] = len(rows) + 1
        payload["prev"] = rows[-1]["lineSha256"] if rows else "0" * 64
        raw = (json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode()
        descriptor = os.open(resolved, os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
        try:
            os.write(descriptor, raw)
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
        os.chmod(resolved, 0o600)
        return {"appended": True, "idempotent": False, "lines": len(rows) + 1}
    finally:
        release_charge(resolved.parent, lock)


def resume_plan(path: Path, destinations: list[str]) -> dict:
    names = list(destinations)
    require(1 <= len(names) <= len(ORDER) and names == list(ORDER[:len(names)]), "destination_order_refused")
    rows = read_checkpoint(path)
    by_destination = {}
    for row in rows:
        previous = by_destination.get(row.get("destination"))
        if previous is not None and previous.get("planDigest") != row.get("planDigest"):
            raise ValueError("checkpoint_conflict")
        by_destination[row.get("destination")] = row
    done = []
    for country in names:
        if country not in by_destination:
            break
        done.append(country)
    remaining = names[len(done):]
    if any(country in by_destination for country in remaining):
        raise ValueError("checkpoint_gap")
    return {"done": done, "remaining": remaining, "idempotent": remaining == [],
            "accepted": 0, "published": 0, "legalEvidenceSlots": 0}


def _inside_git_worktree(path: Path) -> bool:
    current = path if path.is_dir() else path.parent
    for parent in (current, *current.parents):
        if (parent / ".git").exists():
            return True
    return False


def _refuse_alias(path: Path) -> None:
    """Reject symlink components, parent aliases, and hardlinked files before resolve."""
    require(isinstance(path, Path) and path.is_absolute(), "output_refused")
    current = Path(path.anchor)
    for part in path.parts[1:]:
        require(part not in ("", ".", ".."), "output_refused")
        current = current / part
        if current.is_symlink():
            raise ValueError("symlink_refused")
        if not current.exists():
            return
        if current.is_file() and current.stat().st_nlink > 1:
            raise ValueError("hardlink_refused")


def _outside(path: Path, repo: Path, source: Path) -> Path:
    """Private output outside the repository, every git worktree, and the protected source tree.

    ``source`` is the original archive directory for a local run, or the unpacked
    research root for a resumable charge. A path inside that tree, equal to it,
    or placed above it is refused before any write.
    """
    _refuse_alias(path)
    _refuse_alias(source)
    parent = path.parent.resolve(strict=True)
    dest = parent / path.name
    source_resolved = source.resolve(strict=True)
    require(path.name not in ("", ".", "..") and not dest.is_symlink()
            and not dest.is_relative_to(repo) and not dest.is_relative_to(source_resolved)
            and not source_resolved.is_relative_to(dest)
            and dest != source_resolved and not _inside_git_worktree(parent)
            and not _inside_git_worktree(dest if dest.exists() else parent), "output_refused")
    if dest.exists() and dest.is_file() and dest.stat().st_nlink > 1:
        raise ValueError("hardlink_refused")
    if dest.exists() and not dest.is_dir():
        raise ValueError("output_refused")
    return dest


def prepare_resumable(root: Path, out: Path, destinations: list[str], adapter, checkpoint: Path | None = None,
                      identity: dict | None = None) -> dict:
    """Commit one private quarantine package at a time. The seal is written last.

    A failed destination leaves earlier checkpointed packages in place and does
    not append a line for the failure. This does not write a database.
    """
    source = root.resolve(strict=True)
    repo = Path(__file__).resolve().parent.parent
    names = list(destinations)
    require(names == list(ORDER[:len(names)]) and len(names) > 0, "destination_order_refused")
    require(identity is not None, "null_archive_sha_refused")
    require(identity.get("archiveSha256") != "0" * 64, "null_archive_sha_refused")
    require(identity.get("destinationIdentity") == hashlib.sha256(",".join(names).encode()).hexdigest(),
            "destination_identity_mismatch")
    require(identity.get("codeHead") == repository_commit(), "git_commit_identity")
    require(identity.get("scriptHashes") == execution_script_hashes(), "script_hash_mismatch")
    dest = _outside(out, repo, source)
    require(identity.get("outputIdentity") == canonical_output_identity(dest), "output_identity_mismatch")
    created = not dest.exists()
    if created:
        dest.mkdir(mode=0o700)
    else:
        _private_directory(dest)
    for child_name in ("packages", "blocked", "checkpoint.jsonl", "manifest.json", "charge.lock"):
        child = dest / child_name
        if child.exists() or child.is_symlink():
            _reject_symlink(child)
    ckpt = checkpoint or (dest / "checkpoint.jsonl")
    _reject_symlink(ckpt)
    require(not ckpt.is_relative_to(source), "checkpoint_inside_source")
    lock = acquire_charge(dest)
    try:
        packages = dest / "packages"
        if not packages.exists():
            packages.mkdir(mode=0o700)
        else:
            _private_directory(packages)
        plan = resume_plan(ckpt, names) if ckpt.exists() else {"done": [], "remaining": names}
        rows = {row["destination"]: row for row in (read_checkpoint(ckpt) if ckpt.exists() else [])}
        receipts = []
        blocked = []
        all_passports = None
        all_priority = None
        for country in names:
            if country in rows and country in plan["done"]:
                record = _resume_country(dest, country, rows[country], adapter, identity)
            else:
                record = _commit_country(source, dest, ckpt, country, adapter, identity)
            if record["action"] == "blocked":
                blocked.append(record["blocked"])
                continue
            if all_passports is None:
                all_passports = record["passports"]
                all_priority = record["priority"]
            require(record["passports"] == all_passports and record["priority"] == all_priority,
                    "passport_order_drift")
            receipts.append(record["receipt"])
        total = {"destinations": len(receipts), "passports": len(receipts) * 50,
                 "topicSlots": len(receipts) * 1300, "blockedCountries": len(blocked),
                 "blockedPassports": len(blocked) * 50, "accepted": 0, "published": 0}
        seal_path = dest / "manifest.json"
        if seal_path.exists():
            existing = adapter["strict_json"](adapter["read_file"](dest, "manifest.json", 64 * 1024))
            previous = existing.get("destinationOrder")
            require(isinstance(previous, list) and names[:len(previous)] == previous, "checkpoint_conflict")
            if existing.get("charge") not in (None, {key: identity[key] for key in IDENTITY_KEYS}):
                raise ValueError("checkpoint_identity_mismatch")
            if previous == names and existing.get("counts") == total:
                return total
        _write_seal(dest, names, all_priority, total, receipts, blocked, identity)
        return total
    except Exception:
        if created and not ckpt.exists():
            shutil.rmtree(dest, ignore_errors=True)
        raise
    finally:
        release_charge(dest, lock)


def _resume_country(dest: Path, country: str, row: dict, adapter, identity: dict) -> dict:
    require_same_charge(row, identity)
    if row.get("action") == "blocked":
        payload = adapter["read_file"](dest, f"blocked/{country}.json", 8 * 1024 * 1024)
        require(hashlib.sha256(payload).hexdigest() == row["planDigest"], "checkpoint_conflict")
        require(_read_binding(dest / "blocked" / f"{country}.charge.json", identity) == row["planDigest"],
                "unbound_package")
        require(not (dest / "packages" / country).exists(), "blocked_scope_changed")
        reason = row.get("reason")
        require(isinstance(reason, str) and reason, "hold_reason_missing")
        return {"action": "blocked", "blocked": {"country": country, "reason": reason,
                "indexSha256": row["planDigest"]}}
    package = dest / "packages" / country
    require(_read_binding(dest / "packages" / f"{country}.charge.json", identity) == row["planDigest"],
            "unbound_package")
    require(digest(package / "manifest.json") == row["planDigest"], "checkpoint_conflict")
    manifest = manifest_at(package, adapter)
    _extra_ok(country, manifest)
    return {"action": "quarantined", "passports": manifest["passportPriority"],
            "priority": manifest["inputHashes"]["passportPriority"],
            "receipt": {"country": country, "manifestSha256": row["planDigest"],
                        "counts": adapter["verify"](package),
                        "extraNotImported": manifest.get("extraNotImported")}}


def _commit_country(source: Path, dest: Path, ckpt: Path, country: str, adapter, identity: dict) -> dict:
    parent = dest.parent
    temporary = Path(tempfile.mkdtemp(prefix=".jetnity-50-pass-", dir=parent))
    package = temporary / country
    try:
        if country in STRUCTURAL_HOLDS:
            index_bytes, reason, plan = hold_index(adapter, source, country)
            return _store_hold(dest, ckpt, country, reason, index_bytes, identity)
        final = dest / "packages" / country
        if final.exists() or final.is_symlink():
            _reject_symlink(final)
            binding = _read_binding(dest / "packages" / f"{country}.charge.json", identity)
            counts = adapter["verify"](final)
            manifest = manifest_at(final, adapter)
            plan = digest(final / "manifest.json")
            require(binding == plan, "unbound_package")
        else:
            try:
                counts = adapter["prepare"](source, country, package)
            except ValueError as error:
                code = str(error)
                if code not in STRUCTURAL_HOLD_CODES:
                    raise
                payload = _hold_payload(adapter, source, country, code)
                return _store_hold(dest, ckpt, country, code, payload, identity)
            require(counts == adapter["verify"](package) and counts["passports"] == 50
                    and counts["topicSlots"] == 1300 and counts["accepted"] == 0
                    and counts["published"] == 0, "research_validation_refused")
            manifest = manifest_at(package, adapter)
            plan = digest(package / "manifest.json")
            _write_binding(dest / "packages" / f"{country}.charge.json", plan, identity)
            os.rename(package, final)
        require(counts["passports"] == 50 and counts["topicSlots"] == 1300 and counts["accepted"] == 0
                and counts["published"] == 0, "research_validation_refused")
        require(manifest["destination"] == country and manifest["status"] == "RESEARCH_ONLY"
                and manifest["publicationAuthority"] == "none" and manifest["sourceVerification"] == "NOT_RUN"
                and manifest["ownerPublicationApproval"] is False
                and len(manifest["passportPriority"]) == 50, "research_authority_refused")
        _extra_ok(country, manifest)
        append_checkpoint(ckpt, {**identity, "destination": country, "planDigest": plan,
                                  "action": "quarantined", "accepted": 0, "published": 0})
        return {"action": "quarantined", "passports": manifest["passportPriority"],
                "priority": manifest["inputHashes"]["passportPriority"],
                "receipt": {"country": country, "manifestSha256": plan, "counts": counts,
                            "extraNotImported": manifest.get("extraNotImported")}}
    finally:
        shutil.rmtree(temporary, ignore_errors=True)


def _hold_payload(adapter, source: Path, country: str, reason: str) -> bytes:
    try:
        return adapter["read_file"](source, f"records/dest/{country}/index.json", 8 * 1024 * 1024)
    except (OSError, ValueError, KeyError, TypeError):
        return json.dumps({"destination": country, "reason": reason, "originalIndex": False},
                          separators=(",", ":")).encode()


def _binding_bytes(plan: str, identity: dict) -> bytes:
    body = {"planDigest": plan, "charge": {key: identity[key] for key in IDENTITY_KEYS}}
    return (json.dumps(body, sort_keys=True, separators=(",", ":")) + "\n").encode()


def _write_binding(path: Path, plan: str, identity: dict) -> None:
    _reject_symlink(path)
    payload = _binding_bytes(plan, identity)
    if path.exists():
        require(path.read_bytes() == payload, "binding_conflict")
        return
    path.write_bytes(payload)
    os.chmod(path, 0o600)


def _read_binding(path: Path, identity: dict) -> str:
    _reject_symlink(path)
    require(path.is_file(), "unbound_package")
    body = json.loads(path.read_text(encoding="utf-8"))
    require(isinstance(body, dict), "unbound_package")
    require_same_charge(body.get("charge") or {}, identity)
    plan = body.get("planDigest")
    require(_hex(plan, 64), "unbound_package")
    return plan


def _store_hold(dest: Path, ckpt: Path, country: str, reason: str, payload: bytes, identity: dict) -> dict:
    held = dest / "blocked"
    if not held.exists():
        held.mkdir(mode=0o700)
    else:
        _private_directory(held)
    target = held / f"{country}.json"
    _reject_symlink(target)
    if target.exists():
        require(target.read_bytes() == payload, "hold_bytes_conflict")
        require(_read_binding(held / f"{country}.charge.json", identity) == hashlib.sha256(payload).hexdigest(),
                "unbound_package")
    else:
        target.write_bytes(payload)
        os.chmod(target, 0o600)
        _write_binding(held / f"{country}.charge.json", hashlib.sha256(payload).hexdigest(), identity)
    plan = hashlib.sha256(payload).hexdigest()
    append_checkpoint(ckpt, {**identity, "destination": country, "planDigest": plan, "action": "blocked",
                             "reason": reason, "accepted": 0, "published": 0})
    return {"action": "blocked", "blocked": {"country": country, "reason": reason, "indexSha256": plan}}


def _write_seal(dest: Path, destinations: list[str], priority, total: dict, receipts: list, blocked: list,
                identity: dict | None = None) -> None:
    seal = {"schema": 2, "kind": "jetnity_50_pass_research_quarantine",
            "classification": "RESEARCH_ONLY", "publicationAuthority": "none",
            "methodApproval": "NOT_APPROVED", "visitorOutcome": "derzeit nicht verfügbar",
            "officialSourcesVerified": False, "sourceMonitoringActivated": False,
            "scope": "research-file validation, not source/legal verification",
            "destinationOrder": destinations, "priorityFileSha256": priority,
            "counts": total, "packages": receipts, "blocked": blocked}
    if identity is not None:
        seal["charge"] = {key: identity[key] for key in IDENTITY_KEYS}
        seal["sealVersion"] = 2
    temporary = dest / ".manifest.new"
    _reject_symlink(temporary)
    with temporary.open("w", encoding="utf-8") as stream:
        os.chmod(temporary, 0o600)
        json.dump(seal, stream, ensure_ascii=False, separators=(",", ":"))
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, dest / "manifest.json")
    os.chmod(dest / "manifest.json", 0o600)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("prepare", "verify", "dry-run", "resume", "import"))
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--research-root", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--checkpoint", type=Path)
    parser.add_argument("--destinations", default="AT,IT,FR,ES,PT")
    values = parser.parse_args()
    if values.mode == "import":
        print("PRIVATE_PAYLOAD_PATH_STOP accepted=0 published=0", file=sys.stderr)
        raise SystemExit(2)
    try:
        if values.mode == "dry-run":
            require(values.archive is None and values.research_root is None and values.output is None,
                    "dry_run_inputs_refused")
            total = dry_run(resolve_destinations(values.destinations))
        elif values.mode == "resume" and values.archive is None and values.research_root is None:
            require(values.checkpoint is not None and values.output is None, "checkpoint_refused")
            total = resume_plan(values.checkpoint, resolve_destinations(values.destinations))
        else:
            require(values.output is not None, "output_refused")
            adapter = original_adapter()
            if values.mode == "verify":
                require(values.archive is None and values.research_root is None, "verify_inputs_refused")
                total = verify(values.output, adapter)
            elif values.mode in ("resume", "prepare"):
                # Archive bytes stay on the local runner. This CLI cannot open them.
                raise ValueError("local_gate_required")
            else:
                raise ValueError("mode_refused")
        print(json.dumps(total, separators=(",", ":")))
    except (ValueError, OSError, KeyError, TypeError, RuntimeError, tarfile.TarError, RecursionError) as error:
        code = error.args[0] if isinstance(error, ValueError) and error.args else "refused"
        if not isinstance(code, str) or len(code) > 80 or any(mark in code for mark in ("/", " ", "\\")):
            code = "refused"
        print(f"RESEARCH_ONLY_50_PASS_IMPORT_REFUSED {code} accepted=0 published=0", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
