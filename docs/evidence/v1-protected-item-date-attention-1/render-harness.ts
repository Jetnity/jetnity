// Temporary synthetic render harness. Not a product route and not an auth bypass.
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium, type Page } from 'playwright'
import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import nesting from 'tailwindcss/nesting'
import autoprefixer from 'autoprefixer'

import TripWorkspaceJetztWichtig from '@/components/trips/TripWorkspaceJetztWichtig'
import { attentionAbleiten, type AttentionAbleitung } from '@/lib/trips/attention'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import { leereSafetyEvidence } from '@/lib/safety/evidence'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import { leereSeasonalEvidence } from '@/lib/seasonal/evidence'
import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import type { Trip, TripItem } from '@/types/trips'

const ROOT = dirname(fileURLToPath(import.meta.url))
const ARTIFACTS = '/opt/cursor/artifacts/v1-protected-item-date-attention-1'
const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '1024', width: 1024, height: 768 },
] as const

const JETZT = '2026-08-21T00:00:00.000Z'

function punkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'kind' | 'title'>): TripItem {
  return {
    dayId: 'day-1',
    stageId: 'stage-1',
    note: null,
    position: 1,
    startsOn: null,
    startsAt: null,
    endsOn: null,
    endsAt: null,
    priceAmount: null,
    priceCurrency: null,
    provider: null,
    externalRef: null,
    bookingUrl: null,
    bookingStatus: 'unconfirmed',
    bookingSource: null,
    bookingConfirmedAt: null,
    mobilityMode: null,
    originPlaceId: null,
    destinationPlaceId: null,
    originName: null,
    destinationName: null,
    connectionRef: null,
    mobilityChanges: null,
    mobilityEvidence: null,
    rentalSupplier: null,
    vehicleClass: null,
    transmission: null,
    rentalEvidence: null,
    ...teil,
  }
}

function safetyLeer(): SafetyEvaluation {
  return {
    factId: 'safety:checked_empty',
    factKey: 'checked_empty',
    category: 'unknown',
    eventStatus: 'unknown',
    evidenceStatus: 'current',
    freshness: 'current',
    relevance: 'not_affected',
    spatialPrecision: 'unknown',
    presentationClass: 'unknown',
    sourceSeverity: null,
    advisoryClass: null,
    authorityClass: 'unknown',
    affectedRefs: [],
    impact: [],
    reason: 'checked_empty',
    nextAction: 'observe',
    conflict: false,
    seasonalRejected: false,
    evidence: leereSafetyEvidence('fp-safety'),
    contextFingerprint: 'fp-safety',
    eventFingerprint: 'fp-safety',
  }
}

function seasonalLeer(): SeasonalEvaluation {
  return {
    factId: 'seasonal:checked_empty',
    factKey: 'checked_empty',
    category: 'unknown',
    evidenceClass: 'seasonal_pattern',
    outcome: 'unknown',
    evidenceStatus: 'current',
    freshness: 'current',
    relevance: 'not_applies',
    spatialPrecision: 'unknown',
    presentationClass: 'unknown',
    authorityClass: 'unknown',
    affectedRefs: [],
    impact: [],
    reason: 'checked_empty',
    nextAction: 'observe',
    conflict: false,
    acuteRejected: false,
    evidence: leereSeasonalEvidence(),
    contextFingerprint: 'fp-seasonal',
    factFingerprint: 'fp-seasonal',
  }
}

function geschuetzt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'title'>): TripItem {
  return punkt({
    kind: 'activity',
    startsOn: '2026-09-12',
    priceAmount: 18,
    priceCurrency: 'EUR',
    provider: 'getyourguide',
    ...teil,
  })
}

