import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { aktiveV3GastreiseLesen, SCHLUESSEL } from '@/lib/trips/gastspeicher'

function speicher() {
  const ablage = new Map<string, string>()
  const schritte: string[] = []
  const vorher = globalThis.window
  Object.assign(globalThis, {
    window: {
      localStorage: {
        getItem: (key: string) => ablage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          schritte.push(`set:${key}`)
          ablage.set(key, value)
        },
        removeItem: (key: string) => {
          schritte.push(`remove:${key}`)
          ablage.delete(key)
        },
      },
    },
  })
  return {
    ablage,
    schritte,
    setzen(key: string, wert: string) {
      ablage.set(key, wert)
    },
    schliessen() {
      if (vorher === undefined) delete (globalThis as { window?: unknown }).window
      else globalThis.window = vorher
    },
  }
}

describe('active V3 guest readback', () => {
  test('reads only the expected active trip and never writes', () => {
    const fremd = beispielreise({ id: 'fremd-reise' })
    const eigene = beispielreise({ id: 'eigene-reise' })
    const platz = speicher()
    try {
      platz.setzen(SCHLUESSEL.legacy, '{"alt":true}')
      platz.setzen(SCHLUESSEL.warteschlange, '[]')
      assert.deepEqual(aktiveV3GastreiseLesen(eigene.id), { art: 'missing' })

      platz.setzen(SCHLUESSEL.aktiv, '{')
      assert.deepEqual(aktiveV3GastreiseLesen(eigene.id), { art: 'invalid', grund: 'json' })

      platz.setzen(SCHLUESSEL.aktiv, JSON.stringify({ title: 'halb' }))
      assert.deepEqual(aktiveV3GastreiseLesen(eigene.id), { art: 'invalid', grund: 'graph' })

      platz.setzen(SCHLUESSEL.aktiv, JSON.stringify(fremd))
      const falsch = aktiveV3GastreiseLesen(eigene.id)
      assert.deepEqual(falsch, { art: 'wrong_trip' })
      assert.equal('reise' in falsch, false)
      assert.equal(platz.ablage.get(SCHLUESSEL.aktiv), JSON.stringify(fremd))

      platz.setzen(SCHLUESSEL.aktiv, JSON.stringify(eigene))
      const treffer = aktiveV3GastreiseLesen(eigene.id)
      assert.equal(treffer.art, 'success')
      if (treffer.art === 'success') assert.equal(treffer.reise.id, eigene.id)

      platz.ablage.set(SCHLUESSEL.aktiv, JSON.stringify(eigene))
      const fenster = globalThis.window
      delete (globalThis as { window?: unknown }).window
      assert.deepEqual(aktiveV3GastreiseLesen(eigene.id), { art: 'unreadable' })
      globalThis.window = fenster
      const leseFehler = {
        getItem() {
          throw new Error('SecurityError')
        },
        setItem() {
          platz.schritte.push('set')
        },
        removeItem() {
          platz.schritte.push('remove')
        },
      }
      Object.assign(globalThis.window, { localStorage: leseFehler })
      assert.deepEqual(aktiveV3GastreiseLesen(eigene.id), { art: 'unreadable' })
      assert.deepEqual(platz.schritte, [])
      assert.equal(platz.ablage.get(SCHLUESSEL.legacy), '{"alt":true}')
      assert.equal(platz.ablage.get(SCHLUESSEL.warteschlange), '[]')
    } finally {
      platz.schliessen()
    }
  })
})
