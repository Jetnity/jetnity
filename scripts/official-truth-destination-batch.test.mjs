// All inputs in this file are synthetic. No official facts, remote IO or DB.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, symlinkSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { DESTINATION_ORDER, readPriority, inventory, prepareDestination } from './official-truth-destination-batch.mjs'

const prefix = ['IN','TR','CN','DE','PL','IT','US','UA','RO','FR']
const codes = []
for (const a of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') for (const b of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') codes.push(a + b)
// Deliberately artificial codes: these are not a replacement passport-priority.csv.
const passports = [...prefix, ...codes.filter(c => !prefix.includes(c) && c !== 'CH').slice(0,39), 'CH']
const csv = (list = passports) => 'rank,passport,comment\r\n' + list.map((c,i) => `${i+1},${c},"fixture, only"`).join('\r\n') + '\r\n'
const template = ({ destinationCountryCode, citizenshipCountryCodes }) => ({
  schema:1, kind:'official_source_onboarding_plan', classification:'RESEARCH_ONLY',
  destinationCountryCode, citizenshipCountryCodes, primary:null, counterSources:[], knownConflicts:[],
  coverage:citizenshipCountryCodes.flatMap(citizenshipCountryCode => Array.from({length:26}, (_,i) => ({
    topic:`fixture_topic_${i}`, citizenshipCountryCode, status:'unavailable', reason:'not_researched',
  }))),
})
function fixture(t, fileLayout = false) {
  const base = mkdtempSync(join(tmpdir(), 'jetnity-destination-fixture-')), root = join(base,'research')
  t.after(() => rmSync(base,{ recursive:true,force:true }))
  mkdirSync(join(root,'records','dest'),{ recursive:true })
  for (const c of codes.slice(0,206)) {
    const path = join(root,'records','dest',c + (fileLayout ? '.json' : ''))
    if (fileLayout) writeFileSync(path,'{}')
    else mkdirSync(path)
  }
  if (!fileLayout) writeFileSync(join(root,'records','dest','AT','candidate.json'),'{}')
  writeFileSync(join(root,'passport-priority.csv'),csv())
  return { base,root,output:join(base,'output'),destination:'AT',passportColumn:'passport',rankColumn:'rank',createTemplate:template }
}

test('destination order and real CSV order are explicit, never CH-only defaults', () => {
  assert.deepEqual(DESTINATION_ORDER,['AT','IT','FR','ES','PT','GR','HR','NL','GB','US','TR','TH','AE'])
  assert.deepEqual(readPriority(csv(),'passport','rank'),passports)
  const [header,...rows] = csv().trimEnd().split('\r\n')
  assert.deepEqual(readPriority([header,...rows.reverse()].join('\n'),'passport','rank'),passports)
  assert.deepEqual(readPriority('\uFEFF'+csv(),'passport'),passports)
  assert.throws(() => readPriority(csv(),'guessed-column'),/explicit_csv_columns/)
})

test('missing, duplicate, reordered and incomplete passports fail closed', () => {
  assert.throws(() => readPriority(csv(passports.slice(0,49)),'passport'),/exactly_50/)
  assert.throws(() => readPriority(csv([...passports.slice(0,49),'IN']),'passport'),/passport_priority/)
  assert.throws(() => readPriority(csv([...passports.slice(1),passports[0]]),'passport'),/passport_priority/)
  assert.throws(() => readPriority(csv().replace('50,CH,','1,CH,'),'passport','rank'),/priority_ranks/)
  assert.throws(() => readPriority(csv().replace('50,CH,','50,ZZ,'),'passport'),/passport_priority/)
  assert.throws(() => readPriority(csv().replace('1,IN,','1,in,'),'passport'),/passport_priority/)
})

test('malformed CSV cannot silently shift columns or merge entries', () => {
  for (const invalid of [csv()+'\n',csv().replace('rank,passport,comment','rank,passport,passport'),
    csv().replace('"fixture, only"','"bad"text'),csv().replace('"fixture, only"','"unfinished'),
    csv()+'\0','x'.repeat(65537)]) assert.throws(() => readPriority(invalid,'passport','rank'))
})

test('one destination package preserves 50 passports in ten existing bounded plans', t => {
  const f = fixture(t), before = readFileSync(join(f.root,'passport-priority.csv'))
  const counts = prepareDestination(f)
  assert.deepEqual(counts,{destinations:1,passports:50,plans:10,topics:1300,accepted:0,researchComplete:0})
  assert.equal(readdirSync(f.output).length,11)
  const manifest = JSON.parse(readFileSync(join(f.output,'manifest.json'),'utf8'))
  assert.equal(manifest.publicationAuthority,'none'); assert.equal(manifest.completeResearch,false)
  assert.equal(manifest.researchApplicability,'NOT_VALIDATED'); assert.equal(manifest.availableClaims,0)
  assert.deepEqual(manifest.citizenshipPriority,passports)
  assert.equal(manifest.priorityFileSha256,createHash('sha256').update(before).digest('hex'))
  for (const entry of manifest.plans) {
    const bytes = readFileSync(join(f.output,entry.path))
    assert.equal(entry.sha256,createHash('sha256').update(bytes).digest('hex'))
    const plan = JSON.parse(bytes)
    assert.equal(plan.citizenshipCountryCodes.length,5); assert.equal(plan.coverage.length,130)
    assert.ok(plan.coverage.every(r => r.status === 'unavailable'))
  }
  assert.deepEqual(readFileSync(join(f.root,'passport-priority.csv')),before)
})

