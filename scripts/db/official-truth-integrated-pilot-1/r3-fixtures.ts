// Historical URL mutations: retain actual support URLs and recompute every
// ancestor Pin, selection/proof identity, B and K with the existing helper.
import { type LocalIntegratedPilotEnvelope } from '../../../lib/readiness/official-truth-integrated-pilot-bundle'
import { r2DescriptorFixture } from './r2-fixtures'
import { rewriteIntegratedFixture } from './integrated-proof'
type Value = Record<string, unknown>
const parse = (bytes: Uint8Array): Value => JSON.parse(Buffer.from(bytes).toString('utf8'))
export const r3LengthUrl = (length: number, host = 'authority.example') => `https://${host}/` + 'a'.repeat(length - `https://${host}/`.length)
export function r3ExtractorUrls(primary: LocalIntegratedPilotEnvelope, urls: readonly string[], selected = true) {
  const id = selected ? 'otx_integrated_primary' : 'otx_integrated_composed'
  const descriptor = (parse(primary.bundle.artifacts.find(a => a.pin.id === id)!.canonicalBytes).content as Value).descriptor as Value
  return r2DescriptorFixture(primary, { urlAllowlist: [...descriptor.urlAllowlist as Value[], ...urls.map(canonicalUrl => ({ kind: 'exact', canonicalUrl }))] }, id)
}
export function r3RepresentationUrls(primary: LocalIntegratedPilotEnvelope, urls: readonly string[]) {
  const representation = primary.bundle.artifacts.find(a => a.artifactType === 'representation_definition')!
  const d = (parse(representation.canonicalBytes).content as Value).descriptor as Value
  const requestUrls = [...d.requestUrls as string[], ...urls].sort()
  let result = rewriteIntegratedFixture(primary, representation.pin.id, v => ({ ...v, content: { ...(v.content as Value), descriptor: { ...d, requestUrls } } }))
  const catalog = result.bundle.artifacts.find(a => a.artifactType === 'catalog_snapshot')!
  result = rewriteIntegratedFixture(result, catalog.pin.id, v => {
    const c = v.content as Value, registry = c.registry as Value, graph = registry.contentIdentity as Value
    return { ...v, content: { ...c, registry: { ...registry, contentIdentity: { ...graph, representations: (graph.representations as Value[]).map(r =>
      r.sourceId === d.sourceId && r.contentItemId === d.contentItemId && r.representationId === d.representationId && r.representationVersion === d.representationVersion ? { ...r, requestUrls } : r) } } } }
  })
  return result
}
export function r3UrlFixtures(primary: LocalIntegratedPilotEnvelope) {
  return {
    negative: [
      ['selected_literal_quote', r3ExtractorUrls(primary, ['https://authority.example/a"b'])],
      ['unselected_literal_quote', r3ExtractorUrls(primary, ['https://authority.example/a"b'], false)],
      ['selected_path_braces', r3ExtractorUrls(primary, ['https://authority.example/a{b}'])],
      ['selected_query_apostrophe', r3ExtractorUrls(primary, ["https://authority.example/?q=a'b"])],
      ['selected_501', r3ExtractorUrls(primary, [r3LengthUrl(501)])],
      ['unselected_501', r3ExtractorUrls(primary, [r3LengthUrl(501)], false)],
      ['representation_literal_quote', r3RepresentationUrls(primary, ['https://regulations.example/a"b'])],
      ['representation_501', r3RepresentationUrls(primary, [r3LengthUrl(501, 'regulations.example')])],
      ['representation_fragment', r3RepresentationUrls(primary, ['https://regulations.example/#'])],
      ['representation_wildcard', r3RepresentationUrls(primary, ['https://regulations.example/*'])],
    ] as const,
    positive: [
      ['selected_escaping_and_500', r3ExtractorUrls(primary, ['https://authority.example/a%22b', 'https://authority.example/a%7Bb%7D', 'https://authority.example/?q=a%27b', 'https://authority.example/?', r3LengthUrl(500)])],
      ['unselected_role_specific', r3ExtractorUrls(primary, ['https://127.0.0.1/', 'https://[::1]:8443/', 'https://sub.localhost/*#', 'https://xn--bcher-kva.example/'], false)],
      ['representation_escaping_and_500', r3RepresentationUrls(primary, ['https://regulations.example/a%22b', 'https://regulations.example/?q=a%27b', 'https://regulations.example/?', r3LengthUrl(500, 'regulations.example')])],
    ] as const,
  }
}

