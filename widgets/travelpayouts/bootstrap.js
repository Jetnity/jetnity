// Public, independent widget document. No Jetnity session, storage or trip graph.
const hint = document.getElementById('widget-status')
const query = new URLSearchParams(location.search)
const search = query.get('flightSearch') || ''
const allowed = new Set([
  'flightSearch',
  'origin_airports',
  'destination_airports',
])
const valid =
  /^[A-Z]{3}\d{4}[A-Z]{3}(?:\d{4}|-[A-Z]{3}\d{4})?c?[1-9][0-9]{0,2}$/.test(
    search,
  ) &&
  [...query.keys()].every((key) => allowed.has(key)) &&
  ['origin_airports', 'destination_airports'].every((key) =>
    /^(0|0,1)$/.test(query.get(key) || ''),
  )
let parentOrigin = null
try {
  parentOrigin = new URL(document.referrer).origin
} catch {
  /* Direct document visit. */
}
function report(status) {
  if (parentOrigin && window.parent !== window)
    window.parent.postMessage(
      { type: 'jetnity-flight-widget', status },
      parentOrigin,
    )
}
if (!valid) {
  hint.textContent = 'Bitte starte eine neue Flugsuche in Jetnity.'
  report('fehler')
} else {
  window.TPWL_CONFIGURATION = { resultsURL: location.origin + '/' }
  const script = document.createElement('script')
  script.type = 'module'
  script.src = 'https://tpwgts.com/wl_web/main.js?wl_id=24468'
  script.addEventListener('load', () => {
    hint.remove()
    report('bereit')
  })
  script.addEventListener('error', () => {
    hint.textContent = 'Die Flugsuche konnte nicht geladen werden.'
    report('fehler')
  })
  document.head.append(script)
}
