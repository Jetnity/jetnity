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

    def test_v21_slice_is_preserved_not_upgraded(self):
        self.change(self.dest/'DE.json', lambda x: x.update(schema='jetnity-entry-requirements-research-v2.1'))
        self.prepare()
        raw = json.loads((self.output/'original/slices/DE.json').read_text())
        self.assertEqual(raw['schema'], 'jetnity-entry-requirements-research-v2.1')
        self.assertEqual(a.verify(self.output)['topicSlots'], 1300)

    def test_unexpected_extra_slice_refused(self):
        (self.dest/'ZZ.json').write_text('{}\n')
        with self.assertRaisesRegex(ValueError, 'unexpected_extra_slice'):
            self.prepare()
        self.assertFalse(self.output.exists())

    def test_cn_hk_extra_is_preserved_and_not_merged_into_cn(self):
        dest = self.root/'records/dest/CN-HK'
        self.dest.rename(dest)
        (self.root/'records/dest/AT.json').rename(self.root/'records/dest/CN-HK.json')
        index = json.loads((dest/'index.json').read_text())
        index.update(dest_id='CN-HK', destination_iso2='CN-HK',
                     slice_files=[f'records/dest/CN-HK/{c}.json' for c in CODES],
                     nationality_slices=[{'nationality': c, 'file': f'records/dest/CN-HK/{c}.json'} for c in CODES])
        index['migration'] = {'from': 'records/dest/CN-HK.json', 'unsplit_preserved_0444': True,
                              'to': 'records/dest/CN-HK/index.json + records/dest/CN-HK/{NAT}.json'}
        self.dump(dest/'index.json', index)
        (self.root/'tracker.csv').write_text('dest_id,nationality,record_pointer,conflict\n'+''.join(
            f'CN-HK,{c},records/dest/CN-HK/{c}.json,\n' for c in CODES))
        for code in CODES:
            self.change(dest/f'{code}.json', lambda record: record.update(destination_iso2='CN-HK'))
        (dest/'ZZ.json').write_bytes(b'{"extra":"preserve-these-bytes"}\n')
        counts = a.prepare(self.root, 'CN-HK', self.output)
        self.assertEqual(counts['passports'], 50)
        self.assertEqual(counts['topicSlots'], 1300)
        manifest = json.loads((self.output/'manifest.json').read_text())
        self.assertEqual(manifest['destination'], 'CN-HK')
        self.assertEqual(manifest['extraNotImported']['nationality'], 'ZZ')
        self.assertEqual(manifest['extraNotImported']['use'], 'preserved_not_selected')
        self.assertNotIn('ZZ', manifest['passportPriority'])
        self.assertEqual((self.output/'original/extras-not-imported/ZZ.json').read_bytes(),
                         b'{"extra":"preserve-these-bytes"}\n')
        self.assertFalse((self.root/'records/dest/CN').exists())
        with self.assertRaises(ValueError):
            a.prepare(self.root, 'CN-MO', self.base/'mo')
        self.assertEqual(a.verify(self.output)['accepted'], 0)

    def test_launch_projection_does_not_promote_missing_evidence(self):
        self.assertEqual(len(a.TOPICS), 26)
        projection = a.project_launch('AT', CODES)
        self.assertEqual(projection['historicalTopicCount'], 26)
        self.assertEqual(projection['coreSlots'], 300)
        self.assertEqual(projection['optionalSlots'], 200)
        self.assertEqual(projection['legalEvidenceSlots'], 0)
        self.assertEqual(projection['sourceAssignments'], 0)
        self.assertEqual(projection['coreCompleteProfiles'], 0)
        self.assertEqual(projection['published'], 0)
        self.assertFalse(projection['optionalGapIsCompletenessGate'])
        held = next(slot for slot in projection['slots'] if slot['nationality']=='SO' and slot['topic']=='K1')
        document = next(slot for slot in projection['slots'] if slot['nationality']=='SO' and slot['topic']=='K2')
        self.assertEqual(held['status'], 'open')
        self.assertEqual(document['status'], 'held')
        self.assertFalse(document['legalEvidence'])
        with self.assertRaisesRegex(ValueError, 'territory_is_not_a_passport'):
            a.project_launch('CN', ['CN-HK', *CODES[1:]])
        separate = a.project_launch('CN-HK', CODES)
        self.assertNotEqual(separate['destination'], projection['destination'])

    def test_projection_hold_conflict_optional_gap_and_na_basis(self):
        digest = 'ab' * 32
        def witness(topic, status, nationalities=('DE',), **extra):
            value = {'topic': topic, 'status': status, 'nationalities': list(nationalities),
                     'passportGroup': 'fixture-group', 'exceptions': [], 'published': False}
            if status in ('B', 'BELEGT_BEDINGT', 'N/A'):
                value.update(scope='ordinary_passport_fixture', version='fixture-1', digest=digest,
                             source={'id': 'fixture-source'})
            if status == 'N/A':
                value['legalBasis'] = extra.pop('legalBasis', '')
            value.update(extra)
            return value
        with self.assertRaisesRegex(ValueError, 'na_without_legal_basis'):
            a.project_launch('AT', CODES, [witness('K3', 'N/A', legalBasis='')])
        with self.assertRaisesRegex(ValueError, 'held_topic_conflict'):
            a.project_launch('AT', CODES, [witness('K2', 'B', nationalities=('SO',))])
        with self.assertRaisesRegex(ValueError, 'projection_conflict'):
            a.project_launch('AT', CODES, [witness('K1', 'B'), witness('K1', 'B', digest='cd'*32)])
        with self.assertRaisesRegex(ValueError, 'publication_refused'):
            a.project_launch('AT', CODES, [witness('K1', 'B', published=True)])
        evidenced = [witness(topic, 'B') for topic in ('K1', 'K2', 'K3', 'K4', 'K5', 'K6')]
        evidenced.append(witness('Z1', 'unknown'))
        evidenced.append(witness('K1', 'B'))
        projection = a.project_launch('AT', CODES, evidenced)
        self.assertEqual(projection['coreCompleteProfiles'], 0)
        self.assertEqual(projection['legalEvidenceSlots'], 0)
        self.assertEqual(projection['sourceAssignments'], 0)
        self.assertEqual(projection['witnessClass'], 'unverified_research_witness')
        self.assertEqual(projection['published'], 0)
        optional = next(slot for slot in projection['slots'] if slot['nationality']=='DE' and slot['topic']=='Z1')
        self.assertEqual(optional['status'], 'unverified')
        self.assertFalse(optional['legalEvidence'])
        self.assertFalse(optional['completenessGate'])
        so = next(slot for slot in projection['slots'] if slot['nationality']=='SO' and slot['topic']=='K2')
        self.assertEqual(so['status'], 'held')
        supplied = next(slot for slot in projection['slots'] if slot['nationality']=='DE' and slot['topic']=='K1')
        self.assertEqual(supplied['status'], 'unverified')
        self.assertEqual(supplied['suppliedStatus'], 'B')
        with self.assertRaisesRegex(ValueError, 'witness_destination'):
            a.project_launch('AT', CODES, [witness('K1', 'B', destination='DE')])
        with self.assertRaisesRegex(ValueError, 'official_witness_not_bound'):
            a.project_launch('AT', CODES, [witness('K1', 'B', witnessClass='checked_official')])
        with self.assertRaisesRegex(ValueError, 'projection_conflict'):
            a.project_launch('AT', CODES, [witness('K1', 'B'), witness('K1', 'B', source={'id': 'other'})])
        long_text = witness('K3', 'B', text='x' * 4000)
        text_only = a.project_launch('FR', CODES, [long_text])
        self.assertEqual(text_only['legalEvidenceSlots'], 0)
        self.assertEqual(text_only['coreCompleteProfiles'], 0)
        france = next(slot for slot in text_only['slots'] if slot['nationality']=='SO' and slot['topic']=='K2')
        self.assertEqual(france['status'], 'open')

    def test_identical_tracker_duplicates_bind_once_and_conflicts_hold(self):
        text = (self.root/'tracker.csv').read_text()
        line = 'AT,IN,records/dest/AT/IN.json,\n'
        (self.root/'tracker.csv').write_text(text.replace(line, line + line, 1))
        counts = self.prepare()
        self.assertEqual(counts['passports'], 50)
        self.assertEqual(counts['accepted'], 0)
        before = (self.root/'tracker.csv').read_bytes()
        (self.root/'tracker.csv').write_bytes(before + b'AT,DE,records/dest/AT/OTHER.json,\n')
        with self.assertRaisesRegex(ValueError, 'tracker_row_conflict'):
            a.prepare(self.root, 'AT', self.base/'other-out')
        self.assertEqual((self.root/'tracker.csv').read_bytes(), before + b'AT,DE,records/dest/AT/OTHER.json,\n')
        restored = before
        same = b'AT,FR,records/dest/AT/FR.json,\n'
        (self.root/'tracker.csv').write_bytes(restored.replace(
            same, b'AT,FR,records/dest/AT/FR.json,held\n' + same, 1))
        with self.assertRaisesRegex(ValueError, 'tracker_field_conflict'):
            a.prepare(self.root, 'AT', self.base/'field-out')
        self.assertIn(b'AT,FR,records/dest/AT/FR.json,held\n', (self.root/'tracker.csv').read_bytes())

    def test_consistent_index_order_keeps_csv_selection_and_original_bytes(self):
        original = (self.dest/'index.json').read_bytes()
        reversed_codes = list(reversed(CODES))

        def reorder(frame):
            frame['expected_nationality_slices'] = reversed_codes
            frame['slice_files'] = [f'records/dest/AT/{code}.json' for code in reversed_codes]
            frame['slices_by_nationality'] = {code: index for index, code in enumerate(reversed_codes)}
            frame['nationality_slices'] = [{'nationality': code, 'file': f'records/dest/AT/{code}.json'}
                                           for code in reversed_codes]

        self.change(self.dest/'index.json', reorder)
        self.prepare()
        manifest = json.loads((self.output/'manifest.json').read_text())
        self.assertEqual(manifest['passportPriority'], CODES)
        self.assertIn('index_order_follows_csv', manifest['indexNotes'])
        self.assertEqual((self.output/'original/destination-index.json').read_bytes(),
                         (self.dest/'index.json').read_bytes())
        self.assertNotEqual((self.dest/'index.json').read_bytes(), original)

    def test_research_status_variant_is_preserved_not_promoted(self):
        self.change(self.dest/'IN.json', lambda record: record.update(status='researched'))
        self.prepare()
        raw = json.loads((self.output/'original/slices/IN.json').read_text())
        self.assertEqual(raw['status'], 'researched')
        self.assertEqual(a.verify(self.output)['published'], 0)
        self.assertTrue(all(row['publicationAuthority']=='none'
                            for row in json.loads((self.output/'coverage.json').read_text())))

    def test_absent_destination_id_is_not_invented(self):
        def drop(frame):
            frame.pop('dest_id')
        self.change(self.dest/'index.json', drop)
        self.prepare()
        original = json.loads((self.output/'original/destination-index.json').read_text())
        self.assertNotIn('dest_id', original)
        notes = json.loads((self.output/'manifest.json').read_text())['indexNotes']
        self.assertIn('dest_id_absent', notes)

    def test_negative_tracker_token_is_kept_and_is_not_evidence(self):
        text = (self.root/'tracker.csv').read_text().replace(',\n', ',nein\n')
        text = text.replace('AT,IN,records/dest/AT/IN.json,nein\n', 'AT,IN,records/dest/AT/IN.json, Nein \n', 1)
        (self.root/'tracker.csv').write_text(text)
        counts = self.prepare()
        self.assertEqual(counts['accepted'], 0)
        copied = (self.output/'original/tracker-destination.csv').read_text()
        self.assertIn('AT,IN,records/dest/AT/IN.json, Nein ', copied)
        coverage = json.loads((self.output/'coverage.json').read_text())
        self.assertTrue(all(row['recordConflictFlag'] is False for row in coverage))
        self.assertTrue(all(row['publicationAuthority'] == 'none' for row in coverage))

    def test_positive_unknown_and_historical_tracker_text_stay_held(self):
        original = (self.root/'tracker.csv').read_bytes()
        for token in ('ja', 'unbekannt', 'erledigt 2020 Quelle offen'):
            text = original.decode().replace('AT,IN,records/dest/AT/IN.json,\n',
                                             f'AT,IN,records/dest/AT/IN.json,{token}\n', 1)
            (self.root/'tracker.csv').write_text(text)
            written = (self.root/'tracker.csv').read_bytes()
            with self.assertRaisesRegex(ValueError, 'tracker_conflict_flag'):
                a.prepare(self.root, 'AT', self.base/token[:8])
            self.assertEqual((self.root/'tracker.csv').read_bytes(), written)
        self.assertEqual(a.tracker_conflict_class('ja'), 'positive')
        self.assertEqual(a.tracker_conflict_class(''), 'empty')
        self.assertEqual(a.tracker_conflict_class('erledigt 2020'), 'unresolved')

    def test_negative_tracker_does_not_clear_a_slice_conflict(self):
        text = (self.root/'tracker.csv').read_text().replace(
            'AT,IN,records/dest/AT/IN.json,\n', 'AT,IN,records/dest/AT/IN.json,nein\n', 1)
        (self.root/'tracker.csv').write_text(text)
        before = (self.root/'tracker.csv').read_bytes()
        self.change(self.dest/'IN.json', lambda record: record.update(conflicts=[{'message': 'fixture'}]))
        with self.assertRaisesRegex(ValueError, 'tracker_slice_conflict'):
            self.prepare()
        self.assertEqual((self.root/'tracker.csv').read_bytes(), before)
        self.assertFalse(self.output.exists())

    def test_revision_differences_are_named_and_not_selected(self):
        header = 'dest_id,nationality,record_pointer,conflict,note,primary_source\n'
        rows = []
        for code in CODES:
            note, source = ('a', 's1')
            rows.append(f'AT,{code},records/dest/AT/{code}.json,,{note},{source}')
        rows.append('AT,IN,records/dest/AT/IN.json,,b,s2')
        (self.root/'tracker.csv').write_text(header + '\n'.join(rows) + '\n')
        before = (self.root/'tracker.csv').read_bytes()
        revision = a.tracker_revision([
            {'record_pointer': 'records/dest/AT/IN.json', 'note': 'a', 'primary_source': 's1'},
            {'record_pointer': 'records/dest/AT/IN.json', 'note': 'b', 'primary_source': 's2'},
        ])
        self.assertEqual(revision['differingFields'], ['note', 'primary_source'])
        self.assertTrue(revision['samePointer'])
        self.assertFalse(revision['selected'])
        with self.assertRaisesRegex(ValueError, 'tracker_field_conflict'):
            self.prepare()
        self.assertEqual((self.root/'tracker.csv').read_bytes(), before)

    def test_missing_pointer_list_is_allowed_only_when_the_other_binding_is_unique(self):
        def drop(frame):
            frame.pop('nationality_slices')
        self.change(self.dest/'index.json', drop)
        self.prepare()
        notes = json.loads((self.output/'manifest.json').read_text())['indexNotes']
        self.assertIn('pointer_list_absent', notes)
        self.assertIn('hash_declaration_absent', notes)

    def test_contradictory_pointer_is_not_ignored(self):
        def clash(frame):
            frame['nationality_slices'][0]['file'] = 'records/dest/AT/OTHER.json'
        self.change(self.dest/'index.json', clash)
        with self.assertRaisesRegex(ValueError, 'index_pointer_identity'):
            self.prepare()

    def test_unknown_schema_and_unredacted_variant_stay_held(self):
        self.change(self.dest/'index.json', lambda frame: frame.update(schema='not-a-documented-schema'))
        with self.assertRaisesRegex(ValueError, 'unknown_index_schema'):
            self.prepare()
        self.change(self.dest/'index.json', lambda frame: frame.update(
            schema='jetnity-entry-requirements-dest-index-v1', expected_nationality_slices=None,
            slice_files=None, slices_by_nationality=None, nationality_slices=None))
        with self.assertRaisesRegex(ValueError, 'index_structure_unredacted'):
            a.prepare(self.root, 'AT', self.base/'v1-out')
        self.change(self.dest/'index.json', lambda frame: frame.update(destination_iso2='DE'))
        with self.assertRaisesRegex(ValueError, 'split_frame_identity'):
            a.prepare(self.root, 'AT', self.base/'wrong-dest')

    def test_documented_v1_binding_and_dest_index_hashes(self):
        def as_v1(frame):
            frame['schema'] = 'jetnity-entry-requirements-dest-index-v1'
            frame.pop('nationality_slices')
        self.change(self.dest/'index.json', as_v1)
        self.prepare()
        notes = json.loads((self.output/'manifest.json').read_text())['indexNotes']
        self.assertIn('dest_index_v1', notes)
        self.assertIn('pointer_list_absent', notes)
        digest = a.sha((self.dest/'IN.json').read_bytes())
        def as_v22(frame):
            frame['schema'] = 'jetnity-entry-requirements-dest-index-v2.2'
            frame['expected_50_set'] = list(CODES)
            frame['nationality_slices'] = [
                {'nationality': code, 'file': f'records/dest/AT/{code}.json', 'sha256': 'ab'*32}
                for code in CODES]
            frame['slice_sha256'] = {code: 'ab'*32 for code in CODES}
        self.change(self.dest/'index.json', as_v22)
        with self.assertRaisesRegex(ValueError, 'index_hash_mismatch'):
            a.prepare(self.root, 'AT', self.base/'hash-out')
        def matching(frame):
            frame['nationality_slices'] = [
                {'nationality': code, 'file': f'records/dest/AT/{code}.json',
                 'sha256': a.sha((self.dest/f'{code}.json').read_bytes())}
                for code in CODES]
            frame['slice_sha256'] = {row['nationality']: row['sha256'] for row in frame['nationality_slices']}
        self.change(self.dest/'index.json', matching)
        counts = a.prepare(self.root, 'AT', self.base/'hash-ok')
        self.assertEqual(counts['published'], 0)
        self.assertNotIn('medication_import', [topic for _key, _name, topics in a.LAUNCH_CORE for topic in topics])

    def test_diagnose_collects_every_finding_and_does_not_pass(self):
        self.change(self.dest/'IN.json', lambda record: record.pop('truth_state_values'))
        before = sorted(path.relative_to(self.root).as_posix() for path in self.root.rglob('*'))
        report = a.diagnose(self.root)
        after = sorted(path.relative_to(self.root).as_posix() for path in self.root.rglob('*'))
        self.assertEqual(after, before)
        self.assertEqual(report['legalEvidenceSlots'], 0)
        self.assertEqual(report['published'], 0)
        self.assertEqual(report['accepted'], 0)
        self.assertEqual(report['historicalComparisonNotAPass']['role'], 'historical_comparison_not_a_pass')
        self.assertNotEqual(report['candidateProfiles'], report['historicalComparisonNotAPass']['noOwnFindingInThatCheck'])
        gap = next(row for row in report['findings'] if row['code'] == 'historical_key_absent')
        self.assertEqual(gap['keys'], ['truth_state_values'])
        self.assertTrue(all(row['preparedPackage'] is False and row['legalEvidence'] is False
                            for row in report['candidates']))
        with self.assertRaisesRegex(ValueError, 'slice_core'):
            self.prepare()

    def test_diagnose_keeps_profile_findings_when_the_destination_is_held(self):
        header = 'dest_id,nationality,record_pointer,conflict,note\n'
        lines = []
        for code in CODES:
            conflict = 'ja' if code == 'DE' else ''
            lines.append(f'AT,{code},records/dest/AT/{code}.json,{conflict},a')
        lines.append('AT,FR,records/dest/AT/FR.json,,b')
        (self.root/'tracker.csv').write_text(header + '\n'.join(lines) + '\n')
        self.change(self.dest/'IN.json', lambda record: record.update(nationality='ZZ'))
        self.change(self.dest/'TR.json', lambda record: record.pop('health_entry'))
        self.change(self.dest/'index.json', lambda frame: frame['nationality_slices'][0].update(sha256=None))
        before = (self.root/'tracker.csv').read_bytes()
        report = a.diagnose(self.root)
        codes = {row['code'] for row in report['findings'] if row['destination'] == 'AT'}
        self.assertTrue({'tracker_conflict_flag', 'tracker_field_conflict', 'slice_identity',
                         'historical_key_absent', 'index_hash_mismatch'} <= codes)
        self.assertFalse(any(row['destination'] == 'AT' for row in report['candidates']))
        self.assertEqual((self.root/'tracker.csv').read_bytes(), before)
        self.assertEqual(report['legalEvidenceSlots'], 0)

    def test_hr_hold_still_reports_profile_findings_and_so_hold_stays_visible(self):
        held = self.root/'records/dest/HR'
        held.mkdir()
        (held/'index.json').write_text('[]\n')
        (held/'IN.json').write_text('[]\n')
        report = a.diagnose(self.root)
        hr = [row['code'] for row in report['findings'] if row['destination'] == 'HR']
        self.assertIn('unsplit_research_frame_not_importable', hr)
        self.assertIn('index_not_object', hr)
        self.assertIn('slice_not_object', hr)
        self.assertFalse(any(row['destination'] == 'HR' for row in report['candidates']))
        so = next(row for row in report['candidates'] if row['nationality'] == 'SO')
        self.assertEqual(so['holdStatus'], ['document_recognition_hold'])
        self.assertFalse(so['legalEvidence'])
        self.assertFalse(so['preparedPackage'])

    def test_catalog_coverage_counts_missing_destinations_and_bad_slices(self):
        self.change(self.dest/'US.json', lambda record: record.update(status='published', destination_iso2='DE',
                                                                       schema='not-a-slice'))
        (self.dest/'US.json').write_text('{"external_writes":["x"],"schema":"not-a-slice","status":"published",'
                                         '"nationality":"ZZ","destination_iso2":"DE"}\n')
        report = a.diagnose(self.root)
        self.assertEqual(report['destinationsExamined'], 206)
        self.assertEqual(report['pairsExamined'], 206 * 50)
        self.assertEqual(report['pairsExamined'], report['pairsWithFindings'] + report['pairsWithoutFindings'])
        self.assertNotEqual(report['destinationsExamined'], report['candidateProfiles'])
        us = [row['code'] for row in report['findings'] if row['destination'] == 'AT' and row['nationality'] == 'US']
        self.assertTrue({'slice_identity'} <= set(us))
        self.assertGreater(us.count('slice_identity'), 1)
        self.assertIn('slice_authority', us)
        self.assertFalse(any(row['nationality'] == 'US' and row['holdStatus'] == ['none'] for row in report['candidates']))
        self.assertTrue(any(row['code'] == 'destination_absent' for row in report['findings']))

    def test_present_redundant_maps_and_null_hash_are_not_ignored(self):
        def clash(frame):
            frame['schema'] = 'jetnity-entry-requirements-dest-index-v2.2'
            frame['expected_50_set'] = list(CODES)
            frame['slice_sha256'] = {code: 'ab' * 32 for code in CODES}
            frame['slices_by_nationality'] = {code: 0 for code in CODES}
        self.change(self.dest/'index.json', clash)
        with self.assertRaisesRegex(ValueError, 'index_mapping'):
            self.prepare()
        def null_hash(frame):
            frame['slices_by_nationality'] = {code: index for index, code in enumerate(CODES)}
            frame['nationality_slices'][0]['sha256'] = None
        self.change(self.dest/'index.json', null_hash)
        with self.assertRaisesRegex(ValueError, 'index_hash_mismatch'):
            a.prepare(self.root, 'AT', self.base/'null-hash')
        def research_hash(frame):
            frame['schema'] = a.SCHEMA
            frame.pop('slice_sha256')
            frame['nationality_slices'][0]['sha256'] = 'cd' * 32
            frame['expected_50_set'] = list(reversed(CODES))
        self.change(self.dest/'index.json', research_hash)
        with self.assertRaisesRegex(ValueError, 'index_priority_binding|index_hash_mismatch'):
            a.prepare(self.root, 'AT', self.base/'research-hash')

    def test_non_object_index_is_a_destination_hold_and_slices_stay_visible(self):
        self.change(self.dest/'IN.json', lambda record: record.update(nationality='ZZ'))
        for literal in ('null', 'false', '0', '"AT"', '[]'):
            (self.dest/'index.json').write_text(literal + '\n')
            report = a.diagnose(self.root)
            codes = [row['code'] for row in report['findings'] if row['destination'] == 'AT']
            self.assertIn('index_not_object', codes)
            self.assertIn('slice_identity', codes)
            self.assertFalse(any(row['destination'] == 'AT' for row in report['candidates']))
            self.assertTrue(report['inventoryIsNotAPass'])
            self.assertNotEqual(report['destinationsExamined'], report['candidateProfiles'])
            self.assertEqual(sum(report['profileStatus'].values()), report['pairsExamined'])
            self.assertEqual(report['pairsExamined'], 206 * 50)
            self.assertEqual(report['pairsWithoutFindings'], report['profileStatus']['checked'])
            self.assertEqual(report['pairsWithFindings'] + report['pairsWithoutFindings'], report['pairsExamined'])
            self.assertEqual(report['profileStatus']['checked'], 0)
            self.assertEqual(report['profileStatus']['held'], 50)
            self.assertGreaterEqual(report['notCheckablePairs'], 205 * 50)
            self.assertEqual(report['legalEvidenceSlots'], 0)
            self.assertTrue(all(row['legalEvidence'] is False for row in report['candidates']))

    def test_unhashable_and_mixed_index_fields_do_not_abort_diagnosis(self):
        self.change(self.dest/'IN.json', lambda record: record.update(nationality='ZZ'))
        self.change(self.dest/'index.json', lambda frame: frame.__setitem__('schema', ['not-a-name']))
        report = a.diagnose(self.root)
        codes = [row['code'] for row in report['findings'] if row['destination'] == 'AT']
        self.assertIn('unknown_index_schema', codes)
        self.assertIn('slice_identity', codes)
        self.assertFalse(any(row['destination'] == 'AT' for row in report['candidates']))
        frame = json.loads((self.dest/'index.json').read_text())
        frame['schema'] = a.SCHEMA
        frame['expected_50_set'] = [{'nested': True}]
        with self.assertRaisesRegex(ValueError, 'index_priority_binding'):
            a.index_binding(frame, 'AT', CODES)
        frame.pop('expected_50_set')
        frame['expected_nationality_slices'] = [1, *CODES[1:]]
        with self.assertRaisesRegex(ValueError, 'index_priority_binding'):
            a.index_binding(frame, 'AT', CODES)
        frame['expected_nationality_slices'] = list(CODES)
        frame['slices_by_nationality'] = {code: {'bad': True} for code in CODES}
        with self.assertRaisesRegex(ValueError, 'index_mapping'):
            a.index_binding(frame, 'AT', CODES)

    def test_legacy_path_checks_hashes_and_null_is_not_absence(self):
        binding = ('expected_nationality_slices', 'slice_files', 'slices_by_nationality', 'nationality_slices')

        def drop(frame):
            for key in binding:
                frame.pop(key, None)

        self.change(self.dest/'index.json', drop)
        a.prepare(self.root, 'AT', self.base/'legacy-ok')
        notes = json.loads((self.base/'legacy-ok'/'manifest.json').read_text())['indexNotes']
        self.assertIn('index_fields_absent', notes)
        self.assertIn('hash_declaration_absent', notes)
        self.assertEqual(json.loads((self.base/'legacy-ok'/'manifest.json').read_text())['counts']['published'], 0)

        def wrong_set(frame):
            drop(frame)
            frame['expected_50_set'] = ['XX'] * 50
        self.change(self.dest/'index.json', wrong_set)
        with self.assertRaisesRegex(ValueError, 'index_priority_binding'):
            a.prepare(self.root, 'AT', self.base/'legacy-set')

        def null_hash(frame):
            drop(frame)
            frame.pop('expected_50_set', None)
            frame['slice_sha256'] = None
        self.change(self.dest/'index.json', null_hash)
        with self.assertRaisesRegex(ValueError, 'index_hash_mismatch'):
            a.prepare(self.root, 'AT', self.base/'legacy-null')

        def bad_hash(frame):
            drop(frame)
            frame.pop('expected_50_set', None)
            frame['slice_sha256'] = {code: 'ab' * 32 for code in CODES}
        self.change(self.dest/'index.json', bad_hash)
        with self.assertRaisesRegex(ValueError, 'index_hash_mismatch'):
            a.prepare(self.root, 'AT', self.base/'legacy-hash')
        self.change(self.dest/'TR.json', lambda record: record.pop('health_entry'))
        report = a.diagnose(self.root)
        tr = [row['code'] for row in report['findings'] if row['destination'] == 'AT' and row['nationality'] == 'TR']
        self.assertIn('historical_key_absent', tr)
        self.assertIn('index_hash_mismatch', [row['code'] for row in report['findings'] if row['destination'] == 'AT'])
        self.assertFalse(any(row['destination'] == 'AT' for row in report['candidates']))

        self.dump(self.dest/'index.json', self.frame)
        self.change(self.dest/'index.json', lambda frame: frame.__setitem__('nationality_slices', None))
        with self.assertRaisesRegex(ValueError, 'index_pointer_identity'):
            a.prepare(self.root, 'AT', self.base/'null-pointer')
        self.dump(self.dest/'index.json', self.frame)
        self.change(self.dest/'index.json', lambda frame: frame.__setitem__('file_layout', None))
        with self.assertRaisesRegex(ValueError, 'split_frame_identity'):
            a.prepare(self.root, 'AT', self.base/'null-layout')

    def test_missing_pointer_schema_and_provenance_are_not_a_clean_candidate(self):
        self.change(self.dest/'IN.json', lambda record: record.update(nationality='ZZ'))
        (self.root/'tracker.csv').write_text('dest_id,nationality,conflict\n' + ''.join(f'AT,{code},\n' for code in CODES))
        report = a.diagnose(self.root)
        codes = [row['code'] for row in report['findings'] if row['destination'] == 'AT']
        self.assertIn('tracker_columns', codes)
        self.assertIn('slice_identity', codes)
        self.assertNotIn('tracker_conflict_flag', codes)
        self.assertFalse(any(row['destination'] == 'AT' for row in report['candidates']))
        self.assertTrue(all(row.get('conflictAbsenceProven') is False for row in report['candidates']))

        (self.root/'tracker.csv').write_text('dest_id,nationality,record_pointer\n' + ''.join(
            f'AT,{code},records/dest/AT/{code}.json\n' for code in CODES))
        report = a.diagnose(self.root)
        self.assertIn('tracker_conflict_undeclared', [row['code'] for row in report['findings']])
        self.assertFalse(any(row['destination'] == 'AT' and row.get('holdStatus') == ['none'] for row in report['candidates']))

        (self.root/'tracker.csv').write_text('dest_id,nationality,record_pointer,conflict\n' + ''.join(
            f'AT,{code},records/dest/AT/{"OTHER" if code == "IN" else code}.json,\n' for code in CODES))
        report = a.diagnose(self.root)
        self.assertIn('tracker_pointer_mismatch', [row['code'] for row in report['findings']
                                                   if row['nationality'] == 'IN'])
        self.assertFalse(any(row['nationality'] == 'IN' and row.get('holdStatus') == ['none'] for row in report['candidates']))

        schema = self.root/'record-schema.json'
        schema.unlink()
        report = a.diagnose(self.root)
        self.assertIn('schema_unreadable', [row['code'] for row in report['findings']])
        self.assertIn('slice_identity', [row['code'] for row in report['findings'] if row['nationality'] == 'IN'])
        self.assertEqual(report['candidates'], [])
        self.dump(schema, {'schema': a.SCHEMA, 'status': 'RESEARCH_ONLY',
                           'nationality_slice': {'mandatory_core_fields': ['not-the-core']}})
        report = a.diagnose(self.root)
        self.assertIn('schema_core_changed', [row['code'] for row in report['findings']])
        self.assertEqual(report['candidates'], [])
        self.assertEqual(report['legalEvidenceSlots'], 0)

        self.dump(schema, {'schema': a.SCHEMA, 'status': 'RESEARCH_ONLY',
                           'nationality_slice': {'mandatory_core_fields': a.CORE}})
        self.dump(self.dest/'index.json', self.frame)
        self.change(self.dest/'IN.json', lambda record: record.update(nationality='IN', sources=[]))
        self.change(self.dest/'TR.json', lambda record: record['sources'][0].__setitem__('url', 'http://insecure.example/source'))
        self.change(self.dest/'DE.json', lambda record: record.__setitem__('fees', {'source_ref': 'MISSING'}))
        (self.dest/'US.json').write_text('[]\n')
        self.change(self.dest/'FR.json', lambda record: record.__setitem__('sources', {'ref': 'S1'}))
        (self.root/'tracker.csv').write_text('dest_id,nationality,record_pointer,conflict\n' + ''.join(
            f'AT,{code},records/dest/AT/{code}.json,\n' for code in CODES))
        report = a.diagnose(self.root)
        by_code = {}
        for row in report['candidates']:
            if row['destination'] == 'AT':
                by_code.setdefault(row['nationality'], row['holdStatus'])
        self.assertIn('sources_empty', by_code['IN'])
        self.assertNotEqual(by_code['IN'], ['none'])
        self.assertIn('source_metadata_unconfirmed', by_code['TR'])
        self.assertIn('unresolved_source_refs', by_code['DE'])
        self.assertNotIn('US', by_code)
        self.assertNotIn('FR', by_code)
        self.assertIn('slice_not_object', [row['code'] for row in report['findings'] if row['nationality'] == 'US'])
        self.assertIn('sources_shape', [row['code'] for row in report['findings'] if row['nationality'] == 'FR'])
        self.assertGreater(report['notCheckablePairs'], 205 * 50)
        self.assertIn('notCheckable', report['profileStatus'])
        self.assertTrue(report['inventoryIsNotAPass'])
        self.assertEqual(report['legalEvidenceSlots'], 0)
        self.assertTrue(all(row['legalEvidence'] is False and row['conflictAbsenceProven'] is False
                            for row in report['candidates']))

    def test_bad_status_url_conflict_and_parse_do_not_abort_or_look_missing(self):
        good = (self.dest/'RO.json').read_bytes()
        self.change(self.dest/'IN.json', lambda record: record.update(status=[], nationality='ZZ'))
        self.change(self.dest/'IN.json', lambda record: record['sources'][0].__setitem__('url', []))
        self.change(self.dest/'CN.json', lambda record: record.update(status={}))
        self.change(self.dest/'TR.json', lambda record: record.pop('health_entry'))
        self.change(self.dest/'TR.json', lambda record: record['sources'][0].__setitem__('url', {'bad': True}))
        self.change(self.dest/'DE.json', lambda record: record['sources'][0].__setitem__('url', [1]))
        self.change(self.dest/'DE.json', lambda record: record.__setitem__('conflicts', None))
        self.change(self.dest/'GB.json', lambda record: record.pop('conflicts'))
        self.change(self.dest/'index.json', lambda frame: frame['nationality_slices'][CODES.index('US')].__setitem__('sha256', 'ab' * 32))
        (self.dest/'US.json').write_text('[]\n')
        (self.dest/'FR.json').write_text('{')
        (self.dest/'PL.json').unlink()
        report = a.diagnose(self.root)
        self.assertEqual(report['pairsExamined'], 206 * 50)
        self.assertEqual(sum(report['profileStatus'].values()), report['pairsExamined'])
        self.assertEqual(report['pairsWithFindings'] + report['pairsWithoutFindings'], report['pairsExamined'])
        self.assertTrue(report['inventoryIsNotAPass'])
        self.assertEqual(report['legalEvidenceSlots'], 0)
        self.assertEqual(report['published'], 0)
        self.assertEqual(report['accepted'], 0)
        inn = [row['code'] for row in report['findings'] if row['nationality'] == 'IN']
        self.assertIn('slice_identity', inn)
        self.assertIn('source_metadata_unconfirmed', inn)
        self.assertIn('slice_identity', [row['code'] for row in report['findings'] if row['nationality'] == 'CN'])
        self.assertIn('historical_key_absent', [row['code'] for row in report['findings'] if row['nationality'] == 'TR'])
        self.assertIn('source_metadata_unconfirmed', [row['code'] for row in report['findings'] if row['nationality'] == 'TR'])
        self.assertIn('source_metadata_unconfirmed', [row['code'] for row in report['findings'] if row['nationality'] == 'DE'])
        self.assertIn('conflict_undeclared', [row['code'] for row in report['findings'] if row['nationality'] == 'DE'])
        self.assertIn('conflict_undeclared', [row['code'] for row in report['findings'] if row['nationality'] == 'GB'])
        us = [row['code'] for row in report['findings'] if row['nationality'] == 'US']
        self.assertIn('slice_not_object', us)
        self.assertIn('index_hash_mismatch', us)
        self.assertIn('slice_parse_error', [row['code'] for row in report['findings'] if row['nationality'] == 'FR'])
        self.assertNotIn('slice_absent', [row['code'] for row in report['findings'] if row['nationality'] == 'FR'])
        self.assertIn('slice_absent', [row['code'] for row in report['findings'] if row['nationality'] == 'PL'])
        self.assertNotIn('slice_parse_error', [row['code'] for row in report['findings'] if row['nationality'] == 'PL'])
        self.assertFalse(any(row['destination'] == 'AT' and row.get('holdStatus') == ['none'] for row in report['candidates']))
        self.assertTrue(all(row['legalEvidence'] is False and row['conflictAbsenceProven'] is False
                            for row in report['candidates']))
        self.assertGreater(report['profileStatus']['notCheckable'], 0)
        self.assertGreater(report['profileStatus']['missing'], 205 * 50)
        with self.assertRaisesRegex(ValueError, 'slice_identity'):
            self.prepare()

        for code in ('IN', 'CN', 'TR', 'DE', 'GB', 'US', 'FR', 'PL'):
            (self.dest/f'{code}.json').write_bytes(good)
            self.change(self.dest/f'{code}.json', lambda record, code=code: record.update(
                nationality=code, destination_iso2='AT', status='RESEARCH_ONLY'))
        self.dump(self.dest/'index.json', self.frame)
        self.change(self.dest/'GB.json', lambda record: record.__setitem__('conflicts', None))
        quiet = a.diagnose(self.root)
        gb = next(row for row in quiet['candidates'] if row['nationality'] == 'GB')
        self.assertIn('conflict_undeclared', gb['holdStatus'])
        self.assertNotEqual(gb['holdStatus'], ['none'])
        self.assertFalse(gb['conflictAbsenceProven'])
        self.assertFalse(gb['legalEvidence'])
        self.change(self.dest/'GB.json', lambda record: record.__setitem__('conflicts', []))
        self.change(self.dest/'IN.json', lambda record: record['sources'][0].__setitem__('url', []))
        counts = a.prepare(self.root, 'AT', self.base/'url-list')
        self.assertEqual(counts['published'], 0)
        prepared = json.loads((self.base/'url-list'/'manifest.json').read_text())['records']
        self.assertTrue(next(row for row in prepared if row['nationality'] == 'IN')['sourceMetadataWarnings'])
        self.change(self.dest/'IN.json', lambda record: record.__setitem__('conflicts', {'bad': True}))
        with self.assertRaisesRegex(ValueError, 'conflict_undeclared'):
            a.prepare(self.root, 'AT', self.base/'conflict-type')

    def test_untyped_migration_is_a_destination_hold_not_a_crash(self):
        before = (self.root/'records/dest/AT.json').read_bytes()
        for value in (None, [], 'text', 0):
            self.change(self.dest/'index.json', lambda frame, value=value: frame.__setitem__('migration', value))
            with self.assertRaisesRegex(ValueError, 'ambiguous_split_and_legacy'):
                self.prepare()
            self.assertFalse(self.output.exists())
            report = a.diagnose(self.root)
            self.assertIn('ambiguous_split_and_legacy', [row['code'] for row in report['findings'] if row['destination'] == 'AT'])
            self.assertFalse(any(row['destination'] == 'AT' for row in report['candidates']))
            self.assertEqual(report['legalEvidenceSlots'], 0)
            self.assertEqual((self.root/'records/dest/AT.json').read_bytes(), before)

    def test_unknown_read_error_propagates_and_known_json_stays_local(self):
        original = a.read_file
        for target in ("record-schema.json", "records/dest/AT/index.json", "records/dest/AT/IN.json"):
            def fail(root, relative, limit=8 * 1024 * 1024, target=target):
                if relative == target:
                    raise ValueError("synthetic_unknown_read_failure")
                return original(root, relative, limit)
            a.read_file = fail
            try:
                with self.assertRaises(ValueError) as caught:
                    a.diagnose(self.root)
                self.assertEqual(caught.exception.args, ("synthetic_unknown_read_failure",))
            finally:
                a.read_file = original
        def denied(root, relative, limit=8 * 1024 * 1024):
            if relative == "records/dest/AT/index.json":
                raise PermissionError(13, "denied")
            return original(root, relative, limit)
        a.read_file = denied
        try:
            with self.assertRaises(PermissionError):
                a.diagnose(self.root)
        finally:
            a.read_file = original
        schema = self.root / "record-schema.json"
        saved = schema.read_bytes()
        schema.unlink()
        missing = a.diagnose(self.root)
        self.assertIn("schema_unreadable", [row["code"] for row in missing["findings"]])
        self.assertEqual(missing["legalEvidenceSlots"], 0)
        schema.write_bytes(b"{")
        broken = a.diagnose(self.root)
        self.assertIn("schema_unreadable", [row["code"] for row in broken["findings"]])
        schema.write_bytes(b'{"a":1,"a":2}')
        duplicate = a.diagnose(self.root)
        self.assertIn("schema_unreadable", [row["code"] for row in duplicate["findings"]])
        schema.write_bytes(saved)
        (self.dest / "index.json").write_text("{")
        indexed = a.diagnose(self.root)
        self.assertIn("index_unreadable", [row["code"] for row in indexed["findings"] if row["destination"] == "AT"])
        self.assertEqual(indexed["pairsExamined"], 206 * 50)
        self.assertEqual(indexed["legalEvidenceSlots"], 0)


if __name__=='__main__': unittest.main()
