import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, type Browser, type Page } from 'playwright'

import { besuchVerwaltungDichteFixture } from '@/lib/account/account-world-visit-management-premium-1-fixture'
import { BESUCHE_COPY } from '@/lib/account/besuche-copy'
import { BESUCH_MELDUNG } from '@/lib/account/besuche-eingabe'
import type { Besuch } from '@/lib/account/besuche'

type Aufruf = { id: number; name: string; argument: { id?: string; placeId?: string | null; countryCode?: string | null; jahr?: number | null; monat?: number | null; tag?: number | null } }
type Props = { problem: { status: 500 | 503; message: string } | null; besuche: readonly Besuch[]; tripProblem: { status: 500 | 503; message: string } | null }

declare global {
  interface Window {
    __visitSetzen: (props: Props) => void
    __visitAufrufe: Aufruf[]
    __visitRefreshes: number[]
    __visitRefreshMode: 'resolve' | 'reject' | 'defer'
    __visitErledigen: (id: number, wert: unknown) => void
    __visitAblehnen: (id: number) => void
    __visitWirf: boolean
    __visitSofort: unknown
    __visitKarten: { lage: string; besucht: string } | null
  }
}

const ok = { ok: true, wert: null }
const SCHREIBFEHLER = 'Dieser Besuch konnte nicht gespeichert werden.'
const SCHREIBFEHLER_AUSFALL = 'Dein Besuch konnte gerade nicht gespeichert werden. Bitte versuche es in einem Moment erneut.'

function id(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

function besuch(n: number, extra: Partial<Besuch> = {}): Besuch {
  return {
    id: id(n),
    placeId: 'geonames:2267057',
    placeLabel: 'Lissabon',
    countryCode: 'PT',
    latitude: 38.7,
    longitude: -9.1,
    jahr: 2020,
    monat: null,
    tag: null,
    erstelltAm: '2026-01-01T00:00:00.000Z',
    ...extra,
  }
}

let browser: Browser | null = null
const origin = process.env.VISIT_HARNESS_ORIGIN
const screens = process.env.VISIT_SCREENS

function brauchtBrowser() {
  if (!origin) throw new Error('VISIT_HARNESS_ORIGIN fehlt')
}

async function seite(): Promise<Page> {
  brauchtBrowser()
  const page = await browser!.newPage()
  await page.clock.install()
  await page.goto(origin!)
  await page.waitForSelector('[data-account-besuche]')
  return page
}

async function setzen(page: Page, props: Props) {
  await page.evaluate((wert) => window.__visitSetzen(wert), props)
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 40)))
}

async function aufrufe(page: Page): Promise<Aufruf[]> {
  return page.evaluate(() => window.__visitAufrufe.map((eintrag) => ({ id: eintrag.id, name: eintrag.name, argument: { ...(eintrag.argument as object) } })))
}

async function text(page: Page): Promise<string> {
  return page.locator('body').innerText()
}

type Aufnahme = {
  file: string
  capture: 'element'
  viewport: { width: number; height: number }
  rootFontPx: 32
  state: string
  target: string
  overflow: { verwaltung: number; dokument: number }
}

const aufnahmen: Aufnahme[] = []

type KnopfBericht = {
  text: string
  breit: number
  hoch: number
  imFormular: boolean
  inKarte: boolean
  textImKnopf: boolean
  ueberhangRechts: number
  bedecktVon: number
}

type HaltBericht = {
  editor: { fuss: string; formularInKarte: boolean; knoepfe: KnopfBericht[] }
  anlage: { fuss: string; formularInKarte: boolean; knoepfe: KnopfBericht[] }
}

