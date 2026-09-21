// lib/trips/destination-essentials-density-1.test.ts
//
// Presentation-only density regressions for VUX-5. Derivation stays in
// destination-essentials.test.ts. Emptiness is decided from canonical
// domain states plus details/links, not from hatHinweise or text matching.

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
  DESTINATION_OFFICIAL_OPTION_ABHAENGIG_TEXT,
  type DestinationEssentialBereich,
  type DestinationEssentialDetail,
  type DestinationEssentialLink,
  type DestinationEssentialZiel,
  type DestinationEssentialsAbleitung,
  type DestinationOfficialLage,
  type DestinationSafetyLage,
  type DestinationSeasonalLage,
} from '@/lib/trips/destination-essentials'

const VERBOTENE_ALLCLEAR = /keine Hinweise erforderlich|sicher\b|vollständig|alles erledigt/i

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

function ziel(teil: Partial<DestinationEssentialZiel> & Pick<DestinationEssentialZiel, 'stageId'>): DestinationEssentialZiel {
  return {
    stageId: teil.stageId,
    position: teil.position ?? 1,
    name: teil.name ?? 'Florenz',
    countryCode: teil.countryCode ?? 'IT',
    countryLabel: teil.countryLabel ?? 'Italien',
    placeId: teil.placeId ?? null,
    latitude: teil.latitude ?? null,
    longitude: teil.longitude ?? null,
    arrivalDate: teil.arrivalDate ?? '2026-09-12',
    departureDate: teil.departureDate ?? '2026-09-15',
    zeitraumText: teil.zeitraumText ?? '12. Sep. – 15. Sep.',
    einreise: teil.einreise ?? bereich<DestinationOfficialLage>('keine_evidence'),
    sicherheit: teil.sicherheit ?? bereich<DestinationSafetyLage>('keine_evidence'),
    saison: teil.saison ?? bereich<DestinationSeasonalLage>('keine_evidence'),
    hatHinweise: teil.hatHinweise ?? false,
  }
}

function ableitung(
  teil: Partial<DestinationEssentialsAbleitung> & { ziele?: DestinationEssentialZiel[] } = {},
): DestinationEssentialsAbleitung {
  const ziele = teil.ziele ?? [
    ziel({ stageId: 'stage-fl', position: 1, name: 'Florenz' }),
    ziel({
      stageId: 'stage-rm',
      position: 2,
      name: 'Rom',
      arrivalDate: '2026-09-15',
      departureDate: '2026-09-20',
      zeitraumText: '15. Sep. – 20. Sep.',
    }),
    ziel({
      stageId: 'stage-vn',
      position: 3,
      name: 'Venedig',
      arrivalDate: '2026-09-20',
      departureDate: '2026-09-23',
      zeitraumText: '20. Sep. – 23. Sep.',
    }),
  ]
  return {
    titel: teil.titel ?? DESTINATION_ESSENTIALS_TITEL,
    ziele,
    leerText: teil.leerText ?? DESTINATION_ESSENTIALS_LEERTEXT,
    hatZiele: teil.hatZiele ?? ziele.length > 0,
    hatHinweise: teil.hatHinweise ?? ziele.some((eintrag) => eintrag.hatHinweise),
    loestSucheAus: false,
  }
}

function htmlAus(essentials: DestinationEssentialsAbleitung): string {
  return renderToStaticMarkup(createElement(TripWorkspaceDestinationEssentials, { essentials }))
}

function zaehle(html: string, suche: string): number {
  return html.split(suche).length - 1
}

const detail: DestinationEssentialDetail = {
  id: 'detail-1',
  titel: 'Visum',
  text: 'Visum erforderlich',
  kontextText: null,
  dokumentLabel: 'Reisepass Schweiz',
}

const quelle: DestinationEssentialLink = {
  href: 'https://example.test/official',
  label: 'Offizielle Quelle öffnen',
  art: 'source',
}

