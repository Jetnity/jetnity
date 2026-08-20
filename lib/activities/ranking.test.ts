import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ACTIVITY_ABDECKUNGSHINWEIS,
  ACTIVITY_MARKEN,
  ACTIVITY_SUCHE_GRENZEN,
  type ActivityKandidat,
} from '@/lib/activities/domain'
import { ActivityProviderFehler } from '@/lib/activities/provider'
import { ACTIVITY_RANGLISTE_GEWICHTE, activityOptionenBewerten } from '@/lib/activities/ranking'

function option(
  werte: Partial<ActivityKandidat> & Pick<ActivityKandidat, 'id' | 'title'>,
): ActivityKandidat {
  return {
    id: werte.id,
    provider: werte.provider ?? 'provider-a',
    externalRef: werte.externalRef ?? werte.id,
    title: werte.title,
    description: werte.description ?? null,
    locationName: werte.locationName ?? 'Florenz',
    punkt: werte.punkt ?? { lat: 43.77, lon: 11.25 },
    dauerMinuten: werte.dauerMinuten ?? 90,
    timeslot: werte.timeslot ?? {
      startsOn: '2026-09-12',
      startsAt: '15:00',
      endsOn: '2026-09-12',
      endsAt: '16:30',
    },
    preis: werte.preis ?? 42,
    preisWaehrung: werte.preisWaehrung ?? 'CHF',
    bewertung: werte.bewertung ?? 8.6,
    bewertungenAnzahl: werte.bewertungenAnzahl ?? 800,
    stornierbar: werte.stornierbar ?? true,
    kategorien: werte.kategorien ?? ['culture'],
    tags: werte.tags ?? ['museum'],
    context: werte.context ?? {
      interessenFit: 1,
      zeitFit: 1,
      konflikt: 'frei',
      preisFit: 0.8,
      dauerFit: 1,
      lageFit: 0.9,
    },
  }
}

const PASSEND = option({
  id: 'passend',
  title: 'Uffizien',
  preis: 28,
  bewertung: 9.2,
  bewertungenAnzahl: 4200,
})

const BILLIG_KONFLIKT = option({
  id: 'billig-konflikt',
  title: 'Schnäppchen-Tour',
  preis: 12,
  bewertung: 7.1,
  stornierbar: false,
  context: {
    interessenFit: 0,
    zeitFit: 0,
    konflikt: 'ueberschneidung',
    preisFit: 1,
    dauerFit: 0.4,
    lageFit: 0.4,
  },
})

const TEUER_FLEXIBEL = option({
  id: 'teuer-flexibel',
  title: 'Private Führung',
  preis: 180,
  bewertung: 9.6,
  dauerMinuten: 180,
  stornierbar: true,
  context: {
    interessenFit: 1,
    zeitFit: 1,
    konflikt: 'frei',
    preisFit: 0.2,
    dauerFit: 0.55,
    lageFit: 0.8,
  },
})

describe('Aktivitäts-Foundation', () => {
  test('Grenzen, Marken und Coverage-Hinweis sind explizit', () => {
    assert.equal(ACTIVITY_SUCHE_GRENZEN.empfohleneOptionen, 5)
    assert.deepEqual(ACTIVITY_MARKEN, ['jetnity', 'best_value', 'best_rating', 'flexible', 'compact'])
    assert.match(ACTIVITY_ABDECKUNGSHINWEIS, /keine provisionsgetriebene Rangliste/i)
  })

  test('Providerfehler bleibt ein enger technischer Vertrag', () => {
    const fehler = new ActivityProviderFehler('timeout', 'Zeitüberschreitung')
    assert.equal(fehler.art, 'timeout')
    assert.equal(fehler.name, 'ActivityProviderFehler')
  })
})

describe('Aktivitätsranking', () => {
  test('die billigste Option ist nicht automatisch Jetnitys Empfehlung', () => {
    const bewertet = activityOptionenBewerten([BILLIG_KONFLIKT, TEUER_FLEXIBEL, PASSEND])
    const jetnity = bewertet.find((eintrag) => eintrag.labels.includes('jetnity'))
    assert.equal(jetnity?.id, 'passend')
    assert.notEqual(jetnity?.id, 'billig-konflikt')
  })

  test('Providername beeinflusst den Score nicht', () => {
    const a = activityOptionenBewerten([PASSEND])[0]!
    const b = activityOptionenBewerten([{ ...PASSEND, provider: 'anderer-provider' }])[0]!
    assert.equal(a.score, b.score)
  })

  test('dieselbe Menge liefert unabhängig von der Eingabereihenfolge dieselbe Rangfolge', () => {
    const eins = activityOptionenBewerten([PASSEND, TEUER_FLEXIBEL, BILLIG_KONFLIKT]).map((o) => o.id)
    const zwei = activityOptionenBewerten([BILLIG_KONFLIKT, TEUER_FLEXIBEL, PASSEND]).map((o) => o.id)
    assert.deepEqual(eins, zwei)
  })

  test('Gewichte enthalten keine Provision und keinen Providernamen', () => {
    assert.equal('provision' in ACTIVITY_RANGLISTE_GEWICHTE, false)
    assert.equal('provider' in ACTIVITY_RANGLISTE_GEWICHTE, false)
    assert.equal(Object.values(ACTIVITY_RANGLISTE_GEWICHTE).reduce((summe, wert) => summe + wert, 0), 100)
  })

  test('fehlende Daten verdünnen vorhandene Evidenz nicht mit Neutralwerten', () => {
    const mitBewertung = option({
      id: 'mit-wertung',
      title: 'Bekannt',
      bewertung: 9.4,
      bewertungenAnzahl: 2000,
      preis: null,
      preisWaehrung: null,
      stornierbar: null,
      dauerMinuten: null,
      context: {
        interessenFit: null,
        zeitFit: null,
        konflikt: 'unbekannt',
        preisFit: null,
        dauerFit: null,
        lageFit: null,
      },
    })
    const ohneAlles = option({
      id: 'ohne-alles',
      title: 'Unbekannt',
      bewertung: null,
      bewertungenAnzahl: null,
      preis: null,
      preisWaehrung: null,
      stornierbar: null,
      dauerMinuten: null,
      context: {
        interessenFit: null,
        zeitFit: null,
        konflikt: 'unbekannt',
        preisFit: null,
        dauerFit: null,
        lageFit: null,
      },
    })
    const bewertet = activityOptionenBewerten([ohneAlles, mitBewertung])
    assert.equal(bewertet[0]?.id, 'mit-wertung')
    assert.ok((bewertet[0]?.score ?? 0) > (bewertet[1]?.score ?? 0))
  })

  test('Labels entstehen nur mit belastbaren Daten', () => {
    const bewertet = activityOptionenBewerten([PASSEND, TEUER_FLEXIBEL])
    assert.equal(bewertet.find((eintrag) => eintrag.labels.includes('best_rating'))?.id, 'teuer-flexibel')
    assert.ok(bewertet.find((eintrag) => eintrag.labels.includes('best_value')))
    assert.ok(bewertet.find((eintrag) => eintrag.labels.includes('flexible')))
    assert.equal(bewertet.find((eintrag) => eintrag.labels.includes('compact'))?.id, 'passend')
  })

  test('ohne Bewertung gibt es kein Label beste Bewertung', () => {
    const ohne = option({
      id: 'ohne-wertung',
      title: 'Ohne Wertung',
      bewertung: null,
      bewertungenAnzahl: null,
    })
    const bewertet = activityOptionenBewerten([ohne])
    assert.equal(bewertet[0]?.labels.includes('best_rating'), false)
  })
})
