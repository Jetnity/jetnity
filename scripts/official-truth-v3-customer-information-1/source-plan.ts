// Local research inventory only: no network, database, queue or acceptance.
import { readFileSync, writeFileSync } from 'node:fs'
import { createV3SourceOnboardingTemplate, prepareV3SourceOnboardingPlan } from '../../lib/readiness/official-truth-product-v3/customer-information/source-onboarding'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM } from '../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'

const args = process.argv.slice(2), mode = args.shift()
function option(name: string): string {
  const index = args.indexOf(name)
  if (index < 0 || index === args.length - 1 || args[index + 1]!.startsWith('--')) throw Error(`missing ${name}`)
  return args.splice(index, 2)[1]!
}
if (mode === 'template') {
  const destinationCountryCode = option('--destination'), citizenshipCountryCodes = option('--citizenships').split(','), output = option('--output')
  if (args.length) throw Error('unexpected arguments')
  const plan = createV3SourceOnboardingTemplate({ destinationCountryCode, citizenshipCountryCodes })
  if (!plan) throw Error('invalid countries')
  writeFileSync(output, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' })
  process.stdout.write(`RESEARCH_ONLY: ${plan.coverage.length} explicit coverage slots written.\n`)
} else if (mode === 'check') {
  const input = option('--input'), program = option('--program')
  if (args.length || program !== 'aa-bern-ch-de') throw Error('unknown reviewed program')
  // Deliberately a code-owned finite catalog. A plan cannot upload a registry,
  // profile verifier, source authority, qualification or publication permit.
  const result = prepareV3SourceOnboardingPlan(JSON.parse(readFileSync(input, 'utf8')), AA_BERN_CH_DE_REVIEWED_PROGRAM.registry)
  if (!result.ok) throw Error(`invalid research plan: ${result.reason}`)
  process.stdout.write(JSON.stringify({ digest: result.digest, publicationAuthority: result.publicationAuthority,
    intake: result.intake, proposalCount: result.proposals.length, rows: result.rows }, null, 2) + '\n')
} else throw Error('usage: source-plan.ts template --destination DE --citizenships CH --output file.json | check --input file.json --program aa-bern-ch-de')
