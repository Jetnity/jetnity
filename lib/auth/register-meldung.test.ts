import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

import {
  REGISTER_ERFOLG_ID,
  REGISTER_NEUTRALE_ANTWORT,
  registerNeutraleAntwort,
  registerOeffentlicheFehlercopy,
  registerOeffentlicherErfolg,
  registerSignupOeffentlichAuswerten,
} from '@/lib/auth/register-meldung'

const hier = dirname(fileURLToPath(import.meta.url))

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

describe('Register-Public-Outcome AP2-B1', () => {
  test('Bestandskonto und neuer Signup ohne Session teilen denselben Success-State', () => {
    const bestand = registerSignupOeffentlichAuswerten({
      errorMessage: 'User already registered',
    })
    const neu = registerSignupOeffentlichAuswerten({
      errorMessage: null,
      sessionVorhanden: false,
    })
    assert.deepEqual(bestand, neu)
    assert.equal(bestand.art, 'neutraler-erfolg')
    if (bestand.art !== 'neutraler-erfolg' || neu.art !== 'neutraler-erfolg') return
    assert.deepEqual(bestand.stand, registerOeffentlicherErfolg())
    assert.equal(bestand.stand.infoMsg, REGISTER_NEUTRALE_ANTWORT)
    assert.equal(bestand.stand.success, true)
    assert.equal(bestand.stand.errorMsg, null)
    assert.equal(neu.stand.infoMsg, bestand.stand.infoMsg)
  })

  test('beide führen zum gleichen geleerten Feldzustand', () => {
    const bestand = registerSignupOeffentlichAuswerten({
      errorMessage: 'This email has already been registered',
    })
    const neu = registerSignupOeffentlichAuswerten({})
    assert.equal(bestand.art, 'neutraler-erfolg')
    assert.equal(neu.art, 'neutraler-erfolg')
    if (bestand.art !== 'neutraler-erfolg' || neu.art !== 'neutraler-erfolg') return
    assert.deepEqual(bestand.stand, neu.stand)
    assert.equal(bestand.stand.name, '')
    assert.equal(bestand.stand.email, '')
    assert.equal(bestand.stand.password, '')
    assert.equal(bestand.stand.password2, '')
    assert.deepEqual(bestand.stand.feldfehler, {})
    assert.equal(bestand.stand.loading, false)
  })

  test('kein unterschiedlicher Fokus- oder A11y-Zustand leakt die Variante', () => {
    const bestand = registerSignupOeffentlichAuswerten({
      errorMessage: 'user already exists',
    })
    const neu = registerSignupOeffentlichAuswerten({ sessionVorhanden: false })
    assert.deepEqual(bestand, neu)
    if (bestand.art !== 'neutraler-erfolg') return
    assert.equal(bestand.stand.fokus, REGISTER_ERFOLG_ID)
  })

  test('das Formular wendet denselben Erfolg für beide Varianten an', () => {
    const quelle = readFileSync(join(hier, '../../components/auth/RegisterForm.tsx'), 'utf8')
    assert.equal(quelle.includes('registerSignupOeffentlichAuswerten'), true)
    assert.equal(quelle.includes('registerOeffentlicherErfolg'), false)
    assert.equal(quelle.includes('REGISTER_ERFOLG_ID'), true)
    assert.equal(quelle.includes('feldInSichtNehmen(erfolgRef.current)'), true)
    assert.equal(quelle.includes('if (!success) return'), true)
    assert.equal(quelle.includes('registerOeffentlicheFehlercopy'), false)
    assert.equal(/setName\(''\)/.test(quelle), false)
    assert.equal(/setEmail\(''\)/.test(quelle), false)
  })
})
