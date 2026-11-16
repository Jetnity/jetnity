// Offline preparation only. Never fetches sources, imports data, or grants truth.
import { createHash } from 'node:crypto'
import { lstatSync, readdirSync, readFileSync, realpathSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { resolve, relative, sep, join, dirname, basename } from 'node:path'
import { pathToFileURL } from 'node:url'

export const DESTINATION_ORDER = Object.freeze(['AT','IT','FR','ES','PT','GR','HR','NL','GB','US','TR','TH','AE'])
const PREFIX = ['IN','TR','CN','DE','PL','IT','US','UA','RO','FR']
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const fail = code => { throw new Error(code) }
const inside = (root, file) => { const r = relative(root, file); return r === '' || (!r.startsWith('..' + sep) && r !== '..' && !r.startsWith(sep)) }

export function readPriority(text, passportColumn, rankColumn = null) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > 65536 || text.includes('\0')) fail('invalid_priority_file')
  const rows = []; let row = [], field = '', quoted = false, closed = false
  text = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') { quoted = false; closed = true }
      else field += c
    } else if (c === ',' || c === '\n' || c === '\r') {
      row.push(field); field = ''; closed = false
      if (c !== ',') { if (c === '\r' && text[i + 1] === '\n') i++; rows.push(row); row = [] }
    } else if (c === '"') {
      if (field || closed) fail('invalid_csv_quotes')
      quoted = true
    } else { if (closed) fail('invalid_csv_quotes'); field += c }
  }
  if (quoted) fail('invalid_csv_quotes')
  if (field || row.length || closed) { row.push(field); rows.push(row) }
  const header = rows.shift()
  if (!header || header.some(v => !v) || new Set(header).size !== header.length) fail('invalid_csv_header')
  const ci = header.indexOf(passportColumn), ri = rankColumn === null ? -1 : header.indexOf(rankColumn)
  if (ci < 0 || rankColumn !== null && (ri < 0 || ri === ci)) fail('explicit_csv_columns_required')
  if (rows.length !== 50 || rows.some(r => r.length !== header.length)) fail('exactly_50_passports_required')
  if (ri >= 0) {
    const ranks = rows.map(r => r[ri])
    if (ranks.some(v => !/^(?:[1-9]|[1-4][0-9]|50)$/.test(v)) || new Set(ranks).size !== 50) fail('invalid_priority_ranks')
    rows.sort((a, b) => Number(a[ri]) - Number(b[ri]))
  }
  const passports = rows.map(r => r[ci])
  if (passports.some(v => !/^[A-Z]{2}$/.test(v)) || new Set(passports).size !== 50
    || !passports.includes('CH') || PREFIX.some((v, i) => passports[i] !== v)) fail('passport_priority_mismatch')
  return Object.freeze(passports)
}

function regularFile(file, maximum) {
  const s = lstatSync(file)
  if (!s.isFile() || s.isSymbolicLink() || s.size > maximum) fail('input_file_refused')
  return readFileSync(file)
}

export function inventory(rootInput, destination) {
  if (!/^[A-Z]{2}$/.test(destination)) fail('invalid_destination')
  const root = realpathSync(rootInput), directory = join(root, 'records', 'dest')
  for (const p of [join(root, 'records'), directory]) if (!lstatSync(p).isDirectory() || lstatSync(p).isSymbolicLink()) fail('research_directory_refused')
  const destinations = readdirSync(directory, { withFileTypes: true }).flatMap(d => {
    const match = /^([A-Z]{2})(?:\.(?:json|jsonl|ndjson))?$/.exec(d.name)
    return match ? [{ code: match[1], entry: d }] : []
  })
  if (destinations.length !== 206 || new Set(destinations.map(d => d.code)).size !== 206
    || destinations.some(d => d.entry.isSymbolicLink() || (!d.entry.isDirectory() && !d.entry.isFile()))) fail('research_206_destination_layout_required')
  const found = destinations.find(d => d.code === destination), files = []; let total = 0
  if (!found) fail('destination_research_missing')
  const selected = join(directory, found.entry.name)
  function add(path) {
    const bytes = regularFile(path, 8 * 1024 * 1024)
    total += bytes.length
    if (files.length >= 10000 || total > 64 * 1024 * 1024) fail('research_budget_exceeded')
    files.push({ path: relative(root, path).split(sep).join('/'), bytes: bytes.length, sha256: hash(bytes) })
  }
  function walk(dir, depth = 0) {
    if (depth > 6) fail('research_depth_exceeded')
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      const path = join(dir, entry.name)
      if (entry.isSymbolicLink()) fail('research_symlink_refused')
      if (entry.isDirectory()) walk(path, depth + 1)
      else add(path)
    }
  }
  if (found.entry.isDirectory()) walk(selected)
  else add(selected)
  if (!files.length) fail('destination_research_empty')
  return { root, files }
}

