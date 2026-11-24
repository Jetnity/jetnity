'use client'

import { StatusSiegel, type StatusSiegelTon } from '@/components/ui/status-siegel'
import { LeistungsStatus } from '@/components/trips/LeistungsStatus'
import { leistungsstand, W3_STATUS_TEXT } from '@/lib/trips/angebot-buchung-anzeige'
import type { TripItem } from '@/types/trips'
import type { BewegungsStatus } from '@/lib/mobility/kanten'
import type { FlugAbschnittStatus } from '@/lib/trips/flug-abdeckung'

type Status = FlugAbschnittStatus | BewegungsStatus | 'selected' | 'booked'

const TEXT: Record<Status, string> = {
  booked: W3_STATUS_TEXT.unverbindliches_angebot,
  selected: W3_STATUS_TEXT.unverbindliches_angebot,
  open: 'Noch offen',
  unknown: 'Noch nicht vollständig bestimmbar',
  covered_by_flight: 'Über Flug abgedeckt',
}

const TON: Record<Status, StatusSiegelTon> = {
  booked: 'gebucht',
  selected: 'gewaehlt',
  open: 'offen',
  unknown: 'hinweis',
  covered_by_flight: 'hinweis',
}

export default function BuchungsSiegel({ status, punkt }: { status: Status; punkt?: TripItem | null }) {
  if (status === 'booked' || status === 'selected') {
    return <LeistungsStatus stand={punkt ? leistungsstand(punkt) : 'unverbindliches_angebot'} />
  }
  return <StatusSiegel ton={TON[status]}>{TEXT[status]}</StatusSiegel>
}
