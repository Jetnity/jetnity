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
RESEARCH_STATUSES = frozenset(("RESEARCH_ONLY", "researched", "research_only"))
# SO document hold only where the checkpoints name that scope. Not every destination.
SO_DOCUMENT_HOLD_DESTINATIONS = frozenset(("AT", "ES", "GR", "NL"))
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
# Destinations only. CN-HK and CN-MO are not passport codes and are not CN.
DESTINATION_RE = re.compile(r"^(?:[A-Z]{2}|CN-HK|CN-MO)$")
SPECIAL_DESTINATIONS = ("CN-HK", "CN-MO")
# Reviewed scope index: these nine folders keep one non-priority slice.
# That slice is preserved and never becomes passport 51.
EXTRA_SLICE_DESTINATIONS = frozenset({"AU", "CN-HK", "CN-MO", "KE", "MV", "NZ", "SA", "TZ", "ZA"})
# Logical launch projection. Historical TOPICS stay the storage locator.
LAUNCH_CORE = (
    ("K1", "visa_or_authorization", ("visa", "electronic_travel_authorization", "entry_fees")),
    ("K2", "document", ("passport", "identity_document", "passport_validity", "blank_passport_pages")),
    ("K3", "stay", ("stay_limit",)),
    ("K4", "health", ("required_vaccinations", "recommended_vaccinations", "health_measures", "health_documents")),
    ("K5", "entry_forms", ("entry_forms", "form_costs")),
    ("K6", "minors", ("minors", "parental_consent")),
)
LAUNCH_OPTIONAL = (
    ("Z1", "financial_means", ("financial_means",)),
    ("Z2", "onward_return_ticket", ("onward_return_ticket",)),
    ("Z3", "transit", ("transit",)),
    ("Z4", "customs", ("customs",)),
)
HISTORICAL_ONLY = ("insurance", "fraud_warnings", "booking_or_travel_document",
                   "dual_nationals", "recent_changes", "official_actions")
EVIDENCED_STATUSES = frozenset(("B", "BELEGT_BEDINGT", "N/A"))
# Carried holds from the named checkpoints. Not a new legal finding.
PRESERVED_TOPIC_HOLDS = tuple(
    {"destination": destination, "nationality": "SO", "topic": "K2", "reason": "document_recognition_hold"}
    for destination in sorted(SO_DOCUMENT_HOLD_DESTINATIONS)
)


def _assert_topic_partition() -> None:
    mapped = [topic for _key, _name, topics in LAUNCH_CORE + LAUNCH_OPTIONAL for topic in topics]
    if not (len(TOPICS) == 26 and len(LAUNCH_CORE) == 6 and len(LAUNCH_OPTIONAL) == 4
            and len(mapped) == len(set(mapped)) and set(mapped).isdisjoint(HISTORICAL_ONLY)
            and set(mapped) | set(HISTORICAL_ONLY) == set(TOPICS)):
        raise RuntimeError("historical_topics_changed")


_assert_topic_partition()


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


def nonpriority_slices(root: Path, destination: str, passports: list[str]) -> list[str]:
    folder = root / "records" / "dest" / destination
    require(folder.is_dir() and not folder.is_symlink(), "input_root_refused")
    found = []
    for child in folder.iterdir():
        metadata = child.lstat()
        require(not stat.S_ISLNK(metadata.st_mode), "input_symlink")
        if not stat.S_ISREG(metadata.st_mode):
            continue
        match = re.fullmatch(r"([A-Z]{2})\.json", child.name)
        if not match or match.group(1) in passports:
            continue
        found.append(match.group(1))
    return sorted(found)


def _row_identity(row: dict) -> tuple:
    return tuple(sorted((str(key), "" if value is None else str(value)) for key, value in row.items()))


def tracker_conflict_class(value) -> str:
    """Classify the tracker cell. The original text is not rewritten.

    Only the exact word ``nein`` after trimming and case-folding is an explicit
    negative. Empty is no claim. ``ja`` is an explicit positive. Every other
    text, including a historical note, stays unresolved. A negative cell is not
    legal evidence and does not prove that no other conflict exists.
    """
    text = "" if value is None else str(value).strip()
    if text == "":
        return "empty"
    folded = text.casefold()
    if folded == "nein":
        return "negative"
    if folded == "ja":
        return "positive"
    return "unresolved"


def tracker_revision(rows: list[dict]) -> dict:
    """Name the fields that differ. Do not pick a row, a date, or a majority."""
    require(isinstance(rows, list) and rows, "tracker_coverage")
    keys = sorted({key for row in rows for key in row})
    differing = []
    for key in keys:
        seen = {"" if row.get(key) is None else str(row.get(key)) for row in rows}
        if len(seen) > 1:
            differing.append(key)
    pointers = {row.get("record_pointer") for row in rows}
    return {"identical": not differing, "samePointer": len(pointers) == 1,
            "differingFields": differing, "selected": False}


def unique_rows(tracker: list[dict], destination: str, passports: list[str]) -> dict:
    """Bind a nationality only when every tracker line for it is fully identical.

    A shared pointer with any other differing field, or two pointers, is a hold.
    An explicit positive, unknown, or historical conflict cell is a hold. An
    explicit ``nein`` or an empty cell is not, and the original cell is kept.
    """
    grouped: dict[str, list[dict]] = {}
    allowed = set(passports)
    for row in tracker:
        if row.get("dest_id") != destination or row.get("nationality") not in allowed:
            continue
        grouped.setdefault(str(row["nationality"]), []).append(row)
    chosen = {}
    for nationality in passports:
        group = grouped.get(nationality, [])
        require(group, "tracker_coverage")
        identities = {_row_identity(row) for row in group}
        pointers = {row.get("record_pointer") for row in group}
        if len(identities) != 1:
            require(False, "tracker_field_conflict" if len(pointers) == 1 else "tracker_row_conflict")
        chosen_row = group[0]
        conflict_class = tracker_conflict_class(chosen_row.get("conflict"))
        require(conflict_class in ("empty", "negative"), "tracker_conflict_flag")
        chosen[nationality] = chosen_row
    return chosen


