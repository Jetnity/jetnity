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
  // The browser owns the live Supabase session/cookie store and must also
  // receive SIGNED_OUT; a server-only revoke can succeed while its persistent
  // browser client still restores a stale session on the next navigation.
  // Try the same GLOBAL revocation in the browser first. A successful result
  // requires both remote confirmation and getSession() === null. Keep the
  // existing server Action as a second authority if the browser attempt fails.
  const execute = React.useCallback(async (vorher: GlobalesSignOutErgebnis | null, formular: FormData) => {
    try {
      const placeholder: GlobalesSignOutErgebnis = {
        ok: false,
        fehler: { code: 'failed', text: 'Die Abmeldung konnte nicht bestätigt werden.' },
      }
      const browser = await signOutBrowserFallback(placeholder, createBrowserClient().auth, ziel,
        path => window.location.replace(path))
      if (browser.ok) return browser
    } catch { /* Browser client unavailable; the existing Server Action remains safe. */ }
    return action(vorher, formular)
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
