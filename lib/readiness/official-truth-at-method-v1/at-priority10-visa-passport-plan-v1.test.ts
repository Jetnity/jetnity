import assert from 'node:assert/strict'
import {test} from 'node:test'
import {AT_PRIORITY10_PASSPORTS,AT_PRIORITY10_MILESTONES,AT_PRIORITY10_SOURCES,AT_PRIORITY10_VISA_PASSPORT_REVIEW} from './at-priority10-visa-passport-plan-v1'
import {AT_50_VISA_METHOD_PROPOSAL} from './at-50-method-proposal'
import {atBmiSourceReview} from './at-bmi-visa-groups-v1'

test('The first ten are exactly the real owner CSV priority, never a parallel or guessed ranking',()=>{
 const codes=['IN','TR','CN','DE','PL','IT','US','UA','RO','FR']
 assert.deepEqual(AT_PRIORITY10_PASSPORTS,codes)
 assert.deepEqual(AT_50_VISA_METHOD_PROPOSAL.passportPriority.slice(0,10),codes)
 assert.deepEqual(AT_PRIORITY10_VISA_PASSPORT_REVIEW.map(v=>v.country),codes)
 assert.deepEqual(AT_PRIORITY10_VISA_PASSPORT_REVIEW.map(v=>v.rank),[1,2,3,4,5,6,7,8,9,10])
 assert.deepEqual(AT_PRIORITY10_VISA_PASSPORT_REVIEW.map(v=>v.group),['V','V','V','F','F','F','E','E','F','F'])
 assert.equal(AT_PRIORITY10_SOURCES.originalEdition,'2026-11-06')
 assert.equal(AT_PRIORITY10_SOURCES.bmiOriginalSha256,'fcec70ebb5e7869591eaa8490025288534f5e44dddc0926102cd0bb27de8e778')
 for(const record of AT_PRIORITY10_VISA_PASSPORT_REVIEW){
  const entry=atBmiSourceReview(record.country)
  assert.ok(entry);assert.equal(entry.group,record.group)
  assert.equal(entry.sourceEdition,record.sourceEdition)
  assert.equal(entry.bmiUrl,record.sourceVisaUrl)
 }
})
test('IN TR CN standard ordinary passports require Schengen visa; rare diplomatic/residence exceptions are never collapsed into this rule',()=>{
 const visa=['IN','TR','CN']
 for(const candidate of AT_PRIORITY10_VISA_PASSPORT_REVIEW.filter(v=>visa.includes(v.country))){
  assert.equal(candidate.baselineVisaRule,'SCHENGEN_C_VISA_NORMALLY_REQUIRED')
  assert.equal(candidate.requiresSchengenVisaApplicationForNormalCase,true)
  assert.equal(candidate.thirdCountryThreeMonthsAfterSchengenExit,true)
  assert.equal(candidate.thirdCountryIssuedWithin10Years,true)
  assert.equal(candidate.twoBlankPagesONLYForVisaApplication,true)
  assert.equal(candidate.euValidPassportOrQualifiedNationalId,false)
 }
 assert.match(AT_PRIORITY10_VISA_PASSPORT_REVIEW[0].conditions,/Diplomatenpass/)
 assert.match(AT_PRIORITY10_VISA_PASSPORT_REVIEW[1].conditions,/Spezialpässe/)
 assert.match(AT_PRIORITY10_VISA_PASSPORT_REVIEW[2].conditions,/EU-Ausnahme nur für Diplomatenpässe/)
})
test('DE PL IT RO FR free movement requires a valid actual national travel document, not 90/180 or third-country passport-age rule',()=>{
 for(const rec of AT_PRIORITY10_VISA_PASSPORT_REVIEW.filter(v=>v.euFreeMovement)){
  assert.equal(rec.baselineVisaRule,'EU_FREEDOM_OF_MOVEMENT_NO_VISA')
  assert.equal(rec.euValidPassportOrQualifiedNationalId,true)
  assert.equal(rec.identityCardMustMeetEU2025_1208WhenUsed,true)
  assert.equal(rec.thirdCountryThreeMonthsAfterSchengenExit,false)
  assert.equal(rec.thirdCountryIssuedWithin10Years,false)
  assert.equal(rec.shortStay90in180OnlyForThirdCountry,false)
  assert.equal(rec.twoBlankPagesONLYForVisaApplication,false)
 }
 assert.equal(AT_PRIORITY10_VISA_PASSPORT_REVIEW.filter(v=>v.euFreeMovement).length,5)
 assert.match(AT_PRIORITY10_SOURCES.euIdentityCard,/2025\/1208/)
})
test('US ordinary visa waiver requires short tourist stay and normal passport; UA waiver additionally requires biometric ordinary passport',()=>{
 const us=AT_PRIORITY10_VISA_PASSPORT_REVIEW.find(x=>x.country==='US')!
 const ua=AT_PRIORITY10_VISA_PASSPORT_REVIEW.find(x=>x.country==='UA')!
 for(const x of [us,ua]){
  assert.equal(x.baselineVisaRule,'SHORT_STAY_VISA_WAIVER_WITH_CONDITIONS')
  assert.equal(x.shortStay90in180OnlyForThirdCountry,true)
  assert.equal(x.thirdCountryThreeMonthsAfterSchengenExit,true)
  assert.equal(x.thirdCountryIssuedWithin10Years,true)
  assert.equal(x.twoBlankPagesONLYForVisaApplication,false)
 }
 assert.equal(us.biometricOrdinaryPassportRequiredForWaiver,false)
 assert.equal(ua.biometricOrdinaryPassportRequiredForWaiver,true)
 assert.match(ua.conditions,/nur BIOMETRISCH/)
})
test('Every passport is source-scoped research only until fresh sealed original, documented context, issuer and separate AAL2',()=>{
 for(const r of AT_PRIORITY10_VISA_PASSPORT_REVIEW){
  assert.equal(r.officialRuleScopeReviewed,true)
  for(const flag of ['currentLiveSourceSealVerified','individualPresentedDocumentVerified',
   'individualPassportExpiryAndIssueDateVerified','residenceAndFamilyExemptionVerified',
   'actualSchengenDaysPurposeAndBorderRouteVerified','specialPassOrDualNationalityReviewed',
   'sourceToRuleIssuerInstalled','ownerAal2Authorised','publicationAllowed'] as const)assert.equal(r[flag],false)
  assert.equal(r.actualPersonalVisaAnswer,'derzeit nicht verfügbar')
  assert.equal(r.actualPersonalPassportAnswer,'derzeit nicht verfügbar')
  assert.equal(r.actualFormUrl,null);assert.equal(r.actualVisaFee,null)
 }
 assert.equal(AT_PRIORITY10_MILESTONES.euFive.target,'2026-11-23')
 assert.equal(AT_PRIORITY10_MILESTONES.thirdCountryWaiver.target,'2026-11-25')
 assert.equal(AT_PRIORITY10_MILESTONES.thirdCountryVisaRequired.target,'2026-11-27')
 assert.equal(AT_PRIORITY10_MILESTONES.groupedOwnerCandidate.target,'2026-11-29')
 assert.equal(AT_PRIORITY10_MILESTONES.ownerControlledLaunch.target,'2026-11-30')
})