def _slice_file(destination: str, nationality: str) -> str:
    return f"records/dest/{destination}/{nationality}.json"


def _hex64(value) -> bool:
    return isinstance(value, str) and len(value) == 64 and all(character in "0123456789abcdef" for character in value)


def _files_match(declared, destination: str, permutation: list[str]):
    expected = [_slice_file(destination, nationality) for nationality in permutation]
    if declared == expected or declared == dict(zip(permutation, expected)):
        return expected
    return None


def _pointer_match(pointers, destination: str, permutation: list[str]):
    """Return absent, list, or map. A present contradiction or a null hash is a hold."""
    if pointers is None:
        return "absent", {}
    expected = [_slice_file(destination, nationality) for nationality in permutation]
    if isinstance(pointers, list) and len(pointers) == 50 and all(
            isinstance(row, dict) and row.get("nationality") == nationality and row.get("file") == file
            for row, nationality, file in zip(pointers, permutation, expected)):
        hashes = {}
        for row in pointers:
            if "sha256" not in row:
                continue
            require(_hex64(row.get("sha256")), "index_hash_mismatch")
            hashes[row.get("nationality")] = row["sha256"]
        return "list", hashes
    if isinstance(pointers, dict) and pointers == dict(zip(permutation, expected)):
        return "map", {}
    raise ValueError("index_pointer_identity")


_KNOWN_INDEX_KEYS = frozenset((
    "schema", "status", "dest_id", "destination_iso2", "file_layout", "external_writes",
    "expected_nationality_slices", "slice_files", "slices_by_nationality", "nationality_slices",
    "migration", "expected_50_set", "slice_sha256",
))


def _field_state(frame: dict, key: str) -> str:
    """Distinguish a missing key from an explicit JSON null. Null is not absence."""
    if key not in frame:
        return "absent"
    if frame[key] is None:
        return "null"
    return "value"


def _text_list(value, size: int) -> bool:
    return (isinstance(value, list) and len(value) == size
            and all(isinstance(item, str) for item in value))


def _check_present_redundancy(frame: dict, destination: str, permutation: list[str], notes: list[str], hashes: dict) -> None:
    """Every declared identity, order, map, or hash must agree. Absence is not a pass.

    Types are checked before set, sort, or dict membership. An explicit null is a
    hold, not a missing declaration. This function raises ValueError for data
    that cannot be bound. It does not swallow TypeError from a later caller.
    """
    if "expected_50_set" in frame:
        value = frame["expected_50_set"]
        require(_text_list(value, 50) and set(value) == set(permutation), "index_priority_binding")
    if "expected_nationality_slices" in frame:
        value = frame["expected_nationality_slices"]
        require(_text_list(value, len(permutation)) and value == list(permutation), "index_priority_binding")
    if "slice_files" in frame:
        require(_files_match(frame["slice_files"], destination, list(permutation)) is not None,
                "index_priority_binding")
    if "slices_by_nationality" in frame:
        mapping = frame["slices_by_nationality"]
        expected = {nationality: index for index, nationality in enumerate(permutation)}
        require(isinstance(mapping, dict)
                and all(isinstance(key, str) and isinstance(item, int) and not isinstance(item, bool)
                        for key, item in mapping.items())
                and mapping == expected, "index_mapping")
    if _field_state(frame, "nationality_slices") == "null":
        raise ValueError("index_pointer_identity")
    if "slice_sha256" in frame:
        checksums = frame["slice_sha256"]
        require(isinstance(checksums, dict) and all(isinstance(key, str) for key in checksums)
                and set(checksums) == set(permutation), "index_hash_mismatch")
        for nationality in permutation:
            require(_hex64(checksums.get(nationality)), "index_hash_mismatch")
            if nationality in hashes:
                require(hashes[nationality] == checksums[nationality], "index_hash_mismatch")
            hashes[nationality] = checksums[nationality]
        rows = frame.get("nationality_slices")
        if isinstance(rows, list) and any(isinstance(row, dict) and "sha256" not in row for row in rows):
            notes.append("hash_declaration_incomplete")
    if any(key not in _KNOWN_INDEX_KEYS for key in frame):
        notes.append("unrecognized_field_not_validated")


def index_binding(frame: dict, destination: str, passports: list[str]) -> tuple[list[str], list[str], dict]:
    """Bind files from a documented index. CSV order selects. Nothing is written back.

    Schemas other than the research frame, the reviewed dest-index v2.2 contract,
    or a v1/research-index that already uses those same field names stay on hold.
    Their field layout is not invented here.
    """
    require(isinstance(frame, dict), "split_frame_identity")
    schema = frame.get("schema")
    known = {
        SCHEMA: "research_v2_2",
        "jetnity-entry-requirements-dest-index-v2.2": "dest_index_v2_2",
        "jetnity-entry-requirements-dest-index-v1": "dest_index_v1",
        "jetnity-entry-requirements-research-index-v2.2": "research_index_v2_2",
    }
    # A list or other non-string is not a schema name. Do not hash it.
    require(isinstance(schema, str) and schema in known, "unknown_index_schema")
    status = frame.get("status")
    require(isinstance(status, str) and status in RESEARCH_STATUSES, "split_frame_identity")
    if "dest_id" in frame:
        require(frame.get("dest_id") == destination, "split_frame_identity")
    require("destination_iso2" in frame and frame.get("destination_iso2") == destination, "split_frame_identity")
    layout = _field_state(frame, "file_layout")
    # Explicit null is not the same as a missing key.
    require(layout == "absent" or frame.get("file_layout") == "split", "split_frame_identity")
    notes = [known[schema]]
    if "dest_id" not in frame:
        notes.append("dest_id_absent")
    if layout == "absent":
        notes.append("file_layout_absent")
    if known[schema] == "dest_index_v2_2":
        files, binding_notes, hashes = _bind_dest_index_v22(frame, destination, passports)
    else:
        files, binding_notes, hashes = _bind_research_fields(frame, destination, passports, known[schema])
    return files, notes + binding_notes, hashes


