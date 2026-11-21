'use client'

import * as React from 'react'
import { useActionState } from 'react'

import { cn } from '@/lib/utils'
import { createBrowserClient } from '@/lib/supabase/client'
import { signOutBrowserFallback } from '@/lib/auth/globales-sign-out-browser'
import type { GlobalesSignOutErgebnis, GlobalesSignOutZiel } from '@/lib/auth/globales-sign-out'

export type GlobalesAbmeldenAktion = (
  vorher: GlobalesSignOutErgebnis | null,
  formular: FormData,
) => Promise<GlobalesSignOutErgebnis>

type Props = {
  action: GlobalesAbmeldenAktion
  className?: string
  fehlerClassName?: string
  /** Hard-coded public or admin destination; never read from request/query. */
  ziel?: GlobalesSignOutZiel
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
  ziel = '/',
  children,
}: Props) {
  // Keep the established server Action as the first authority. If it reports
  // failure, retry once with the *browser's own* existing authenticated
  // session. The browser uses the same unscoped/global logout, never a
  // local-only best-effort logout that could wrongly promise revocation.
  const execute = React.useCallback(async (vorher: GlobalesSignOutErgebnis | null, formular: FormData) => {
    const result = await action(vorher, formular)
    if (result.ok) return result // server action handles redirect itself
    try {
      return await signOutBrowserFallback(result, createBrowserClient().auth, ziel,
        path => window.location.replace(path))
    } catch {
      return result
    }
  }, [action, ziel])
  const [zustand, formAction, pending] = useActionState(execute, ANFANG)
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
