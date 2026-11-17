"""Offline v2.2 research-package adapter. No database, HTTP or publication path."""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import re
import shutil
import stat
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit

SCHEMA = "jetnity-entry-requirements-research-v2.2"
PASSPORT_PREFIX = "IN TR CN DE PL IT US UA RO FR".split()
ORDER = "AT IT FR ES PT GR HR NL GB US TR TH AE".split()
# This is a locator map, NOT a rule extractor or equivalence between conditions.
TOPICS = {
    "visa": ["visa"],
    "electronic_travel_authorization": ["pre_travel_authorization"],
    "stay_limit": ["visa/max_stay", "stay_rules"],
    "passport": ["document_type_scope", "passport_conditions"],
    "identity_document": ["passport/id_card_accepted"],
    "passport_validity": ["passport/validity_rule"],
    "blank_passport_pages": ["passport/blank_pages"],
    "required_vaccinations": ["vaccinations_required"],
    "recommended_vaccinations": ["vaccinations_recommended", "recommended_health"],
    "health_measures": ["current_health_measures", "health_entry"],
    "health_documents": ["health_entry"],
    "insurance": ["entry_conditions/travel_insurance"],
    "entry_forms": ["required_forms"],
    "form_costs": ["required_forms", "fees"],
    "fraud_warnings": ["scam_warnings"],
    "entry_fees": ["fees"],
    "onward_return_ticket": ["entry_conditions/onward_ticket"],
    "financial_means": ["entry_conditions/funds_amount_currency"],
    "booking_or_travel_document": ["entry_conditions/accommodation_or_invitation"],
    "transit": ["transit_rules"],
    "minors": ["minors_rules"],
    "parental_consent": ["minors_rules/parental_consent"],
    "customs": ["customs", "medication_import", "vehicle_entry"],
    "dual_nationals": ["special_groups"],
    "recent_changes": ["change_log"],
    "official_actions": ["action_links"],
}
CORE = ["document_type_scope", "minors_rules", "entry_conditions", "transit_rules",
        "fees", "medication_import", "health_entry", "field_provenance_rule",
        "truth_state_values", "action_links"]


def require(condition: bool, code: str) -> None:
    if not condition:
        raise ValueError(code)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def strict_json(data: bytes):
    def pairs(values):
        result = {}
        for key, value in values:
            require(key not in result, "duplicate_json_key")
            result[key] = value
        return result
    def bad_number(_):
        raise ValueError("non_finite_json")
    return json.loads(data.decode("utf-8"), object_pairs_hook=pairs, parse_constant=bad_number)


def read_file(root: Path, relative: str, limit: int = 8 * 1024 * 1024) -> bytes:
    parts = PurePosixPath(relative)
    require(relative and "\\" not in relative and not parts.is_absolute()
            and all(x not in (".", "..", "") for x in relative.split("/")), "invalid_relative_path")
    path = root
    for i, component in enumerate(parts.parts):
        path /= component
        metadata = path.lstat()
        require(not stat.S_ISLNK(metadata.st_mode), "input_symlink")
        require(stat.S_ISDIR(metadata.st_mode) if i < len(parts.parts)-1
                else stat.S_ISREG(metadata.st_mode), "input_not_regular")
    require(metadata.st_size <= limit, "input_size_limit")
    # O_NOFOLLOW also closes the final-component lstat/open race.
    descriptor = os.open(path, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
    with os.fdopen(descriptor, "rb") as stream:
        data = stream.read(limit + 1)
    require(len(data) <= limit, "input_size_limit")
    return data


def csv_rows(data: bytes):
    stream = io.StringIO(data.decode("utf-8-sig"), newline="")
    raw = list(csv.reader(stream, strict=True))
    require(bool(raw) and len(set(raw[0])) == len(raw[0]) and all(raw[0]), "invalid_csv_header")
    require(all(len(row) == len(raw[0]) for row in raw[1:]), "invalid_csv_width")
    return [dict(zip(raw[0], row)) for row in raw[1:]], raw[0]


def priority(data: bytes) -> list[str]:
    rows, header = csv_rows(data)
    require(all(x in header for x in ("rank", "nationality_iso2")), "original_priority_columns_required")
    require(len(rows) == 50 and all(re.fullmatch(r"[1-9]|[1-4][0-9]|50", r["rank"]) for r in rows), "invalid_priority")
    require({int(r["rank"]) for r in rows} == set(range(1, 51)), "invalid_priority")
    codes = [r["nationality_iso2"] for r in sorted(rows, key=lambda r: int(r["rank"]))]
    require(len(set(codes)) == 50 and all(re.fullmatch(r"[A-Z]{2}", c) for c in codes)
            and codes[:10] == PASSPORT_PREFIX and "CH" in codes, "invalid_passports")
    return codes


def has_forbidden(value) -> bool:
    if isinstance(value, dict):
        return any(re.sub(r"[^a-z]", "", k.lower()) in ("primarynationality", "primarycitizenship")
                   or has_forbidden(v) for k, v in value.items())
    if isinstance(value, list):
        return any(has_forbidden(v) for v in value)
    return False


def parse_date(value) -> bool:
    if not isinstance(value, str):
        return False
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).tzinfo is not None
    except ValueError:
        return False


