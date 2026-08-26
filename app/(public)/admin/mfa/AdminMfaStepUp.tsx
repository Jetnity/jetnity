'use client'

import * as React from 'react'
import Link from 'next/link'

import { MFATotpDialog } from '@/components/auth/MFATotpDialog'
import { supabase } from '@/lib/supabase/client'
import { startTotpChallenge } from '@/lib/auth/mfa'
import {
  ADMIN_MFA_EINRICHTUNG,
  istKeinTotpFaktorFehler,
} from '@/lib/auth/admin-aal'
import { bestaetigeAdminAal2Action } from './actions'

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
    void startTotpChallenge(supabase)
      .then(({ factorId: faktor, challengeId: herausforderung }) => {
        if (abgebrochen) return
        setFactorId(faktor)
        setChallengeId(herausforderung)
        setMfaOpen(true)
        setKeinFaktor(false)
        setError(null)
      })
      .catch((err: unknown) => {
        if (abgebrochen) return
        if (istKeinTotpFaktorFehler(err)) {
          setKeinFaktor(true)
          setError(null)
          return
        }
        setError(err instanceof Error ? err.message : 'Die Zwei-Faktor-Prüfung konnte nicht gestartet werden.')
      })
      .finally(() => {
        if (!abgebrochen) setBusy(false)
      })

    return () => {
      abgebrochen = true
    }
  }, [lookupFailed])

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold">Zwei-Faktor-Bestätigung</h1>
          <p className="text-sm text-muted-foreground">
            Für den Administrationsbereich ist eine aktuelle Zwei-Faktor-Bestätigung nötig.
          </p>
        </div>

        {busy ? <p className="text-sm text-muted-foreground">Prüfung wird vorbereitet…</p> : null}

        {keinFaktor ? (
          <div className="space-y-3 text-sm">
            <p>
              Für diesen Zugang fehlt ein bestätigter Authenticator. Richte TOTP zuerst unter
              Konto → Sicherheit ein. Ohne bestätigten zweiten Faktor bleibt der Administrationsbereich
              geschlossen.
            </p>
            <Link className="inline-flex min-h-11 items-center underline" href={ADMIN_MFA_EINRICHTUNG}>
              TOTP unter Sicherheit einrichten
            </Link>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!busy && !keinFaktor && !lookupFailed ? (
          <button
            type="button"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-muted"
            onClick={() => {
              setBusy(true)
              setError(null)
              void startTotpChallenge(supabase)
                .then(({ factorId: faktor, challengeId: herausforderung }) => {
                  setFactorId(faktor)
                  setChallengeId(herausforderung)
                  setMfaOpen(true)
                })
                .catch((err: unknown) => {
                  if (istKeinTotpFaktorFehler(err)) {
                    setKeinFaktor(true)
                    return
                  }
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'Die Zwei-Faktor-Prüfung konnte nicht gestartet werden.',
                  )
                })
                .finally(() => setBusy(false))
            }}
          >
            Code erneut anfordern
          </button>
        ) : null}

        <p className="mt-6 text-xs text-muted-foreground">
          <Link href="/admin/login" className="underline underline-offset-4">
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
