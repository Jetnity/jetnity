import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  abmelden,
  abschluss,
  alterFortschreiben,
  ankerAus,
  buchAusBericht,
  endpunktSetzen,
  erlaubnisSetzen,
  getBeginnen,
  getErfolg,
  kappeMeldung,
  knotenAus,
  laufGueltig,
  liesUhren,
  misserfolg,
  propsBeginnen,
  propsErfolg,
  propsMisserfolg,
  signaturVon,
  standAnfang,
  verweigerung,
  type Buch,
  type FrischeZustand,
  type Hinweis,
  type KartenAlter,
} from './operations-read-lifecycle'
import { SYSTEM_HEALTH_AUDIT_BERICHT } from './system-health/fixtures'

function karte(
  id: string,
  state: FrischeZustand,
  ageMs: number | null,
  ttlMs: number,
  checks: Array<{ id: string; state: FrischeZustand; ageMs: number | null; ttlMs: number }> = [],
  geprueftMs = 0,
): KartenAlter {
  return {
    id,
    geprueftMs,
    eltern: knotenAus(state, ageMs, ttlMs),
    anzeige: { state, ageMs, ttlMs },
    checks: checks.map((check) => ({
      id: check.id,
      knoten: knotenAus(check.state, check.ageMs, check.ttlMs),
      anzeige: { state: check.state, ageMs: check.ageMs, ttlMs: check.ttlMs },
    })),
  }
}

function schritt(
  buch: Buch,
  wand: unknown,
  mono: unknown,
  hinweise: Array<{ id: string; hinweis: Hinweis; checks: Hinweis[] }> | null = null,
): Buch {
  return alterFortschreiben({ anker: buch.anker, karten: buch.karten, wand, mono, hinweise })
}

function start(state: FrischeZustand, ageMs: number | null, ttlMs: number, wand: number, mono: number, checkedAtMs: number): Buch {
  return {
    anker: ankerAus(wand, mono, new Date(checkedAtMs).toISOString()),
    karten: [karte('app', state, ageMs, ttlMs, [{ id: 'kind', state: 'fresh', ageMs: 0, ttlMs }], checkedAtMs)],
  }
}