def pointer(record: dict, path: str):
    value = record
    for key in path.split("/"):
        if not isinstance(value, dict) or key not in value:
            return None
        value = value[key]
    return value


def explicit_refs(value) -> set[str]:
    result: set[str] = set()
    if isinstance(value, dict):
        for key, item in value.items():
            if key in ("source_ref", "source_refs"):
                if isinstance(item, str):
                    result.update(x.strip() for x in item.split(",") if x.strip())
                elif isinstance(item, list):
                    result.update(x for x in item if isinstance(x, str))
            result.update(explicit_refs(item))
    elif isinstance(value, list):
        for item in value:
            result.update(explicit_refs(item))
    return result


def source_identity(source: dict) -> str:
    # Some original v2.2 slices use "id", others "ref". Accept exactly one
    # explicit per-source identity, never silently manufacture or merge keys.
    present = [key for key in ("ref", "id") if key in source]
    require(len(present) == 1, "source_ref_identity")
    value = source[present[0]]
    require(isinstance(value, str) and value and value == value.strip(), "source_ref_identity")
    return value


def prepare(root: Path, destination: str, output: Path) -> dict:
    require(bool(re.fullmatch(r"[A-Z]{2}", destination)), "invalid_destination")
    require(root.is_dir() and not root.is_symlink(), "input_root_refused")
    root = root.resolve(strict=True)
    schema_bytes = read_file(root, "record-schema.json", 256*1024)
    schema = strict_json(schema_bytes)
    require(isinstance(schema, dict) and schema.get("schema") == SCHEMA and schema.get("status") == "RESEARCH_ONLY", "schema_identity")
    require(schema.get("nationality_slice", {}).get("mandatory_core_fields") == CORE, "schema_core_changed")
    csv_bytes = read_file(root, "passport-priority.csv", 128*1024)
    passports = priority(csv_bytes)
    tracker_bytes = read_file(root, "tracker.csv", 32*1024*1024)
    tracker, tracker_header = csv_rows(tracker_bytes)
    require(all(k in tracker_header for k in ("dest_id", "nationality", "record_pointer")), "tracker_columns")
    target_rows = [r for r in tracker if r["dest_id"] == destination and r["nationality"] in passports]
    require(len(target_rows) == 50 and {r["nationality"] for r in target_rows} == set(passports), "tracker_coverage")
    by_nat = {r["nationality"]: r for r in target_rows}
    split_path = f"records/dest/{destination}/index.json"
    frame_bytes = read_file(root, split_path)
    frame = strict_json(frame_bytes)
    require(isinstance(frame, dict) and frame.get("schema") == SCHEMA and frame.get("status") == "RESEARCH_ONLY"
            and frame.get("dest_id") == destination and frame.get("destination_iso2") == destination
            and frame.get("file_layout") == "split", "split_frame_identity")
    expected_files = [f"records/dest/{destination}/{nat}.json" for nat in passports]
    declared_files = frame.get("slice_files")
    # Both declared v2.2 layouts occur in the supplied original archive.
    # Dict layout must bind every nationality explicitly, no inferred defaults.
    files_bound = (declared_files == expected_files
                   or declared_files == dict(zip(passports, expected_files)))
    require(frame.get("expected_nationality_slices") == passports and files_bound,
            "index_priority_binding")
    require(frame.get("slices_by_nationality") == {nat: i for i, nat in enumerate(passports)}, "index_mapping")
    pointers = frame.get("nationality_slices")
    require(isinstance(pointers, list) and len(pointers) == 50 and all(
        isinstance(row, dict) and row.get("nationality") == nat and row.get("file") == file
        for row, nat, file in zip(pointers, passports, expected_files)), "index_pointer_identity")
    require(frame.get("external_writes", []) == [] and not has_forbidden(frame), "frame_authority_boundary")
    # An old unsplit copy is allowed ONLY with the archive's explicit migration declaration.
    legacy = f"records/dest/{destination}.json"
    legacy_receipt = None
    if (root / legacy).exists():
        migration = frame.get("migration", {})
        typed_legacy = (migration.get("from") == legacy and migration.get("unsplit_preserved_0444") is True
                        and migration.get("to") == f"{split_path} + records/dest/{destination}/{{NAT}}.json")
        mapped_legacy = (migration.get("legacy_files_remain") is True
                         and migration.get("from_schema") in (SCHEMA, "jetnity-entry-requirements-research-v2.1")
                         and migration.get("to_schema") == SCHEMA
                         and isinstance(migration.get("method"), str) and migration["method"].startswith("split existing ")
                         and isinstance(migration.get("legacy_freeze"), str) and bool(migration["legacy_freeze"].strip()))
        require(typed_legacy or mapped_legacy, "ambiguous_split_and_legacy")
        legacy_receipt = {"path": legacy, "sha256": sha(read_file(root, legacy)),
                          "use": "preserved_not_selected", "migrationShape": "explicit_typed" if typed_legacy else "mapped_legacy"}
    evidence: dict[str, bytes] = {
        "original/record-schema.json": schema_bytes,
        "original/passport-priority.csv": csv_bytes,
        "original/destination-index.json": frame_bytes,
    }
    selected = io.StringIO(newline="")
    writer = csv.DictWriter(selected, fieldnames=tracker_header, lineterminator="\n")
    writer.writeheader()
    for nat in passports:
        writer.writerow(by_nat[nat])
    evidence["original/tracker-destination.csv"] = selected.getvalue().encode()
    coverage = []
    records = []
    source_count = 0
    for nat, file in zip(passports, expected_files):
        require(by_nat[nat]["record_pointer"] == file, "tracker_pointer_mismatch")
        data = read_file(root, file)
        require(sum(len(b) for b in evidence.values()) + len(data) <= 64*1024*1024, "package_size_limit")
        record = strict_json(data)
        require(isinstance(record, dict) and record.get("schema") in (SCHEMA, "jetnity-entry-requirements-research-v2.1")
                and record.get("status") == "RESEARCH_ONLY" and record.get("nationality") == nat
                and record.get("destination_iso2") == destination, "slice_identity")
        require(all(key in record for key in CORE) and not has_forbidden(record)
                and record.get("external_writes", []) == [], "slice_core_or_authority")
        require(parse_date(record.get("researched_at")), "slice_research_date")
        sources = record.get("sources")
        require(isinstance(sources, list) and all(isinstance(s, dict) for s in sources), "sources_shape")
        refs = [source_identity(s) for s in sources]
        require(len(set(refs)) == len(refs), "source_ref_identity")
        source_count += len(sources)
        source_warnings = []
        for source in sources:
            try:
                url = urlsplit(source.get("url", ""))
                ok = url.scheme == "https" and bool(url.hostname) and url.username is None and url.password is None
            except (ValueError, TypeError):
                ok = False
            if not ok or not parse_date(source.get("retrieved_at")):
                source_warnings.append(source_identity(source))
        outpath = f"original/slices/{nat}.json"
        evidence[outpath] = data
        records.append({"nationality": nat, "path": outpath, "sha256": sha(data),
                        "researchedAtAsSupplied": record["researched_at"], "sourceCount": len(sources),
                        "sourceMetadataWarnings": source_warnings, "sourceVerification": "NOT_RUN"})
        conflict = bool(record.get("conflicts")) or record.get("cross_check_result") == "conflict" or bool(by_nat[nat].get("conflict"))
        for topic, paths in TOPICS.items():
            located = [p for p in paths if pointer(record, p) not in (None, "", [], {})]
            field_refs = set().union(*(explicit_refs(pointer(record, p)) for p in located)) if located else set()
            coverage.append({"nationality": nat, "topic": topic, "record": outpath,
                             "researchPointers": ["/"+p for p in located],
                             "explicitSourceRefs": sorted(field_refs),
                             "unresolvedSourceRefs": sorted(field_refs-set(refs)),
                             "recordSourceCatalog": "/sources", "fieldSourceBinding": "NOT_VERIFIED",
                             "researchContentPresent": bool(located), "recordConflictFlag": conflict,
                             "customerStatus": "unavailable", "customerText": "derzeit nicht verfügbar",
                             "publicValue": None, "publicationAuthority": "none"})
    evidence["coverage.json"] = (json.dumps(coverage, ensure_ascii=False, separators=(",", ":"))+"\n").encode()
    counts = {"destinations": 1, "passports": 50, "researchRecords": len(records), "topicSlots": len(coverage),
              "sourceEntries": source_count, "accepted": 0, "published": 0}
    manifest = {"schema": 1, "kind": "original_destination_research_package", "status": "RESEARCH_ONLY",
                "destination": destination, "passportPriority": passports, "counts": counts,
                "packageComplete": True, "completeResearch": False, "publicationAuthority": "none",
                "sourceVerification": "NOT_RUN", "ownerPublicationApproval": False,
                "visitorWarning": "Bitte vor der Reise prüfen", "unavailableLabel": "derzeit nicht verfügbar",
                "preparedAt": datetime.now(timezone.utc).isoformat(),
                "validationScope": "v2.2 frame/index/tracker identities and mandatory structural core; not semantic truth",
                "inputHashes": {"schema": sha(schema_bytes), "passportPriority": sha(csv_bytes), "tracker": sha(tracker_bytes)},
                "legacy": legacy_receipt, "records": records,
                "files": [{"path": p, "bytes": len(b), "sha256": sha(b)} for p,b in sorted(evidence.items())]}
    if (root / "STAGING_RECEIPT.json").exists():
        staging = strict_json(read_file(root, "STAGING_RECEIPT.json", 65536))
        manifest["stagedArchiveSha256"] = staging.get("archiveSha256")
    parent = output.parent.resolve(strict=True)
    destination_path = parent / output.name
    require(output.name not in (".", "..", "") and not destination_path.exists()
            and not destination_path.is_symlink() and not destination_path.is_relative_to(root), "output_refused")
    # Private staging, exclusive output reservation and completion manifest LAST.
    work = Path(tempfile.mkdtemp(prefix=".research-package-", dir=parent))
    try:
        for relative, data in evidence.items():
            target = work / relative
            target.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            with target.open("xb") as stream:
                os.chmod(target, 0o600)
                stream.write(data); stream.flush(); os.fsync(stream.fileno())
        with (work/"manifest.json").open("x", encoding="utf-8") as stream:
            os.chmod(work/"manifest.json", 0o600)
            json.dump(manifest, stream, ensure_ascii=False, separators=(",", ":"));stream.write("\n")
            stream.flush(); os.fsync(stream.fileno())
        # Exclusive directory reservation; copy only validated private staging bytes.
        destination_path.mkdir(mode=0o700)
        try:
            for child in work.iterdir():
                if child.name != "manifest.json":
                    os.rename(child, destination_path / child.name)
            os.rename(work / "manifest.json", destination_path / "manifest.json")
        except BaseException:
            shutil.rmtree(destination_path)
            raise
    finally:
        shutil.rmtree(work)
    return counts


