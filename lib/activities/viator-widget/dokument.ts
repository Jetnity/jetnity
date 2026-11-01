// lib/activities/viator-widget/dokument.ts
//
// Neutrales Einbettungsdokument für das offizielle dynamische Viator-Widget.
// Partner und Widget-Referenz stehen nur hier. Ein direkt geöffnetes Dokument
// lädt das Widget nicht.

import { viatorSuchname } from '@/lib/activities/viator-widget/suche'

export const VIATOR_PARTNER_ID = 'P00328015'
export const VIATOR_WIDGET_REF = 'W-a3c98184-2fae-4bf6-919e-1c32bc42d788'
export const VIATOR_WIDGET_SRC = 'https://www.viator.com/orion/partner/widget.js'
export const VIATOR_DATENSCHUTZ_HREF = 'https://www.viator.com/support/privacyPolicy'
export const VIATOR_WAEHRUNG = 'CHF'
export const VIATOR_SPRACHE = 'de'
export const VIATOR_SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'
export const VIATOR_HOEHE_MAX = 12000
// Das offizielle widget-main.js setzt den Umschlag auf display:none und den
// inneren Rahmen auf height:0. Es zeigt ihn nur, wenn die Größennachricht
// vi-wm von https://www.viator.com kommt. Im undurchsichtigen Sandbox-Rahmen
// ist diese Herkunft null. Diese Brücke prüft dieselbe Nachricht, den
// erzeugten Rahmen und die erwartete Widget-Adresse, und setzt nur Höhe und
// Anzeige des eigenen Umschlags. Sie ändert keine Adresse und liest nicht die
// Reise-Seite.
export const VIATOR_HOEHE_SKRIPT = `(function(){var MAX=${VIATOR_HOEHE_MAX};var PARTNER=${JSON.stringify(VIATOR_PARTNER_ID)};var REF=${JSON.stringify(VIATOR_WIDGET_REF)};function zahl(wert){if(typeof wert!=="number"||!isFinite(wert)||wert<0||wert>MAX)return null;var px=Math.round(wert);return px}function wd(u){if(typeof u!=="string"||u.length>4000)return null;var teil=u.split("wd=")[1];if(!teil)return null;try{var roh=atob(decodeURIComponent(teil));var bytes=new Uint8Array(roh.length);for(var i=0;i<roh.length;i++)bytes[i]=roh.charCodeAt(i);var obj=JSON.parse(new TextDecoder().decode(bytes));if(!obj||typeof obj.f!=="string"||!/^viw-[0-9]{1,5}$/.test(obj.f))return null;if(obj.s!=null&&obj.s!=="")return null;return obj}catch(e){return null}}function ziel(src){try{var url=new URL(src);return url.origin==="https://www.viator.com"&&(url.pathname==="/widget/partner/"+PARTNER+"/"+REF||url.pathname==="/de-DE/widget/partner/"+PARTNER+"/"+REF)}catch(e){return false}}addEventListener("message",function(e){var data=e.data;if(e.origin!=="null"||!data||data.id!=="vi-wm")return;var px=zahl(data.h);var meta=wd(data.u);if(px===null||!meta)return;var frame=document.getElementById(meta.f);if(!frame||frame.tagName!=="IFRAME"||e.source!==frame.contentWindow||!ziel(frame.src))return;var wrapper=frame.parentElement;if(!wrapper||wrapper.getAttribute("data-vi-partner-id")!==PARTNER||wrapper.getAttribute("data-vi-widget-ref")!==REF)return;wrapper.style.display="";wrapper.style.height=px+"px";frame.style.height="100%";if(px>0)parent.postMessage({quelle:"jetnity-viator-rahmen",art:"hoehe",px:px},"*")})})();`
export const VIATOR_HOEHE_HASH = 'sha256-SRcRRAfLld8Awzlv8B6TdRivZ/eOaT92pb3XTnxvdww='

