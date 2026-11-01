import { CHILD_ORIGIN, PARENT_ORIGIN, PROTOCOL_REVISION } from './host-runtime.mjs'

export const TWELVEGO_POLICY_ID = 'twelvego-general-chf-20261031-r1'

export const TWELVEGO_BINDING = Object.freeze({
  provider: 'twelvego',
  selected: true,
  policyId: TWELVEGO_POLICY_ID,
  processingPolicyRevision: 'twelvego-load-affiliate-analytics-v1',
  disclosureRevision: 'twelvego-general-disclosure-v1',
  networkPolicyRevision: 'twelvego-general-network-v1',
  requiredOptional: 'ANALYTICS_STORAGE',
  parentOrigin: PARENT_ORIGIN,
  childOrigin: CHILD_ORIGIN,
  embedPath: '/embed/twelvego',
  protocolRevision: PROTOCOL_REVISION,
  artifactSha256: '3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e',
  sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups',
  purposeSeparationVerified: false,
})

export const TWELVEGO_SOURCES = Object.freeze({
  scriptLoader: 'https://cdn0.trainbusferry.com/tools/form/de/',
  jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js',
  stylesheet: 'https://cdn0.trainbusferry.com//tools/form/css/main-new.min.css',
  logo: 'https://cdn0.trainbusferry.com/tools/form/logo.png',
  counter: 'https://agent.12go.asia/tools/form/cnt.php',
  icons: 'https://12go.asia//images/design/',
  fonts: Object.freeze([
    'https://cdn0.trainbusferry.com/fonts/glyphicons-halflings-regular.eot',
    'https://cdn0.trainbusferry.com/fonts/glyphicons-halflings-regular.woff',
    'https://cdn0.trainbusferry.com/fonts/glyphicons-halflings-regular.ttf',
    'https://cdn0.trainbusferry.com/fonts/glyphicons-halflings-regular.svg',
  ]),
  typeahead: 'https://12go.asia/de/typeahead',
  search: 'https://12go.asia/de/travel/',
})

const LOADER_PAIRS = Object.freeze([
  Object.freeze(['id', '17323861']),
  Object.freeze(['domain', '12go.asia']),
])

const COUNTER_PAIRS = Object.freeze([
  Object.freeze(['lang', 'de']),
  Object.freeze(['z', '17323861']),
  Object.freeze(['sub_id', 'jetnity-mobility-search']),
])

function same(value, expected) {
  return value === expected
}

export function twelvegoBindingMatches(value) {
  const binding = TWELVEGO_BINDING
  if (!value || value.selected !== true) return false
  return same(value.provider, binding.provider)
    && same(value.policyId, binding.policyId)
    && same(value.processingPolicyRevision, binding.processingPolicyRevision)
    && same(value.disclosureRevision, binding.disclosureRevision)
    && same(value.networkPolicyRevision, binding.networkPolicyRevision)
    && same(value.requiredOptional, binding.requiredOptional)
    && same(value.parentOrigin, binding.parentOrigin)
    && same(value.childOrigin, binding.childOrigin)
    && same(value.embedPath, binding.embedPath)
    && same(value.protocolRevision, binding.protocolRevision)
    && same(value.artifactSha256, binding.artifactSha256)
    && same(value.sandbox, binding.sandbox)
    && value.purposeSeparationVerified === false
}

export function twelvegoContentSecurityPolicy(plan, nonce) {
  if (!twelvegoBindingMatches(plan)) return null
  if (typeof nonce !== 'string' || !/^[a-f0-9]{32}$/.test(nonce)) return null
  const sources = TWELVEGO_SOURCES
  return [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' ${sources.scriptLoader} ${sources.jquery}`,
    `style-src 'nonce-${nonce}' ${sources.stylesheet}`,
    "style-src-attr 'unsafe-inline'",
    `img-src ${sources.logo} ${sources.counter} ${sources.icons} data:`,
    `font-src ${sources.fonts.join(' ')}`,
    `connect-src ${sources.typeahead}`,
    `form-action ${sources.search}`,
    `frame-ancestors ${PARENT_ORIGIN}`,
    "base-uri 'none'",
    "object-src 'none'",
    "media-src 'none'",
    "worker-src 'none'",
    "manifest-src 'none'",
    "frame-src 'none'",
  ].join('; ')
}

function decodeForm(value) {
  try {
    return decodeURIComponent(String(value).replace(/\+/g, ' '))
  } catch {
    return null
  }
}

function pairsOf(url) {
  const search = url.search.startsWith('?') ? url.search.slice(1) : ''
  if (search === '') return []
  const pairs = []
  for (const part of search.split('&')) {
    if (part === '') return null
    const eq = part.indexOf('=')
    if (eq === -1) return null
    const key = decodeForm(part.slice(0, eq))
    const decoded = decodeForm(part.slice(eq + 1))
    if (key === null || decoded === null || key === '') return null
    pairs.push([key, decoded])
  }
  return pairs
}

function pairsEqual(left, right) {
  return left.length === right.length && left.every((pair, index) => pair[0] === right[index][0] && pair[1] === right[index][1])
}

function parsed(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) return null
    if (url.port !== '' && url.port !== '443') return null
    const pairs = pairsOf(url)
    if (pairs === null) return null
    return url
  } catch {
    return null
  }
}

export function classifyTwelvegoResource(value, resourceType) {
  const url = parsed(value)
  if (!url) return { allow: false, reason: 'route' }
  const pairs = pairsOf(url)
  const sources = TWELVEGO_SOURCES
  if (resourceType === 'script' && url.origin === 'https://cdn0.trainbusferry.com' && url.pathname === '/tools/form/de/' && pairsEqual(pairs, LOADER_PAIRS)) {
    return { allow: true, role: 'loader' }
  }
  if (resourceType === 'script' && url.href === sources.jquery && pairs.length === 0) return { allow: true, role: 'jquery' }
  if (resourceType === 'style' && url.href === sources.stylesheet && pairs.length === 0) return { allow: true, role: 'stylesheet' }
  if (resourceType === 'image' && url.href === sources.logo && pairs.length === 0) return { allow: true, role: 'logo' }
  if (resourceType === 'image' && url.origin === 'https://agent.12go.asia' && url.pathname === '/tools/form/cnt.php' && pairsEqual(pairs, COUNTER_PAIRS)) {
    return { allow: true, role: 'counter' }
  }
  if (resourceType === 'image' && url.origin === 'https://12go.asia' && url.pathname.startsWith('//images/design/') && pairs.length === 0) {
    return { allow: true, role: 'icon' }
  }
  if (resourceType === 'font' && sources.fonts.includes(url.href) && pairs.length === 0) return { allow: true, role: 'font' }
  if (resourceType === 'connect' && url.href === sources.typeahead && pairs.length === 0) return { allow: true, role: 'typeahead' }
  if (resourceType === 'form' && url.href === sources.search && pairs.length === 0) return { allow: true, role: 'search' }
  return { allow: false, reason: 'unlisted' }
}
