// Explicit CI proof only. One fresh paired read, then data-only mutations of
// those held originals. No database, issuer, approval, activation or raw output.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import type { DefaultTreeAdapterMap } from 'parse5'
import type { AaChDeSourceRole } from '../../lib/readiness/official-truth-product-v3/source/aa-ch-de-definition'
import type { AaChDeOwnedOriginal } from '../../lib/readiness/official-truth-product-v3/source/aa-ch-de-owned-read'

const ROOT = new URL('../../', import.meta.url)
const SOURCE = 'lib/readiness/official-truth-product-v3/source/'
const PINS = [
  ['aa-bern-ch-de-current-article.ts', 'a6e4eeac83e0b9ee03b35ebd3ccbab887097d2572abd318526faa2fa6358067e'],
  ['aa-ch-de-reviewed-program.ts', 'd0b131387434a7d9289fa5e9db32711591c24a4f607ed7d9991e3f0df991c97b'],
  ['aa-ch-de-definition.ts', 'a44b38c4c56a1582584771f1f9bb9a83b043d2f9d16521fb320d37b3dbeb6aee'],
  ['aa-ch-de-owned-read.ts', '3f2660c8959a065a09a433cfb05be97db626b70c5c39276d5df455c3b65ede5d'],
  ['aa-ch-de-qualification.ts', 'e8455ea24e9aba165ff3b933b7ea95ac444fdd20fea0398e61e2b32d1dbc2619'],
] as const
const ROLES = ['primary', 'counter'] as const
const EXPECTED_FACT = { status: 'clear', fact: { schema: 1,
  fact: { kind: 'requirement_effect', effect: 'not_required', visaMode: 'visa_exempt' } },
  legalValidity: { status: 'specified', validFrom: null, validUntil: null } }
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)
function requireProof(condition: unknown): asserts condition {
  if (!condition) throw Error('reviewed_program_proof_refused')
}
type Node = DefaultTreeAdapterMap['node']
type Element = DefaultTreeAdapterMap['element']
type Location = Readonly<{ startOffset: number; endOffset: number }>
const isElement = (node: Node): node is Element => 'tagName' in node
const attr = (node: Element, name: string) => node.attrs.find(value => value.name === name && !value.namespace)?.value
function nodesWithin(root: Node): Node[] {
  const nodes: Node[] = [], pending = [{ node: root, depth: 0 }]
  while (pending.length) {
    const next = pending.pop()!
    requireProof(nodes.length < 10_000 && next.depth <= 64)
    nodes.push(next.node)
    if ('childNodes' in next.node) for (const child of next.node.childNodes.slice().reverse()) {
      pending.push({ node: child, depth: next.depth + 1 })
    }
    if (isElement(next.node) && next.node.tagName === 'template' && 'content' in next.node) {
      pending.push({ node: next.node.content as Node, depth: next.depth + 1 })
    }
  }
  return nodes
}
function textOf(node: Node): string {
  return nodesWithin(node).filter(value => value.nodeName === '#text' && 'value' in value)
    .map(value => 'value' in value ? value.value : '').join('').replace(/\s+/g, ' ').trim()
}
function only<T>(items: readonly T[]): T { requireProof(items.length === 1); return items[0]! }
function location(node: Element): Location {
  const value = node.sourceCodeLocation
  requireProof(value && Number.isInteger(value.startOffset) && Number.isInteger(value.endOffset))
  return value
}
function attrLocation(node: Element, name: string): Location {
  const value = node.sourceCodeLocation?.attrs?.[name]
  requireProof(value && Number.isInteger(value.startOffset) && Number.isInteger(value.endOffset))
  return value
}
function replace(body: string, range: Location, replacement: string): string {
  requireProof(range.startOffset >= 0 && range.startOffset < range.endOffset && range.endOffset <= body.length)
  const changed = body.slice(0, range.startOffset) + replacement + body.slice(range.endOffset)
  requireProof(changed !== body && Buffer.byteLength(changed) <= 131_072)
  return changed
}

type SourceSummary = Readonly<{ role: AaChDeSourceRole; status: 'read' | 'unavailable';
  reason: string | null; bytes: number; rawDigest: string | null; startedAt: string | null; completedAt: string | null }>