const PARAMETER = ['name'] as const
const SANDBOX_BASIS = `sandbox ${VIATOR_SANDBOX}; frame-ancestors 'self'; base-uri 'none'; object-src 'none'; form-action 'none'`

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
    `script-src '${VIATOR_HOEHE_HASH}' https://www.viator.com`,
    'frame-src https://www.viator.com',
    'img-src https://www.viator.com https://media.tacdn.com data:',
    "style-src 'unsafe-inline' https://www.viator.com",
    'font-src https://www.viator.com data:',
    'connect-src https://www.viator.com',
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

export function viatorEmbedPfad(name: string): string {
  const params = new URLSearchParams()
  params.set('name', name)
  return `/embed/viator?${params.toString()}`
}

export function viatorParameterLesen(roh: string): string | null {
  if (roh.length > 512) return null
  const params = new URLSearchParams(roh.startsWith('?') ? roh.slice(1) : roh)
  const schluessel = [...params.keys()]
  if (schluessel.length !== 1 || schluessel[0] !== PARAMETER[0]) return null
  if (params.getAll('name').length !== 1) return null
  return viatorSuchname(params.get('name') ?? '')
}

export function viatorEmbedGerahmt(request: { headers: { get(name: string): string | null } }): boolean {
  return (
    request.headers.get('sec-fetch-dest') === 'iframe' &&
    request.headers.get('sec-fetch-mode') === 'navigate' &&
    request.headers.get('sec-fetch-site') === 'same-origin'
  )
}

export function viatorEmbedDokument(name: string | null): string {
  if (!name) {
    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Viator</title></head><body><p>Viator wird nur in der Reise geladen.</p></body></html>`
  }
  const suche = htmlText(name)
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<title>Viator</title>
<style>html,body{margin:0;padding:0}</style>
</head>
<body>
<div data-vi-partner-id="${VIATOR_PARTNER_ID}" data-vi-widget-ref="${VIATOR_WIDGET_REF}" data-vi-search-term="${suche}" data-vi-currency="${VIATOR_WAEHRUNG}" data-vi-language="${VIATOR_SPRACHE}"></div>
<script async src="${VIATOR_WIDGET_SRC}"></script>
<script>${VIATOR_HOEHE_SKRIPT}</script>
</body>
</html>`
}

export function viatorEmbedAntwort(request: Request): Response {
  let url: URL
  try {
    url = new URL(request.url)
  } catch {
    return new Response(viatorEmbedDokument(null), { status: 400, headers: kopf(false) })
  }
  if (url.search.length > 512) {
    return new Response(viatorEmbedDokument(null), { status: 400, headers: kopf(false) })
  }
  const name = viatorParameterLesen(url.search)
  if (!name) {
    return new Response(viatorEmbedDokument(null), { status: 400, headers: kopf(false) })
  }
  const aktiv = viatorEmbedGerahmt(request)
  return new Response(viatorEmbedDokument(aktiv ? name : null), { status: 200, headers: kopf(aktiv) })
}

export function viatorHoeheAnnehmen(
  rahmen: HTMLIFrameElement,
  event: Pick<MessageEvent, 'origin' | 'source' | 'data'>,
): boolean {
  if (event.origin !== 'null' || event.source == null || event.source !== rahmen.contentWindow) return false
  const data: unknown = event.data
  if (!data || typeof data !== 'object') return false
  const eintrag = data as Record<string, unknown>
  const schluessel = Object.keys(eintrag).sort()
  if (schluessel.length !== 3 || schluessel[0] !== 'art' || schluessel[1] !== 'px' || schluessel[2] !== 'quelle') return false
  if (eintrag.quelle !== 'jetnity-viator-rahmen' || eintrag.art !== 'hoehe') return false
  if (typeof eintrag.px !== 'number' || !Number.isFinite(eintrag.px)) return false
  const px = Math.round(eintrag.px)
  if (px < 1 || px > VIATOR_HOEHE_MAX) return false
  rahmen.style.height = `${px}px`
  return true
}
