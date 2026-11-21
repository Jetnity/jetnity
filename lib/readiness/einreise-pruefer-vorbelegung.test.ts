import assert from 'node:assert/strict'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import EinreiseLaenderpruefer from '@/components/readiness/EinreiseLaenderpruefer'
import { einreisePrueferVorbelegung } from '@/lib/readiness/einreise-pruefer-vorbelegung'
import type { TravellerSlot } from '@/lib/readiness/party'
import type { TripTraveller } from '@/types/trips'

const ZEIT = '2026-11-01T08:00:00.000Z'

type PrueferProps = NonNullable<Parameters<typeof EinreiseLaenderpruefer>[0]>

function person(clientRef: string, staaten: string[], dokumentLand: string | null = null): TripTraveller {
  return {
    id: clientRef,
    clientRef,
    label: null,
    residenceCountryCode: null,
    createdAt: ZEIT,
    updatedAt: ZEIT,
    citizenships: staaten.map((countryCode) => ({ id: `${clientRef}-${countryCode}`, clientRef: `${clientRef}-${countryCode}`, countryCode, createdAt: ZEIT, updatedAt: ZEIT })),
    documents: dokumentLand
      ? [{ id: 'd', clientRef: 'd', documentType: 'passport', issuingCountryCode: dokumentLand, citizenshipClientRef: null, expiresOn: '2030-01-01', createdAt: ZEIT, updatedAt: ZEIT }]
      : [],
  }
}

function slot(nr: number, traveller: TripTraveller | null, applicable = true): TravellerSlot {
  return { clientRef: `traveller:${nr}`, label: `Reisende ${nr}`, persisted: Boolean(traveller), traveller, missingFacts: [], applicable }
}

test('Länder der Reise in Reihenfolge, ohne Doppel und ohne ungültige Codes', () => {
  const vorbelegung = einreisePrueferVorbelegung({ laender: ['pt', 'PT', null, '', 'MA', 'ZZ'], slots: [] })
  assert.deepEqual(vorbelegung.ziele, ['PT', 'MA'])
  assert.deepEqual(vorbelegung.paesse, [])
  assert.deepEqual(vorbelegung.personen, [])
})

test('Pässe je Person aus gespeicherten Staatsangehörigkeiten; ohne Angabe bleibt «noch nicht angegeben»', () => {
  const vorbelegung = einreisePrueferVorbelegung({
    laender: ['PT'],
    slots: [slot(1, person('traveller:1', ['RS', 'CH'])), slot(2, person('traveller:2', ['CH'])), slot(3, null)],
  })
  assert.deepEqual(vorbelegung.paesse, ['CH', 'RS'])
  assert.deepEqual(vorbelegung.nichtUebernommen, [])
  assert.deepEqual(vorbelegung.personen.map((eintrag) => eintrag.paesse), [['CH', 'RS'], ['CH'], []])
  assert.match(vorbelegung.personen[0]?.text ?? '', /Schweiz, .*Serbien/)
  assert.equal(vorbelegung.personen[2]?.text, 'noch nicht angegeben')
})

test('Ausstellerland eines Dokuments wird nicht als Staatsangehörigkeit übernommen', () => {
  const vorbelegung = einreisePrueferVorbelegung({ laender: ['PT'], slots: [slot(1, person('traveller:1', [], 'DE'))] })
  assert.deepEqual(vorbelegung.paesse, [])
  assert.equal(vorbelegung.personen[0]?.text, 'noch nicht angegeben')
})

test('höchstens fünf Pässe vorausgefüllt, der Rest wird benannt; nicht reisende Einträge zählen nicht', () => {
  const vorbelegung = einreisePrueferVorbelegung({
    laender: ['PT'],
    slots: [
      slot(1, person('traveller:1', ['AT', 'CH', 'DE'])),
      slot(2, person('traveller:2', ['FR', 'IT', 'RS'])),
      slot(3, person('traveller:3', ['US']), false),
    ],
  })
  assert.deepEqual(vorbelegung.paesse, ['AT', 'CH', 'DE', 'FR', 'IT'])
  assert.deepEqual(vorbelegung.nichtUebernommen, ['RS'])
  assert.equal(vorbelegung.personen.length, 2)
})

test('eingebetteter Prüfer: vorausgefüllt, Länder der Reise wählbar, fehlende Angabe führt zu «Reisende & Dokumente»', () => {
  const vorbelegung = einreisePrueferVorbelegung({
    laender: ['PT', 'MA'],
    slots: [slot(1, person('traveller:1', ['CH'])), slot(2, null)],
  })
  const html = renderToStaticMarkup(React.createElement<PrueferProps>(EinreiseLaenderpruefer, { eingebettet: true, vorbelegung, onAngabenErgaenzen: () => {} }))
  assert.match(html, /aus deiner Reise vorausgefüllt/)
  assert.match(html, /data-einreise-reiseziele/)
  assert.match(html, /aria-pressed="true"[^>]*>🇵🇹 Portugal</)
  assert.match(html, /aria-pressed="false"[^>]*>🇲🇦 Marokko</)
  assert.match(html, /data-einreise-vorbelegung-person="angegeben"/)
  assert.match(html, /data-einreise-vorbelegung-person="offen"[^>]*><span[^>]*>Reisende 2:<\/span> noch nicht angegeben/)
  assert.match(html, />Staatsangehörigkeit ergänzen</)
  assert.doesNotMatch(html, /role="alert"/)
})

test('öffentlicher Prüfer ohne Reise bleibt unverändert leer', () => {
  const html = renderToStaticMarkup(React.createElement(EinreiseLaenderpruefer))
  assert.match(html, /Wähle das Zielland und den Pass/)
  assert.doesNotMatch(html, /data-einreise-vorbelegung|data-einreise-reiseziele|vorausgefüllt/)
})
