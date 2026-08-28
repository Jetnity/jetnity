'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import type { AuthState } from './actions'
import { signInWithPasswordAction, sendMagicLinkAction } from './actions'
import { signOutToAdminLoginAction } from '@/app/auth/sign-out'

function SubmitBtn({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-muted disabled:opacity-60 pointer-fine:min-h-0"
    >
      {pending ? 'Bitte warten…' : children}
    </button>
  )
}

const INITIAL: AuthState = {}

export default function AdminLoginPage() {
  const [pwState, pwAction]   = useActionState<AuthState, FormData>(signInWithPasswordAction, INITIAL)
  const [otpState, otpAction] = useActionState<AuthState, FormData>(sendMagicLinkAction, INITIAL)

  const magicSent = Boolean(otpState?.ok && otpState?.magicSent)

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold">Jetnity Admin – Anmeldung</h1>
          <p className="text-sm text-muted-foreground">Zugriff nur für freigegebene Konten.</p>
        </div>

        {/* Passwort-Login */}
        <form action={pwAction} className="space-y-3" aria-label="Passwort Anmeldung">
          <label className="block text-sm">
            <span className="text-foreground/80">E-Mail</span>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-base pointer-fine:text-sm"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label className="block text-sm">
            <span className="text-foreground/80">Passwort</span>
            <input
              type="password"
              name="password"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-base pointer-fine:text-sm"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {pwState?.error && <p className="text-sm text-destructive">{pwState.error}</p>}

          <div className="mt-2">
            <SubmitBtn>Anmelden</SubmitBtn>
          </div>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px w-full bg-border" />
          oder
          <span className="h-px w-full bg-border" />
        </div>

        {/* Magic-Link-Login */}
        <form action={otpAction} className="space-y-3" aria-label="Magic Link anfordern">
          <label className="block text-sm">
            <span className="text-foreground/80">E-Mail</span>
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-base pointer-fine:text-sm"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          {otpState?.error && <p className="text-sm text-destructive">{otpState.error}</p>}
          {magicSent && <p className="text-sm text-emerald-600">Magic Link gesendet. Bitte E-Mail prüfen.</p>}

          <div className="mt-2">
            <SubmitBtn>Magic Link senden</SubmitBtn>
          </div>
        </form>

        <form action={signOutToAdminLoginAction} className="mt-6">
          <button type="submit" className="inline-flex min-h-11 items-center text-xs text-muted-foreground underline underline-offset-4 pointer-fine:min-h-0">
            Abmelden (falls angemeldet)
          </button>
        </form>
      </div>
    </main>
  )
}
