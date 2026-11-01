import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import DiscoverCarsSuche from '@/components/trips/DiscoverCarsSuche'
import MietwagenBereich from '@/components/trips/MietwagenBereich'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import { rentalCarProviderAus } from '@/lib/rental-cars/factory'

describe('DiscoverCars Suche vor der bewussten Anzeige', () => {
  test('keine Anbieterquelle, klare Übergabe und jederzeit geschützter Partnerlink', () => {
    const html = renderToStaticMarkup(createElement(DiscoverCarsSuche))
    assert.match(html, /Suchformular laden/)
    assert.match(html, /Fahrzeuge, Preise und Mietbedingungen/)
    assert.match(html, /anschließend bei DiscoverCars/)
    assert.match(html, /IP-Adresse/)
    assert.match(html, /Cookies/)
    assert.match(html, /Affiliate-Partner/)
    assert.match(html, /href="https:\/\/www\.discovercars\.com\/\?a_aid=jetnity" target="_blank" rel="noopener noreferrer sponsored" referrerPolicy="no-referrer"/i)
    assert.match(html, /data-discovercars-zustand="ruhend"/)
    assert.doesNotMatch(html, /<iframe|<script|<img|<link|\ssrc=|Suvarnabhumi|BKK/)
    assert.match(html, /min-h-11/)
    assert.match(html, /focus-visible:ring-4/)
  })

  test('Bestand und manuelle Erfassung bleiben; private Reiseinhalte gelangen nicht in die Suche', () => {
    const reise = beispielreise({ id: 'trip-uuid-geheim', clientRef: 'client-ref-geheim', title: 'Privater Titel', currency: 'THB', travellers: 4 })
    const html = renderToStaticMarkup(createElement(MietwagenBereich, { reise, onManuellAnlegen: async () => null }))
    assert.match(html, /Bestand und Status/)
    assert.match(html, /Manueller Mietwagen/)
    const section = html.slice(html.indexOf('<section aria-label="Mietwagensuche"'), html.indexOf('</section>', html.indexOf('<section aria-label="Mietwagensuche"')))
    assert.match(section, /Mietwagen finden/)
    for (const value of ['trip-uuid-geheim', 'client-ref-geheim', 'Privater Titel', 'THB', 'a_bid', 'aff_data1']) assert.equal(section.includes(value), false, value)
    assert.equal(rentalCarProviderAus(), null)
  })

  test('verborgener Mietwagenbereich rendert keine Suchkomponente', () => {
    const html = renderToStaticMarkup(createElement(MietwagenBereich, { reise: beispielreise(), sichtbar: false }))
    assert.match(html, /Bestand und Status/)
    assert.doesNotMatch(html, /data-discovercars-suche|discovercars\.com|<iframe/)
  })
})
