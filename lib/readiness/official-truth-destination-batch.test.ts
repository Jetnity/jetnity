// Existing lib/**/*.test.ts selection picks up the complete offline suite.
import '../../scripts/official-truth-destination-batch.test.mjs'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { prepareDestination } from '../../scripts/official-truth-destination-batch.mjs'
import { createV3SourceOnboardingTemplate } from './official-truth-product-v3/customer-information/source-onboarding'

test('destination package calls the real unchanged V3 factory without enlarging visitor bounds', t => {
  const base = mkdtempSync(join(tmpdir(),'jetnity-real-template-'))
  t.after(() => rmSync(base,{recursive:true,force:true}))
  const root = join(base,'research'), directory = join(root,'records','dest')
  mkdirSync(directory,{recursive:true})
  const codes: string[] = []
  for (const a of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') for (const b of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') codes.push(a+b)
  for (const code of codes.slice(0,206)) writeFileSync(join(directory,code+'.json'),'{}')
  // Genuine ISO codes but synthetic priority, explicitly not the Owner's research file.
  const passports = 'IN TR CN DE PL IT US UA RO FR GB ES PT GR HR NL AT BE BG CY CZ DK EE FI HU IE LT LU LV MT SE SK SI CH AU BR CA CL CO ID IL JP KR MX MY NZ PE RS SG TH'.split(' ')
  writeFileSync(join(root,'passport-priority.csv'),'passport\n'+passports.join('\n')+'\n')
  const output = join(base,'package')
  assert.equal(createV3SourceOnboardingTemplate({destinationCountryCode:'AT',citizenshipCountryCodes:passports}),null)
  const result = prepareDestination({root,destination:'AT',output,passportColumn:'passport',createTemplate:createV3SourceOnboardingTemplate})
  assert.equal(result.passports,50); assert.equal(result.accepted,0)
  const manifest = JSON.parse(readFileSync(join(output,'manifest.json'),'utf8'))
  assert.equal(manifest.plans.length,10)
  for (const entry of manifest.plans) {
    const plan = JSON.parse(readFileSync(join(output,entry.path),'utf8'))
    assert.equal(plan.coverage.length,130)
    assert.deepEqual(plan,createV3SourceOnboardingTemplate({destinationCountryCode:'AT',citizenshipCountryCodes:entry.passports}))
  }
})