async function rahmen(page: Page, name: string, state: string, scrolledTo: string, aufnehmenBei: number[] = [320, 1440]) {
  if (!screens) return
  mkdirSync(screens, { recursive: true })
  const ziel = page.locator(scrolledTo).first()
  for (const breite of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width: breite, height: 900 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    const mass = await page.evaluate(() => {
      const verwaltung = document.querySelector('[data-besuch-verwaltung]') as HTMLElement
      return {
        verwaltung: verwaltung.scrollWidth - verwaltung.clientWidth,
        dokument: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    })
    assert.ok(mass.verwaltung <= 1, `${name} Verwaltung läuft bei ${breite} über: ${mass.verwaltung}`)
    console.log(`css ${name} ${breite} verwaltung=${mass.verwaltung} dokument=${mass.dokument}`)
    if (aufnehmenBei.includes(breite)) {
      const file = `${name}-${breite}.png`
      await ziel.screenshot({ path: `${screens}/${file}`, animations: 'disabled' })
      aufnahmen.push({
        file,
        capture: 'element',
        viewport: { width: breite, height: 900 },
        rootFontPx: 32,
        state,
        target: scrolledTo,
        overflow: mass,
      })
    }
  }
}

async function fussHalten(page: Page) {
  for (const breite of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width: breite, height: 900 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '32px' })
    const halt = await page.evaluate<HaltBericht>(`(() => {
      const paare = [
        ['editor', '[data-besuch-editor-epoche] form', 'article'],
        ['anlage', '[data-besuch-anlage="offen"] form', '[data-besuch-anlage="offen"]'],
      ]
      const ergebnis = {}
      for (const [name, formSelektor, kartenSelektor] of paare) {
        const form = document.querySelector(formSelektor)
        const karte = form.closest(kartenSelektor)
        const formular = form.getBoundingClientRect()
        const kartenKasten = karte.getBoundingClientRect()
        const fuss = form.querySelector('[data-besuch-formular-fuss]')
        const knoepfe = []
        for (const knopf of form.querySelectorAll('button')) {
          const k = knopf.getBoundingClientRect()
          const eigene = knopf.closest('article')
          let bedecktVon = 0
          for (const artikel of document.querySelectorAll('article[data-besuch]')) {
            if (artikel === eigene) continue
            const a = artikel.getBoundingClientRect()
            if (k.left < a.right - 1 && k.right > a.left + 1 && k.top < a.bottom - 1 && k.bottom > a.top + 1) bedecktVon += 1
          }
          knoepfe.push({
            text: (knopf.textContent || '').replace(/\\s+/g, ' ').trim(),
            breit: k.width,
            hoch: k.height,
            imFormular: k.width > 0 && k.height > 0 && k.left >= formular.left - 1 && k.top >= formular.top - 1 && k.right <= formular.right + 1 && k.bottom <= formular.bottom + 1,
            inKarte: k.width > 0 && k.height > 0 && k.left >= kartenKasten.left - 1 && k.top >= kartenKasten.top - 1 && k.right <= kartenKasten.right + 1 && k.bottom <= kartenKasten.bottom + 1,
            textImKnopf: knopf.scrollWidth <= knopf.clientWidth + 1 && knopf.scrollHeight <= knopf.clientHeight + 1,
            ueberhangRechts: Math.round((k.right - kartenKasten.right) * 100) / 100,
            bedecktVon,
          })
        }
        ergebnis[name] = {
          fuss: getComputedStyle(fuss).flexDirection,
          formularInKarte: formular.left >= kartenKasten.left - 1 && formular.right <= kartenKasten.right + 1 && formular.top >= kartenKasten.top - 1 && formular.bottom <= kartenKasten.bottom + 1,
          knoepfe,
        }
      }
      return ergebnis
    })()`)
    assert.equal(halt.editor.fuss, 'column', `Editor-Fuss bei ${breite} ist ${halt.editor.fuss}`)
    assert.equal(halt.editor.formularInKarte, true, `Editor-Formular liegt bei ${breite} ausserhalb der Karte`)
    assert.equal(halt.anlage.fuss, breite >= 640 ? 'row' : 'column', `Anlage-Fuss bei ${breite} ist ${halt.anlage.fuss}`)
    assert.equal(halt.anlage.formularInKarte, true, `Anlage-Formular liegt bei ${breite} ausserhalb seines Bereichs`)
    for (const [name, gruppe] of [['editor', halt.editor], ['anlage', halt.anlage]] as const) {
      assert.ok(gruppe.knoepfe.length > 0, `${name} hat bei ${breite} keinen Knopf`)
      for (const knopf of gruppe.knoepfe) {
        assert.equal(knopf.imFormular, true, `${name} ${knopf.text} liegt bei ${breite} ausserhalb des Formulars, Überhang ${knopf.ueberhangRechts}`)
        assert.equal(knopf.inKarte, true, `${name} ${knopf.text} liegt bei ${breite} ausserhalb der Karte, Überhang ${knopf.ueberhangRechts}`)
        assert.equal(knopf.textImKnopf, true, `${name} ${knopf.text} wird bei ${breite} abgeschnitten`)
        assert.equal(knopf.bedecktVon, 0, `${name} ${knopf.text} wird bei ${breite} von ${knopf.bedecktVon} Nachbarkarten überdeckt`)
        assert.ok(knopf.breit > 0 && knopf.hoch > 0)
        console.log(`halt ${name} ${breite} ${knopf.text} ueberhangRechts=${knopf.ueberhangRechts} breit=${Math.round(knopf.breit)} hoch=${Math.round(knopf.hoch)}`)
      }
    }
    assert.ok(halt.editor.knoepfe.some((knopf) => knopf.text === BESUCHE_COPY.aendernAktion))
    assert.ok(halt.editor.knoepfe.some((knopf) => knopf.text === BESUCHE_COPY.abbrechen))
    assert.ok(halt.anlage.knoepfe.some((knopf) => knopf.text === BESUCHE_COPY.anlegenAktion))
  }
}

