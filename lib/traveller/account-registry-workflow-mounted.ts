import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium, type Browser, type Page } from 'playwright'

import { REGISTRY_COPY } from '@/lib/traveller/account-registry-copy'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'

type Aufruf = { id: number; name: string; argument: Record<string, string> }
type Props = {
  problem: { status: 500 | 503; message: string } | null
  travellers: AccountRegistryTraveller[] | null
}

declare global {
  interface Window {
    __registryAufrufe: Aufruf[]
    __registryRefreshes: number[]
    __registryRefreshMode: 'resolve' | 'reject' | 'defer'
    __registryErledigen: (id: number, wert: unknown) => void
    __registryRefreshErledigen: (id: number) => void
    __registrySetzen: (props: Props) => void
  }
}

const ZEIT = '2026-01-15T10:00:00.000Z'
const LAENDER = ['DE', 'AT', 'CH', 'FR', 'IT', 'ES', 'NL', 'BE', 'PT', 'SE', 'NO', 'DK', 'PL']

type Fall = { name: string; pass: boolean; detail?: unknown; error?: string }
const faelle: Fall[] = []
const externe: string[] = []
let browser: Browser | null = null
let seitenFehler: string[] = []

function id(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

function staat(n: number, countryCode: string) {
  return { id: id(n), clientRef: id(n), countryCode, createdAt: ZEIT, updatedAt: ZEIT }
}

function dokument(n: number, extra: Partial<AccountRegistryTraveller['facts']['documents'][number]> = {}) {
  return {
    id: id(n),
    clientRef: id(n),
    documentType: 'passport' as const,
    issuingCountryCode: 'DE',
    citizenshipClientRef: null,
    expiresOn: '2030-01-01',
    createdAt: ZEIT,
    updatedAt: ZEIT,
    ...extra,
  }
}

function person(n: number, label: string, extra: Partial<AccountRegistryTraveller['facts']> = {}): AccountRegistryTraveller {
  return {
    authority: 'account_registry',
    id: id(n),
    clientRef: id(n),
    createdAt: ZEIT,
    updatedAt: ZEIT,
    facts: {
      label,
      residenceCountryCode: 'DE',
      citizenships: [],
      documents: [],
      ...extra,
    },
  }
}

function liste(travellers: AccountRegistryTraveller[]): Props {
  return { problem: null, travellers }
}

function problem(status: 500 | 503): Props {
  return { problem: { status, message: 'synthetisch' }, travellers: null }
}

function klasseVon(props: Props): string {
  if (props.problem?.status === 500 || props.problem?.status === 503) return 'fehler'
  if (props.problem || !Array.isArray(props.travellers)) return 'ungueltig'
  return 'gueltig'
}

async function aufrufe(page: Page): Promise<Aufruf[]> {
  return page.evaluate(() => window.__registryAufrufe.map((eintrag) => ({ ...eintrag })))
}

async function anzahl(page: Page): Promise<number> {
  return page.evaluate(() => window.__registryAufrufe.length)
}

async function refreshes(page: Page): Promise<number> {
  return page.evaluate(() => window.__registryRefreshes.length)
}

async function setzen(page: Page, props: Props) {
  const ausdruck = `(async () => {
    window.__registrySetzen(${JSON.stringify(props)})
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  })()`
  await page.evaluate(ausdruck)
  await page.waitForFunction(
    (erwartet) => document.querySelector('[data-registry-klasse]')?.getAttribute('data-registry-klasse') === erwartet,
    klasseVon(props),
  )
}

async function oeffnen(page: Page) {
  seitenFehler = []
  externe.length = 0
  const origin = process.env.REGISTRY_HARNESS_ORIGIN ?? ''
  await page.route('**/*', (route) => {
    let erlaubt = false
    try {
      erlaubt = new URL(route.request().url()).origin === new URL(origin).origin
    } catch {
      erlaubt = false
    }
    if (!erlaubt) {
      externe.push(route.request().url())
      return route.abort('blockedbyclient')
    }
    return route.continue()
  })
  page.on('pageerror', (error) => seitenFehler.push(error.message))
  await page.goto(origin, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-registry-klasse]')
}

async function erledigen(page: Page, aufrufId: number, wert: unknown) {
  await page.evaluate(({ id: ziel, wert: ausgang }) => window.__registryErledigen(ziel, ausgang), {
    id: aufrufId,
    wert,
  })
}

async function verwalten(page: Page, travellerId: string) {
  const knopf = page.locator(`[data-fokus="verwalten:${travellerId}"]`)
  await knopf.scrollIntoViewIfNeeded()
  if ((await knopf.getAttribute('aria-expanded')) !== 'true') await knopf.click()
  await page.locator('[data-registry-verwaltung="offen"]').waitFor({ state: 'visible' })
}

async function trotzdem(page: Page, editor?: string) {
  const ziel = editor
    ? beleg(page, editor, 'unbestaetigt').getByRole('button', { name: REGISTRY_COPY.erneutAktion })
    : page.getByRole('button', { name: REGISTRY_COPY.erneutAktion })
  await ziel.click({ force: true })
}

async function waehle(page: Page, editor: string, wert: string) {
  await page.locator(`[data-registry-editor="${editor}"] select:has(option[value="${wert}"])`).first().selectOption(wert)
}

async function senden(page: Page, editor: string) {
  await page.locator(`form[data-registry-editor="${editor}"] button[type="submit"]`).click()
}

async function burst(page: Page, editor: string): Promise<number> {
  const ausdruck = `(() => {
    const form = document.querySelector('form[data-registry-editor="' + ${JSON.stringify(editor)} + '"]')
    if (!(form instanceof HTMLFormElement)) return -1
    const button = form.querySelector('button[type="submit"]')
    if (button instanceof HTMLButtonElement) {
      Object.defineProperty(button, 'disabled', { configurable: true, get() { return false }, set() {} })
    }
    let ereignisse = 0
    form.addEventListener('submit', () => { ereignisse += 1 })
    const feuern = () => {
      try { form.requestSubmit() }
      catch (fehler) { form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) }
    }
    feuern()
    feuern()
    return ereignisse
  })()`
  return page.evaluate(ausdruck)
}

async function fokus(page: Page) {
  return page.evaluate(() => {
    const aktiv = document.activeElement as HTMLElement | null
    return {
      fokus: aktiv?.getAttribute?.('data-fokus') ?? null,
      id: aktiv?.id ?? null,
      editor: aktiv?.closest?.('[data-registry-editor]')?.getAttribute('data-registry-editor') ?? null,
    }
  })
}

function beleg(page: Page, editor: string, ausgang: string) {
  return page.locator(`[data-registry-beleg][data-registry-editor="${editor}"][data-registry-ausgang="${ausgang}"]`)
}

function ruhig() {
  assert.deepEqual(seitenFehler, [])
  assert.deepEqual(externe, [])
}

export function registerMounted() {
  const origin = process.env.REGISTRY_HARNESS_ORIGIN
  const evidenceFile = process.env.REGISTRY_EVIDENCE_FILE
  const screens = process.env.REGISTRY_SCREENS
  if (!origin || !evidenceFile || !screens) throw new Error('Harness-Umgebung fehlt')
  mkdirSync(screens, { recursive: true })

  describe('Account-Registry gemountet', { concurrency: 1 }, () => {
    before(async () => {
      try {
        browser = await chromium.launch({ headless: true, channel: 'chrome' })
      } catch {
        browser = await chromium.launch({ headless: true })
      }
    })

    after(async () => {
      const pass = faelle.filter((fall) => fall.pass).length
      const ergebnis = {
        status: pass === faelle.length && faelle.length > 0 ? 'PASS' : 'FAIL',
        caseCount: faelle.length,
        pass,
        fail: faelle.length - pass,
        browser: browser ? { version: browser.version() } : null,
        motion: 'reduce ist in der Layout-Prüfung emuliert',
        cases: faelle,
        externalRequests: externe,
      }
      writeFileSync(evidenceFile, `${JSON.stringify(ergebnis, null, 2)}\n`)
      await browser?.close()
    })

    function fall(name: string, fn: (page: Page) => Promise<unknown>) {
      test(name, { timeout: 90000 }, async () => {
        if (!browser) throw new Error('Browser nicht gestartet')
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
        page.setDefaultTimeout(8000)
        try {
          const detail = await fn(page)
          faelle.push({ name, pass: true, detail: detail ?? undefined })
        } catch (error) {
          const message = error instanceof Error ? error.stack ?? error.message : String(error)
          faelle.push({ name, pass: false, error: message.slice(0, 2000) })
          await page.screenshot({ path: `${screens}/${name.replace(/[^\w.-]+/g, '_').slice(0, 80)}.png`, fullPage: true }).catch(() => undefined)
          throw error
        } finally {
          await page.close()
        }
      })
    }

    async function pfad(
      page: Page,
      opts: {
        props: Props
        name: string
        editor: string
        vorbereiten: () => Promise<void>
        erfolg: string
        danach: Props
        fehlt?: boolean
      },
    ) {
      await oeffnen(page)
      await setzen(page, opts.props)
      await opts.vorbereiten()
      const vorherRefresh = await refreshes(page)
      await senden(page, opts.editor)
      await page.waitForFunction((erwartet) => window.__registryAufrufe.length >= erwartet, 1)
      const calls = await aufrufe(page)
      assert.equal(calls.length, 1)
      assert.equal(calls[0]?.name, opts.name)
      await page.waitForSelector('[data-registry-ausgang="offen"]')
      assert.equal(await page.locator(`text=${REGISTRY_COPY.speichert}`).count(), 1)
      assert.equal(await refreshes(page), vorherRefresh)
      await erledigen(page, calls[0]!.id, { ok: true, wert: null })
      await beleg(page, opts.editor, 'gespeichert').waitFor()
      await page.getByText(opts.erfolg, { exact: true }).waitFor()
      await page.getByText(REGISTRY_COPY.listeNichtGeladen, { exact: true }).waitFor()
      assert.equal(await refreshes(page), vorherRefresh + 1)
      await setzen(page, opts.danach)
      await page.getByText(REGISTRY_COPY.listeNeu, { exact: true }).waitFor()
      if (opts.fehlt) await page.getByText(REGISTRY_COPY.listeFehlt, { exact: true }).waitFor()
      assert.equal(await anzahl(page), 1)
      ruhig()
      return calls[0]
    }

    fall('traveller-anlegen', async (page) => {
      const editor = 'anlegen'
      await pfad(page, {
        props: liste([]),
        name: 'traveller-anlegen',
        editor,
        erfolg: REGISTRY_COPY.erfolgAngelegt,
        danach: liste([person(1, 'Synthetische Person A')]),
        vorbereiten: async () => {
          await page.getByRole('button', { name: REGISTRY_COPY.reisendenHinzufuegen }).click()
          await page.locator('[data-registry-editor="anlegen"] input:not([role="searchbox"])').fill('Synthetische Person A')
        },
      })
    })

    fall('traveller-aendern', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await pfad(page, {
        props: liste([traveller]),
        name: 'traveller-aendern',
        editor,
        erfolg: REGISTRY_COPY.erfolgGeaendert,
        danach: liste([person(1, 'Synthetische Person A2')]),
        vorbereiten: async () => {
          await verwalten(page, traveller.id)
          await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
          await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Synthetische Person B')
        },
      })
    })

    fall('traveller-loeschen', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:loeschen`
      await pfad(page, {
        props: liste([traveller]),
        name: 'traveller-loeschen',
        editor,
        erfolg: REGISTRY_COPY.erfolgGeloescht,
        danach: liste([]),
        fehlt: true,
        vorbereiten: async () => {
          await verwalten(page, traveller.id)
          await page.locator(`[data-fokus="loeschen:${traveller.id}"]`).click()
          await page.getByText(`Synthetische Person A – ${REGISTRY_COPY.loeschenTitel}`).waitFor()
        },
      })
    })

    fall('citizenship-anlegen', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:citizenship-anlegen`
      await pfad(page, {
        props: liste([traveller]),
        name: 'citizenship-anlegen',
        editor,
        erfolg: REGISTRY_COPY.erfolgCitizenship,
        danach: liste([person(1, 'Synthetische Person A', { citizenships: [staat(2, 'DE')] })]),
        vorbereiten: async () => {
          await verwalten(page, traveller.id)
          await page.locator(`[data-fokus="staat-knopf:${traveller.id}"]`).click()
          await waehle(page, editor, 'DE')
        },
      })
    })

    fall('citizenship-loeschen', async (page) => {
      const traveller = person(1, 'Synthetische Person A', { citizenships: [staat(2, 'DE')] })
      const editor = `citizenship:${id(2)}:loeschen`
      await pfad(page, {
        props: liste([traveller]),
        name: 'citizenship-loeschen',
        editor,
        erfolg: REGISTRY_COPY.erfolgCitizenshipEntfernt,
        danach: liste([person(1, 'Synthetische Person A')]),
        fehlt: true,
        vorbereiten: async () => {
          await verwalten(page, traveller.id)
          await page.locator(`[data-fokus="staat-entfernen:${id(2)}"]`).click()
          await page.getByText(REGISTRY_COPY.loeschenTitel).waitFor()
        },
      })
    })

    fall('document-anlegen', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:document-anlegen`
      await pfad(page, {
        props: liste([traveller]),
        name: 'document-anlegen',
        editor,
        erfolg: REGISTRY_COPY.erfolgDokument,
        danach: liste([person(1, 'Synthetische Person A', { documents: [dokument(3)] })]),
        vorbereiten: async () => {
          await verwalten(page, traveller.id)
          await page.locator(`[data-fokus="dokument-knopf:${traveller.id}"]`).click()
          await waehle(page, editor, 'passport')
        },
      })
    })

    fall('document-aendern', async (page) => {
      const traveller = person(1, 'Synthetische Person A', { documents: [dokument(3)] })
      const editor = `document:${id(3)}:aendern`
      await pfad(page, {
        props: liste([traveller]),
        name: 'document-aendern',
        editor,
        erfolg: REGISTRY_COPY.erfolgDokument,
        danach: liste([person(1, 'Synthetische Person A2', { documents: [dokument(3)] })]),
        vorbereiten: async () => {
          await verwalten(page, traveller.id)
          await page.getByRole('button', { name: REGISTRY_COPY.dokumentAendern }).click()
          await waehle(page, editor, 'national_id')
        },
      })
    })

    fall('document-loeschen', async (page) => {
      const traveller = person(1, 'Synthetische Person A', { documents: [dokument(3)] })
      const editor = `document:${id(3)}:loeschen`
      await pfad(page, {
        props: liste([traveller]),
        name: 'document-loeschen',
        editor,
        erfolg: REGISTRY_COPY.erfolgDokumentEntfernt,
        danach: liste([person(1, 'Synthetische Person A')]),
        fehlt: true,
        vorbereiten: async () => {
          await verwalten(page, traveller.id)
          await page.locator(`[data-fokus="dokument-entfernen:${id(3)}"]`).click()
          const dialog = page.locator(`[data-registry-editor="${editor}"]`)
          await dialog.getByText('Reisepass').waitFor()
          await dialog.getByText(REGISTRY_COPY.loeschenTitel).waitFor()
        },
      })
    })

    fall('gleiche Runde sendet eine Aktion', async (page) => {
      await oeffnen(page)
      await setzen(page, liste([]))
      await page.getByRole('button', { name: REGISTRY_COPY.reisendenHinzufuegen }).click()
      await page.locator('[data-registry-editor="anlegen"] input:not([role="searchbox"])').fill('Synthetische Person A')
      const ereignisse = await burst(page, 'anlegen')
      await page.waitForFunction(() => window.__registryAufrufe.length >= 1)
      assert.equal(ereignisse, 2)
      assert.equal(await anzahl(page), 1)
      ruhig()
      return { ereignisse }
    })

    fall('Erfolg von A bleibt auf A', async (page) => {
      const a = person(1, 'Synthetische Person A')
      const b = person(2, 'Synthetische Person B')
      const editor = `reisender:${a.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([a, b]))
      await verwalten(page, a.id)
      await page.locator(`[data-fokus="aendern:${a.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Geaendert A')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      await verwalten(page, b.id)
      const vorher = await fokus(page)
      const calls = await aufrufe(page)
      await erledigen(page, calls[0]!.id, { ok: true, wert: null })
      await beleg(page, editor, 'gespeichert').waitFor()
      const panelB = page.locator(`[data-registry-innen="reisender:${b.id}"] [data-registry-verwaltung]`)
      assert.equal(await panelB.locator('[data-registry-beleg]').count(), 0)
      assert.equal(await panelB.getByText(REGISTRY_COPY.erfolgGeaendert).count(), 0)
      assert.equal(await page.locator(`[data-registry-innen="reisender:${a.id}"]`).getByText(REGISTRY_COPY.erfolgGeaendert).count(), 1)
      const nachher = await fokus(page)
      assert.notEqual(nachher.fokus, `aendern:${a.id}`)
      assert.equal(nachher.editor === editor, false)
      ruhig()
      return { vorher, nachher }
    })

    fall('Unbekannt von A bleibt auf A', async (page) => {
      const a = person(1, 'Synthetische Person A')
      const b = person(2, 'Synthetische Person B')
      const editor = `reisender:${a.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([a, b]))
      await verwalten(page, a.id)
      await page.locator(`[data-fokus="aendern:${a.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Geaendert A')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      await verwalten(page, b.id)
      const calls = await aufrufe(page)
      await erledigen(page, calls[0]!.id, null)
      await beleg(page, editor, 'unbestaetigt').waitFor()
      const panelB = page.locator(`[data-registry-innen="reisender:${b.id}"] [data-registry-verwaltung]`)
      assert.equal(await panelB.getByText(REGISTRY_COPY.unbekannt).count(), 0)
      assert.equal(await page.locator(`[data-registry-innen="reisender:${a.id}"]`).getByText(REGISTRY_COPY.unbekannt).count(), 1)
      const lage = await fokus(page)
      assert.notEqual(lage.fokus, `aendern:${a.id}`)
      ruhig()
    })

    fall('Schliessen und erneut oeffnen sendet nichts', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Entwurf')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      const calls = await aufrufe(page)
      await erledigen(page, calls[0]!.id, null)
      await beleg(page, editor, 'unbestaetigt').waitFor()
      const epocheBeleg = Number(await beleg(page, editor, 'unbestaetigt').getAttribute('data-registry-epoche'))
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Noch ein Entwurf')
      const epocheEditor = Number(await page.locator(`form[data-registry-editor="${editor}"]`).getAttribute('data-registry-epoche'))
      assert.ok(epocheEditor > epocheBeleg)
      const ereignisse = await burst(page, editor)
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).focus()
      await page.keyboard.press('Enter')
      assert.equal(ereignisse, 2)
      assert.equal(await anzahl(page), 1)
      ruhig()
      return { epocheBeleg, epocheEditor }
    })

    fall('veraltete Anerkennung schreibt nicht', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Entwurf')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      const calls = await aufrufe(page)
      await erledigen(page, calls[0]!.id, null)
      await beleg(page, editor, 'unbestaetigt').waitFor()
      const wiederholen = () => trotzdem(page, editor)
      await setzen(page, problem(503))
      await wiederholen()
      await setzen(page, { problem: null, travellers: null })
      await wiederholen()
      await setzen(page, liste([traveller]))
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).focus()
      await page.keyboard.press('Enter')
      await wiederholen()
      assert.equal(await anzahl(page), 1)
      await setzen(page, liste([person(1, 'Synthetische Person A2')]))
      await wiederholen()
      await page.waitForFunction(() => window.__registryAufrufe.length === 2)
      ruhig()
    })

    fall('unbekannt A dann B dann keine Anerkennung von A', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Entwurf A')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      let calls = await aufrufe(page)
      const alt = calls[0]!
      await erledigen(page, alt.id, null)
      const altBeleg = await beleg(page, editor, 'unbestaetigt').getAttribute('data-registry-beleg')
      await setzen(page, liste([person(1, 'Synthetische Person A2')]))
      await trotzdem(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 2)
      await trotzdem(page, editor)
      assert.equal(await anzahl(page), 2)
      calls = await aufrufe(page)
      await erledigen(page, calls[1]!.id, null)
      await page.locator('[data-registry-ausgang="unbestaetigt"]').nth(1).waitFor()
      const aenderungen = await page.locator(`[data-registry-beleg][data-registry-editor="${editor}"]`).all()
      assert.equal(aenderungen.length, 2)
      const mitKnopf = await page.locator(`[data-registry-beleg][data-registry-editor="${editor}"]`).filter({ hasText: REGISTRY_COPY.erneutAktion }).count()
      assert.equal(mitKnopf, 1)
      const blocker = page.locator(`[data-registry-beleg][data-registry-editor="${editor}"]`).filter({ hasText: REGISTRY_COPY.erneutAktion })
      assert.notEqual(await blocker.getAttribute('data-registry-beleg'), altBeleg)
      await trotzdem(page, editor)
      assert.equal(await anzahl(page), 2)
      await setzen(page, liste([person(1, 'Synthetische Person A3')]))
      await page.getByRole('heading', { name: 'Synthetische Person A3' }).waitFor()
      await trotzdem(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 3)
      const letzter = (await aufrufe(page))[2]!
      assert.equal(letzter.argument.label, 'Entwurf A')
      assert.equal(letzter.argument.id, traveller.id)
      assert.equal(await beleg(page, editor, 'unbestaetigt').first().getAttribute('data-registry-beleg'), altBeleg)
      ruhig()
    })

    fall('bekannte Wiederholung laesst das alte Unbekannt stehen', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Entwurf A')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      const alt = (await aufrufe(page))[0]!
      await erledigen(page, alt.id, null)
      const altBeleg = await beleg(page, editor, 'unbestaetigt').getAttribute('data-registry-beleg')
      await setzen(page, liste([person(1, 'Synthetische Person A2')]))
      await page.getByText(REGISTRY_COPY.unbekanntWiederholung, { exact: true }).waitFor()
      await trotzdem(page)
      await page.waitForFunction(() => window.__registryAufrufe.length === 2)
      const zweiter = (await aufrufe(page))[1]!
      await erledigen(page, zweiter.id, { ok: false, meldung: 'Nein.' })
      await page.getByText('Nein.', { exact: true }).waitFor()
      assert.equal(await beleg(page, editor, 'unbestaetigt').getAttribute('data-registry-beleg'), altBeleg)
      await senden(page, editor)
      await page.keyboard.press('Enter')
      assert.equal(await anzahl(page), 2)
      await setzen(page, liste([person(1, 'Synthetische Person A3')]))
      await trotzdem(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 3)
      assert.equal((await aufrufe(page))[2]?.argument.id, traveller.id)
      ruhig()
    })

    fall('Dokument D bleibt von Dokument E getrennt', async (page) => {
      const traveller = person(1, 'Synthetische Person A', { documents: [dokument(3), dokument(4)] })
      const editorD = `document:${id(3)}:aendern`
      const editorE = `document:${id(4)}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-registry-innen="document:${id(3)}"]`).getByRole('button', { name: REGISTRY_COPY.dokumentAendern }).click()
      await waehle(page, editorD, 'national_id')
      await senden(page, editorD)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      const alt = (await aufrufe(page))[0]!
      assert.equal(alt.argument.documentId, id(3))
      assert.equal(alt.argument.documentType, 'national_id')
      await erledigen(page, alt.id, null)
      await setzen(page, liste([person(1, 'Synthetische Person A2', { documents: [dokument(3), dokument(4)] })]))
      await page.locator(`[data-registry-innen="document:${id(4)}"]`).getByRole('button', { name: REGISTRY_COPY.dokumentAendern }).click()
      await waehle(page, editorE, 'unknown')
      await trotzdem(page, editorD)
      await page.waitForFunction(() => window.__registryAufrufe.length === 2)
      const wieder = (await aufrufe(page))[1]!
      assert.equal(wieder.name, 'document-aendern')
      assert.equal(wieder.argument.documentId, id(3))
      assert.equal(wieder.argument.documentType, 'national_id')
      assert.notEqual(wieder.argument.documentType, 'unknown')
      ruhig()
    })

    fall('Staatsbuergerschaft bleibt vom Dokumentformular getrennt', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const staatEditor = `reisender:${traveller.id}:citizenship-anlegen`
      const dokumentEditor = `reisender:${traveller.id}:document-anlegen`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="staat-knopf:${traveller.id}"]`).click()
      await waehle(page, staatEditor, 'AT')
      await senden(page, staatEditor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      const alt = (await aufrufe(page))[0]!
      await erledigen(page, alt.id, null)
      await setzen(page, liste([person(1, 'Synthetische Person A2')]))
      await page.locator(`[data-fokus="dokument-knopf:${traveller.id}"]`).click()
      await waehle(page, dokumentEditor, 'passport')
      await trotzdem(page, staatEditor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 2)
      const wieder = (await aufrufe(page))[1]!
      assert.equal(wieder.name, 'citizenship-anlegen')
      assert.equal(wieder.argument.countryCode, 'AT')
      assert.equal(wieder.argument.travellerId, traveller.id)
      assert.equal('documentType' in wieder.argument, false)
      ruhig()
    })

    fall('Verschwinden bewegt den Fokus nur aus dem entfernten Ziel', async (page) => {
      const a = person(1, 'Synthetische Person A', {
        citizenships: [staat(2, 'DE')],
        documents: [dokument(3)],
      })
      const b = person(4, 'Synthetische Person B')
      await oeffnen(page)
      await setzen(page, liste([a]))
      await page.locator(`[data-fokus="verwalten:${a.id}"]`).focus()
      await setzen(page, liste([]))
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-fokus') === 'anlegen-knopf')

      await setzen(page, liste([a, b]))
      await verwalten(page, a.id)
      await page.locator(`[data-fokus="staat-entfernen:${id(2)}"]`).focus()
      await setzen(page, liste([person(1, 'Synthetische Person A', { documents: [dokument(3)] }), b]))
      await page.waitForFunction(
        (ziel) => document.activeElement?.getAttribute('data-fokus') === ziel,
        `verwalten:${a.id}`,
      )

      await setzen(page, liste([a, b]))
      await verwalten(page, a.id)
      await page.locator(`[data-fokus="dokument-entfernen:${id(3)}"]`).focus()
      await setzen(page, liste([person(1, 'Synthetische Person A', { citizenships: [staat(2, 'DE')] }), b]))
      await page.waitForFunction(
        (ziel) => document.activeElement?.getAttribute('data-fokus') === ziel,
        `verwalten:${a.id}`,
      )

      await setzen(page, liste([a, b]))
      await page.locator(`[data-fokus="verwalten:${a.id}"]`).focus()
      await page.locator('#ausserhalb').focus()
      await setzen(page, liste([b]))
      await page.waitForFunction(() => document.activeElement?.id === 'ausserhalb')
      ruhig()
    })

    fall('Lesefehler behaelt den Entwurf', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Entwurf bleibt')
      await setzen(page, problem(500))
      await page.getByText(REGISTRY_COPY.fehler500).waitFor()
      assert.equal(await anzahl(page), 0)
      await setzen(page, problem(503))
      await setzen(page, { problem: null, travellers: null })
      await setzen(page, liste([traveller]))
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).waitFor()
      assert.equal(await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).inputValue(), 'Entwurf bleibt')
      ruhig()
    })

    fall('Lesen und spaetere Fehler senden keine Aktion', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Entwurf')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      await erledigen(page, (await aufrufe(page))[0]!.id, null)
      await page.evaluate(() => {
        window.__registryRefreshMode = 'defer'
      })
      const ereignisse = await page.evaluate(`(() => {
        const knoepfe = document.querySelectorAll('button')
        let knopf = null
        for (const eintrag of knoepfe) {
          if (eintrag.textContent && eintrag.textContent.includes('Erneut lesen')) knopf = eintrag
        }
        if (!(knopf instanceof HTMLButtonElement)) return -1
        Object.defineProperty(knopf, 'disabled', { configurable: true, get() { return false }, set() {} })
        knopf.click()
        knopf.click()
        return window.__registryRefreshes.length
      })()`)
      assert.equal(ereignisse, 2)
      await setzen(page, liste([person(1, 'Synthetische Person A2')]))
      assert.equal(await anzahl(page), 1)
      await setzen(page, problem(500))
      await trotzdem(page)
      await setzen(page, problem(503))
      await trotzdem(page)
      await setzen(page, { problem: null, travellers: null })
      await trotzdem(page)
      await page.evaluate(() => {
        for (const id of window.__registryRefreshes) window.__registryRefreshErledigen(id)
      })
      assert.equal(await anzahl(page), 1)
      await setzen(page, liste([person(1, 'Synthetische Person A3')]))
      await trotzdem(page)
      await page.waitForFunction(() => window.__registryAufrufe.length === 2)
      ruhig()
      return { refreshes: ereignisse }
    })

    fall('unveraenderte Liste gibt keine weitere Speicherung frei', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Entwurf')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      await erledigen(page, (await aufrufe(page))[0]!.id, { ok: true, wert: null })
      await page.getByText(REGISTRY_COPY.listeNichtGeladen, { exact: true }).waitFor()
      await setzen(page, liste([person(1, 'Synthetische Person A')]))
      await page.getByText(REGISTRY_COPY.listeNichtGeladen, { exact: true }).waitFor()
      await erledigen(page, (await aufrufe(page))[0]!.id, null).catch(() => undefined)
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Entwurf')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      await erledigen(page, (await aufrufe(page))[0]!.id, null)
      await setzen(page, liste([{ ...traveller }]))
      await senden(page, editor)
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).press('Enter')
      await trotzdem(page)
      assert.equal(await anzahl(page), 1)
      ruhig()
    })

    fall('schmutzige Uebernahme behaelt die Eingabe', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Meine Eingabe')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      await setzen(page, liste([person(1, 'Kanonischer Stand')]))
      assert.equal(await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).inputValue(), 'Meine Eingabe')
      await page.getByText(REGISTRY_COPY.konflikt, { exact: true }).waitFor()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).focus()
      await erledigen(page, (await aufrufe(page))[0]!.id, { ok: true, wert: null })
      await beleg(page, editor, 'gespeichert').waitFor()
      assert.equal(await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).inputValue(), 'Meine Eingabe')
      assert.equal((await fokus(page)).fokus, null)
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Meine Eingabe')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      await setzen(page, liste([person(1, 'Kanonischer Stand')]))
      await erledigen(page, (await aufrufe(page))[0]!.id, null)
      await page.getByText(REGISTRY_COPY.unbekannt, { exact: true }).waitFor()
      assert.equal(await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).inputValue(), 'Meine Eingabe')
      ruhig()
    })

    fall('saubere Uebernahme entzieht dem alten Abschluss die Oberflaeche', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      await setzen(page, liste([person(1, 'Neuer Stand')]))
      assert.equal(await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).inputValue(), 'Neuer Stand')
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).focus()
      await erledigen(page, (await aufrufe(page))[0]!.id, { ok: true, wert: null })
      await beleg(page, editor, 'gespeichert').waitFor()
      assert.equal(await page.locator(`form[data-registry-editor="${editor}"]`).count(), 1)
      assert.equal(await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).inputValue(), 'Neuer Stand')
      assert.equal((await fokus(page)).editor, editor)
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      await setzen(page, liste([person(1, 'Neuer Stand')]))
      await erledigen(page, (await aufrufe(page))[0]!.id, null)
      await page.getByText(REGISTRY_COPY.unbekannt, { exact: true }).waitFor()
      assert.equal(await page.locator(`form[data-registry-editor="${editor}"]`).getByText(REGISTRY_COPY.unbekannt).count(), 0)
      ruhig()
    })

    fall('gleiche Bezeichnung waehlt keine Karte', async (page) => {
      const a = person(1, 'Synthetische Person A')
      const b = person(2, 'Synthetische Person A')
      await oeffnen(page)
      await setzen(page, liste([a, b]))
      await page.getByRole('button', { name: REGISTRY_COPY.reisendenHinzufuegen }).click()
      await page.locator('[data-registry-editor="anlegen"] input:not([role="searchbox"])').fill('Synthetische Person A')
      await senden(page, 'anlegen')
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      const fremd = '99999999-9999-4999-8999-999999999999'
      await erledigen(page, (await aufrufe(page))[0]!.id, { ok: true, wert: { id: fremd } })
      await page.getByText(REGISTRY_COPY.erfolgAngelegt, { exact: true }).waitFor()
      assert.equal(await page.locator('article').count(), 2)
      assert.equal(await page.locator(`[data-registry-innen="reisender:${fremd}"]`).count(), 0)
      assert.equal(await page.locator('[data-registry-verwaltung="offen"]').count(), 0)
      ruhig()
    })

    fall('leere Dokumentzuordnung bleibt leer', async (page) => {
      const traveller = person(1, 'Synthetische Person A', {
        citizenships: [staat(2, 'DE')],
        documents: [dokument(3)],
      })
      const editor = `document:${id(3)}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.getByRole('button', { name: REGISTRY_COPY.dokumentAendern }).click()
      const auswahl = page.locator(`[data-registry-editor="${editor}"] select:has(option:text("${REGISTRY_COPY.dokumentKeineZuordnung}"))`)
      assert.equal(await auswahl.inputValue(), '')
      await setzen(page, liste([person(1, 'Synthetische Person A2', {
        citizenships: [staat(2, 'DE')],
        documents: [dokument(3)],
      })]))
      assert.equal(await auswahl.inputValue(), '')
      ruhig()
    })

    fall('acht Staatsbuergerschaften lassen Aendern und Entfernen', async (page) => {
      const citizenships = LAENDER.slice(0, 8).map((code, index) => staat(10 + index, code))
      const traveller = person(1, 'Synthetische Person A', { citizenships })
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      assert.equal(await page.getByRole('button', { name: REGISTRY_COPY.staatsbuergerschaftHinzufuegen }).count(), 0)
      await page.getByText(REGISTRY_COPY.staatsbuergerschaftLimit).waitFor()
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="reisender:${traveller.id}:aendern"]`).waitFor()
      await page.locator(`[data-fokus="staat-entfernen:${citizenships[0]!.id}"]`).click()
      await page.getByText(REGISTRY_COPY.loeschenTitel).waitFor()
      await senden(page, `citizenship:${citizenships[0]!.id}:loeschen`)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      assert.equal((await aufrufe(page))[0]?.name, 'citizenship-loeschen')
      ruhig()
    })

    fall('zwoelf Dokumente lassen das bestehende aendern', async (page) => {
      const documents = Array.from({ length: 12 }, (_, index) => dokument(20 + index))
      const traveller = person(1, 'Synthetische Person A', { documents })
      const editor = `document:${documents[0]!.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      assert.equal(await page.getByRole('button', { name: REGISTRY_COPY.dokumentHinzufuegen }).count(), 0)
      await page.getByText(REGISTRY_COPY.dokumentLimit).waitFor()
      await page.locator(`[data-registry-innen="document:${documents[0]!.id}"]`).getByRole('button', { name: REGISTRY_COPY.dokumentAendern }).click()
      await waehle(page, editor, 'national_id')
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      const call = (await aufrufe(page))[0]!
      assert.equal(call.name, 'document-aendern')
      assert.equal(call.argument.documentId, documents[0]!.id)
      assert.equal(call.argument.citizenshipId, '')
      ruhig()
    })

    fall('leer 500 und 503 bleiben unterscheidbar', async (page) => {
      await oeffnen(page)
      await setzen(page, liste([]))
      await page.getByText(REGISTRY_COPY.leerTitel, { exact: true }).waitFor()
      assert.equal(await page.getByText(REGISTRY_COPY.fehlerTitel).count(), 0)
      await setzen(page, problem(500))
      await page.getByText(REGISTRY_COPY.fehlerTitel, { exact: true }).waitFor()
      await page.getByText(REGISTRY_COPY.fehler500).waitFor()
      assert.equal(await page.getByText(REGISTRY_COPY.leerTitel).count(), 0)
      await setzen(page, problem(503))
      await page.getByText(REGISTRY_COPY.fehler503).waitFor()
      const vorher = await anzahl(page)
      await page.getByRole('button', { name: /Erneut lesen/ }).click()
      assert.equal(await refreshes(page), 1)
      assert.equal(await anzahl(page), vorher)
      ruhig()
    })

    fall('Ablehnung zeigt die Meldung', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await senden(page, editor)
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      await erledigen(page, (await aufrufe(page))[0]!.id, { ok: false, meldung: 'Bitte prüfen.' })
      await page.getByText('Bitte prüfen.', { exact: true }).waitFor()
      assert.equal(await page.getByText(/nichts gespeichert|nicht gespeichert/i).count(), 0)
      ruhig()
    })

    fall('Tastatur Escape und Enter', async (page) => {
      const traveller = person(1, 'Synthetische Person A')
      const editor = `reisender:${traveller.id}:aendern`
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      await page.locator('[data-registry-verwaltung="offen"]').focus()
      await page.keyboard.press('Tab')
      assert.equal((await fokus(page)).fokus, `aendern:${traveller.id}`)
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => document.querySelector('[data-registry-verwaltung]') == null)
      assert.equal((await fokus(page)).fokus, `verwalten:${traveller.id}`)
      await verwalten(page, traveller.id)
      await page.locator(`[data-fokus="loeschen:${traveller.id}"]`).click()
      await page.keyboard.press('Escape')
      assert.equal(await page.locator(`[data-registry-editor="reisender:${traveller.id}:loeschen"]`).count(), 0)
      assert.equal(await page.locator('[data-registry-verwaltung="offen"]').count(), 1)
      assert.equal((await fokus(page)).fokus, `loeschen:${traveller.id}`)
      await page.locator(`[data-fokus="aendern:${traveller.id}"]`).click()
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).fill('Mit Enter')
      await page.locator(`[data-registry-editor="${editor}"] input:not([role="searchbox"])`).press('Enter')
      await page.waitForFunction(() => window.__registryAufrufe.length === 1)
      assert.equal((await aufrufe(page))[0]?.name, 'traveller-aendern')
      ruhig()
    })

    fall('schmale Breiten und grosse Schrift', async (page) => {
      const traveller = person(1, 'A'.repeat(40))
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await oeffnen(page)
      await setzen(page, liste([traveller]))
      await verwalten(page, traveller.id)
      const breiten = [320, 360, 390, 768, 1280]
      const messungen = []
      for (const breite of breiten) {
        await page.setViewportSize({ width: breite, height: 900 })
        const masse = await page.evaluate(() => {
          const wurzel = document.querySelector('[data-registry-klasse]')
          const stil = wurzel ? getComputedStyle(wurzel) : null
          return {
            scroll: document.documentElement.scrollWidth,
            client: document.documentElement.clientWidth,
            overflow: stil?.overflow ?? '',
            animation: stil?.animationName ?? '',
          }
        })
        assert.ok(masse.scroll <= masse.client + 1, `${breite} ${masse.scroll}>${masse.client}`)
        assert.notEqual(masse.overflow, 'hidden')
        messungen.push({ breite, ...masse, font: 16 })
      }
      await page.setViewportSize({ width: 320, height: 900 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '32px'
      })
      const gross = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
        font: getComputedStyle(document.documentElement).fontSize,
      }))
      assert.equal(gross.font, '32px')
      assert.ok(gross.scroll <= gross.client + 1, `32px ${gross.scroll}>${gross.client}`)
      await page.screenshot({ path: `${screens}/320.png` })
      await page.screenshot({ path: `${screens}/320-root-32.png` })
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.evaluate(() => {
        document.documentElement.style.fontSize = ''
      })
      await page.screenshot({ path: `${screens}/1280.png` })
      ruhig()
      return { messungen, gross, motion: 'reduce', rootFont: '32px' }
    })
  })
}