def _bind_dest_index_v22(frame: dict, destination: str, passports: list[str]):
    """Reviewed contract from the gap audit. No extra field names."""
    expected_set = frame.get("expected_50_set")
    require(_text_list(expected_set, 50) and set(expected_set) == set(passports), "index_priority_binding")
    rows = frame.get("nationality_slices")
    kind, row_hashes = _pointer_match(rows, destination, list(passports))
    require(kind == "list", "index_pointer_identity")
    notes = []
    checksums = frame.get("slice_sha256")
    hashes: dict[str, str] = {}
    if checksums is None and not row_hashes:
        notes.append("hash_declaration_absent")
    else:
        if checksums is not None:
            require(isinstance(checksums, dict) and all(isinstance(key, str) for key in checksums)
                    and set(checksums) == set(passports), "index_hash_mismatch")
            for nationality in passports:
                require(_hex64(checksums[nationality]), "index_hash_mismatch")
                if nationality in row_hashes:
                    require(row_hashes[nationality] == checksums[nationality], "index_hash_mismatch")
                hashes[nationality] = checksums[nationality]
        else:
            notes.append("hash_declaration_incomplete")
        if row_hashes and checksums is not None and set(row_hashes) != set(passports):
            notes.append("hash_declaration_incomplete")
        for nationality, digest in row_hashes.items():
            require(_hex64(digest), "index_hash_mismatch")
            hashes.setdefault(nationality, digest)
        if checksums is None or set(row_hashes) != set(passports):
            if "hash_declaration_incomplete" not in notes and checksums is not None:
                notes.append("hash_declaration_incomplete")
    _check_present_redundancy(frame, destination, list(passports), notes, hashes)
    return [_slice_file(destination, nationality) for nationality in passports], notes, hashes


def _bind_research_fields(frame: dict, destination: str, passports: list[str], kind: str):
    order_state = _field_state(frame, "expected_nationality_slices")
    files_state = _field_state(frame, "slice_files")
    pointer_state = _field_state(frame, "nationality_slices")
    map_state = _field_state(frame, "slices_by_nationality")
    states = (order_state, files_state, pointer_state, map_state)
    notes: list[str] = []
    canonical = [_slice_file(destination, nationality) for nationality in passports]
    # A v1 or research-index with none of the known binding fields is still unredacted.
    # Explicit nulls are not the documented research_v2_2 legacy shape.
    if kind != "research_v2_2" and all(state in ("absent", "null") for state in states):
        raise ValueError("index_structure_unredacted")
    if all(state == "absent" for state in states):
        notes.append("index_fields_absent")
        hashes: dict[str, str] = {}
        # Present expected_50_set and slice_sha256 are checked before this return.
        _check_present_redundancy(frame, destination, list(passports), notes, hashes)
        if "slice_sha256" not in frame and "hash_declaration_incomplete" not in notes:
            notes.append("hash_declaration_absent")
        return canonical, notes, hashes
    if order_state == "null":
        raise ValueError("index_priority_binding")
    if order_state == "absent":
        permutation = list(passports)
        if kind == "research_v2_2":
            notes.append("index_fields_absent")
        else:
            raise ValueError("index_structure_unredacted")
    else:
        order = frame["expected_nationality_slices"]
        require(_text_list(order, 50) and sorted(order) == sorted(passports), "index_priority_binding")
        permutation = list(order)
        if permutation != list(passports):
            notes.append("index_order_follows_csv")
    if files_state == "null":
        raise ValueError("index_priority_binding")
    declared = frame["slice_files"] if files_state == "value" else None
    files = _files_match(declared, destination, permutation)
    require(files is not None, "index_priority_binding")
    if map_state == "null":
        raise ValueError("index_mapping")
    if map_state == "absent":
        if kind != "research_v2_2":
            raise ValueError("index_structure_unredacted")
        raise ValueError("index_mapping")
    mapping = frame["slices_by_nationality"]
    require(isinstance(mapping, dict)
            and all(isinstance(key, str) and isinstance(item, int) and not isinstance(item, bool)
                    for key, item in mapping.items())
            and mapping == {nationality: index for index, nationality in enumerate(permutation)},
            "index_mapping")
    if pointer_state == "null":
        raise ValueError("index_pointer_identity")
    pointers = frame["nationality_slices"] if pointer_state == "value" else None
    pointer_kind, row_hashes = _pointer_match(pointers, destination, permutation)
    if pointer_kind == "absent":
        notes.append("pointer_list_absent")
    hashes = {}
    for nationality, digest in row_hashes.items():
        require(_hex64(digest), "index_hash_mismatch")
        hashes[nationality] = digest
    if not hashes and "slice_sha256" not in frame:
        notes.append("hash_declaration_absent")
    elif len(hashes) != 50:
        notes.append("hash_declaration_incomplete")
    _check_present_redundancy(frame, destination, permutation, notes, hashes)
    return canonical, notes, hashes


