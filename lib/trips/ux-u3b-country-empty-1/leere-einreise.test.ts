// lib/trips/ux-u3b-country-empty-1/leere-einreise.test.ts
//
// Pure grouping. Identical consecutive empty entry placeholders may share
// copy. Stage identity, reentry, unknown places and any non-empty entry stay
// separate. No network and no mutation.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { landAnzeigeText } from '@/lib/country/darstellung'
import {
  DESTINATION_ESSENTIALS_LEERTEXT,
  destinationEssentialsAbleiten,
  type DestinationEssentialBereich,
  type DestinationEssentialDetail,
  type DestinationEssentialLink,
  type DestinationEssentialZiel,
  type DestinationOfficialLage,
  type DestinationSafetyLage,
  type DestinationSeasonalLage,
} from '@/lib/trips/destination-essentials'
import type { TripStage } from '@/types/trips'
import {
  einreiseinformationenUngeprueft,
  generischeLeereEinreiseSignatur,
  u3bAnzeigeGruppen,
  u3bHinweisAnzahl,
  u3bQuellenAnzahl,
} from '@/lib/trips/ux-u3b-country-empty-1/leere-einreise'

function bereich<Lage extends string>(
  lage: Lage,
  extra: Partial<DestinationEssentialBereich<Lage>> = {},
): DestinationEssentialBereich<Lage> {
  return {
    lage,
    text: extra.text ?? DESTINATION_ESSENTIALS_LEERTEXT,
    unvollstaendig: extra.unvollstaendig ?? false,
    details: extra.details ?? [],
    links: extra.links ?? [],
  }
}

