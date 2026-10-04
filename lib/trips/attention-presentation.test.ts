import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import TripWorkspaceJetztWichtig from '@/components/trips/TripWorkspaceJetztWichtig'
import type { AttentionAbleitung, AttentionPunkt } from '@/lib/trips/attention'
import { attentionGruppieren } from '@/lib/trips/attention-presentation'

function punkt(id: string, teil: Partial<AttentionPunkt> = {}): AttentionPunkt {
  return {
    id,
    signal: 'official.unavailable',
    schwere: 'hinweis',
    lage: 'unavailable',
    titel: 'Offizielle Einreisehinweise sind gerade nicht verfügbar',
    ebene: 'reise',
    aktion: { art: 'bereich', bereich: 'uebersicht' },
    ...teil,
  }
}

function flood(): AttentionPunkt[] {
  return Array.from({ length: 64 }, (_, index) => punkt(`opaque-member-${index}`))
}

function htmlAus(punkte: AttentionPunkt[], limit = 3, leerstand: AttentionAbleitung['leerstand'] = null) {
  return renderToStaticMarkup(createElement(TripWorkspaceJetztWichtig, {
    attention: {
      punkte,
      sichtbar: punkte.slice(0, limit),
      weitere: punkte.slice(limit),
      leerstand,
      orchestrierung: { safety: 'angebunden', seasonal: 'angebunden' },
    },
    onAktion: () => assert.fail('Rendering darf keine Aktion auslösen'),
  }))
}

describe('Attention-Präsentationsgruppen: exakte Äquivalenz', () => {
  test('leere Liste und Einzelpunkt bleiben ohne erfundene Mitglieder', () => {
    assert.deepEqual(attentionGruppieren([]), [])
    const einzeln = punkt('einzeln')
    assert.deepEqual(attentionGruppieren([einzeln]), [{ punkt: einzeln, mitglieder: [einzeln], anzahl: 1 }])
  })

  const unterschiede: [string, Partial<AttentionPunkt>][] = [
    ['signal', { signal: 'safety.unavailable' }],
    ['schwere', { schwere: 'bald' }],
    ['lage', { lage: 'unknown' }],
    ['titel', { titel: 'Offizielle Einreisehinweise sind unklar' }],
    ['ebene', { ebene: 'person' }],
    ['Aktionsziel', { aktion: { art: 'bereich', bereich: 'fluege' } }],
    ['Aktion gegenüber null', { aktion: null }],
    ['Titel-Whitespace', { titel: 'Offizielle Einreisehinweise sind gerade nicht verfügbar ' }],
  ]
  for (const [feld, teil] of unterschiede) {
    test(`abweichendes ${feld} bleibt separat`, () => {
      const punkte = [punkt('gleich'), punkt('anders', teil), punkt('wieder-gleich')]
      const gruppen = attentionGruppieren(punkte)
      assert.equal(gruppen.length, 2)
      assert.deepEqual(gruppen.map((gruppe) => gruppe.anzahl), [2, 1])
      assert.deepEqual(gruppen.map((gruppe) => gruppe.mitglieder.map((mitglied) => mitglied.id)), [
        ['gleich', 'wieder-gleich'], ['anders'],
      ])
    })
  }

  test('gleiche Aktionswerte gruppieren unabhängig von Objektidentität und Feldreihenfolge', () => {
    const erste = punkt('erste')
    const zweite = punkt('zweite', { aktion: { bereich: 'uebersicht', art: 'bereich' } })
    assert.notEqual(erste.aktion, zweite.aktion)
    assert.equal(attentionGruppieren([erste, zweite])[0]!.anzahl, 2)
    assert.equal(attentionGruppieren([punkt('a', { aktion: null }), punkt('b', { aktion: null })])[0]!.anzahl, 2)
  })

  test('opake IDs bestimmen weder Gruppenzugehörigkeit noch Reihenfolge', () => {
    const erste = punkt('ZZZ:CH:unbekannt')
    const zweite = punkt('AAA/DE/anderer-fall')
    const gruppen = attentionGruppieren([erste, zweite])
    assert.equal(gruppen.length, 1)
    assert.equal(gruppen[0]!.punkt, erste)
    assert.deepEqual(gruppen[0]!.mitglieder, [erste, zweite])
  })

  test('Feldgrenzen bleiben auch mit Trennzeichen in Titeln und Signalen eindeutig', () => {
    const gruppen = attentionGruppieren([
      punkt('a', { titel: 'Hinweis|reise' }),
      punkt('b', { titel: 'Hinweis', signal: 'official.unavailable|reise' }),
    ])
    assert.equal(gruppen.length, 2)
  })

  test('unterschiedliche geschützte Item-Datumsabweichungen bleiben getrennt', () => {
    const basis: Partial<AttentionPunkt> = { signal: 'item.date_mismatch', schwere: 'bald', lage: 'stale', ebene: 'item', aktion: null }
    const gruppen = attentionGruppieren([
      punkt('dom', { ...basis, titel: 'Dom: 12. Sept. 2026 weicht vom geplanten Tag 19. Sept. 2026 ab' }),
      punkt('museum', { ...basis, titel: 'Museum: 12. Sept. 2026 weicht vom geplanten Tag 19. Sept. 2026 ab' }),
      punkt('dom-anders', { ...basis, titel: 'Dom: 13. Sept. 2026 weicht vom geplanten Tag 19. Sept. 2026 ab' }),
    ])
    assert.deepEqual(gruppen.map((gruppe) => gruppe.anzahl), [1, 1, 1])
  })

  test('Coverage-Gap bleibt von Official unavailable getrennt', () => {
    const gruppen = attentionGruppieren([
      punkt('gap', { signal: 'coverage.fluege', lage: 'known_gap', titel: 'Flugstrecke noch offen', aktion: { art: 'bereich', bereich: 'fluege' } }),
      ...flood(),
    ])
    assert.deepEqual(gruppen.map((gruppe) => gruppe.anzahl), [1, 64])
  })
})

