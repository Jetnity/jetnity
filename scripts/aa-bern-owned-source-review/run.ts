import { createHash, createCipheriv, publicEncrypt, randomBytes, constants } from 'node:crypto'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { parse, type DefaultTreeAdapterMap } from 'parse5'
import { readAaChDeOwnedSources, inspectAaChDeOwnedOriginal, inspectAaChDeOwnedAttempt } from '../../lib/readiness/official-truth-product-v3/source/aa-ch-de-owned-read'

const HASH = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')
const expected = [
  ['lib/readiness/official-truth-product-v3/source/aa-ch-de-owned-read.ts', '3f2660c8959a065a09a433cfb05be97db626b70c5c39276d5df455c3b65ede5d'],
  ['lib/readiness/official-truth-product-v3/source/aa-ch-de-definition.ts', 'a44b38c4c56a1582584771f1f9bb9a83b043d2f9d16521fb320d37b3dbeb6aee'],
] as const
type Node = DefaultTreeAdapterMap['node']
type Element = DefaultTreeAdapterMap['element']
const isElement = (node: Node): node is Element => 'tagName' in node
function inspection(bodyText: string) {
  const errors: unknown[] = []
  const document = parse(bodyText, { sourceCodeLocationInfo: true, onParseError(error) {
    if (errors.length >= 64) throw Error('parse_error_bound')
    errors.push({ code: error.code, startOffset: error.startOffset, endOffset: error.endOffset })
  } })
  const nodes: Node[] = [], pending = [{ node: document as Node, depth: 0 }]
  while (pending.length) {
    const item = pending.pop()!
    if (nodes.length >= 10_000 || item.depth > 64) throw Error('document_bound')
    nodes.push(item.node)
    if ('childNodes' in item.node) for (const child of item.node.childNodes.slice().reverse()) pending.push({ node: child, depth: item.depth + 1 })
    if (isElement(item.node) && item.node.tagName === 'template' && 'content' in item.node)
      pending.push({ node: item.node.content as Node, depth: item.depth + 1 })
  }
  const elements = nodes.filter(isElement)
  const attrs = (node: Element) => node.attrs.map(a => [a.namespace ?? '', a.prefix ?? '', a.name, a.value])
  function textOf(root: Node): string {
    if ('value' in root && root.nodeName === '#text') return root.value as string
    return 'childNodes' in root ? root.childNodes.map(textOf).join('') : ''
  }
  function canon(root: Node): unknown {
    if (isElement(root)) return ['element', root.namespaceURI, root.tagName, attrs(root),
      root.childNodes.map(canon), root.tagName === 'template' && 'content' in root ? canon(root.content as Node) : null]
    if ('value' in root && root.nodeName === '#text') return ['text', root.value]
    if ('data' in root && root.nodeName === '#comment') return ['comment', root.data]
    return ['node', root.nodeName, 'childNodes' in root ? root.childNodes.map(canon) : []]
  }
  const blocks = elements.filter(n => ['main','article'].includes(n.tagName)).map(n => {
    const location = n.sourceCodeLocation
    return { tag: n.tagName, attrs: attrs(n), location,
      canonicalSha256: HASH(JSON.stringify(canon(n))), text: textOf(n),
      rawSha256: location ? HASH(bodyText.slice(location.startOffset, location.endOffset)) : null }
  })
  return { mode: document.mode, nodes: nodes.length, errors, blocks,
    metadata: elements.filter(n => ['html','title','link','meta','h1','h2','h3'].includes(n.tagName))
      .map(n => ({tag:n.tagName,attrs:attrs(n),text:['title','h1','h2','h3'].includes(n.tagName)?textOf(n):null,location:n.sourceCodeLocation})),
    tables: elements.filter(n=>n.tagName==='table').map(n=>({attrs:attrs(n),text:textOf(n),location:n.sourceCodeLocation})),
  }
}
async function main() {
  if (process.env.GITHUB_EVENT_NAME !== 'push' || process.env.GITHUB_RUN_ATTEMPT !== '1'
    || process.env.GITHUB_REF !== 'refs/heads/review/aa-bern-owned-read-20261112'
    || !/^[0-9a-f]{40}$/.test(process.env.GITHUB_SHA ?? '')) throw Error('review_selection_mismatch')
  for (const [path, hash] of expected) if (HASH(readFileSync(path)) !== hash) throw Error('source_pin_mismatch')
  const controller = new AbortController()
  const abort = () => controller.abort()
  process.once('SIGTERM', abort)
  const began = performance.now()
  const pair = await readAaChDeOwnedSources(controller.signal, began + 10_000)
  process.removeListener('SIGTERM', abort)
  const review: Record<string, unknown> = {}, summary: Record<string, unknown> = {}
  for (const role of ['primary', 'counter'] as const) {
    const value = pair[role]
    const receipt = value.status === 'read' ? value.receipt : value.attempt
    const attempt = receipt ? inspectAaChDeOwnedAttempt(receipt) : null
    const original = value.status === 'read' ? inspectAaChDeOwnedOriginal(value.receipt) : null
    let inspected: unknown = null
    if (original) {
      try { inspected = inspection(original.bodyText) }
      catch { inspected = {status:'inspection_unavailable'} }
    }
    review[role] = { status:value.status, attempt, original, inspection:inspected }
    summary[role] = { status:value.status, reason:value.status==='unavailable'?value.reason:null,
      bytes:original?.bytes??0, rawDigest:original?.rawDigest??null,
      startedAt:attempt?.startedAt??null, completedAt:attempt?.completedAt??null }
  }
  const payload = Buffer.from(JSON.stringify({schema:1,purpose:'ordinary_owned_source_review_only',
    commit:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,originals:review}), 'utf8')
  if (payload.length > 1_048_576) throw Error('review_payload_bound')
  const key=randomBytes(32), nonce=randomBytes(12), aad=Buffer.from('jetnity-aa-bern-review-v1')
  const cipher=createCipheriv('aes-256-gcm',key,nonce); cipher.setAAD(aad)
  const ciphertext=Buffer.concat([cipher.update(payload),cipher.final()])
  const wrappedKey=publicEncrypt({key:readFileSync(new URL('./review-public-key.pem',import.meta.url)),
    padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key)
  const sealed={schema:1,algorithm:'RSA-OAEP-SHA256/AES-256-GCM',aad:aad.toString('base64'),
    wrappedKey:wrappedKey.toString('base64'),nonce:nonce.toString('base64'),
    tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')}
  key.fill(0);payload.fill(0)
  mkdirSync('aa-bern-review-output',{recursive:true})
  writeFileSync('aa-bern-review-output/sealed-review.json',JSON.stringify(sealed))
  const result={schema:1,purpose:'review_only',acceptedEvidence:0,databaseWrites:0,
    methodApproval:false,selectorStillNull:true,milliseconds:Math.ceil(performance.now()-began),sources:summary}
  writeFileSync('aa-bern-review-output/summary.json',JSON.stringify(result,null,2)+'\n')
  console.log('AA_BERN_OWNED_REVIEW '+JSON.stringify(result))
  if (pair.primary.status!=='read'||pair.counter.status!=='read') process.exitCode=1
}
void main().catch(()=>{console.error('AA_BERN_OWNED_REVIEW_FAILED');process.exitCode=1})