const report: { schema: 1; purpose: string; status: 'NOT_STARTED' | 'PASS' | 'FAIL';
  failedCase: string | null; cases: string[]; sources: SourceSummary[]; pairedReaderCalls: number;
  acceptedEvidence: 0; databaseCalls: 0; methodApproval: false; activation: false;
  selectorStillNull: boolean; milliseconds: number } = {
  schema: 1, purpose: 'reviewed_program_qa_only', status: 'NOT_STARTED', failedCase: null,
  cases: [], sources: [], pairedReaderCalls: 0, acceptedEvidence: 0, databaseCalls: 0,
  methodApproval: false, activation: false, selectorStillNull: false, milliseconds: 0,
}
let currentCase = 'preflight', began = performance.now(), deadline = began + 30_000
const controller = new AbortController()
function current() { requireProof(!controller.signal.aborted && performance.now() < deadline) }
function proof(name: string, body: () => void): void {
  requireProof(/^[a-z0-9_]{1,80}$/.test(name) && report.cases.length < 64)
  currentCase = name; current(); body(); current(); report.cases.push(name)
}

async function main(): Promise<void> {
  // Root selects this separate proof branch. A rerun cannot make two more GETs.
  requireProof(process.env.GITHUB_EVENT_NAME === 'push' && process.env.GITHUB_RUN_ATTEMPT === '1'
    && process.env.GITHUB_REF === 'refs/heads/review/aa-bern-reviewed-program-20261112'
    && /^[0-9a-f]{40}$/.test(process.env.GITHUB_SHA ?? ''))
  for (const [name, digest] of PINS) requireProof(hash(readFileSync(new URL(SOURCE + name, ROOT))) === digest)
  const lock = JSON.parse(readFileSync(new URL('package-lock.json', ROOT), 'utf8')) as {
    packages?: Record<string, { version?: string }>
  }
  requireProof(lock.packages?.['node_modules/parse5']?.version === '8.0.0')

  // No source module is loaded before the complete selected file checks above.
  const [parser, article, catalog, definition, reader, qualification] = await Promise.all([
    import('parse5'),
    import('../../lib/readiness/official-truth-product-v3/source/aa-bern-ch-de-current-article'),
    import('../../lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program'),
    import('../../lib/readiness/official-truth-product-v3/source/aa-ch-de-definition'),
    import('../../lib/readiness/official-truth-product-v3/source/aa-ch-de-owned-read'),
    import('../../lib/readiness/official-truth-product-v3/source/aa-ch-de-qualification'),
  ])
  const program = catalog.AA_BERN_CH_DE_REVIEWED_PROGRAM, graph = program.registry.contentIdentity
  requireProof(graph)
  const publications = { primary: definition.AA_CH_DE_PUBLICATION, counter: definition.BERN_CH_DE_PUBLICATION }
  const profiles = { primary: article.AA_CH_DE_REVIEWED_IDENTITY_PROFILE, counter: article.BERN_CH_DE_REVIEWED_IDENTITY_PROFILE }
  const forRole = (role: AaChDeSourceRole) => role === 'primary' ? program : program.counter
  const identityInput = (role: AaChDeSourceRole, responseText: string) => {
    const source = forRole(role).source
    return { item: only(graph.items.filter(item => item.sourceId === source.sourceId && item.contentItemId === source.contentItemId)),
      representation: only(graph.representations.filter(rep => rep.sourceId === source.sourceId
        && rep.contentItemId === source.contentItemId && rep.representationId === source.representationId)),
      responseText, finalUrl: publications[role].url, mediaType: 'text/html' }
  }
  proof('closed_selection_and_fixed_context', () => {
    requireProof(definition.selectedAaChDeQualification() === null
      && qualification.selectedAaChDeProgramForBinding(program.binding) === null
      && catalog.AA_BERN_CH_DE_METHOD_DRAFT.status === 'NOT_APPROVED')
    report.selectorStillNull = true
    requireProof(program.context.scope.destinationCountryCode === 'DE'
      && same(program.context.scope.citizenship, { mode: 'required', countryCodes: ['CH'] })
      && same(program.context.scope.credentialOption, { mode: 'option', documentType: 'passport',
        issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' })
      && program.context.scope.requirementType === 'visa' && program.context.route === 'direct_entry')
    requireProof(program.binding.sources.length === 2 && program.counterInventory.eligibleRepresentations.length === 1
      && same(program.counterInventory.eligibleRepresentations[0], program.counter.source)
      && program.source.contentItemId !== program.counter.source.contentItemId)
    for (const role of ROLES) requireProof(forRole(role).sourceBinding.canonicalUrl === publications[role].url
      && forRole(role).sourceBinding.executableDigest === PINS[0][1]
      && forRole(role).sourceBinding.role === role)
  })
  const abort = () => controller.abort()
  process.once('SIGTERM', abort); process.once('SIGINT', abort)
  began = performance.now(); deadline = began + 30_000
  const timer = setTimeout(abort, 30_000)
  try {
    currentCase = 'paired_actual_reads'; current()
    report.pairedReaderCalls++
    // Exactly one call, one fixed attempt per publication, no retry/fallback.
    // The existing reader joins DNS, requests, responses and sockets itself.
    const pair = await reader.readAaChDeOwnedSources(controller.signal, began + 10_000)
    const held = new Map<AaChDeSourceRole, AaChDeOwnedOriginal>()
    for (const role of ROLES) {
      const result = pair[role], receipt = result.status === 'read' ? result.receipt : result.attempt
      const attempt = receipt ? reader.inspectAaChDeOwnedAttempt(receipt) : null
      const original = result.status === 'read' ? reader.inspectAaChDeOwnedOriginal(result.receipt) : null
      report.sources.push({ role, status: result.status, reason: result.status === 'unavailable' ? result.reason : null,
        bytes: original?.bytes ?? 0, rawDigest: original?.rawDigest ?? null,
        startedAt: attempt?.startedAt ?? null, completedAt: attempt?.completedAt ?? null })
      if (original) held.set(role, original)
    }
    proof('paired_actual_reads', () => requireProof(held.size === 2 && pair.primary.status === 'read'
      && pair.counter.status === 'read' && pair.primary.receipt !== pair.counter.receipt))

    function rejectMutation(role: AaChDeSourceRole, name: string, changed: string, identityRemains: boolean) {
      proof(name, () => {
        const original = held.get(role)!, selected = forRole(role)
        requireProof(changed !== original.bodyText && hash(changed) !== original.rawDigest)
        requireProof(reader.inspectAaChDeOwnedOriginal({ ...original, bodyText: changed }) === null)
        requireProof(selected.documentIdentity(changed) === identityRemains)
        requireProof(profiles[role].verify(identityInput(role, changed)).ok === identityRemains)
        const result = selected.interpret(changed)
        requireProof(result.status === 'unclear' && result.reason === (identityRemains
          ? 'ambiguous_statement' : 'unqualified_destination_authority'))
      })
    }
    for (const role of ROLES) {
      const original = held.get(role)!, selected = forRole(role), result = pair[role]
      proof(role + '_actual_custody_and_positive_visa_fact', () => {
        requireProof(result.status === 'read')
        const attempt = reader.inspectAaChDeOwnedAttempt(result.receipt)
        requireProof(attempt && attempt.role === role && attempt.status === 'read' && attempt.reason === null
          && attempt.startedAt === original.startedAt && attempt.completedAt === original.retrievedAt)
        requireProof(original.role === role && original.requestUrl === publications[role].url
          && original.finalUrl === original.requestUrl && original.method === 'GET'
          && original.httpStatus === 200 && original.redirectCount === 0 && original.contentType === 'text/html'
          && original.bytes === Buffer.byteLength(original.bodyText) && original.rawDigest === hash(original.bodyText))
        requireProof(reader.inspectAaChDeOwnedOriginal({ ...result.receipt }) === null
          && reader.inspectAaChDeOwnedOriginal({ ...original }) === null)
        requireProof(selected.documentIdentity(original.bodyText)
          && profiles[role].verify(identityInput(role, original.bodyText)).ok
          && same(selected.interpret(original.bodyText), EXPECTED_FACT))
      })
      rejectMutation(role, role + '_other_publication_refused', held.get(role === 'primary' ? 'counter' : 'primary')!.bodyText, false)
      currentCase = role + '_mutation_anchors'; current()
      let parseErrors = 0
      const document = parser.parse(original.bodyText, { sourceCodeLocationInfo: true,
        onParseError() { requireProof(++parseErrors <= 64) } })
      const elements = nodesWithin(document).filter(isElement)
      const main = only(elements.filter(node => node.tagName === 'main' && attr(node, 'id') === 'main'))
      const mainRange = location(main)
      requireProof(hash(original.bodyText.slice(mainRange.startOffset, mainRange.endOffset))
        === article.AA_BERN_REVIEWED_DOCUMENTS[role].reviewedMainSha256)
      const meta = (kind: string, key: string) => only(elements.filter(node => node.tagName === 'meta' && attr(node, kind) === key))
      const site = meta('property', 'og:site_name'), author = meta('name', 'author')
      const canonical = only(elements.filter(node => node.tagName === 'link' && attr(node, 'rel') === 'canonical'))
      rejectMutation(role, role + '_missing_site_content_refused', replace(original.bodyText, attrLocation(site, 'content'), ''), false)
      rejectMutation(role, role + '_wrong_site_content_refused', replace(original.bodyText,
        attrLocation(site, 'content'), 'content="qa_unreviewed_site"'), false)
      rejectMutation(role, role + '_missing_author_content_refused', replace(original.bodyText, attrLocation(author, 'content'), ''), false)
      rejectMutation(role, role + '_wrong_canonical_refused', replace(original.bodyText,
        attrLocation(canonical, 'href'), 'href="https://example.invalid/unreviewed"'), false)
      for (const [label, node] of [['site', site], ['canonical', canonical]] as const) {
        const at = location(node), copied = original.bodyText.slice(at.startOffset, at.endOffset)
        rejectMutation(role, role + '_duplicate_' + label + '_refused', replace(original.bodyText, at, copied + copied), false)
      }
      const paragraphs = nodesWithin(main).filter(isElement).filter(node => node.tagName === 'p')
      if (role === 'primary') {
        const notes = paragraphs.filter(node => /^[1-9]\)(?:\s|$)/.test(textOf(node)))
        requireProof(notes.length === 9)
        for (let number = 1; number <= 9; number++) {
          const note = only(notes.filter(node => textOf(node).startsWith(number + ')')))
          rejectMutation(role, 'primary_footnote_' + number + '_removed_unclear', replace(original.bodyText, location(note), ''), true)
        }
      } else {
        // Exact paragraph selected from the actually reviewed complete Bern
        // main; no quoted article or guessed semantic selector is embedded here.
        const swiss = only(paragraphs.filter(node => {
          const at = location(node)
          return hash(original.bodyText.slice(at.startOffset, at.endOffset))
            === '45bce4b186bdbf3fc35842a885646ee6958008e802baff0313ba063672fbc8ef'
        }))
        rejectMutation(role, 'counter_swiss_paragraph_removed_unclear', replace(original.bodyText, location(swiss), ''), true)
        const end = swiss.sourceCodeLocation?.endTag; requireProof(end)
        rejectMutation(role, 'counter_unreviewed_condition_unclear', replace(original.bodyText, end,
          '<span>QA_UNREVIEWED_CONDITION</span></p>'), true)
      }
      proof(role + '_held_original_unchanged', () => requireProof(hash(original.bodyText) === original.rawDigest
        && same(selected.interpret(original.bodyText), EXPECTED_FACT)))
    }
    proof('selection_and_qualification_still_closed', () => {
      requireProof(definition.selectedAaChDeQualification() === null
        && qualification.selectedAaChDeProgramForBinding(program.binding) === null)
      report.selectorStillNull = true
    })
    held.clear()
    report.status = 'PASS'
  } finally {
    clearTimeout(timer); process.removeListener('SIGTERM', abort); process.removeListener('SIGINT', abort)
    // No detached read exists: the single paired promise above was awaited.
  }
}

void main().catch(() => {
  report.status = 'FAIL'; report.failedCase = currentCase; process.exitCode = 1
}).finally(() => {
  report.milliseconds = Math.ceil(performance.now() - began)
  // Never serialize thrown errors, HTML, parser nodes, SQL or credentials.
  const output = JSON.stringify(report)
  if (Buffer.byteLength(output) <= 16_384) console.log('AA_BERN_REVIEWED_PROGRAM_PROOF ' + output)
  else { console.error('AA_BERN_REVIEWED_PROGRAM_PROOF_OUTPUT_REFUSED'); process.exitCode = 1 }
})
