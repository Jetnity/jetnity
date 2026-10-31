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
  if (result.body.includes(probe) || result.body.includes('startProductionShell')) problems.push('shell or probe')
  if (/discovercars\.com|12go\.asia|trainbusferry|googletagmanager/i.test(result.body)) problems.push('vendor')
  const flat = result.rawHeaders.join('\n').toLowerCase()
  if (flat.includes('set-cookie')) problems.push('set-cookie')
  if (values(result.rawHeaders, 'location').length > 0) problems.push('redirect')
  if (values(result.rawHeaders, 'x-frame-options').join('') !== 'DENY') problems.push('xfo')
  const csp = values(result.rawHeaders, 'content-security-policy').join(' ')
  if (!csp.includes("frame-ancestors 'none'") || !csp.includes("default-src 'none'")) problems.push('csp')
  if (problems.length > 0) throw new Error(`${name}: ${problems.join('; ')}`)
}

const cases = [
  { name: 'root', method: 'GET', urlPath: '/' },
  { name: 'loopback embed', method: 'GET', urlPath: '/embed/discovercars' },
  { name: 'spoofed host', method: 'GET', urlPath: '/embed/discovercars', headers: { host: child } },
  { name: 'spoofed twelvego', method: 'GET', urlPath: '/embed/twelvego', headers: { host: child } },
  { name: 'consent query', method: 'GET', urlPath: `/embed/discovercars?consent=1&q=${probe}`, headers: { host: child } },
  { name: 'branded host', method: 'GET', urlPath: '/embed/discovercars', headers: { host: 'widgets.jetnity.com' } },
  { name: 'parent host', method: 'GET', urlPath: '/embed/discovercars', headers: { host: 'jetnity.com' } },
  { name: 'evil host', method: 'GET', urlPath: '/embed/discovercars', headers: { host: 'evil.example', cookie: `probe=${probe}`, authorization: `Bearer ${probe}` } },
  { name: 'port', method: 'GET', urlPath: '/embed/twelvego', headers: { host: `${child}:444` } },
  { name: 'post', method: 'POST', urlPath: '/embed/discovercars', headers: { host: child }, body: '{}' },
  { name: 'options', method: 'OPTIONS', urlPath: '/embed/discovercars', headers: { host: child, origin: 'https://jetnity.com' } },
  { name: 'unknown', method: 'GET', urlPath: '/embed/other', headers: { host: child } },
  { name: 'next static', method: 'GET', urlPath: '/_next/static/chunks/probe.js', headers: { host: child } },
  { name: 'head', method: 'HEAD', urlPath: '/embed/discovercars', headers: { host: child } },
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
    assertClosed(item.name, result)
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
