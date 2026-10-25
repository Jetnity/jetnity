import { readFileSync } from 'node:fs'
import { mkdirSync, writeFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium, type Browser, type Page } from 'playwright'

import { cursorCodieren, sammlungHref } from '@/lib/trips/reisen-sammlung-abfrage'

const hier = dirname(fileURLToPath(import.meta.url))
const origin = process.env.MY_TRIPS_HARNESS_ORIGIN
const screens = process.env.MY_TRIPS_SCREENS
const evidenceFile = process.env.MY_TRIPS_EVIDENCE_FILE
if (!origin || !screens || !evidenceFile) throw new Error('Harness-Umgebung fehlt')

type SammlungFenster = Window & {
  __sammlung: {
    setErgebnis: (wert: unknown) => void
    setzeAdresse: (text: string) => void
    aufrufe: { push: string[]; refresh: number; prefetch: number; back: number; forward: number }
    flags: { werfen: boolean; verschachteln: boolean }
    setzeAktion: (fn: () => Promise<unknown>) => void
    aktionAnzahl: () => number
    aktionZurueck: () => void
    anfang: { adresse: string; zeilen: { id: string; title: string }[] }
    reise: (id: string, title: string, status?: string) => unknown
    resolve?: (wert: unknown) => void
  }
}

const faelle: { name: string; ok: boolean; detail?: string }[] = []

function merken(name: string, ok: boolean, detail?: string) {
  faelle.push({ name, ok, detail })
}

async function oeffnen(browser: Browser): Promise<Page> {
  return oeffnenBei(browser, '')
}

async function oeffnenBei(browser: Browser, query: string): Promise<Page> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.clock.install({ time: new Date('2026-10-25T12:00:00Z') })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(query ? `${origin}/?${query}` : origin)
  await page.waitForSelector('[data-sammlung-wurzel]')
  return page
}

const ALPHA = '00000000-0000-4000-8000-000000000001'
const UNGUELTIGE_HINWEISE = ['q=a&q=b', 'archiv=offen&archiv=archiv', 'cursor=x&cursor=y']

function ungueltigeHuelle(adresse: string) {
  return {
    ungueltig: true,
    zeilen: [],
    problem: null,
    hatWeiter: false,
    naechsterCursor: null,
    q: '',
    archiv: 'alle',
    cursor: null,
    adresse,
  }
}

async function lese(page: Page) {
  return page.evaluate(() => {
    const fenster = window as unknown as SammlungFenster
    const wurzel = document.querySelector('[data-sammlung-wurzel]')
    return {
      id: wurzel?.getAttribute('data-sammlung-id'),
      laden: wurzel?.getAttribute('data-sammlung-laden'),
      art: wurzel?.getAttribute('data-sammlung-art'),
      live: wurzel?.getAttribute('data-sammlung-live'),
      uebernommen: wurzel?.getAttribute('data-sammlung-uebernommen'),
      einig: wurzel?.getAttribute('data-sammlung-einig'),
      ids: [...document.querySelectorAll('[data-reise-id]')].map((knoten) => knoten.getAttribute('data-reise-id')),
      push: fenster.__sammlung.aufrufe.push.slice(),
      refresh: fenster.__sammlung.aufrufe.refresh,
      prefetch: fenster.__sammlung.aufrufe.prefetch,
      erneut: (document.querySelector('[data-sammlung-erneut]') as HTMLButtonElement | null)?.disabled ?? null,
      weiter: (document.querySelector('[data-sammlung-weiter]') as HTMLButtonElement | null)?.disabled ?? null,
      suche: (document.querySelector('[data-sammlung-suche]') as HTMLInputElement | null)?.value ?? '',
    }
  })
}

async function ruhen(page: Page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)))),
  )
}

async function adresseSetzen(page: Page, text: string) {
  await page.evaluate((wert) => (window as unknown as SammlungFenster).__sammlung.setzeAdresse(wert), text)
  await ruhen(page)
}

async function ergebnis(page: Page, teil: Record<string, unknown>) {
  await page.evaluate((stueck) => {
    const fenster = window as unknown as SammlungFenster
    fenster.__sammlung.setErgebnis({ ...fenster.__sammlung.anfang, ...stueck })
  }, teil)
  await ruhen(page)
}

