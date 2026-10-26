// lib/activities/getyourguide/renderer.ts
//
// Lädt das neutrale Einbettungsdokument in einen undurchsichtigen Rahmen.
// Der Rahmen teilt sich den Ursprung des privaten Arbeitsbereichs nicht.

import { GYG_SANDBOX, embedPfad } from '@/lib/activities/getyourguide/dokument'
import type { GygLadeErgebnis, GygRenderer } from '@/lib/activities/getyourguide/widget'
import type { GygSuchkonfiguration } from '@/lib/activities/getyourguide/suche'

function rahmenErzeugen(suche: GygSuchkonfiguration): HTMLIFrameElement {
  const rahmen = document.createElement('iframe')
  rahmen.setAttribute('sandbox', GYG_SANDBOX)
  rahmen.setAttribute('credentialless', '')
  rahmen.referrerPolicy = 'no-referrer'
  rahmen.title = 'GetYourGuide'
  rahmen.src = embedPfad(suche)
  rahmen.className = 'block h-[40rem] w-full max-w-full border-0 bg-white'
  rahmen.style.display = 'block'
  rahmen.style.width = '100%'
  rahmen.style.height = '40rem'
  rahmen.style.maxWidth = '100%'
  rahmen.style.border = '0'
  rahmen.style.background = '#fff'
  return rahmen
}

export const anwendungsRenderer: GygRenderer = {
  laden(suche, ziel, signal) {
    if (signal.aborted || typeof document === 'undefined') {
      return Promise.resolve({ art: 'abgelehnt', meldung: '' })
    }
    const rahmen = rahmenErzeugen(suche)
    ziel.replaceChildren(rahmen)
    return new Promise<GygLadeErgebnis>((resolve) => {
      let fertig = false
      const ende = (ergebnis: GygLadeErgebnis) => {
        if (fertig) return
        fertig = true
        signal.removeEventListener('abort', abbruch)
        rahmen.removeEventListener('load', geladen)
        rahmen.removeEventListener('error', fehler)
        resolve(ergebnis)
      }
      const abbruch = () => {
        rahmen.remove()
        ende({ art: 'abgelehnt', meldung: '' })
      }
      const geladen = () => ende({ art: 'ressource' })
      const fehler = () => {
        rahmen.remove()
        ende({ art: 'abgelehnt', meldung: '' })
      }
      if (signal.aborted) {
        abbruch()
        return
      }
      signal.addEventListener('abort', abbruch, { once: true })
      rahmen.addEventListener('load', geladen, { once: true })
      rahmen.addEventListener('error', fehler, { once: true })
    })
  },
  entsorgen(ziel) {
    ziel.replaceChildren()
  },
}