export function prepareDestination({ root, destination, output, passportColumn, rankColumn = null, createTemplate }) {
  if (typeof createTemplate !== 'function') fail('canonical_template_required')
  const research = inventory(root, destination)
  const csvBytes = regularFile(join(research.root, 'passport-priority.csv'), 65536)
  const passports = readPriority(new TextDecoder('utf-8', { fatal: true }).decode(csvBytes), passportColumn, rankColumn)
  // Resolve the actual parent too: a symlink may not route output into the source archive.
  const candidate = resolve(output), out = join(realpathSync(dirname(candidate)), basename(candidate))
  if (inside(research.root, out) || existsSync(out)) fail('new_external_output_directory_required')
  const plans = [], manifest = { schema: 1, kind: 'destination_preparation_batch', classification: 'RESEARCH_ONLY',
    destinationCountryCode: destination, citizenshipPriority: passports, publicationAuthority: 'none',
    completeResearch: false, availableClaims: 0, unavailableLabel: 'derzeit nicht verfügbar',
    warning: 'Bitte vor der Reise prüfen', priorityFileSha256: hash(csvBytes),
    researchFiles: research.files, researchApplicability: 'NOT_VALIDATED', plans: [] }
  // Fifty passports form ONE destination package; each original plan keeps its five-passport limit.
  for (let i = 0; i < passports.length; i += 5) {
    const group = passports.slice(i, i + 5)
    const plan = createTemplate({ destinationCountryCode: destination, citizenshipCountryCodes: group })
    if (!plan || plan.schema !== 1 || plan.kind !== 'official_source_onboarding_plan' || plan.classification !== 'RESEARCH_ONLY' || plan.destinationCountryCode !== destination
      || plan.citizenshipCountryCodes.length !== 5 || new Set(plan.citizenshipCountryCodes).size !== 5
      || plan.citizenshipCountryCodes.some(c => !group.includes(c)) || plan.primary !== null
      || plan.counterSources.length || plan.knownConflicts.length || plan.coverage.length !== 130) fail('canonical_template_refused')
    const slots = new Set(plan.coverage.map(r => `${r.citizenshipCountryCode}:${r.topic}`))
    if (slots.size !== 130 || group.some(c => plan.coverage.filter(r => r.citizenshipCountryCode === c).length !== 26)
      || plan.coverage.some(r => !group.includes(r.citizenshipCountryCode) || r.status !== 'unavailable'
        || r.reason !== 'not_researched' || Object.hasOwn(r, 'proposals'))) fail('template_coverage_refused')
    const name = `plan-${String(i / 5 + 1).padStart(2, '0')}.json`, text = JSON.stringify(plan) + '\n'
    plans.push([name, text]); manifest.plans.push({ path: name, passports: group, sha256: hash(text) })
  }
  // Validate every input/plan BEFORE creating output. Exclusive creation prevents overwriting work.
  mkdirSync(out, { recursive: false, mode: 0o700 })
  try {
    for (const [name, text] of plans) writeFileSync(join(out, name), text, { flag: 'wx', mode: 0o600 })
    // Completion manifest is written last; a directory without it is never a completed batch.
    writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest) + '\n', { flag: 'wx', mode: 0o600 })
  } catch (error) { rmSync(out, { recursive: true, force: true }); throw error }
  return { destinations: 1, passports: 50, plans: 10, topics: 1300, accepted: 0, researchComplete: 0 }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  void (async () => {
    try {
    const args = process.argv.slice(2), options = {}
    const flags = { '--research-root': 'root', '--destination': 'destination', '--output': 'output', '--passport-column': 'passportColumn', '--rank-column': 'rankColumn' }
    while (args.length) { const flag = args.shift(), value = args.shift(); if (!flags[flag] || !value || value.startsWith('--') || options[flags[flag]]) fail('invalid_arguments'); options[flags[flag]] = value }
    for (const key of ['root','destination','output','passportColumn']) if (!options[key]) fail('missing_arguments')
    const { createV3SourceOnboardingTemplate } = await import('../lib/readiness/official-truth-product-v3/customer-information/source-onboarding.ts')
    const result = prepareDestination({ ...options, createTemplate: createV3SourceOnboardingTemplate })
    process.stdout.write(JSON.stringify(result) + '\n')
    } catch { process.stderr.write('RESEARCH_PREPARATION_FAILED errors=1 accepted=0\n'); process.exitCode = 1 }
  })()
}
