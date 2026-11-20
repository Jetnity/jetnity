"""Offline synthetic-only legal conflict scoping. No archive or network."""
import importlib.util
from pathlib import Path
import unittest

path=Path(__file__).with_name('official-truth-source-ref-reconciliation-v1.py')
spec=importlib.util.spec_from_file_location('ref_reconciliation',path)
assert spec and spec.loader
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ConflictScopeTests(unittest.TestCase):
    def setUp(self):
        self.span={
            'topic':'Mittel / Tagessatz 2026 (Drittstaaten, régimen general)',
            'conflict_type':'minor_numeric_discrepancy',
            'status':'fertig',
            'affects_visa_requirement_or_entry_permission':False,
            'primary_sources':[{'id':'S1'},{'id':'S2'}],
            'deviating_source':{'id':'S3'},
        }

    def test_financial_only_original_es_issue(self):
        self.assertEqual(module.affected_conflict_topics(
            {'conflicts':[self.span]},'ES'),frozenset({'financial_means'}))

    def test_unrelated_visa_not_automatically_conflicted(self):
        scoped=module.affected_conflict_topics({'conflicts':[self.span]},'ES')
        self.assertNotIn('visa',scoped)
        self.assertNotIn('transit',scoped)

    def test_different_country_fail_closed_all_topics(self):
        self.assertEqual(len(module.affected_conflict_topics(
            {'conflicts':[self.span]},'IT')),26)

    def test_unrecognized_conflict_fail_closed_all_topics(self):
        mutation=dict(self.span)
        mutation['affects_visa_requirement_or_entry_permission']=True
        self.assertEqual(len(module.affected_conflict_topics(
            {'conflicts':[mutation]},'ES')),26)

    def test_numeric_conflict_cannot_approve_entry_amount(self):
        self.assertEqual(len(module.affected_conflict_topics(
            {'conflicts':[dict(self.span,status='open')]},'ES')),26)

    def test_no_conflicts_no_quarantine(self):
        self.assertFalse(module.affected_conflict_topics({'conflicts':[]},'ES'))

if __name__ == '__main__':
    unittest.main()
