"""Offline identity check for the owner's pinned EU research archive. Never publishes.

The four printed country totals reflect unapproved research evidence only.
No DB connections, credentials, network, or automatic positive visa facts.
"""
import argparse
import csv
import hashlib
import io
import json
import os
from pathlib import Path
import stat
import tarfile

ARCHIVE_SHA = "6ef8c9f6e36bee2f75cf162d725a60844ef757bfad14407f69d81631cb9f55e5"
PRIORITY_SHA = "4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358"
PREFIX = "entry-requirements/"
CODES = "IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL".split()
BUNDLES = {
    "IT": ("32be868938c4c0c14ac1feedf587eba958c8e6e6eed7df5afaab8feacd78c5cb", 917859, 0),
    "FR": ("d646492fd3b936be823858ba3761a7c4b050c6a240b704e0d764e7c864a255f2", 801246, 0),
    "ES": ("33edb428273128b5f04c8868d7e329753c208157b419008c5ad6be9c2ca8bd60", 1096297, 30),
    "PT": ("b8dc02c0a0ec43123b2c44184f67bcdf26416e6d7b32e1c34e57b2a432e68571", 1029934, 0),
}

def require(ok, reason):
    if not ok:
        raise ValueError(reason)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def strict_json(data):
    def pairs(values):
        found = {}
        for name, value in values:
            require(name not in found, "duplicate_json_key")
            found[name] = value
        return found
    return json.loads(data.decode("utf-8"), object_pairs_hook=pairs)

def proof(archive):
    path = Path(archive)
    metadata = path.lstat()
    require(stat.S_ISREG(metadata.st_mode) and not path.is_symlink()
            and 0 < metadata.st_size <= 8*1024*1024, "invalid_input")
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024*1024), b""):
            h.update(block)
    require(h.hexdigest() == ARCHIVE_SHA, "archive_identity_refused")
    with tarfile.open(path, "r:xz") as package:
        seen = {}
        for member in package.getmembers():
            name = member.name
            require((name=="entry-requirements" or name.startswith(PREFIX))
                    and not name.startswith("/") and ".." not in name.split("/")
                    and name not in seen and (member.isdir() or member.isfile())
                    and member.size <= 8*1024*1024, "archive_member_refused")
            seen[name] = member
        require(len(seen)<=12000, "archive_member_limit")
        def read(name, maximum):
            info = seen.get(name)
            require(info is not None and info.isfile() and info.size<=maximum, "missing_record")
            handle = package.extractfile(info)
            require(handle is not None, "missing_record_stream")
            with handle:
                data = handle.read(maximum+1)
            require(len(data)==info.size, "record_length_refused")
            return data
        priority = read(PREFIX+"passport-priority.csv", 262144)
        require(digest(priority)==PRIORITY_SHA, "priority_sha_refused")
        rows = list(csv.DictReader(io.StringIO(priority.decode("utf-8"))))
        require(len(rows)==50 and [row["nationality_iso2"] for row in rows]==CODES
                and [int(row["rank"]) for row in rows]==list(range(1,51))
                and len(set(CODES))==50, "priority_mismatch")
        for country,(expected,bytes_expected,conflict_expected) in BUNDLES.items():
            aggregate = hashlib.sha256()
            schemas = {"jetnity-entry-requirements-research-v2.1":0,
                       "jetnity-entry-requirements-research-v2.2":0}
            count_conflicts = 0
            total = 0
            for code in CODES:
                body = read(PREFIX+"records/dest/"+country+"/"+code+".json", 1*1024*1024)
                record = strict_json(body)
                require(record.get("status")=="RESEARCH_ONLY"
                        and record.get("nationality")==code
                        and record.get("destination_iso2")==country, "unapproved_record_identity")
                schema=record.get("schema")
                require(schema in schemas, "unknown_record_schema")
                schemas[schema]+=1
                count_conflicts+=int(bool(record.get("conflicts")))
                total+=len(body)
                aggregate.update(code.encode("ascii")+b"\0"+len(body).to_bytes(8,"big")+body)
            require((schemas["jetnity-entry-requirements-research-v2.2"],
                     schemas["jetnity-entry-requirements-research-v2.1"])==(48,2)
                    and total==bytes_expected and count_conflicts==conflict_expected
                    and aggregate.hexdigest()==expected, "country_record_bundle_refused")
    return {"destinations":4,"passportSlots":200,"topicSlots":5200,
            "accepted":0,"published":0,"status":"RESEARCH_ONLY"}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive",required=True)
    args=parser.parse_args()
    try:
        print(json.dumps(proof(args.archive),separators=(",",":")))
    except (ValueError,OSError,KeyError,TypeError,RuntimeError,tarfile.TarError):
        raise SystemExit("EUROPE_4_RESEARCH_ARCHIVE_REFUSED accepted=0 published=0")

if __name__=="__main__":
    main()
