'use client'

import type { ReactNode } from 'react'
import type { Trip } from '@/types/trips'
import {
  flugKontext,
  flugWidgetOrigin,
} from '@/lib/providers/travelpayouts/suche'
import BookingFlugsuche from './fluege/BookingFlugsuche'
import Flugvergleich from './fluege/Flugvergleich'

export default function Flugsuche({
  reise,
  etappen,
}: {
  reise: Trip
  etappen: ReactNode
}) {
  const origin = flugWidgetOrigin(
    process.env.NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN,
  )
  return origin ? (
    <Flugvergleich key={flugKontext(reise)} reise={reise} origin={origin} />
  ) : (
    <BookingFlugsuche
      key={flugKontext(reise)}
      reise={reise}
      etappen={etappen}
    />
  )
}