describe('Destination Essentials Density 1 — empty fast path', () => {
  test('ohne Ziele bleibt die bestehende Leerstand-Meldung', () => {
    const html = htmlAus(ableitung({ ziele: [], hatZiele: false, hatHinweise: false }))
    assert.match(html, /id="reiseziele-essentials-titel"/)
    assert.match(html, new RegExp(DESTINATION_ESSENTIALS_TITEL))
    assert.match(html, new RegExp(DESTINATION_ESSENTIALS_LEERTEXT))
    assert.match(html, /data-destination-essentials-dichte="voll"/)
    assert.doesNotMatch(html, /data-destination-essentials-leerhinweis/)
    assert.doesNotMatch(html, /<ol/)
    assert.doesNotMatch(html, /Einreise/)
    assert.doesNotMatch(html, VERBOTENE_ALLCLEAR)
  })

  test('ein vollständig leeres Ziel zeigt den Hinweis einmal und den Etappenkontext', () => {
    const html = htmlAus(
      ableitung({
        ziele: [ziel({ stageId: 'stage-fl' })],
      }),
    )
    assert.match(html, /data-destination-essentials-dichte="kompakt"/)
    assert.match(html, /data-destination-essentials-leerhinweis="ein"/)
    assert.equal(zaehle(html, DESTINATION_ESSENTIALS_LEERTEXT), 1)
    assert.equal(zaehle(html, '>Einreise<'), 0)
    assert.equal(zaehle(html, '>Sicherheit<'), 0)
    assert.equal(zaehle(html, '>Reisezeit<'), 0)
    assert.match(html, /für Einreise, Sicherheit und Reisezeit/)
    assert.match(html, /<ol/)
    assert.match(html, /Florenz · Italien/)
    assert.match(html, /12\. Sep\. – 15\. Sep\./)
    assert.match(html, /data-destination-stage="stage-fl"/)
    assert.doesNotMatch(html, /Quellen und Details/)
    assert.doesNotMatch(html, VERBOTENE_ALLCLEAR)
  })

  test('drei vollständig leere Ziele bleiben vollständig und geordnet sichtbar', () => {
    const html = htmlAus(ableitung())
    assert.match(html, /data-destination-essentials-dichte="kompakt"/)
    assert.equal(zaehle(html, DESTINATION_ESSENTIALS_LEERTEXT), 1)
    assert.match(html, /<ol/)
    const florenz = html.indexOf('data-destination-stage="stage-fl"')
    const rom = html.indexOf('data-destination-stage="stage-rm"')
    const venedig = html.indexOf('data-destination-stage="stage-vn"')
    assert.ok(florenz >= 0 && rom > florenz && venedig > rom)
    assert.match(html, /Florenz · Italien/)
    assert.match(html, /Rom · Italien/)
    assert.match(html, /Venedig · Italien/)
    assert.match(html, /12\. Sep\. – 15\. Sep\./)
    assert.match(html, /15\. Sep\. – 20\. Sep\./)
    assert.match(html, /20\. Sep\. – 23\. Sep\./)
    assert.equal(zaehle(html, 'Noch keine verlässlichen Hinweise verfügbar'), 1)
  })

  test('gleiche Ländernamen bleiben getrennte Etappen', () => {
    const html = htmlAus(
      ableitung({
        ziele: [
          ziel({ stageId: 'stage-a', name: 'Rom', countryCode: 'IT', countryLabel: 'Italien' }),
          ziel({
            stageId: 'stage-b',
            position: 2,
            name: 'Rom',
            countryCode: 'IT',
            countryLabel: 'Italien',
            zeitraumText: '20. Sep. – 22. Sep.',
          }),
        ],
      }),
    )
    assert.match(html, /data-destination-stage="stage-a"/)
    assert.match(html, /data-destination-stage="stage-b"/)
    assert.equal(zaehle(html, 'Rom · Italien'), 2)
  })

  test('hatHinweise allein steuert den Kompaktpfad nicht', () => {
    const html = htmlAus(
      ableitung({
        hatHinweise: true,
        ziele: [ziel({ stageId: 'stage-fl', hatHinweise: true })],
      }),
    )
    assert.match(html, /data-destination-essentials-dichte="kompakt"/)
    assert.doesNotMatch(html, /Quellen und Details/)
  })
})

