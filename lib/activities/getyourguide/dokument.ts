// lib/activities/getyourguide/dokument.ts
//
// Neutrales Einbettungsdokument für das manuelle GetYourGuide-Widget.
// Ein direkt geöffnetes Dokument lädt den Analyzer nicht.

import { suchanfrageText, suchkonfigurationBauen, type GygSuchkonfiguration, type GygSuchumfang } from '@/lib/activities/getyourguide/suche'

export const GYG_PARTNER_ID = '2MQHT6Z'
export const GYG_ANALYZER_SRC = 'https://widget.getyourguide.com/dist/pa.umd.production.min.js'
export const GYG_WIDGET_HREF = 'https://widget.getyourguide.com/default/activities.frame'
export const GYG_MARKE_HREF = 'https://www.getyourguide.com/'
export const GYG_CMP = 'jetnity_activities'
export const GYG_LOCALE = 'de-CH'
export const GYG_ANZAHL = '3'
export const GYG_SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'
export const GYG_HOEHE_SKRIPT = '(function(){var letzte=-1,gemerkt=0,timer=0;function lesen(){var rahmen=document.querySelector("iframe");var px=Math.ceil(Math.max(document.body?document.body.scrollHeight:0,document.documentElement.scrollHeight));if(rahmen){var ende=Math.ceil(rahmen.offsetTop+rahmen.offsetHeight);if(ende>px)px=ende;var vater=rahmen.parentElement;if(vater){var gesetzt=parseFloat(vater.style.height);if(isFinite(gesetzt)&&gesetzt>px)px=Math.ceil(gesetzt)}}return px}function messen(){var px=lesen();if(!isFinite(px)||px<1||px>2400)return;if(px>gemerkt){gemerkt=px;clearTimeout(timer);timer=setTimeout(function(){var rahmen=document.querySelector("iframe");var vater=rahmen&&rahmen.parentElement;if(vater)vater.style.height=gemerkt+"px";if(gemerkt===letzte)return;letzte=gemerkt;parent.postMessage({quelle:"jetnity-gyg-rahmen",art:"hoehe",px:letzte},"*")},500)}else if(px+1<gemerkt){var rahmen=document.querySelector("iframe");var vater=rahmen&&rahmen.parentElement;if(vater)vater.style.height=gemerkt+"px"}}var beobachter=new ResizeObserver(messen);beobachter.observe(document.documentElement);new MutationObserver(function(){var rahmen=document.querySelector("iframe");if(rahmen)beobachter.observe(rahmen);messen()}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["style"]});addEventListener("load",messen)})();'
export const GYG_HOEHE_HASH = 'sha256-cOuVlZ9+YXLzZAoDPA9amKfiijQx3AnWE6eS4boIRe4='

const UMFANG = new Set<GygSuchumfang>(['stadt', 'region', 'insel', 'land'])
const PARAMETER = ['umfang', 'code', 'name'] as const
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

export function suchparameterLesen(roh: string): GygSuchkonfiguration | null {
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
  const umfang = params.get('umfang')
  const code = params.get('code')
  if (!umfang || !code || !UMFANG.has(umfang as GygSuchumfang)) return null
  const art = umfang as GygSuchumfang
  if (art === 'land') {
    if (gezaehlt.has('name')) return null
    return suchkonfigurationBauen({ umfang: 'land', name: '', countryCode: code })
  }
  const name = params.get('name')
  if (!name) return null
  return suchkonfigurationBauen({ umfang: art, name, countryCode: code })
}

export function embedPfad(suche: GygSuchkonfiguration): string {
  const params = new URLSearchParams()
  params.set('umfang', suche.umfang)
  params.set('code', suche.countryCode)
  if (suche.umfang !== 'land') params.set('name', suche.name)
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

export function embedDokument(suche: GygSuchkonfiguration | null): string {
  if (!suche) {
    return geruest('<p>GetYourGuide wird nur nach dem Anzeigen in der Reise geladen.</p>')
  }
  const anfrage = htmlText(suchanfrageText(suche))
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<title>GetYourGuide</title>
<script async defer src="${GYG_ANALYZER_SRC}" data-gyg-partner-id="${GYG_PARTNER_ID}"></script>
</head>
<body>
<div data-gyg-href="${GYG_WIDGET_HREF}" data-gyg-locale-code="${GYG_LOCALE}" data-gyg-widget="activities" data-gyg-number-of-items="${GYG_ANZAHL}" data-gyg-cmp="${GYG_CMP}" data-gyg-partner-id="${GYG_PARTNER_ID}" data-gyg-q="${anfrage}"><span>Powered by <a target="_blank" rel="sponsored noopener noreferrer" href="${GYG_MARKE_HREF}">GetYourGuide</a></span></div>
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
