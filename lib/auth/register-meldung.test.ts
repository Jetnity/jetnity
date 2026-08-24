import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  REGISTER_NEUTRALE_ANTWORT,
  registerNeutraleAntwort,
  registerOeffentlicheFehlercopy,
} from '@/lib/auth/register-meldung'

describe('Register-Public-Copy', () => {
  test('leakt Kontoexistenz nicht als eigenen Fehler', () => {
    assert.equal(registerOeffentlicheFehlercopy('User already registered'), null)
    assert.equal(registerOeffentlicheFehlercopy('This email has already been registered'), null)
    assert.equal(registerNeutraleAntwort(), REGISTER_NEUTRALE_ANTWORT)
    assert.equal(REGISTER_NEUTRALE_ANTWORT.includes('bereits'), false)
    assert.equal(REGISTER_NEUTRALE_ANTWORT.toLowerCase().includes('existiert'), false)
    assert.equal(REGISTER_NEUTRALE_ANTWORT.toLowerCase().includes('gesendet'), false)
  })

  test('lässt fachliche Feldfehler unterscheidbar', () => {
    assert.equal(registerOeffentlicheFehlercopy('invalid email'), 'invalid email')
  })
})
