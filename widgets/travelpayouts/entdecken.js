// Official provider rendering stays on the isolated widget origin.
const ziel = new URLSearchParams(location.search).get('ziel')
const namen = { VIE: 'Wien', BCN: 'Barcelona', LIS: 'Lissabon' }
const hint = document.getElementById('widget-status')
let parentOrigin = null
try { parentOrigin = new URL(document.referrer).origin } catch { /* Direct visit. */ }
function report(status) {
  if (parentOrigin && window.parent !== window)
    window.parent.postMessage({ type: 'jetnity-flight-widget', status }, parentOrigin)
}
if (!Object.hasOwn(namen, ziel)) {
  hint.textContent = 'Dieses Flugziel ist nicht verfügbar.'
  report('fehler')
} else {
  const script = document.createElement('script')
  const params = new URLSearchParams({
    marker: '804084', locale: 'de', currency: 'chf', destination: ziel,
    destination_name: namen[ziel], limit: '4', powered_by: 'false', target_host: 'www.aviasales.com/search', primary: '#153a33',
  })
  script.src = `https://www.travelpayouts.com/weedle/widget.js?${params}`
  script.async = true
  script.addEventListener('load', () => { hint.remove(); report('bereit') })
  script.addEventListener('error', () => {
    hint.textContent = 'Flugpreise konnten nicht geladen werden.'
    report('fehler')
  })
  document.getElementById('zielkarte').append(script)
}
