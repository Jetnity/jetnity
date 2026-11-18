'use client'

import * as React from 'react'

import { PasskeySignIn } from '@/components/auth/PasskeySignIn'
import { passkeyHandlungErlaubt, passkeySdkVorhanden } from '@/lib/auth/passkey-faehigkeit'
import { passkeyAnmeldungAusfuehren } from '@/lib/auth/passkey-port'
import { passkeyFehlerSchluessel } from '@/lib/auth/passkey-meldungen'
import type { SicherheitTextSchluessel } from '@/lib/localization/account-security-texte'

function gateVon(auth: unknown, serverAktiviert: boolean) {
  return {
    serverAktiviert,
    sdkVorhanden: passkeySdkVorhanden(auth),
    browserWebAuthn: typeof window !== 'undefined' && 'PublicKeyCredential' in window,
    origin: typeof window === 'undefined' ? null : window.location.origin,
  }
}

export default function PasskeyAnmeldung({
  serverAktiviert,
  auth,
  onStepUp,
  onWeiter,
}: {
  serverAktiviert: boolean
  auth: unknown
  onStepUp: () => Promise<void>
  onWeiter: () => void
}) {
  const bereit = React.useSyncExternalStore(
    () => () => undefined,
    () => passkeyHandlungErlaubt(gateVon(auth, serverAktiviert)),
    () => false,
  )
  const [meldung, setMeldung] = React.useState<SicherheitTextSchluessel | null>(null)
  const [beschaeftigt, setBeschaeftigt] = React.useState(false)

  async function anmelden() {
    if (beschaeftigt) return
    setBeschaeftigt(true)
    setMeldung(null)
    const ergebnis = await passkeyAnmeldungAusfuehren(auth, gateVon(auth, serverAktiviert))
    if (ergebnis.art === 'totp_step_up') {
      try {
        await onStepUp()
      } catch {
        setMeldung('passkey.error.aal')
      } finally {
        setBeschaeftigt(false)
      }
      return
    }
    setBeschaeftigt(false)
    if (ergebnis.art === 'weiter') {
      onWeiter()
      return
    }
    if (ergebnis.art === 'geschlossen') {
      setMeldung('passkey.login.closed')
      return
    }
    setMeldung(passkeyFehlerSchluessel(ergebnis.code))
  }

  return (
    <PasskeySignIn
      bereit={bereit}
      meldung={meldung}
      beschaeftigt={beschaeftigt}
      onAnmelden={() => void anmelden()}
    />
  )
}
