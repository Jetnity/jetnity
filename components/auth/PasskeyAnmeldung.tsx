'use client'

import * as React from 'react'

import { PasskeySignIn } from '@/components/auth/PasskeySignIn'
import { passkeyHandlungErlaubt, passkeySdkVorhanden } from '@/lib/auth/passkey-faehigkeit'
import { passkeyAnmeldungAusfuehren } from '@/lib/auth/passkey-port'
import { passkeyFehlerSchluessel } from '@/lib/auth/passkey-meldungen'
import type { SicherheitTextSchluessel } from '@/lib/localization/account-security-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

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
  sprache = 'de',
  onStepUp,
  onWeiter,
  onSitzungBeenden,
}: {
  serverAktiviert: boolean
  auth: unknown
  sprache?: UiSprache
  onStepUp: () => Promise<void>
  onWeiter: () => void
  onSitzungBeenden: () => Promise<{ beendet: boolean }>
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
        const ende = await onSitzungBeenden()
        if (ende.beendet) setMeldung('passkey.error.aal')
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
    if (ergebnis.art === 'fehler') {
      const ende = await onSitzungBeenden()
      if (!ende.beendet) return
    }
    setMeldung(passkeyFehlerSchluessel(ergebnis.art === 'geschlossen' ? 'geschlossen' : ergebnis.code))
  }

  return (
    <PasskeySignIn
      sprache={sprache}
      bereit={bereit}
      meldung={bereit ? meldung : null}
      beschaeftigt={beschaeftigt}
      onAnmelden={() => void anmelden()}
    />
  )
}
