// scripts/ux-u3b-country-empty-1/mounted-render.ts
//
// Synthetic mounted render of TripWorkspaceDestinationEssentials.
// Not an authenticated trip, not Preview, and not a Work Production pass.
// External requests are aborted.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium, type Browser, type Page } from 'playwright'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import nesting from 'tailwindcss/nesting'
import autoprefixer from 'autoprefixer'

import TripWorkspaceDestinationEssentials from '@/components/trips/TripWorkspaceDestinationEssentials'
import {
  DESTINATION_ESSENTIALS_LEERTEXT,
  DESTINATION_ESSENTIALS_TITEL,
  type DestinationEssentialBereich,
  type DestinationEssentialZiel,
  type DestinationEssentialsAbleitung,
  type DestinationOfficialLage,
  type DestinationSafetyLage,
  type DestinationSeasonalLage,
} from '@/lib/trips/destination-essentials'
import { einreiseinformationenUngeprueft } from '@/lib/trips/ux-u3b-country-empty-1/leere-einreise'

const ARTIFACTS = '/opt/cursor/artifacts/u3b-country-empty-1'
const VIEWPORTS = [
  { name: '320', width: 320, height: 720 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
] as const

function bereich<Lage extends string>(
  lage: Lage,
  extra: Partial<DestinationEssentialBereich<Lage>> = {},
): DestinationEssentialBereich<Lage> {
  return {
    lage,
    text: extra.text ?? DESTINATION_ESSENTIALS_LEERTEXT,
    unvollstaendig: false,
    details: extra.details ?? [],
    links: extra.links ?? [],
  }
}

function ziel(
  teil: Partial<DestinationEssentialZiel> & Pick<DestinationEssentialZiel, 'stageId' | 'name'>,
): DestinationEssentialZiel {
  return {
    stageId: teil.stageId,
    position: teil.position ?? 1,
    name: teil.name,
    countryCode: teil.countryCode === undefined ? 'TH' : teil.countryCode,
    countryLabel: teil.countryLabel === undefined ? 'Thailand' : teil.countryLabel,
    placeId: teil.placeId ?? null,
    latitude: null,
    longitude: null,
    arrivalDate: '2026-11-01',
    departureDate: '2026-11-04',
    zeitraumText: teil.zeitraumText ?? '01. Nov. – 04. Nov.',
    einreise: teil.einreise ?? bereich<DestinationOfficialLage>('keine_evidence'),
    sicherheit: teil.sicherheit ?? bereich<DestinationSafetyLage>('keine_evidence'),
    saison: teil.saison ?? bereich<DestinationSeasonalLage>('keine_evidence'),
    hatHinweise: teil.hatHinweise ?? false,
  }
}

function ableitung(ziele: DestinationEssentialZiel[]): DestinationEssentialsAbleitung {
  return {
    titel: DESTINATION_ESSENTIALS_TITEL,
    ziele,
    leerText: DESTINATION_ESSENTIALS_LEERTEXT,
    hatZiele: true,
    hatHinweise: true,
    loestSucheAus: false,
  }
}

const geteilt = ableitung([
  ziel({
    stageId: 'bkk',
    name: 'Bangkok',
    hatHinweise: true,
    sicherheit: bereich<DestinationSafetyLage>('important_notice', {
      text: 'Hinweis Bangkok',
      details: [
        {
          id: 's-bkk',
          titel: 'Hinweis',
          text: 'Markt Bangkok',
          kontextText: null,
          dokumentLabel: null,
        },
      ],
      links: [{ href: 'https://example.test/bkk', label: 'Quelle Bangkok', art: 'source' }],
    }),
  }),
  ziel({
    stageId: 'koc',
    position: 2,
    name: 'Ko Chang',
    zeitraumText: '04. Nov. – 08. Nov.',
    hatHinweise: true,
    sicherheit: bereich<DestinationSafetyLage>('information', { text: 'Hinweis Ko Chang' }),
  }),
  ziel({
    stageId: 'hkt',
    position: 3,
    name: 'Phuket',
    zeitraumText: '08. Nov. – 12. Nov.',
    hatHinweise: true,
    saison: bereich<DestinationSeasonalLage>('timing_notice', { text: 'Regenzeit Phuket' }),
  }),
])

const wiedereinreise = ableitung([
  ziel({ stageId: 'th-aus', name: 'Bangkok' }),
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
])

function seite(name: string, markup: string, productCss: string, extraCss = ''): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${name}</title><style>${productCss}</style>${extraCss ? `<style>${extraCss}</style>` : ''}</head><body class="bg-surface-25 text-ink-800"><div class="mx-auto max-w-3xl px-3 py-4" data-essentials-shell>${markup}</div></body></html>`
}

async function compileProductCss(): Promise<string> {
  const from = join(process.cwd(), 'styles/globals.css')
  const input = readFileSync(from, 'utf8')
  const result = await postcss([nesting(), tailwindcss(), autoprefixer()]).process(input, { from })
  return result.css
}

async function launchBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({ channel: 'chrome' })
  } catch {
    return await chromium.launch()
  }
}

async function oeffne(browser: Browser, html: string, width: number, height: number): Promise<Page> {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.route('**/*', async (route) => {
    const url = route.request().url()
    if (url.startsWith('data:') || url.startsWith('about:')) {
      await route.continue()
      return
    }
    await route.abort()
  })
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  return page
}

async function main() {
  mkdirSync(ARTIFACTS, { recursive: true })
  const css = await compileProductCss()
  const browser = await launchBrowser()
  const satz = einreiseinformationenUngeprueft('Thailand')
  const protokoll: Record<string, unknown> = {}

  try {
    const htmlGeteilt = seite('geteilt', renderToStaticMarkup(createElement(TripWorkspaceDestinationEssentials, { essentials: geteilt })), css)
    for (const viewport of VIEWPORTS) {
      const page = await oeffne(browser, htmlGeteilt, viewport.width, viewport.height)
      const messung = await page.evaluate(`(() => {
        const section = document.querySelector('[data-destination-essentials]')
        const shell = document.querySelector('[data-essentials-shell]')
        const text = section?.textContent || ''
        const stages = ['bkk', 'koc', 'hkt'].map((id) => Boolean(document.querySelector('[data-destination-stage="' + id + '"]')))
        return {
          shared: (text.match(/Einreiseinformationen Thailand noch nicht geprüft/g) || []).length,
          stages,
          overflow: shell ? shell.scrollWidth > shell.clientWidth + 1 : true,
          dichte: section?.getAttribute('data-destination-essentials-dichte') || null,
        }
      })()`)
      if (messung.shared !== 1 || messung.stages.some((sichtbar) => !sichtbar) || messung.overflow || messung.dichte !== 'voll') {
        throw new Error(`Geteilte Ansicht ungueltig bei ${viewport.name}: ${JSON.stringify(messung)}`)
      }
      const datei = join(ARTIFACTS, `shared-th-${viewport.name}.png`)
      await page.screenshot({ path: datei, fullPage: true })
      protokoll[`shared-${viewport.name}`] = { ...messung, screenshot: datei }
      await page.close()
    }

    const pageTaste = await oeffne(browser, htmlGeteilt, 390, 844)
    await pageTaste.locator('summary').first().focus()
    const fokusSummary = await pageTaste.evaluate(`document.activeElement?.tagName || null`)
    await pageTaste.keyboard.press('Enter')
    const offen = await pageTaste.locator('details[open]').count()
    const link = pageTaste.locator('a[href="https://example.test/bkk"]')
    await link.focus()
    const linkBox = await link.boundingBox()
    const aktiv = await pageTaste.evaluate(`document.activeElement?.getAttribute('href') || null`)
    if (fokusSummary !== 'SUMMARY' || offen < 1 || aktiv !== 'https://example.test/bkk' || !linkBox || linkBox.height < 44) {
      throw new Error(
        `Tastatur oder 44px nicht erfuellt: ${JSON.stringify({ fokusSummary, offen, aktiv, hoehe: linkBox?.height ?? null })}`,
      )
    }
    const tasteDatei = join(ARTIFACTS, 'shared-th-keyboard-390.png')
    await pageTaste.screenshot({ path: tasteDatei, fullPage: true })
    protokoll.keyboard = { fokusSummary, offen, aktiv, linkHeight: linkBox.height, screenshot: tasteDatei }
    await pageTaste.close()

    const htmlGross = seite(
      'root32',
      renderToStaticMarkup(createElement(TripWorkspaceDestinationEssentials, { essentials: geteilt })),
      css,
      'html { font-size: 32px; }',
    )
    const pageGross = await oeffne(browser, htmlGross, 390, 844)
    const gross = await pageGross.evaluate(`(() => {
      const satz = document.querySelector('[data-u3b-shared-entry-text]')
      const shell = document.querySelector('[data-essentials-shell]')
      const groesse = satz ? Number(getComputedStyle(satz).fontSize.replace('px', '')) : 0
      return {
        fontSize: groesse,
        overflow: shell ? shell.scrollWidth > shell.clientWidth + 1 : true,
        text: satz?.textContent || '',
      }
    })()`)
    if (gross.fontSize < 28 || gross.overflow || gross.text !== satz) {
      throw new Error(`Root 32px nicht lesbar: ${JSON.stringify(gross)}`)
    }
    const grossDatei = join(ARTIFACTS, 'shared-th-root32-390.png')
    await pageGross.screenshot({ path: grossDatei, fullPage: true })
    protokoll.root32 = { ...gross, screenshot: grossDatei }
    await pageGross.close()

    const htmlReentry = seite(
      'reentry',
      renderToStaticMarkup(createElement(TripWorkspaceDestinationEssentials, { essentials: wiedereinreise })),
      css,
    )
    const pageReentry = await oeffne(browser, htmlReentry, 320, 720)
    const reentry = await pageReentry.evaluate(`(() => {
      const text = document.querySelector('[data-destination-essentials]')?.textContent || ''
      return {
        shared: document.querySelectorAll('[data-u3b-shared-entry]').length,
        stages: ['th-aus', 'kh', 'th-rueck'].map((id) => Boolean(document.querySelector('[data-destination-stage="' + id + '"]'))),
        thailandSatz: (text.match(/Einreiseinformationen Thailand noch nicht geprüft/g) || []).length,
        kambodscha: text.includes('Siem Reap'),
        hinweis: text.includes('Hinweis Siem Reap'),
      }
    })()`)
    if (
      reentry.shared !== 0 ||
      reentry.thailandSatz !== 0 ||
      reentry.stages.some((sichtbar) => !sichtbar) ||
      !reentry.kambodscha ||
      !reentry.hinweis
    ) {
      throw new Error(`Wiedereinreise kollabiert: ${JSON.stringify(reentry)}`)
    }
    const reentryDatei = join(ARTIFACTS, 'reentry-th-kh-th-320.png')
    await pageReentry.screenshot({ path: reentryDatei, fullPage: true })
    protokoll.reentry = { ...reentry, screenshot: reentryDatei }
    await pageReentry.close()
  } finally {
    await browser.close()
  }

  writeFileSync(join(ARTIFACTS, 'mounted-report.json'), `${JSON.stringify(protokoll, null, 2)}\n`)
  console.log(JSON.stringify({ ok: true, artifacts: ARTIFACTS, protokoll }, null, 2))
}

void main()
