// Temporary synthetic render harness. Not a product route and not an auth bypass.
// Before frames reconstruct the previous per-stage empty rendering.
// After frames use the current TripWorkspaceDestinationEssentials component.

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

const ROOT = dirname(fileURLToPath(import.meta.url))
const ARTIFACTS = '/opt/cursor/artifacts/v1-destination-essentials-density-1'
const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '1024x768', width: 1024, height: 768 },
] as const

function gitMeta() {
  const head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
  const dirty = execSync('git status --porcelain', { encoding: 'utf8' })
    .split('\n')
    .map((zeile) => zeile.trim())
    .filter(Boolean)
  return {
    head,
    workingTree: dirty.length === 0 ? 'clean' : 'dirty',
    dirtyPaths: dirty,
  }
}

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

function ziel(teil: Partial<DestinationEssentialZiel> & Pick<DestinationEssentialZiel, 'stageId' | 'name'>): DestinationEssentialZiel {
  return {
    stageId: teil.stageId,
    position: teil.position ?? 1,
    name: teil.name,
    countryCode: teil.countryCode ?? 'IT',
    countryLabel: teil.countryLabel ?? 'Italien',
    placeId: null,
    latitude: null,
    longitude: null,
    arrivalDate: teil.arrivalDate ?? '2026-09-12',
    departureDate: teil.departureDate ?? '2026-09-15',
    zeitraumText: teil.zeitraumText ?? '12. Sep. – 15. Sep.',
    einreise: teil.einreise ?? bereich<DestinationOfficialLage>('keine_evidence'),
    sicherheit: teil.sicherheit ?? bereich<DestinationSafetyLage>('keine_evidence'),
    saison: teil.saison ?? bereich<DestinationSeasonalLage>('keine_evidence'),
    hatHinweise: teil.hatHinweise ?? false,
  }
}

const leerDrei: DestinationEssentialsAbleitung = {
  titel: DESTINATION_ESSENTIALS_TITEL,
  leerText: DESTINATION_ESSENTIALS_LEERTEXT,
  hatZiele: true,
  hatHinweise: false,
  loestSucheAus: false,
  ziele: [
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
  ],
}

const langNamen: DestinationEssentialsAbleitung = {
  ...leerDrei,
  ziele: [
    ziel({
      stageId: 'stage-long-1',
      name: 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch',
      countryCode: 'GB',
      countryLabel: 'Vereinigtes Königreich',
      zeitraumText: '12. Sep. – 15. Sep.',
    }),
    ziel({
      stageId: 'stage-long-2',
      position: 2,
      name: 'Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu',
      countryCode: 'NZ',
      countryLabel: 'Neuseeland',
      zeitraumText: '16. Sep. – 20. Sep.',
    }),
    ziel({
      stageId: 'stage-long-3',
      position: 3,
      name: 'Chargoggagoggmanchauggagoggchaubunagungamaugg',
      countryCode: 'US',
      countryLabel: 'Vereinigte Staaten',
      zeitraumText: '21. Sep. – 24. Sep.',
    }),
  ],
}

