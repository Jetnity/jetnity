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

# Original upload pin. The fixed 206-destination archive pin is separate and
# already reviewed in verify-archive.py. The later repack pin is recorded only
# so this run cannot treat it as re-verified.
ARCHIVE_SHA256 = "6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5"
FIXED_ARCHIVE_SHA256 = "4d8e9804598788a1070016f69ecd6e28c72dfdee78b56aafbd647d23e4243e9d"
REPACK_SHA256_NOT_REVERIFIED = "6545eb28cdffab00a2c7864626abe602d4df240a477bb28b73fe73f78520744b"
PRIORITY_CSV_SHA256 = "4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358"
TRACKER_SHA256 = "33aba1b3640541c2cabe4ec3e7dd569a6db8ed24ce83ef866ebad9255612c153"
COUNTRY_SHA256 = "cbd520a6793b5534156ab4597db83536460b5b5f13254ba21e36ba81a4495123"
ACCEPTED_ARCHIVE_SHA256 = {
    ARCHIVE_SHA256: "original_upload",
    FIXED_ARCHIVE_SHA256: "fixed_206_archive",
}
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


def extract_pinned_archive(archive: Path, staging: Path) -> Path:
    entry = archive.lstat()
    require(stat.S_ISREG(entry.st_mode) and 0 < entry.st_size <= MAX_ARCHIVE_BYTES, "invalid_archive")
    file_sha = digest(archive)
    require(file_sha != REPACK_SHA256_NOT_REVERIFIED, "repack_not_reverified_this_run")
    require(file_sha in ACCEPTED_ARCHIVE_SHA256, "unreviewed_archive")
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
        _extra_ok(country, package)
    expected = {"destinations": len(prepared), "passports": len(prepared)*50,
                "topicSlots": len(prepared)*1300, "blockedCountries": len(blocked),
                "blockedPassports": len(blocked)*50, "accepted": 0, "published": 0}
    require(seal["counts"] == expected, "quarantine_seal_counts_invalid")
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
        "topicHolds": [{"nationality": "SO", "topic": "K2", "reason": "document_recognition_hold"}],
        "extraSliceDestinationsInScope": [code for code in names if code in EXTRA_SLICE_DESTINATIONS],
        "specialDestinations": [code for code in ("CN-HK", "CN-MO") if code in names],
        "catalogDestinations": 206, "catalogProfiles": 10_300,
        "catalogCoreSlots": 61_800, "catalogOptionalSlots": 41_200,
        "priorityCsvSha256Pin": PRIORITY_CSV_SHA256, "trackerSha256Pin": TRACKER_SHA256,
        "repackSha256": "NOT_REVERIFIED_THIS_RUN",
    }


def import_payload() -> None:
    """Actual rule-payload import has no proven private persistence path."""
    raise ValueError("PRIVATE_PAYLOAD_PATH_MISSING")


def _checkpoint_parent(path: Path) -> Path:
    repo = Path(__file__).resolve().parent.parent
    require(path.name not in ("", ".", ".."), "checkpoint_refused")
    parent = path.parent.resolve(strict=True)
    resolved = parent / path.name
    require(parent.is_dir() and not parent.is_symlink() and not resolved.is_symlink()
            and not resolved.is_relative_to(repo) and not parent.is_relative_to(repo), "checkpoint_inside_repo")
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


def append_checkpoint(path: Path, event: dict) -> dict:
    require(isinstance(event, dict), "checkpoint_event_refused")
    plan = event.get("planDigest")
    digest_ok = isinstance(plan, str) and len(plan) == 64 and all(character in "0123456789abcdef" for character in plan)
    require(event.get("destination") in ORDER and digest_ok
            and event.get("action") in ("quarantined", "blocked")
            and event.get("accepted") == 0 and event.get("published") == 0, "checkpoint_event_refused")
    resolved = _checkpoint_parent(path)
    rows = read_checkpoint(resolved) if resolved.exists() else []
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
    return {"appended": True, "idempotent": False, "lines": len(rows) + 1}


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


def _outside(path: Path, repo: Path, source: Path) -> Path:
    parent = path.parent.resolve(strict=True)
    dest = parent / path.name
    require(path.name not in ("", ".", "..") and not dest.is_symlink()
            and not dest.is_relative_to(repo) and not dest.is_relative_to(source)
            and dest != source, "output_refused")
    return dest


def prepare_resumable(root: Path, out: Path, destinations: list[str], adapter, checkpoint: Path | None = None) -> dict:
    """Commit one private quarantine package at a time. The seal is written last.

    A failed destination leaves earlier checkpointed packages in place and does
    not append a line for the failure. This does not write a database.
    """
    source = root.resolve(strict=True)
    repo = Path(__file__).resolve().parent.parent
    names = list(destinations)
    require(names == list(ORDER[:len(names)]) and len(names) > 0, "destination_order_refused")
    dest = _outside(out, repo, source)
    created = not dest.exists()
    if created:
        dest.mkdir(mode=0o700)
    else:
        require(dest.is_dir(), "output_refused")
    ckpt = checkpoint or (dest / "checkpoint.jsonl")
    packages = dest / "packages"
    if not packages.exists():
        packages.mkdir(mode=0o700)
    try:
        plan = resume_plan(ckpt, names) if ckpt.exists() else {"done": [], "remaining": names}
        rows = {row["destination"]: row for row in (read_checkpoint(ckpt) if ckpt.exists() else [])}
        receipts = []
        blocked = []
        all_passports = None
        all_priority = None
        for country in names:
            if country in rows and country in plan["done"]:
                record = _resume_country(dest, country, rows[country], adapter)
            else:
                record = _commit_country(source, dest, ckpt, country, adapter)
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
            if previous == names and existing.get("counts") == total:
                return total
            os.remove(seal_path)
        _write_seal(dest, names, all_priority, total, receipts, blocked)
        return total
    except Exception:
        if created and not ckpt.exists():
            shutil.rmtree(dest, ignore_errors=True)
        raise