async function landWaehlen(page: Page) {
  await page.locator('[data-besuch-anlage="offen"] select').first().selectOption('PT')
}

async function anlegen(page: Page) {
  if (await page.locator('[data-besuch-anlage="offen"]').count() === 0) {
    await page.getByRole('button', { name: BESUCHE_COPY.hinzufuegenAktion }).click()
  }
  await landWaehlen(page)
}

before(async () => {
  if (!origin) return
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  await browser?.close()
  if (screens && aufnahmen.length > 0) writeFileSync(`${screens}/manifest.json`, `${JSON.stringify(aufnahmen, null, 2)}\n`)
})

test('eine lokale Lesepanne schickt nichts', async () => {
  const page = await seite()
  await setzen(page, { problem: null, besuche: [], tripProblem: null })
  await page.locator('[data-besuch-anlage="offen"] button[type="submit"]').click()
  assert.equal((await aufrufe(page)).length, 0)
  assert.match(await text(page), new RegExp(BESUCH_MELDUNG.ohneZiel))
  await page.close()
})

test('dieselbe Runde bestätigt nur einmal, per requestSubmit', async () => {
  const page = await seite()
  await setzen(page, { problem: null, besuche: [], tripProblem: null })
  await anlegen(page)
  await page.evaluate(() => {
    const form = document.querySelector('[data-besuch-anlage="offen"] form') as HTMLFormElement
    form.requestSubmit()
    form.requestSubmit()
  })
  assert.equal((await aufrufe(page)).length, 1)
  await page.close()
})

test('zurückgegebene Absagen, Wurf und Bruch bleiben unbestätigt', async () => {
  const faelle: unknown[] = [
    { ok: false, meldung: SCHREIBFEHLER },
    { ok: false, meldung: SCHREIBFEHLER_AUSFALL },
    { ok: false, meldung: BESUCH_MELDUNG.ohneZiel },
    { ok: true, wert: null, id: 'keine-id' },
  ]
  for (const wert of faelle) {
    const page = await seite()
    await setzen(page, { problem: null, besuche: [], tripProblem: null })
    await anlegen(page)
    await page.evaluate((sofort) => { window.__visitSofort = sofort }, wert)
    await page.locator('[data-besuch-anlage="offen"] button[type="submit"]').click()
    assert.equal((await aufrufe(page)).length, 1)
    assert.match(await text(page), /Es ist unklar/)
    assert.equal((await text(page)).includes('neu gelesen'), false)
    await page.getByRole('button', { name: BESUCHE_COPY.erneutSenden }).click()
    assert.equal((await aufrufe(page)).length, 2)
    await page.close()
  }
  const page = await seite()
  await setzen(page, { problem: null, besuche: [], tripProblem: null })
  await anlegen(page)
  await page.evaluate(() => { window.__visitWirf = true })
  await page.locator('[data-besuch-anlage="offen"] button[type="submit"]').click()
  assert.match(await text(page), /Es ist unklar/)
  const abgelehnt = await seite()
  await setzen(abgelehnt, { problem: null, besuche: [], tripProblem: null })
  await anlegen(abgelehnt)
  await abgelehnt.locator('[data-besuch-anlage="offen"] button[type="submit"]').click()
  const nummer = (await aufrufe(abgelehnt))[0]!.id
  await abgelehnt.evaluate((aufruf) => window.__visitAblehnen(aufruf), nummer)
  assert.match(await text(abgelehnt), /Es ist unklar/)
  await page.close()
  await abgelehnt.close()
})

test('Annahme lässt die Liste offen und wählt keine Zeile', async () => {
  const page = await seite()
  const erste = [besuch(1), besuch(2, { placeLabel: 'Porto', placeId: 'geonames:2735943' })]
  await setzen(page, { problem: null, besuche: erste, tripProblem: null })
  await anlegen(page)
  await page.evaluate((sofort) => { window.__visitSofort = sofort }, ok)
  await page.locator('[data-besuch-anlage="offen"] button[type="submit"]').click()
  const inhalt = await text(page)
  assert.match(inhalt, /Besuch bestätigt\./)
  assert.match(inhalt, /Ob die Liste schon passt/)
  assert.equal(inhalt.includes('einer Zeile zugeordnet'), false)
  assert.equal(await page.locator('[data-besuch-ausgewaehlt]').count(), 0)
  assert.equal((await page.evaluate(() => window.__visitRefreshes.length)), 1)
  await setzen(page, { problem: null, besuche: erste, tripProblem: null })
  assert.equal((await text(page)).includes('Die angezeigte Liste hat sich geändert.'), false)
  await setzen(page, { problem: null, besuche: [...erste, besuch(3)], tripProblem: null })
  assert.match(await text(page), /Die angezeigte Liste hat sich geändert\./)
  await page.close()
})

