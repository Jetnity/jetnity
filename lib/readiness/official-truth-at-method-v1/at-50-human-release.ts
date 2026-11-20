// Dev-only independent AT PRIORITY_50 human method selection, never Production.
// Stage/approve below requires the existing real Owner AAL2 API boundary.
// An approved *method* is NOT an approved per-passport legal fact or publisher.
import 'server-only'
import { getServerSupabaseUrl } from '@/lib/supabase/server'
import { HUMAN_METHOD_DEV_URL, readHumanRelease, type HumanRelease } from '../official-truth-product-v3/method/human-contract'
import { AT_50_VISA_METHOD_PROPOSAL } from './at-50-method-proposal'

const AT_50_DEV_SELECTION_ID = 'hmr1_da2391387e35c2e0ab0b5f048852ec6e'

export type At50PreviewSelection = Readonly<{
 deploymentEnv: string | undefined
 projectId: string | undefined
 repoOwner: string | undefined
 repoSlug: string | undefined
 branch: string | undefined
 getSupabaseUrl: () => string | undefined
}>

/** Pure, strict target check; do not even read the Supabase URL until the
 * Vercel Preview identity and exact PR branch match. Source/legal/Owner
 * approval remains enforced independently by protected SQL and AAL2. */
export function eligibleAustria50Dev(context: At50PreviewSelection): boolean {
 return context.deploymentEnv==='preview'
  && context.projectId==='prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
  && context.repoOwner==='Jetnity'
  && context.repoSlug==='jetnity'
  && context.branch==='feat/official-truth-universal-source-registry-dev-20261119'
  && context.getSupabaseUrl()===HUMAN_METHOD_DEV_URL
}
export function selectedAustria50Dev(): boolean {
 return eligibleAustria50Dev({
  deploymentEnv:process.env.VERCEL_ENV,
  projectId:process.env.VERCEL_PROJECT_ID,
  repoOwner:process.env.VERCEL_GIT_REPO_OWNER,
  repoSlug:process.env.VERCEL_GIT_REPO_SLUG,
  branch:process.env.VERCEL_GIT_COMMIT_REF,
  getSupabaseUrl:getServerSupabaseUrl,
 })
}

export function getAt50HumanRelease(): HumanRelease | null {
 if (!selectedAustria50Dev()) return null
 const proposal=AT_50_VISA_METHOD_PROPOSAL
 if (proposal.status!=='DRAFT_NOT_STAGED'
   || proposal.ownerAal2Approved || proposal.issuerForAll50Installed
   || proposal.acceptedFacts!==0 || proposal.publicationAllowed
   || proposal.passportPriority.length!==50
   || proposal.sourceBoundCountryCategories.length!==50) return null
 return readHumanRelease({
  schema:1,selectionId:AT_50_DEV_SELECTION_ID,
  targetUrl:HUMAN_METHOD_DEV_URL,
  methodId:proposal.methodBinding.methodId,
  revision:proposal.methodBinding.revision,
  methodDigest:proposal.methodBinding.methodDigest,
  packageDigest:proposal.methodBinding.packageDigest,
  predecessorRevision:null,expectedHead:null,
  approval:{mode:'until_revoked',until:null},
  packageVersion:'BMI 06.11.2026 · AT ordinary 50 passports · visa only · draft 1',
  packageHref:'https://github.com/Jetnity/jetnity/blob/08b3c85add90218391e7b513c166e11f4c6778bf/lib/readiness/official-truth-at-method-v1/at-50-method-proposal.ts',
  scope:{
   citizenship:'PRIORITY_50', destination:'AT', requirement:'visa',
   document:'national_passport',route:'direct_entry',
   conditions:'verified_context_only',
   activeFrom:'2026-11-19T00:00:00.000Z',
   activeUntilExclusive:'2027-11-19T00:00:00.000Z',
   reviewedScope:'Development only. All 50 BMI nationality rows are exact source-bound conditional RESEARCH proposals. No new passport law fact is approved by this method stage. Every positive visa decision additionally needs separate ordinary-document, actual residence/biometrics, route, tourist purpose, legal validity, first-party source and BG1 checks. Swiss Bern consular evidence never applies to 49 foreign passports. Issuer not installed; no Production or public visitor activation.',
  },
 })
}
