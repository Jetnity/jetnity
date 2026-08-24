import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))

describe('Login/Register-Gate', () => {
  test('nutzt den vertrauenswürdigen User-Pfad', () => {
    const login = readFileSync(join(hier, '../../app/(public)/login/page.tsx'), 'utf8')
    const register = readFileSync(join(hier, '../../app/(public)/register/page.tsx'), 'utf8')
    assert.equal(login.includes('getUser()'), true)
    assert.equal(register.includes('getUser()'), true)
    assert.equal(login.includes('getSession()'), false)
    assert.equal(register.includes('getSession()'), false)
    assert.equal(login.includes('anmeldeSeiteZiel'), true)
    assert.equal(register.includes('anmeldeSeiteZiel'), true)
  })

  test('der Auth-Callback folgt derselben Allowlist', () => {
    const callback = readFileSync(join(hier, '../../app/auth/callback/CallbackClient.tsx'), 'utf8')
    assert.equal(callback.includes('erlaubtesNaechstesZiel'), true)
    assert.equal(callback.includes('AFTER_LOGIN_ROUTE'), false)
  })
})
