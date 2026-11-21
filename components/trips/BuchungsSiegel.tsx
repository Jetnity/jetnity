'use client'

import { StatusSiegel, type StatusSiegelTon } from '@/components/ui/status-siegel'
import { BUCHUNGSSTATUS_BEZEICHNUNG } from '@/lib/trips/buchung'
import type { BewegungsStatus } from '@/lib/mobility/kanten'
import type { FlugAbschnittStatus } from '@/lib/trips/flug-abdeckung'

type Status = FlugAbschnittStatus | BewegungsStatus | 'selected' | 'booked'

const TEXT: Record<Status, string> = {
  booked: BUCHUNGSSTATUS_BEZEICHNUNG.booked,
  selected: BUCHUNGSSTATUS_BEZEICHNUNG.unconfirmed,
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

export default function BuchungsSiegel({ status }: { status: Status }) {
  return <StatusSiegel ton={TON[status]}>{TEXT[status]}</StatusSiegel>
}
