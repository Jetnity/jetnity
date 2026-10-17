// Test-Double für psql. Öffnet keine Verbindung und keinen Socket.
// Aufruf über einen Wrapper: node fake-psql.mjs <config.json> <psql-argv...>
// Nur für Offline-Tests, die sitzungStarten direkt injizieren. psqlPfadPruefen
// lässt weder diese Datei noch einen Wrapper darum zu.
//
// Protokolliert argv, Umgebung und jeden SQL-Block nach config.log und
// antwortet nach dem Kennungskommentar "-- jetnity:<art>".

import { appendFileSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

const [configPfad, ...argv] = process.argv.slice(2)
const config = JSON.parse(readFileSync(configPfad, 'utf8'))

function log(eintrag) {
  appendFileSync(config.log, `${JSON.stringify(eintrag)}\n`)
}

log({ ereignis: 'start', argv, env: process.env })

if (config.sofortBeenden) {
  process.stderr.write('psql: error: connection to server failed (simuliert)\n')
  process.exit(2)
}

const geschrieben = { flughaefen: 0, orte: 0 }
let block = []

function antworten(sql) {
  const kopf = /^-- jetnity:(\S+)(?: (\S+) (\d+) n=(\d+))?/.exec(sql)
  const art = kopf?.[1] ?? 'unbekannt'
  log({ ereignis: 'sql', art, sql })

  if (config.muellBei === art) return ['das ist kein json']
  if (config.fehlerBeiArt === art) {
    process.stderr.write(`psql:<stdin>: ERROR:  ${config.stderrText ?? `simulierter Fehler bei ${art}`}\n`)
    process.exit(3)
  }

  switch (art) {
    case 'sitzung':
      return [JSON.stringify({ sperre: config.sperre ?? true })]
    case 'vorpruefung':
      return [JSON.stringify(config.vorpruefung)]
    case 'anon-rechte':
      return [JSON.stringify({ anonSelect: true, rls: true, anonPolicy: true, ...(config.anonRechte ?? {}) })]
    case 'anon-leseprobe':
      return [JSON.stringify({ rolle: 'anon', orte: 0, ...(config.anonLeseprobe ?? {}) })]
    case 'stapel': {
      const ziel = kopf[2]
      const nummer = Number(kopf[3])
      const n = Number(kopf[4])
      if (config.fehlerBei && config.fehlerBei.art === ziel && config.fehlerBei.nummer === nummer) {
        process.stderr.write(
          `psql:<stdin>:${nummer}: ERROR:  ${config.stderrText ?? `simulierter Fehler in Stapel ${nummer}`}\n`,
        )
        process.exit(3)
      }
      if (config.lugeBei && config.lugeBei.art === ziel && config.lugeBei.nummer === nummer) {
        return [JSON.stringify({ n: config.lugeBei.n })]
      }
      geschrieben[ziel] += n
      return [JSON.stringify({ n })]
    }
    case 'flughaefen-pruefen':
      return [JSON.stringify({ anzahl: geschrieben.flughaefen, beispiele: config.beispiele ?? [] })]
    case 'flughaefen-lesen':
      return [JSON.stringify(config.flughaefen ?? [])]
    case 'orte-pruefen':
      return [
        JSON.stringify({
          anzahl: geschrieben.orte,
          japan: true,
          zuerich: true,
          zrh: true,
          rolle: 'anon',
          ...(config.ortePruefen ?? {}),
        }),
      ]
    default:
      process.stderr.write(`psql:<stdin>: ERROR:  unbekannte Anfrage\n`)
      process.exit(3)
  }
}

const leser = createInterface({ input: process.stdin })
leser.on('line', (zeile) => {
  if (zeile === '\\q') {
    log({ ereignis: 'ende' })
    process.exit(0)
  }
  const echo = /^\\echo (\S+)$/.exec(zeile)
  if (!echo) {
    block.push(zeile)
    return
  }
  const sql = block.join('\n')
  block = []
  for (const ausgabe of antworten(sql)) process.stdout.write(`${ausgabe}\n`)
  process.stdout.write(`${echo[1]}\n`)
})
leser.on('close', () => process.exit(0))
