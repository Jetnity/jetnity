'use client'

// Gemeinsame Feldhülle für /planen und andere V2-Formulare.
// Fehler sitzen am Feld, nicht nur in einer Meldung weiter unten.
// Rot ist nie das einzige Signal: Rahmen, Fläche, Icon und Text.

import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

import { feldFehlerId } from '@/lib/formular/feldfehler'
import { cn } from '@/lib/utils'

export const FELD_FEHLER_RAHMEN =
  'border-danger-600 bg-surface-50 ring-4 ring-danger-600/10 focus:border-danger-600 focus:ring-danger-600/15'

type FeldProps = {
  id: string
  label: string
  fehler?: string
  optional?: boolean
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function Feld({ id, label, fehler, optional, icon, children, className }: FeldProps) {
  const fehlerId = feldFehlerId(id)

  return (
    <div className={cn('grid min-w-0 gap-2 text-sm font-medium text-brand-800', className)}>
      <label htmlFor={id} className={cn(fehler && 'text-brand-900')}>
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-ink-700">(optional)</span>
        ) : (
          <span className="sr-only"> (Pflichtfeld)</span>
        )}
      </label>
      <div className="relative min-w-0">
        {icon}
        {children}
      </div>
      {fehler ? (
        <p
          id={fehlerId}
          role="alert"
          className="flex items-start gap-1.5 text-sm font-normal text-danger-600"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-800" aria-hidden="true" />
          {fehler}
        </p>
      ) : null}
    </div>
  )
}

export function FormularZusammenfassung({
  sichtbar,
  text,
  extra,
}: {
  sichtbar: boolean
  text: string
  extra?: ReactNode
}) {
  if (!sichtbar && !extra) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-5 rounded-2xl border border-danger-600/25 bg-surface-50 px-4 py-3 text-sm leading-6 text-brand-800"
    >
      {sichtbar ? <p className="font-medium">{text}</p> : null}
      {extra}
    </div>
  )
}