def verify(package: Path) -> dict:
    require(package.is_dir() and not package.is_symlink(), "package_root_refused")
    manifest = strict_json(read_file(package, "manifest.json", 256*1024))
    require(manifest["status"] == "RESEARCH_ONLY" and manifest["publicationAuthority"] == "none"
            and manifest["sourceVerification"] == "NOT_RUN" and manifest["ownerPublicationApproval"] is False,
            "package_authority_changed")
    for entry in manifest["files"]:
        data = read_file(package, entry["path"], 16*1024*1024)
        require(len(data) == entry["bytes"] and sha(data) == entry["sha256"], "package_checksum_mismatch")
    require(len(manifest["records"]) == 50 and len(set(manifest["passportPriority"])) == 50
            and [r["nationality"] for r in manifest["records"]] == manifest["passportPriority"], "package_passports")
    coverage = strict_json(read_file(package, "coverage.json", 16*1024*1024))
    require(len(coverage) == 1300 and {(r["nationality"],r["topic"]) for r in coverage}
            == {(nat, topic) for nat in manifest["passportPriority"] for topic in TOPICS}
            and all(r["customerStatus"] == "unavailable" and r["publicValue"] is None
                    and r["publicationAuthority"] == "none" for r in coverage), "package_coverage")
    return manifest["counts"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=("prepare", "verify"))
    parser.add_argument("--root", type=Path)
    parser.add_argument("--destination")
    parser.add_argument("--output", type=Path, required=True)
    options = parser.parse_args()
    try:
        if options.mode == "prepare":
            require(options.root is not None and options.destination is not None, "missing_input")
            result = prepare(options.root, options.destination, options.output)
            verify(options.output)
        else:
            result = verify(options.output)
        print(json.dumps(result, separators=(",", ":")))
    except (ValueError, OSError, KeyError, TypeError, csv.Error, RecursionError):
        print("RESEARCH_PACKAGE_FAILED errors=1 accepted=0 published=0", file=sys.stderr)
        sys.exit(1)