test('ein vorher gesehener Stempel wird nicht als neu bezeichnet', async () => {
  const page = await seite()
  const erste = [besuch(1)]
  const spaeter = [besuch(1), besuch(4, { placeLabel: 'Rom', placeId: 'geonames:3169070' })]
  await setzen(page, { problem: null, besuche: erste, tripProblem: null })
  await page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await page.locator('article input[type="number"]').first().fill('2019')
  await page.locator('article button[type="submit"]').click()
  await setzen(page, { problem: null, besuche: spaeter, tripProblem: null })
  const nummer = (await aufrufe(page))[0]!.id
  await page.evaluate((aufruf) => window.__visitErledigen(aufruf, { ok: true, wert: null }), nummer)
  await setzen(page, { problem: null, besuche: spaeter, tripProblem: null })
  assert.equal((await text(page)).includes('Die angezeigte Liste hat sich geändert.'), false)
  assert.match(await text(page), /Dieser Besuch steht in der Liste\./)
  await page.close()
})

test('ein sauberer Editor übernimmt, ein schmutziger nicht', async () => {
  const page = await seite()
  const original = [besuch(1)]
  await setzen(page, { problem: null, besuche: original, tripProblem: null })
  await page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await setzen(page, { problem: null, besuche: [besuch(1, { jahr: 2019 })], tripProblem: null })
  assert.equal(await page.locator('article input[type="number"]').first().inputValue(), '2019')
  assert.equal((await aufrufe(page)).length, 0)
  await page.close()
  const schmutzig = await seite()
  await setzen(schmutzig, { problem: null, besuche: original, tripProblem: null })
  await schmutzig.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await schmutzig.locator('article input[type="number"]').first().fill('2018')
  await setzen(schmutzig, { problem: null, besuche: [besuch(1, { jahr: 2017 })], tripProblem: null })
  assert.equal(await schmutzig.locator('article input[type="number"]').first().inputValue(), '2018')
  assert.match(await text(schmutzig), /Dein Entwurf bleibt erhalten/)
  await schmutzig.locator('article button[type="submit"]').click()
  assert.equal((await aufrufe(schmutzig)).length, 0)
  await schmutzig.getByRole('button', { name: BESUCHE_COPY.entwurfSpeichern }).click()
  const gesendet = await aufrufe(schmutzig)
  assert.equal(gesendet.length, 1)
  assert.equal(gesendet[0]?.argument.jahr, 2018)
  await schmutzig.close()
})

test('Widerruf übernimmt geänderte Felder nicht', async () => {
  const page = await seite()
  await setzen(page, { problem: null, besuche: [besuch(1)], tripProblem: null })
  await page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  await setzen(page, { problem: null, besuche: [besuch(1, { jahr: 2016 })], tripProblem: null })
  await page.getByRole('button', { name: BESUCHE_COPY.widerrufenBestaetigen }).click()
  assert.equal((await aufrufe(page)).length, 0)
  assert.match(await text(page), /Bitte bestätige den Widerruf erneut/)
  await page.getByRole('button', { name: BESUCHE_COPY.erneutBestaetigen }).click()
  await page.getByRole('button', { name: BESUCHE_COPY.widerrufenBestaetigen }).click()
  assert.equal((await aufrufe(page)).length, 1)
  assert.deepEqual((await aufrufe(page))[0]?.argument, { id: id(1) })
  await page.close()
})

test('Änderung und Widerruf unterwegs bleiben nach der Annahme offen', async () => {
  const page = await seite()
  await setzen(page, { problem: null, besuche: [besuch(1)], tripProblem: null })
  await page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await page.locator('article input[type="number"]').first().fill('2015')
  await page.locator('article button[type="submit"]').click()
  await setzen(page, { problem: null, besuche: [besuch(1, { jahr: 2014 })], tripProblem: null })
  const nummer = (await aufrufe(page))[0]!.id
  await page.evaluate((aufruf) => window.__visitErledigen(aufruf, { ok: true, wert: null }), nummer)
  await page.locator('article input[type="number"]').first().waitFor()
  assert.equal(await page.locator('article input[type="number"]').first().inputValue(), '2015')
  assert.match(await text(page), /Dein Entwurf bleibt erhalten/)
  assert.equal((await aufrufe(page))[0]?.argument.jahr, 2015)
  await page.close()

  const widerruf = await seite()
  await setzen(widerruf, { problem: null, besuche: [besuch(1)], tripProblem: null })
  await widerruf.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  const vorher = await widerruf.locator('[data-besuch-bestaetigung]').getAttribute('data-besuch-bestaetigung')
  await widerruf.getByRole('button', { name: BESUCHE_COPY.widerrufenBestaetigen }).click()
  await setzen(widerruf, { problem: null, besuche: [besuch(1, { jahr: 2013 })], tripProblem: null })
  const laufend = (await aufrufe(widerruf))[0]!.id
  await widerruf.evaluate((aufruf) => window.__visitErledigen(aufruf, { ok: true, wert: null }), laufend)
  assert.equal(await widerruf.locator('[data-besuch-bestaetigung]').count(), 1)
  assert.notEqual(await widerruf.locator('[data-besuch-bestaetigung]').getAttribute('data-besuch-konflikt'), 'keiner')
  assert.equal((await aufrufe(widerruf)).length, 1)
  assert.notEqual(vorher, null)
  await widerruf.close()
})

