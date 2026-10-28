// lib/trips/ux-u3b-country-empty-1/presentation.test.ts
//
// Mounted markup for the full-density branch. The all-empty compact path
// stays the existing trip-level collapse. Guest and account are the same
// projection: this component has no second renderer and no network.

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import TripWorkspaceDestinationEssentials from '@/components/trips/TripWorkspaceDestinationEssentials'
import {
  DESTINATION_ESSENTIALS_LEERTEXT,
  DESTINATION_ESSENTIALS_TITEL,
  type DestinationEssentialBereich,
  type DestinationEssentialDetail,
  type DestinationEssentialLink,
  type DestinationEssentialZiel,
  type DestinationEssentialsAbleitung,
  type DestinationOfficialLage,
  type DestinationSafetyLage,
  type DestinationSeasonalLage,
} from '@/lib/trips/destination-essentials'
import { einreiseinformationenUngeprueft } from '@/lib/trips/ux-u3b-country-empty-1/leere-einreise'

const VERBOTENE_ALLCLEAR = /keine Hinweise erforderlich|alles erledigt|amtlich bestätigt/i

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

function ableitung(ziele: DestinationEssentialZiel[], hatHinweise?: boolean): DestinationEssentialsAbleitung {
  return {
    titel: DESTINATION_ESSENTIALS_TITEL,
    ziele,
    leerText: DESTINATION_ESSENTIALS_LEERTEXT,
    hatZiele: ziele.length > 0,
    hatHinweise: hatHinweise ?? ziele.some((eintrag) => eintrag.hatHinweise),
    loestSucheAus: false,
  }
}

function htmlAus(essentials: DestinationEssentialsAbleitung): string {
  return renderToStaticMarkup(createElement(TripWorkspaceDestinationEssentials, { essentials }))
}

function zaehle(html: string, suche: string): number {
  return html.split(suche).length - 1
}

const warnung = (id: string, text: string): DestinationEssentialDetail => ({
  id,
  titel: 'Hinweis',
  text,
  kontextText: null,
  dokumentLabel: null,
})

const quelle = (href: string): DestinationEssentialLink => ({
  href,
  label: 'Quelle öffnen',
  art: 'source',
})

