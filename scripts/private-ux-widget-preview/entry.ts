// Public static shells only. No Supabase, cookies, API keys or trip identifiers.
// The deployment CSP names the exact allowed preview parent. App-side consent,
// credentialless sandbox, source-window and opaque-origin checks stay unchanged.
import { embedDokument, suchparameterLesen } from '../../lib/activities/getyourguide/dokument'
import { viatorEmbedDokument, viatorParameterLesen } from '../../lib/activities/viator-widget/dokument'

if (window.top !== window.self) {
  const html = location.pathname === '/getyourguide.html'
    ? embedDokument(suchparameterLesen(location.search))
    : location.pathname === '/viator.html'
      ? viatorEmbedDokument(viatorParameterLesen(location.search))
      : null
  if (html) {
    // Both existing generators validate and escape every public search parameter.
    document.open()
    document.write(html)
    document.close()
  }
}