def extra_nationality(root: Path, destination: str, passports: list[str]) -> str | None:
    found = nonpriority_slices(root, destination, passports)
    if destination in EXTRA_SLICE_DESTINATIONS:
        require(len(found) == 1, "extra_slice_identity")
        return found[0]
    require(found == [], "unexpected_extra_slice")
    return None


def prepare(root: Path, destination: str, output: Path) -> dict:
    require(bool(DESTINATION_RE.fullmatch(destination)), "invalid_destination")
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
    by_nat = unique_rows(tracker, destination, passports)
    split_path = f"records/dest/{destination}/index.json"
    try:
        frame_bytes = read_file(root, split_path)
    except FileNotFoundError:
        raise ValueError("index_unreadable") from None
    try:
        frame = strict_json(frame_bytes)
    except ValueError:
        raise ValueError("index_unreadable") from None
    expected_files, index_notes, declared_hashes = index_binding(frame, destination, passports)
    require(frame.get("external_writes", []) == [] and not has_forbidden(frame), "frame_authority_boundary")
    # An old unsplit copy is allowed ONLY with the archive's explicit migration declaration.
    legacy = f"records/dest/{destination}.json"
    legacy_receipt = None
    if (root / legacy).exists():
        shape = migration_shape(frame, destination)
        require(shape is not None, "ambiguous_split_and_legacy")
        legacy_receipt = {"path": legacy, "sha256": sha(read_file(root, legacy)),
                          "use": "preserved_not_selected", "migrationShape": shape}
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
        try:
            data = read_file(root, file)
        except FileNotFoundError:
            raise ValueError("slice_absent") from None
        declared = declared_hashes.get(nat)
        if declared is not None:
            require(declared == sha(data), "index_hash_mismatch")
        require(sum(len(b) for b in evidence.values()) + len(data) <= 64*1024*1024, "package_size_limit")
        try:
            record = strict_json(data)
        except ValueError:
            raise ValueError("slice_parse_error") from None
        require(isinstance(record, dict) and _slice_schema_ok(record.get("schema"))
                and _slice_status_ok(record.get("status")) and record.get("nationality") == nat
                and record.get("destination_iso2") == destination, "slice_identity")
        require(all(key in record for key in CORE), "slice_core")
        require(not has_forbidden(record) and record.get("external_writes", []) == [], "slice_authority")
        require(parse_date(record.get("researched_at")), "slice_research_date")
        sources = record.get("sources")
        require(isinstance(sources, list) and all(isinstance(s, dict) for s in sources), "sources_shape")
        refs = [source_identity(s) for s in sources]
        require(len(set(refs)) == len(refs), "source_ref_identity")
        source_count += len(sources)
        source_warnings = []
        for source in sources:
            if _source_metadata_warning(source):
                source_warnings.append(source_identity(source))
        conflicts = record.get("conflicts") if "conflicts" in record else None
        if "conflicts" in record and not isinstance(conflicts, list):
            raise ValueError("conflict_undeclared")
        outpath = f"original/slices/{nat}.json"
        evidence[outpath] = data
        records.append({"nationality": nat, "path": outpath, "sha256": sha(data),
                        "researchedAtAsSupplied": record["researched_at"], "sourceCount": len(sources),
                        "sourceMetadataWarnings": source_warnings, "sourceVerification": "NOT_RUN"})
        tracker_class = tracker_conflict_class(by_nat[nat].get("conflict"))
        slice_marker = (isinstance(conflicts, list) and bool(conflicts)) or record.get("cross_check_result") == "conflict"
        if tracker_class == "negative" and slice_marker:
            raise ValueError("tracker_slice_conflict")
        conflict = slice_marker or tracker_class in ("positive", "unresolved")
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
    extra_name = extra_nationality(root, destination, passports)
    extra_receipt = None
    if extra_name is not None:
        relative = f"records/dest/{destination}/{extra_name}.json"
        data = read_file(root, relative)
        require(sum(len(item) for item in evidence.values()) + len(data) <= 64*1024*1024, "package_size_limit")
        evidence[f"original/extras-not-imported/{extra_name}.json"] = data
        extra_receipt = {"path": relative, "nationality": extra_name, "sha256": sha(data),
                         "use": "preserved_not_selected"}
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
                "legacy": legacy_receipt, "extraNotImported": extra_receipt,
                "indexNotes": index_notes, "records": records,
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
    extra = manifest.get("extraNotImported")
    if manifest["destination"] in EXTRA_SLICE_DESTINATIONS:
        require(isinstance(extra, dict) and extra.get("use") == "preserved_not_selected"
                and extra.get("nationality") not in manifest["passportPriority"], "extra_slice_identity")
    else:
        require(extra is None, "unexpected_extra_slice")
    return manifest["counts"]