describe('U3-B presentation — shared empty entry', () => {
  test('three Thai stages share one unchecked sentence and keep local safety and season', () => {
    const html = htmlAus(
      ableitung(
        [
          ziel({
            stageId: 'bkk',
            position: 1,
            name: 'Bangkok',
            zeitraumText: '01. Nov. – 04. Nov.',
            hatHinweise: true,
            sicherheit: bereich<DestinationSafetyLage>('important_notice', {
              text: 'Hinweis Bangkok',
              details: [warnung('s-bkk', 'Markt Bangkok')],
              links: [quelle('https://example.test/bkk')],
            }),
          }),
          ziel({
            stageId: 'koc',
            position: 2,
            name: 'Ko Chang',
            zeitraumText: '04. Nov. – 08. Nov.',
            hatHinweise: true,
            sicherheit: bereich<DestinationSafetyLage>('information', {
              text: 'Hinweis Ko Chang',
              details: [warnung('s-koc', 'Fähre Ko Chang')],
            }),
          }),
          ziel({
            stageId: 'hkt',
            position: 3,
            name: 'Phuket',
            zeitraumText: '08. Nov. – 12. Nov.',
            hatHinweise: true,
            saison: bereich<DestinationSeasonalLage>('timing_notice', {
              text: 'Regenzeit Phuket',
              details: [warnung('z-hkt', 'Monsun Phuket')],
              links: [quelle('https://example.test/hkt-season')],
            }),
          }),
        ],
        true,
      ),
    )
    const satz = einreiseinformationenUngeprueft('Thailand')
    assert.match(html, /data-destination-essentials-dichte="voll"/)
    assert.equal(zaehle(html, satz), 1)
    assert.equal(zaehle(html, 'data-u3b-shared-entry="ein"'), 1)
    assert.match(html, /data-u3b-country="TH"/)
    assert.match(html, /data-u3b-stage-count="3"/)
    assert.equal(zaehle(html, '>Einreise<'), 1)
    for (const id of ['bkk', 'koc', 'hkt']) {
      assert.match(html, new RegExp(`data-destination-stage="${id}"`))
      assert.match(html, new RegExp(`data-destination-entry="keine_evidence"`))
    }
    assert.match(html, /Bangkok · Thailand/)
    assert.match(html, /Ko Chang · Thailand/)
    assert.match(html, /Phuket · Thailand/)
    assert.match(html, /01\. Nov\. – 04\. Nov\./)
    assert.match(html, /04\. Nov\. – 08\. Nov\./)
    assert.match(html, /08\. Nov\. – 12\. Nov\./)
    assert.match(html, /Hinweis Bangkok/)
    assert.match(html, /Hinweis Ko Chang/)
    assert.match(html, /Regenzeit Phuket/)
    assert.match(html, /Markt Bangkok/)
    assert.match(html, /Fähre Ko Chang/)
    assert.match(html, /Monsun Phuket/)
    assert.equal(zaehle(html, 'href="https://example.test/bkk"'), 1)
    assert.equal(zaehle(html, 'href="https://example.test/hkt-season"'), 1)
    assert.match(html, /data-u3b-warning-count="1"/)
    assert.match(html, /data-destination-safety="important_notice"/)
    assert.match(html, /data-destination-safety="information"/)
    assert.match(html, /data-destination-seasonal="timing_notice"/)
    assert.match(html, /min-h-11/)
    assert.match(html, /data-u3b-shared-entry-text="ein"/)
    assert.match(html, /break-words text-sm leading-6/)
    assert.doesNotMatch(html, VERBOTENE_ALLCLEAR)
    assert.doesNotMatch(html, /data-destination-essentials-leerhinweis/)
  })

  test('a fully empty Thai trio keeps the existing compact collapse', () => {
    const html = htmlAus(
      ableitung([
        ziel({ stageId: 'bkk', name: 'Bangkok' }),
        ziel({ stageId: 'koc', position: 2, name: 'Ko Chang', zeitraumText: '04. Nov. – 08. Nov.' }),
        ziel({ stageId: 'hkt', position: 3, name: 'Phuket', zeitraumText: '08. Nov. – 12. Nov.' }),
      ]),
    )
    assert.match(html, /data-destination-essentials-dichte="kompakt"/)
    assert.match(html, /data-destination-essentials-leerhinweis="ein"/)
    assert.equal(zaehle(html, DESTINATION_ESSENTIALS_LEERTEXT), 1)
    assert.doesNotMatch(html, /data-u3b-shared-entry/)
    assert.doesNotMatch(html, /Einreiseinformationen/)
    assert.match(html, /data-destination-stage="bkk"/)
    assert.match(html, /data-destination-stage="koc"/)
    assert.match(html, /data-destination-stage="hkt"/)
    assert.equal(zaehle(html, 'Bangkok · Thailand'), 1)
    assert.match(html, /Ko Chang · Thailand/)
    assert.match(html, /Phuket · Thailand/)
  })

  test('Thailand–Cambodia–Thailand keeps two entry lines and both Thai visits', () => {
    const html = htmlAus(
      ableitung(
        [
          ziel({ stageId: 'th-aus', name: 'Bangkok', zeitraumText: '01. Nov. – 04. Nov.' }),
          ziel({
            stageId: 'kh',
            position: 2,
            name: 'Siem Reap',
            countryCode: 'KH',
            countryLabel: 'Kambodscha',
            zeitraumText: '04. Nov. – 09. Nov.',
            hatHinweise: true,
            sicherheit: bereich<DestinationSafetyLage>('important_notice', { text: 'Hinweis Siem Reap' }),
          }),
          ziel({ stageId: 'th-rueck', position: 3, name: 'Chiang Mai', zeitraumText: '09. Nov. – 12. Nov.' }),
        ],
        true,
      ),
    )
    assert.doesNotMatch(html, /data-u3b-shared-entry/)
    assert.equal(zaehle(html, '>Einreise<'), 3)
    assert.equal(zaehle(html, DESTINATION_ESSENTIALS_LEERTEXT) >= 3, true)
    assert.match(html, /data-destination-stage="th-aus"/)
    assert.match(html, /data-destination-stage="kh"/)
    assert.match(html, /data-destination-stage="th-rueck"/)
    assert.match(html, /data-destination-country="TH"/)
    assert.match(html, /data-destination-country="KH"/)
    assert.match(html, /Hinweis Siem Reap/)
    assert.match(html, /09\. Nov\. – 12\. Nov\./)
    assert.equal(zaehle(html, einreiseinformationenUngeprueft('Thailand')), 0)
  })

  test('a later multi-stage Thai return shares copy only inside that return', () => {
    const html = htmlAus(
      ableitung(
        [
          ziel({ stageId: 'th-aus', name: 'Bangkok' }),
          ziel({
            stageId: 'kh',
            position: 2,
            name: 'Phnom Penh',
            countryCode: 'KH',
            countryLabel: 'Kambodscha',
            hatHinweise: true,
            einreise: bereich<DestinationOfficialLage>('required', {
              text: 'Visum erforderlich',
              details: [
                {
                  id: 'kh-visa',
                  titel: 'Visum',
                  text: 'Visum erforderlich',
                  kontextText: null,
                  dokumentLabel: 'Reisepass Schweiz',
                },
              ],
              links: [quelle('https://example.test/kh')],
            }),
          }),
          ziel({ stageId: 'th-bkk', position: 3, name: 'Bangkok', zeitraumText: '12. Nov. – 14. Nov.' }),
          ziel({ stageId: 'th-cnx', position: 4, name: 'Chiang Mai', zeitraumText: '14. Nov. – 18. Nov.' }),
        ],
        true,
      ),
    )
    assert.equal(zaehle(html, einreiseinformationenUngeprueft('Thailand')), 1)
    assert.match(html, /data-u3b-stage-count="2"/)
    assert.match(html, /Visum erforderlich/)
    assert.equal(zaehle(html, 'href="https://example.test/kh"'), 1)
    assert.match(html, /Reisepass Schweiz/)
    assert.match(html, /data-destination-stage="th-aus"/)
    assert.match(html, /data-destination-stage="th-bkk"/)
    assert.match(html, /data-destination-stage="th-cnx"/)
    assert.match(html, /data-destination-entry="required"/)
    assert.match(html, /data-destination-entry="keine_evidence"/)
  })

  test('repeated Bangkok names stay on distinct stage ids', () => {
    const html = htmlAus(
      ableitung(
        [
          ziel({ stageId: 'bkk-1', name: 'Bangkok', placeId: 'geonames:1609350' }),
          ziel({ stageId: 'cnx', position: 2, name: 'Chiang Mai', placeId: 'geonames:1153671' }),
          ziel({
            stageId: 'bkk-2',
            position: 3,
            name: 'Bangkok',
            placeId: 'geonames:1609350',
            zeitraumText: '18. Nov. – 20. Nov.',
            hatHinweise: true,
            sicherheit: bereich<DestinationSafetyLage>('critical_warning', {
              text: 'Hinweis zweite Bangkok-Etappe',
              details: [warnung('s1', 'Eins'), warnung('s2', 'Zwei')],
            }),
          }),
        ],
        true,
      ),
    )
    assert.equal(zaehle(html, 'Bangkok · Thailand'), 2)
    assert.match(html, /data-destination-stage="bkk-1"/)
    assert.match(html, /data-destination-stage="bkk-2"/)
    assert.match(html, /Hinweis zweite Bangkok-Etappe/)
    assert.match(html, /data-u3b-warning-count="2"/)
    assert.equal(zaehle(html, einreiseinformationenUngeprueft('Thailand')), 1)
  })

  test('unknown Panama is not Panama City and does not join the country card', () => {
    const html = htmlAus(
      ableitung([
        ziel({
          stageId: 'unbekannt',
          name: 'Panama',
          countryCode: null,
          countryLabel: null,
          zeitraumText: null,
          hatHinweise: true,
          einreise: bereich<DestinationOfficialLage>('unknown', { text: 'Ort ungeklärt' }),
        }),
        ziel({
          stageId: 'pa',
          position: 2,
          name: 'Panama',
          countryCode: 'PA',
          countryLabel: 'Panama',
          hatHinweise: true,
          einreise: bereich<DestinationOfficialLage>('insufficient_context', {
            text: 'Angaben fehlen',
          }),
        }),
      ]),
    )
    assert.doesNotMatch(html, /data-u3b-shared-entry/)
    assert.doesNotMatch(html, /Panama-Stadt/)
    assert.match(html, /Ort ungeklärt/)
    assert.match(html, /Angaben fehlen/)
    assert.match(html, /data-destination-country="none"/)
    assert.match(html, /data-destination-country="PA"/)
    assert.match(html, /data-destination-stage="unbekannt"/)
    assert.match(html, /data-destination-stage="pa"/)
  })

  test('stale, unavailable and current entry stay on their own cards', () => {
    const html = htmlAus(
      ableitung(
        [
          ziel({ stageId: 'leer', name: 'Bangkok' }),
          ziel({
            stageId: 'stale',
            position: 2,
            name: 'Ko Chang',
            einreise: bereich<DestinationOfficialLage>('stale', { text: 'Einreise veraltet' }),
          }),
          ziel({
            stageId: 'down',
            position: 3,
            name: 'Phuket',
            einreise: bereich<DestinationOfficialLage>('unavailable', { text: 'Einreise nicht erreichbar' }),
          }),
          ziel({
            stageId: 'aktuell',
            position: 4,
            name: 'Chiang Mai',
            einreise: bereich<DestinationOfficialLage>('not_required', { text: 'Kein Visum erforderlich' }),
          }),
        ],
        true,
      ),
    )
    assert.doesNotMatch(html, /data-u3b-shared-entry/)
    assert.match(html, /Einreise veraltet/)
    assert.match(html, /Einreise nicht erreichbar/)
    assert.match(html, /Kein Visum erforderlich/)
    assert.match(html, /data-destination-entry="stale"/)
    assert.match(html, /data-destination-entry="unavailable"/)
    assert.match(html, /data-destination-entry="not_required"/)
    assert.match(html, /data-destination-entry="keine_evidence"/)
  })

  test('the same projection renders once for guest and account', () => {
    const essentials = ableitung(
      [
        ziel({ stageId: 'bkk', hatHinweise: true, sicherheit: bereich<DestinationSafetyLage>('information', { text: 'Hinweis' }) }),
        ziel({ stageId: 'hkt', position: 2, name: 'Phuket' }),
      ],
      true,
    )
    assert.equal(htmlAus(essentials), htmlAus(essentials))
    assert.equal(zaehle(htmlAus(essentials), einreiseinformationenUngeprueft('Thailand')), 1)
  })
})

describe('U3-B presentation — scope lock', () => {
  test('the component only projects the helper and keeps the compact sentence', () => {
    const inhalt = readFileSync(resolve('components/trips/TripWorkspaceDestinationEssentials.tsx'), 'utf8')
    assert.match(inhalt, /u3bAnzeigeGruppen/)
    assert.match(inhalt, /für Einreise, Sicherheit und Reisezeit/)
    assert.match(inhalt, /data-destination-essentials-dichte=\{kompaktLeer \? 'kompakt' : 'voll'\}/)
    assert.doesNotMatch(inhalt, /fetch\(|@supabase|service_role|process\.env|localStorage/)
    assert.doesNotMatch(inhalt, /destinationEssentialsAbleiten/)
    assert.match(inhalt, /<summary\b[^>]*min-h-11/)
  })
})
