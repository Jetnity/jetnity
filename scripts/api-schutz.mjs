// scripts/api-schutz.mjs
//
// Stellt sicher, dass jede Route unter `app/api/admin` und der feste Dev-Import den zentralen Gate
// benutzt – und zwar in jedem exportierten HTTP-Handler.
//
// Hintergrund: Der Bereichsschutz für Seiten liegt im Layout der Gruppe
// `(admin)` und gilt damit automatisch. API-Routen haben kein Layout; sie
// müssen selbst prüfen. Diese Prüfung ersetzt das „daran denken“ durch einen
// Fehler in der CI.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const WURZEL = process.cwd()
const API_ADMIN = join(WURZEL, 'app', 'api', 'admin')
const GATE = 'requireAdminApi'
const HTTP_METHODEN = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

function routenDateien(verzeichnis) {
  const treffer = []
  let einträge
  try {
    einträge = readdirSync(verzeichnis, { withFileTypes: true })
  } catch {
    return treffer
  }
  for (const eintrag of einträge) {
    const pfad = join(verzeichnis, eintrag.name)
    if (eintrag.isDirectory()) treffer.push(...routenDateien(pfad))
    else if (/^route\.tsx?$/.test(eintrag.name)) treffer.push(pfad)
  }
  return treffer
}

/**
 * Schneidet den Körper eines Handlers heraus, indem ab der Signatur die
 * geschweiften Klammern gezählt werden. Das genügt für diese Prüfung und
 * vermeidet eine Parser-Abhängigkeit.
 */
function handlerKörper(quelle, methode) {
  const signatur = new RegExp(
    `export\\s+(?:async\\s+)?function\\s+${methode}\\s*\\(|export\\s+const\\s+${methode}\\s*=`,
  )
  const start = quelle.search(signatur)
  if (start === -1) return null

  const auf = quelle.indexOf('{', start)
  if (auf === -1) return null

  let tiefe = 0
  for (let i = auf; i < quelle.length; i++) {
    if (quelle[i] === '{') tiefe++
    else if (quelle[i] === '}') {
      tiefe--
      if (tiefe === 0) return quelle.slice(auf, i + 1)
    }
  }
  return quelle.slice(auf)
}

const beanstandungen = []
// Der feste Dev-Import muss Ziel/Request vor Auth-I/O prüfen. Er liegt deshalb
// ausserhalb des Proxy-Admin-Scopes, benutzt aber denselben zentralen Gate.
const ownerImportRoute = 'app/api/internal/readiness/ch-de-owner-import/route.ts'
const ownerGuardRoute = 'app/api/internal/readiness/ch-de-owner-guard/route.ts'
const festeOwnerPfade = [ownerImportRoute, ownerGuardRoute].map(path => join(WURZEL, path))

for (const datei of [...routenDateien(API_ADMIN), ...festeOwnerPfade]) {
  const anzeige = relative(WURZEL, datei)
  let quelle
  try { quelle = readFileSync(datei, 'utf8') }
  catch { beanstandungen.push(`${anzeige}: geschützte Route fehlt`); continue }

  if (!quelle.includes(`from '@/lib/auth/admin-guard'`)) {
    beanstandungen.push(`${anzeige}: importiert den zentralen Gate nicht`)
    continue
  }

  const vorhandene = HTTP_METHODEN.filter(methode => handlerKörper(quelle, methode) !== null)

  if (festeOwnerPfade.includes(datei) && (vorhandene.length !== 1 || vorhandene[0] !== 'POST')) {
    beanstandungen.push(`${anzeige}: ausschliesslich der geschützte POST ist erlaubt`)
    continue
  }

  if (vorhandene.length === 0) {
    beanstandungen.push(`${anzeige}: kein HTTP-Handler gefunden`)
    continue
  }

  for (const methode of vorhandene) {
    const körper = handlerKörper(quelle, methode) ?? ''
    if (!körper.includes(`${GATE}(`)) {
      beanstandungen.push(`${anzeige}: ${methode} ruft ${GATE}() nicht auf`)
      continue
    }
    if (!/if\s*\(\s*!\s*\w+\.ok\s*\)/.test(körper)) {
      beanstandungen.push(
        `${anzeige}: ${methode} wertet das Ergebnis von ${GATE}() nicht aus ` +
          `(erwartet: if (!gate.ok) return gate.response)`,
      )
    }
  }
}

const anzahl = routenDateien(API_ADMIN).length

// #1155: exact dormant explicit-read route. Its package handler owns the
// default-closed deployment, same-origin, body, Auth, rate and own-Trip gates.
// The native entry executes that handler; this check pins thin delegation.
const acceptedStoreRoute = 'app/api/readiness/accepted-store/route.ts'
try {
  const source = readFileSync(join(WURZEL, acceptedStoreRoute), 'utf8')
  const methods = HTTP_METHODEN.filter(method => handlerKörper(source, method) !== null)
  const body = handlerKörper(source, 'POST') ?? ''
  if (methods.length !== 1 || methods[0] !== 'POST'
    || !source.includes("from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/request-server'")
    || !/const response\s*=\s*await acceptedStoreTripRequest\(req\)/.test(body)
    || !/return NextResponse\.json\(response\.body,\{status:response\.status,headers:readinessHttpHeader\(\)\}\)/.test(body)
    || !/export const runtime\s*=\s*'nodejs'/.test(source)) {
    beanstandungen.push(`${acceptedStoreRoute}: exakte geschützte POST-Delegation fehlt`)
  }
} catch {
  beanstandungen.push(`${acceptedStoreRoute}: freigegebene geschützte Route fehlt`)
}

if (beanstandungen.length > 0) {
  console.error(`API-Schutz: ${beanstandungen.length} Beanstandung(en)\n`)
  for (const zeile of beanstandungen) console.error(`  - ${zeile}`)
  console.error(
    `\nJede Route unter app/api/admin sowie der feste Dev-Import muss ${GATE}() aufrufen und bei einer Ablehnung ` +
      `die gelieferte Antwort zurückgeben.`,
  )
  process.exit(1)
}

console.log(`API-Schutz: ${anzahl} Admin-Route(n) und der feste Dev-Import geprüft, alle nutzen ${GATE}().`)

// Ohne diesen Hinweis wäre nicht ersichtlich, dass die Prüfung nur greift,
// wenn es das Verzeichnis überhaupt gibt.
if (anzahl === 0) {
  try {
    statSync(API_ADMIN)
  } catch {
    console.log('Hinweis: app/api/admin existiert nicht – nichts zu prüfen.')
  }
}