test('archive destination inventory accepts regular per-country files as well as directories', t => {
  const f = fixture(t,true)
  const data = inventory(f.root,'AT')
  assert.equal(data.files.length,1); assert.equal(data.files[0].path,'records/dest/AT.json')
  assert.equal(prepareDestination(f).passports,50)
})

test('missing real research or CSV produces no output and no inferred facts', t => {
  const f = fixture(t)
  rmSync(join(f.root,'passport-priority.csv'))
  assert.throws(() => prepareDestination(f)); assert.equal(existsSync(f.output),false)
  writeFileSync(join(f.root,'passport-priority.csv'),csv())
  rmSync(join(f.root,'records','dest','AT','candidate.json'))
  assert.throws(() => prepareDestination(f),/research_empty/); assert.equal(existsSync(f.output),false)
})

test('incorrect destination inventory and invalid sidecar aliases are refused', t => {
  const f = fixture(t)
  writeFileSync(join(f.root,'records','dest','AT.json'),'{}')
  // A malformed legacy sidecar must fail closed even when the 206 folder count is valid.
  assert.throws(() => inventory(f.root,'AT'),/research_sidecar_invalid/)
  rmSync(join(f.root,'records','dest','AT.json'))
  rmSync(join(f.root,'records','dest','AA'),{recursive:true})
  assert.throws(() => inventory(f.root,'AT'),/206_destination/)
  assert.throws(() => inventory(f.root,'../'),/invalid_destination/)
})

test('source files and output cannot be overwritten or routed through symlinks', t => {
  const f = fixture(t)
  assert.throws(() => prepareDestination({...f,output:join(f.root,'inside')}),/external_output/)
  symlinkSync(f.root,join(f.base,'alias'),'dir')
  assert.throws(() => prepareDestination({...f,output:join(f.base,'alias','inside')}),/external_output/)
  mkdirSync(f.output); writeFileSync(join(f.output,'keep'),'untouched')
  assert.throws(() => prepareDestination(f),/external_output/)
  assert.equal(readFileSync(join(f.output,'keep'),'utf8'),'untouched')
  symlinkSync(join(f.root,'passport-priority.csv'),join(f.root,'records','dest','AT','link.json'))
  assert.throws(() => inventory(f.root,'AT'),/symlink/)
})

test('wrong canonical coverage or attempted truth promotion never creates a package', t => {
  const f = fixture(t)
  const mutations = [p => ({...p,primary:{fake:true}}),p => ({...p,classification:'ACCEPTED'}),
    p => ({...p,coverage:p.coverage.slice(1)}),p => ({...p,citizenshipCountryCodes:['CH']}),
    p => ({...p,coverage:p.coverage.map((r,i) => i===0 ? {...r,proposals:[]} : r)}),
    p => ({...p,coverage:p.coverage.map((r,i) => i===0 ? {...r,status:'not_required'} : r)})]
  for (const mutate of mutations) {
    assert.throws(() => prepareDestination({...f,createTemplate:input => mutate(template(input))}))
    assert.equal(existsSync(f.output),false)
  }
})

test('six-column research priority file permits bounded long quoted provenance, not oversized input', () => {
  const longNotes = 'synthetic fixture, '.repeat(100)
  const source = 'https://example.invalid/offline-fixture'
  const wide = 'rank,nationality_iso2,name,score_basis,sources,notes\r\n'
    + passports.map((c,i) => `${i+1},${c},Synthetic,"${longNotes}","${source}",untrusted fixture`).join('\r\n') + '\r\n'
  assert.ok(Buffer.byteLength(wide) > 65_536 && Buffer.byteLength(wide) < 128 * 1024)
  assert.deepEqual(readPriority(wide,'nationality_iso2','rank'),passports)
  assert.throws(() => readPriority(wide + 'x'.repeat(128 * 1024),'nationality_iso2','rank'),/invalid_priority_file/)
})

test('verified mixed 206-folder archive layout binds the sidecar, not a duplicate destination', t => {
  const f = fixture(t)
  for (const code of ['HW','HX']) rmSync(join(f.root,'records','dest',code),{recursive:true})
  for (const territory of ['CN-HK','CN-MO']) {
    mkdirSync(join(f.root,'records','dest',territory))
    writeFileSync(join(f.root,'records','dest',territory,'index.json'),
      JSON.stringify({status:'RESEARCH_ONLY',dest_id:territory}))
  }
  const sidecarPath = join(f.root,'records','dest','AT.json')
  writeFileSync(sidecarPath,JSON.stringify({
    schema:'jetnity-entry-requirements-research-v2.2',status:'RESEARCH_ONLY',
    unit_type:'destination_shell',dest_id:'AT',destination_iso2:'AT',
  }))
  writeFileSync(join(f.root,'records','dest','NL-caribbean.json'),
    JSON.stringify({status:'RESEARCH_ONLY',unit_type:'territory_pending'}))
  const found = inventory(f.root,'AT')
  assert.ok(found.files.some(row => row.path === 'records/dest/AT.json'))
  assert.equal(prepareDestination(f).passports,50)
  rmSync(f.output,{recursive:true})
  writeFileSync(sidecarPath,'{}')
  assert.throws(() => inventory(f.root,'AT'),/research_sidecar_invalid/)
})

test('unrecognized territory or unverified mixed archive cannot silently lower the target count', t => {
  const f=fixture(t)
  rmSync(join(f.root,'records','dest','HX'),{recursive:true})
  mkdirSync(join(f.root,'records','dest','UNVERIFIED-TERRITORY'))
  assert.throws(() => inventory(f.root,'AT'),/research_206_destination_layout_required/)
})
