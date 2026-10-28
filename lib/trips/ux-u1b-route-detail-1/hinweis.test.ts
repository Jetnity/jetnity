import assert from 'node:assert/strict'
import test from 'node:test'

import {
  hinweisAktualisieren,
  type GraphBlick,
  type Hinweis,
} from '@/lib/trips/ux-u1b-route-detail-1/hinweis'

const graph: GraphBlick = {
  tagExistiert: (id) => id === 'day-1' || id === 'day-2' || id === 'day-5',
  punkt: (id) => {
    if (id === 'stay-2') return { dayId: 'day-2' }
    if (id === 'note-ohne') return { dayId: null }
    if (id === 'moved') return { dayId: 'day-5' }
    return null
  },
}

const fehlt: Hinweis = { art: 'punkt-fehlt', id: 'weg', tagId: 'day-2' }

test('fehlender Punkt bei gültigem Tag bleibt nach dem Kanonisieren und einem Graph-Lauf', () => {
  const roh = { tag: 'day-2', punkt: 'weg' }
  const gesetzt = hinweisAktualisieren(null, { art: 'lesen', roh, graph, gespeichert: null })
  assert.deepEqual(gesetzt, fehlt)
  const gereinigt = { tag: 'day-2', punkt: null }
  const danach = hinweisAktualisieren(gesetzt, { art: 'lesen', roh: gereinigt, graph, gespeichert: gesetzt })
  assert.deepEqual(danach, fehlt)
  const nochmal = hinweisAktualisieren(danach, { art: 'lesen', roh: gereinigt, graph, gespeichert: null })
  assert.deepEqual(nochmal, fehlt)
})

test('Zurück auf einen anderen gültigen Tag löscht, Vorwärts in denselben Kontext stellt wieder her', () => {
  const zurueck = hinweisAktualisieren(fehlt, {
    art: 'lesen',
    roh: { tag: 'day-1', punkt: null },
    graph,
    gespeichert: null,
  })
  assert.equal(zurueck, null)
  const vor = hinweisAktualisieren(null, {
    art: 'lesen',
    roh: { tag: 'day-2', punkt: null },
    graph,
    gespeichert: fehlt,
  })
  assert.deepEqual(vor, fehlt)
})

test('eine andere gültige Auswahl und eine neue Reise löschen den Hinweis', () => {
  assert.equal(hinweisAktualisieren(fehlt, { art: 'explizit' }), null)
  assert.equal(hinweisAktualisieren(fehlt, { art: 'neueReise' }), null)
  const moved = hinweisAktualisieren(fehlt, {
    art: 'lesen',
    roh: { tag: 'day-5', punkt: 'moved' },
    graph,
    gespeichert: null,
  })
  assert.equal(moved, null)
})

test('ein fehlender Tag wird nicht durch Tag 1 ersetzt und überlebt die leere Adresse', () => {
  const hinweis = hinweisAktualisieren(null, {
    art: 'lesen',
    roh: { tag: 'day-weg', punkt: null },
    graph,
    gespeichert: null,
  })
  assert.deepEqual(hinweis, { art: 'tag-fehlt', id: 'day-weg' })
  const bleibt = hinweisAktualisieren(hinweis, {
    art: 'lesen',
    roh: { tag: null, punkt: null },
    graph,
    gespeichert: null,
  })
  assert.deepEqual(bleibt, hinweis)
  const anderer = hinweisAktualisieren(hinweis, {
    art: 'lesen',
    roh: { tag: 'day-1', punkt: null },
    graph,
    gespeichert: null,
  })
  assert.equal(anderer, null)
})
