#!/usr/bin/env python3
"""Offline identity/shape audit of the fixed Jetnity RESEARCH_ONLY archive.

Never extracts files, never writes to a database and never interprets a legal
fact. Prints ONLY summary counts. Python 3 stdlib only.

Usage:
  python3 scripts/db/official-truth-global-research-dev-1/verify-archive.py /path/to/archive
"""
import csv
import hashlib
import io
import json
import re
import sys
import tarfile
from collections import Counter
from pathlib import Path

ARCHIVE_SHA = "4d8e9804598788a1070016f69ecd6e28c72dfdee78b56aafbd647d23e4243e9d"
PRIORITY_SHA = "4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358"
TRACKER_SHA = "33aba1b3640541c2cabe4ec3e7dd569a6db8ed24ce83ef866ebad9255612c153"
COUNTRY_SHA = "cbd520a6793b5534156ab4597db83536460b5b5f13254ba21e36ba81a4495123"
PASSPORT_ORDER = "IN,TR,CN,DE,PL,IT,US,UA,RO,FR,NL,GB,AT,ES,HU,SY,CZ,AF,CH,RU,HR,BE,IQ,PT,BG,BR,GR,IR,SK,PK,ER,TH,SO,VN,SE,NG,EG,XK,KR,LK,DK,PH,JP,LB,RS,LT,CA,CM,MA,IL"
INDEX = re.compile(r"records/dest/([A-Z]{2}(?:-[A-Z]{2})?)/index\.json")
SLICE = re.compile(r"records/dest/([A-Z]{2}(?:-[A-Z]{2})?)/([A-Z]{2})\.json")
RESEARCH_STATUSES = frozenset(("RESEARCH_ONLY", "research_only", "researched"))
RESEARCH_SCHEMAS = frozenset((
    "jetnity-entry-requirements-research-v2.1",
    "jetnity-entry-requirements-research-v2.2",
))


def audit(path: Path) -> None:
    if not path.is_file() or not 100_000 <= path.stat().st_size <= 25_000_000:
        raise ValueError("archive_missing_or_unexpected_size")
    file_digest = hashlib.sha256()
    with path.open("rb") as src:
        for chunk in iter(lambda: src.read(1 << 20), b""):
            file_digest.update(chunk)
    if file_digest.hexdigest() != ARCHIVE_SHA:
        raise ValueError("unreviewed_archive_sha256")

    codes = None
    frames = set()
    pairs = set()
    extras = set()
    states = Counter()
    index_states = Counter()
    total_bytes = 0
    member_count = 0
    with tarfile.open(path, mode="r|*") as archive:
        for member in archive:
            member_count += 1
            total_bytes += member.size
            if member_count > 20_000 or total_bytes > 512_000_000:
                raise ValueError("archive_resource_bounds")
            if member.issym() or member.islnk():
                raise ValueError("archive_links_forbidden")
            if member.name == "passport-priority.csv":
                if codes is not None or member.size > 150_000 or not member.isfile():
                    raise ValueError("ambiguous_priority_csv")
                payload = archive.extractfile(member).read()
                if hashlib.sha256(payload).hexdigest() != PRIORITY_SHA:
                    raise ValueError("priority_csv_sha")
                ranked = list(csv.DictReader(io.StringIO(payload.decode("utf-8-sig"))))
                ranks = [int(row["rank"]) for row in ranked]
                passport_order = [row["nationality_iso2"] for row in ranked]
                if ranks != list(range(1, 51)) or ",".join(passport_order) != PASSPORT_ORDER:
                    raise ValueError("priority_identity_mismatch")
                codes = set(passport_order)
            elif member.name == "tracker.csv":
                if member.size > 9_000_000 or not member.isfile():
                    raise ValueError("tracker_size")
                if hashlib.sha256(archive.extractfile(member).read()).hexdigest() != TRACKER_SHA:
                    raise ValueError("tracker_sha")
            else:
                index = INDEX.fullmatch(member.name)
                record = SLICE.fullmatch(member.name)
                if not index and not record:
                    continue  # Backups, legacy and supplemental files are never imported.
                if codes is None or not member.isfile() or member.size > 300_000:
                    raise ValueError("untrusted_record_or_order")
                if index:
                    country = index.group(1)
                    if country in frames:
                        raise ValueError("duplicate_destination_frame")
                    document = json.load(archive.extractfile(member))
                    if not isinstance(document, dict) or document.get("destination_iso2") != country:
                        raise ValueError("bad_destination_index_identity")
                    if document.get("status") not in RESEARCH_STATUSES:
                        raise ValueError("index_not_research_only")
                    frames.add(country)
                    index_states[document["status"]] += 1
                elif record:
                    country, passport = record.groups()
                    if passport not in codes:
                        extras.add((country, passport))
                        continue
                    if (country, passport) in pairs:
                        raise ValueError("duplicate_passport_slice")
                    document = json.load(archive.extractfile(member))
                    if not isinstance(document, dict):
                        raise ValueError("record_not_json_object")
                    if (document.get("nationality"), document.get("destination_iso2")) != (passport, country):
                        raise ValueError("record_identity_mismatch")
                    if document.get("status") not in RESEARCH_STATUSES or document.get("schema") not in RESEARCH_SCHEMAS:
                        raise ValueError("unreviewed_record_schema_or_status")
                    states[document["status"]] += 1
                    pairs.add((country, passport))
    if codes is None or len(frames) != 206 or len(codes) != 50:
        raise ValueError("archive_country_or_passport_count")
    if hashlib.sha256(",".join(sorted(frames)).encode()).hexdigest() != COUNTRY_SHA:
        raise ValueError("country_set_mismatch")
    if pairs != {(country, code) for country in frames for code in codes}:
        raise ValueError("missing_priority_country_passport_slice")
    if len(extras) != 9 or sum(index_states.values()) != 206:
        raise ValueError("extra_or_index_metadata_mismatch")
    print(
        "archive_identity_verified=1 countries=206 priority_passports=50 "
        "research_slices=10300 extras_not_imported=9 "
        f"index_states={sum(index_states.values())} "
        f"record_states={sum(states.values())} legal_approvals=0"
    )


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("expected_one_archive_argument")
        audit(Path(sys.argv[1]))
    except (ValueError, OSError, tarfile.TarError, KeyError, UnicodeError, json.JSONDecodeError) as error:
        print("archive_identity_verification_refused=1", file=sys.stderr)
        raise SystemExit(1) from None