function ziel(
  teil: Partial<DestinationEssentialZiel> & Pick<DestinationEssentialZiel, 'stageId'>,
): DestinationEssentialZiel {
  return {
    stageId: teil.stageId,
    position: teil.position ?? 1,
    name: teil.name ?? 'Bangkok',
    countryCode: teil.countryCode === undefined ? 'TH' : teil.countryCode,
    countryLabel: teil.countryLabel === undefined ? 'Thailand' : teil.countryLabel,
    placeId: teil.placeId ?? null,
    latitude: teil.latitude ?? null,
    longitude: teil.longitude ?? null,
    arrivalDate: teil.arrivalDate ?? '2026-11-01',
    departureDate: teil.departureDate ?? '2026-11-04',
    zeitraumText: teil.zeitraumText ?? '01. Nov. – 04. Nov.',
    einreise: teil.einreise ?? bereich<DestinationOfficialLage>('keine_evidence'),
    sicherheit: teil.sicherheit ?? bereich<DestinationSafetyLage>('keine_evidence'),
    saison: teil.saison ?? bereich<DestinationSeasonalLage>('keine_evidence'),
    hatHinweise: teil.hatHinweise ?? false,
  }
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name' | 'position'>): TripStage {
  return {
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

const detail: DestinationEssentialDetail = {
  id: 'detail-1',
  titel: 'Visum',
  text: 'Visum erforderlich',
  kontextText: 'Alex',
  dokumentLabel: 'Reisepass Schweiz',
}

const quelle: DestinationEssentialLink = {
  href: 'https://example.test/official',
  label: 'Offizielle Quelle öffnen',
  art: 'source',
}

describe('U3-B generic empty entry signature', () => {
  test('catalog country and exact empty entry form a signature', () => {
    const signatur = generischeLeereEinreiseSignatur(ziel({ stageId: 'bkk' }))
    assert.deepEqual(signatur, { countryCode: 'TH', countryLabel: 'Thailand' })
  })

  test('missing, unknown and non-catalog codes stay unsigned', () => {
    assert.equal(generischeLeereEinreiseSignatur(ziel({ stageId: 'a', countryCode: null, countryLabel: null })), null)
    assert.equal(
      generischeLeereEinreiseSignatur(ziel({ stageId: 'b', countryCode: 'th', countryLabel: 'Thailand' })),
      null,
    )
    assert.equal(
      generischeLeereEinreiseSignatur(ziel({ stageId: 'c', countryCode: 'Panama', countryLabel: 'Panama' })),
      null,
    )
    assert.equal(
      generischeLeereEinreiseSignatur(ziel({ stageId: 'd', countryCode: 'XX', countryLabel: 'Bestehender Code XX' })),
      null,
    )
  })

  test('evaluated, stale, incomplete, detailed or linked entry is not generic empty', () => {
    const lagen = [
      'unavailable',
      'stale',
      'unknown',
      'insufficient_context',
      'required',
      'conditional',
      'not_required',
      'option_abhaengig',
      'reisende_abhaengig',
      'option_und_reisende_abhaengig',
    ] as const
    for (const lage of lagen) {
      assert.equal(
        generischeLeereEinreiseSignatur(
          ziel({
            stageId: lage,
            einreise: bereich<DestinationOfficialLage>(lage, { text: `Einreise ${lage}` }),
          }),
        ),
        null,
      )
    }
    assert.equal(
      generischeLeereEinreiseSignatur(
        ziel({
          stageId: 'unvollstaendig',
          einreise: bereich<DestinationOfficialLage>('keine_evidence', { unvollstaendig: true }),
        }),
      ),
      null,
    )
    assert.equal(
      generischeLeereEinreiseSignatur(
        ziel({
          stageId: 'detail',
          einreise: bereich<DestinationOfficialLage>('keine_evidence', { details: [detail] }),
        }),
      ),
      null,
    )
    assert.equal(
      generischeLeereEinreiseSignatur(
        ziel({
          stageId: 'link',
          einreise: bereich<DestinationOfficialLage>('keine_evidence', { links: [quelle] }),
        }),
      ),
      null,
    )
    assert.equal(
      generischeLeereEinreiseSignatur(
        ziel({
          stageId: 'text',
          einreise: bereich<DestinationOfficialLage>('keine_evidence', { text: 'Abweichender Satz' }),
        }),
      ),
      null,
    )
  })
})

describe('U3-B contiguous grouping', () => {
  test('three identical empty Thai stages share one sentence and keep every stage', () => {
    const ziele = [
      ziel({ stageId: 'bkk', position: 1, name: 'Bangkok', zeitraumText: '01. Nov. – 04. Nov.' }),
      ziel({
        stageId: 'koc',
        position: 2,
        name: 'Ko Chang',
        arrivalDate: '2026-11-04',
        departureDate: '2026-11-08',
        zeitraumText: '04. Nov. – 08. Nov.',
        sicherheit: bereich<DestinationSafetyLage>('important_notice', { text: 'Hinweis Ko Chang' }),
      }),
      ziel({
        stageId: 'hkt',
        position: 3,
        name: 'Phuket',
        arrivalDate: '2026-11-08',
        departureDate: '2026-11-12',
        zeitraumText: '08. Nov. – 12. Nov.',
        saison: bereich<DestinationSeasonalLage>('timing_notice', { text: 'Regenzeit Phuket' }),
      }),
    ]
    const vorher = structuredClone(ziele)
    const gruppen = u3bAnzeigeGruppen(ziele)
    assert.deepEqual(ziele, vorher)
    assert.equal(gruppen.length, 1)
    const gruppe = gruppen[0]
    assert.ok(gruppe && gruppe.art === 'gemeinsame-leere-einreise')
    assert.equal(gruppe.text, einreiseinformationenUngeprueft('Thailand'))
    assert.deepEqual(
      gruppe.ziele.map((eintrag) => eintrag.stageId),
      ['bkk', 'koc', 'hkt'],
    )
    assert.deepEqual(
      gruppe.ziele.map((eintrag) => eintrag.zeitraumText),
      ['01. Nov. – 04. Nov.', '04. Nov. – 08. Nov.', '08. Nov. – 12. Nov.'],
    )
    assert.equal(gruppe.ziele[1]?.sicherheit.text, 'Hinweis Ko Chang')
    assert.equal(gruppe.ziele[2]?.saison.text, 'Regenzeit Phuket')
  })

  test('Thailand–Cambodia–Thailand stays two independent Thai visits', () => {
    const gruppen = u3bAnzeigeGruppen([
      ziel({ stageId: 'th-aus', position: 1, name: 'Bangkok' }),
      ziel({
        stageId: 'kh',
        position: 2,
        name: 'Siem Reap',
        countryCode: 'KH',
        countryLabel: 'Kambodscha',
      }),
      ziel({ stageId: 'th-rueck', position: 3, name: 'Bangkok', zeitraumText: '20. Nov. – 22. Nov.' }),
    ])
    assert.equal(gruppen.length, 3)
    assert.deepEqual(
      gruppen.map((gruppe) => (gruppe.art === 'einzeln' ? gruppe.ziel.stageId : gruppe.ziele.map((eintrag) => eintrag.stageId))),
      ['th-aus', 'kh', 'th-rueck'],
    )
    assert.equal(gruppen.filter((gruppe) => gruppe.art === 'gemeinsame-leere-einreise').length, 0)
  })

  test('a return with several empty Thai stages groups only inside that return', () => {
    const gruppen = u3bAnzeigeGruppen([
      ziel({ stageId: 'th-aus', position: 1, name: 'Bangkok' }),
      ziel({ stageId: 'kh', position: 2, name: 'Phnom Penh', countryCode: 'KH', countryLabel: 'Kambodscha' }),
      ziel({ stageId: 'th-bkk', position: 3, name: 'Bangkok' }),
      ziel({ stageId: 'th-cnx', position: 4, name: 'Chiang Mai' }),
    ])
    assert.equal(gruppen.length, 3)
    assert.equal(gruppen[0]?.art, 'einzeln')
    assert.equal(gruppen[1]?.art, 'einzeln')
    const rueckkehr = gruppen[2]
    assert.ok(rueckkehr && rueckkehr.art === 'gemeinsame-leere-einreise')
    assert.deepEqual(
      rueckkehr.ziele.map((eintrag) => eintrag.stageId),
      ['th-bkk', 'th-cnx'],
    )
    assert.equal(rueckkehr.text, 'Einreiseinformationen Thailand noch nicht geprüft')
  })

  test('repeated Bangkok stage ids stay distinct inside one contiguous Thai run', () => {
    const gruppen = u3bAnzeigeGruppen([
      ziel({ stageId: 'bkk-1', position: 1, name: 'Bangkok', placeId: 'geonames:1609350' }),
      ziel({ stageId: 'cnx', position: 2, name: 'Chiang Mai', placeId: 'geonames:1153671' }),
      ziel({ stageId: 'bkk-2', position: 3, name: 'Bangkok', placeId: 'geonames:1609350' }),
    ])
    assert.equal(gruppen.length, 1)
    const gruppe = gruppen[0]
    assert.ok(gruppe && gruppe.art === 'gemeinsame-leere-einreise')
    assert.deepEqual(
      gruppe.ziele.map((eintrag) => eintrag.stageId),
      ['bkk-1', 'cnx', 'bkk-2'],
    )
    assert.deepEqual(
      gruppe.ziele.map((eintrag) => eintrag.name),
      ['Bangkok', 'Chiang Mai', 'Bangkok'],
    )
  })

  test('unknown Panama and Panama the country do not become one place', () => {
    const gruppen = u3bAnzeigeGruppen([
      ziel({
        stageId: 'unbekannt',
        position: 1,
        name: 'Panama',
        countryCode: null,
        countryLabel: null,
        placeId: null,
      }),
      ziel({
        stageId: 'stadt',
        position: 2,
        name: 'Panama-Stadt',
        countryCode: 'PA',
        countryLabel: 'Panama',
        placeId: 'geonames:3703443',
      }),
    ])
    assert.equal(gruppen.length, 2)
    assert.equal(gruppen[0]?.art, 'einzeln')
    assert.equal(gruppen[1]?.art, 'einzeln')
    if (gruppen[0]?.art === 'einzeln') {
      assert.equal(gruppen[0].ziel.countryCode, null)
      assert.equal(gruppen[0].ziel.name, 'Panama')
    }
    if (gruppen[1]?.art === 'einzeln') {
      assert.equal(gruppen[1].ziel.name, 'Panama-Stadt')
      assert.equal(gruppen[1].ziel.countryCode, 'PA')
    }
  })

  test('the same display name in different countries stays separate', () => {
    const gruppen = u3bAnzeigeGruppen([
      ziel({ stageId: 'a', name: 'San José', countryCode: 'CR', countryLabel: 'Costa Rica' }),
      ziel({ stageId: 'b', position: 2, name: 'San José', countryCode: 'US', countryLabel: 'Vereinigte Staaten' }),
    ])
    assert.equal(gruppen.length, 2)
    assert.deepEqual(
      gruppen.map((gruppe) => (gruppe.art === 'einzeln' ? gruppe.ziel.countryCode : null)),
      ['CR', 'US'],
    )
  })

  test('a differing label, date-only difference still groups, and a stale neighbor breaks the run', () => {
    const label = u3bAnzeigeGruppen([
      ziel({ stageId: 'a', countryLabel: 'Thailand' }),
      ziel({ stageId: 'b', position: 2, countryLabel: 'Königreich Thailand' }),
    ])
    assert.equal(label.length, 2)

    const daten = u3bAnzeigeGruppen([
      ziel({ stageId: 'a', zeitraumText: '01. Nov. – 04. Nov.' }),
      ziel({ stageId: 'b', position: 2, zeitraumText: '10. Dez. – 12. Dez.' }),
    ])
    assert.equal(daten.length, 1)
    assert.equal(daten[0]?.art, 'gemeinsame-leere-einreise')

    const stale = u3bAnzeigeGruppen([
      ziel({ stageId: 'a' }),
      ziel({
        stageId: 'b',
        position: 2,
        einreise: bereich<DestinationOfficialLage>('stale', { text: 'Einreise veraltet' }),
      }),
      ziel({ stageId: 'c', position: 3 }),
    ])
    assert.equal(stale.length, 3)
    assert.equal(stale.filter((gruppe) => gruppe.art === 'gemeinsame-leere-einreise').length, 0)
  })

  test('person, document and source differences are not collapsed', () => {
    const gruppen = u3bAnzeigeGruppen([
      ziel({
        stageId: 'option',
        einreise: bereich<DestinationOfficialLage>('option_abhaengig', {
          text: 'Je nach Reisedokument unterschiedlich',
          details: [detail],
          links: [quelle],
        }),
      }),
      ziel({
        stageId: 'person',
        position: 2,
        einreise: bereich<DestinationOfficialLage>('reisende_abhaengig', {
          text: 'Je nach Reisendem unterschiedlich',
          details: [{ ...detail, id: 'detail-2', kontextText: 'Mina', dokumentLabel: 'Reisepass Serbien' }],
        }),
      }),
    ])
    assert.equal(gruppen.length, 2)
    if (gruppen[0]?.art === 'einzeln' && gruppen[1]?.art === 'einzeln') {
      assert.equal(u3bHinweisAnzahl(gruppen[0].ziel), 1)
      assert.equal(u3bQuellenAnzahl(gruppen[0].ziel), 1)
      assert.equal(gruppen[1].ziel.einreise.details[0]?.dokumentLabel, 'Reisepass Serbien')
    } else {
      assert.fail('erwartete zwei einzelne Etappen')
    }
  })

  test('warning and source counts stay on the stage that owns them', () => {
    const sicherheit = bereich<DestinationSafetyLage>('critical_warning', {
      text: 'Kritischer Hinweis',
      details: [
        { id: 's1', titel: 'Warnung', text: 'Eins', kontextText: null, dokumentLabel: null },
        { id: 's2', titel: 'Warnung', text: 'Zwei', kontextText: null, dokumentLabel: null },
      ],
      links: [quelle, { href: 'https://example.test/safety-2', label: 'Zweite Quelle', art: 'source' }],
    })
    const stufe = ziel({ stageId: 'hkt', sicherheit, hatHinweise: true })
    assert.equal(u3bHinweisAnzahl(stufe), 2)
    assert.equal(u3bQuellenAnzahl(stufe), 2)
  })

  test('the engine empty projection is the signature this helper recognizes', () => {
    const ableitung = destinationEssentialsAbleiten({
      reise: {
        stages: [
          etappe({
            id: 'bkk',
            position: 1,
            name: 'Bangkok',
            countryCode: 'TH',
            arrivalDate: '2026-11-01',
            departureDate: '2026-11-04',
            placeId: 'geonames:1609350',
          }),
          etappe({
            id: 'koc',
            position: 2,
            name: 'Ko Chang',
            countryCode: 'TH',
            arrivalDate: '2026-11-04',
            departureDate: '2026-11-08',
          }),
          etappe({
            id: 'hkt',
            position: 3,
            name: 'Phuket',
            countryCode: 'TH',
            arrivalDate: '2026-11-08',
            departureDate: '2026-11-12',
          }),
        ],
      },
    })
    assert.equal(ableitung.hatHinweise, false)
    assert.equal(ableitung.loestSucheAus, false)
    const label = landAnzeigeText('TH')
    for (const eintrag of ableitung.ziele) {
      assert.equal(eintrag.countryCode, 'TH')
      assert.equal(eintrag.countryLabel, label)
      assert.equal(eintrag.einreise.lage, 'keine_evidence')
      assert.equal(eintrag.einreise.text, DESTINATION_ESSENTIALS_LEERTEXT)
      assert.deepEqual(generischeLeereEinreiseSignatur(eintrag), { countryCode: 'TH', countryLabel: label })
    }
    const gruppen = u3bAnzeigeGruppen(ableitung.ziele)
    assert.equal(gruppen.length, 1)
    const gruppe = gruppen[0]
    assert.ok(gruppe && gruppe.art === 'gemeinsame-leere-einreise')
    assert.equal(gruppe.text, einreiseinformationenUngeprueft(label))
    assert.deepEqual(
      gruppe.ziele.map((eintrag) => eintrag.stageId),
      ['bkk', 'koc', 'hkt'],
    )
  })

  test('engine reentry and unknown place stay ungrouped as visits', () => {
    const ableitung = destinationEssentialsAbleiten({
      reise: {
        stages: [
          etappe({ id: 'th-1', position: 1, name: 'Bangkok', countryCode: 'TH' }),
          etappe({ id: 'kh', position: 2, name: 'Siem Reap', countryCode: 'KH' }),
          etappe({ id: 'th-2', position: 3, name: 'Bangkok', countryCode: 'TH' }),
          etappe({ id: 'panama-ort', position: 4, name: 'Panama', countryCode: null }),
          etappe({ id: 'pa', position: 5, name: 'Panama', countryCode: 'PA' }),
        ],
      },
    })
    const gruppen = u3bAnzeigeGruppen(ableitung.ziele)
    assert.equal(gruppen.length, 5)
    assert.ok(gruppen.every((gruppe) => gruppe.art === 'einzeln'))
    const panama = ableitung.ziele.find((eintrag) => eintrag.stageId === 'panama-ort')
    const land = ableitung.ziele.find((eintrag) => eintrag.stageId === 'pa')
    assert.equal(panama?.countryCode, null)
    assert.equal(panama?.countryLabel, null)
    assert.equal(land?.countryCode, 'PA')
    assert.equal(land?.name, 'Panama')
    assert.notEqual(land?.countryLabel, 'Panama-Stadt')
  })

  test('helper source has no network, mutation or secret path', () => {
    const inhalt = readFileSync(resolve('lib/trips/ux-u3b-country-empty-1/leere-einreise.ts'), 'utf8')
    assert.doesNotMatch(inhalt, /fetch\(|axios|@supabase|service_role|process\.env|localStorage|indexedDB/)
    assert.doesNotMatch(inhalt, /destinationEssentialsAbleiten|officialTruth|requirementsProvider/)
  })
})
