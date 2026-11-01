import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  VIATOR_HOEHE_HASH,
  VIATOR_HOEHE_MAX,
  VIATOR_HOEHE_SKRIPT,
  VIATOR_PARTNER_ID,
  VIATOR_SANDBOX,
  VIATOR_SPRACHE,
  VIATOR_WAEHRUNG,
  VIATOR_WIDGET_REF,
  VIATOR_WIDGET_SRC,
  viatorEmbedAntwort,
  viatorEmbedDokument,
  viatorEmbedGerahmt,
  viatorEmbedPfad,
  viatorHoeheAnnehmen,
  viatorParameterLesen,
} from '@/lib/activities/viator-widget/dokument'
import { viatorSuchname } from '@/lib/activities/viator-widget/suche'

function gerahmt(suche: string): Request {
  return new Request(`https://jetnity.test/embed/viator${suche}`, {
    headers: {
      'sec-fetch-dest': 'iframe',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
    },
  })
}

describe('Viator-Widget', () => {
  test('nur ein öffentlicher Name öffnet das fest hinterlegte Widget', () => {
    assert.equal(viatorSuchname('Bangkok'), 'Bangkok')
    assert.equal(viatorSuchname('Ko Chang'), 'Ko Chang')
    assert.equal(viatorSuchname('Rome'), 'Rome')
    assert.equal(viatorSuchname('geonames:1609350'), null)
    assert.equal(viatorSuchname('https://example.test'), null)
    assert.equal(viatorSuchname('Bangkok', ['trip-synth-th']), 'Bangkok')
    assert.equal(viatorSuchname('trip-synth-th', ['trip-synth-th']), null)
    assert.equal(viatorParameterLesen('?name=Bangkok&currency=EUR'), null)
    assert.equal(viatorParameterLesen('?name=Bangkok'), 'Bangkok')
    assert.equal(viatorEmbedPfad('Ko Chang'), '/embed/viator?name=Ko+Chang')
    const antwort = viatorEmbedAntwort(gerahmt('?name=Lissabon'))
    const html = viatorEmbedDokument('Lissabon')
    assert.equal(antwort.status, 200)
    assert.match(html, new RegExp(`data-vi-partner-id="${VIATOR_PARTNER_ID}"`))
    assert.match(html, new RegExp(`data-vi-widget-ref="${VIATOR_WIDGET_REF}"`))
    assert.match(html, /data-vi-search-term="Lissabon"/)
    assert.match(html, /data-vi-currency="CHF"/)
    assert.match(html, /data-vi-language="de"/)
    assert.match(html, new RegExp(VIATOR_WIDGET_SRC.replaceAll('/', '\\/')))
    assert.equal(html.includes('data-vi-travel-date'), false)
    assert.equal(html.includes('data-vi-travellers'), false)
    assert.equal(html.includes('U00597509'), false)
    assert.equal(html.includes('W-d221060c'), false)
    const hash = `sha256-${createHash('sha256').update(VIATOR_HOEHE_SKRIPT).digest('base64')}`
    assert.equal(hash, VIATOR_HOEHE_HASH)
    assert.equal(VIATOR_HOEHE_MAX, 12000)
    assert.equal(VIATOR_SPRACHE, 'de')
    assert.equal(VIATOR_WAEHRUNG, 'CHF')
    assert.equal(viatorEmbedGerahmt(gerahmt('?name=Bangkok')), true)
    assert.equal(viatorEmbedGerahmt(new Request('https://jetnity.test/embed/viator?name=Bangkok')), false)
    assert.equal(VIATOR_HOEHE_SKRIPT.includes('allow-same-origin'), false)
    assert.equal(VIATOR_HOEHE_SKRIPT.includes('.src='), false)
    assert.match(VIATOR_HOEHE_SKRIPT, /vi-wm/)
    assert.match(VIATOR_SANDBOX, /allow-scripts/)
    assert.equal(VIATOR_SANDBOX.includes('allow-same-origin'), false)
    assert.match(antwort.headers.get('content-security-policy') ?? '', /script-src/)
    assert.equal((antwort.headers.get('content-security-policy') ?? '').includes('allow-same-origin'), false)
  })

  test('ein direkt geöffnetes Dokument lädt das Widget nicht', async () => {
    const direkt = viatorEmbedAntwort(new Request('https://jetnity.test/embed/viator?name=Bangkok'))
    const text = await direkt.text()
    assert.equal(text.includes(VIATOR_WIDGET_SRC), false)
    assert.equal(text.includes(VIATOR_PARTNER_ID), false)
    assert.match(text, /nur in der Reise/)
    const rahmen = { contentWindow: {}, style: { height: '' } } as HTMLIFrameElement
    assert.equal(
      viatorHoeheAnnehmen(rahmen, {
        origin: 'https://www.viator.com',
        source: rahmen.contentWindow,
        data: { quelle: 'jetnity-viator-rahmen', art: 'hoehe', px: 480 },
      }),
      false,
    )
    assert.equal(
      viatorHoeheAnnehmen(rahmen, {
        origin: 'null',
        source: rahmen.contentWindow,
        data: { quelle: 'jetnity-viator-rahmen', art: 'hoehe', px: 480 },
      }),
      true,
    )
    assert.equal(rahmen.style.height, '480px')
  })
})
