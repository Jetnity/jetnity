import assert from 'node:assert/strict'
import { fork } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { test } from 'node:test'
import { FIXED_REF, REF_PATH, SHA, githubFixture, reference } from './fixtures/github'
import type { BernGithubResponse } from './authorization'

for (const mode of ['race', 'already_consumed', 'committed_response_lost'] as const) {
  test('two independent processes / separate directories / shared mock: ' + mode, { timeout: 15000 }, async () => {
    const f = githubFixture()
    let consumed = mode === 'already_consumed', creations = 0, requests = 0
    const dirs = [mkdtempSync(join(tmpdir(), 'bern-r3-a-')), mkdtempSync(join(tmpdir(), 'bern-r3-b-'))]
    const barriers: (() => void)[] = []
    const children = dirs.map(cwd => fork(resolve('scripts/official-truth-bern-g3-rq-fetch-1/concurrency-worker.mjs'), [], {
      cwd, execArgv: ['--import', resolve('scripts/server-only-test-register.mjs'),
        '--import', resolve('node_modules/tsx/dist/loader.mjs')],
      env: { NODE_ENV: 'test', PATH: process.env.PATH, NODE_TEST_CONTEXT: 'child-v8' },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    }))
    try {
      const results = await Promise.all(children.map(child => new Promise<boolean>((done, reject) => {
        let finished = false, stderr = ''
        child.stderr?.on('data', value => { stderr += String(value) })
        child.once('error', reject)
        child.once('exit', code => { if (!finished || code !== 0) reject(Error('worker failed: ' + stderr)) })
        child.on('message', async (unknownMessage: unknown) => {
          const message = unknownMessage as { id: number; op: string; path: string; ref: string; sha: string; result: { ok: boolean } }
          const reply = (response: BernGithubResponse | null) => child.send({ id: message.id, response })
          try {
            if (message.op === 'finished') { finished = true; done(message.result.ok); return }
            if (message.op === 'read') {
              if (message.path !== REF_PATH) { reply(await f.read(message.path)); return }
              if (consumed) { reply({ status: 200, body: reference() }); return }
              // Both fresh processes must observe absent before either creates.
              barriers.push(() => reply({ status: 404, body: { message: 'Not Found' } }))
              if (barriers.length === 2) barriers.splice(0).forEach(release => release())
              return
            }
            if (message.op === 'create') {
              assert.equal(message.ref, FIXED_REF); assert.equal(message.sha, SHA)
              // One shared service serializes create; no per-worker file lock.
              if (consumed) { reply({ status: 422, body: {} }); return }
              consumed = true; creations++
              reply({ status: mode === 'committed_response_lost' ? 503 : 201, body: reference() }); return
            }
            if (message.op === 'transport') { requests++; reply(null); return }
            assert.fail('unknown worker operation')
          } catch (error) { reject(error) }
        })
      })))
      assert.equal(creations, mode === 'already_consumed' ? 0 : 1)
      assert.equal(requests, mode === 'race' ? 1 : 0)
      assert.equal(results.filter(Boolean).length, requests)
    } finally {
      children.forEach(child => child.kill())
      dirs.forEach(dir => rmSync(dir, { recursive: true, force: true }))
    }
  })
}
