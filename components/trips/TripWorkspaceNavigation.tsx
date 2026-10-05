'use client'

import { useEffect, useState, type RefObject } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { WorkspaceRueckkehr } from '@/lib/trips/detail'

import {
  ORGANISIEREN_RUECKKEHR_ABSTAND_FALLBACK,
  organisierenRueckkehrAbstand,
} from '@/lib/trips/organize-premium-experience-6'

function kopfUntenLesen(): number | null {
  const kopf = document.querySelector('header')
  if (!(kopf instanceof HTMLElement)) return null
  const stil = getComputedStyle(kopf)
  if (stil.display === 'none' || stil.visibility === 'hidden') return null
  const rand = kopf.getBoundingClientRect()
  if (rand.height <= 0 || rand.width <= 0) return null
  return rand.bottom
}

export default function TripWorkspaceNavigation({
  sichtbar,
  rueckkehr,
  zurueckRef,
}: {
  sichtbar: boolean
  rueckkehr: WorkspaceRueckkehr
  zurueckRef: RefObject<HTMLButtonElement | null>
}) {
  const [abstand, setAbstand] = useState(ORGANISIEREN_RUECKKEHR_ABSTAND_FALLBACK)

  useEffect(() => {
    if (!sichtbar) return
    const messen = () => {
      const naechster = organisierenRueckkehrAbstand(kopfUntenLesen())
      setAbstand((bisher) => (bisher === naechster ? bisher : naechster))
    }
    messen()
    const kopf = document.querySelector('header')
    const beobachter = new ResizeObserver(messen)
    if (kopf instanceof HTMLElement) beobachter.observe(kopf)
    window.addEventListener('resize', messen)
    return () => {
      beobachter.disconnect()
      window.removeEventListener('resize', messen)
    }
  }, [sichtbar])

  if (!sichtbar) return null

  return (
    <nav
      aria-label="Reise"
      style={{ top: abstand, scrollMarginTop: abstand }}
      className="sticky z-40 -mx-3 mt-3 border-y border-line-200 bg-surface-75 px-3 py-2 sm:-mx-6 sm:px-6"
    >
      <button
        ref={zurueckRef}
        type="button"
        onClick={rueckkehr.ausfuehren}
        style={{ scrollMarginTop: abstand }}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-200 bg-white px-3.5 text-sm font-semibold text-brand-800 transition hover:border-line-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {rueckkehr.label}
      </button>
    </nav>
  )
}