/** Component/host differential vectors, in addition to complete native packages. */
export function r3UrlCodecVectors(): readonly string[] {
  const root = 'https://authority.example/'
  const values = [root, r3LengthUrl(500), r3LengthUrl(501), root + '?', root + '#', root + '?q=%27', root + '?q=\'', root + 'a%2f../b', root + '%2e%2e/a', root + 'a/.', root + 'a/..', root + 'a/%2e', root + 'a/.%2e', root + 'a/%2f../b', root + 'a%20b', root + '%zz', root + '%', root + '%00', root + '😀', root + '?q=😀', root + '#😀']
  for (let c = 1; c < 128; c++) for (const part of ['p', '?q=', '#']) values.push(root + part + String.fromCharCode(c) + 'x')
  for (const host of ['authority.example', 'localhost', 'sub.localhost', 'x.local', 'localhost.example', 'notlocalhost', 'a', '.', 'x..example', '-x.example', 'x_.example', 'x"y.example', 'xn--bcher-kva.example', 'xn--e1afmkfd.xn--p1ai', 'xn--a.example', 'xn--.example', 'xn--abc-.example', 'xn--ab-j1t.example', '127.0.0.1', '127.1', '0x', 'foo.123', 'foo.0x1', '127.0.0.1.', '[::1]', '[0:0:0:0:0:0:0:1]', '[::ffff:c000:201]', '[::ffff:192.0.2.1]', '[1:0:0:2:0:0:3:4]', '[1::2:0:0:3:4]', 'AUTHORITY.EXAMPLE', 'authority.example.', 'authority.example:443', 'authority.example:0443', 'authority.example:0', 'authority.example:8443', 'authority.example:65536', 'authority.example:', 'user@authority.example', 'authority%2eexample']) values.push('https://' + host + '/')
  // Version-sensitive IDNA, normalization, joiner and bidi counterexamples.
  for (const host of ["xn--bcher-kva.example", "xn--mgbh0fb.example", "xn--9dbne9b.example", "xn--a-bicuf1d.example", "xn--a-0hc.example", "xn--ab-vld.example", "xn--9hb.example", "xn--1-9pc.example", "xn--1-bqc.example", "xn--a-1mc799q.example", "xn--ngba799q.example", "xn-----etdc2524a.example", "xn--11b2ezcw70k.example", "xn--11b6iy14ea.example", "xn--a-ugn.example", "xn--a-ubb.example", "xn--a-vbb.example", "xn--0ca.example", "xn--a-sqd.example", "xn--0zb.example", "xn--029h.example", "xn--129h.example", "xn--0ug.example", "xn--62g.example", "xn--a-vca.example", "xn--zca.example", "xn--029h.example", "xn--4q0d.example", "xn--846f.example", "xn--a-0l7r.example", "xn--a-2ff.example", "xn--a-3c8r.example", "xn--a-4j7r.example", "xn--a-5p6m.example", "xn--a-7e4i.example", "xn--a-8p6m.example", "xn--a-bh9k.example", "xn--a-cz65a.example", "xn--a-ec9i.example", "xn--a-fbl.example", "xn--a-g73e.example", "xn--a-hl7r.example", "xn--a-ik7r.example", "xn--a-jq6q.example", "xn--a-kw5i.example", "xn--a-mg7q.example", "xn--a-npd.example", "xn--a-p36r.example", "xn--a-ql4i.example", "xn--a-rjd.example", "xn--a-sl8r.example", "xn--a-tw4i.example", "xn--a-uwu.example", "xn--a-w9k.example", "xn--a-xe4i.example", "xn--a-yi7i.example", "xn--a-zu4i.example", "xn--dw3d.example", "xn--hyb.example", "xn--lh1d.example", "xn--pw5h.example", "xn--ww5h.example"]) values.push('https://' + host + '/')
  return values
}
