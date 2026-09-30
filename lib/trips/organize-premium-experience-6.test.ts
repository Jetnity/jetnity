import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ORGANISIEREN_EINGABE_KLASSE,
  detailStatusfolge,
  klauselnOhneWiederholung,
} from '@/lib/trips/organize-premium-experience-6'

test('dieselbe Klausel erscheint nur einmal', () => {
  assert.equal(klauselnOhneWiederholung(['Noch offen'], 'Noch offen · kein Pflichtpunkt'), 'kein Pflichtpunkt')
  assert.equal(klauselnOhneWiederholung(['Noch offen', 'kein Pflichtpunkt'], 'Noch offen'), null)
  assert.equal(klauselnOhneWiederholung([], '   '), null)
})

test('Desktop-Leiste nimmt die kurze Lage, das Detail behält die übrigen Fakten', () => {
  const folge = detailStatusfolge({
    eyebrow: 'Noch offen',
    text: 'Zürich → Ubud · Noch kein Flug ausgewählt',
    nebenzeile: 'Noch offen · kein Pflichtpunkt',
    naechsterSchritt: 'Du kannst vorhandene Einträge prüfen oder eine Suche ausdrücklich öffnen.',
    lageInDerLeiste: 'Noch offen',
  })

  assert.equal(folge.zustand, 'Zürich → Ubud · Noch kein Flug ausgewählt')
  assert.equal(folge.hinweis, 'kein Pflichtpunkt')
  assert.equal(folge.eyebrow, null)
  assert.match(folge.naechstes ?? '', /ausdrücklich öffnen/)
})

test('ohne benachbarte Leiste bleibt die Lage im Detail', () => {
  const folge = detailStatusfolge({
    eyebrow: 'Noch offen',
    text: 'Noch keine Aktivität geplant',
    nebenzeile: 'Noch offen · kein Pflichtpunkt',
    naechsterSchritt: 'Aktivitäten sind freiwillig. Eine Suche startet erst, wenn du sie ausdrücklich öffnest.',
    lageInDerLeiste: null,
  })

  assert.equal(folge.zustand, 'Noch keine Aktivität geplant')
  assert.equal(folge.hinweis, 'Noch offen · kein Pflichtpunkt')
  assert.equal(folge.eyebrow, null)
  assert.match(folge.naechstes ?? '', /freiwillig/)
  assert.match(folge.naechstes ?? '', /ausdrücklich öffnest/)
})

test('eine Lage, die schon der Zustand ist, wird nicht daneben wiederholt', () => {
  const folge = detailStatusfolge({
    eyebrow: 'Noch unklar',
    text: 'Noch unklar',
    nebenzeile: 'Noch unklar',
    naechsterSchritt: 'Der Stand ist noch unklar. Prüfe Reisedaten und vorhandene Einträge.',
    lageInDerLeiste: 'Noch unklar',
  })

  assert.equal(folge.zustand, null)
  assert.equal(folge.hinweis, null)
  assert.equal(folge.eyebrow, null)
  assert.match(folge.naechstes ?? '', /Reisedaten/)
})

test('Flugabdeckung und Optional bleiben eigene Fakten', () => {
  const abgedeckt = detailStatusfolge({
    eyebrow: 'Hinweis',
    text: 'Durch den vorhandenen Flug abgedeckt',
    nebenzeile: 'Kein bekannter offener Punkt · kein Pflichtpunkt · durch den vorhandenen Flug abgedeckt',
    naechsterSchritt: 'Diese Strecke ist durch einen vorhandenen Flug abgedeckt. Es fehlt keine Bodenverbindung.',
    lageInDerLeiste: null,
  })
  assert.equal(abgedeckt.hinweis, 'Kein bekannter offener Punkt · kein Pflichtpunkt')
  assert.equal(abgedeckt.eyebrow, 'Hinweis')
  assert.match(abgedeckt.naechstes ?? '', /Bodenverbindung/)

  const optional = detailStatusfolge({
    eyebrow: 'Optional',
    text: '1 Aktivität geplant',
    nebenzeile: 'Kein bekannter offener Punkt · kein Pflichtpunkt',
    naechsterSchritt: 'Aktivitäten sind freiwillig. Eine Suche startet erst, wenn du sie ausdrücklich öffnest.',
    lageInDerLeiste: 'Kein bekannter offener Punkt',
  })
  assert.equal(optional.eyebrow, 'Optional')
  assert.equal(optional.hinweis, 'kein Pflichtpunkt')
  assert.equal(optional.zustand, '1 Aktivität geplant')
})

test('kompakte Eingaben bleiben auf Touch mindestens 16px', () => {
  assert.match(ORGANISIEREN_EINGABE_KLASSE, /text-base/)
  assert.match(ORGANISIEREN_EINGABE_KLASSE, /pointer-fine:text-sm/)
  assert.equal(ORGANISIEREN_EINGABE_KLASSE.includes('sm:text-sm'), false)
})
