#!/usr/bin/env python3
"""Read-only comparison of two actual Dev exports; never qualifies a source."""
from pathlib import Path
from html.parser import HTMLParser
import difflib
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
OLD = ROOT / "bmeia-original-20261116.html"
NEW = ROOT / "bmeia-observed-batch105-20261121.html"
META = ROOT / "bmeia-input-metadata.json"
OLD_SHA = "7ca5618875cf1eccea033e1b851cdd8aea3d1aef80585048f62826c8c5266c18"
NEW_SHA = "2521a95cc70490decb12051b28f1e5d208b9429ffb589e2491b34ca110f62cbe"
ASSET_PATTERN = r'((?:href|src)="/typo3conf/ext/theme_bmeia/Resources/Public/[^"?]*[?])[0-9]{10}(")'
OLD_ANCHOR = '<a href="/oeb-bern/service-fuer-buergerinnen/information-fuer-auslandsoesterreicherinnen-und-auslandsoesterreicher/handy-signatur-id-austria">Handy-Signatur / ID-Austria</a>'
NEW_ANCHOR = '<a href="/oeb-bern/service-fuer-buergerinnen/information-fuer-auslandsoesterreicherinnen-und-auslandsoesterreicher/id-austria">ID-Austria</a>'


def sha256(value):
    return hashlib.sha256(value.encode("utf-8") if isinstance(value, str) else value).hexdigest()


class HtmlFacts(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hrefs = []
        self.text_parts = []
        self.ignored_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.ignored_depth += 1
        if tag == "a":
            self.hrefs.append(dict(attrs).get("href"))

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.ignored_depth -= 1

    def handle_data(self, data):
        if not self.ignored_depth:
            self.text_parts.append(data)

    @property
    def visible_text(self):
        return re.sub(r"\s+", " ", " ".join(self.text_parts)).strip()


def parse(value):
    result = HtmlFacts()
    result.feed(value)
    result.close()
    return result


def main_block(value):
    start, end = '<main id="content" role="main">', '</main>'
    assert value.count(start) == value.count(end) == 1
    return value[value.index(start):value.index(end) + len(end)]


old_bytes, new_bytes = OLD.read_bytes(), NEW.read_bytes()
old, new = old_bytes.decode("utf-8", errors="strict"), new_bytes.decode("utf-8", errors="strict")
meta = json.loads(META.read_text(encoding="utf-8"))
assert (len(old_bytes), sha256(old_bytes)) == (172460, OLD_SHA)
assert (len(new_bytes), sha256(new_bytes)) == (172428, NEW_SHA)
assert meta["original"]["body_file"] == OLD.name
assert meta["original"]["actual_bytes"] == len(old_bytes)
assert meta["response"]["body_file"] == NEW.name
assert meta["response"]["actual_bytes"] == len(new_bytes)
assert meta["original"]["body_digest"] == meta["original"]["actual_sha"] == OLD_SHA
assert meta["original"]["disposition"] == "RESEARCH_ONLY"
assert meta["original"]["importable"] is False
assert meta["original"]["accepted_fact_count"] == 0
assert meta["response"]["actual_sha"] == meta["watch"]["observed_sha"] == NEW_SHA
assert str(meta["response"]["id"]) == str(meta["watch"]["request_id"]) == "1805"
assert meta["watch"]["batch_id"] == 105 and meta["watch"]["state"] == "changed"
assert meta["response"]["status_code"] == 200
assert meta["response"]["timed_out"] is False and meta["response"]["error_msg"] is None
canonical_old, old_asset_count = re.subn(ASSET_PATTERN, r"\1TIMESTAMP\2", old)
canonical_new, new_asset_count = re.subn(ASSET_PATTERN, r"\1TIMESTAMP\2", new)
assert old_asset_count == new_asset_count == 19
assert old.count(OLD_ANCHOR) == new.count(NEW_ANCHOR) == 1
assert canonical_old.replace(OLD_ANCHOR, NEW_ANCHOR) == canonical_new
assert sha256(canonical_old) == meta["source_configuration"]["canonical_sha"]
old_main, new_main = main_block(old), main_block(new)
assert old_main == new_main
old_facts, new_facts = parse(old_main), parse(new_main)
assert old_facts.hrefs == new_facts.hrefs and old_facts.visible_text == new_facts.visible_text
whole_old, whole_new = parse(old), parse(new)
assert len(whole_old.hrefs) == len(whole_new.hrefs)
href_delta = [{"zero_based_index": index, "old": before, "new": after}
              for index, (before, after) in enumerate(zip(whole_old.hrefs, whole_new.hrefs))
              if before != after]
assert len(href_delta) == 1
line_diff = list(difflib.unified_diff(old.splitlines(), new.splitlines(), "original", "batch105", n=2))
assert len(old.splitlines()) == len(new.splitlines())
changed_line_numbers = [index + 1 for index, (before, after)
                        in enumerate(zip(old.splitlines(), new.splitlines())) if before != after]
assert len(changed_line_numbers) == 20
result = {
    "review_scope": "Actual preserved original versus actual Dev batch 105 response; no DB call or mutation by reviewer",
    "source_id": meta["original"]["source_id"],
    "official_url": meta["original"]["official_url"],
    "input_metadata_file_sha256": sha256(META.read_bytes()),
    "dev_export_read_at": meta["observed_at"],
    "original": {k: v for k, v in meta["original"].items() if k != "body_utf8"},
    "response": {k: v for k, v in meta["response"].items() if k != "body_utf8"},
    "watch": meta["watch"],
    "source_configuration": meta["source_configuration"],
    "theme_asset_timestamp_matches_old_new": [old_asset_count, new_asset_count],
    "theme_asset_old_timestamp": "1794830959",
    "theme_asset_new_timestamp": "1795172470",
    "canonical_sha256_old": sha256(canonical_old),
    "canonical_sha256_new": sha256(canonical_new),
    "navigation_anchor_old": OLD_ANCHOR,
    "navigation_anchor_new": NEW_ANCHOR,
    "navigation_anchor_bytes_delta": len(NEW_ANCHOR.encode()) - len(OLD_ANCHOR.encode()),
    "only_19_theme_timestamp_changes_and_one_navigation_anchor": True,
    "main_selector": 'main#content[role="main"]',
    "main_raw_bytes_old_new": [len(old_main.encode()), len(new_main.encode())],
    "main_raw_sha256_old_new": [sha256(old_main), sha256(new_main)],
    "main_raw_exact_equal": True,
    "main_visible_text_exact_equal": True,
    "main_anchor_count_old_new": [len(old_facts.hrefs), len(new_facts.hrefs)],
    "main_href_sequence_exact_equal": True,
    "whole_anchor_count_old_new": [len(whole_old.hrefs), len(whole_new.hrefs)],
    "whole_anchor_href_delta": href_delta,
    "changed_html_lines": len(changed_line_numbers),
    "changed_html_line_numbers": changed_line_numbers,
    "decision": "No change to AT entry, passport or visa application rules in the captured page main content",
    "existing_whole_document_watch_correctly_reports_changed": True,
    "source_qualification_granted": False,
    "positive_renewal_claim": False,
    "limitations": [
        "Compares only the two identified preserved response bodies; not the entire legal system or unknown intervening versions",
        "Linked PDF/HTML resource bytes and external script/CSS bytes were not captured and compared",
        "An unchanged article does not repair RESEARCH_ONLY qualification or revive expired facts"
    ],
    "unified_line_diff": line_diff,
}
print(json.dumps(result, ensure_ascii=False, indent=2))
