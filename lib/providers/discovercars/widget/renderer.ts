import { CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'
import {
  DISCOVERCARS_WIDGET_SANDBOX,
  discoverCarsDatenschutzErlaubt,
  discoverCarsWidgetAdresse,
  discoverCarsWidgetHoehe,
} from './vertrag'

export type DiscoverCarsWidgetPhase = 'laedt' | 'sichtbar' | 'fehler' | 'datenschutz'
const CMP_GESEHEN = 'jetnity:discovercars-cmp-observed'
let cmpGesehen = false

function datenschutzErlaubt(): boolean {
  cmpGesehen ||= window.PrivacyBee !== undefined
  try {
    cmpGesehen ||= window.sessionStorage.getItem(CMP_GESEHEN) === '1'
    if (cmpGesehen) window.sessionStorage.setItem(CMP_GESEHEN, '1')
  } catch { /* A failed storage access cannot undo the in-memory latch. */ }
  return discoverCarsDatenschutzErlaubt(window.PrivacyBee, Boolean(CMP_RELEASE_AUTHORIZED) || cmpGesehen)
}

/** Called only after the user's display action. Disposal also removes listeners. */
export function discoverCarsWidgetLaden(host: HTMLElement, status: (phase: DiscoverCarsWidgetPhase) => void): () => void {
  const src = discoverCarsWidgetAdresse(window.location.origin)
  if (!datenschutzErlaubt()) { status('datenschutz'); return () => {} }
  if (!src) { status('fehler'); return () => {} }

  const frame = document.createElement('iframe')
  frame.title = 'DiscoverCars Mietwagensuche'
  frame.setAttribute('sandbox', DISCOVERCARS_WIDGET_SANDBOX)
  frame.setAttribute('credentialless', '')
  frame.referrerPolicy = 'origin'
  frame.allow = "camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'"
  frame.style.cssText = 'display:block;width:100%;max-width:100%;height:900px;border:0;background:#f5f5ef'
  let beendet = false
  let bereit = false
  const stop = () => {
    if (beendet) return
    beendet = true
    clearTimeout(timer)
    window.removeEventListener('message', nachricht)
    window.removeEventListener('focus', pruefen)
    window.removeEventListener('pageshow', pruefen)
    document.removeEventListener('privacybee:ready', pruefen)
    document.removeEventListener('privacybee:consent-changed', pruefen)
    frame.removeEventListener('error', fehler)
    frame.remove()
  }
  const fehler = () => { if (beendet) return; stop(); status('fehler') }
  const pruefen = () => {
    if (!datenschutzErlaubt()) { stop(); status('datenschutz') }
  }
  const nachricht = (event: MessageEvent) => {
    if (beendet) return
    const height = discoverCarsWidgetHoehe(event, frame.contentWindow)
    if (height === null) return
    if (!datenschutzErlaubt()) { stop(); status('datenschutz'); return }
    frame.style.height = `${height}px`
    if (!bereit) {
      bereit = true
      clearTimeout(timer)
      status('sichtbar')
    }
  }
  window.addEventListener('message', nachricht)
  window.addEventListener('focus', pruefen)
  window.addEventListener('pageshow', pruefen)
  document.addEventListener('privacybee:ready', pruefen)
  document.addEventListener('privacybee:consent-changed', pruefen)
  frame.addEventListener('error', fehler)
  const timer = setTimeout(fehler, 20000)
  status('laedt')
  frame.src = src
  host.replaceChildren(frame)
  return stop
}
