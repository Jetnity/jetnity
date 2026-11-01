// lib/activities/viator-widget/renderer.ts
//
// Lädt das neutrale Viator-Dokument in einen undurchsichtigen Rahmen.
// Der Rahmen teilt sich den Ursprung des Reise-Arbeitsbereichs nicht.

import { VIATOR_SANDBOX, viatorEmbedPfad, viatorHoeheAnnehmen } from '@/lib/activities/viator-widget/dokument'

const hoeheHalter = new WeakMap<HTMLElement, () => void>()

export type ViatorLadeErgebnis = { art: 'ressource' } | { art: 'abgelehnt' }

function hoeheLoesen(ziel: HTMLElement) {
  const los = hoeheHalter.get(ziel)
  if (!los) return
  los()
  hoeheHalter.delete(ziel)
}

export const viatorAnwendungsRenderer = {
  laden(name: string, ziel: HTMLElement, signal: AbortSignal): Promise<ViatorLadeErgebnis> {
    if (signal.aborted || typeof document === 'undefined') return Promise.resolve({ art: 'abgelehnt' })
    hoeheLoesen(ziel)
    const rahmen = document.createElement('iframe')
    rahmen.setAttribute('sandbox', VIATOR_SANDBOX)
    rahmen.setAttribute('credentialless', '')
    rahmen.referrerPolicy = 'no-referrer'
    rahmen.title = 'Viator'
    rahmen.src = viatorEmbedPfad(name)
    rahmen.className = 'block h-[40rem] w-full max-w-full border-0 bg-white'
    rahmen.style.display = 'block'
    rahmen.style.width = '100%'
    rahmen.style.height = '40rem'
    rahmen.style.maxWidth = '100%'
    rahmen.style.border = '0'
    rahmen.style.background = '#fff'
    const nachricht = (event: MessageEvent) => {
      viatorHoeheAnnehmen(rahmen, event)
    }
    window.addEventListener('message', nachricht)
    hoeheHalter.set(ziel, () => window.removeEventListener('message', nachricht))
    ziel.replaceChildren(rahmen)
    return new Promise((resolve) => {
      let fertig = false
      const ende = (ergebnis: ViatorLadeErgebnis) => {
        if (fertig) return
        fertig = true
        signal.removeEventListener('abort', abbruch)
        rahmen.removeEventListener('load', geladen)
        rahmen.removeEventListener('error', fehler)
        resolve(ergebnis)
      }
      const abbruch = () => {
        hoeheLoesen(ziel)
        rahmen.remove()
        ende({ art: 'abgelehnt' })
      }
      const geladen = () => ende({ art: 'ressource' })
      const fehler = () => {
        hoeheLoesen(ziel)
        rahmen.remove()
        ende({ art: 'abgelehnt' })
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
  entsorgen(ziel: HTMLElement) {
    hoeheLoesen(ziel)
    ziel.replaceChildren()
  },
}
