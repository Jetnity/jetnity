"""Private research-only: recover dangling source IDs from other ORIGINAL slices.
Identity of a source reference is not legal approval or publication authority.
All links pinned to official agency material reviewed 2026-11-19; no network.
"""
from __future__ import annotations
from collections import Counter,defaultdict
import json
from pathlib import Path
from urllib.parse import urlsplit

REFS={
 'AT':{
  'S_3550010':'https://www.oesterreich.gv.at/de/themen/menschen_aus_anderen_staaten/visum_fuer_oesterreich/Seite.3550010',
  'S_BMI_EINREISE':'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/einreise/start.html',
  'S_ETIAS_EC':'https://home-affairs.ec.europa.eu/policies/schengen/smart-borders/european-travel-information-authorisation-system_en'},
 'IT':{'S_VISTOPERITALIA':'https://vistoperitalia.esteri.it/',
       'S_ETIAS_EC':'https://home-affairs.ec.europa.eu/policies/schengen/smart-borders/european-travel-information-authorisation-system_en'},
 'FR':{'S_F16146':'https://www.service-public.gouv.fr/particuliers/vosdroits/F16146',
       'S_ETIAS_EC':'https://home-affairs.ec.europa.eu/policies/schengen/smart-borders/european-travel-information-authorisation-system_en'},
 'ES':{'S_INT_ENTRADA':'https://www.interior.gob.es/opencms/es/servicios-al-ciudadano/tramites-y-gestiones/extranjeria/control-de-fronteras/entrada-en-espana/',
       'S_ETIAS_EC':'https://home-affairs.ec.europa.eu/policies/schengen/smart-borders/european-travel-information-authorisation-system_en'},
 'PT':{}  # S_LEI23: original regional legal portal is NOT replaced with the DR gazette without review
}
AUSTRIA={
 'BMI':'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/',
 'MATRIX':'https://www.bmi.gv.at/202/fremdenpolizei_und_grenzkontrolle/visumpflichtige_laender/start.html',
 'VISUM':'https://www.bmeia.gv.at/reise-services/einreise-und-aufenthalt-in-oesterreich/visum/',
 'ETIAS':'https://travel-europe.europa.eu/de/etias',
 'ZOLL':'https://www.bmf.gv.at/themen/zoll/Kontrolle-von-Barmitteln.html',
 'GESUNDHEIT':'https://www.sozialministerium.gv.at/Themen/Gesundheit/Reiseinformationen/Reisen-nach-%C3%96sterreich.html'
}
AT_TOPICS={
 'visa':('MATRIX','ordinary_document_tourism_residence_exceptions'),
 'electronic_travel_authorization':('ETIAS','not_operational_no_application_yet'),
 'stay_limit':('BMI','third_country_90_180_vs_FOM_and_bilateral'),
 'passport':('BMI','passport_or_id_depends_on_nationality'),
 'identity_document':('MATRIX','original_matrix_id_document_class'),
 'passport_validity':('BMI','third_country_three_months_ten_years_vs_FOM'),
 'blank_passport_pages':('VISUM','two_pages_for_visa_application_only'),
 'required_vaccinations':(None,'no_matching_Austrian_entry_source'),
 'recommended_vaccinations':(None,'no_matching_Austrian_entry_source'),
 'health_measures':('GESUNDHEIT','actual_health_and_origin_status_pending'),
 'health_documents':('GESUNDHEIT','actual_entry_health_rule_pending'),
 'insurance':('VISUM','visa_applicant_minimum_30000_exemptions'),
 'entry_forms':('VISUM','visa_form_only_if_visa_required'),
 'form_costs':('VISUM','form_free_visa_application_fee_conditional'),
 'fraud_warnings':('VISUM','warning_avoid_unofficial_paid_visa_agents'),
 'entry_fees':('VISUM','90_euro_adults_45_euro_children_exemptions'),
 'onward_return_ticket':('BMI','border_proof_if_required_not_always_purchased_ticket'),
 'financial_means':('BMI','third_country_means_case_by_case'),
 'booking_or_travel_document':('BMI','travel_purpose_and_hotel_condition'),
 'transit':('MATRIX','airside_landside_residence_visa_A_exemptions'),
 'minors':('BMI','accompanying_adult_status_required'),
 'parental_consent':('BMI','recommendation_not_universal_obligation'),
 'customs':('ZOLL','EU_external_border_cash_10000_EUR'),
 'dual_nationals':('BMI','actual_passport_and_status_required'),
 'recent_changes':('MATRIX','2026_11_06_BMI_version_and_EES_changes'),
 'official_actions':('VISUM','official_form_only_if_applicable')
}

def load(path:Path):
    if not path.is_file() or path.is_symlink() or path.stat().st_size>1048576:
        raise ValueError('invalid_original_file')
    def unique(pairs):
        found={}
        for k,v in pairs:
            if k in found:raise ValueError('duplicate_json_key')
            found[k]=v
        return found
    return json.loads(path.read_bytes(),object_pairs_hook=unique)

