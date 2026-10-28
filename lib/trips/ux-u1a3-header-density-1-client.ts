'use client'

import { useEffect, useState } from 'react'

import { UX_U1A3_ROOT_GROSS_PX, dichteZeile } from '@/lib/trips/ux-u1a3-header-density-1'

export function useKopfDichte() {
  const [stand, setStand] = useState({ zeile: false, gross: false, bereit: false })

  useEffect(() => {
    const lesen = () => {
      const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
      const rootSchriftPx = Number.isFinite(root) ? root : 16
      setStand({
        zeile: dichteZeile({ viewportBreite: window.innerWidth, rootSchriftPx }),
        gross: rootSchriftPx >= UX_U1A3_ROOT_GROSS_PX,
        bereit: true,
      })
    }
    lesen()
    window.addEventListener('resize', lesen)
    return () => window.removeEventListener('resize', lesen)
  }, [])

  return stand
}
