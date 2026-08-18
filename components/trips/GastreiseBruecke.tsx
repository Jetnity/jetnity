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

import { gastreiseUebernehmen } from '@/lib/trips/aktionen'
import { gastreisenUebernehmen } from '@/lib/trips/uebernahme'

type Stand =
  | { art: 'ruht' }
  | { art: 'laeuft'; anzahl: number }
  | { art: 'fertig'; anzahl: number }
  | { art: 'fehler'; meldung: string; offen: number }

export default function GastreiseBruecke() {
  const router = useRouter()
  const [stand, setStand] = React.useState<Stand>({ art: 'ruht' })

  const uebernehmen = React.useCallback(async () => {
    const bericht = await gastreisenUebernehmen(gastreiseUebernehmen, (anzahl) =>
      setStand({ art: 'laeuft', anzahl }),
    )

    if (bericht.art === 'nichts' || bericht.art === 'laeuft') {
      setStand({ art: 'ruht' })
      return
    }

    if (bericht.art === 'fehler') {
      setStand({ art: 'fehler', meldung: bericht.meldung, offen: bericht.offen })
      // Ein Teilerfolg ist sichtbar zu machen: Die Liste dahinter zeigt sonst
      // eine Reise nicht, die längst im Konto liegt.
      if (bericht.uebernommen > 0) router.refresh()
      return
    }

    setStand({ art: 'fertig', anzahl: bericht.uebernommen })
    router.refresh()
  }, [router])

  React.useEffect(() => {
    void uebernehmen()
  }, [uebernehmen])

  if (stand.art === 'ruht') return null

  if (stand.art === 'laeuft') {
    return (
      <Hinweis ton="neutral" symbol={<Loader2 className="h-4 w-4 animate-spin" />}>
        {stand.anzahl === 1
          ? 'Deine Reise wird in dein Konto übernommen …'
          : `${stand.anzahl} Reisen werden in dein Konto übernommen …`}
      </Hinweis>
    )
  }

  if (stand.art === 'fertig') {
    return (
      <Hinweis ton="gut" symbol={<Check className="h-4 w-4" />}>
        {stand.anzahl === 1
          ? 'Deine Reise liegt jetzt in deinem Konto und ist auf allen Geräten sichtbar.'
          : `${stand.anzahl} Reisen liegen jetzt in deinem Konto und sind auf allen Geräten sichtbar.`}
      </Hinweis>
    )
  }

  return (
    <Hinweis ton="schlecht" symbol={<AlertCircle className="h-4 w-4" />}>
      <span className="block">
        {stand.offen === 1
          ? 'Deine Reise konnte nicht übernommen werden.'
          : `${stand.offen} Reisen konnten nicht übernommen werden.`}{' '}
        {stand.meldung}
      </span>
      <span className="mt-1 block text-xs">
        Der Entwurf liegt weiter in diesem Browser und ist nicht verloren.
      </span>
      <button
        type="button"
        onClick={() => void uebernehmen()}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-current px-4 text-sm font-semibold"
      >
        <RefreshCw className="h-4 w-4" />
        Erneut versuchen
      </button>
    </Hinweis>
  )
}

const TON = {
  neutral: 'border-line-200 bg-white text-ink-800',
  gut: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  schlecht: 'border-red-200 bg-red-50 text-red-700',
} as const

function Hinweis({
  ton,
  symbol,
  children,
}: {
  ton: keyof typeof TON
  symbol: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      role={ton === 'schlecht' ? 'alert' : 'status'}
      className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${TON[ton]}`}
    >
      <span className="mt-0.5 shrink-0">{symbol}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}
