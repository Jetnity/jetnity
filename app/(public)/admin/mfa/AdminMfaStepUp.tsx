'use client'

import * as React from 'react'
import Link from 'next/link'
import { Loader2, ShieldCheck } from 'lucide-react'

import { MFATotpDialog } from '@/components/auth/MFATotpDialog'
import { supabase } from '@/lib/supabase/client'
import { starteTotpChallengeAnzeige } from '@/lib/auth/mfa'
import { ADMIN_MFA_EINRICHTUNG } from '@/lib/auth/admin-aal'
import { bestaetigeAdminAal2Action } from './actions'
import { statusAktionHaupt, statusAktionNeben, statusFussLink } from '@/components/ui/statuskarte'
import { cn } from '@/lib/utils'

export function AdminMfaStepUp({
  ziel,
  lookupFailed,
}: {
  ziel: string
  lookupFailed: boolean
}) {
  const [mfaOpen, setMfaOpen] = React.useState(false)
  const [factorId, setFactorId] = React.useState('')
  const [challengeId, setChallengeId] = React.useState('')
  const [keinFaktor, setKeinFaktor] = React.useState(false)
  const [error, setError] = React.useState<string | null>(
    lookupFailed ? 'Die Berechtigung konnte gerade nicht geprüft werden. Bitte später erneut versuchen.' : null,
  )
  const [busy, setBusy] = React.useState(!lookupFailed)

  React.useEffect(() => {
    if (lookupFailed) return

    let abgebrochen = false
    setBusy(true)
    void starteTotpChallengeAnzeige(supabase)
      .then((anzeige) => {
        if (abgebrochen) return
        if (anzeige.art === 'dialog') {
          setFactorId(anzeige.factorId)
          setChallengeId(anzeige.challengeId)
          setMfaOpen(true)
          setKeinFaktor(false)
          setError(null)
          return
        }
        if (anzeige.art === 'setup') {
          setKeinFaktor(true)
          setError(null)
          return
        }
        setError(anzeige.meldung)
      })
      .finally(() => {
        if (!abgebrochen) setBusy(false)
      })

    return () => {
      abgebrochen = true
    }
  }, [lookupFailed])

  return (
    <main className="min-h-[70dvh] px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-10">
      <div className="mx-auto w-full max-w-md rounded-panel border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-5 text-kicker uppercase text-muted-foreground">Administration</p>
          <h1 className="mt-2 text-title text-foreground">Zwei-Faktor-Bestätigung</h1>
          <p className="mt-2 text-meta text-muted-foreground">
            Für den Administrationsbereich ist eine aktuelle Zwei-Faktor-Bestätigung nötig.
          </p>
        </div>

        {busy ? (
          <p role="status" className="flex items-center gap-2 text-meta text-muted-foreground">
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
            Prüfung wird vorbereitet…
          </p>
        ) : null}

        {keinFaktor ? (
          <div className="space-y-4 text-body text-foreground">
            <p>
              Für diesen Zugang fehlt ein bestätigter Authenticator. Richte TOTP zuerst unter
              Konto → Sicherheit ein. Ohne bestätigten zweiten Faktor bleibt der Administrationsbereich
              geschlossen.
            </p>
            <Link className={statusAktionHaupt} href={ADMIN_MFA_EINRICHTUNG}>
              TOTP unter Sicherheit einrichten
            </Link>
          </div>
        ) : null}

        {error ? <p role="alert" className="text-meta text-destructive">{error}</p> : null}

        {!busy && !keinFaktor && !lookupFailed ? (
          <button
            type="button"
            className={cn(statusAktionNeben, 'mt-4 w-full')}
            onClick={() => {
              setBusy(true)
              setError(null)
              void starteTotpChallengeAnzeige(supabase)
                .then((anzeige) => {
                  if (anzeige.art === 'dialog') {
                    setFactorId(anzeige.factorId)
                    setChallengeId(anzeige.challengeId)
                    setMfaOpen(true)
                    return
                  }
                  if (anzeige.art === 'setup') {
                    setKeinFaktor(true)
                    return
                  }
                  setError(anzeige.meldung)
                })
                .finally(() => setBusy(false))
            }}
          >
            Code erneut anfordern
          </button>
        ) : null}

        <p className="mt-6 border-t border-border pt-4 text-meta">
          <Link href="/admin/login" className={cn(statusFussLink, '-mx-2')}>
            Zur Admin-Anmeldung
          </Link>
        </p>
      </div>

      <MFATotpDialog
        open={mfaOpen}
        onClose={() => setMfaOpen(false)}
        supabase={supabase}
        factorId={factorId}
        challengeId={challengeId}
        onVerified={() => {
          setMfaOpen(false)
          void bestaetigeAdminAal2Action(ziel).then((ergebnis) => {
            if (ergebnis?.error) setError(ergebnis.error)
          })
        }}
      />
    </main>
  )
}