test('eine neue Widerrufsabsicht bleibt, wenn die alte Antwort kommt', async () => {
  const page = await seite()
  const zeilen = [besuch(1), besuch(2, { placeLabel: 'Porto', placeId: 'geonames:2735943' })]
  await setzen(page, { problem: null, besuche: zeilen, tripProblem: null })
  await page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  await page.getByRole('button', { name: BESUCHE_COPY.widerrufenBestaetigen }).click()
  await page.locator(`[data-besuch="${id(2)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  const b = await page.locator('[data-besuch-bestaetigung]').getAttribute('data-besuch-bestaetigung')
  const nurB = await seite()
  await setzen(nurB, { problem: null, besuche: zeilen, tripProblem: null })
  await nurB.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  await nurB.getByRole('button', { name: BESUCHE_COPY.widerrufenBestaetigen }).click()
  await nurB.locator(`[data-besuch="${id(2)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  const offenB = await nurB.locator('[data-besuch-bestaetigung]').getAttribute('data-besuch-bestaetigung')
  const nummerB = (await aufrufe(nurB))[0]!.id
  await nurB.evaluate((aufruf) => window.__visitErledigen(aufruf, { ok: true, wert: null }), nummerB)
  await nurB.locator('[data-besuch-bestaetigung]').waitFor()
  assert.equal(await nurB.locator('[data-besuch-bestaetigung]').getAttribute('data-besuch-bestaetigung'), offenB)
  assert.equal((await aufrufe(nurB)).length, 1)
  await page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  const neu = await page.locator('[data-besuch-bestaetigung]').getAttribute('data-besuch-bestaetigung')
  assert.notEqual(neu, b)
  const nummer = (await aufrufe(page))[0]!.id
  await page.evaluate((aufruf) => window.__visitErledigen(aufruf, { ok: true, wert: null }), nummer)
  assert.equal(await page.locator('[data-besuch-bestaetigung]').getAttribute('data-besuch-bestaetigung'), neu)
  assert.equal((await aufrufe(page)).length, 1)
  await page.close()
  await nurB.close()
})

test('Suche, Lesefehler, Entfernen und Karte bleiben ehrlich', async () => {
  const page = await seite()
  const dichte = besuchVerwaltungDichteFixture(40)
  await setzen(page, { problem: null, besuche: dichte, tripProblem: null })
  assert.equal(await page.locator('[data-besuch-sichtbar]').getAttribute('data-besuch-sichtbar'), '12')
  await page.getByRole('button', { name: BESUCHE_COPY.alleAnzeigen }).click()
  const ziel = dichte[0]!.id
  await page.locator(`[data-besuch="${ziel}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await page.locator('#account-besuche-suche').fill('zzzz-kein-treffer')
  assert.match(await text(page), /nicht sichtbar/)
  await page.getByRole('button', { name: BESUCHE_COPY.inListeZeigen }).click()
  assert.equal(await page.locator('#account-besuche-suche').inputValue(), '')
  await page.locator(`[data-besuch="${ziel}"]`).waitFor()
  assert.equal(await page.locator('[data-besuch-entwurf-banner]').count(), 0)
  await page.locator('#account-besuche-suche').fill('zzzz-kein-treffer')
  await setzen(page, { problem: { status: 503, message: 'synthetisch' }, besuche: [], tripProblem: null })
  const fehler = await text(page)
  assert.match(fehler, /nicht gelesen/)
  assert.equal(fehler.includes(BESUCHE_COPY.leerTitel), false)
  assert.equal(fehler.includes('steht nicht in der angezeigten Liste'), false)
  await page.close()

  const weg = await seite()
  await setzen(weg, { problem: null, besuche: [besuch(1)], tripProblem: null })
  await weg.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await setzen(weg, { problem: null, besuche: [], tripProblem: null })
  assert.equal((await aufrufe(weg)).length, 0)
  assert.match(await text(weg), /nicht mehr in der Liste/)
  const karteVorher = await weg.locator('[data-world-map]').getAttribute('data-world-map-visited')
  await weg.locator('article input[type="number"]').first().fill('2012').catch(() => undefined)
  assert.equal(await weg.locator('[data-world-map]').getAttribute('data-world-map-visited'), karteVorher)
  await setzen(weg, { problem: null, besuche: [besuch(1)], tripProblem: { status: 500, message: 'reise' } })
  assert.equal(await weg.locator('[data-world-map]').getAttribute('data-world-map-lage'), 'fehler')
  await weg.close()
})

test('Prüfung, Fokus und Darstellung bleiben im Rahmen', async () => {
  const page = await seite()
  await page.evaluate(() => { window.__visitRefreshMode = 'defer' })
  await setzen(page, { problem: null, besuche: [besuch(1, { placeLabel: 'Lissabon mit einem sehr langen Namen der die Zeile nicht aufweiten darf und trotzdem lesbar bleibt' })], tripProblem: null })
  await page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await page.locator('article button[type="submit"]').click()
  await page.locator('#account-besuche-suche').focus()
  const nummer = (await aufrufe(page))[0]!.id
  await page.evaluate((aufruf) => window.__visitErledigen(aufruf, { ok: true, wert: null }), nummer)
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'account-besuche-suche')
  assert.match(await text(page), /Liste wird geprüft/)
  const refreshes = await page.evaluate(() => window.__visitRefreshes.length)
  await page.getByRole('button', { name: BESUCHE_COPY.listePruefen }).click()
  assert.equal(await page.evaluate(() => window.__visitRefreshes.length), refreshes)
  await page.clock.fastForward(4500)
  assert.match(await text(page), /Die Prüfung ist beendet/)
  assert.equal((await text(page)).includes('neu gelesen'), false)
  await rahmen(page, 'lang', 'long visit label after a deferred list check', `[data-besuch="${id(1)}"]`)
  await page.close()
})

test('dichte Liste, Widerruf, Lesefehler und unklare Antwort bleiben im Rahmen', async () => {
  const page = await seite()
  await setzen(page, { problem: null, besuche: besuchVerwaltungDichteFixture(40), tripProblem: null })
  const erste = await page.locator('[data-besuch]').first().getAttribute('data-besuch')
  const zweite = await page.locator('[data-besuch]').nth(1).getAttribute('data-besuch')
  await page.locator(`[data-besuch="${erste}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await page.locator(`[data-besuch="${zweite}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  await fussHalten(page)
  await rahmen(page, 'editor', 'open editor inside its own card', 'article:has([data-besuch-editor-epoche])', [320, 390, 768, 1440])
  await rahmen(page, 'widerruf', 'open revoke confirmation on the next visible visit', '[data-besuch-bestaetigung]')
  await setzen(page, { problem: { status: 503, message: 'synthetisch' }, besuche: [], tripProblem: null })
  await rahmen(page, 'lesefehler', 'failed visit read with an empty payload', '[role="alert"]')
  await page.close()

  const unklar = await seite()
  await setzen(unklar, { problem: null, besuche: [], tripProblem: null })
  await anlegen(unklar)
  await unklar.evaluate((meldung) => { window.__visitSofort = { ok: false, meldung } }, SCHREIBFEHLER)
  await unklar.locator('[data-besuch-anlage="offen"] button[type="submit"]').click()
  assert.match(await text(unklar), /unklar/)
  await rahmen(unklar, 'unbestaetigt', 'unknown create outcome with Liste prüfen', '[data-besuch-art="bestaetigen"]')
  await unklar.close()
})

async function sofortUnklar(page: Page) {
  await page.evaluate((meldung) => { window.__visitSofort = { ok: false, meldung } }, SCHREIBFEHLER)
}

test('Erneut senden bleibt bei der aufgezeichneten Art', async () => {
  const page = await seite()
  await setzen(page, { problem: null, besuche: [besuch(1)], tripProblem: null })
  await page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await page.locator('article input[type="number"]').first().fill('2011')
  await sofortUnklar(page)
  await page.locator('article button[type="submit"]').click()
  await page.getByText(BESUCHE_COPY.unbekannt).waitFor()
  assert.deepEqual((await aufrufe(page)).map((eintrag) => eintrag.name), ['aendern'])
  await page.locator('article').getByRole('button', { name: BESUCHE_COPY.abbrechen }).click()
  await page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  const erneut = page.getByRole('button', { name: BESUCHE_COPY.erneutSenden })
  assert.equal(await erneut.isDisabled(), true)
  assert.equal(await page.locator('[data-besuch-art="aendern"]').getAttribute('data-besuch-erneut'), 'gebunden')
  await page.getByText(BESUCHE_COPY.erneutNurBearbeitung).waitFor()
  assert.deepEqual((await aufrufe(page)).map((eintrag) => eintrag.name), ['aendern'])
  await page.getByRole('button', { name: BESUCHE_COPY.widerrufenBestaetigen }).click()
  assert.deepEqual((await aufrufe(page)).map((eintrag) => eintrag.name), ['aendern', 'widerrufen'])
  await page.close()

  const neu = await seite()
  await setzen(neu, { problem: null, besuche: [besuch(1)], tripProblem: null })
  await neu.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await neu.locator('article input[type="number"]').first().fill('2011')
  await sofortUnklar(neu)
  await neu.locator('article button[type="submit"]').click()
  await neu.getByText(BESUCHE_COPY.unbekannt).waitFor()
  await neu.locator('article').getByRole('button', { name: BESUCHE_COPY.abbrechen }).click()
  await neu.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await neu.locator('article input[type="number"]').first().fill('2019')
  const erneutNeu = neu.getByRole('button', { name: BESUCHE_COPY.erneutSenden })
  assert.equal(await erneutNeu.isDisabled(), false)
  await sofortUnklar(neu)
  await erneutNeu.click()
  const zweite = await aufrufe(neu)
  assert.deepEqual(zweite.map((eintrag) => eintrag.name), ['aendern', 'aendern'])
  assert.equal(zweite[1]?.argument.jahr, 2019)
  assert.notEqual(zweite[1]?.argument.jahr, 2011)
  await neu.close()

  const umgekehrt = await seite()
  await setzen(umgekehrt, { problem: null, besuche: [besuch(1)], tripProblem: null })
  await umgekehrt.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  await sofortUnklar(umgekehrt)
  await umgekehrt.getByRole('button', { name: BESUCHE_COPY.widerrufenBestaetigen }).click()
  await umgekehrt.getByText(BESUCHE_COPY.unbekannt).waitFor()
  await umgekehrt.getByRole('button', { name: BESUCHE_COPY.abbrechen }).click()
  await umgekehrt.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  const erneutAlt = umgekehrt.getByRole('button', { name: BESUCHE_COPY.erneutSenden })
  assert.equal(await erneutAlt.isDisabled(), true)
  await umgekehrt.locator('article button[type="submit"]').click()
  assert.deepEqual((await aufrufe(umgekehrt)).map((eintrag) => eintrag.name), ['widerrufen'])
  await umgekehrt.locator('article').getByRole('button', { name: BESUCHE_COPY.abbrechen }).click()
  await umgekehrt.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  assert.equal(await umgekehrt.locator('[data-besuch-art="widerrufen"]').getAttribute('data-besuch-erneut'), 'bereit')
  await sofortUnklar(umgekehrt)
  await umgekehrt.getByRole('button', { name: BESUCHE_COPY.erneutSenden }).click()
  assert.deepEqual((await aufrufe(umgekehrt)).map((eintrag) => eintrag.name), ['widerrufen', 'widerrufen'])
  await umgekehrt.close()
})

test('Vorgang und Prüfung bleiben ohne Zeile und ohne erfolgreiche Liste', async () => {
  const fehler = await seite()
  await setzen(fehler, { problem: null, besuche: [besuch(1)], tripProblem: null })
  await fehler.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten }).click()
  await sofortUnklar(fehler)
  await fehler.locator('article button[type="submit"]').click()
  await fehler.getByText(BESUCHE_COPY.unbekannt).waitFor()
  await setzen(fehler, { problem: { status: 503, message: 'synthetisch' }, besuche: [], tripProblem: null })
  const panel = fehler.locator('[data-besuch-vorgang-haltung="eigen"] [data-besuch-art="aendern"]')
  await panel.waitFor()
  assert.equal(await panel.getAttribute('data-besuch-ereignis'), id(1))
  assert.equal(await panel.getAttribute('data-besuch-inhalt'), 'lesefehler')
  const textFehler = await text(fehler)
  assert.equal(textFehler.includes(BESUCHE_COPY.idAbwesend), false)
  assert.equal(textFehler.includes(BESUCHE_COPY.leerTitel), false)
  assert.equal((await aufrufe(fehler)).length, 1)
  const refreshes = await fehler.evaluate(() => window.__visitRefreshes.length)
  await panel.getByRole('button', { name: BESUCHE_COPY.listePruefen }).click()
  assert.equal(await fehler.evaluate(() => window.__visitRefreshes.length), refreshes + 1)
  assert.equal((await aufrufe(fehler)).length, 1)
  await rahmen(fehler, 'wiederherstellung-aendern', 'unknown edit kept after a failed read', '[data-besuch-vorgang-haltung="eigen"] [data-besuch-art="aendern"]')
  await fehler.close()

  const weg = await seite()
  await setzen(weg, { problem: null, besuche: [besuch(1)], tripProblem: null })
  await weg.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  await weg.getByRole('button', { name: BESUCHE_COPY.widerrufenBestaetigen }).click()
  await weg.getByText(BESUCHE_COPY.pendingWiderrufen).waitFor()
  const nummer = (await aufrufe(weg))[0]!.id
  await setzen(weg, { problem: null, besuche: [], tripProblem: null })
  assert.equal(await weg.locator(`[data-besuch="${id(1)}"]`).count(), 0)
  const laufend = weg.locator('[data-besuch-vorgang-haltung="eigen"] [data-besuch-art="widerrufen"]')
  await laufend.waitFor()
  assert.equal(await laufend.getAttribute('data-besuch-ereignis'), id(1))
  assert.match(await laufend.innerText(), /wird widerrufen/)
  await weg.evaluate((aufruf) => window.__visitErledigen(aufruf, { ok: false, meldung: 'offen' }), nummer)
  await laufend.getByText(BESUCHE_COPY.unbekannt).waitFor()
  assert.equal(await laufend.getByRole('button', { name: BESUCHE_COPY.listePruefen }).count(), 1)
  assert.equal((await aufrufe(weg)).length, 1)
  await rahmen(weg, 'wiederherstellung-widerruf', 'unknown revoke kept after the row left a valid list', '[data-besuch-vorgang-haltung="eigen"] [data-besuch-art="widerrufen"]')
  await weg.close()

  const suche = await seite()
  await setzen(suche, { problem: null, besuche: [besuch(1)], tripProblem: null })
  await suche.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.widerrufen }).click()
  await suche.getByRole('button', { name: BESUCHE_COPY.widerrufenBestaetigen }).click()
  await suche.getByText(BESUCHE_COPY.pendingWiderrufen).waitFor()
  await suche.locator('#account-besuche-suche').fill('zzzz-kein-treffer')
  const verborgen = suche.locator('[data-besuch-vorgang-haltung="eigen"] [data-besuch-art="widerrufen"]')
  await verborgen.waitFor()
  assert.equal(await suche.locator(`[data-besuch="${id(1)}"]`).count(), 0)
  assert.match(await verborgen.innerText(), /wird widerrufen/)
  assert.equal((await aufrufe(suche)).length, 1)
  await suche.close()
})

