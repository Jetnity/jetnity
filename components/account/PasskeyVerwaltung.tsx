'use client'

import * as React from 'react'

import { PasskeyManagement, type PasskeyVerwaltungAnsicht } from '@/components/account/PasskeyManagement'
import { passkeyHandlungErlaubt, passkeyKontoBestaetigt, passkeySdkVorhanden } from '@/lib/auth/passkey-faehigkeit'
import { passkeyFehlerSchluessel } from '@/lib/auth/passkey-meldungen'
import {
  passkeyAuflisten,
  passkeyEntfernen,
  passkeyRegistrieren,
  passkeyUmbenennen,
  type PasskeyAuthSchnittstelle,
  type PasskeyListeErgebnis,
} from '@/lib/auth/passkey-port'
import type { UiSprache } from '@/lib/localization/ui-sprache'

function gateVon(auth: unknown, serverAktiviert: boolean) {
  return {
    serverAktiviert,
    sdkVorhanden: passkeySdkVorhanden(auth),
    browserWebAuthn: typeof window !== 'undefined' && 'PublicKeyCredential' in window,
    origin: typeof window === 'undefined' ? null : window.location.origin,
  }
}

const ANFANG: PasskeyVerwaltungAnsicht = {
  liste: { art: 'laden' },
  kontoBestaetigt: false,
  meldung: null,
  beschaeftigt: false,
  entfernenFuer: null,
  umbenennenFuer: null,
  nameEntwurf: '',
}

export default function PasskeyVerwaltung({
  sprache,
  serverAktiviert,
  auth,
}: {
  sprache: UiSprache
  serverAktiviert: boolean
  auth: unknown
}) {
  const [ansicht, setAnsicht] = React.useState<PasskeyVerwaltungAnsicht>(ANFANG)

  const laden = React.useCallback(async () => {
    await Promise.resolve()
    const gate = gateVon(auth, serverAktiviert)
    if (!passkeyHandlungErlaubt(gate)) {
      setAnsicht((aktuell) => ({ ...aktuell, liste: { art: 'geschlossen', grund: 'server_aus' }, kontoBestaetigt: false }))
      return
    }
    const client = auth as PasskeyAuthSchnittstelle
    const [nutzer, liste] = await Promise.all([
      typeof client.getUser === 'function' ? client.getUser() : Promise.resolve({ data: null, error: { code: 'passkey_method_missing' } }),
      passkeyAuflisten(auth, gate),
    ])
    setAnsicht((aktuell) => ({
      ...aktuell,
      liste,
      kontoBestaetigt: !nutzer.error && passkeyKontoBestaetigt(nutzer.data?.user),
      entfernenFuer: null,
      umbenennenFuer: null,
      nameEntwurf: '',
    }))
  }, [auth, serverAktiviert])

  React.useEffect(() => {
    // Erst nach dem Commit laden. Der erste Frame bleibt der ehrliche Ladezustand.
    const timer = window.setTimeout(() => {
      void laden()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [laden])

  async function registrieren() {
    setAnsicht((aktuell) => ({ ...aktuell, beschaeftigt: true, meldung: null }))
    const ergebnis = await passkeyRegistrieren(auth, gateVon(auth, serverAktiviert))
    if (!ergebnis.ok) {
      setAnsicht((aktuell) => ({ ...aktuell, beschaeftigt: false, meldung: passkeyFehlerSchluessel(ergebnis.code) }))
      return
    }
    await laden()
    setAnsicht((aktuell) => ({ ...aktuell, beschaeftigt: false, meldung: null }))
  }

  async function speichern() {
    const id = ansicht.umbenennenFuer
    const ids = idsAus(ansicht.liste)
    if (!id) return
    setAnsicht((aktuell) => ({ ...aktuell, beschaeftigt: true, meldung: null }))
    const ergebnis = await passkeyUmbenennen(auth, gateVon(auth, serverAktiviert), {
      id,
      name: ansicht.nameEntwurf,
      gelisteteIds: ids,
    })
    if (!ergebnis.ok) {
      setAnsicht((aktuell) => ({ ...aktuell, beschaeftigt: false, meldung: passkeyFehlerSchluessel(ergebnis.code) }))
      return
    }
    await laden()
    setAnsicht((aktuell) => ({ ...aktuell, beschaeftigt: false, meldung: null }))
  }

  async function entfernen() {
    const id = ansicht.entfernenFuer
    if (!id) return
    setAnsicht((aktuell) => ({ ...aktuell, beschaeftigt: true, meldung: null }))
    const ergebnis = await passkeyEntfernen(auth, gateVon(auth, serverAktiviert), {
      id,
      gelisteteIds: idsAus(ansicht.liste),
      bestaetigt: true,
      kontoBestaetigt: ansicht.kontoBestaetigt,
    })
    if (!ergebnis.ok) {
      setAnsicht((aktuell) => ({ ...aktuell, beschaeftigt: false, meldung: passkeyFehlerSchluessel(ergebnis.code) }))
      return
    }
    await laden()
    setAnsicht((aktuell) => ({ ...aktuell, beschaeftigt: false, meldung: null }))
  }

  return (
    <PasskeyManagement
      sprache={sprache}
      ansicht={ansicht}
      onRegistrieren={() => void registrieren()}
      onUmbenennenStart={(id, name) =>
        setAnsicht((aktuell) => ({ ...aktuell, umbenennenFuer: id, entfernenFuer: null, nameEntwurf: name, meldung: null }))
      }
      onName={(wert) => setAnsicht((aktuell) => ({ ...aktuell, nameEntwurf: wert }))}
      onUmbenennenSpeichern={() => void speichern()}
      onUmbenennenAbbrechen={() => setAnsicht((aktuell) => ({ ...aktuell, umbenennenFuer: null, nameEntwurf: '' }))}
      onEntfernenStart={(id) =>
        setAnsicht((aktuell) => ({ ...aktuell, entfernenFuer: id, umbenennenFuer: null, meldung: null }))
      }
      onEntfernenBestaetigen={() => void entfernen()}
      onEntfernenAbbrechen={() => setAnsicht((aktuell) => ({ ...aktuell, entfernenFuer: null }))}
    />
  )
}

function idsAus(liste: PasskeyListeErgebnis | { art: 'laden' }): string[] {
  return liste.art === 'liste' ? liste.eintraege.map((eintrag) => eintrag.id) : []
}
