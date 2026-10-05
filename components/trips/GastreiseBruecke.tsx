'use client'

// components/trips/GastreiseBruecke.tsx
//
// Die Anzeige zur Übernahme eines Gastentwurfs ins Konto.
//
// Der Vorgang selbst steht in `lib/trips/uebernahme.ts` – dort ist er ohne
// Browser prüfbar. Diese Datei löst ihn aus und erzählt, was passiert ist.
//
// ---------------------------------------------------------------------------
// Warum sie auf /reisen steht und nicht in den Anmeldeformularen
// ---------------------------------------------------------------------------
//
// Es gibt fünf Wege in eine angemeldete Sitzung: Login mit Passwort, Login mit
// zweitem Faktor, Registrierung, OAuth über `/auth/callback` und die Rücksetzung
// des Passworts. Alle fünf enden auf /reisen. Die Übernahme dort einmal zu bauen
// ist fünf Stellen weniger, an denen sie fehlen kann – und sie greift zusätzlich
// in Fällen, in denen keine dieser Stellen beteiligt war: eine Sitzung, die in
// einem anderen Tab entstanden ist, oder ein Versuch, der beim letzten Mal
// gescheitert ist.

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, Loader2, RefreshCw } from 'lucide-react'

import { readinessUebernehmen } from '@/lib/readiness/aktionen'
import { partyUebernehmen } from '@/lib/readiness/reisende-aktionen'
import { gastreiseUebernehmen } from '@/lib/trips/aktionen'
import { gastreisenUebernehmen, type Uebernahmebericht } from '@/lib/trips/uebernahme'

export type GastreiseBrueckenStand =
  | { art: 'ruht' }
  | { art: 'laeuft'; anzahl: number }
  | { art: 'fertig'; anzahl: number }
  | { art: 'fehler'; meldung: string; offen: number }
  | { art: 'ungueltig' }
  | { art: 'speicher_unlesbar' }

export const GASTREISE_BRUECKE_TEXTE = {
  ungueltigHaupt:
    'Dein Entwurf in diesem Browser konnte nicht übernommen werden. Der Eintrag ist kein gültiger Reiseentwurf.',
  ungueltigNeben: 'Dieser Versuch hat den Entwurf nicht verändert.',
  speicherHaupt: 'Der Browserspeicher konnte nicht gelesen werden.',
  speicherNeben: 'Ob ein Entwurf vorhanden ist, konnte nicht geprüft werden.',
  fehlerNeben: 'Der Entwurf liegt weiter in diesem Browser und ist nicht verloren.',
  erneut: 'Erneut versuchen',
} as const

export type GastreiseBrueckenKopie = {
  sichtbar: boolean
  rolle: 'alert' | 'status' | null
  ton: 'neutral' | 'gut' | 'schlecht'
  haupt: string
  neben: string | null
  erneut: boolean
}

/** Maps the adoption report onto the bridge stand. `nichts` stays silent. */
export function gastreiseBrueckeStandAusBericht(
  bericht: Uebernahmebericht,
): GastreiseBrueckenStand {
  if (bericht.art === 'nichts' || bericht.art === 'laeuft') return { art: 'ruht' }
  if (bericht.art === 'ungueltig') return { art: 'ungueltig' }
  if (bericht.art === 'speicher_unlesbar') return { art: 'speicher_unlesbar' }
  if (bericht.art === 'fehler') {
    return { art: 'fehler', meldung: bericht.meldung, offen: bericht.offen }
  }
  return { art: 'fertig', anzahl: bericht.uebernommen }
}

/** Pure copy/accessibility contract for the rendered bridge states. */
export function gastreiseBrueckeKopie(stand: GastreiseBrueckenStand): GastreiseBrueckenKopie {
  if (stand.art === 'ruht') {
    return {
      sichtbar: false,
      rolle: null,
      ton: 'neutral',
      haupt: '',
      neben: null,
      erneut: false,
    }
  }

  if (stand.art === 'laeuft') {
    return {
      sichtbar: true,
      rolle: 'status',
      ton: 'neutral',
      haupt:
        stand.anzahl === 1
          ? 'Deine Reise wird in dein Konto übernommen …'
          : `${stand.anzahl} Reisen werden in dein Konto übernommen …`,
      neben: null,
      erneut: false,
    }
  }

  if (stand.art === 'fertig') {
    return {
      sichtbar: true,
      rolle: 'status',
      ton: 'gut',
      haupt:
        stand.anzahl === 1
          ? 'Deine Reise liegt jetzt in deinem Konto und ist auf allen Geräten sichtbar.'
          : `${stand.anzahl} Reisen liegen jetzt in deinem Konto und sind auf allen Geräten sichtbar.`,
      neben: null,
      erneut: false,
    }
  }

  if (stand.art === 'ungueltig') {
    return {
      sichtbar: true,
      rolle: 'alert',
      ton: 'schlecht',
      haupt: GASTREISE_BRUECKE_TEXTE.ungueltigHaupt,
      neben: GASTREISE_BRUECKE_TEXTE.ungueltigNeben,
      erneut: true,
    }
  }

  if (stand.art === 'speicher_unlesbar') {
    return {
      sichtbar: true,
      rolle: 'alert',
      ton: 'schlecht',
      haupt: GASTREISE_BRUECKE_TEXTE.speicherHaupt,
      neben: GASTREISE_BRUECKE_TEXTE.speicherNeben,
      erneut: true,
    }
  }

  return {
    sichtbar: true,
    rolle: 'alert',
    ton: 'schlecht',
    haupt:
      stand.offen === 1
        ? `Deine Reise konnte nicht übernommen werden. ${stand.meldung}`
        : `${stand.offen} Reisen konnten nicht übernommen werden. ${stand.meldung}`,
    neben: GASTREISE_BRUECKE_TEXTE.fehlerNeben,
    erneut: true,
  }
}