describe('Attention-Präsentationsgruppen: Reihenfolge und Unveränderlichkeit', () => {
  test('frühestes Mitglied bestimmt die Gruppenposition auch bei nicht benachbarten Duplikaten', () => {
    const erste = punkt('erste', { signal: 'safety.critical_warning', schwere: 'blockierend', lage: 'warning' })
    const zweite = punkt('zweite', { lage: 'stale', schwere: 'bald' })
    const dritte = punkt('dritte')
    const punkte = [erste, zweite, { ...erste, id: 'erstes-duplikat' }, dritte, { ...zweite, id: 'zweites-duplikat' }]
    const gruppen = attentionGruppieren(punkte)
    assert.deepEqual(gruppen.map((gruppe) => gruppe.punkt), [erste, zweite, dritte])
    assert.deepEqual(gruppen.map((gruppe) => gruppe.anzahl), [2, 2, 1])
  })

  test('Gruppengröße sortiert nicht um; gefrorene Eingaben und sämtliche IDs bleiben erhalten', () => {
    const punkte = [punkt('blocker', { schwere: 'blockierend', lage: 'warning' }), ...flood()]
    const vorher = structuredClone(punkte)
    for (const eintrag of punkte) {
      if (eintrag.aktion) Object.freeze(eintrag.aktion)
      Object.freeze(eintrag)
    }
    Object.freeze(punkte)
    const gruppen = attentionGruppieren(punkte)
    assert.deepEqual(gruppen.map((gruppe) => gruppe.anzahl), [1, 64])
    assert.deepEqual(gruppen.flatMap((gruppe) => gruppe.mitglieder), vorher)
    assert.deepEqual(punkte, vorher)
    assert.equal(gruppen[1]!.punkt, punkte[1])
    // Jede Projektion besitzt ihre eigene Mitgliederliste.
    assert.notEqual(gruppen[1]!.mitglieder, attentionGruppieren(punkte)[1]!.mitglieder)
  })
})

describe('Jetzt wichtig: gerenderte Gruppen', () => {
  test('64 Einzelprüfungen rendern genau eine Zeile und einen exakten Count, ohne weitere Duplikate', () => {
    const html = htmlAus(flood(), 3, 'pruefung_nicht_verfuegbar')
    assert.equal((html.match(/<li[ >]/g) ?? []).length, 1)
    assert.equal((html.match(/Offizielle Einreisehinweise sind gerade nicht verfügbar/g) ?? []).length, 1)
    assert.match(html, /64 Einzelprüfungen betroffen/)
    assert.match(html, /Einzelne Prüfungen sind derzeit nicht verfügbar/)
    assert.doesNotMatch(html, /aria-expanded/)
    assert.doesNotMatch(html.replace(/<[^>]*>/g, ''), /opaque-member-/)
  })

  test('Default zeigt drei Gruppen statt der ersten drei Rohpunkte und zählt weitere Gruppen', () => {
    const punkte = [...flood(), punkt('b', { titel: 'Zweiter Hinweis' }), punkt('c', { titel: 'Dritter Hinweis' }), punkt('d', { titel: 'Vierter Hinweis' })]
    const html = htmlAus(punkte)
    assert.equal((html.match(/<li[ >]/g) ?? []).length, 3)
    assert.match(html, /Zweiter Hinweis/)
    assert.match(html, /Dritter Hinweis/)
    assert.doesNotMatch(html, /Vierter Hinweis/)
    assert.match(html, /1 weitere Hinweisgruppe anzeigen/)
    assert.match(html, /aria-expanded="false"/)
    assert.doesNotMatch(html, /64 weitere|64 weiteren/)
  })

  test('individuelles sichtbares Limit wird auf Gruppen angewendet', () => {
    const html = htmlAus([...flood(), punkt('b', { titel: 'Zweiter Hinweis' }), punkt('c', { titel: 'Dritter Hinweis' })], 1)
    assert.equal((html.match(/<li[ >]/g) ?? []).length, 1)
    assert.match(html, /2 weitere Hinweisgruppen anzeigen/)
  })

  test('Einzelpunkt behält Titel und Aktion ohne Gruppen-Count', () => {
    const html = htmlAus([punkt('einzeln')])
    assert.equal((html.match(/<button[ >]/g) ?? []).length, 1)
    assert.doesNotMatch(html, /Einzelprüfungen betroffen|Hinweisgruppe/)
    assert.match(html, /Offizielle Einreisehinweise sind gerade nicht verfügbar/)
  })

  test('leere kanonische Liste behält den bestehenden Leerstand', () => {
    const html = htmlAus([], 3, 'nichts_dringend_geprueft')
    assert.match(html, /Im Moment nichts Dringendes/)
    assert.doesNotMatch(html, /<li[ >]|<button[ >]/)
  })
})
