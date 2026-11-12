import { readCmpApi } from '@/lib/privacy/privacybee-cmp/schnappschuss'
import { CMP_RELEASE_AUTHORIZED } from '@/lib/privacy/privacybee-cmp/vertrag'
import { flugWidgetOrigin } from './suche'

export type FlugRahmenPhase =
  | 'laedt'
  | 'bereit'
  | 'langsam'
  | 'fehler'
  | 'datenschutz'
let cmpGesehen = false
const CMP_GESEHEN = 'jetnity:flugsuche-cmp-observed'

export function flugDatenschutzErlaubt(
  api: unknown,
  erforderlich: boolean,
): boolean {
  const read = readCmpApi(api)
  return read.status === 'explicit'
    ? read.optionalSatisfied
    : !erforderlich && api === undefined && read.reason === 'missing_api'
}

function erlaubt(): boolean {
  cmpGesehen ||= window.PrivacyBee !== undefined
  try {
    cmpGesehen ||= sessionStorage.getItem(CMP_GESEHEN) === '1'
    if (cmpGesehen) sessionStorage.setItem(CMP_GESEHEN, '1')
  } catch {
    /* The in-memory latch still honors a previously observed CMP. */
  }
  return flugDatenschutzErlaubt(
    window.PrivacyBee,
    Boolean(CMP_RELEASE_AUTHORIZED) || cmpGesehen,
  )
}

/** Source AND exact origin are checked; messages never carry flight offers or trip state. */
export function flugRahmenNachricht(
  event: Pick<MessageEvent, 'origin' | 'source' | 'data'>,
  quelle: Window | null,
  origin: string,
): 'bereit' | 'fehler' | null {
  if (
    !quelle ||
    event.source !== quelle ||
    event.origin !== origin ||
    !event.data ||
    typeof event.data !== 'object' ||
    event.data.type !== 'jetnity-flight-widget'
  )
    return null
  return event.data.status === 'bereit' || event.data.status === 'fehler'
    ? event.data.status
    : null
}

export function flugRahmen(
  host: HTMLElement,
  url: string,
  status: (phase: FlugRahmenPhase) => void,
): () => void {
  let target: URL
  try {
    target = new URL(url)
  } catch {
    status('fehler')
    return () => {}
  }
  if (
    !flugWidgetOrigin(target.origin) ||
    target.origin === window.location.origin ||
    target.pathname !== '/'
  ) {
    status('fehler')
    return () => {}
  }
  if (!erlaubt()) {
    status('datenschutz')
    return () => {}
  }
  const frame = document.createElement('iframe')
  frame.title = 'Flugangebote und Preisvergleich'
  frame.className = 'flug-frame'
  // Separate-origin storage is required by the official widget. No Jetnity account origin.
  frame.setAttribute(
    'sandbox',
    'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms',
  )
  frame.setAttribute('credentialless', '')
  frame.referrerPolicy = 'origin'
  frame.allow =
    "camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'"
  let beendet = false
  const timer = setTimeout(() => {
    if (!beendet) status('langsam')
  }, 25000)
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
  const pruefen = () => {
    if (!beendet && !erlaubt()) {
      stop()
      status('datenschutz')
    }
  }
  const fehler = () => {
    if (!beendet) {
      stop()
      status('fehler')
    }
  }
  const nachricht = (e: MessageEvent) => {
    const phase = flugRahmenNachricht(e, frame.contentWindow, target.origin)
    if (!phase || beendet) return
    pruefen()
    if (beendet) return
    if (phase === 'fehler') {
      fehler()
      return
    }
    clearTimeout(timer)
    // Only bootstrap readiness. Results, progress and errors belong to the provider UI.
    status('bereit')
  }
  window.addEventListener('message', nachricht)
  window.addEventListener('focus', pruefen)
  window.addEventListener('pageshow', pruefen)
  document.addEventListener('privacybee:ready', pruefen)
  document.addEventListener('privacybee:consent-changed', pruefen)
  frame.addEventListener('error', fehler)
  status('laedt')
  frame.src = target.href
  host.replaceChildren(frame)
  return stop
}
