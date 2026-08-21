'use client'

import { BUCHUNGSSTATUS_BEZEICHNUNG } from '@/lib/trips/buchung'
import { cn } from '@/lib/utils'
import type { FlugAbschnittStatus } from '@/lib/trips/flug-abdeckung'

const TEXT: Record<FlugAbschnittStatus | 'selected' | 'booked', string> = {
  booked: BUCHUNGSSTATUS_BEZEICHNUNG.booked,
  selected: BUCHUNGSSTATUS_BEZEICHNUNG.unconfirmed,
  open: 'Noch offen',
  unknown: 'Noch nicht vollständig bestimmbar',
}

export default function BuchungsSiegel({
  status,
}: {
  status: FlugAbschnittStatus | 'selected' | 'booked'
}) {
  const text = TEXT[status]
  return (
    <span
      className={cn(
        'inline-flex min-h-8 items-center rounded-full px-2.5 text-xs font-semibold',
        status === 'booked' && 'bg-surface-100 text-brand-800',
        status === 'selected' && 'bg-surface-25 text-ink-800',
        status === 'open' && 'border border-line-300 bg-white text-ink-800',
        status === 'unknown' && 'bg-surface-25 text-ink-700',
      )}
    >
      {text}
    </span>
  )
}
