import { spawn } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const hostRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../apps/widgets-host')
const port = Number(process.env.WIDGETS_HOST_PORT || 41733)
const probe = 'JETNITY_S2_PROBE_7f3a'
const child = 'jetnity-widgets.vercel.app'

function request({ method, urlPath, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, method, path: urlPath, headers, timeout: 10000 }, (res) => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => resolve({
        status: res.statusCode,
        rawHeaders: res.rawHeaders,
        body: Buffer.concat(chunks).toString('utf8'),
      }))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

function values(rawHeaders, name) {
  const found = []
  for (let index = 0; index < rawHeaders.length; index += 2) {
    if (rawHeaders[index].toLowerCase() === name) found.push(rawHeaders[index + 1])
  }
  return found
}

function assertClosed(name, result) {
  const problems = []
  if (result.status !== 404) problems.push(`status ${result.status}`)
  if (result.body.includes(probe)) problems.push('probe reflected')
  if (/discovercars\.com|12go\.asia|trainbusferry|googletagmanager/i.test(result.body)) problems.push('vendor')
  const flat = result.rawHeaders.join('\n').toLowerCase()
  if (flat.includes('set-cookie')) problems.push('set-cookie')
  if (values(result.rawHeaders, 'location').length > 0) problems.push('redirect')
  if (values(result.rawHeaders, 'x-frame-options').join('') !== 'DENY') problems.push('xfo')
  const csp = values(result.rawHeaders, 'content-security-policy').join(' ')
  if (!csp.includes("frame-ancestors 'none'") || !csp.includes("default-src 'none'")) problems.push('csp')
  if (problems.length > 0) throw new Error(`${name}: ${problems.join('; ')}`)
}

function assertShell(name, result, { head = false } = {}) {
  const problems = []
  if (result.status !== 200) problems.push(`status ${result.status}`)
  if (!head && !result.body.includes('Kein Anbieter ist geladen.')) problems.push('status copy')
  if (!head && !result.body.includes('startProductionShell')) problems.push('bootstrap')
  if (/discovercars\.com|12go\.asia|trainbusferry|googletagmanager|<iframe/i.test(result.body)) problems.push('vendor')
  if (result.body.includes(probe)) problems.push('probe reflected')
  if (result.body.includes('"plans":{}') === false && !head) problems.push('plans not empty')
  const flat = result.rawHeaders.join('\n').toLowerCase()
  if (flat.includes('set-cookie')) problems.push('set-cookie')
  if (values(result.rawHeaders, 'x-frame-options').length > 0) problems.push('xfo present')
  if (values(result.rawHeaders, 'location').length > 0) problems.push('redirect')
  const csp = values(result.rawHeaders, 'content-security-policy').join(' ')
  if (!csp.includes('frame-ancestors https://jetnity.com')) problems.push('frame ancestors')
  if (!csp.includes("default-src 'none'")) problems.push('default-src')
  if (!/script-src 'nonce-[a-f0-9]+'/.test(csp)) problems.push('script nonce')
  if (csp.includes('unsafe-inline') || csp.includes('unsafe-eval') || csp.includes('*')) problems.push('csp relaxation')
  if (!head) {
    const nonce = csp.match(/nonce-([a-f0-9]+)/)[1]
    if (!result.body.includes(`nonce="${nonce}"`)) problems.push('nonce mismatch')
  }
  if (problems.length > 0) throw new Error(`${name}: ${problems.join('; ')} body=${result.body.slice(0, 180)}`)
}

const cases = [
  { name: 'root', method: 'GET', urlPath: '/', closed: true },
  { name: 'discovercars shell', method: 'GET', urlPath: '/embed/discovercars', headers: { host: child } },
  { name: 'twelvego shell', method: 'GET', urlPath: '/embed/twelvego', headers: { host: child } },
  { name: 'consent query', method: 'GET', urlPath: `/embed/discovercars?consent=1&q=${probe}`, headers: { host: child }, closed: true },
  { name: 'branded host', method: 'GET', urlPath: '/embed/discovercars', headers: { host: 'widgets.jetnity.com' }, closed: true },
  { name: 'parent host', method: 'GET', urlPath: '/embed/discovercars', headers: { host: 'jetnity.com' }, closed: true },
  { name: 'evil host', method: 'GET', urlPath: '/embed/discovercars', headers: { host: 'evil.example', cookie: `probe=${probe}`, authorization: `Bearer ${probe}` }, closed: true },
  { name: 'port', method: 'GET', urlPath: '/embed/twelvego', headers: { host: `${child}:444` }, closed: true },
  { name: 'post', method: 'POST', urlPath: '/embed/discovercars', headers: { host: child, cookie: `probe=${probe}` }, body: `{"consent":true,"probe":"${probe}"}`, closed: true },
  { name: 'options', method: 'OPTIONS', urlPath: '/embed/discovercars', headers: { host: child, origin: 'https://jetnity.com' }, closed: true },
  { name: 'put', method: 'PUT', urlPath: '/embed/twelvego', headers: { host: child }, closed: true },
  { name: 'unknown', method: 'GET', urlPath: '/embed/other', headers: { host: child }, closed: true },
  { name: 'trailing', method: 'GET', urlPath: '/embed/discovercars/', headers: { host: child }, closed: true },
  { name: 'next static', method: 'GET', urlPath: '/_next/static/chunks/probe.js', headers: { host: child }, closed: true },
  { name: 'not found artifact', method: 'GET', urlPath: '/_not-found', headers: { host: child }, closed: true },
  { name: 'head shell', method: 'HEAD', urlPath: '/embed/discovercars', headers: { host: child }, head: true },
]

const server = spawn(process.execPath, [path.join(hostRoot, 'node_modules/next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: hostRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { PATH: process.env.PATH, HOME: process.env.HOME || '/tmp', TMPDIR: process.env.TMPDIR || '/tmp', NODE_ENV: 'production' },
})
let logs = ''
server.stdout.on('data', (chunk) => { logs += chunk })
server.stderr.on('data', (chunk) => { logs += chunk })

async function waitReady() {
  const started = Date.now()
  while (Date.now() - started < 30000) {
    try {
      await request({ method: 'GET', urlPath: '/' })
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
  throw new Error(`server did not listen\n${logs}`)
}

try {
  await waitReady()
  for (const item of cases) {
    const result = await request(item)
    if (item.closed) assertClosed(item.name, result)
    else assertShell(item.name, result, { head: item.head === true })
    console.log(`PASS ${item.name} ${result.status}`)
  }
  console.log(`synthetic-http PASS cases=${cases.length}`)
} catch (error) {
  console.error(logs)
  console.error(error)
  process.exitCode = 1
} finally {
  server.kill('SIGTERM')
  await new Promise((resolve) => {
    server.on('exit', resolve)
    setTimeout(resolve, 2000)
  })
}
