'use client'

import { useEffect, useState } from 'react'

import { naechsteKalenderPruefung } from '@/lib/account/account-home-export-1/kalender'
import { heutigesDatum } from '@/lib/account/naechste-reise'

/** Geräte-Kalendertag. Liest nur die lokale Uhr, kein Netz und keinen Speicher. */
export function useGeraetekalendertag(): string | null {
  const [heute, setHeute] = useState<string | null>(null)

  useEffect(() => {
    let timer = 0
    let aktiv = true

    const planen = () => {
      window.clearTimeout(timer)
      if (!aktiv) return
      const jetzt = new Date()
      const tag = heutigesDatum(jetzt)
      setHeute((bisher) => (bisher === tag ? bisher : tag))
      timer = window.setTimeout(planen, naechsteKalenderPruefung(jetzt, jetzt.getTimezoneOffset()))
    }

    const beiSichtbar = () => {
      if (document.visibilityState === 'visible') planen()
    }

    planen()
    window.addEventListener('focus', planen)
    window.addEventListener('pageshow', planen)
    document.addEventListener('visibilitychange', beiSichtbar)
    return () => {
      aktiv = false
      window.clearTimeout(timer)
      window.removeEventListener('focus', planen)
      window.removeEventListener('pageshow', planen)
      document.removeEventListener('visibilitychange', beiSichtbar)
    }
  }, [])

  return heute
}