describe('Destination Essentials Density 1 — conservative full display', () => {
  test('gemischte Etappen bleiben voll sichtbar', () => {
    const html = htmlAus(
      ableitung({
        hatHinweise: true,
        ziele: [
          ziel({
            stageId: 'stage-fl',
            hatHinweise: true,
            sicherheit: bereich<DestinationSafetyLage>('critical_warning', {
              text: 'Kritischer Sicherheitshinweis',
              details: [
                {
                  id: 'safety-1',
                  titel: 'Reisewarnung',
                  text: 'Kritischer Sicherheitshinweis · aktuell',
                  kontextText: 'Betroffene Region',
                  dokumentLabel: null,
                },
              ],
              links: [quelle],
            }),
          }),
          ziel({
            stageId: 'stage-rm',
            position: 2,
            name: 'Rom',
            zeitraumText: '15. Sep. – 20. Sep.',
          }),
        ],
      }),
    )
    assert.match(html, /data-destination-essentials-dichte="voll"/)
    assert.doesNotMatch(html, /data-destination-essentials-leerhinweis/)
    assert.match(html, /Kritischer Sicherheitshinweis/)
    assert.match(html, />Einreise</)
    assert.match(html, />Sicherheit</)
    assert.match(html, />Reisezeit</)
    assert.match(html, /Quellen und Details/)
    assert.match(html, /href="https:\/\/example.test\/official"/)
    assert.match(html, /Florenz · Italien/)
    assert.match(html, /Rom · Italien/)
  })

  test('eine materielle Domain verhindert den Kompaktpfad', () => {
    const html = htmlAus(
      ableitung({
        hatHinweise: true,
        ziele: [
          ziel({
            stageId: 'stage-fl',
            hatHinweise: true,
            einreise: bereich<DestinationOfficialLage>('required', {
              text: 'Visum erforderlich',
              details: [detail],
              links: [quelle],
            }),
          }),
        ],
      }),
    )
    assert.match(html, /data-destination-essentials-dichte="voll"/)
    assert.match(html, /Visum erforderlich/)
    assert.match(html, /Quellen und Details/)
  })

  test('unknown, unavailable und stale bleiben voll sichtbar', () => {
    for (const lage of ['unknown', 'unavailable', 'stale'] as const) {
      const html = htmlAus(
        ableitung({
          hatHinweise: true,
          ziele: [
            ziel({
              stageId: 'stage-fl',
              hatHinweise: true,
              einreise: bereich<DestinationOfficialLage>(lage, {
                text: `Einreise ${lage}`,
                unvollstaendig: true,
              }),
              sicherheit: bereich<DestinationSafetyLage>(lage, {
                text: `Sicherheit ${lage}`,
                unvollstaendig: true,
              }),
              saison: bereich<DestinationSeasonalLage>(lage, {
                text: `Reisezeit ${lage}`,
                unvollstaendig: true,
              }),
            }),
          ],
        }),
      )
      assert.match(html, /data-destination-essentials-dichte="voll"/)
      assert.match(html, new RegExp(`Einreise ${lage}`))
      assert.match(html, new RegExp(`Sicherheit ${lage}`))
      assert.match(html, new RegExp(`Reisezeit ${lage}`))
      assert.doesNotMatch(html, /data-destination-essentials-leerhinweis/)
    }
  })

  test('heterogene Dokumentergebnisse bleiben sichtbar', () => {
    const html = htmlAus(
      ableitung({
        hatHinweise: true,
        ziele: [
          ziel({
            stageId: 'stage-fl',
            hatHinweise: true,
            einreise: bereich<DestinationOfficialLage>('option_abhaengig', {
              text: DESTINATION_OFFICIAL_OPTION_ABHAENGIG_TEXT,
              details: [detail],
            }),
          }),
        ],
      }),
    )
    assert.match(html, /data-destination-essentials-dichte="voll"/)
    assert.match(html, new RegExp(DESTINATION_OFFICIAL_OPTION_ABHAENGIG_TEXT))
  })

  test('widersprüchliche Details bei keine_evidence fallen auf Vollanzeige zurück', () => {
    const html = htmlAus(
      ableitung({
        hatHinweise: false,
        ziele: [
          ziel({
            stageId: 'stage-fl',
            hatHinweise: false,
            einreise: bereich<DestinationOfficialLage>('keine_evidence', {
              details: [detail],
            }),
          }),
        ],
      }),
    )
    assert.match(html, /data-destination-essentials-dichte="voll"/)
    assert.match(html, />Einreise</)
    assert.doesNotMatch(html, /data-destination-essentials-leerhinweis/)
  })

  test('widersprüchliche Links bei keine_evidence fallen auf Vollanzeige zurück', () => {
    const html = htmlAus(
      ableitung({
        ziele: [
          ziel({
            stageId: 'stage-fl',
            saison: bereich<DestinationSeasonalLage>('keine_evidence', {
              links: [quelle],
            }),
          }),
        ],
      }),
    )
    assert.match(html, /data-destination-essentials-dichte="voll"/)
    assert.match(html, />Reisezeit</)
  })

  test('unvollstaendig bei keine_evidence fällt auf Vollanzeige zurück', () => {
    const html = htmlAus(
      ableitung({
        ziele: [
          ziel({
            stageId: 'stage-fl',
            sicherheit: bereich<DestinationSafetyLage>('keine_evidence', {
              unvollstaendig: true,
            }),
          }),
        ],
      }),
    )
    assert.match(html, /data-destination-essentials-dichte="voll"/)
    assert.match(html, />Sicherheit</)
  })

  test('gemischte Sicherheit/Einreise/Reisezeit behalten Quellen-Bedienung', () => {
    const html = htmlAus(
      ableitung({
        hatHinweise: true,
        ziele: [
          ziel({
            stageId: 'stage-fl',
            hatHinweise: true,
            einreise: bereich<DestinationOfficialLage>('conditional', {
              text: 'Einreise bedingt',
              details: [detail],
              links: [quelle],
            }),
            sicherheit: bereich<DestinationSafetyLage>('important_notice', {
              text: 'Wichtiger Sicherheitshinweis',
              details: [
                {
                  id: 'safety-notice',
                  titel: 'Hinweis',
                  text: 'Wichtiger Sicherheitshinweis · aktuell',
                  kontextText: null,
                  dokumentLabel: null,
                },
              ],
            }),
            saison: bereich<DestinationSeasonalLage>('timing_check', {
              text: 'Reisezeit prüfen',
              details: [
                {
                  id: 'season-1',
                  titel: 'Monsun',
                  text: 'Reisezeit prüfen · aktuell',
                  kontextText: null,
                  dokumentLabel: null,
                },
              ],
            }),
          }),
        ],
      }),
    )
    assert.match(html, /Einreise bedingt/)
    assert.match(html, /Wichtiger Sicherheitshinweis/)
    assert.match(html, /Reisezeit prüfen/)
    assert.match(html, /<details/)
    assert.match(html, /<summary/)
    assert.match(html, /min-h-11/)
    assert.match(html, /href="https:\/\/example.test\/official"/)
    assert.match(html, /Visum: Visum erforderlich · Reisepass Schweiz/)
    assert.match(html, /Monsun: Reisezeit prüfen · aktuell/)
  })
})

