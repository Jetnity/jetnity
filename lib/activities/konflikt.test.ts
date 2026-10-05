import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { ACTIVITY_ZEIT_HINWEIS } from '@/lib/activities/domain'
import { konfliktPruefen, type Zeitfenster } from '@/lib/activities/konflikt'
import { minutenAlsUhrzeit, minutenSeitMitternacht } from '@/lib/activities/zeit'

function fenster(start: string, ende: string, tag = '2026-09-12'): Zeitfenster {
  return {
    startsOn: tag,
    startsAt: start,
    endsOn: tag,
    endsAt: ende,
  }
}

describe('Aktivitäts-Konfliktlogik', () => {
  test('eindeutige Überschneidung am selben Tag wird erkannt', () => {
    const ergebnis = konfliktPruefen(fenster('10:00', '12:00'), [fenster('09:00', '11:00')], '2026-09-12')
    assert.equal(ergebnis.konflikt, 'ueberschneidung')
  })

  test('angrenzende Fenster ohne Überlappung sind frei', () => {
    const ergebnis = konfliktPruefen(fenster('11:00', '13:00'), [fenster('09:00', '11:00')], '2026-09-12')
    assert.equal(ergebnis.konflikt, 'frei')
  })

  test('fehlende Zeiten gelten nicht als konfliktfrei', () => {
    const ohneEnde = konfliktPruefen(
      { startsOn: '2026-09-12', startsAt: '10:00', endsOn: null, endsAt: null },
      [fenster('09:00', '11:00')],
      '2026-09-12',
    )
    assert.equal(ohneEnde.konflikt, 'unbekannt')

    const nachbarOhneZeit = konfliktPruefen(fenster('14:00', '16:00'), [
      { startsOn: '2026-09-12', startsAt: '09:00', endsOn: null, endsAt: null },
    ], '2026-09-12')
    assert.equal(nachbarOhneZeit.konflikt, 'unbekannt')
  })

  test('ohne Tagesdatum wird kein Konflikt behauptet', () => {
    const ergebnis = konfliktPruefen(fenster('10:00', '12:00'), [fenster('09:00', '11:00')], null)
    assert.equal(ergebnis.konflikt, 'unbekannt')
    assert.equal(ergebnis.grund, 'kein-tag')
  })

  test('mehrtägige Optionen werden in dieser Phase nicht beurteilt', () => {
    const ergebnis = konfliktPruefen(
      {
        startsOn: '2026-09-12',
        startsAt: '18:00',
        endsOn: '2026-09-13',
        endsAt: '10:00',
      },
      [],
      '2026-09-12',
    )
    assert.equal(ergebnis.konflikt, 'unbekannt')
    assert.equal(ergebnis.grund, 'mehrtägig')
  })

  test('Fenster über Mitternacht werden nicht als frei verkauft', () => {
    const ergebnis = konfliktPruefen(fenster('22:00', '02:00'), [], '2026-09-12')
    assert.equal(ergebnis.konflikt, 'unbekannt')
    assert.equal(ergebnis.grund, 'ueber-mitternacht')
  })

  test('ohne bestehende Punkte und mit vollständigem Fenster ist der Tag frei', () => {
    const ergebnis = konfliktPruefen(fenster('15:00', '16:30'), [], '2026-09-12')
    assert.equal(ergebnis.konflikt, 'frei')
  })

  test('lokale HH:MM werden ohne Zeitzone in Minuten gelesen', () => {
    assert.equal(minutenSeitMitternacht('09:30'), 570)
    assert.equal(minutenAlsUhrzeit(570), '09:30')
    assert.match(ACTIVITY_ZEIT_HINWEIS, /HH:MM/)
  })
})
