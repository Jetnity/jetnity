import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import TripWorkspaceJetztWichtig from '@/components/trips/TripWorkspaceJetztWichtig'
import type { AttentionAbleitung, AttentionPunkt } from '@/lib/trips/attention'
import {
  attentionAusfuehrbar,
  attentionGruppieren,
  attentionNachAusfuehrbarkeit,
} from '@/lib/trips/attention-presentation'

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

function htmlAus(punkte: AttentionPunkt[], limit = 3, leerstand: AttentionAbleitung['leerstand'] = null, integriert = false) {
  return renderToStaticMarkup(createElement(TripWorkspaceJetztWichtig, {
    attention: {
      punkte,
      sichtbar: punkte.slice(0, limit),
      weitere: punkte.slice(limit),
      leerstand,
      orchestrierung: { safety: 'angebunden', seasonal: 'angebunden' },
    },
    onAktion: () => assert.fail('Rendering darf keine Aktion auslösen'),
    integriert,
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

describe('Als Nächstes: oben nur Ausführbares, der Rest unter «Gut zu wissen»', () => {
  const flugLuecke = punkt('coverage:fluege', { signal: 'coverage.fluege', lage: 'known_gap', titel: 'Flugstrecke noch offen', aktion: { art: 'bereich', bereich: 'fluege' } })
  const unterkunftUnklar = punkt('coverage:unterkunft', { signal: 'coverage.unterkunft', schwere: 'bald', lage: 'unknown', titel: 'Unterkunftsstand noch unklar', aktion: { art: 'bereich', bereich: 'unterkunft' } })
  const passFehlt = punkt('official:insufficient_context', { signal: 'official.insufficient_context', ebene: 'person', lage: 'insufficient_context', titel: 'Offizielle Prüfung noch nicht möglich', aktion: { art: 'bereich', bereich: 'uebersicht', preparationZiel: { bereich: 'reisende-dokumente' } } })
  const sicherheitWeg = punkt('safety:x:unavailable', { signal: 'safety.unavailable', titel: 'Sicherheitsprüfung derzeit nicht verfügbar', aktion: null })
  const reisezeitWeg = punkt('seasonal:x:unavailable', { signal: 'seasonal.unavailable', titel: 'Reisezeitprüfung derzeit nicht verfügbar', aktion: null })
  const einreiseWeg = punkt('official:unavailable:a')
  const sicherheitUnklar = punkt('safety:x:unknown', { signal: 'safety.unknown', lage: 'unknown', titel: 'Sicherheitslage ist unklar', aktion: null })
  const reisezeitUngeprueft = punkt('seasonal:ungeprueft', { signal: 'seasonal.ungeprueft', lage: 'ungeprueft', titel: 'Reisezeit noch nicht geprüft', aktion: null })
  const kritisch = punkt('safety:x:critical', { signal: 'safety.critical_warning', schwere: 'blockierend', lage: 'warning', titel: 'Sicherheitslage braucht Aufmerksamkeit', aktion: null })
  const fehler = punkt('safety:x:error', { signal: 'safety.error', schwere: 'bald', lage: 'error', titel: 'Sicherheitsprüfung ist fehlgeschlagen', aktion: null })
  const termin = punkt('item.date_mismatch:i', { signal: 'item.date_mismatch', schwere: 'bald', lage: 'stale', ebene: 'item', titel: 'Tour: 3. Juni 2027 weicht vom geplanten Tag 5. Juni 2027 ab', aktion: null })

  test('nicht verfügbare Prüfungen sind nie ausführbar, auch mit Sprungziel', () => {
    for (const eintrag of [sicherheitWeg, reisezeitWeg, einreiseWeg]) assert.equal(attentionAusfuehrbar(eintrag), false, eintrag.titel)
    for (const eintrag of [sicherheitUnklar, reisezeitUngeprueft]) assert.equal(attentionAusfuehrbar(eintrag), false, eintrag.titel)
    for (const eintrag of [flugLuecke, unterkunftUnklar, passFehlt]) assert.equal(attentionAusfuehrbar(eintrag), true, eintrag.titel)
  })

  test('Warnungen, Fehler und Terminabweichungen bleiben oben, auch ohne Sprungziel', () => {
    for (const eintrag of [kritisch, fehler, termin]) assert.equal(attentionAusfuehrbar(eintrag), true, eintrag.titel)
  })

  test('Aufteilung verliert keine Gruppe und behält die kanonische Reihenfolge', () => {
    const punkte = [kritisch, unterkunftUnklar, flugLuecke, passFehlt, sicherheitWeg, reisezeitWeg, einreiseWeg, { ...einreiseWeg, id: 'official:unavailable:b' }]
    const gruppen = attentionGruppieren(punkte)
    const { jetzt, gutZuWissen } = attentionNachAusfuehrbarkeit(gruppen)
    assert.deepEqual(jetzt.map((gruppe) => gruppe.punkt.id), [kritisch.id, unterkunftUnklar.id, flugLuecke.id, passFehlt.id])
    assert.deepEqual(gutZuWissen.map((gruppe) => gruppe.punkt.id), [sicherheitWeg.id, reisezeitWeg.id, einreiseWeg.id])
    assert.equal(gutZuWissen[2]!.anzahl, 2)
    assert.deepEqual([...jetzt, ...gutZuWissen].flatMap((gruppe) => gruppe.mitglieder).map((m) => m.id).sort(), punkte.map((p) => p.id).sort())
  })

  test('Erstbesucher-Fall: «derzeit nicht verfügbar» steht nicht mehr unter «Was deine Reise jetzt weiterbringt»', () => {
    const html = htmlAus([unterkunftUnklar, flugLuecke, passFehlt, sicherheitWeg, reisezeitWeg], 3, null, true)
    const [oben, unten] = html.split('data-attention-gut-zu-wissen')
    assert.ok(unten, 'Gut zu wissen fehlt')
    assert.match(oben!, /Was deine Reise jetzt weiterbringt/)
    for (const titel of ['Unterkunftsstand noch unklar', 'Flugstrecke noch offen', 'Offizielle Prüfung noch nicht möglich']) assert.match(oben!, new RegExp(titel))
    assert.doesNotMatch(oben!, /derzeit nicht verfügbar/)
    assert.match(unten, /Gut zu wissen/)
    assert.match(unten, /2 Hinweise<!-- --> ohne eigenen Schritt|2 Hinweise ohne eigenen Schritt/)
    assert.match(unten, /Sicherheitsprüfung derzeit nicht verfügbar[\s\S]*Reisezeitprüfung derzeit nicht verfügbar/)
    assert.match(html, /<details data-attention-gut-zu-wissen="true"/)
    assert.doesNotMatch(html, /<details[^>]*\bopen\b/)
    assert.doesNotMatch(html, /weitere Punkte anzeigen/)
  })

  test('das Limit zählt nur Ausführbares; Gut zu wissen verdrängt keinen Schritt', () => {
    const viele = [flugLuecke, unterkunftUnklar, passFehlt, kritisch, sicherheitWeg]
    const html = htmlAus(viele, 3, null, true)
    const [oben] = html.split('data-attention-gut-zu-wissen')
    assert.equal((oben!.match(/<li[ >]/g) ?? []).length, 3)
    assert.match(oben!, /1 weiterer Punkt anzeigen/)
  })

  test('nur Nicht-Ausführbares: ehrlicher Satz statt leerer Karte', () => {
    const html = htmlAus([sicherheitUnklar, reisezeitWeg], 3, null, true)
    assert.match(html, /Im Moment gibt es hier keinen Schritt, den du selbst erledigen kannst/)
    const mitLeerstand = htmlAus([sicherheitWeg, reisezeitWeg], 3, 'pruefung_nicht_verfuegbar', true)
    assert.match(mitLeerstand, /Einzelne Prüfungen sind derzeit nicht verfügbar/)
    assert.doesNotMatch(mitLeerstand, /keinen Schritt, den du selbst erledigen kannst/)
  })

  test('die Fassung «Jetzt wichtig» ausserhalb des Arbeitsbereichs bleibt unverändert', () => {
    const html = htmlAus([flugLuecke, sicherheitWeg], 3)
    assert.doesNotMatch(html, /Gut zu wissen/)
    assert.equal((html.match(/<li[ >]/g) ?? []).length, 2)
  })
})

describe('Preparation-Ziel gehört zur vollständigen Aktionsgleichheit', () => {
  const aktion = (bereich: 'reisende-dokumente' | 'offizielle-anforderungen', travellerClientRef?: string): NonNullable<AttentionPunkt['aktion']> => ({
    art: 'bereich', bereich: 'uebersicht', preparationZiel: { bereich, ...(travellerClientRef && { travellerClientRef }) },
  })

  test('gleiche Section und exakte Ref gruppieren trotz anderer Objektidentität/Property-Reihenfolge', () => {
    const erste = punkt('eins', { aktion: aktion('reisende-dokumente', 'opaque:/not-a-person-id') })
    const zweite = punkt('zwei', { aktion: {
      preparationZiel: { travellerClientRef: 'opaque:/not-a-person-id', bereich: 'reisende-dokumente' },
      bereich: 'uebersicht', art: 'bereich',
    } })
    assert.notEqual(erste.aktion?.preparationZiel, zweite.aktion?.preparationZiel)
    assert.deepEqual(attentionGruppieren([erste, zweite]), [{ punkt: erste, mitglieder: [erste, zweite], anzahl: 2 }])
  })

  for (const [name, anders] of [
    ['andere Section', aktion('offizielle-anforderungen', 'ref-1')],
    ['andere Traveller-Ref', aktion('reisende-dokumente', 'ref-2')],
    ['Section ohne Traveller-Ref', aktion('reisende-dokumente')],
    ['Target fehlt', { art: 'bereich', bereich: 'uebersicht' }],
    ['Target null', { art: 'bereich', bereich: 'uebersicht', preparationZiel: null }],
  ] as const) {
    test(`${name} bleibt separat und alle Mitglieder bleiben in ursprünglicher Priorität`, () => {
      const erste = punkt('eins', { aktion: aktion('reisende-dokumente', 'ref-1') })
      const zweite = punkt('zwei', { aktion: anders })
      const dritte = punkt('drei', { aktion: aktion('reisende-dokumente', 'ref-1') })
      const vorher = structuredClone([erste, zweite, dritte])
      const gruppen = attentionGruppieren([erste, zweite, dritte])
      assert.deepEqual(gruppen, [
        { punkt: erste, mitglieder: [erste, dritte], anzahl: 2 },
        { punkt: zweite, mitglieder: [zweite], anzahl: 1 },
      ])
      assert.deepEqual([erste, zweite, dritte], vorher)
    })
  }

  test('Coverage bleibt kompatibel; absent und null bedeuten beide kein Preparation-Ziel', () => {
    const erste = punkt('eins', { signal: 'coverage.fluege', aktion: { art: 'bereich', bereich: 'fluege' } })
    const zweite = punkt('zwei', { ...erste, id: 'zwei', aktion: { bereich: 'fluege', preparationZiel: null, art: 'bereich' } })
    assert.deepEqual(attentionGruppieren([erste, zweite]), [{ punkt: erste, mitglieder: [erste, zweite], anzahl: 2 }])
  })
})