describe('montierte Meine-Reisen-Sammlung', () => {
  test('Navigation, Archiv und Darstellung', async () => {
    const shim = readFileSync(join(hier, 'shims/navigation.ts'), 'utf8')
    assert.equal(shim.includes('Promise'), false)
    assert.equal(shim.includes('generation'), false)
    const browser = await chromium.launch({ channel: 'chrome', headless: true })
    try {
      const seite = await oeffnen(browser)
      await seite.evaluate(() => {
        const knoten = document.querySelector('[data-sammlung-wurzel]')
        if (knoten) knoten.setAttribute('data-sammlung-marke', 'bleibt')
      })
      const start = await lese(seite)
      assert.equal(start.prefetch, 0)
      assert.deepEqual(start.push, [])
      assert.deepEqual(start.ids, ['00000000-0000-4000-8000-000000000001'])
      assert.equal(start.laden, '0')
      const sammlungId = start.id

      await seite.locator('[data-sammlung-suche]').fill('beta')
      await seite.getByRole('button', { name: 'Suchen' }).click()
      await seite.locator('[data-sammlung-leeren]').click()
      const vorAdresse = await lese(seite)
      assert.equal(vorAdresse.laden, '1')
      assert.equal(vorAdresse.art, 'clear')
      assert.deepEqual(vorAdresse.ids, ['00000000-0000-4000-8000-000000000001'])
      assert.deepEqual(vorAdresse.push, ['/reisen?q=beta', '/reisen'])
      await adresseSetzen(seite, 'q=beta')
      const nachB = await lese(seite)
      assert.equal(nachB.art, 'url')
      assert.deepEqual(nachB.ids, ['00000000-0000-4000-8000-000000000001'])
      assert.equal(nachB.push.length, 2)
      assert.equal(await seite.getAttribute('[data-sammlung-wurzel]', 'data-sammlung-id'), sammlungId)
      assert.equal(await seite.getAttribute('[data-sammlung-wurzel]', 'data-sammlung-marke'), 'bleibt')
      merken('A-B-A vor der ersten Adressänderung', true)

      await seite.close()
      const spaet = await oeffnen(browser)
      await spaet.locator('[data-sammlung-suche]').fill('beta')
      await spaet.getByRole('button', { name: 'Suchen' }).click()
      await adresseSetzen(spaet, 'q=beta')
      const haengt = await lese(spaet)
      assert.equal(haengt.laden, '1')
      assert.equal(haengt.art, 'commit')
      assert.deepEqual(haengt.ids, ['00000000-0000-4000-8000-000000000001'])
      await ergebnis(spaet, {
        zeilen: [{ ...(await spaet.evaluate(() => (window as unknown as SammlungFenster).__sammlung.anfang.zeilen[0])), id: '00000000-0000-4000-8000-000000000002', title: 'Beta' }],
        q: 'beta',
        adresse: '/reisen?q=beta',
        hatWeiter: false,
        naechsterCursor: null,
      })
      await spaet.waitForFunction(() => document.querySelector('[data-sammlung-wurzel]')?.getAttribute('data-sammlung-laden') === '0')
      const gelandet = await lese(spaet)
      assert.deepEqual(gelandet.ids, ['00000000-0000-4000-8000-000000000002'])
      merken('späte eigene Landung', true)

      await spaet.close()
      const rueck = await oeffnen(browser)
      await rueck.locator('[data-sammlung-suche]').fill('beta')
      await rueck.getByRole('button', { name: 'Suchen' }).click()
      await adresseSetzen(rueck, 'q=beta')
      assert.equal((await lese(rueck)).laden, '1')
      await adresseSetzen(rueck, '')
      const wiederA = await lese(rueck)
      assert.equal(wiederA.laden, '0')
      assert.equal(wiederA.live, '/reisen')
      assert.deepEqual(wiederA.ids, ['00000000-0000-4000-8000-000000000001'])
      await ergebnis(rueck, {
        zeilen: [{ id: '00000000-0000-4000-8000-000000000002', title: 'Beta', origin: 'Zürich', startDate: null, endDate: null, travellers: 1, currency: 'CHF', budgetAmount: null, status: 'planned', updatedAt: '2026-10-25T12:00:00.000000Z', archivePreviousStatus: null, stages: [], stageCount: 0, dayCount: 0, itemCount: 0 }],
        q: 'beta',
        adresse: '/reisen?q=beta',
        hatWeiter: false,
        naechsterCursor: null,
      })
      const spaetB = await lese(rueck)
      assert.deepEqual(spaetB.ids, ['00000000-0000-4000-8000-000000000001'])
      assert.equal(spaetB.uebernommen, '/reisen')
      merken('Rückkehr zu A verwirft B', true)

      await adresseSetzen(rueck, 'archiv=offen')
      const historie = await lese(rueck)
      assert.equal(historie.art, 'url')
      assert.equal(historie.push.length, 1)
      assert.deepEqual(historie.ids, ['00000000-0000-4000-8000-000000000001'])
      merken('Zurück und Vor ohne lokale Ausgabe', true)

      const verschieden = await lese(rueck)
      assert.equal(verschieden.erneut, true)
      assert.equal(verschieden.weiter, true)
      const refreshVorher = verschieden.refresh
      await rueck.locator('[data-sammlung-erneut]').click({ force: true })
      assert.equal((await lese(rueck)).refresh, refreshVorher)
      await rueck.locator('[data-sammlung-archiv="archiv"]').click()
      const filter = await lese(rueck)
      assert.equal(filter.push.at(-1), '/reisen?archiv=archiv')
      merken('Retry und Fortsetzung sind bei abweichender Adresse aus', true)

      await rueck.close()
      const erneut = await oeffnen(browser)
      await ergebnis(erneut, { problem: { status: 503, message: 'db' }, zeilen: [], hatWeiter: false, naechsterCursor: null })
      await erneut.locator('[data-sammlung-erneut]').click()
      assert.equal((await lese(erneut)).laden, '1')
      await erneut.locator('[data-sammlung-suche]').fill('entwurf')
      assert.equal((await lese(erneut)).laden, '1')
      await ergebnis(erneut, { problem: { status: 503, message: 'db' }, zeilen: [], hatWeiter: false, naechsterCursor: null })
      await erneut.waitForFunction(() => document.querySelector('[data-sammlung-wurzel]')?.getAttribute('data-sammlung-laden') === '0')
      merken('gleicher Fehler und stabiler Entwurf', true)

      await erneut.close()
      const frist = await oeffnen(browser)
      await frist.locator('[data-sammlung-erneut]').click()
      assert.equal((await lese(frist)).refresh, 1)
      assert.equal((await lese(frist)).laden, '1')
      await frist.locator('[data-sammlung-erneut]').click()
      assert.equal((await lese(frist)).refresh, 1)
      await frist.clock.fastForward(2000)
      assert.equal((await lese(frist)).laden, '1')
      await frist.clock.fastForward(8000)
      await frist.waitForFunction(() => document.querySelector('[data-sammlung-wurzel]')?.getAttribute('data-sammlung-laden') === '0')
      merken('Frist und doppeltes Retry', true)

      await frist.close()
      const neuer = await oeffnen(browser)
      await neuer.locator('[data-sammlung-erneut]').click()
      await neuer.clock.fastForward(2000)
      await neuer.locator('[data-sammlung-suche]').fill('gamma')
      assert.equal((await lese(neuer)).push.length, 0)
      await neuer.getByRole('button', { name: 'Suchen' }).click()
      await neuer.clock.fastForward(6500)
      const ueberlebt = await lese(neuer)
      assert.equal(ueberlebt.laden, '1')
      assert.equal(ueberlebt.art, 'commit')
      assert.equal(ueberlebt.push.at(-1), '/reisen?q=gamma')
      merken('neueres Commit überlebt die alte Frist', true)

      await neuer.evaluate(() => {
        const fenster = window as unknown as SammlungFenster
        fenster.__sammlung.flags.verschachteln = true
        fenster.__sammlung.flags.werfen = true
      })
      await neuer.locator('[data-sammlung-suche]').fill('bleibt')
      await neuer.getByRole('button', { name: 'Suchen' }).click()
      const wurf = await lese(neuer)
      assert.equal(wurf.laden, '1')
      assert.equal(wurf.art, 'clear')
      assert.equal(wurf.suche, 'bleibt')
      merken('synchroner push-Fehler löscht nur die eigene Absicht', true)

      await neuer.evaluate(() => {
        const fenster = window as unknown as SammlungFenster
        fenster.__sammlung.aktionZurueck()
        fenster.__sammlung.setzeAktion(() => new Promise((resolve) => {
          fenster.__sammlung.resolve = resolve
        }))
        const knopf = document.querySelector('[data-reisen-aktion="archivieren"]') as HTMLButtonElement
        knopf.click()
        knopf.click()
      })
      assert.equal(await neuer.evaluate(() => (window as unknown as SammlungFenster).__sammlung.aktionAnzahl()), 1)
      await neuer.evaluate(() => (window as unknown as SammlungFenster).__sammlung.resolve?.({ ok: false, meldung: 'Konflikt' }))
      await neuer.getByText('Konflikt').waitFor()
      const refreshNachNegativ = (await lese(neuer)).refresh
      await neuer.evaluate(() => {
        const fenster = window as unknown as SammlungFenster
        fenster.__sammlung.setzeAktion(() => Promise.resolve({ ok: true }))
      })
      await neuer.locator('[data-reisen-aktion="archivieren"]').click()
      await neuer.getByText('Das Ergebnis dieser Aktion ist unklar.').waitFor()
      await neuer.evaluate(() => {
        const fenster = window as unknown as SammlungFenster
        fenster.__sammlung.setzeAktion(() => Promise.resolve({ ok: true, wert: null }))
      })
      await neuer.locator('[data-reisen-aktion="archivieren"]').click()
      await neuer.getByText('Die Aktion hat Erfolg gemeldet.').waitFor()
      const nachErfolg = await lese(neuer)
      assert.equal(nachErfolg.refresh, refreshNachNegativ + 1)
      await ergebnis(neuer, { zeilen: [], hatWeiter: false, naechsterCursor: null })
      await neuer.getByText('nicht sichtbar').waitFor()
      const protokoll = await neuer.locator('[data-archiv-protokoll] [data-archiv-schreiben="acknowledged"]').count()
      assert.equal(protokoll, 1)
      merken('Archiv trennt Schreiben und Liste', true)

      await ergebnis(neuer, { hatWeiter: true, naechsterCursor: 'naechste' })
      await neuer.locator('[data-sammlung-weiter]').click()
      const weiter = await lese(neuer)
      assert.equal(weiter.push.at(-1)?.includes('cursor=naechste'), true)
      assert.equal(await neuer.evaluate(() => (window as unknown as SammlungFenster).__sammlung.aufrufe.prefetch), 0)
      await neuer.locator('[data-sammlung-suche]').fill('')
      await neuer.locator('[data-sammlung-suche]').focus()
      await neuer.keyboard.type('taste')
      await neuer.keyboard.press('Enter')
      assert.equal((await lese(neuer)).push.at(-1), '/reisen?q=taste')
      const marke = await neuer.getAttribute('[data-sammlung-wurzel]', 'data-sammlung-marke')
      assert.equal(marke, null)
      const eigeneMarke = await neuer.evaluate(() => document.querySelector('[data-sammlung-wurzel]')?.getAttribute('data-sammlung-id'))
      assert.ok(eigeneMarke)
      merken('Fortsetzung erst nach Aktivierung', true)

      await neuer.close()

      for (const query of UNGUELTIGE_HINWEISE) {
        const tief = await oeffnenBei(browser, query)
        const erste = await lese(tief)
        assert.deepEqual(erste.ids, [])
        assert.equal(erste.einig, '1')
        assert.equal(erste.live, `/reisen?${query}`)
        assert.equal(erste.uebernommen, `/reisen?${query}`)
        assert.equal(erste.erneut, false)
        assert.equal(await tief.getByRole('heading', { name: 'Diese Adresse ist keine gültige Ansicht.' }).count(), 1)
        await ergebnis(tief, {})
        const verworfen = await lese(tief)
        assert.deepEqual(verworfen.ids, [])
        assert.equal(verworfen.uebernommen, `/reisen?${query}`)
        await tief.close()

        const platz = await oeffnen(browser)
        await adresseSetzen(platz, query)
        const alt = await lese(platz)
        assert.deepEqual(alt.ids, [ALPHA])
        assert.equal(await platz.getByRole('heading', { name: 'Diese Adresse ist keine gültige Ansicht.' }).count(), 0)
        await ergebnis(platz, ungueltigeHuelle(`/reisen?${query}`))
        await platz.getByRole('heading', { name: 'Diese Adresse ist keine gültige Ansicht.' }).waitFor()
        const neu = await lese(platz)
        assert.deepEqual(neu.ids, [])
        assert.equal(neu.einig, '1')
        assert.equal(neu.erneut, false)
        assert.equal(neu.uebernommen, `/reisen?${query}`)
        await ergebnis(platz, {})
        const bleibt = await lese(platz)
        assert.deepEqual(bleibt.ids, [])
        assert.equal(bleibt.uebernommen, `/reisen?${query}`)
        await platz.close()
      }
      merken('Wiederholte Parameter übernehmen die ungültige Hülle', true)

      for (const query of ['archiv=', 'cursor=']) {
        const tief = await oeffnenBei(browser, query)
        const erste = await lese(tief)
        assert.equal(await tief.evaluate(() => window.location.search), `?${query}`)
        assert.deepEqual(erste.ids, [])
        assert.equal(erste.einig, '1')
        assert.equal(erste.live, `/reisen?${query}`)
        assert.equal(erste.uebernommen, `/reisen?${query}`)
        assert.notEqual(erste.uebernommen, '/reisen')
        assert.equal(await tief.getByRole('heading', { name: 'Diese Adresse ist keine gültige Ansicht.' }).count(), 1)
        await ergebnis(tief, {})
        const verworfen = await lese(tief)
        assert.equal(await tief.evaluate(() => window.location.search), `?${query}`)
        assert.deepEqual(verworfen.ids, [])
        assert.equal(verworfen.live, `/reisen?${query}`)
        assert.equal(verworfen.uebernommen, `/reisen?${query}`)
        assert.equal(await tief.getByRole('heading', { name: 'Diese Adresse ist keine gültige Ansicht.' }).count(), 1)
        await tief.close()

        const platz = await oeffnen(browser)
        await adresseSetzen(platz, query)
        const alt = await lese(platz)
        assert.deepEqual(alt.ids, [ALPHA])
        assert.equal(await platz.getByRole('heading', { name: 'Diese Adresse ist keine gültige Ansicht.' }).count(), 0)
        await ergebnis(platz, ungueltigeHuelle(`/reisen?${query}`))
        await platz.getByRole('heading', { name: 'Diese Adresse ist keine gültige Ansicht.' }).waitFor()
        const neu = await lese(platz)
        assert.deepEqual(neu.ids, [])
        assert.equal(neu.einig, '1')
        assert.equal(neu.live, `/reisen?${query}`)
        assert.equal(neu.uebernommen, `/reisen?${query}`)
        await ergebnis(platz, {})
        const bleibt = await lese(platz)
        assert.deepEqual(bleibt.ids, [])
        assert.equal(bleibt.live, `/reisen?${query}`)
        assert.equal(bleibt.uebernommen, `/reisen?${query}`)
        assert.equal(await platz.getByRole('heading', { name: 'Diese Adresse ist keine gültige Ansicht.' }).count(), 1)
        await platz.close()
        merken(
          query === 'archiv=' ? 'Leeres archiv bleibt eine eigene Adresse' : 'Leerer cursor bleibt eine eigene Adresse',
          true,
        )
      }

      const liste = await oeffnen(browser)
      await liste.evaluate(() => {
        const fenster = window as unknown as SammlungFenster
        fenster.__sammlung.aktionZurueck()
        fenster.__sammlung.setzeAktion(() => new Promise((resolve) => {
          fenster.__sammlung.resolve = resolve
        }))
      })
      await liste.locator('[data-reisen-aktion="archivieren"]').click()
      await liste.getByText('Die Aktion läuft.').waitFor()
      const vorNavigation = await liste.evaluate(() => (window as unknown as SammlungFenster).__sammlung.aktionAnzahl())
      await adresseSetzen(liste, 'q=nur-navigation')
      assert.equal(await liste.evaluate(() => (window as unknown as SammlungFenster).__sammlung.aktionAnzahl()), vorNavigation)
      assert.equal(await liste.locator('[data-archiv-schreiben="pending"]').count(), 1)
      assert.deepEqual((await lese(liste)).ids, [ALPHA])
      await adresseSetzen(liste, 'cursor=x&cursor=y')
      await ergebnis(liste, ungueltigeHuelle('/reisen?cursor=x&cursor=y'))
      await liste.getByRole('heading', { name: 'Diese Adresse ist keine gültige Ansicht.' }).waitFor()
      assert.equal(await liste.getByText('nicht sichtbar').count(), 0)
      assert.equal(await liste.locator('[data-archiv-liste="nicht-gelesen"]').count(), 1)
      assert.equal(await liste.locator('[data-archiv-sehen="unread"]').count(), 1)
      assert.equal(await liste.locator('[data-archiv-schreiben="pending"]').count(), 1)
      await liste.getByText('keine Liste gelesen').waitFor()
      await ergebnis(liste, {})
      assert.deepEqual((await lese(liste)).ids, [])
      assert.equal((await lese(liste)).uebernommen, '/reisen?cursor=x&cursor=y')
      const refreshVorAck = (await lese(liste)).refresh
      await liste.evaluate(() => (window as unknown as SammlungFenster).__sammlung.resolve?.({ ok: true, wert: null }))
      await liste.getByText('Die Aktion hat Erfolg gemeldet.').waitFor()
      assert.equal(await liste.getByText('nicht sichtbar').count(), 0)
      assert.equal(await liste.locator('[data-archiv-schreiben="acknowledged"]').count(), 1)
      assert.equal(await liste.locator('[data-archiv-sehen="unread"]').count(), 1)
      assert.equal(await liste.locator('[data-archiv-liste="nicht-gelesen"]').count(), 1)
      assert.equal((await lese(liste)).refresh, refreshVorAck + 1)
      await liste.close()

      const unklar = await oeffnen(browser)
      await unklar.evaluate(() => {
        const fenster = window as unknown as SammlungFenster
        fenster.__sammlung.aktionZurueck()
        fenster.__sammlung.setzeAktion(() => new Promise((resolve) => {
          fenster.__sammlung.resolve = resolve
        }))
      })
      await unklar.locator('[data-reisen-aktion="archivieren"]').click()
      await adresseSetzen(unklar, 'cursor=x&cursor=y')
      await ergebnis(unklar, ungueltigeHuelle('/reisen?cursor=x&cursor=y'))
      await unklar.evaluate(() => (window as unknown as SammlungFenster).__sammlung.resolve?.({ ok: true }))
      await unklar.getByText('Das Ergebnis dieser Aktion ist unklar.').waitFor()
      assert.equal(await unklar.getByText('nicht sichtbar').count(), 0)
      assert.equal(await unklar.locator('[data-archiv-schreiben="unknown"]').count(), 1)
      assert.equal(await unklar.locator('[data-archiv-liste="nicht-gelesen"]').count(), 1)
      await unklar.close()
      merken('Ungelesene Adresse erfindet keine Abwesenheit', true)

      const herkunft = await oeffnen(browser)
      await herkunft.evaluate(() => {
        const fenster = window as unknown as SammlungFenster
        fenster.__sammlung.aktionZurueck()
        fenster.__sammlung.setzeAktion(() => new Promise((resolve) => {
          fenster.__sammlung.resolve = resolve
        }))
      })
      await herkunft.locator('[data-reisen-aktion="archivieren"]').click()
      await herkunft.getByText('Die Aktion läuft.').waitFor()
      await herkunft.evaluate(() => {
        const fenster = window as unknown as SammlungFenster
        const zeile = fenster.__sammlung.reise('00000000-0000-4000-8000-000000000001', 'Alpha', 'archived') as {
          archivePreviousStatus: string | null
        }
        zeile.archivePreviousStatus = null
        fenster.__sammlung.setErgebnis({ ...fenster.__sammlung.anfang, zeilen: [zeile] })
      })
      await ruhen(herkunft)
      await herkunft.getByText('frühere Status nicht belegt').waitFor()
      assert.equal(await herkunft.getByText('Die Aktion läuft.').count(), 1)
      assert.equal(await herkunft.getByRole('button', { name: 'Wiederherstellen' }).count(), 0)
      assert.equal(await herkunft.locator('[data-archiv-schreiben="pending"]').count(), 1)
      const aktionenVorher = await herkunft.evaluate(() => (window as unknown as SammlungFenster).__sammlung.aktionAnzahl())
      await adresseSetzen(herkunft, 'q=nur-navigation')
      assert.equal(await herkunft.evaluate(() => (window as unknown as SammlungFenster).__sammlung.aktionAnzahl()), aktionenVorher)
      assert.equal(await herkunft.locator('[data-archiv-schreiben="pending"]').count(), 1)
      assert.equal(await herkunft.getByText('frühere Status nicht belegt').count(), 1)
      const refreshVorUnklar = (await lese(herkunft)).refresh
      await herkunft.evaluate(() => (window as unknown as SammlungFenster).__sammlung.resolve?.({ ok: true }))
      await herkunft.getByText('Das Ergebnis dieser Aktion ist unklar.').waitFor()
      assert.equal(await herkunft.getByText('frühere Status nicht belegt').count(), 1)
      assert.equal((await lese(herkunft)).refresh, refreshVorUnklar)
      await herkunft.evaluate(() => {
        const fenster = window as unknown as SammlungFenster
        const zeile = fenster.__sammlung.reise('00000000-0000-4000-8000-000000000001', 'Alpha', 'archived')
        fenster.__sammlung.setErgebnis({
          ...fenster.__sammlung.anfang,
          zeilen: [zeile],
          q: 'nur-navigation',
          adresse: '/reisen?q=nur-navigation',
          hatWeiter: false,
          naechsterCursor: null,
        })
        fenster.__sammlung.setzeAktion(() => new Promise((resolve) => {
          fenster.__sammlung.resolve = resolve
        }))
      })
      await ruhen(herkunft)
      await herkunft.getByRole('button', { name: 'Wiederherstellen' }).click()
      await herkunft.getByText('Die Aktion läuft.').waitFor()
      await herkunft.evaluate(() => {
        const fenster = window as unknown as SammlungFenster
        const zeile = fenster.__sammlung.reise('00000000-0000-4000-8000-000000000001', 'Alpha', 'archived') as {
          archivePreviousStatus: string | null
        }
        zeile.archivePreviousStatus = null
        fenster.__sammlung.setErgebnis({
          ...fenster.__sammlung.anfang,
          zeilen: [zeile],
          q: 'nur-navigation',
          adresse: '/reisen?q=nur-navigation',
          hatWeiter: false,
          naechsterCursor: null,
        })
      })
      await ruhen(herkunft)
      await herkunft.getByText('frühere Status nicht belegt').waitFor()
      assert.equal(await herkunft.getByText('Die Aktion läuft.').count(), 1)
      assert.equal(await herkunft.getByRole('button', { name: 'Wiederherstellen' }).count(), 0)
      const refreshVorErfolg = (await lese(herkunft)).refresh
      await herkunft.evaluate(() => (window as unknown as SammlungFenster).__sammlung.resolve?.({ ok: true, wert: null }))
      await herkunft.getByText('Die Aktion hat Erfolg gemeldet.').waitFor()
      assert.equal(await herkunft.getByText('frühere Status nicht belegt').count(), 1)
      assert.equal(await herkunft.locator('[data-archiv-schreiben="acknowledged"]').count(), 1)
      assert.equal((await lese(herkunft)).refresh, refreshVorErfolg + 1)
      await herkunft.close()
      merken('Fehlende Herkunft verbirgt die Aktion nicht', true)

      const besitz = await oeffnen(browser)
      assert.equal(await besitz.locator('[data-sammlung-besitz]').innerText(), 'Diese Ansicht ist ohne Suche in Alle.')
      await besitz.locator('[data-sammlung-suche]').fill('nur-entwurf')
      assert.equal(await besitz.getByText('Der Entwurf ist noch nicht die Suche.').count(), 1)
      assert.equal(await besitz.locator('[data-sammlung-besitz]').innerText(), 'Diese Ansicht ist ohne Suche in Alle.')
      await adresseSetzen(besitz, 'q=beta&archiv=offen')
      assert.equal(await besitz.locator('[data-sammlung-besitz]').innerText(), 'Diese Ansicht ist ohne Suche in Alle.')
      assert.equal(await besitz.locator('[data-sammlung-ziel]').innerText(), 'Geladen wird die Suche „beta“ in Offen. Die bisherigen Reisen bleiben sichtbar.')
      assert.deepEqual((await lese(besitz)).ids, [ALPHA])
      await ergebnis(besitz, {
        q: 'beta',
        archiv: 'offen',
        adresse: '/reisen?q=beta&archiv=offen',
        hatWeiter: false,
        naechsterCursor: null,
      })
      await besitz.getByText('Diese Ansicht ist die Suche „beta“ in Offen.').waitFor()
      assert.equal(await besitz.locator('[data-sammlung-ziel]').count(), 0)
      const fortsetzung = cursorCodieren({
        q: 'beta',
        archiv: 'offen',
        zeit: '2026-10-25T12:00:00.000000Z',
        id: ALPHA,
      })
      assert.ok(fortsetzung)
      await adresseSetzen(besitz, `q=beta&archiv=offen&cursor=${fortsetzung}`)
      assert.match(await besitz.locator('[data-sammlung-ziel]').innerText(), /weitere Seite/)
      assert.equal((await besitz.locator('[data-sammlung-ziel]').innerText()).includes(fortsetzung ?? ''), false)
      assert.equal(await besitz.locator('[data-sammlung-besitz]').innerText(), 'Diese Ansicht ist die Suche „beta“ in Offen.')
      await ergebnis(besitz, {
        q: 'beta',
        archiv: 'offen',
        cursor: fortsetzung,
        adresse: sammlungHref({ q: 'beta', archiv: 'offen', cursor: fortsetzung }),
        hatWeiter: false,
        naechsterCursor: null,
      })
      await besitz.getByText('Diese Ansicht ist die Suche „beta“ in Offen, weitere Seite.').waitFor()
      assert.equal((await besitz.locator('body').innerText()).includes(fortsetzung ?? ''), false)
      await adresseSetzen(besitz, 'q=a&q=b')
      assert.equal(await besitz.locator('[data-sammlung-besitz]').innerText(), 'Diese Ansicht ist die Suche „beta“ in Offen, weitere Seite.')
      assert.match(await besitz.locator('[data-sammlung-ziel]').innerText(), /keine gültige Ansicht/)
      assert.equal((await besitz.locator('[data-sammlung-ziel]').innerText()).includes('q=a'), false)
      await besitz.close()
      merken('Die Ansicht nennt Suche und Archivauswahl', true)

      const bild = await oeffnen(browser)
      assert.equal(await bild.getAttribute('[data-sammlung-wurzel]', 'data-sammlung-marke'), null)
      const bildId = await bild.getAttribute('[data-sammlung-wurzel]', 'data-sammlung-id')
      await bild.evaluate(() => {
        const knoten = document.querySelector('[data-sammlung-wurzel]')
        if (knoten) knoten.setAttribute('data-sammlung-marke', 'bleibt')
      })
      const lang = 'Reise '.repeat(20).trim()
      const viele = Array.from({ length: 48 }, (_, index) => ({
        id: `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`,
        title: index === 0 ? lang : `Reise ${index}`,
        origin: index === 0 ? lang : 'Zürich',
        startDate: null,
        endDate: null,
        travellers: 1,
        currency: 'CHF',
        budgetAmount: null,
        status: 'planned',
        updatedAt: '2026-10-25T12:00:00.000000Z',
        archivePreviousStatus: null,
        stages: [],
        stageCount: 0,
        dayCount: 0,
        itemCount: 0,
      }))
      await ergebnis(bild, { zeilen: viele, hatWeiter: false, naechsterCursor: null })
      assert.equal(await bild.locator('[data-reisen-kalender="wartet"]').count(), 0)
      assert.equal(await bild.getByRole('heading', { name: 'Ohne Datum' }).count(), 1)
      await bild.evaluate(() => {
        document.documentElement.style.fontSize = '32px'
      })
      for (const breite of [320, 390, 768, 1440]) {
        await bild.setViewportSize({ width: breite, height: 900 })
        const ueberlauf = await bild.evaluate(() => {
          const knoten = document.querySelector('[data-sammlung-wurzel]')
          if (!knoten) return true
          return knoten.scrollWidth > knoten.clientWidth + 1
        })
        assert.equal(ueberlauf, false, `Überlauf bei ${breite}`)
        await bild.screenshot({ path: join(screens, `sammlung-${breite}.png`) })
      }
      assert.equal(await bild.getAttribute('[data-sammlung-wurzel]', 'data-sammlung-marke'), 'bleibt')
      assert.equal(await bild.getAttribute('[data-sammlung-wurzel]', 'data-sammlung-id'), bildId)
      merken('Viewports, Schrift und dichte Seite', true)
      await bild.close()
    } finally {
      await browser.close()
      writeFileSync(evidenceFile, `${JSON.stringify({ status: faelle.every((fall) => fall.ok) ? 'PASS' : 'FAIL', cases: faelle }, null, 2)}\n`)
    }
  })
})

mkdirSync(screens, { recursive: true })
