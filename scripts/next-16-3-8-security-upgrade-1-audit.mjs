/**
 * Jetnity Next.js 16.3.8 security upgrade 1 — repository audit.
 *
 * Read-only inventory of the pin, image allowlist, and advisory prerequisites.
 * It does not fetch third-party hosts and it does not change configuration.
 *
 * Usage: node scripts/next-16-3-8-security-upgrade-1-audit.mjs
 * Exit 1 when the bounded upgrade contract is broken.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, extname } from 'node:path'

const root = process.cwd()
const codeExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const skipDirs = new Set([
  'node_modules',
  '.next',
  '.git',
  'docs',
  'coverage',
  'out',
  'dist',
])

const read = (rel) => readFileSync(join(root, rel), 'utf8')

const walk = (dir, acc = []) => {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return acc
  }
  for (const name of entries) {
    if (skipDirs.has(name)) continue
    const abs = join(dir, name)
    let st
    try {
      st = statSync(abs)
    } catch {
      continue
    }
    if (st.isDirectory()) walk(abs, acc)
    else if (codeExt.has(extname(name))) acc.push(abs)
  }
  return acc
}

const isTest = (abs) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(abs)
const rel = (abs) => relative(root, abs)

const runtimeFiles = walk(root).filter((abs) => {
  const r = rel(abs)
  if (isTest(abs)) return false
  if (r === 'scripts/next-16-3-8-security-upgrade-1-audit.mjs') return false
  if (r.startsWith('scripts/')) return false
  return r.startsWith('app/') || r.startsWith('components/') || r.startsWith('lib/') || r.startsWith('hooks/')
})

const hits = (pattern) => {
  const found = []
  for (const abs of runtimeFiles) {
    const text = readFileSync(abs, 'utf8')
    if (pattern.test(text)) found.push(rel(abs))
    pattern.lastIndex = 0
  }
  return found
}

const routeDirs = []
const walkDirs = (dir) => {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    if (skipDirs.has(name)) continue
    const abs = join(dir, name)
    let st
    try {
      st = statSync(abs)
    } catch {
      continue
    }
    if (!st.isDirectory()) continue
    if (dir.startsWith(join(root, 'app'))) routeDirs.push(rel(abs))
    walkDirs(abs)
  }
}
walkDirs(join(root, 'app'))

const pkg = JSON.parse(read('package.json'))
const config = read('next.config.js')
const vercel = existsSync(join(root, 'vercel.json')) ? read('vercel.json') : null

const imageImports = hits(/from\s+['"]next\/image['"]/)
const azureHostUses = hits(/oaidalleapiprodscus\.blob\.core\.windows\.net/)
const avatarPathUses = hits(/\/static\/avatars\//)
const supabasePublicObjectUses = hits(/\/storage\/v1\/object\/public\//)
const nextOg = hits(/from\s+['"]next\/og['"]/)
const imageResponse = hits(/\bImageResponse\b/)
const dynamicParams = hits(/\bdynamicParams\b/)
const generateStaticParams = hits(/\bgenerateStaticParams\b/)
const useCache = hits(/(^|\n)\s*['"]use cache['"]/)
const draftMode = hits(/\bdraftMode\s*\(/)
const metadataImageRoutes = runtimeFiles
  .map(rel)
  .filter((file) => /\/(opengraph-image|twitter-image)\.[cm]?[jt]sx?$/.test(file))

const catchAll = routeDirs.filter((dir) => /\[\[\.\.\..+\]\]|\[\.\.\..+\]/.test(dir))
const dynamicSegments = routeDirs.filter((dir) => /\[.+\]/.test(dir.split('/').pop() ?? ''))

const failures = []
if (pkg.dependencies?.next !== '16.3.8') failures.push(`next pin is ${pkg.dependencies?.next}, expected 16.3.8`)
if (pkg.devDependencies?.['eslint-config-next'] !== '16.3.8') {
  failures.push(`eslint-config-next pin is ${pkg.devDependencies?.['eslint-config-next']}, expected 16.3.8`)
}
if (pkg.dependencies?.react !== '19.2.8') failures.push('react pin drifted')
if (pkg.dependencies?.['react-dom'] !== '19.2.8') failures.push('react-dom pin drifted')
if (!config.includes("hostname: 'oaidalleapiprodscus.blob.core.windows.net'")) {
  failures.push('Azure image host missing')
}
if (!config.includes("pathname: '/**'")) failures.push('Azure pathname missing')
if (!config.includes('hostname: supabaseHost')) failures.push('Supabase image host binding missing')
if (!config.includes("pathname: '/storage/v1/object/public/**'")) {
  failures.push('Supabase image pathname missing')
}
if (!config.includes("hostname: 'jetnity.ai'")) failures.push('jetnity.ai image host missing')
if (!config.includes("pathname: '/static/avatars/**'")) failures.push('avatar pathname missing')
if (/hostname:\s*['"]\*/.test(config)) failures.push('wildcard image hostname is forbidden')
if (config.includes('cacheComponents')) failures.push('cacheComponents must stay unset')
if (config.includes('useCache')) failures.push('experimental.useCache must stay unset')
if (/output:\s*['"]standalone['"]/.test(config)) failures.push('standalone output is not the Vercel deployment')
if (existsSync(join(root, 'pages'))) failures.push('pages router directory exists')
if (nextOg.length || imageResponse.length) failures.push('next/og or ImageResponse runtime path exists')
if (metadataImageRoutes.length) failures.push('metadata image route exists')
if (catchAll.length) failures.push(`catch-all route exists: ${catchAll.join(', ')}`)
if (!vercel || !vercel.includes('"version": 2')) failures.push('vercel.json version 2 missing')

const report = {
  slice: 'next-16-3-8-security-upgrade-1',
  pins: {
    next: pkg.dependencies?.next ?? null,
    eslintConfigNext: pkg.devDependencies?.['eslint-config-next'] ?? null,
    react: pkg.dependencies?.react ?? null,
    reactDom: pkg.dependencies?.['react-dom'] ?? null,
  },
  deployment: {
    vercelJson: vercel !== null,
    pagesRouter: existsSync(join(root, 'pages')),
    outputStandalone: /output:\s*['"]standalone['"]/.test(config),
    cacheComponents: config.includes('cacheComponents'),
    experimentalUseCache: config.includes('useCache'),
  },
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      pathname: '/**',
      hostnameControl: 'fixed-literal',
      dnsAssumption: 'Microsoft Azure Blob DNS for the OpenAI DALL-E production account. Not an attacker-chosen host.',
      callSites: azureHostUses,
      runtimeImageUrlUsesHost: azureHostUses.length > 0,
      configChanged: false,
    },
    {
      protocol: 'https',
      hostname: 'build-time NEXT_PUBLIC_SUPABASE_URL hostname, fallback example.supabase.co',
      pathname: '/storage/v1/object/public/**',
      hostnameControl: 'fixed-at-build-from-public-env',
      dnsAssumption: 'Operator-controlled Supabase project host. Not request-controlled.',
      callSites: supabasePublicObjectUses,
      runtimeImageUrlUsesHost: supabasePublicObjectUses.length > 0,
      configChanged: false,
    },
    {
      protocol: 'https',
      hostname: 'jetnity.ai',
      pathname: '/static/avatars/**',
      hostnameControl: 'fixed-literal',
      dnsAssumption: 'First-party product domain. Not an attacker-chosen host.',
      callSites: avatarPathUses,
      runtimeImageUrlUsesHost: avatarPathUses.length > 0,
      configChanged: false,
    },
  ],
  inventory: {
    nextImageImports: imageImports,
    nextOgImports: nextOg,
    imageResponse: imageResponse,
    dynamicParams,
    generateStaticParams,
    useCacheDirectives: useCache,
    draftModeCalls: draftMode,
    metadataImageRoutes,
    catchAllRoutes: catchAll,
    dynamicSegments,
  },
  failures,
}

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
process.exit(failures.length === 0 ? 0 : 1)
