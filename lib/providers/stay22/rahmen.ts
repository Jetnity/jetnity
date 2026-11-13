import { readCmpApi } from '@/lib/privacy/privacybee-cmp/schnappschuss'
import { CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'
import { STAY22_SANDBOX } from './suche'

export type Stay22Phase = 'laedt' | 'rahmen' | 'langsam' | 'fehler' | 'datenschutz'
let cmpGesehen = false
const CMP_GESEHEN = 'jetnity:stay22-cmp-observed'

export function stay22DatenschutzErlaubt(api: unknown, erforderlich: boolean): boolean {
  const read = readCmpApi(api)
  return read.status === 'explicit' ? read.optionalSatisfied : !erforderlich && api === undefined && read.reason === 'missing_api'
}

function erlaubt(): boolean {
  cmpGesehen ||= window.PrivacyBee !== undefined
  try {
    cmpGesehen ||= window.sessionStorage.getItem(CMP_GESEHEN) === '1'
    if (cmpGesehen) window.sessionStorage.setItem(CMP_GESEHEN, '1')
  } catch { /* The in-memory latch still honors a previously observed CMP. */ }
  return stay22DatenschutzErlaubt(window.PrivacyBee, Boolean(CMP_RELEASE_AUTHORIZED) || cmpGesehen)
}

/** The provider owns results and errors. load only confirms the frame document. */
export function stay22Rahmen(host: HTMLElement, url: string, status: (phase: Stay22Phase) => void): () => void {
  let parsed: URL
  try { parsed = new URL(url) } catch { status('fehler'); return () => {} }
  if (parsed.origin !== 'https://www.stay22.com' || parsed.pathname !== '/embed/gm' || parsed.searchParams.get('aid') !== 'jetnity') {
    status('fehler'); return () => {}
  }
  if (!erlaubt()) { status('datenschutz'); return () => {} }
  const frame = document.createElement('iframe')
  frame.title = 'Unterkünfte, Preise und Karte von Stay22'
  frame.className = 'stay22-frame'
  frame.setAttribute('sandbox', STAY22_SANDBOX)
  // Chromium forces noopener on credentialless popups, preventing asynchronous
  // popup flows from retaining a usable window handle. Use a normal sandboxed
  // frame for the supplier's redirects, consistent with Safari's behavior.
  // Keep the cross-origin sandbox, consent gate and restricted permissions.
  frame.referrerPolicy = 'origin'
  frame.allow = "fullscreen; camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'"
  let beendet = false
  const stop = () => {
    if (beendet) return
    beendet = true
    clearTimeout(timer)
    frame.removeEventListener('load', geladen)
    frame.removeEventListener('error', fehler)
    window.removeEventListener('focus', pruefen)
    window.removeEventListener('pageshow', pruefen)
    document.removeEventListener('privacybee:ready', pruefen)
    document.removeEventListener('privacybee:consent-changed', pruefen)
    frame.remove()
  }
  const pruefen = () => { if (!beendet && !erlaubt()) { stop(); status('datenschutz') } }
  const geladen = () => {
    if (beendet) return
    pruefen()
    if (!beendet) { clearTimeout(timer); status('rahmen') }
  }
  const fehler = () => { if (!beendet) { stop(); status('fehler') } }
  const timer = setTimeout(() => { if (!beendet) status('langsam') }, 20000)
  frame.addEventListener('load', geladen)
  frame.addEventListener('error', fehler)
  window.addEventListener('focus', pruefen)
  window.addEventListener('pageshow', pruefen)
  document.addEventListener('privacybee:ready', pruefen)
  document.addEventListener('privacybee:consent-changed', pruefen)
  status('laedt')
  frame.src = url
  host.replaceChildren(frame)
  return stop
}