def project_launch(destination: str, nationalities: list[str], witnesses: list[dict] | None = None) -> dict:
    """Project 26 historical topics onto 6 required and 4 optional launch slots.

    No witness is inferred from research text. Missing evidence stays open.
    An optional gap is not a completeness gate. Publication stays at zero.
    """
    require(bool(DESTINATION_RE.fullmatch(destination)), "invalid_destination")
    require(isinstance(nationalities, list), "invalid_passports")
    for nationality in nationalities:
        require(nationality not in SPECIAL_DESTINATIONS, "territory_is_not_a_passport")
    require(len(nationalities) == 50 and len(set(nationalities)) == 50
            and all(re.fullmatch(r"[A-Z]{2}", nationality) for nationality in nationalities), "invalid_passports")
    core_ids = [item[0] for item in LAUNCH_CORE]
    optional_ids = [item[0] for item in LAUNCH_OPTIONAL]
    historical = {item[0]: item[2] for item in LAUNCH_CORE + LAUNCH_OPTIONAL}
    holds = {(item["destination"], item["nationality"], item["topic"]): item["reason"]
             for item in PRESERVED_TOPIC_HOLDS}
    allowed = set(nationalities)
    slots: dict[tuple[str, str], dict] = {}
    for nationality in nationalities:
        for topic in core_ids + optional_ids:
            reason = holds.get((destination, nationality, topic))
            slots[(nationality, topic)] = {
                "destination": destination, "nationality": nationality, "topic": topic,
                "passportGroup": None, "scope": None, "source": None, "version": None,
                "digest": None, "exceptions": [], "status": "held" if reason else "open",
                "reason": reason, "legalBasis": None, "legalEvidence": False,
                "historicalTopics": list(historical[topic]), "completenessGate": topic in core_ids,
            }
    seen: dict[tuple[str, str], tuple] = {}
    for witness in list(witnesses or []):
        require(isinstance(witness, dict), "witness_shape")
        require(witness.get("published") in (None, False) and witness.get("accepted") in (None, False),
                "publication_refused")
        if witness.get("witnessClass") == "checked_official":
            raise ValueError("official_witness_not_bound")
        if "destination" in witness:
            require(witness.get("destination") == destination, "witness_destination")
        topic = witness.get("topic")
        require(topic in historical, "witness_topic")
        status = witness.get("status")
        require(status in EVIDENCED_STATUSES or status in ("open", "unknown"), "projection_status_refused")
        targets = witness.get("nationalities")
        require(isinstance(targets, list) and targets and len(set(targets)) == len(targets), "witness_nationalities")
        exceptions = witness.get("exceptions", [])
        require(isinstance(exceptions, list)
                and all(isinstance(item, str) and re.fullmatch(r"[A-Z]{2}", item) for item in exceptions),
                "witness_exceptions")
        group = witness.get("passportGroup")
        if group is not None:
            require(isinstance(group, str) and group.strip(), "passport_group_identity")
        scope, source, version = witness.get("scope"), witness.get("source"), witness.get("version")
        digest, basis = witness.get("digest"), witness.get("legalBasis")
        if status in EVIDENCED_STATUSES:
            require(isinstance(scope, str) and scope.strip(), "evidence_scope_missing")
            require(isinstance(version, str) and version.strip(), "evidence_version_missing")
            require(isinstance(digest, str) and re.fullmatch(r"[0-9a-f]{64}", digest), "evidence_digest_missing")
            require(isinstance(source, dict) and isinstance(source.get("id"), str) and source["id"].strip(),
                    "evidence_source_missing")
            if status == "N/A":
                require(isinstance(basis, str) and basis.strip(), "na_without_legal_basis")
        for nationality in targets:
            require(nationality in allowed, "passport_identity")
            if nationality in exceptions:
                continue
            if (destination, nationality, topic) in holds:
                raise ValueError("held_topic_conflict")
            source_id = source.get("id") if isinstance(source, dict) else None
            identity = (status, digest, version, scope, basis, source_id, group, tuple(exceptions))
            prior = seen.get((nationality, topic))
            if prior is not None:
                require(prior == identity, "projection_conflict")
                continue
            seen[(nationality, topic)] = identity
            slot = slots[(nationality, topic)]
            # A supplied id, digest, version, scope, status or text length is not legal evidence.
            slot.update({
                "status": "unverified", "suppliedStatus": status,
                "witnessClass": "unverified_research_witness",
                "scope": scope if isinstance(scope, str) else None,
                "source": {"id": source_id} if isinstance(source_id, str) else None,
                "version": version if isinstance(version, str) else None,
                "digest": digest if isinstance(digest, str) else None,
                "exceptions": list(exceptions),
                "legalBasis": basis if isinstance(basis, str) and basis.strip() else None,
                "legalEvidence": False, "passportGroup": group or "explicit",
            })
    legal = 0
    complete = 0
    return {
        "destination": destination, "historicalTopicCount": len(TOPICS), "profiles": 50,
        "coreSlots": 50 * len(LAUNCH_CORE), "optionalSlots": 50 * len(LAUNCH_OPTIONAL),
        "legalEvidenceSlots": legal, "sourceAssignments": 0,
        "coreCompleteProfiles": complete, "optionalGapIsCompletenessGate": False,
        "witnessClass": "unverified_research_witness",
        "published": 0, "accepted": 0,
        "slots": [slots[(nationality, topic)] for nationality in nationalities for topic in core_ids + optional_ids],
    }


# Figures from the 27 Nov 2026 local lock analysis. They are not a pass line
# and this module does not remeasure the Mac archive.
HISTORICAL_LOCK_COMPARISON = {
    "ownCheckFindings": 549,
    "historicalRequiredFieldGapsOnly": 7465,
    "noOwnFindingInThatCheck": 1786,
    "role": "historical_comparison_not_a_pass",
}
HISTORICAL_KEY_NAMES = ("truth_state_values", "medication_import", "minors_rules",
                        "health_entry", "field_provenance_rule")
_PINNED_DESTINATIONS: tuple[str, ...] | None = None


