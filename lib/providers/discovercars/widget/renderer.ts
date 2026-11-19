import { CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'
import { PRODUCTION_POLICY_TABLE } from '@/lib/privacy/privacybee-cmp/produktionspolitik'
import { VENDOR_SCRIPT_EXECUTION_AUTHORIZED } from '@/lib/privacy/widget-consent/vertrag'
import {
  DISCOVERCARS_WIDGET_SANDBOX,
  discoverCarsDatenschutzErlaubt,
  discoverCarsWidgetAdresse,
  discoverCarsWidgetHoehe,
} from './vertrag'

export type DiscoverCarsWidgetPhase = 'laedt' | 'sichtbar' | 'fehler' | 'datenschutz'
/** All three independent production/provider gates must be reviewed before
 * a vendor iframe can run. A mere display click is never marketing consent. */
export function discoverCarsWidgetFreigegeben(): boolean {
  return Boolean(CMP_RELEASE_AUTHORIZED)
    && Boolean(VENDOR_SCRIPT_EXECUTION_AUTHORIZED)
    && Boolean(PRODUCTION_POLICY_TABLE.discovercars)
}

function datenschutzErlaubt(): boolean {
  return discoverCarsDatenschutzErlaubt(window.PrivacyBee, true)
}

/** Called only after the user's display action. Disposal also removes listeners. */
export function discoverCarsWidgetLaden(host: HTMLElement, status: (phase: DiscoverCarsWidgetPhase) => void): () => void {
  // The release decision precedes URL construction and any DOM/network work.
  if (!discoverCarsWidgetFreigegeben()) { status('datenschutz'); return () => {} }
  if (!datenschutzErlaubt()) { status('datenschutz'); return () => {} }
  const src = discoverCarsWidgetAdresse(window.location.origin)
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
