import { cn } from '@/lib/utils'

const GEPLANT = new Set(['In Vorbereitung', 'Kommt später', 'Produktvorschau'])

export function Faehigkeitskennzeichen({
  kennzeichnung,
  className,
}: {
  kennzeichnung: string
  className?: string
}) {
  const geplant = GEPLANT.has(kennzeichnung)
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-full px-2.5 text-[11px] font-semibold tracking-normal',
        geplant
          ? 'border border-line-300 bg-surface-0 text-ink-800'
          : kennzeichnung === 'Heute nutzbar'
            ? 'bg-surface-100 text-brand-800'
            : 'bg-surface-50 text-brand-800',
        className,
      )}
    >
      {kennzeichnung}
    </span>
  )
}