def pinned_destinations() -> tuple[str, ...]:
    """The importer's pinned 206-destination order. Coverage is this list, not a bare count."""
    global _PINNED_DESTINATIONS
    if _PINNED_DESTINATIONS is None:
        import importlib.util
        path = Path(__file__).with_name("official-truth-50-pass-import.py")
        spec = importlib.util.spec_from_file_location("official_truth_catalog_for_diagnose", path)
        require(spec is not None and spec.loader is not None, "catalog_pin")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        order = tuple(module.ORDER)
        require(len(order) == 206 and len(set(order)) == 206, "catalog_pin")
        _PINNED_DESTINATIONS = order
    return _PINNED_DESTINATIONS


def migration_shape(frame: dict, destination: str) -> str | None:
    """Return the explicit migration shape, or None when it is missing or not a bound dict.

    A null, list, string or other non-dict is not rewritten into a migration.
    """
    if not isinstance(frame, dict) or "migration" not in frame:
        return None
    migration = frame["migration"]
    if not isinstance(migration, dict):
        return None
    legacy = f"records/dest/{destination}.json"
    split_path = f"records/dest/{destination}/index.json"
    typed = (migration.get("from") == legacy and migration.get("unsplit_preserved_0444") is True
             and migration.get("to") == f"{split_path} + records/dest/{destination}/{{NAT}}.json")
    mapped = (migration.get("legacy_files_remain") is True
              and migration.get("from_schema") in (SCHEMA, "jetnity-entry-requirements-research-v2.1")
              and migration.get("to_schema") == SCHEMA
              and isinstance(migration.get("method"), str) and migration["method"].startswith("split existing ")
              and isinstance(migration.get("legacy_freeze"), str) and bool(migration["legacy_freeze"].strip()))
    if typed:
        return "explicit_typed"
    if mapped:
        return "mapped_legacy"
    return None


def _legacy_declared(frame: dict, destination: str) -> bool:
    return migration_shape(frame, destination) is not None


def _slice_schema_ok(value) -> bool:
    return isinstance(value, str) and value in (SCHEMA, "jetnity-entry-requirements-research-v2.1")


def _slice_status_ok(value) -> bool:
    """Membership needs a string. A list or object is not a status and must not be hashed."""
    return isinstance(value, str) and value in RESEARCH_STATUSES


def _source_url_ok(value) -> bool:
    """Only a string is parsed. Any other JSON type is an unconfirmed source, not an exception."""
    if not isinstance(value, str) or not value:
        return False
    try:
        url = urlsplit(value)
    except ValueError:
        return False
    return url.scheme == "https" and bool(url.hostname) and url.username is None and url.password is None


def _source_metadata_warning(source: dict) -> bool:
    return not _source_url_ok(source.get("url", "")) or not parse_date(source.get("retrieved_at"))


def _slice_observations(record, destination: str, nationality: str, tracker_pointer, declared_hash, data: bytes,
                        tracker_class: str) -> list[dict]:
    """Every independent slice check. This function does not raise and does not decide a candidate.

    A missing pointer is not a match. An empty source list, a metadata warning, or a
    field reference that does not resolve is a local unconfirmed gap. None of these
    is legal evidence, and none of them is a proven absence of conflict.
    """
    found = []
    if tracker_pointer != _slice_file(destination, nationality):
        found.append({"code": "tracker_pointer_mismatch", "scope": "profile_integrity"})
    if declared_hash is not None and declared_hash != sha(data):
        found.append({"code": "index_hash_mismatch", "scope": "profile_integrity"})
    if not isinstance(record, dict):
        found.append({"code": "slice_not_object", "scope": "not_checkable"})
        return found
    if not _slice_schema_ok(record.get("schema")):
        found.append({"code": "slice_identity", "scope": "profile_integrity", "field": "schema"})
    if not _slice_status_ok(record.get("status")):
        found.append({"code": "slice_identity", "scope": "profile_integrity", "field": "status"})
    if record.get("nationality") != nationality:
        found.append({"code": "slice_identity", "scope": "profile_integrity", "field": "nationality"})
    if record.get("destination_iso2") != destination:
        found.append({"code": "slice_identity", "scope": "profile_integrity", "field": "destination_iso2"})
    if has_forbidden(record) or record.get("external_writes", []) != []:
        found.append({"code": "slice_authority", "scope": "profile_integrity"})
    if not parse_date(record.get("researched_at")):
        found.append({"code": "slice_research_date", "scope": "profile_integrity"})
    sources = record.get("sources")
    refs: list[str] = []
    sources_readable = isinstance(sources, list) and all(isinstance(item, dict) for item in sources)
    if not sources_readable:
        found.append({"code": "sources_shape", "scope": "not_checkable"})
    elif not sources:
        found.append({"code": "sources_empty", "scope": "local_gap"})
    else:
        try:
            refs = [source_identity(item) for item in sources]
            if len(set(refs)) != len(refs):
                found.append({"code": "source_ref_identity", "scope": "profile_integrity"})
        except ValueError:
            found.append({"code": "source_ref_identity", "scope": "not_checkable"})
            refs = []
        if any(_source_metadata_warning(item) for item in sources):
            found.append({"code": "source_metadata_unconfirmed", "scope": "local_gap"})
        unresolved = 0
        for paths in TOPICS.values():
            for path in paths:
                located = pointer(record, path)
                if located in (None, "", [], {}):
                    continue
                unresolved += len(explicit_refs(located) - set(refs))
        if unresolved:
            found.append({"code": "unresolved_source_refs", "scope": "local_gap", "count": unresolved})
    absent = [key for key in HISTORICAL_KEY_NAMES if key not in record]
    if absent:
        found.append({"code": "historical_key_absent", "scope": "local_gap", "keys": absent})
    other_core = [key for key in CORE if key not in record and key not in absent]
    if other_core:
        found.append({"code": "slice_core", "scope": "local_gap", "keys": other_core})
    conflicts = record.get("conflicts") if "conflicts" in record else None
    if "conflicts" not in record or not isinstance(conflicts, list):
        found.append({"code": "conflict_undeclared", "scope": "local_gap"})
        marker = False
    else:
        marker = bool(conflicts)
    if record.get("cross_check_result") == "conflict":
        marker = True
    if marker:
        found.append({"code": "slice_conflict_marker", "scope": "local_gap"})
    if tracker_class == "negative" and marker:
        found.append({"code": "tracker_slice_conflict", "scope": "profile_integrity"})
    if any(item["destination"] == destination and item["nationality"] == nationality and item["topic"] == "K2"
           for item in PRESERVED_TOPIC_HOLDS):
        found.append({"code": "document_recognition_hold", "scope": "local_gap", "topic": "K2"})
    return found