def reconcile(root:Path,country:str,passports:list[str],prepared:Path):
    if country not in REFS or len(passports)!=50 or len(set(passports))!=50:
        raise ValueError('invalid_review_scope')
    records={n:load(root/'records'/'dest'/country/(n+'.json')) for n in passports}
    global_ids=defaultdict(set);local_ids={}
    for nat,rec in records.items():
        if rec.get('nationality')!=nat or rec.get('destination_iso2')!=country or rec.get('status')!='RESEARCH_ONLY':
            raise ValueError('original_record_identity_refused')
        srcmap={}
        for s in rec.get('sources',[]):
            fields=[k for k in ('ref','id') if k in s]
            if len(fields)!=1 or not isinstance(s[fields[0]],str) or not isinstance(s.get('url'),str):
                raise ValueError('source_catalog_shape_refused')
            sid=s[fields[0]];url=s['url'];parsed=urlsplit(url)
            if sid in srcmap or parsed.scheme!='https' or not parsed.hostname or parsed.username or parsed.password:
                raise ValueError('unsafe_source_catalog')
            srcmap[sid]=url;global_ids[sid].add(url)
        local_ids[nat]=srcmap
    coverage=load(prepared/'coverage.json')
    if len(coverage)!=1300:raise ValueError('expected_1300_topics')
    cases=[];seen=set();recovered=unresolved=ref_slots=0
    for row in coverage:
        nat=row.get('nationality');topic=row.get('topic')
        if nat not in records or (nat,topic) in seen:raise ValueError('duplicate_passport_topic')
        seen.add((nat,topic))
        missing=row.get('unresolvedSourceRefs')
        if not isinstance(missing,list) or sorted(set(missing))!=missing:
            raise ValueError('invalid_unresolved_references')
        refs=[]
        for sid in missing:
            expected=REFS[country].get(sid)
            matched=expected is not None and global_ids[sid]=={expected} and sid not in local_ids[nat]
            refs.append({'originalSourceRef':sid,'officialURLRecoveredFromOtherSlice':expected if matched else None,
                'status':'CATALOG_IDENTITY_RECOVERED_NOT_LEGAL_PROOF' if matched else 'NO_TRUSTED_OFFICIAL_CROSS_SLICE_PROOF'})
            if matched:recovered+=1
            else:unresolved+=1
        if missing:ref_slots+=1
        if country=='AT':
            if topic not in AT_TOPICS:raise ValueError('unclassified_Austrian_topic')
            authority,condition=AT_TOPICS[topic]
            government_url=AUSTRIA.get(authority)
            state=('NO_PRIMARY_RULE_SOURCE_UNAVAILABLE' if authority is None
                   else 'CONDITIONAL_RULE_NOT_LEGALLY_QUALIFIED')
            if refs:state='CROSS_SLICE_SOURCE_IDENTITY_ONLY'
            if nat=='AT' and topic in ('visa','entry_fees','form_costs'):
                state='OWN_NATIONAL_NOT_FOREIGN_VISA_CASE'
            visa_class=None
            if topic=='visa':
                value=records[nat].get('visa',{}).get('required')
                visa_class=('RESEARCH_REQUIRED_NOT_VALIDATED' if value is True
                    else 'RESEARCH_EXEMPT_NOT_VALIDATED' if value is False
                    else 'RESEARCH_OWN_OR_UNKNOWN')
        else:
            government_url=None;condition='requires_current_destination_primary_and_traveler_context'
            state=('CONFLICT_QUARANTINE' if row.get('recordConflictFlag')
                   else 'UNRESOLVED_SOURCE_REF' if unresolved and any(r['officialURLRecoveredFromOtherSlice'] is None for r in refs)
                   else 'SOURCE_SCOPE_NOT_LEGALLY_QUALIFIED')
            visa_class=None
        cases.append({'passport':nat,'topic':topic,'originalSourceRefs':row.get('explicitSourceRefs',[]),
            'originalResearchPointers':row.get('researchPointers',[]),'missingRefResolution':refs,
            'sourceCandidate':government_url,'requiredLegalContext':condition,
            'visaResearchClass':visa_class,'legalReviewDisposition':state,
            'originalConflictFlag':bool(row.get('recordConflictFlag')),
            'legalRuleVerified':False,'publicationAllowed':False,
            'verifiedFee':None,'validFrom':None,'validUntil':None,
            'customerAnswer':'derzeit nicht verfügbar'})
    if len(seen)!=1300:raise ValueError('incomplete_1300_slot_review')
    if country=='AT' and (ref_slots!=36 or recovered!=40 or unresolved
        or sum(x['legalReviewDisposition']=='NO_PRIMARY_RULE_SOURCE_UNAVAILABLE' for x in cases)!=100):
        raise ValueError('AT_36_ORPHAN_REFERENCE_RECOVERY_DRIFT')
    if country=='PT' and unresolved!=18:raise ValueError('PT_S_LEI23_official_gazette_not_yet_bound')
    data={'schema':1,'country':country,'status':'RESEARCH_ONLY',
          'sourceReferenceIdentityRecovered':recovered,'unresolvedSourceReferences':unresolved,
          'topicsReviewed':1300,'legalRulesApproved':0,'publications':0,
          'sourceIdentityIsNotLegalFact':True,'cases':cases}
    path=prepared/'source-reference-review.json'
    with path.open('x',encoding='utf-8') as out:
        import os
        os.fchmod(out.fileno(),0o600)
        json.dump(data,out,ensure_ascii=False,separators=(',',':'));out.write('\n')
    return {'reviewedSlots':1300,'recoveredRefs':recovered,'unresolvedRefs':unresolved,
            'positiveLegalRules':0,'published':0}
