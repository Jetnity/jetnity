import { Check, Circle, CircleDashed, HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Statussiegel fuer Reiseteile (DESIGN_SYSTEM.md 6.4).
 *
 * Der Zustand steht immer als Wort im Siegel; Form und Symbol unterscheiden ihn
 * zusaetzlich, Farbe allein nie. „Gebucht“ ist die einzige volle Flaeche, damit
 * eine bestaetigte Buchung auf einen Blick von einer blossen Auswahl abweicht.
 *
 * - `gebucht`: von dir als gebucht markiert
 * - `gewaehlt`: ausgewaehlt, aber noch nicht gebucht (gestrichelt)
 * - `offen`: noch nichts gewaehlt
 * - `hinweis`: nicht vollstaendig bestimmbar oder anders abgedeckt
 */
export type StatusSiegelTon = 'gebucht' | 'gewaehlt' | 'offen' | 'hinweis'

const TON: Record<StatusSiegelTon, string> = {
  gebucht: 'border-transparent bg-brand-800 text-white',
  gewaehlt: 'border-dashed border-brand-700 bg-white text-brand-800',
  offen: 'border-line-300 bg-white text-ink-800',
  hinweis: 'border-transparent bg-surface-100 text-ink-800',
}

const SYMBOL = {
  gebucht: Check,
  gewaehlt: CircleDashed,
  offen: Circle,
  hinweis: HelpCircle,
} as const

export function StatusSiegel({
  ton,
  children,
  className,
}: {
  ton: StatusSiegelTon
  children: string
  className?: string
}) {
  const Symbol = SYMBOL[ton]
  return (
    <span
      data-status-siegel={ton}
      className={cn(
        'inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border px-2.5 text-meta font-semibold [overflow-wrap:anywhere]',
        TON[ton],
        className,
      )}
    >
      <Symbol className="h-3.5 w-3.5 shrink-0" strokeWidth={ton === 'gebucht' ? 3 : 2} aria-hidden="true" />
      {children}
    </span>
  )
}
