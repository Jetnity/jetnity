import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { leistungsstand, W3_STATUS_TEXT, preisstandText, suchzeitText } from './angebot-buchung-anzeige'
import { LeistungsStatus, GespeicherterPreisstand, PreisstandHinweis } from '@/components/trips/LeistungsStatus'
import { kostenStand } from '@/lib/trips/kostenbild'
import { fixture } from '@/scripts/direct-trip-editing-1/fixture'
import type { TripItem } from '@/types/trips'

test('W3: four categories do not infer a provider booking from names, links, amounts or timestamps', () => {
 const example = fixture().days[3].items[0]!
 for (const kind of ['flight','stay','rental_car','activity'] as const) {
  const punkt:TripItem = {...example,kind,bookingStatus:'unconfirmed',bookingSource:null,priceAmount:79,priceCurrency:'CHF',provider:'viator',externalRef:'CONFIRMED',bookingUrl:'https://www.viator.com/',bookingConfirmedAt:'2026-11-24T12:00:00Z'}
  const snapshot=structuredClone(punkt)
  assert.equal(leistungsstand(punkt),'unverbindliches_angebot')
  assert.equal(kostenStand(punkt),'ausgewaehlt')
  assert.deepEqual(punkt,snapshot)
  assert.equal(leistungsstand({...punkt, bookingStatus:'booked'}),'unverbindliches_angebot')
  assert.equal(leistungsstand({...punkt,bookingStatus:'booked',bookingSource:'provider' as unknown as TripItem['bookingSource']}),'unverbindliches_angebot')
  const own={...punkt, bookingStatus:'booked',bookingSource:'user'} as const
  assert.equal(leistungsstand(own),kind==='activity'?'unverbindliches_angebot':'vom_nutzer_markiert')
 }
 assert.equal(W3_STATUS_TEXT.anbieter_bestaetigt,'Vom Anbieter bestätigte Buchung')
})

test('W3: render status and unknown price separately without fake price, timestamp or confirmation', () => {
 const offer=renderToStaticMarkup(createElement(LeistungsStatus,{stand:'unverbindliches_angebot'}))
 const own=renderToStaticMarkup(createElement(LeistungsStatus,{stand:'vom_nutzer_markiert'}))
 assert.match(offer,/Unverbindliches Angebot – nicht gebucht/)
 assert.match(offer,/data-status-siegel="gewaehlt"/)
 assert.match(own,/Von dir als gebucht markiert – nicht vom Anbieter bestätigt/)
 assert.match(own,/data-status-siegel="gebucht"/)
 assert.doesNotMatch(offer+own,/Vom Anbieter bestätigte Buchung/)
 const saved=renderToStaticMarkup(createElement(GespeicherterPreisstand,{punkt:{priceAmount:79,priceCurrency:'CHF'}}))
 assert.match(saved,/Gespeicherter Betrag/)
 assert.match(saved,/Preisstand unbekannt/)
 assert.match(saved,/Preis kann sich ändern/)
 const missing=renderToStaticMarkup(createElement(GespeicherterPreisstand,{punkt:{priceAmount:null,priceCurrency:null}}))
 assert.doesNotMatch(missing,/Gespeicherter Betrag/)
 assert.match(missing,/Preisstand unbekannt/)
})

test('W3: provider search timestamp is explicit; missing or invalid values never become now', () => {
 const zeit=Date.parse('2026-11-24T12:30:00Z')
 assert.match(suchzeitText(zeit)!,/13:30/)
 assert.match(preisstandText(zeit),/Preis aus Suche vom/)
 assert.match(preisstandText(zeit),/Schweiz/)
 for(const invalid of [null,undefined,NaN,Infinity,-1,0,1e20]) assert.equal(preisstandText(invalid),'Preisstand unbekannt')
 const html=renderToStaticMarkup(createElement(PreisstandHinweis,{suchzeit:zeit}))
 assert.match(html,/Preis aus Suche vom/)
 assert.match(html,/Preis kann sich ändern/)
})

test('W3: existing workspace surfaces use shared display and never claim refreshed rental detail timestamp', () => {
 for(const path of ['TripWorkspacePlan.tsx','TripIntegratedDay.tsx','reiseplan/EtappenTage.tsx','TripWorkspaceDetail.tsx','TripWorkspaceKosten.tsx','organisieren/OrganisierenBestand.tsx','FlugBestand.tsx','UnterkunftBestand.tsx','MietwagenBereich.tsx','FlugKarte.tsx','HotelKarte.tsx','AktivitaetKarte.tsx','rental/Offers.tsx','ViatorPruefung.tsx']) assert.match(readFileSync('components/trips/'+path,'utf8'), /LeistungsStatus/,path)
 const rental=readFileSync('components/trips/rental/DiscoverCarsMietwagen.tsx','utf8')
 assert.match(rental,/data\.result\.searchedAt/)
 assert.match(rental,/next\.delete\(data\.offer\.offer_id\)/)
 assert.match(rental,/suchzeit=\{preiszeiten\.get\(o\.offer_id\)\}/)
 assert.match(readFileSync('components/trips/organisieren/Organisieren.tsx','utf8'),/ExterneAngeboteHinweis/)
 assert.match(readFileSync('components/trips/ReiseAenderungBuchungshinweise.tsx','utf8'),/Preisstand unbekannt/)
})
