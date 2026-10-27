// lib/activities/getyourguide/renderer.ts
//
// Lädt das neutrale Einbettungsdokument in einen undurchsichtigen Rahmen.
// Der Rahmen teilt sich den Ursprung des privaten Arbeitsbereichs nicht.

import { GYG_HOEHE_MAX, GYG_SANDBOX, embedPfad } from '@/lib/activities/getyourguide/dokument'
import type { GygLadeErgebnis, GygRenderer } from '@/lib/activities/getyourguide/widget'
import { GYG_ANZAHL_ERWEITERT, GYG_ANZAHL_STANDARD, type GygAnzahl, type GygSuchkonfiguration } from '@/lib/activities/getyourguide/suche'

const hoeheHalter = new WeakMap<HTMLElement, () => void>()

export function gygHoeheAnnehmen(rahmen: HTMLIFrameElement, event: Pick<MessageEvent, 'origin' | 'source' | 'data'>): boolean {
  if (event.origin !== 'null' || event.source == null || event.source !== rahmen.contentWindow) return false
  const data: unknown = event.data
  if (!data || typeof data !== 'object') return false
  const eintrag = data as Record<string, unknown>
  const schluessel = Object.keys(eintrag).sort()
  if (schluessel.length !== 3 || schluessel[0] !== 'art' || schluessel[1] !== 'px' || schluessel[2] !== 'quelle') return false
  if (eintrag.quelle !== 'jetnity-gyg-rahmen' || eintrag.art !== 'hoehe') return false
  if (typeof eintrag.px !== 'number' || !Number.isFinite(eintrag.px)) return false
  const px = Math.round(eintrag.px)
  if (px < 1 || px > GYG_HOEHE_MAX) return false
  rahmen.style.height = `${px}px`
  return true
}

function hoeheLoesen(ziel: HTMLElement) {
  const los = hoeheHalter.get(ziel)
  if (!los) return
  los()
  hoeheHalter.delete(ziel)
}

function rahmenErzeugen(suche: GygSuchkonfiguration, anzahl: GygAnzahl): HTMLIFrameElement {
  const rahmen = document.createElement('iframe')
  rahmen.setAttribute('sandbox', GYG_SANDBOX)
  rahmen.setAttribute('credentialless', '')
  rahmen.referrerPolicy = 'no-referrer'
  rahmen.title = 'GetYourGuide'
  rahmen.src = embedPfad(suche, anzahl)
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
  laden(suche, ziel, signal, anzahl: GygAnzahl = GYG_ANZAHL_STANDARD) {
    if (signal.aborted || typeof document === 'undefined') {
      return Promise.resolve({ art: 'abgelehnt', meldung: '' })
    }
    if (anzahl !== GYG_ANZAHL_STANDARD && anzahl !== GYG_ANZAHL_ERWEITERT) {
      return Promise.resolve({ art: 'abgelehnt', meldung: '' })
    }
    hoeheLoesen(ziel)
    const rahmen = rahmenErzeugen(suche, anzahl)
    const nachricht = (event: MessageEvent) => {
      gygHoeheAnnehmen(rahmen, event)
    }
    window.addEventListener('message', nachricht)
    hoeheHalter.set(ziel, () => window.removeEventListener('message', nachricht))
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
        hoeheLoesen(ziel)
        rahmen.remove()
        ende({ art: 'abgelehnt', meldung: '' })
      }
      const geladen = () => ende({ art: 'ressource' })
      const fehler = () => {
        hoeheLoesen(ziel)
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
    hoeheLoesen(ziel)
    ziel.replaceChildren()
  },
}