def _record_schema_holds(root: Path) -> list[str]:
    """The same record-schema contract prepare requires. A bad file holds every candidate."""
    try:
        schema = strict_json(read_file(root, "record-schema.json", 256 * 1024))
    except (OSError, ValueError):
        return ["schema_unreadable"]
    if not isinstance(schema, dict):
        return ["schema_identity"]
    holds = []
    if schema.get("schema") != SCHEMA or schema.get("status") != "RESEARCH_ONLY":
        holds.append("schema_identity")
    core = schema.get("nationality_slice")
    fields = core.get("mandatory_core_fields") if isinstance(core, dict) else None
    if fields != CORE:
        holds.append("schema_core_changed")
    return holds


def _pair_status(local: list[dict], destination_held: bool) -> str:
    """One disjoint status. Checked is not a pass."""
    if any(item["code"] in ("slice_absent", "destination_absent") for item in local):
        return "missing"
    if any(item["scope"] == "not_checkable" for item in local):
        return "notCheckable"
    if destination_held or local:
        return "held"
    return "checked"


def diagnose(root: Path) -> dict:
    """Read every pinned destination and passport. Nothing is written.

    Findings are collected before any candidate decision. A destination-wide
    integrity fault has no candidate rows. A local gap can be shown only with
    its hold status, and that view is not a package or a release.
    206 and 10'300 count inventory coverage. They are not a pass count.
    """
    require(root.is_dir() and not root.is_symlink(), "input_root_refused")
    stamp = tuple((path.name, path.lstat().st_mtime_ns) for path in sorted(root.rglob("*")))
    passports = priority(read_file(root, "passport-priority.csv", 128 * 1024))
    tracker, tracker_header = csv_rows(read_file(root, "tracker.csv", 32 * 1024 * 1024))
    directory = root / "records" / "dest"
    require(directory.is_dir() and not directory.is_symlink(), "input_root_refused")
    destinations = pinned_destinations()
    present = {item.name for item in directory.iterdir() if item.is_dir() and not item.is_symlink()}
    findings = []
    candidates = []
    integrity_destinations = []
    local_gap_profiles = 0
    pairs_examined = 0
    status_counts = {"missing": 0, "notCheckable": 0, "held": 0, "checked": 0}
    root_holds = _record_schema_holds(root)
    for code in root_holds:
        findings.append({"destination": None, "nationality": None, "scope": "integrity", "code": code})
    columns_ok = all(key in tracker_header for key in ("dest_id", "nationality", "record_pointer"))
    conflict_declared = "conflict" in tracker_header
    if not columns_ok:
        findings.append({"destination": None, "nationality": None, "scope": "integrity", "code": "tracker_columns"})
    if not conflict_declared:
        findings.append({"destination": None, "nationality": None, "scope": "not_checkable",
                         "code": "tracker_conflict_undeclared"})
    allowed = set(passports)
    for destination in destinations:
        grouped: dict[str, list[dict]] = {}
        for row in tracker:
            if row.get("dest_id") == destination and row.get("nationality") in allowed:
                grouped.setdefault(str(row["nationality"]), []).append(row)
        if destination not in present:
            integrity_destinations.append(destination)
            for nationality in passports:
                pairs_examined += 1
                status_counts["missing"] += 1
                findings.append({"destination": destination, "nationality": nationality,
                                 "scope": "not_checkable", "code": "destination_absent"})
            continue
        dest_integrity = list(root_holds)
        if not columns_ok:
            dest_integrity.append("tracker_columns")
        if destination in ("HR", "NL"):
            dest_integrity.append("unsplit_research_frame_not_importable")
        hashes: dict = {}
        index_notes: list[str] = []
        frame = None
        index_read = False
        try:
            frame = strict_json(read_file(root, f"records/dest/{destination}/index.json"))
            index_read = True
        except (OSError, ValueError):
            dest_integrity.append("index_unreadable")
        if index_read and not isinstance(frame, dict):
            dest_integrity.append("index_not_object")
            frame = None
        if isinstance(frame, dict):
            if frame.get("external_writes", []) != [] or has_forbidden(frame):
                dest_integrity.append("frame_authority_boundary")
            try:
                _files, index_notes, hashes = index_binding(frame, destination, passports)
            except ValueError as error:
                dest_integrity.append(str(error))
            if "unrecognized_field_not_validated" in index_notes:
                dest_integrity.append("unrecognized_field_not_validated")
            if (root / f"records/dest/{destination}.json").exists() and not _legacy_declared(frame, destination):
                dest_integrity.append("ambiguous_split_and_legacy")
        try:
            extra_nationality(root, destination, passports)
        except ValueError as error:
            dest_integrity.append(str(error))
        profiles = []
        for nationality in passports:
            pairs_examined += 1
            local = []
            rows = grouped.get(nationality, [])
            tracker_pointer = None
            tracker_class = "not_checkable"
            if not rows:
                local.append({"code": "tracker_coverage", "scope": "profile_integrity"})
                dest_integrity.append("tracker_coverage")
            else:
                revision = tracker_revision(rows)
                if not revision["identical"]:
                    code = "tracker_field_conflict" if revision["samePointer"] else "tracker_row_conflict"
                    dest_integrity.append(code)
                    local.append({"code": code, "scope": "integrity", "differingFields": revision["differingFields"]})
                    if revision["samePointer"] and "record_pointer" in tracker_header:
                        tracker_pointer = rows[0].get("record_pointer")
                elif not conflict_declared:
                    local.append({"code": "tracker_conflict_undeclared", "scope": "not_checkable"})
                    if "record_pointer" in tracker_header:
                        tracker_pointer = rows[0].get("record_pointer")
                else:
                    tracker_class = tracker_conflict_class(rows[0].get("conflict"))
                    if "record_pointer" in tracker_header:
                        tracker_pointer = rows[0].get("record_pointer")
                    if tracker_class in ("positive", "unresolved"):
                        dest_integrity.append("tracker_conflict_flag")
                        local.append({"code": "tracker_conflict_flag", "scope": "local_gap",
                                      "trackerClass": tracker_class})
            relative = _slice_file(destination, nationality)
            declared_hash = hashes.get(nationality)
            try:
                data = read_file(root, relative)
            except FileNotFoundError:
                local.append({"code": "slice_absent", "scope": "not_checkable"})
                status_counts[_pair_status(local, bool(dest_integrity))] += 1
                for item in local:
                    findings.append({"destination": destination, "nationality": nationality, **item})
                if any(item["scope"] == "local_gap" for item in local):
                    local_gap_profiles += 1
                continue
            except (OSError, ValueError):
                local.append({"code": "slice_read_error", "scope": "not_checkable"})
                status_counts[_pair_status(local, bool(dest_integrity))] += 1
                for item in local:
                    findings.append({"destination": destination, "nationality": nationality, **item})
                if any(item["scope"] == "local_gap" for item in local):
                    local_gap_profiles += 1
                continue
            try:
                record = strict_json(data)
            except ValueError:
                local.append({"code": "slice_parse_error", "scope": "not_checkable"})
                if declared_hash is not None and declared_hash != sha(data):
                    local.append({"code": "index_hash_mismatch", "scope": "profile_integrity"})
                    dest_integrity.append("index_hash_mismatch")
                status_counts[_pair_status(local, bool(dest_integrity))] += 1
                for item in local:
                    findings.append({"destination": destination, "nationality": nationality, **item})
                if any(item["scope"] == "local_gap" for item in local):
                    local_gap_profiles += 1
                continue
            local.extend(_slice_observations(record, destination, nationality, tracker_pointer,
                                             declared_hash, data, tracker_class))
            for item in local:
                if item["scope"] == "profile_integrity":
                    dest_integrity.append(item["code"])
                findings.append({"destination": destination, "nationality": nationality, **item})
            if any(item["scope"] == "local_gap" for item in local):
                local_gap_profiles += 1
            profiles.append((nationality, data, local))
        destination_held = bool(dest_integrity)
        if destination_held:
            integrity_destinations.append(destination)
            for code in sorted(set(dest_integrity)):
                findings.append({"destination": destination, "nationality": None, "scope": "integrity", "code": code})
        for nationality, data, local in profiles:
            status_counts[_pair_status(local, destination_held)] += 1
            if destination_held:
                continue
            if any(item["scope"] in ("profile_integrity", "not_checkable", "integrity") for item in local):
                continue
            holds = [item["code"] for item in local]
            declared_hash = hashes.get(nationality)
            candidates.append({
                "classification": "RESEARCH_ONLY", "candidateView": True, "preparedPackage": False,
                "legalEvidence": False, "publicationAuthority": "none", "accepted": 0, "published": 0,
                "conflictAbsenceProven": False,
                "hashDeclaration": "not_declared" if declared_hash is None else "bound_not_legal_evidence",
                "destination": destination, "nationality": nationality, "originalSha256": sha(data),
                "holdStatus": holds or ["none"],
            })
    for name in sorted(present - set(destinations)):
        findings.append({"destination": name, "nationality": None, "scope": "integrity",
                         "code": "destination_not_in_catalog"})
    after = tuple((path.name, path.lstat().st_mtime_ns) for path in sorted(root.rglob("*")))
    require(after == stamp, "diagnose_wrote")
    require(pairs_examined == len(destinations) * len(passports), "coverage_count")
    require(sum(status_counts.values()) == pairs_examined, "coverage_count")
    checked = status_counts["checked"]
    return {
        "classification": "RESEARCH_ONLY", "legalEvidenceSlots": 0, "published": 0, "accepted": 0,
        "inventoryIsNotAPass": True,
        "destinationsExamined": len(destinations), "pairsExamined": pairs_examined,
        "pairsWithFindings": pairs_examined - checked, "notCheckablePairs": status_counts["missing"] + status_counts["notCheckable"],
        "pairsWithoutFindings": checked, "profileStatus": status_counts,
        "historicalComparisonNotAPass": dict(HISTORICAL_LOCK_COMPARISON),
        "destinationIntegrity": len(set(integrity_destinations)),
        "localGapProfiles": local_gap_profiles,
        "candidateProfiles": len(candidates),
        "ownProfileFindings": sum(1 for row in findings if row.get("nationality") is not None),
        "overlappingFindings": len(findings),
        "findings": findings, "candidates": candidates,
    }


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