describe('Destination Essentials Density 1 — scope lock', () => {
  test('Titel, Suche-Marker und keine All-clear-Sprache bleiben erhalten', () => {
    const leer = htmlAus(ableitung())
    const voll = htmlAus(
      ableitung({
        hatHinweise: true,
        ziele: [
          ziel({
            stageId: 'stage-fl',
            hatHinweise: true,
            einreise: bereich<DestinationOfficialLage>('required', { text: 'Visum erforderlich' }),
          }),
        ],
      }),
    )
    for (const html of [leer, voll]) {
      assert.match(html, /data-destination-essentials="ein"/)
      assert.match(html, /data-destination-search="nein"/)
      assert.match(html, /aria-labelledby="reiseziele-essentials-titel"/)
      assert.match(html, new RegExp(DESTINATION_ESSENTIALS_TITEL))
      assert.doesNotMatch(html, VERBOTENE_ALLCLEAR)
      assert.doesNotMatch(html, /autoFocus|autofocus/)
    }
  })

  test('Komponente bleibt ohne Provider-, DB- oder Such-Scope', () => {
    const inhalt = readFileSync(resolve('components/trips/TripWorkspaceDestinationEssentials.tsx'), 'utf8')
    assert.doesNotMatch(inhalt, /@supabase|createClient|service_role|serviceRole/)
    assert.doesNotMatch(inhalt, /fetch\(|axios|openai|duffel|amadeus/)
    assert.doesNotMatch(inhalt, /from '@\/lib\/trips\/attention'|from '@\/lib\/flights|from '@\/lib\/hotels/)
    assert.doesNotMatch(inhalt, /sucheSollMounten|sucheOeffnen/)
  })
})
