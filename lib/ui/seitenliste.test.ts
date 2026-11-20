import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { test } from 'node:test'

const WURZEL = join(__dirname, '..', '..')
const APP = join(WURZEL, 'app')
const LISTE = readFileSync(join(WURZEL, 'docs', 'UI_UX_FEINSCHLIFF_SEITENLISTE_2026-11-20.md'), 'utf8')

function dateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name)
    return statSync(pfad).isDirectory() ? (name === 'api' ? [] : dateien(pfad)) : [pfad]
  })
}

const ALLE = dateien(APP).map((pfad) => relative(WURZEL, pfad).split(sep).join('/'))

/** `app/(public)/reisen/[tripId]/page.tsx` → `/reisen/[tripId]`; Routengruppen zählen nicht. */
function route(datei: string): string {
  const teile = datei.split('/').slice(1, -1).filter((teil) => !/^\(.*\)$/.test(teil))
  return '/' + teile.join('/')
}

const ROUTEN = new Set(ALLE.filter((datei) => /\/page\.(tsx|ts|mdx)$/.test(datei)).map(route))
const SONDERDATEIEN = ALLE.filter((datei) => /\/(error|global-error|not-found|loading)\.tsx$/.test(datei))
const GENANNT = new Set(
  [...LISTE.matchAll(/`(\/[^`\s]*)`/g)].map(([, wert]) => wert.replace(/[?#].*$/, '') || '/'),
)

test('jede Seite im Code steht in der Seitenliste', () => {
  const fehlend = [...ROUTEN].filter((r) => !GENANNT.has(r)).sort()
  assert.deepEqual(fehlend, [], `In docs/UI_UX_FEINSCHLIFF_SEITENLISTE fehlen: ${fehlend.join(', ')}`)
})

test('jede Fehler-, Lade- und 404-Datei steht in der Seitenliste', () => {
  const fehlend = SONDERDATEIEN.filter((datei) => !LISTE.includes('`' + datei + '`')).sort()
  assert.deepEqual(fehlend, [], `In docs/UI_UX_FEINSCHLIFF_SEITENLISTE fehlen: ${fehlend.join(', ')}`)
})

test('die Seitenliste nennt keine Route, die es nicht gibt', () => {
  const unbekannt = [...GENANNT].filter((r) => !ROUTEN.has(r)).sort()
  assert.deepEqual(unbekannt, [])
})
