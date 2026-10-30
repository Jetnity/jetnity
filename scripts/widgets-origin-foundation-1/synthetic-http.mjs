import { spawn } from 'node:child_process'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import contract from '../../apps/widgets-host/inert-contract.json' with { type: 'json' }

const hostRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../apps/widgets-host')
const port = Number(process.env.WIDGETS_HOST_PORT || 41731)
const probe = 'JETNITY_INERT_PROBE_7f3a'

function request({ method, urlPath, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        method,
        path: urlPath,
        headers,
        timeout: 10000,
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            rawHeaders: res.rawHeaders,
            body: Buffer.concat(chunks).toString('utf8'),
          })
        })
      },
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy(new Error(`timeout ${method} ${urlPath}`))
    })
    if (body) req.write(body)
    req.end()
  })
}

function headerValues(rawHeaders, name) {
  const values = []
  for (let i = 0; i < rawHeaders.length; i += 2) {
    if (rawHeaders[i].toLowerCase() === name.toLowerCase()) values.push(rawHeaders[i + 1])
  }
  return values
}

function assertCase(name, result, { head = false } = {}) {
  const problems = []
  if (result.status !== contract.status) problems.push(`status ${result.status}`)
  if (result.status >= 300 && result.status < 400) problems.push('redirect')
  if (!head && result.body !== contract.body) problems.push('body mismatch')
  if (head && result.body !== '' && result.body !== contract.body) problems.push('HEAD body')
  if (result.body.includes(probe)) problems.push('probe reflected in body')
  if (/<script|<iframe|<form|<button/i.test(result.body)) problems.push('active markup')
  if (/https?:\/\//i.test(result.body)) problems.push('URL in body')

  const flat = result.rawHeaders.map((part) => String(part).toLowerCase()).join('\n')
  if (flat.includes('set-cookie')) problems.push('set-cookie')
  if (flat.includes(probe.toLowerCase())) problems.push('probe reflected in headers')
  if (headerValues(result.rawHeaders, 'location').length > 0) problems.push('location')
  if (headerValues(result.rawHeaders, 'x-powered-by').length > 0) problems.push('x-powered-by')
  for (const key of ['access-control-allow-origin', 'access-control-allow-credentials']) {
    if (headerValues(result.rawHeaders, key).length > 0) problems.push(key)
  }

  for (const [key, value] of Object.entries(contract.headers)) {
    const got = headerValues(result.rawHeaders, key)
    if (got.length === 0) problems.push(`missing ${key}`)
    for (const item of got) {
      if (item !== value) problems.push(`${key} expected ${value} got ${item}`)
    }
  }

  const csp = headerValues(result.rawHeaders, 'content-security-policy').join(' ')
  for (const directive of [
    "default-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
  ]) {
    if (!csp.includes(directive)) problems.push(`CSP missing ${directive}`)
  }
  if (csp.includes('unsafe-inline') || csp.includes('https:') || csp.includes('*')) {
    problems.push('CSP is not closed')
  }
  const policy = headerValues(result.rawHeaders, 'permissions-policy').join(' ')
  if (policy.includes('*')) problems.push('permissions policy grants *')

  if (problems.length > 0) {
    throw new Error(`${name}: ${problems.join('; ')}\nstatus=${result.status}\nbody=${result.body.slice(0, 240)}`)
  }
}

const cases = [
  { name: 'root', method: 'GET', urlPath: '/' },
  { name: 'discovercars', method: 'GET', urlPath: '/embed/discovercars' },
  { name: 'twelvego', method: 'GET', urlPath: '/embed/twelvego' },
  { name: 'consent query', method: 'GET', urlPath: `/embed/discovercars?consent=1&load=1&q=${probe}` },
  { name: 'twelvego query', method: 'GET', urlPath: `/embed/twelvego?consent=1` },
  { name: 'unknown provider', method: 'GET', urlPath: '/embed/other' },
  { name: 'deep unknown', method: 'GET', urlPath: '/nope/widget' },
  { name: 'trailing slash', method: 'GET', urlPath: '/embed/discovercars/' },
  { name: 'framework not-found', method: 'GET', urlPath: '/_not-found' },
  { name: 'favicon', method: 'GET', urlPath: '/favicon.ico' },
  { name: 'robots', method: 'GET', urlPath: '/robots.txt' },
  { name: 'next static', method: 'GET', urlPath: '/_next/static/chunks/probe.js' },
  { name: 'next image', method: 'GET', urlPath: '/_next/image?url=/a.png&w=64&q=75' },
  { name: 'encoded markup', method: 'GET', urlPath: `/embed/%3Cscript%3E${probe}%3C/script%3E` },
  {
    name: 'post forged',
    method: 'POST',
    urlPath: `/embed/discovercars?consent=1&q=${probe}`,
    headers: {
      'content-type': 'application/json',
      cookie: `consent=1; probe=${probe}`,
      authorization: `Bearer ${probe}`,
      origin: 'https://jetnity.com',
      referer: 'https://jetnity.com/reisen',
      host: 'widgets.jetnity.com',
    },
    body: JSON.stringify({ consent: true, probe }),
  },
  {
    name: 'evil host',
    method: 'GET',
    urlPath: '/',
    headers: {
      host: 'evil.example',
      origin: 'https://evil.example',
      referer: 'https://evil.example/phish',
      cookie: `session=${probe}`,
    },
  },
  { name: 'put', method: 'PUT', urlPath: '/embed/twelvego' },
  { name: 'patch', method: 'PATCH', urlPath: '/embed/twelvego' },
  { name: 'delete', method: 'DELETE', urlPath: '/embed/discovercars' },
  {
    name: 'options',
    method: 'OPTIONS',
    urlPath: '/embed/discovercars',
    headers: {
      origin: 'https://jetnity.com',
      'access-control-request-method': 'POST',
    },
  },
  { name: 'head', method: 'HEAD', urlPath: '/embed/discovercars', head: true },
]

const nextBin = path.join(hostRoot, 'node_modules/next/dist/bin/next')
const child = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], {
  cwd: hostRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    PATH: process.env.PATH,
    HOME: process.env.HOME || '/tmp',
    TMPDIR: process.env.TMPDIR || '/tmp',
    NODE_ENV: 'production',
  },
})

let logs = ''
child.stdout.on('data', (chunk) => {
  logs += chunk.toString()
})
child.stderr.on('data', (chunk) => {
  logs += chunk.toString()
})

function stop() {
  if (!child.killed) child.kill('SIGTERM')
}

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
    assertCase(item.name, result, { head: item.head === true })
    console.log(`PASS ${item.name} ${item.method} ${item.urlPath} -> ${result.status}`)
  }
  console.log(`synthetic-http PASS cases=${cases.length} port=${port}`)
} catch (error) {
  console.error(logs)
  console.error(error)
  process.exitCode = 1
} finally {
  stop()
  await new Promise((resolve) => {
    child.on('exit', resolve)
    setTimeout(resolve, 2000)
  })
}
