// lib/activities/getyourguide/dokument.ts
//
// Neutrales Einbettungsdokument für das manuelle GetYourGuide-Widget.
// Ein direkt geöffnetes Dokument lädt den Analyzer nicht.

import {
  GYG_ANZAHL_ERWEITERT,
  GYG_ANZAHL_STANDARD,
  suchanfrageText,
  suchkonfigurationBauen,
  type GygAnzahl,
  type GygSuchkonfiguration,
  type GygSuchumfang,
} from '@/lib/activities/getyourguide/suche'

export const GYG_PARTNER_ID = '2MQHT6Z'
export const GYG_ANALYZER_SRC = 'https://widget.getyourguide.com/dist/pa.umd.production.min.js'
export const GYG_WIDGET_HREF = 'https://widget.getyourguide.com/default/activities.frame'
export const GYG_MARKE_HREF = 'https://www.getyourguide.com/'
export const GYG_CMP = 'jetnity_activities'
export const GYG_LOCALE = 'de-CH'
export const GYG_SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'
// Liest nur die explizite Pixelhöhe, die der Anbieter-Loader an seinen eigenen Rahmen-Eltern schreibt.
// Kein scrollHeight, kein Schreiben dieser Höhe, kein gemerktes Maximum. Wachstum und Schrumpfen bleiben der aktuelle Wert.
// 12000: gemessene 12 gestapelte Länderkarten lagen bei 4685px, 20 Bangkok-Karten bei angeforderter Anzahl 24 bei 7744px.
export const GYG_HOEHE_MAX = 12000
export const GYG_HOEHE_SKRIPT = `(function(){var letzte=-1;function lesen(){var rahmen=document.querySelector("iframe");var vater=rahmen&&rahmen.parentElement;if(!vater)return 0;var treffer=/^([0-9]+(?:\\.[0-9]+)?)px$/.exec(String(vater.style.height||""));if(!treffer)return 0;var px=Math.round(Number(treffer[1]));if(!isFinite(px)||px<1||px>${GYG_HOEHE_MAX})return 0;return px}function melden(){var px=lesen();if(!px||px===letzte)return;letzte=px;parent.postMessage({quelle:"jetnity-gyg-rahmen",art:"hoehe",px:px},"*")}new MutationObserver(melden).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:["style"]});addEventListener("load",melden)})();`
export const GYG_HOEHE_HASH = 'sha256-poQQU/MYBLZP2WRKZarx+V+rBn+1QuHFgUwrd5VZC+E='

const UMFANG = new Set<GygSuchumfang>(['stadt', 'region', 'insel', 'land'])
const PARAMETER = ['umfang', 'code', 'name', 'anzahl'] as const

export type GygDokumentAuftrag = {
  suche: GygSuchkonfiguration
  anzahl: GygAnzahl
}

function anzahlAus(params: URLSearchParams, gezaehlt: Map<string, number>): GygAnzahl | null {
  if (!gezaehlt.has('anzahl')) return GYG_ANZAHL_STANDARD
  const roh = params.get('anzahl')
  if (roh === String(GYG_ANZAHL_STANDARD)) return GYG_ANZAHL_STANDARD
  if (roh === String(GYG_ANZAHL_ERWEITERT)) return GYG_ANZAHL_ERWEITERT
  return null
}
const SANDBOX_BASIS = `sandbox ${GYG_SANDBOX}; frame-ancestors 'self'; base-uri 'none'; object-src 'none'; form-action 'none'`

function htmlText(wert: string): string {
  return wert
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function rahmen(aktiv: boolean): string {
  if (!aktiv) {
    return `${SANDBOX_BASIS}; default-src 'none'; script-src 'none'; frame-src 'none'; img-src 'none'; connect-src 'none'; style-src 'none'`
  }
  return [
    SANDBOX_BASIS,
    "default-src 'none'",
    `script-src '${GYG_HOEHE_HASH}' https://widget.getyourguide.com`,
    'frame-src https://widget.getyourguide.com',
    'img-src https: data:',
    "style-src 'unsafe-inline' https:",
    'font-src https: data:',
    'connect-src https:',
    'worker-src https://widget.getyourguide.com',
  ].join('; ')
}

function kopf(aktiv: boolean): Headers {
  return new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'private, no-store',
    'referrer-policy': 'no-referrer',
    'x-robots-tag': 'noindex, nofollow',
    'x-content-type-options': 'nosniff',
    'content-security-policy': rahmen(aktiv),
  })
}

