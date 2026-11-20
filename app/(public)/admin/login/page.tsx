'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { CheckCircle2, KeyRound, Mail } from 'lucide-react'
import type { AuthState } from './actions'
import { signInWithPasswordAction, sendMagicLinkAction } from './actions'
import { signOutToAdminLoginAction } from '@/app/auth/sign-out'
import GlobalesAbmeldenForm from '@/components/auth/GlobalesAbmeldenForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SubmitBtn({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'outline' }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant={variant} isLoading={pending} loadingText="Bitte warten…" className="w-full">
      {children}
    </Button>
  )
}

const INITIAL: AuthState = {}

export default function AdminLoginPage() {
  const [pwState, pwAction]   = useActionState<AuthState, FormData>(signInWithPasswordAction, INITIAL)
  const [otpState, otpAction] = useActionState<AuthState, FormData>(sendMagicLinkAction, INITIAL)

  const magicSent = Boolean(otpState?.ok && otpState?.magicSent)

  return (
    <main className="min-h-[70dvh] px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-10">
      <div className="mx-auto w-full max-w-md rounded-panel border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-6">
          <p className="text-kicker uppercase text-muted-foreground">Administration</p>
          <h1 className="mt-2 text-title text-foreground">Jetnity Admin – Anmeldung</h1>
          <p className="mt-2 text-meta text-muted-foreground">Zugriff nur für freigegebene Konten.</p>
        </div>

        {/* Passwort-Login */}
        <form action={pwAction} className="space-y-4" aria-label="Passwort Anmeldung">
          <div className="space-y-2">
            <Label htmlFor="admin-login-email" icon={<Mail className="h-4 w-4" />}>E-Mail</Label>
            <Input
              id="admin-login-email"
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-login-passwort" icon={<KeyRound className="h-4 w-4" />}>Passwort</Label>
            <Input
              id="admin-login-passwort"
              type="password"
              name="password"
              required
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {pwState?.error && <p role="alert" className="text-meta text-destructive">{pwState.error}</p>}

          <SubmitBtn>Anmelden</SubmitBtn>
        </form>

        <div className="my-6 flex items-center gap-3 text-meta text-muted-foreground">
          <span className="h-px w-full bg-border" />
          oder
          <span className="h-px w-full bg-border" />
        </div>

        {/* Magic-Link-Login */}
        <form action={otpAction} className="space-y-4" aria-label="Magic Link anfordern">
          <div className="space-y-2">
            <Label htmlFor="admin-magic-email" icon={<Mail className="h-4 w-4" />}>E-Mail</Label>
            <Input
              id="admin-magic-email"
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          {otpState?.error && <p role="alert" className="text-meta text-destructive">{otpState.error}</p>}
          {magicSent && (
            <div role="status" className="flex items-start gap-2 rounded-card border border-primary/40 bg-card px-4 py-3 text-meta text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p>Magic Link gesendet. Bitte E-Mail prüfen.</p>
            </div>
          )}

          <SubmitBtn variant="outline">Magic Link senden</SubmitBtn>
        </form>

        <GlobalesAbmeldenForm action={signOutToAdminLoginAction} className="mt-6 border-t border-border pt-4">
          <button type="submit" className="inline-flex min-h-11 items-center rounded-control text-meta text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Abmelden (falls angemeldet)
          </button>
        </GlobalesAbmeldenForm>
      </div>
    </main>
  )
}
