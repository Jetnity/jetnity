// Node preload used only by the real CLI-entry tests; every transport is synthetic.
import fs from 'node:fs'
import childProcess from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'

if (process.env.JETNITY_AUTH_OFFLINE_TEST !== '1' ||
    process.env.SUPABASE_ACCESS_TOKEN !== 'offline-auth-fixture') {
  throw new Error('This register is restricted to the isolated Auth CLI fixture.')
}
const fixture = JSON.parse(process.env.JETNITY_AUTH_OFFLINE_FIXTURE)
delete process.env.JETNITY_AUTH_OFFLINE_FIXTURE
const calls = { projectReads: 0, branchReads: 0, authReads: 0, subprocesses: 0, patches: 0, unexpected: 0 }
const originalRead = fs.readFileSync
fs.readFileSync = function (path, options) {
  if (String(path) === fixture.configPath) return fixture.rawConfig
  return originalRead.call(fs, path, options)
}
childProcess.execFileSync = function (command, args) {
  calls.subprocesses += 1
  if (command !== 'npx' ||
      JSON.stringify(args) !== JSON.stringify(['--yes', 'supabase@2.114.0', 'config', 'push', '--project-ref', fixture.ref, '--yes'])) {
    calls.unexpected += 1
    throw new Error('Unexpected subprocess in offline Auth fixture.')
  }
  return 'Offline fixture: config push observed, no command executed.\n'
}
globalThis.fetch = async function (input, init) {
  const url = new URL(String(input))
  const method = init?.method ?? 'GET'
  if (url.origin !== 'https://api.supabase.com') {
    calls.unexpected += 1
    throw new Error('Unexpected network origin in offline Auth fixture.')
  }
  const project = '/v1/projects/' + fixture.ref
  const branch = '/v1/branches/' + fixture.ref
  if (method === 'GET' && url.pathname === project) {
    calls.projectReads += 1
    return new Response('{}', { status: fixture.projectStatus ?? 404 })
  }
  if (method === 'GET' && url.pathname === branch) {
    calls.branchReads += 1
    return new Response('{}', { status: fixture.branchStatus ?? 200 })
  }
  if (url.pathname === project + '/config/auth') {
    if (method === 'GET') {
      calls.authReads += 1
      return Response.json(fixture.live)
    }
    if (method === 'PATCH') {
      calls.patches += 1
      throw new Error('No PATCH is expected in this offline Auth fixture.')
    }
  }
  calls.unexpected += 1
  throw new Error('Unexpected request in offline Auth fixture.')
}
syncBuiltinESMExports()
process.on('exit', () => {
  process.stderr.write('__JETNITY_AUTH_OFFLINE_CALLS__' + JSON.stringify(calls) + '\n')
})