function synthetischeReise(): Trip {
  return {
    id: 'trip-syn',
    clientRef: 'trip-syn',
    title: 'Italien',
    origin: 'Zürich',
    originPlaceId: null,
    startDate: '2026-09-19',
    endDate: '2026-09-23',
    travellers: 2,
    currency: 'CHF',
    budgetAmount: 4000,
    status: 'draft',
    pace: 'balanced',
    interests: ['culture'],
    travelWish: null,
    revision: 1,
    lastMutationId: null,
    stages: [
      {
        id: 'stage-1',
        position: 1,
        name: 'Florenz',
        countryCode: 'IT',
        arrivalDate: '2026-09-19',
        departureDate: '2026-09-23',
        latitude: null,
        longitude: null,
        placeId: null,
      },
    ],
    days: [
      {
        id: 'day-1',
        stageId: 'stage-1',
        dayIndex: 1,
        dayDate: '2026-09-19',
        title: 'Anreise',
        items: [
          geschuetzt({ id: 'item-dom', title: 'Dom', position: 1 }),
          geschuetzt({
            id: 'item-ticket',
            title: 'Gratis-Ticket',
            position: 2,
            priceAmount: 0,
            provider: null,
          }),
          geschuetzt({
            id: 'item-booked',
            title: 'Reservierung Uffizien',
            position: 3,
            priceAmount: null,
            priceCurrency: null,
            provider: null,
            bookingStatus: 'booked',
          }),
          geschuetzt({
            id: 'item-link',
            title: 'Garten Boboli',
            position: 4,
            priceAmount: null,
            provider: null,
            bookingUrl: 'https://example.com/boboli',
          }),
          punkt({
            id: 'item-note',
            kind: 'note',
            title: 'Spaziergang',
            startsOn: '2026-09-12',
            position: 5,
          }),
        ],
      },
    ],
    ohneTag: [
      geschuetzt({
        id: 'item-loose',
        title: 'Ungeplante Führung',
        dayId: null,
        stageId: null,
      }),
    ],
    createdAt: JETZT,
    updatedAt: JETZT,
  }
}