export default function GastreiseBruecke() {
  const router = useRouter()
  const [stand, setStand] = React.useState<GastreiseBrueckenStand>({ art: 'ruht' })

  const uebernehmen = React.useCallback(async () => {
    const bericht = await gastreisenUebernehmen(
      gastreiseUebernehmen,
      (anzahl) => setStand({ art: 'laeuft', anzahl }),
      async (tripId, items) => {
        const ergebnis = await readinessUebernehmen({ tripId, items })
        return ergebnis.ok ? { ok: true, wert: tripId } : ergebnis
      },
      async (tripId, party) => {
        const ergebnis = await partyUebernehmen({
          tripId,
          party: party.map((eintrag) => ({
            clientRef: eintrag.clientRef,
            label: eintrag.label,
            residenceCountryCode: eintrag.residenceCountryCode,
            citizenships: eintrag.citizenships.map((citizenship) => ({
              clientRef: citizenship.clientRef,
              countryCode: citizenship.countryCode,
            })),
            documents: eintrag.documents.map((document) => ({
              clientRef: document.clientRef,
              documentType: document.documentType,
              issuingCountryCode: document.issuingCountryCode,
              expiresOn: document.expiresOn,
              citizenshipClientRef: document.citizenshipClientRef,
            })),
          })),
        })
        return ergebnis.ok ? { ok: true, wert: tripId } : ergebnis
      },
    )

    const naechster = gastreiseBrueckeStandAusBericht(bericht)
    setStand(naechster)

    if (bericht.art === 'fertig') {
      router.refresh()
      return
    }

    if (bericht.art === 'fehler' && bericht.uebernommen > 0) {
      router.refresh()
    }
  }, [router])

  React.useEffect(() => {
    void uebernehmen()
  }, [uebernehmen])

  return <GastreiseBrueckenAnzeige stand={stand} onErneut={() => void uebernehmen()} />
}

export function GastreiseBrueckenAnzeige({
  stand,
  onErneut,
}: {
  stand: GastreiseBrueckenStand
  onErneut?: () => void
}) {
  const kopie = gastreiseBrueckeKopie(stand)
  if (!kopie.sichtbar) return null

  return (
    <Hinweis ton={kopie.ton} rolle={kopie.rolle} symbol={symbolFuer(stand)}>
      <span className="block">{kopie.haupt}</span>
      {kopie.neben ? <span className="mt-1 block text-xs">{kopie.neben}</span> : null}
      {kopie.erneut ? (
        <button
          type="button"
          onClick={onErneut}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-current px-4 text-sm font-semibold"
        >
          <RefreshCw className="h-4 w-4" />
          {GASTREISE_BRUECKE_TEXTE.erneut}
        </button>
      ) : null}
    </Hinweis>
  )
}

function symbolFuer(stand: GastreiseBrueckenStand) {
  if (stand.art === 'laeuft') return <Loader2 className="h-4 w-4 animate-spin" />
  if (stand.art === 'fertig') return <Check className="h-4 w-4" />
  return <AlertCircle className="h-4 w-4" />
}

const TON = {
  neutral: 'border-line-200 bg-white text-ink-800',
  gut: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  schlecht: 'border-red-200 bg-red-50 text-red-700',
} as const

function Hinweis({
  ton,
  rolle,
  symbol,
  children,
}: {
  ton: keyof typeof TON
  rolle: 'alert' | 'status' | null
  symbol: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      role={rolle ?? undefined}
      className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${TON[ton]}`}
    >
      <span className="mt-0.5 shrink-0">{symbol}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}
