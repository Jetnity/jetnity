'use client'

import { useStadtbild } from './Stadtbild'
import { useState } from 'react'
import type { TripSummaryStage } from '@/types/trips'

/** Local catalogue first; otherwise exact-place Commons photo with separate visible attribution. */
export default function Reisefoto({
  src,
  breite,
  hoehe,
  sofort = false,
  ziel,
}: {
  src: string
  breite?: number
  hoehe?: number
  sofort?: boolean
  ziel?: Pick<TripSummaryStage, 'name' | 'countryCode' | 'placeId'>
}) {
  const bild = useStadtbild(ziel)
  const [failed, setFailed] = useState<string | null>(null)
  const candidate = ziel ? bild.src : src
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={candidate === failed ? src : candidate}
      alt=""
      width={breite}
      height={hoehe}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(candidate)}
      loading={sofort ? 'eager' : 'lazy'}
    />
  )
}