function gitMeta() {
  const sourceCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  const porcelain = execSync('git status --porcelain', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
  return {
    sourceCommit,
    workingTree: porcelain.length === 0 ? 'clean' : 'dirty',
    dirtyPaths: porcelain,
  }
}

async function compileProductCss() {
  const from = join(process.cwd(), 'styles/globals.css')
  const input = readFileSync(from, 'utf8')
  const result = await postcss([nesting(), tailwindcss(), autoprefixer()]).process(input, { from })
  return {
    css: result.css,
    provenance: {
      source: 'styles/globals.css',
      config: 'tailwind.config.js',
      plugins: ['tailwindcss/nesting', 'tailwindcss', 'autoprefixer'] as const,
      bytes: Buffer.byteLength(result.css),
    },
  }
}

function seite(name: string, markup: string, productCss: string, meta: ReturnType<typeof gitMeta>): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Synthetic ${name}</title><style>${productCss}</style></head><body class="bg-surface-25 text-ink-800"><p class="px-4 py-3 text-xs text-ink-800" data-synthetic-banner>SYNTHETIC RENDER — not authenticated Preview/Production. Case: ${name}. Component: components/trips/TripWorkspaceJetztWichtig.tsx. CSS: styles/globals.css compiled via postcss+tailwind+autoprefixer. Source ${meta.sourceCommit} (${meta.workingTree}).</p><div class="mx-auto max-w-3xl p-4" data-attention-shell>${markup}</div></body></html>`
}

async function messe(page: Page) {
  return page.evaluate(`(() => {
    const shell = document.querySelector('[data-attention-shell]')
    const section = document.querySelector('[aria-label="Jetzt wichtig"]')
    const punkte = [...document.querySelectorAll('[data-attention-punkt]')]
    const weitere = document.querySelector('[aria-expanded]')
    const box = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { width: r.width, height: r.height, left: r.left, right: r.right, top: r.top, bottom: r.bottom }
    }
    return {
      heading: document.querySelector('h3')?.textContent ?? null,
      banner: document.querySelector('[data-synthetic-banner]')?.textContent ?? null,
      leerstand: section?.getAttribute('data-attention-leerstand') ?? null,
      punkte: punkte.map((el) => ({
        id: el.getAttribute('data-attention-punkt'),
        lage: el.getAttribute('data-attention-lage'),
        titel: el.querySelector('strong')?.textContent ?? null,
      })),
      weitereLabel: weitere?.textContent?.trim() ?? null,
      overflow: {
        document: {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          overflowing: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        },
        shell: shell
          ? {
              scrollWidth: shell.scrollWidth,
              clientWidth: shell.clientWidth,
              overflowing: shell.scrollWidth > shell.clientWidth + 1,
            }
          : null,
      },
      boxes: {
        section: box(section),
        weitere: box(weitere),
      },
    }
  })()`)
}

function assertActualComponent(attention: AttentionAbleitung, html: string) {
  if (!html.includes('Jetzt wichtig')) {
    throw new Error('Rendered markup is not TripWorkspaceJetztWichtig')
  }
  if (!html.includes('data-attention-punkt="item.date_mismatch:item-booked"')) {
    throw new Error('Expected booked-only mismatch was not rendered by the actual component')
  }
  if (attention.weitere.length === 0) {
    throw new Error('Fixture must exercise the further-list')
  }
  if (!html.includes('weitere Hinweise')) {
    throw new Error('Further-list control is missing from the actual component')
  }
  if (html.includes('nichts_dringend_geprueft') && html.includes('Im Moment nichts Dringendes')) {
    throw new Error('All-clear empty state must stay suppressed')
  }
}

mkdirSync(join(ROOT, 'html'), { recursive: true })
mkdirSync(join(ROOT, 'screenshots'), { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

async function main() {
  const meta = gitMeta()
  const reise = synthetischeReise()
  const geschuetzte = reise.days[0]!.items.filter((item) => istKommerziell(item))
  if (geschuetzte.length !== 4) {
    throw new Error('Fixture must keep four assigned protected items')
  }
  const attention = attentionAbleiten({
    reise,
    safetyEvaluations: [safetyLeer()],
    seasonalEvaluations: [seasonalLeer()],
    officialEvaluations: [],
    orchestriereSafety: false,
    orchestriereSeasonal: false,
  })
  const mismatch = attention.punkte.filter((punkt) => punkt.signal === 'item.date_mismatch')
  if (mismatch.length !== 4) {
    throw new Error(`Expected 4 mismatches, received ${mismatch.length}`)
  }
  if (attention.leerstand !== null) {
    throw new Error('Active mismatch must suppress the all-clear empty state')
  }
  if (attention.punkte.some((punkt) => punkt.id.includes('item-note') && punkt.signal === 'item.date_mismatch')) {
    throw new Error('Non-commercial note must not receive this signal')
  }
  if (attention.punkte.some((punkt) => punkt.id.includes('item-loose'))) {
    throw new Error('Unassigned protected item must not receive this mismatch')
  }

  const compiled = await compileProductCss()
  const markup = renderToStaticMarkup(
    createElement(TripWorkspaceJetztWichtig, {
      attention,
      onAktion: () => undefined,
    }),
  )
  assertActualComponent(attention, markup)
  const html = seite('date-mismatch', markup, compiled.css, meta)
  writeFileSync(join(ROOT, 'html', 'date-mismatch.html'), html)

  const manifest: Record<string, unknown> = {
    kind: 'synthetic-component-render',
    authenticatedPreview: 'BLOCKED_ACCESS',
    component: 'components/trips/TripWorkspaceJetztWichtig.tsx',
    css: compiled.provenance,
    source: meta,
    note: 'Dependency-injected fixture rendered with compiled styles/globals.css. Not a real trip workspace session, Preview click-through or real-device test.',
    omitted: [
      'live provider/model/paid call',
      'authenticated Preview/Production',
      'real account/DB probe',
      'real-device lab',
      'TW-8 / booking rewrite',
    ],
    attention: {
      leerstand: attention.leerstand,
      sichtbar: attention.sichtbar.map((punkt) => ({ id: punkt.id, signal: punkt.signal, titel: punkt.titel })),
      weitere: attention.weitere.map((punkt) => ({ id: punkt.id, signal: punkt.signal, titel: punkt.titel })),
      mismatchIds: mismatch.map((punkt) => punkt.id),
    },
    cases: {} as Record<string, unknown>,
  }

  const browser = await chromium.launch({ channel: 'chrome' })
  const shots: string[] = []
  const measurements: Record<string, unknown> = {}
  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } })
    await page.setContent(html, { waitUntil: 'load' })
    const dateiname = `date-mismatch_${viewport.name}.png`
    await page.screenshot({ path: join(ROOT, 'screenshots', dateiname), fullPage: true })
    await page.screenshot({ path: join(ARTIFACTS, dateiname), fullPage: true })
    shots.push(dateiname)
    measurements[viewport.name] = await messe(page)
    await page.close()
  }
  await browser.close()

  ;(manifest.cases as Record<string, unknown>)['date-mismatch'] = {
    screenshots: shots,
    measurements,
  }
  writeFileSync(join(ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(
    join(ROOT, 'reconstruction.json'),
    `${JSON.stringify(
      {
        kind: 'synthetic-attention-render',
        ...meta,
        component: 'components/trips/TripWorkspaceJetztWichtig.tsx',
        viewports: VIEWPORTS.map((viewport) => viewport.name),
      },
      null,
      2,
    )}\n`,
  )
  console.log(
    JSON.stringify(
      {
        ok: true,
        source: meta,
        mismatchCount: mismatch.length,
        sichtbar: attention.sichtbar.length,
        weitere: attention.weitere.length,
        viewports: VIEWPORTS.map((viewport) => viewport.name),
        css: compiled.provenance,
      },
      null,
      2,
    ),
  )
}

void main()
