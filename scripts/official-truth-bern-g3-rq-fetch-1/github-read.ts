import 'server-only'
import childProcess from 'node:child_process'
import https from 'node:https'
import { checkServerIdentity } from 'node:tls'
import type { BernGithubRead } from '../../lib/readiness/official-truth-bern-g3-rq-fetch-1/authorization'

const PREFIX = '/repos/Jetnity/jetnity'
const GH = process.platform === 'darwin' ? '/opt/homebrew/bin/gh' : '/usr/bin/gh'
const MAX_BYTES = 262144

function permitted(path: string): boolean {
  return path === '/user' || path === PREFIX || [
    '/git/ref/heads/main', '/pulls/935', '/rulesets?includes_parents=true&per_page=100',
  ].some(p => path === PREFIX + p)
    || /^\/repos\/Jetnity\/jetnity\/(?:issues\/comments\/[1-9][0-9]{0,15}|rulesets\/[1-9][0-9]{0,15}|collaborators\/[A-Za-z0-9][A-Za-z0-9-]{0,38}\/permission)$/.test(path)
}

/** Existing gh credential only; fixed executable and hostname, no shell/PATH
 * lookup, no credential creation. stdout is ONLY a candidate credential, never
 * approval evidence: GitHub itself must authenticate each fixed-host TLS GET.
 * Deliberately read-only. No create/update/delete-ref API exists in this client. */
export function createAuthenticatedBernGithubReader(): BernGithubRead {
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0' || process.env.NODE_EXTRA_CA_CERTS
    || process.env.SSL_CERT_FILE || process.env.SSL_CERT_DIR || process.env.NODE_OPTIONS) {
    throw new Error('github_unverifiable')
  }
  let token: string
  try {
    token = childProcess.execFileSync(GH, ['auth', 'token', '--hostname', 'github.com'], {
      encoding: 'utf8', timeout: 5000, maxBuffer: 1024, stdio: ['ignore', 'pipe', 'pipe'],
      env: { NODE_ENV: 'production', HOME: process.env.HOME, PATH: '/usr/bin:/bin', GH_PROMPT_DISABLED: '1',
        GH_HOST: 'github.com', GH_TOKEN: process.env.GH_TOKEN, GITHUB_TOKEN: process.env.GITHUB_TOKEN },
    }).trim()
    if (!/^[A-Za-z0-9_]{20,255}$/.test(token)) throw new Error('invalid')
  } catch { throw new Error('github_unverifiable') }

  return async path => {
    if (!permitted(path)) throw new Error('github_unverifiable')
    return new Promise((resolve, reject) => {
      let settled = false
      const deadline: { timer?: ReturnType<typeof setTimeout> } = {}
      const done = (body?: unknown, status?: number) => {
        if (settled) return
        settled = true
        clearTimeout(deadline.timer)
        if (status === undefined) reject(new Error('github_unverifiable'))
        else resolve({ status, body })
      }
      const req = https.request({
        hostname: 'api.github.com', port: 443, path, method: 'GET',
        servername: 'api.github.com', rejectUnauthorized: true, checkServerIdentity,
        agent: false,
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json',
          'Accept-Encoding': 'identity', 'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'jetnity-bern-r3-read-only-preflight' },
      }, res => {
        const status = res.statusCode
        // Redirects never get a second request, and no Location is inspected.
        if (status === undefined || status < 200 || status >= 300
          || !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(String(res.headers['content-type'] ?? ''))
          || (res.headers['content-encoding'] !== undefined && res.headers['content-encoding'] !== 'identity')) {
          done(); res.destroy(); return
        }
        const length = res.headers['content-length']
        if (length !== undefined && (!/^(0|[1-9][0-9]*)$/.test(length) || Number(length) > MAX_BYTES)) {
          done(); res.destroy(); return
        }
        const chunks: Uint8Array[] = []
        let size = 0
        res.on('data', (chunk: Buffer) => {
          size += chunk.byteLength
          if (size > MAX_BYTES) { done(); res.destroy(); return }
          chunks.push(chunk)
        })
        res.on('error', () => done())
        res.on('aborted', () => done())
        res.on('end', () => {
          if (!res.complete || size === 0 || (length !== undefined && Number(length) !== size)) { done(); return }
          try {
            const bytes = Buffer.concat(chunks)
            if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) { done(); return }
            const body: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
            done(body, status)
          } catch { done() }
        })
      })
      deadline.timer = setTimeout(() => { done(); req.destroy() }, 5000)
      req.on('error', () => done())
      req.end()
    })
  }
}