describe('Operationsalter', () => {
  test('TTL-Grenze, älteres Kind und ein kleinerer Hinweis', () => {
    const anker = ankerAus(0, 0, new Date(0).toISOString())
    let buch: Buch = {
      anker,
      karten: [karte('app', 'fresh', 0, 60_000, [{ id: 'kind', state: 'stale', ageMs: 90_000, ttlMs: 60_000 }])],
    }
    const hinweis = [{ id: 'app', hinweis: { state: 'fresh' as const, ageMs: 0 }, checks: [{ state: 'fresh' as const, ageMs: 1_000 }] }]
    buch = schritt(buch, 59_999, 59_999, hinweis)
    assert.equal(buch.karten[0]?.anzeige.state, 'fresh')
    assert.equal(buch.karten[0]?.anzeige.ageMs, 59_999)
    assert.equal(buch.karten[0]?.checks[0]?.anzeige.state, 'stale')
    assert.ok((buch.karten[0]?.checks[0]?.anzeige.ageMs ?? 0) >= 90_000)

    buch = schritt(buch, 60_000, 60_000, hinweis)
    assert.equal(buch.karten[0]?.anzeige.state, 'fresh')
    assert.equal(buch.karten[0]?.anzeige.ageMs, 60_000)

    buch = schritt(buch, 60_001, 60_001, hinweis)
    assert.equal(buch.karten[0]?.anzeige.state, 'stale')
    assert.equal(buch.karten[0]?.anzeige.ageMs, 60_001)
    assert.equal(buch.karten[0]?.checks[0]?.anzeige.state, 'stale')
  })

  test('unknown und stale werden durch einen fresh-Hinweis nicht jünger', () => {
    const unbekannt = schritt(
      { anker: ankerAus(0, 0, new Date(0).toISOString()), karten: [karte('app', 'unknown', null, 60_000)] },
      10_000,
      10_000,
      [{ id: 'app', hinweis: { state: 'fresh', ageMs: 0 }, checks: [] }],
    )
    assert.equal(unbekannt.karten[0]?.anzeige.state, 'unknown')
    assert.equal(unbekannt.karten[0]?.anzeige.ageMs, null)

    const veraltet = schritt(
      { anker: ankerAus(0, 0, new Date(0).toISOString()), karten: [karte('app', 'stale', 1_000, 60_000)] },
      500,
      500,
      [{ id: 'app', hinweis: { state: 'fresh', ageMs: 0 }, checks: [] }],
    )
    assert.equal(veraltet.karten[0]?.anzeige.state, 'stale')
    assert.ok((veraltet.karten[0]?.anzeige.ageMs ?? 0) >= 1_000)
  })

  test('Rücklauf senkt weder den Boden noch stale auf fresh', () => {
    const checkedAt = 0
    const wand = 120_000
    let buch = start('fresh', 0, 60_000, wand, wand, checkedAt)
    buch = schritt(buch, wand, wand, [{ id: 'app', hinweis: { state: 'stale', ageMs: 120_000 }, checks: [{ state: 'stale', ageMs: 120_000 }] }])
    assert.equal(buch.karten[0]?.anzeige.state, 'stale')
    assert.ok((buch.karten[0]?.anzeige.ageMs ?? 0) >= 120_000)
    buch = schritt(buch, wand + 10_000, wand + 10_000, [{ id: 'app', hinweis: { state: 'fresh', ageMs: 10_000 }, checks: [{ state: 'fresh', ageMs: 10_000 }] }])
    assert.equal(buch.karten[0]?.anzeige.state, 'stale')
    assert.ok((buch.karten[0]?.anzeige.ageMs ?? 0) >= 120_000)
    assert.equal(buch.karten[0]?.checks[0]?.anzeige.state, 'stale')
  })

  test('unbrauchbare Annahmeanker rasten unknown ein und eine spätere Uhr stellt fresh nicht wieder her', () => {
    const geworfen = liesUhren(() => {
      throw new Error('uhr')
    }, () => Number.POSITIVE_INFINITY)
    assert.equal(geworfen.wand, undefined)
    assert.equal(geworfen.mono, Number.POSITIVE_INFINITY)
    for (const uhr of [undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
      let buch = start('fresh', 0, 60_000, 0, 0, 0)
      buch = { ...buch, anker: ankerAus(uhr, uhr, new Date(0).toISOString()) }
      buch = schritt(buch, uhr, uhr)
      assert.equal(buch.karten[0]?.anzeige.state, 'unknown')
      buch = schritt(buch, 120_000, 120_000)
      assert.notEqual(buch.karten[0]?.anzeige.state, 'fresh')
      assert.equal(buch.karten[0]?.checks[0]?.anzeige.state, 'unknown')
    }
  })

  test('nach einem guten Tick rasten zwei unbrauchbare Uhren unknown ein, auch wenn checkedAt in der Vergangenheit liegt', () => {
    const checkedAt = 90_000
    let buch = start('fresh', 0, 60_000, 100_000, 5_000, checkedAt)
    buch = schritt(buch, 100_000, 5_000)
    assert.equal(buch.karten[0]?.anzeige.state, 'fresh')
    buch = schritt(buch, 101_000, 6_000)
    assert.equal(buch.karten[0]?.anzeige.state, 'fresh')
    buch = schritt(buch, 99_500, 4_000)
    assert.equal(buch.karten[0]?.anzeige.state, 'unknown')
    assert.notEqual(buch.karten[0]?.checks[0]?.anzeige.state, 'fresh')
    assert.ok(99_500 > checkedAt)
    buch = schritt(buch, 130_000, 40_000)
    assert.equal(buch.karten[0]?.anzeige.state, 'unknown')
    assert.notEqual(buch.karten[0]?.checks[0]?.anzeige.state, 'fresh')
  })

  test('ein unbrauchbarer Annahmeanker, auch nur einer, rastet unknown ein', () => {
    for (const paar of [
      { wand: 1_000, mono: Number.NaN },
      { wand: Number.NaN, mono: 1_000 },
      { wand: undefined, mono: 1_000 },
      { wand: 1_000, mono: undefined },
    ]) {
      let buch: Buch = {
        anker: ankerAus(paar.wand, paar.mono, new Date(0).toISOString()),
        karten: [karte('app', 'fresh', 0, 60_000, [{ id: 'kind', state: 'fresh', ageMs: 0, ttlMs: 60_000 }])],
      }
      assert.ok(buch.anker.wand === null || buch.anker.mono === null)
      buch = schritt(buch, 1_000, 1_000, [{ id: 'app', hinweis: { state: 'fresh', ageMs: 0 }, checks: [{ state: 'fresh', ageMs: 0 }] }])
      assert.equal(buch.karten[0]?.anzeige.state, 'unknown')
      assert.equal(buch.karten[0]?.checks[0]?.anzeige.state, 'unknown')
      buch = schritt(buch, 80_000, 80_000, [{ id: 'app', hinweis: { state: 'fresh', ageMs: 0 }, checks: [{ state: 'fresh', ageMs: 0 }] }])
      assert.equal(buch.karten[0]?.anzeige.state, 'unknown')
      assert.notEqual(buch.karten[0]?.checks[0]?.anzeige.state, 'fresh')
    }
  })

  test('eine zukünftige Kartenzeit hält nur diese Karte und ihre frischen Checks unknown', () => {
    let buch: Buch = {
      anker: ankerAus(1_000, 1_000, new Date(1_000).toISOString()),
      karten: [
        karte('app', 'fresh', 0, 60_000, [{ id: 'kind', state: 'fresh', ageMs: 0, ttlMs: 60_000 }], 50_000),
        karte('vercel', 'fresh', 0, 120_000, [], 1_000),
        karte('alt', 'stale', 10_000, 60_000, [{ id: 's', state: 'stale', ageMs: 10_000, ttlMs: 60_000 }], 50_000),
      ],
    }
    const hinweis = [{ id: 'app', hinweis: { state: 'fresh' as const, ageMs: 0 }, checks: [{ state: 'fresh' as const, ageMs: 0 }] }]
    buch = schritt(buch, 1_000, 1_000, hinweis)
    assert.equal(buch.karten[0]?.anzeige.state, 'unknown')
    assert.equal(buch.karten[0]?.checks[0]?.anzeige.state, 'unknown')
    assert.equal(buch.karten[1]?.anzeige.state, 'fresh')
    assert.equal(buch.karten[2]?.anzeige.state, 'stale')
    assert.equal(buch.karten[2]?.checks[0]?.anzeige.state, 'stale')
    buch = schritt(buch, 80_000, 80_000, hinweis)
    assert.equal(buch.karten[0]?.anzeige.state, 'unknown')
    assert.notEqual(buch.karten[0]?.checks[0]?.anzeige.state, 'fresh')
    assert.equal(buch.karten[1]?.anzeige.state, 'fresh')
  })

  test('ein zukünftiger Elternzeitpunkt hält Eltern und Checks nicht grün, auch nachdem die Wandzeit ihn überholt', () => {
    let buch = start('fresh', 0, 60_000, 100_000, 1_000, 200_000)
    buch = schritt(buch, 100_000, 1_000, [{ id: 'app', hinweis: { state: 'fresh', ageMs: 0 }, checks: [{ state: 'fresh', ageMs: 0 }] }])
    assert.equal(buch.karten[0]?.anzeige.state, 'unknown')
    assert.equal(buch.karten[0]?.checks[0]?.anzeige.state, 'unknown')
    buch = schritt(buch, 250_000, 151_000, [{ id: 'app', hinweis: { state: 'fresh', ageMs: 0 }, checks: [{ state: 'fresh', ageMs: 0 }] }])
    assert.equal(buch.karten[0]?.anzeige.state, 'unknown')
    assert.equal(buch.karten[0]?.checks[0]?.anzeige.state, 'unknown')
  })

  test('ein Sprung nach vorn hebt den Boden und löst keinen Abruf aus', () => {
    let buch = start('fresh', 0, 60_000, 0, 0, 0)
    buch = schritt(buch, 0, 0)
    buch = schritt(buch, 120_000, 120_000)
    assert.equal(buch.karten[0]?.anzeige.state, 'stale')
    assert.ok((buch.karten[0]?.anzeige.ageMs ?? 0) >= 120_000)
    assert.equal('fetch' in buch, false)
  })
})

describe('Operationsbesitz', () => {
  test('dieselbe Signatur, andere Props und ein Verriegeln ändern den Bericht nicht', () => {
    const erster = SYSTEM_HEALTH_AUDIT_BERICHT
    const signatur = signaturVon(erster)
    assert.equal(signatur, signaturVon(JSON.parse(JSON.stringify(erster))))
    let stand = standAnfang<typeof erster>(1, '/api/admin/system-health', true)
    const props = propsBeginnen(stand)
    if (!props.lauf) throw new Error('Props-Lauf fehlt')
    stand = propsErfolg(props.stand, props.lauf, erster, signatur)
    const boden = 120_000
    const wieder = propsBeginnen(stand)
    if (!wieder.lauf) throw new Error('Lauf fehlt')
    const gleich = propsErfolg(wieder.stand, wieder.lauf, erster, signatur)
    assert.equal(gleich.bericht, erster)
    assert.equal(gleich.phase, 'aktuell')
    const aelter = structuredClone(erster)
    aelter.items[0]!.summary = 'älter'
    const andere = propsBeginnen(stand)
    if (!andere.lauf) throw new Error('Lauf fehlt')
    const ersetzt = propsErfolg(andere.stand, andere.lauf, aelter, signaturVon(aelter))
    assert.equal(ersetzt.bericht, erster)
    assert.notEqual(ersetzt.bericht, aelter)
    const ungueltig = propsBeginnen(stand)
    if (!ungueltig.lauf) throw new Error('Lauf fehlt')
    const fehler = propsMisserfolg(ungueltig.stand, ungueltig.lauf, 'Die Antwort des Servers war nicht lesbar.')
    assert.equal(fehler.bericht, erster)
    assert.equal(fehler.phase, 'aktuell')
    const lauf = getBeginnen(stand)
    const zu = verweigerung(lauf.stand, lauf.lauf!, 'Für diese Ansicht fehlt die Berechtigung.')
    assert.equal(zu.latch, true)
    assert.equal(zu.bericht, null)
    const replay = propsBeginnen(zu)
    if (!replay.lauf) throw new Error('Replay-Lauf fehlt')
    const bleibt = propsErfolg(replay.stand, replay.lauf, aelter, signaturVon(aelter))
    assert.equal(bleibt.latch, true)
    assert.equal(bleibt.bericht, null)
    assert.equal(boden, 120_000)
  })

  test('403 bleibt durch 503, Netz und ungültiges 200 verriegelt, bis ein erlaubtes GET ihn löst', () => {
    let stand = standAnfang<{ id: string }>(1, '/a', true)
    const erst = getBeginnen(stand)
    stand = getErfolg(erst.stand, erst.lauf!, { id: 'alt' }, 'alt')
    const deny = getBeginnen(stand)
    stand = verweigerung(deny.stand, deny.lauf!, 'Für diese Ansicht fehlt die Berechtigung.')
    for (const meldung of ['Dienst nicht bereit.', 'Der Server ist nicht erreichbar.', 'Die Antwort des Servers war nicht lesbar.']) {
      const lauf = getBeginnen(stand)
      stand = misserfolg(lauf.stand, lauf.lauf!, meldung)
      assert.equal(stand.latch, true)
      assert.equal(stand.bericht, null)
      assert.equal(stand.phase, 'verweigert')
      assert.match(stand.meldung ?? '', /Berechtigung/)
    }
    const gesperrt = erlaubnisSetzen(stand, false)
    assert.equal(getBeginnen(gesperrt).lauf, null)
    const erlaubt = erlaubnisSetzen(gesperrt, true)
    assert.equal(erlaubt.latch, true)
    const heil = getBeginnen(erlaubt)
    stand = getErfolg(heil.stand, heil.lauf!, { id: 'neu' }, 'neu')
    assert.equal(stand.latch, false)
    assert.equal(stand.phase, 'aktuell')
    assert.equal(stand.bericht?.id, 'neu')
  })

  test('ein zweiter Beginn im selben Turn bleibt leer, und finally gibt die neuere Sperre nicht frei', () => {
    let stand = standAnfang<string>(1, '/a', true)
    const props = propsBeginnen(stand)
    stand = props.stand
    const erster = getBeginnen(stand)
    stand = erster.stand
    assert.equal(getBeginnen(stand).lauf, null)
    if (!props.lauf) throw new Error('Lauf fehlt')
    stand = abschluss(stand, props.lauf)
    assert.equal(stand.getGesperrt, true)
    assert.equal(propsMisserfolg(stand, props.lauf, 'spät').phase, 'prueft')
    stand = endpunktSetzen(stand, '/b')
    assert.equal(stand.getGesperrt, false)
    const zweiter = getBeginnen(stand)
    stand = zweiter.stand
    stand = abschluss(stand, erster.lauf!)
    assert.equal(stand.getGesperrt, true)
    assert.equal(laufGueltig(stand, erster.lauf!), false)
    assert.equal(getErfolg(stand, erster.lauf!, 'A', 'A').bericht, null)
    stand = getErfolg(stand, zweiter.lauf!, 'B', 'B')
    assert.equal(stand.bericht, 'B')
    const alt = getBeginnen(standAnfang<string>(1, '/a', true))
    const nachEnde = endpunktSetzen(alt.stand, '/b')
    const neu = getBeginnen(nachEnde)
    const angenommen = getErfolg(neu.stand, neu.lauf!, 'neu', 'neu')
    assert.equal(verweigerung(angenommen, alt.lauf!, 'Nicht angemeldet.').latch, false)
    assert.equal(verweigerung(angenommen, alt.lauf!, 'Nicht angemeldet.').bericht, 'neu')
    const verweigert = verweigerung(neu.stand, neu.lauf!, 'Nicht angemeldet.')
    assert.equal(getErfolg(verweigert, alt.lauf!, 'alt', 'alt').latch, true)
    assert.equal(getErfolg(verweigert, alt.lauf!, 'alt', 'alt').bericht, null)
  })

  test('Endpunktwechsel macht den Stand historisch, Unmount verwirft das Ergebnis, Meldungen sind gekappt', () => {
    let stand = standAnfang<string>(7, '/alt', true)
    const props = propsBeginnen(stand)
    if (!props.lauf) throw new Error('Props-Lauf fehlt')
    stand = propsErfolg(props.stand, props.lauf, 'bericht', 'sig')
    const lauf = getBeginnen(stand)
    stand = endpunktSetzen(lauf.stand, '/neu')
    assert.equal(stand.phase, 'historisch')
    assert.equal(stand.latch, false)
    assert.equal(getErfolg(stand, lauf.lauf!, 'spaet', 'spaet').bericht, 'bericht')
    const verweigert = verweigerung(getBeginnen(stand).stand, getBeginnen(stand).lauf!, 'Für diese Ansicht fehlt die Berechtigung.')
    const nachWechsel = endpunktSetzen(
      verweigerung(getBeginnen({ ...stand, getGesperrt: false }).stand, getBeginnen({ ...stand, getGesperrt: false }).lauf!, 'Für diese Ansicht fehlt die Berechtigung.'),
      '/anders',
    )
    assert.equal(nachWechsel.latch, true)
    assert.equal(nachWechsel.bericht, null)
    const montiert = getBeginnen(standAnfang<string>(7, '/alt', true))
    const weg = abmelden(montiert.stand)
    assert.equal(getErfolg(weg, montiert.lauf!, 'x', 'x').bericht, null)
    assert.equal(misserfolg(weg, montiert.lauf!, 'x').phase, 'prueft')
    assert.equal(kappeMeldung(`  ${'a'.repeat(800)}  `).length, 500)
    assert.equal(verweigert.phase === 'prueft' || verweigert.latch, true)
  })

  test('Endpunkt A nach B nach A nimmt den ersten Lauf nicht wieder an', () => {
    let stand = standAnfang<string>(1, '/a', true)
    const props = propsBeginnen(stand)
    if (!props.lauf) throw new Error('Lauf fehlt')
    stand = propsErfolg(props.stand, props.lauf, 'bericht', 'sig')
    const alt = getBeginnen(stand)
    stand = endpunktSetzen(alt.stand, '/b')
    assert.equal(stand.phase, 'historisch')
    assert.equal(laufGueltig(stand, alt.lauf!), false)
    stand = endpunktSetzen(stand, '/a')
    assert.equal(stand.endpunkt, '/a')
    assert.equal(laufGueltig(stand, alt.lauf!), false)
    assert.equal(getErfolg(stand, alt.lauf!, 'ALT', 'ALT').bericht, 'bericht')
    assert.equal(getErfolg(stand, alt.lauf!, 'ALT', 'ALT').phase, 'historisch')
    assert.equal(misserfolg(stand, alt.lauf!, 'Der Server ist nicht erreichbar.').phase, 'historisch')
    assert.equal(misserfolg(stand, alt.lauf!, 'Der Server ist nicht erreichbar.').meldung, null)
    const verweigert = verweigerung(stand, alt.lauf!, 'Für diese Ansicht fehlt die Berechtigung.')
    assert.equal(verweigert.latch, false)
    assert.equal(verweigert.bericht, 'bericht')
    assert.equal(abschluss(stand, alt.lauf!), stand)
    const neu = getBeginnen(stand)
    stand = neu.stand
    assert.equal(stand.getGesperrt, true)
    assert.equal(abschluss(stand, alt.lauf!).getGesperrt, true)
    assert.equal(getErfolg(stand, alt.lauf!, 'ALT', 'ALT').bericht, 'bericht')
    stand = getErfolg(stand, neu.lauf!, 'NEU', 'NEU')
    assert.equal(stand.bericht, 'NEU')
    assert.equal(stand.phase, 'aktuell')
    assert.equal(stand.getGesperrt, false)
  })

  test('Props während eines GET übernehmen weder Lauf noch Sperre', () => {
    let stand = standAnfang<string>(1, '/a', true)
    const erster = getBeginnen(stand)
    stand = erster.stand
    const nummer = stand.naechsteId
    const props = propsBeginnen(stand)
    assert.equal(props.lauf, null)
    assert.equal(props.stand.naechsteId, nummer)
    assert.equal(props.stand.getGesperrt, true)
    stand = getErfolg(props.stand, erster.lauf!, 'GET', 'GET')
    assert.equal(stand.bericht, 'GET')
    assert.equal(stand.getGesperrt, false)
    const danach = getBeginnen(stand)
    assert.notEqual(danach.lauf, null)
  })

  test('ein angenommener Bericht bekommt einen neuen Anker, Props danach nicht', () => {
    const bericht = structuredClone(SYSTEM_HEALTH_AUDIT_BERICHT)
    const buch = buchAusBericht(bericht, { wand: Date.parse('2026-10-25T00:00:00.000Z'), mono: 10 }, () =>
      bericht.items.map((item) => ({ id: item.id, state: 'fresh' as const, ageMs: 0, checks: [] })),
    )
    let stand = standAnfang<typeof bericht>(1, '/api/admin/system-health', true)
    const props = propsBeginnen(stand)
    if (!props.lauf) throw new Error('Props-Lauf fehlt')
    stand = propsErfolg(props.stand, props.lauf, bericht, signaturVon(bericht))
    const zweiter = propsBeginnen(stand)
    if (!zweiter.lauf) throw new Error('zweiter Props-Lauf fehlt')
    const nochmal = propsErfolg(zweiter.stand, zweiter.lauf, structuredClone(bericht), 'andere')
    assert.equal(nochmal.bericht, bericht)
    assert.equal(buch.karten.length, bericht.items.length)
  })
})
