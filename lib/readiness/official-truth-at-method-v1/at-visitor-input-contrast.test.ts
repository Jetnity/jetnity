import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'
import EinreiseLaenderpruefer from '@/components/readiness/EinreiseLaenderpruefer'

type CheckerProps = NonNullable<Parameters<typeof EinreiseLaenderpruefer>[0]>

async function projektCss() {
  const require = createRequire(import.meta.url)
  const postcss = require('postcss') as (plugins: unknown[]) => {
    process: (css: string, opts: { from: string }) => Promise<{ css: string }>
  }
  const nesting = require('tailwindcss/nesting') as () => unknown
  const tailwind = require('tailwindcss') as (config: unknown) => unknown
  const autoprefixer = require('autoprefixer') as () => unknown
  const from = join(process.cwd(), 'styles/globals.css')
  const config = require(join(process.cwd(), 'tailwind.config.js')) as unknown
  const compiled = await postcss([nesting(), tailwind(config), autoprefixer()]).process(readFileSync(from, 'utf8'), { from })
  const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
  return {
    shared: [compiled.css, read('components/workspace/workspace.css'), read('components/workspace/workspace-surfaces.css')].join('\n'),
    preview: read('components/readiness/at-visitor-preview.css'),
    public: read('styles/white-mint.css'),
  }
}

function rgb(value: string): number[] {
  const match = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*1(?:\.0+)?)?\s*\)$/.exec(value)
  assert.ok(match, 'Opaque computed colour required: ' + value)
  return match.slice(1, 4).map(Number)
}
function luminance(colour: string) {
  const channels = rgb(colour).map(value => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
}
function contrast(foreground: string, background: string) {
  const a = luminance(foreground), b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

test('real entry checker controls and placeholders meet AA in the public white-mint ancestor, both themes and all three widths', { timeout: 120000 }, async () => {
  const css = await projektCss()
  const args = ['--no-sandbox', '--disable-dev-shm-usage']
  let browser
  try {
    browser = await chromium.launch({ headless: true, args })
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("Executable doesn't exist")) throw error
    browser = await chromium.launch({ headless: true, channel: 'chrome', args })
  }
  try {
    const page = await browser.newPage()
    await page.route('**/*', route => route.abort())
    const states = [
      { label: 'empty', markup: renderToStaticMarkup(React.createElement<CheckerProps>(EinreiseLaenderpruefer, { atVisitorPreview: true })), count: 4 },
      { label: 'selected multiple', markup: renderToStaticMarkup(React.createElement<CheckerProps>(EinreiseLaenderpruefer, {
        atVisitorPreview: true, vorbelegung: { ziele: ['AT'], paesse: ['CH', 'IN'], nichtUebernommen: [], personen: [] },
      })), count: 6 },
    ]
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      for (const theme of ['light', 'dark']) {
        for (const state of states) {
          // Next CSS chunk order must not let the outer public selector win.
          for (const order of [[css.public, css.preview], [css.preview, css.public]]) {
            const style = [css.shared, ...order].join('\n')
            await page.setContent('<!doctype html><html lang="de"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>' + style + '</style></head><body><div data-white-mint="home"><div class="at-visitor-preview workspace-shell" data-workspace-theme="' + theme + '"><div class="workspace-content">' + state.markup + '</div></div></div></body></html>')
            const fields = await page.locator('.at-visitor-preview form :is(input, select, textarea)').evaluateAll(elements => elements.map(el => {
              const style = getComputedStyle(el)
              const placeholder = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el.placeholder : ''
              const pseudo = getComputedStyle(el, '::placeholder')
              return { tag: el.tagName, id: el.id, background: style.backgroundColor, foreground: style.color, placeholder, placeholderColour: pseudo.color, placeholderOpacity: pseudo.opacity }
            }))
            assert.equal(fields.length, state.count, state.label)
            for (const field of fields) {
              const note = JSON.stringify({ width, theme, state: state.label, ...field })
              assert.ok(contrast(field.foreground, field.background) >= 4.5, note)
              if (field.placeholder) {
                assert.equal(field.placeholderOpacity, '1', note)
                assert.ok(contrast(field.placeholderColour, field.background) >= 4.5, note)
              }
              if (theme === 'dark') assert.ok(luminance(field.background) < 0.15, note)
            }
            assert.equal(fields.filter(field => field.placeholder === 'Land suchen').length, state.count / 2)
          }
        }
      }
    }
    await page.close()
  } finally {
    await browser.close()
  }
})
