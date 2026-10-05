import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { sucheAnfrageDarfSchreiben, sucheAnfrageStarten } from '@/lib/suche/anfrage'

describe('Suchanfrage-Generation', () => {
  test('ein abgebrochener älterer Lauf darf Loading und Treffer nicht schreiben', () => {
    const stand = { aktuell: 0 }
    const erste = sucheAnfrageStarten(stand)
    const zweite = sucheAnfrageStarten(stand)

    assert.equal(erste, 1)
    assert.equal(zweite, 2)
    assert.equal(sucheAnfrageDarfSchreiben(stand, erste, { aborted: true }), false)
    assert.equal(sucheAnfrageDarfSchreiben(stand, erste, { aborted: false }), false)
    assert.equal(sucheAnfrageDarfSchreiben(stand, zweite, { aborted: false }), true)
  })

  test('finally eines überholten Rapid-Typing-Requests bleibt wirkungslos', () => {
    const stand = { aktuell: 0 }
    const alt = sucheAnfrageStarten(stand)
    sucheAnfrageStarten(stand)

    const darfLoadingLoeschen = sucheAnfrageDarfSchreiben(stand, alt, { aborted: true })
    assert.equal(darfLoadingLoeschen, false)
    assert.equal(sucheAnfrageDarfSchreiben(stand, stand.aktuell), true)
  })
})