const gemischt: DestinationEssentialsAbleitung = {
  titel: DESTINATION_ESSENTIALS_TITEL,
  leerText: DESTINATION_ESSENTIALS_LEERTEXT,
  hatZiele: true,
  hatHinweise: true,
  loestSucheAus: false,
  ziele: [
    ziel({
      stageId: 'stage-fl',
      name: 'Florenz',
      hatHinweise: true,
      einreise: bereich<DestinationOfficialLage>('required', {
        text: 'Visum erforderlich',
        details: [
          {
            id: 'visa-1',
            titel: 'Visum',
            text: 'Visum erforderlich',
            kontextText: 'Alex',
            dokumentLabel: 'Reisepass Schweiz',
          },
        ],
        links: [{ href: 'https://example.test/official', label: 'Offizielle Quelle öffnen', art: 'source' }],
      }),
      sicherheit: bereich<DestinationSafetyLage>('important_notice', {
        text: 'Wichtiger Sicherheitshinweis',
        details: [
          {
            id: 'safety-1',
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
}

function ZielName({ name, countryLabel }: { name: string | null; countryLabel: string | null }) {
  if (name && countryLabel) return `${name} · ${countryLabel}`
  if (name) return name
  if (countryLabel) return countryLabel
  return 'Reiseziel'
}

function VorherDestinationEssentials({ essentials }: { essentials: DestinationEssentialsAbleitung }) {
  return createElement(
    'section',
    {
      'aria-labelledby': 'reiseziele-essentials-titel',
      'data-destination-essentials': 'ein',
      'data-destination-search': 'nein',
      'data-destination-essentials-dichte': 'voll',
      className: 'rounded-2xl border border-line-200 bg-white px-4 py-4',
    },
    createElement('p', { className: 'text-xs font-semibold uppercase tracking-[0.16em] text-brand-600' }, 'Wichtig für deine Ziele'),
    createElement(
      'h3',
      { id: 'reiseziele-essentials-titel', className: 'mt-1 text-base font-semibold tracking-[-0.02em] text-brand-800' },
      essentials.titel,
    ),
    !essentials.hatZiele
      ? createElement('p', { className: 'mt-1 text-sm leading-6 text-ink-800' }, essentials.leerText)
      : createElement(
          'ul',
          { className: 'mt-3 grid gap-3' },
          ...essentials.ziele.map((zielEintrag) =>
            createElement(
              'li',
              { key: zielEintrag.stageId },
              createElement(
                'article',
                {
                  'data-destination-stage': zielEintrag.stageId,
                  'data-destination-country': zielEintrag.countryCode ?? 'none',
                  'data-destination-entry': zielEintrag.einreise.lage,
                  'data-destination-safety': zielEintrag.sicherheit.lage,
                  'data-destination-seasonal': zielEintrag.saison.lage,
                  className: 'rounded-2xl border border-line-200 bg-surface-25 px-3 py-3',
                },
                createElement(
                  'h4',
                  { className: 'text-sm font-semibold text-brand-800' },
                  ZielName({ name: zielEintrag.name, countryLabel: zielEintrag.countryLabel }),
                ),
                zielEintrag.zeitraumText
                  ? createElement('p', { className: 'mt-1 text-xs leading-5 text-ink-800' }, zielEintrag.zeitraumText)
                  : null,
                createElement(
                  'dl',
                  { className: 'mt-3 grid gap-2' },
                  createElement(
                    'div',
                    null,
                    createElement('dt', { className: 'text-[11px] font-medium uppercase tracking-[0.14em] text-ink-600' }, 'Einreise'),
                    createElement('dd', { className: 'mt-0.5 text-sm leading-6 text-ink-800' }, zielEintrag.einreise.text),
                  ),
                  createElement(
                    'div',
                    null,
                    createElement('dt', { className: 'text-[11px] font-medium uppercase tracking-[0.14em] text-ink-600' }, 'Sicherheit'),
                    createElement('dd', { className: 'mt-0.5 text-sm leading-6 text-ink-800' }, zielEintrag.sicherheit.text),
                  ),
                  createElement(
                    'div',
                    null,
                    createElement('dt', { className: 'text-[11px] font-medium uppercase tracking-[0.14em] text-ink-600' }, 'Reisezeit'),
                    createElement('dd', { className: 'mt-0.5 text-sm leading-6 text-ink-800' }, zielEintrag.saison.text),
                  ),
                ),
              ),
            ),
          ),
        ),
  )
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

function seite(name: string, markup: string, productCss: string, extraCss = ''): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Synthetic ${name}</title><style>${productCss}</style>${extraCss ? `<style>${extraCss}</style>` : ''}</head><body class="bg-surface-25 text-ink-800"><p class="px-4 py-3 text-xs text-ink-600" data-synthetic-banner>SYNTHETIC RENDER — not authenticated Preview/Production. Case: ${name}. CSS: styles/globals.css compiled via postcss+tailwind+autoprefixer. No provider/model/network.</p><div class="mx-auto max-w-3xl px-4 py-4" data-essentials-shell>${markup}</div></body></html>`
}

async function messe(page: Page) {
  return page.evaluate(`(() => {
    const section = document.querySelector('[data-destination-essentials]')
    const shell = document.querySelector('[data-essentials-shell]')
    const summary = document.querySelector('summary')
    const links = [...document.querySelectorAll('a[href]')]
    const box = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        width: Number(r.width.toFixed(2)),
        height: Number(r.height.toFixed(2)),
        left: Number(r.left.toFixed(2)),
        right: Number(r.right.toFixed(2)),
        top: Number(r.top.toFixed(2)),
        bottom: Number(r.bottom.toFixed(2)),
      }
    }
    const sectionBox = box(section)
    return {
      section: {
        box: sectionBox,
        density: section?.getAttribute('data-destination-essentials-dichte') ?? null,
        stages: [...document.querySelectorAll('[data-destination-stage]')].map((el) => el.getAttribute('data-destination-stage')),
        emptyDisclosure: Boolean(document.querySelector('[data-destination-essentials-leerhinweis]')),
        domainLabels: {
          einreise: document.body.innerText.includes('Einreise'),
          sicherheit: document.body.innerText.includes('Sicherheit'),
          reisezeit: document.body.innerText.includes('Reisezeit'),
        },
      },
      overflow: {
        document: {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          overflowing: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        },
        section: section
          ? {
              scrollWidth: section.scrollWidth,
              clientWidth: section.clientWidth,
              overflowing: section.scrollWidth > section.clientWidth + 1,
            }
          : null,
        shell: shell
          ? {
              scrollWidth: shell.scrollWidth,
              clientWidth: shell.clientWidth,
              overflowing: shell.scrollWidth > shell.clientWidth + 1,
            }
          : null,
      },
      touch: summary
        ? {
            summaryHeight: Number(summary.getBoundingClientRect().height.toFixed(2)),
            meetsMinH11: summary.getBoundingClientRect().height >= 44,
          }
        : null,
      focus: {
        summaryPresent: Boolean(summary),
        linkCount: links.length,
        firstHref: links[0]?.getAttribute('href') ?? null,
      },
    }
  })()`)
}

const faelle = [
  {
    name: 'empty-three-before',
    essentials: leerDrei,
    phase: 'before',
    simulationClass: 'reconstructed_previous_per_stage_empty_rendering',
    extraCss: '',
    interaction: 'none' as const,
  },
  {
    name: 'empty-three-after',
    essentials: leerDrei,
    phase: 'after',
    simulationClass: 'current_component_compiled_css',
    extraCss: '',
    interaction: 'none' as const,
  },
  {
    name: 'mixed-after',
    essentials: gemischt,
    phase: 'after',
    simulationClass: 'current_component_compiled_css',
    extraCss: '',
    interaction: 'keyboard-details' as const,
  },
  {
    name: 'empty-long-names-after',
    essentials: langNamen,
    phase: 'after',
    simulationClass: 'current_component_compiled_css',
    extraCss: '',
    interaction: 'none' as const,
  },
  {
    name: 'empty-large-text-after',
    essentials: leerDrei,
    phase: 'after',
    simulationClass: 'current_component_compiled_css_enlarged_text',
    extraCss: 'html { font-size: 200%; }',
    interaction: 'none' as const,
  },
] as const

mkdirSync(join(ROOT, 'html'), { recursive: true })
mkdirSync(join(ROOT, 'screenshots'), { recursive: true })
mkdirSync(ARTIFACTS, { recursive: true })

async function main() {
  const compiled = await compileProductCss()
  const productTree = gitMeta()
  const capturedAt = new Date().toISOString()
  const manifest: Record<string, unknown> = {
    kind: 'synthetic-component-render',
    authenticatedPreview: 'BLOCKED_ACCESS',
    officialTravelAdviceValidation: 'NOT_CLAIMED',
    browser: 'playwright-chromium',
    productTree,
    capturedAt,
    css: compiled.provenance,
    note: 'Fixture-injected TripWorkspaceDestinationEssentials with compiled styles/globals.css. Not a real /trips session. Before frames reconstruct the previous repeated per-domain empty lines. After frames use the current component.',
    cases: {},
  }
  const cases = manifest.cases as Record<string, unknown>
  const browser = await chromium.launch({ channel: 'chrome' })

  for (const fall of faelle) {
    const markup =
      fall.phase === 'before'
        ? renderToStaticMarkup(createElement(VorherDestinationEssentials, { essentials: fall.essentials }))
        : renderToStaticMarkup(createElement(TripWorkspaceDestinationEssentials, { essentials: fall.essentials }))
    const html = seite(fall.name, markup, compiled.css, fall.extraCss)
    writeFileSync(join(ROOT, 'html', `${fall.name}.html`), html)
    const shots: string[] = []
    const measurements: Record<string, unknown> = {}
    cases[fall.name] = {
      phase: fall.phase,
      simulationClass: fall.simulationClass,
      interaction: fall.interaction,
      screenshots: shots,
      measurements,
    }

    for (const viewport of VIEWPORTS) {
      if (fall.name === 'mixed-after' && viewport.name !== '390x844') continue
      if (fall.name === 'empty-long-names-after' && viewport.name !== '390x844') continue
      if (fall.name === 'empty-large-text-after' && viewport.name !== '390x844') continue

      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      })
      await page.route('**/*', async (route) => {
        const url = route.request().url()
        if (url.startsWith('data:') || url.startsWith('about:')) {
          await route.continue()
          return
        }
        await route.abort()
      })
      await page.setContent(html, { waitUntil: 'domcontentloaded' })
      const painted = await page.evaluate(
        `(() => {
          const section = document.querySelector('[data-destination-essentials]')
          const text = (section?.textContent || '').trim()
          return {
            painted: Boolean(section) && text.length > 0,
            textLength: text.length,
          }
        })()`,
      )
      if (!painted.painted) {
        throw new Error(`Blank or unpainted evidence: ${fall.name} ${viewport.name}`)
      }

      let interaction: Record<string, unknown> | null = null
      if (fall.interaction === 'keyboard-details') {
        await page.locator('summary').focus()
        const focused = await page.evaluate(`document.activeElement?.tagName || null`)
        await page.keyboard.press('Enter')
        const open = await page.locator('details[open]').count()
        const visibleHint = await page.getByText('Wichtiger Sicherheitshinweis').count()
        const visibleVisa = await page.getByText('Visum erforderlich').count()
        const visibleSeason = await page.getByText('Reisezeit prüfen').count()
        await page.locator('a[href="https://example.test/official"]').focus()
        const activeHref = await page.evaluate(`document.activeElement?.getAttribute('href') || null`)
        interaction = {
          focusedTag: focused,
          detailsOpen: open,
          visibleHint,
          visibleVisa,
          visibleSeason,
          activeHref,
        }
      }

      const dateiname = `${fall.name}_${viewport.name}.png`
      await page.screenshot({ path: join(ROOT, 'screenshots', dateiname), fullPage: true })
      await page.screenshot({ path: join(ARTIFACTS, dateiname), fullPage: true })
      shots.push(dateiname)
      measurements[viewport.name] = {
        ...(await messe(page)),
        painted,
        interaction,
        viewport,
        capturedAt,
        productTree,
        simulationClass: fall.simulationClass,
        actionSequence:
          fall.interaction === 'keyboard-details'
            ? ['setContent', 'focus summary', 'Enter', 'assert details open', 'focus official source link', 'screenshot']
            : ['setContent', 'assert painted', 'screenshot'],
      }
      await page.close()
    }
  }

  await browser.close()

  const emptyBefore = (cases['empty-three-before'] as { measurements: Record<string, { section: { box: { height: number } } }> }).measurements
  const emptyAfter = (cases['empty-three-after'] as { measurements: Record<string, { section: { box: { height: number } } }> }).measurements
  manifest.heightDelta = Object.fromEntries(
    VIEWPORTS.map((viewport) => {
      const before = emptyBefore[viewport.name]?.section.box.height ?? null
      const after = emptyAfter[viewport.name]?.section.box.height ?? null
      return [
        viewport.name,
        {
          before,
          after,
          delta: before != null && after != null ? Number((after - before).toFixed(2)) : null,
        },
      ]
    }),
  )

  writeFileSync(join(ROOT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(join(ARTIFACTS, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(
    JSON.stringify(
      {
        ok: true,
        cases: faelle.map((fall) => fall.name),
        viewports: VIEWPORTS.map((viewport) => viewport.name),
        css: compiled.provenance,
        productTree,
        heightDelta: manifest.heightDelta,
      },
      null,
      2,
    ),
  )
}

void main()
