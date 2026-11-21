import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const path = require.resolve('../../next.config.js')
const INC_BRANCH = 'fix/release1260-csp-ki-wetter-logout-cancel-dev-20261120'
const WIDGET = 'https://jetnity-flight-widget-ffohfpggj-jetnity-e1b93c82.vercel.app'

async function pageCsp(env: Record<string, string | undefined>) {
  const keys = ['VERCEL_ENV', 'VERCEL_GIT_COMMIT_REF', 'NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN'] as const
  const original = keys.map(key => process.env[key])
  try {
    for (const key of keys) {
      if (env[key] === undefined) delete process.env[key]
      else process.env[key] = env[key]
    }
    delete require.cache[path]
    const cfg = require(path) as {
      headers: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>
    }
    const entries = await cfg.headers()
    const page = entries.find(row => row.source === '/((?!api/|embed/).*)')
    const csp = page?.headers.find(row => row.key === 'Content-Security-Policy')?.value
    assert.ok(csp)
    return csp
  } finally {
    for (const [i, key] of keys.entries()) {
      if (original[i] === undefined) delete process.env[key]
      else process.env[key] = original[i]
    }
    delete require.cache[path]
  }
}

test('#1260 incident: two approved provider frames remain allowed with no wildcard in Production', async () => {
  const csp = await pageCsp({ VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'main',
    NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN: WIDGET })
  const frames = csp.split('; ').find(part => part.startsWith('frame-src ')) ?? ''
  assert.match(frames, /https:\/\/www\.stay22\.com(?:\s|$)/)
  assert.match(frames, /https:\/\/jetnity-flight-widget\.vercel\.app(?:\s|$)/)
  assert.ok(!frames.includes(WIDGET), 'Dev QA host may never enter Production CSP')
  assert.doesNotMatch(frames, /https:\/\/\*|https:\/\/\*\./)
})

test('#1260 incident: QA widget is available only on the exact isolated Dev branch and reviewed project host', async () => {
  const good = await pageCsp({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: INC_BRANCH,
    NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN: WIDGET })
  assert.match(good, new RegExp(WIDGET.replaceAll('.', '\\.').replaceAll('-', '\\-')))
  assert.match(good, /connect-src 'self'/)
  assert.match(good, /form-action 'self'/)
  const wrongBranch = await pageCsp({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feat/unrelated',
    NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN: WIDGET })
  assert.equal(wrongBranch.includes(WIDGET), false)
  const dangerous = await pageCsp({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: INC_BRANCH,
    NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN: 'https://evil.example' })
  assert.equal(dangerous.includes('https://evil.example'), false)
})
