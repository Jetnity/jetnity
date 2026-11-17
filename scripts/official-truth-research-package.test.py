"""Synthetic fixtures only. No real research, HTTP, credentials or database."""
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('adapter', Path(__file__).with_name('official-truth-research-package.py'))
a = importlib.util.module_from_spec(spec)
spec.loader.exec_module(a)
CODES = 'IN TR CN DE PL IT US UA RO FR NL GB AT ES HU SY CZ AF CH RU HR BE IQ PT BG BR GR IR SK PK ER TH SO VN SE NG EG XK KR LK DK PH JP LB RS LT CA CM MA IL'.split()

class PackageTests(unittest.TestCase):
    def setUp(self):
        self.base = Path(tempfile.mkdtemp(prefix='entry-research-fixture-'))
        self.addCleanup(lambda: shutil.rmtree(self.base))
        self.root = self.base/'research'; self.root.mkdir()
        self.dest = self.root/'records/dest/AT'; self.dest.mkdir(parents=True)
        self.output = self.base/'output'
        self.dump(self.root/'record-schema.json', {'schema':a.SCHEMA,'status':'RESEARCH_ONLY',
                      'nationality_slice':{'mandatory_core_fields':a.CORE}})
        self.csv = 'rank,nationality_iso2,name,score_basis,sources,notes\n' + '\n'.join(
            f'{i+1},{c},Fixture,"'+('x'*2100)+'","https://example.invalid","fixture, only"' for i,c in enumerate(CODES))+'\n'
        (self.root/'passport-priority.csv').write_text(self.csv)
        self.frame = {'schema':a.SCHEMA,'status':'RESEARCH_ONLY','dest_id':'AT','destination_iso2':'AT',
            'file_layout':'split','external_writes':[], 'expected_nationality_slices':CODES,
            'slice_files':[f'records/dest/AT/{c}.json' for c in CODES],
            'slices_by_nationality':{c:i for i,c in enumerate(CODES)},
            'nationality_slices':[{'nationality':c,'file':f'records/dest/AT/{c}.json'} for c in CODES],
            'migration':{'from':'records/dest/AT.json', 'unsplit_preserved_0444':True,
                'to':'records/dest/AT/index.json + records/dest/AT/{NAT}.json'}}
        self.dump(self.dest/'index.json',self.frame)
        self.dump(self.root/'records/dest/AT.json',{'old':'preserve these exact bytes'})
        (self.root/'tracker.csv').write_text('dest_id,nationality,record_pointer,conflict\n'+''.join(
            f'AT,{c},records/dest/AT/{c}.json,\n' for c in CODES))
        for c in CODES:
            record={k:{} for k in a.CORE}
            record.update({'schema':a.SCHEMA,'status':'RESEARCH_ONLY','nationality':c,'destination_iso2':'AT',
                'researched_at':'2026-11-12T20:00:00+01:00','sources':[{'ref':'S1','role':'primary_destination_official',
                'url':'https://example.invalid/source','retrieved_at':'2026-11-12T20:00:00+01:00'}],
                'visa':{'required':'unknown'},'pre_travel_authorization':{'required':False},
                'conflicts':[],'cross_check_result':'no_second_source','external_writes':[]})
            self.dump(self.dest/f'{c}.json',record)
    def dump(self,path,value):
        path.write_text(json.dumps(value, ensure_ascii=False)+'\n')
    def prepare(self):
        return a.prepare(self.root,'AT',self.output)
    def change(self,path,fn):
        value=json.loads(path.read_text());fn(value);self.dump(path,value)
    def test_complete_real_shape_preserves_original_bytes_and_never_promotes(self):
        before=(self.dest/'IN.json').read_bytes()
        counts=self.prepare();self.assertEqual(counts['researchRecords'],50);self.assertEqual(counts['topicSlots'],1300)
        self.assertEqual(a.verify(self.output),counts)
        self.assertEqual((self.output/'original/slices/IN.json').read_bytes(),before)
        rows=json.loads((self.output/'coverage.json').read_text())
        self.assertTrue(all(x['publicValue'] is None and x['customerText']=='derzeit nicht verfügbar' for x in rows))
        self.assertEqual(json.loads((self.output/'manifest.json').read_text())['legacy']['use'],'preserved_not_selected')
        self.assertGreater(len(self.csv),65536)
    def test_explicit_dictionary_slice_mapping_and_migration_shape(self):
        def alter(x):
            x['slice_files'] = {c:f'records/dest/AT/{c}.json' for c in CODES}
            x['migration'] = {'legacy_files_remain': True, 'from_schema':a.SCHEMA, 'to_schema':a.SCHEMA,
                              'method':'split existing research shell', 'legacy_freeze':'legacy left unchanged'}
        self.change(self.dest/'index.json', alter)
        self.prepare()
        m=json.loads((self.output/'manifest.json').read_bytes())
        self.assertEqual(m['legacy']['migrationShape'],'mapped_legacy')
        self.assertEqual(m['counts']['accepted'],0)

    def test_changed_dictionary_mapping_and_undeclared_legacy_fail(self):
        self.change(self.dest/'index.json',lambda x:x.update(slice_files={c:f'records/dest/AT/{c}.json' for c in CODES if c!='IN'}))
        with self.assertRaisesRegex(ValueError,'index_priority_binding'): self.prepare()
        self.change(self.dest/'index.json',lambda x:x.update(slice_files={c:f'records/dest/AT/{c}.json' for c in CODES},migration={}))
        with self.assertRaisesRegex(ValueError,'ambiguous_split_and_legacy'): self.prepare()

    def test_no_silent_split_preference_without_migration(self):
        self.change(self.dest/'index.json',lambda x:x.pop('migration'))
        with self.assertRaisesRegex(ValueError,'ambiguous_split'):self.prepare()
        self.assertFalse(self.output.exists())
    def test_mismatched_tracker_path_and_missing_record_refuse(self):
        p=self.root/'tracker.csv';p.write_text(p.read_text().replace('AT,IN,records/dest/AT/IN.json','AT,IN,../../IN.json'))
        with self.assertRaisesRegex(ValueError,'tracker_pointer'):self.prepare()
        self.assertFalse(self.output.exists())
    def test_priority_must_be_all_fifty_in_actual_order(self):
        self.assertEqual(a.priority(self.csv.encode()),CODES)
        self.change(self.dest/'index.json',lambda x:x['expected_nationality_slices'].reverse())
        with self.assertRaisesRegex(ValueError,'index_priority'):self.prepare()
    def test_no_foreign_nationality_or_destination(self):
        self.change(self.dest/'IN.json',lambda x:x.update(nationality='CH'))
        with self.assertRaisesRegex(ValueError,'slice_identity'):self.prepare()
    def test_duplicate_json_and_hidden_primary_nationality_refuse(self):
        with self.assertRaisesRegex(ValueError,'duplicate_json'):a.strict_json(b'{"x":1,"x":2}')
        self.change(self.dest/'IN.json',lambda x:x.update(nested={'primaryNationality':'IN'}))
        with self.assertRaisesRegex(ValueError,'authority'):self.prepare()
    def test_false_or_unknown_not_rewritten_to_accepted(self):
        self.prepare();raw=json.loads((self.output/'original/slices/IN.json').read_text())
        self.assertEqual(raw['visa']['required'],'unknown');self.assertIs(raw['pre_travel_authorization']['required'],False)
        self.assertTrue(all(x['customerStatus']=='unavailable' for x in json.loads((self.output/'coverage.json').read_text())))
    def test_unresolved_source_reference_and_conflict_stay_blocked(self):
        self.change(self.dest/'IN.json',lambda x:x.update(fees={'amount':'unknown','source_ref':'MISSING'},conflicts=[{'message':'fixture'}]))
        self.prepare();rows=json.loads((self.output/'coverage.json').read_text())
        fee=next(x for x in rows if x['nationality']=='IN' and x['topic']=='entry_fees')
        self.assertEqual(fee['unresolvedSourceRefs'],['MISSING']);self.assertTrue(fee['recordConflictFlag'])
        self.assertEqual(fee['customerStatus'],'unavailable')
    def test_explicit_alternate_source_id_is_preserved_without_truth_promotion(self):
        def use_id(record):
            entry = record['sources'][0]
            entry['id'] = entry.pop('ref')
            record['fees'] = {'source_ref': 'S1', 'amount': 'unknown'}
        self.change(self.dest/'IN.json', use_id)
        self.prepare()
        source = json.loads((self.output/'original/slices/IN.json').read_bytes())['sources'][0]
        self.assertEqual(source.get('id'), 'S1')
        self.assertNotIn('ref', source)
        coverage = json.loads((self.output/'coverage.json').read_bytes())
        fee = next(x for x in coverage if x['nationality']=='IN' and x['topic']=='entry_fees')
        self.assertEqual(fee['unresolvedSourceRefs'], [])
        self.assertEqual(fee['customerStatus'], 'unavailable')
        self.assertIsNone(fee['publicValue'])

    def test_ambiguous_or_duplicate_source_identity_fails_closed(self):
        self.change(self.dest/'IN.json', lambda x: x['sources'][0].update(id='S2'))
        with self.assertRaisesRegex(ValueError, 'source_ref_identity'): self.prepare()
        self.change(self.dest/'IN.json', lambda x: x['sources'][0].pop('ref'))
        self.change(self.dest/'IN.json', lambda x: x['sources'].append(dict(x['sources'][0])))
        with self.assertRaisesRegex(ValueError, 'source_ref_identity'): self.prepare()

    def test_missing_core_and_bad_research_date_refuse(self):
        self.change(self.dest/'IN.json',lambda x:x.pop('transit_rules'))
        with self.assertRaisesRegex(ValueError,'slice_core'):self.prepare()
        self.change(self.dest/'IN.json',lambda x:x.update(transit_rules={},researched_at='2026-11-12'))
        with self.assertRaisesRegex(ValueError,'research_date'):self.prepare()
    def test_symlink_source_and_existing_output_refuse(self):
        p=self.dest/'IN.json';p.rename(self.base/'actual.json');p.symlink_to(self.base/'actual.json')
        with self.assertRaisesRegex(ValueError,'symlink'):self.prepare()
        p.unlink();(self.base/'actual.json').rename(p)
        self.output.mkdir();(self.output/'keep').write_text('keep')
        with self.assertRaisesRegex(ValueError,'output_refused'):self.prepare()
        self.assertEqual((self.output/'keep').read_text(),'keep')
    def test_output_inside_source_refused(self):
        with self.assertRaisesRegex(ValueError,'output_refused'):a.prepare(self.root,'AT',self.root/'new')
    def test_changed_output_is_detected(self):
        self.prepare();p=self.output/'original/slices/IN.json';p.write_bytes(p.read_bytes()+b' ')
        with self.assertRaisesRegex(ValueError,'checksum_mismatch'):a.verify(self.output)

if __name__=='__main__': unittest.main()
