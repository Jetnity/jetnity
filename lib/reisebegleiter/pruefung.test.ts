// lib/reisebegleiter/pruefung.test.ts
//
// Die zweite Schranke. Geprüft wird, dass sie in beide Richtungen wirkt:
// Ein erfundener Bezug und eine unbelegte Gewissheit fallen durch – eine
// ehrliche Auskunft über eine offene Lage nicht.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import type { BegleiterBezug } from '@/lib/reisebegleiter/nutzlast'
import { auskunftPruefen } from '@/lib/reisebegleiter/pruefung'
import type { Modellauskunft } from '@/lib/reisebegleiter/schema'

function bezug(teil: Partial<BegleiterBezug> = {}): BegleiterBezug {
  return {
    ref: 'O1',
    art: 'official',
    titel: 'Visum · Italien',
    lage: 'Noch nicht verlässlich bestimmbar',
    belegt: false,
    ...teil,
  }
}

const KONTEXT: BegleiterBezug[] = [
  bezug({ ref: 'E1', art: 'etappe', titel: 'Etappe 1 · Rom', lage: '2027-04-03 bis 2027-04-06', belegt: true }),
  bezug({ ref: 'O1' }),
]

function auskunft(teil: Partial<Modellauskunft> = {}): Modellauskunft {
  return {
    antwort: 'Der amtliche Prüfstand für diese Etappe ist offen.',
    unsicherheiten: ['Die offizielle Quelle ist nicht aktiv.'],
    naechsteSchritte: ['Reisedaten in der Reisevorbereitung ergänzen.'],
    bezuege: ['E1', 'O1'],
    ...teil,
  }
}

describe('Bezüge', () => {
  test('eine ehrliche Auskunft über eine offene Lage geht durch', () => {
    assert.deepEqual(auskunftPruefen(auskunft(), KONTEXT), { ok: true })
  })

  test('ein Bezug ohne Eintrag im Kontext fällt durch', () => {
    const befund = auskunftPruefen(auskunft({ bezuege: ['E1', 'O9'] }), KONTEXT)
    assert.equal(befund.ok, false)
    assert.equal(befund.ok === false && befund.art, 'unbekannter-bezug')
  })

  test('eine Auskunft ohne Bezüge ist zulässig', () => {
    assert.deepEqual(auskunftPruefen(auskunft({ bezuege: [] }), KONTEXT), { ok: true })
  })

  test('ein leerer Kontext lässt keinen einzigen Bezug zu', () => {
    const befund = auskunftPruefen(auskunft({ bezuege: ['E1'] }), [])
    assert.equal(befund.ok, false)
    assert.equal(befund.ok === false && befund.art, 'unbekannter-bezug')
  })
})

describe('Unbelegte Gewissheit über amtliche Anforderungen', () => {
  const unbelegt = [
    'Für diese Reise bist du visumfrei.',
    'Du brauchst kein Visum.',
    'Die Einreise ist ohne Visum möglich.',
    'Es sind keine Impfungen vorgeschrieben.',
    'Ein Transitvisum ist nicht erforderlich.',
    'Das ist garantiert ausreichend.',
    'Die Lage ist definitiv geklärt.',
    'Das ist amtlich bestätigt.',
    'Du kannst problemlos einreisen.',
  ]

  test('fällt durch, solange keine geprüfte amtliche Lage vorliegt', () => {
    for (const text of unbelegt) {
      const befund = auskunftPruefen(auskunft({ antwort: text }), KONTEXT)
      assert.equal(befund.ok, false, `durchgelassen: ${text}`)
      assert.equal(befund.ok === false && befund.art, 'unbelegte-gewissheit')
    }
  })

  test('fällt auch in Unsicherheiten und Schritten durch', () => {
    assert.equal(auskunftPruefen(auskunft({ unsicherheiten: ['visumfrei'] }), KONTEXT).ok, false)
    assert.equal(
      auskunftPruefen(auskunft({ naechsteSchritte: ['Nichts zu tun, kein Visum nötig'] }), KONTEXT)
        .ok,
      false,
    )
  })

  test('ist zulässig, sobald der Kontext eine belegte amtliche Lage trägt', () => {
    const belegt = [
      KONTEXT[0],
      bezug({ ref: 'O1', lage: 'Nicht erforderlich · Offizielle Anforderungen wurden geprüft', belegt: true }),
    ]
    assert.deepEqual(
      auskunftPruefen(auskunft({ antwort: 'Für diese Route ist kein Visum erforderlich.' }), belegt),
      { ok: true },
    )
  })

  test('greift nicht, wenn eine andere Wahrheitsklasse belegt ist', () => {
    // `belegt` an einer Etappe ist Reisegraph-Wahrheit und sagt nichts über
    // amtliche Anforderungen. Nur ein belegter Official-Bezug öffnet den Weg.
    const nurEtappeBelegt = [KONTEXT[0], bezug({ ref: 'S1', art: 'safety', belegt: true })]
    assert.equal(
      auskunftPruefen(auskunft({ antwort: 'Du bist visumfrei.', bezuege: [] }), nurEtappeBelegt).ok,
      false,
    )
  })
})

describe('Ansprüche, die der Kontext nie decken kann', () => {
  test('eine Aussage über den Buchungszustand fällt immer durch', () => {
    for (const text of [
      'Dein Flug ist gebucht.',
      'Die Unterkunft ist noch nicht gebucht.',
      'Es liegt eine Buchungsbestätigung vor.',
    ]) {
      const befund = auskunftPruefen(auskunft({ antwort: text }), KONTEXT)
      assert.equal(befund.ok, false, `durchgelassen: ${text}`)
      assert.equal(befund.ok === false && befund.art, 'unbelegte-gewissheit')
    }
  })

  test('eine Aussage über den Buchungszustand fällt auch bei belegter amtlicher Lage durch', () => {
    const belegt = [bezug({ ref: 'O1', belegt: true })]
    assert.equal(
      auskunftPruefen(auskunft({ antwort: 'Dein Flug ist gebucht.', bezuege: [] }), belegt).ok,
      false,
    )
  })

  test('eine ausgeführte Änderung fällt durch', () => {
    for (const text of [
      'Ich habe die Etappe Rom hinzugefügt.',
      'Ich habe den Zeitraum um zwei Tage verschoben.',
      'Ich habe den Planpunkt entfernt.',
      'Die Änderung wurde gespeichert.',
      'Deine Reise ist bereits gespeichert.',
    ]) {
      const befund = auskunftPruefen(auskunft({ antwort: text }), KONTEXT)
      assert.equal(befund.ok, false, `durchgelassen: ${text}`)
    }
  })

  test('ein Vorschlag im Konjunktiv bleibt zulässig', () => {
    for (const text of [
      'Du könntest die Etappe Rom um zwei Tage verlängern.',
      'Über „Reise ändern" lässt sich der Zeitraum verschieben.',
      'Ergänze die Angaben, dann lässt sich der Prüfstand einordnen.',
    ]) {
      assert.deepEqual(
        auskunftPruefen(auskunft({ antwort: text, bezuege: [] }), KONTEXT),
        { ok: true },
        `Fehlalarm: ${text}`,
      )
    }
  })
})
