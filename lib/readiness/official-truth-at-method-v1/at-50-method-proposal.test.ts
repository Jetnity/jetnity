import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AT_50_VISA_METHOD_PROPOSAL } from './at-50-method-proposal'
import { readMa1FixedBinding } from '../official-truth-product-v3/method/contract'

const proposal=AT_50_VISA_METHOD_PROPOSAL

test('Austrian 50-passport method is bound to genuine original source and legal stage is inactive',()=>{
 assert.equal(proposal.status,'DRAFT_NOT_STAGED')
 assert.equal(proposal.passportPriority.length,50)
 assert.equal(new Set(proposal.passportPriority).size,50)
 assert.equal(proposal.passportPriority[0],'IN')
 assert.equal(proposal.passportPriority[18],'CH')
 assert.equal(proposal.passportPriority[37],'XK')
 assert.equal(proposal.passportPriorityCsvSha256,'4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358')
 assert.equal(proposal.primary.editorialVersion,'2026-11-06')
 assert.equal(proposal.originalExtractedCategoryDigest,'06725851fd83fb167e432b95a728dcbe2dcd9a425529138d4df49e61e2dd77ce')
 assert.equal(proposal.sourceBoundCountryCategories.length,50)
 const grouped=Object.groupBy(proposal.sourceBoundCountryCategories,p=>p.originalRowKind)
 assert.equal(grouped.V?.length,20)
 assert.equal(grouped.F?.length,19)
 assert.equal(grouped.E?.length,10)
 assert.equal(grouped.H?.length,1)
 assert.deepEqual(proposal.sourceBoundCountryCategories.map(x=>x.citizenshipCode),proposal.passportPriority)
 assert.equal(proposal.sourceBoundCountryCategories[12]?.citizenshipCode,'AT')
 assert.equal(proposal.sourceBoundCountryCategories[12]?.originalRowKind,'H')
 assert.equal(proposal.sourceBoundCountryCategories.find(x=>x.citizenshipCode==='UA')?.originalRowKind,'E')
 assert.ok(proposal.sourceBoundCountryCategories.every(x=>x.legalApplicabilityVerified===false && x.publicationAllowed===false))
 const binding=readMa1FixedBinding(proposal.methodBinding)
 assert.ok(binding.ok)
 assert.equal(proposal.methodBinding.methodId,'jetnity-at-priority50-visa')
 assert.equal(proposal.methodBinding.revision,1)
 assert.equal(proposal.humanReleaseScope.citizenship,'PRIORITY_50')
 assert.equal(proposal.humanReleaseScope.destination,'AT')
 assert.equal(proposal.humanReleaseScope.route,'direct_entry')
 assert.equal(proposal.issuerForAll50Installed,false)
 assert.equal(proposal.ownerAal2Approved,false)
 assert.equal(proposal.acceptedFacts,0)
 assert.equal(proposal.publicationAllowed,false)
})
