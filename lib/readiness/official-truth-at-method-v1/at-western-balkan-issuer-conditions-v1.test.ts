import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_WESTERN_BALKAN_ISSUER_CONDITIONS,atWesternBalkanIssuerReview} from './at-western-balkan-issuer-conditions-v1'
test('Austria XK is a non-ISO research category, not an accepted visitor country code or personal visa waiver',()=>{
 const x=atWesternBalkanIssuerReview('XK')
 assert.equal(x,AT_WESTERN_BALKAN_ISSUER_CONDITIONS.XK)
 assert.equal(x?.visitorCountryCodeSupported,false)
 assert.equal(x?.ordinaryPassportMustBeBiometricIcao,true)
 assert.equal(x?.ordinaryPassportIssuerMustMatch,'Kosovo')
 assert.equal(x?.euLegalEffectiveFrom,'2024-01-01')
 assert.match(x?.euLegalSource??'',/eur-lex\.europa\.eu\/eli\/reg\/2023\/850/)
 assert.match(x?.austriaDestinationPrimary??'',/bmeia\.gv\.at\/oeb-pristina/)
 assert.equal(x?.employmentInternshipOrScholarshipRequiresIndependentVisaCheck,true)
})
test('Serbian Coordination Directorate documents have a separate current EU legal source, not Kosovo citizenship',()=>{
 const rs=atWesternBalkanIssuerReview('RS')
 assert.equal(rs,AT_WESTERN_BALKAN_ISSUER_CONDITIONS.RS)
 assert.equal(rs?.visitorCountryCodeSupported,true)
 assert.match(rs?.documentIssuer??'',/Koordinaciona uprava/)
 assert.match(rs?.euLegalSource??'',/eur-lex\.europa\.eu\/eli\/reg\/2024\/2495/)
 assert.equal(rs?.euLegalEffectiveFrom,'2024-10-13')
 assert.equal(rs?.ordinaryPassportMustBeBiometricIcao,true)
 assert.match(rs?.austriaDestinationPrimary??'',/bmi\.gv\.at/)
 assert.equal(atWesternBalkanIssuerReview('UA'),null)
 assert.equal(atWesternBalkanIssuerReview('rs'),null)
})
test('No issuer-specific research descriptor confers an individual approval, even if general law is linked',()=>{
 for(const x of Object.values(AT_WESTERN_BALKAN_ISSUER_CONDITIONS)){
  assert.equal(x.schengenMaxStayDays,90)
  assert.equal(x.schengenWindowDays,180)
  assert.equal(x.documentIssuerAndCategoryVerified,false)
  assert.equal(x.routePurposeStayAndResidenceVerified,false)
  assert.equal(x.destinationSpecificOriginalSealed,false)
  assert.equal(x.legalDecisionApproved,false)
  assert.equal(x.ma1OwnerAal2Approved,false)
  assert.equal(x.personalVisaDecision,'derzeit nicht verfügbar')
 }
})
