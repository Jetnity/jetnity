"""Deterministic synthetic-only quarantine tests; no archive or network."""
import importlib.util
from pathlib import Path
import hashlib
import json
import shutil
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('gap_audit', Path(__file__).with_name('official-truth-index-gap-audit.py'))
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)
CODES = 'IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL'.split()

class GapAuditTests(unittest.TestCase):
    def setUp(self):
        self.temp=Path(tempfile.mkdtemp(prefix='entry-gap-test-'))
        self.addCleanup(lambda: shutil.rmtree(self.temp))
        self.root=self.temp/'research'; self.root.mkdir()
        self.dest=self.root/'records/dest/BE';self.dest.mkdir(parents=True)
        self.tracker=[]
        self.core=a.base.CORE[:]
        self.index={'schema':'jetnity-entry-requirements-dest-index-v2.2','status':'RESEARCH_ONLY',
            'dest_id':'BE','destination_iso2':'BE','expected_50_set':CODES[:],
            'slice_sha256':{},'nationality_slices':[],'external_writes':[]}
        for code in CODES:
            file=f'records/dest/BE/{code}.json'
            record={k:{} for k in self.core}
            record.update(schema=a.base.SCHEMA,status='RESEARCH_ONLY',nationality=code,
                          destination_iso2='BE',external_writes=[])
            raw=json.dumps(record).encode()
            (self.dest/f'{code}.json').write_bytes(raw)
            digest=hashlib.sha256(raw).hexdigest()
            self.index['slice_sha256'][code]=digest
            self.index['nationality_slices'].append({'nationality':code,'file':file,'sha256':digest})
            self.tracker.append({'dest_id':'BE','nationality':code,'record_pointer':file})
        self.update_index()
    def update_index(self):
        (self.dest/'index.json').write_text(json.dumps(self.index))
    def audit(self):
        return a.audit_index(self.root,'BE',CODES,self.tracker,self.core)
    def test_full_three_way_binding_stays_research_only(self):
        result=self.audit()
        self.assertEqual(result['boundRecords'],50)
        self.assertEqual(result['approved'],0)
        self.assertEqual(result['published'],0)
        self.assertEqual(result['missingCoreRecords'],0)
    def test_missing_core_reported_not_repaired(self):
        f=self.dest/'IN.json';data=json.loads(f.read_bytes());data.pop('truth_state_values');f.write_text(json.dumps(data))
        digest=hashlib.sha256(f.read_bytes()).hexdigest()
        self.index['slice_sha256']['IN']=digest
        self.index['nationality_slices'][0]['sha256']=digest;self.update_index()
        x=self.audit()
        self.assertEqual(x['missingCoreRecords'],1)
        self.assertEqual(x['missingCoreFields'],{'truth_state_values':1})
        self.assertEqual(x['approved'],0)
    def test_tampering_or_tracker_mismatch_quarantines(self):
        self.index['slice_sha256']['IN']='0'*64;self.update_index()
        self.assertEqual(self.audit()['classification'],'quarantined_unbound')
        self.index['slice_sha256']['IN']=self.index['nationality_slices'][0]['sha256'];self.update_index()
        self.tracker[0]['record_pointer']='not/legit.json'
        self.assertEqual(self.audit()['classification'],'quarantined_unbound')
    def test_unexplained_sidecar_quarantines(self):
        (self.root/'records/dest/BE.json').write_text('{}')
        self.assertEqual(self.audit()['classification'],'quarantined_unbound')
    def test_incomplete_index_never_inferred(self):
        self.index['nationality_slices'].pop()
        self.update_index()
        self.assertEqual(self.audit()['classification'],'other_layout')

if __name__=='__main__':unittest.main()