export function suchparameterLesen(roh: string): GygDokumentAuftrag | null {
  if (roh.length > 512) return null
  const params = new URLSearchParams(roh.startsWith('?') ? roh.slice(1) : roh)
  const gezaehlt = new Map<string, number>()
  for (const [key] of params) {
    gezaehlt.set(key, (gezaehlt.get(key) ?? 0) + 1)
  }
  for (const key of gezaehlt.keys()) {
    if (!PARAMETER.includes(key as (typeof PARAMETER)[number])) return null
  }
  for (const zahl of gezaehlt.values()) {
    if (zahl !== 1) return null
  }
  const anzahl = anzahlAus(params, gezaehlt)
  if (!anzahl) return null
  const umfang = params.get('umfang')
  const code = params.get('code')
  if (!umfang || !code || !UMFANG.has(umfang as GygSuchumfang)) return null
  const art = umfang as GygSuchumfang
  let suche: GygSuchkonfiguration | null
  if (art === 'land') {
    if (gezaehlt.has('name')) return null
    suche = suchkonfigurationBauen({ umfang: 'land', name: '', countryCode: code })
  } else {
    const name = params.get('name')
    if (!name) return null
    suche = suchkonfigurationBauen({ umfang: art, name, countryCode: code })
  }
  if (!suche) return null
  return { suche, anzahl }
}

export function embedPfad(suche: GygSuchkonfiguration, anzahl: GygAnzahl = GYG_ANZAHL_STANDARD): string {
  const params = new URLSearchParams()
  params.set('umfang', suche.umfang)
  params.set('code', suche.countryCode)
  if (suche.umfang !== 'land') params.set('name', suche.name)
  params.set('anzahl', String(anzahl))
  return `/embed/getyourguide?${params.toString()}`
}

export function embedGerahmt(request: { headers: { get(name: string): string | null } }): boolean {
  return (
    request.headers.get('sec-fetch-dest') === 'iframe' &&
    request.headers.get('sec-fetch-mode') === 'navigate' &&
    request.headers.get('sec-fetch-site') === 'same-origin'
  )
}

function geruest(inhalt: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<title>GetYourGuide</title>
</head>
<body>
${inhalt}
</body>
</html>`
}

export function embedDokument(auftrag: GygDokumentAuftrag | null): string {
  if (!auftrag) {
    return geruest('<p>GetYourGuide wird nur nach dem Anzeigen in der Reise geladen.</p>')
  }
  const anfrage = htmlText(suchanfrageText(auftrag.suche))
  const anzahl = auftrag.anzahl
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<title>GetYourGuide</title>
<style>html,body{margin:0;padding:0}</style>
<script async defer src="${GYG_ANALYZER_SRC}" data-gyg-partner-id="${GYG_PARTNER_ID}"></script>
</head>
<body>
<div data-gyg-href="${GYG_WIDGET_HREF}" data-gyg-locale-code="${GYG_LOCALE}" data-gyg-widget="activities" data-gyg-number-of-items="${anzahl}" data-gyg-cmp="${GYG_CMP}" data-gyg-partner-id="${GYG_PARTNER_ID}" data-gyg-q="${anfrage}"><span>Powered by <a target="_blank" rel="sponsored noopener noreferrer" href="${GYG_MARKE_HREF}">GetYourGuide</a></span></div>
<script>${GYG_HOEHE_SKRIPT}</script>
</body>
</html>`
}

export function embedAntwort(request: Request): Response {
  let url: URL
  try {
    url = new URL(request.url)
  } catch {
    return new Response(embedDokument(null), { status: 400, headers: kopf(false) })
  }
  if (url.search.length > 512) {
    return new Response(embedDokument(null), { status: 400, headers: kopf(false) })
  }
  const suche = suchparameterLesen(url.search)
  if (!suche) {
    return new Response(embedDokument(null), { status: 400, headers: kopf(false) })
  }
  const aktiv = embedGerahmt(request)
  return new Response(embedDokument(aktiv ? suche : null), { status: 200, headers: kopf(aktiv) })
}
