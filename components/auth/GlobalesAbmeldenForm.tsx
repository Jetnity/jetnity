'use client'

import * as React from 'react'
import { useActionState } from 'react'

import { cn } from '@/lib/utils'
import type { GlobalesSignOutErgebnis } from '@/lib/auth/globales-sign-out'

export type GlobalesAbmeldenAktion = (
  vorher: GlobalesSignOutErgebnis | null,
  formular: FormData,
) => Promise<GlobalesSignOutErgebnis>

type Props = {
  action: GlobalesAbmeldenAktion
  className?: string
  fehlerClassName?: string
  children: React.ReactNode
}

const ANFANG: GlobalesSignOutErgebnis | null = null

/**
 * Kleines Formular für das allgemeine/admin Abmelden.
 * Success navigiert die Server Action selbst. Ein Fehler bleibt hier
 * sichtbar, retrybar und ohne Rohtexte der Auth-Authority.
 * Übergeordnete Menüs werden nicht aus dem Fehlerzustand gesteuert.
 */
export default function GlobalesAbmeldenForm({
  action,
  className,
  fehlerClassName,
  children,
}: Props) {
  const [zustand, formAction, pending] = useActionState(action, ANFANG)
  const fehlerId = React.useId()
  const fehler = zustand && !zustand.ok ? zustand.fehler : null

  return (
    <form
      action={formAction}
      className={className}
      data-abmelden-lage={pending ? 'working' : fehler ? 'error' : 'idle'}
    >
      {children}
      {fehler ? (
        <p
          id={fehlerId}
          role="alert"
          aria-live="assertive"
          className={cn('mt-1 text-sm text-destructive', fehlerClassName)}
        >
          {fehler.text}
        </p>
      ) : null}
    </form>
  )
}