async function fokusIst(page: Page, selektor: string) {
  await page.waitForFunction((ziel) => document.activeElement?.matches(ziel) ?? false, selektor)
}

test('Escape und Abbrechen geben den Fokus an Bearbeiten zurück', async () => {
  const page = await seite()
  await setzen(page, { problem: null, besuche: [besuch(1), besuch(2)], tripProblem: null })
  const oeffner = page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten })
  await oeffner.focus()
  await page.keyboard.press('Enter')
  const formular = page.locator(`[data-besuch="${id(1)}"] [data-besuch-formular]`)
  await formular.waitFor()
  await page.locator(`[data-besuch="${id(1)}"] input[type="number"]`).first().click()
  await page.keyboard.press('Escape')
  await formular.waitFor({ state: 'detached' })
  await fokusIst(page, `button[data-fokus="bearbeiten:${id(1)}"]`)
  assert.equal((await aufrufe(page)).length, 0)

  await oeffner.focus()
  await page.keyboard.press('Enter')
  await formular.waitFor()
  await page.locator(`[data-besuch="${id(1)}"] input[type="number"]`).first().click()
  await page.locator(`[data-besuch="${id(1)}"]`).getByRole('button', { name: BESUCHE_COPY.abbrechen }).click()
  await formular.waitFor({ state: 'detached' })
  await fokusIst(page, `button[data-fokus="bearbeiten:${id(1)}"]`)
  assert.equal((await aufrufe(page)).length, 0)

  await oeffner.focus()
  await page.keyboard.press('Enter')
  await formular.waitFor()
  await page.locator('#account-besuche-suche').click()
  await page.keyboard.press('Escape')
  assert.equal(await formular.count(), 1)
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'account-besuche-suche')

  await page.locator('[data-besuch-anlage="offen"] input[type="number"]').first().click()
  await page.keyboard.press('Escape')
  assert.equal(await formular.count(), 1)
  assert.equal(await page.evaluate(() => document.activeElement?.closest('[data-besuch-surface]')?.getAttribute('data-besuch-surface')), 'anlegen')

  const anderer = page.locator(`[data-besuch="${id(2)}"]`).getByRole('button', { name: BESUCHE_COPY.bearbeiten })
  await anderer.click()
  await page.locator(`[data-besuch="${id(2)}"] [data-besuch-formular]`).waitFor()
  assert.equal(await formular.count(), 0)
  await fokusIst(page, `button[data-fokus="bearbeiten:${id(2)}"]`)
  await page.locator(`[data-besuch="${id(2)}"] input[type="number"]`).first().click()
  await page.keyboard.press('Enter')
  const gesendet = await aufrufe(page)
  assert.deepEqual(gesendet.map((eintrag) => eintrag.name), ['aendern'])
  assert.equal(gesendet[0]?.argument.id, id(2))
  await page.close()
})
