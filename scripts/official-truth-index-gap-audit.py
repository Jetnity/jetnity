"""Read-only structural gap audit for unbound original research indices.

No rules, research values, URLs, source files or credentials leave this process.
A structurally complete case is still RESEARCH_ONLY and never publishable.
"""
from __future__ import annotations
import argparse
from collections import Counter
import importlib.util
import json
import os
from pathlib import Path
import re

_ADAPTER = Path(__file__).with_name('official-truth-research-package.py')
_spec = importlib.util.spec_from_file_location('original_research_adapter', _ADAPTER)
assert _spec and _spec.loader
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)


def audit_index(root: Path, destination: str, passports: list[str], tracker: list[dict], core: list[str]):
    """Return *only* counts/status. Never accept or transform researched facts."""
    base.require(bool(base.DESTINATION_RE.fullmatch(destination)), 'invalid_destination')
    expected = {n: f'records/dest/{destination}/{n}.json' for n in passports}
    idx = base.strict_json(base.read_file(root, f'records/dest/{destination}/index.json', 512*1024))
    rows = idx.get('nationality_slices')
    if not (isinstance(rows, list) and len(rows) == 50 and all(
            isinstance(row, dict) and 'file' in row and 'sha256' in row for row in rows)):
        return {'classification': 'other_layout', 'boundRecords': 0, 'missingCoreRecords': 0,
                'missingCoreFields': {}, 'noncanonicalExternalWritesRecords': 0,
                'approved': 0, 'published': 0}
    # This preflight NEVER declares eligibility; even a perfect digest is not
    # an official source validation, publication permission or immigration rule.
    summary = {'classification': 'quarantined_hashed_list', 'boundRecords': 0,
               'missingCoreRecords': 0, 'missingCoreFields': {},
               'noncanonicalExternalWritesRecords': 0, 'approved': 0, 'published': 0}
    missing = Counter()
    tracker_map = {x['nationality']: x for x in tracker
                   if x.get('dest_id') == destination and x.get('nationality') in expected}
    if (os.path.lexists(root / f'records/dest/{destination}.json')
            or len(tracker_map) != 50 or len(passports) != 50
            or len(set(passports)) != 50):
        summary['classification'] = 'quarantined_unbound'
        return summary
    rows_by_nat = {x.get('nationality'): x for x in rows}
    checksums = idx.get('slice_sha256')
    expected_set = idx.get('expected_50_set')
    if (idx.get('schema') not in ('jetnity-entry-requirements-dest-index-v2.2', base.SCHEMA)
            or idx.get('status') != 'RESEARCH_ONLY' or idx.get('destination_iso2') != destination
            or idx.get('dest_id') != destination
            or not isinstance(checksums, dict) or set(checksums) != set(passports)
            or not isinstance(expected_set, list) or len(expected_set) != 50
            or set(expected_set) != set(passports) or len(rows_by_nat) != 50):
        summary['classification'] = 'quarantined_unbound'
        return summary
    for nat, file in expected.items():
        try:
            raw = base.read_file(root, file)
            row = rows_by_nat[nat]
            record = base.strict_json(raw)
            if (row.get('file') != file or tracker_map[nat].get('record_pointer') != file
                    or row.get('sha256') != base.sha(raw) or checksums[nat] != base.sha(raw)
                    or not isinstance(record, dict) or record.get('status') != 'RESEARCH_ONLY'
                    or record.get('destination_iso2') != destination or record.get('nationality') != nat):
                summary['classification'] = 'quarantined_unbound'
                return summary
            summary['boundRecords'] += 1
            absent = set(core) - set(record)
            if absent:
                summary['missingCoreRecords'] += 1
                missing.update(absent)
            if record.get('external_writes') != []:
                summary['noncanonicalExternalWritesRecords'] += 1
        except (OSError, ValueError, KeyError, TypeError):
            summary['classification'] = 'quarantined_unbound'
            return summary
    summary['missingCoreFields'] = dict(sorted(missing.items()))
    return summary


def audit_all(root: Path):
    root = root.resolve(strict=True)
    schema = base.strict_json(base.read_file(root, 'record-schema.json', 256*1024))
    core = schema['nationality_slice']['mandatory_core_fields']
    base.require(isinstance(core, list) and core == base.CORE, 'invalid_core_contract')
    passports = base.priority(base.read_file(root, 'passport-priority.csv', 128*1024))
    tracker, _ = base.csv_rows(base.read_file(root, 'tracker.csv', 32*1024*1024))
    directory = root / 'records/dest'
    counts = Counter()
    missing = Counter()
    import_capable = 0
    specials = []
    for item in sorted(directory.iterdir()):
        if not item.is_dir() or item.is_symlink() or not base.DESTINATION_RE.fullmatch(item.name):
            continue
        if item.name in base.SPECIAL_DESTINATIONS:
            specials.append(item.name)
        data = audit_index(root, item.name, passports, tracker, core)
        counts[data['classification']] += 1
        if data['classification'] == 'quarantined_hashed_list':
            counts['full_hash_bound_cases'] += int(data['boundRecords'] == 50)
            counts['incomplete_core_cases'] += int(data['missingCoreRecords'] > 0)
            counts['noncanonical_external_write_cases'] += int(data['noncanonicalExternalWritesRecords'] > 0)
            missing.update(data['missingCoreFields'])
            import_capable += int(data['boundRecords'])
    profiles = import_capable
    return {'classification': 'RESEARCH_ONLY', 'cases': dict(sorted(counts.items())),
            'missingMandatoryCoreOccurrences': dict(sorted(missing.items())),
            'accepted': 0, 'published': 0, 'publicationAuthority': 'none',
            'importCapableProfiles': profiles, 'legalEvidenceSlots': 0, 'sourceAssignments': 0,
            'historicalTopicSlots': profiles * len(base.TOPICS),
            'launchCoreSlots': profiles * len(base.LAUNCH_CORE),
            'launchOptionalSlots': profiles * len(base.LAUNCH_OPTIONAL),
            'optionalGapIsCompletenessGate': False,
            'specialDestinationsSeparate': specials}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--research-root', required=True, type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(audit_all(args.research_root), sort_keys=True, separators=(',', ':')))
    except (ValueError, OSError, TypeError, KeyError):
        print('RESEARCH_GAP_AUDIT_FAILED errors=1 accepted=0 published=0')
        raise SystemExit(1)