def _resume_country(dest: Path, country: str, row: dict, adapter) -> dict:
    if row.get("action") == "blocked":
        payload = adapter["read_file"](dest, f"blocked/{country}.json", 8 * 1024 * 1024)
        require(hashlib.sha256(payload).hexdigest() == row["planDigest"], "checkpoint_conflict")
        require(not (dest / "packages" / country).exists(), "blocked_scope_changed")
        return {"action": "blocked", "blocked": {"country": country,
                "reason": "unsplit_research_frame_not_importable", "indexSha256": row["planDigest"]}}
    package = dest / "packages" / country
    require(digest(package / "manifest.json") == row["planDigest"], "checkpoint_conflict")
    manifest = manifest_at(package, adapter)
    _extra_ok(country, manifest)
    return {"action": "quarantined", "passports": manifest["passportPriority"],
            "priority": manifest["inputHashes"]["passportPriority"],
            "receipt": {"country": country, "manifestSha256": row["planDigest"],
                        "counts": adapter["verify"](package),
                        "extraNotImported": manifest.get("extraNotImported")}}


def _commit_country(source: Path, dest: Path, ckpt: Path, country: str, adapter) -> dict:
    parent = dest.parent
    temporary = Path(tempfile.mkdtemp(prefix=".jetnity-50-pass-", dir=parent))
    package = temporary / country
    try:
        try:
            counts = adapter["prepare"](source, country, package)
        except ValueError as error:
            if country not in STRUCTURAL_HOLDS or str(error) != "split_frame_identity":
                raise
            relative = f"records/dest/{country}/index.json"
            index_bytes = adapter["read_file"](source, relative, 8 * 1024 * 1024)
            frame = adapter["strict_json"](index_bytes)
            require(isinstance(frame, dict) and frame.get("schema") == "jetnity-entry-requirements-research-v2.2"
                    and frame.get("status") == "RESEARCH_ONLY" and frame.get("dest_id") == country
                    and frame.get("destination_iso2") == country and frame.get("file_layout") != "split",
                    "unsplit_frame_identity_refused")
            held = dest / "blocked"
            held.mkdir(mode=0o700, exist_ok=True)
            target = held / f"{country}.json"
            require(not target.exists(), "blocked_scope_changed")
            target.write_bytes(index_bytes)
            os.chmod(target, 0o600)
            plan = hashlib.sha256(index_bytes).hexdigest()
            append_checkpoint(ckpt, {"destination": country, "planDigest": plan, "action": "blocked",
                                      "accepted": 0, "published": 0})
            return {"action": "blocked", "blocked": {"country": country,
                    "reason": "unsplit_research_frame_not_importable", "indexSha256": plan}}
        require(counts == adapter["verify"](package) and counts["passports"] == 50
                and counts["topicSlots"] == 1300 and counts["accepted"] == 0
                and counts["published"] == 0, "research_validation_refused")
        manifest = manifest_at(package, adapter)
        require(manifest["destination"] == country and manifest["status"] == "RESEARCH_ONLY"
                and manifest["publicationAuthority"] == "none" and manifest["sourceVerification"] == "NOT_RUN"
                and manifest["ownerPublicationApproval"] is False
                and len(manifest["passportPriority"]) == 50, "research_authority_refused")
        _extra_ok(country, manifest)
        plan = digest(package / "manifest.json")
        final = dest / "packages" / country
        if final.exists():
            require(digest(final / "manifest.json") == plan, "checkpoint_conflict")
            shutil.rmtree(package)
        else:
            os.rename(package, final)
        append_checkpoint(ckpt, {"destination": country, "planDigest": plan, "action": "quarantined",
                                  "accepted": 0, "published": 0})
        return {"action": "quarantined", "passports": manifest["passportPriority"],
                "priority": manifest["inputHashes"]["passportPriority"],
                "receipt": {"country": country, "manifestSha256": plan, "counts": counts,
                            "extraNotImported": manifest.get("extraNotImported")}}
    finally:
        shutil.rmtree(temporary, ignore_errors=True)


def _write_seal(dest: Path, destinations: list[str], priority, total: dict, receipts: list, blocked: list) -> None:
    seal = {"schema": 1, "kind": "jetnity_50_pass_research_quarantine",
            "classification": "RESEARCH_ONLY", "publicationAuthority": "none",
            "methodApproval": "NOT_APPROVED", "visitorOutcome": "derzeit nicht verfügbar",
            "officialSourcesVerified": False, "sourceMonitoringActivated": False,
            "scope": "research-file validation, not source/legal verification",
            "destinationOrder": destinations, "priorityFileSha256": priority,
            "counts": total, "packages": receipts, "blocked": blocked}
    target = dest / "manifest.json"
    with target.open("x", encoding="utf-8") as stream:
        os.chmod(target, 0o600)
        json.dump(seal, stream, ensure_ascii=False, separators=(",", ":"))
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())


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
            elif values.mode == "resume":
                require(values.archive is None and values.research_root is not None, "exactly_one_source")
                total = prepare_resumable(values.research_root, values.output,
                                           resolve_destinations(values.destinations), adapter, values.checkpoint)
            else:
                require((values.archive is None) != (values.research_root is None), "exactly_one_source")
                destinations = resolve_destinations(values.destinations)
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
