'use client'

// components/trips/GastreiseBruecke.tsx
//
// Die Brücke von „Entwurf im Browser" nach „Reise im Konto".
//
// ---------------------------------------------------------------------------
// Warum sie auf /reisen steht und nicht in den Anmeldeformularen
// ---------------------------------------------------------------------------
//
// Es gibt vier Wege in eine angemeldete Sitzung: Login mit Passwort, Login mit
// zweitem Faktor, Registrierung und OAuth über `/auth/callback`. Alle vier
// enden auf /reisen. Die Übernahme dort einmal zu bauen ist vier Stellen
// weniger, an denen sie fehlen kann – und sie greift zusätzlich in Fällen, in
// denen keine dieser vier Stellen beteiligt war: eine Sitzung, die in einem
// anderen Tab entstanden ist, oder ein Versuch, der beim letzten Mal
// gescheitert ist.
//
// ---------------------------------------------------------------------------
// Warum ein zweiter Durchlauf nichts kaputt macht
// ---------------------------------------------------------------------------
//
// `public.reise_anlegen()` ist über `unique (user_id, client_ref)` idempotent:
// Dieselbe Gastreise ergibt pro Konto genau eine Reise. Ein Reload, ein
// doppelter Request, ein zweiter Login und zwei offene Tabs führen deshalb zum
// selben Ergebnis. Die Brücke darf laufen, sooft sie will.
//
// Der Browser räumt einen Entwurf erst weg, nachdem der Server die Kennung der
// Reise gemeldet hat – je Entwurf einzeln. Alles auf einmal zu löschen wäre die
// Annahme, es habe alles geklappt; und ein Entwurf, der nach einem Abbruch
// gelöscht ist, ohne im Konto zu liegen, ist verlorene Arbeit.

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, Loader2, RefreshCw } from 'lucide-react'

import { gastreiseUebernehmen } from '@/lib/trips/aktionen'
import { alsNutzlast } from '@/lib/trips/abbildung'
import { uebernommenStreichen, zurUebernahme } from '@/lib/trips/gastspeicher'

type Stand =
  | { art: 'ruht' }
  | { art: 'laeuft'; anzahl: number }
  | { art: 'fertig'; anzahl: number }
  | { art: 'fehler'; meldung: string; offen: number }

export default function GastreiseBruecke() {
  const router = useRouter()
  const [stand, setStand] = React.useState<Stand>({ art: 'ruht' })

  // Verhindert einen zweiten gleichzeitigen Durchlauf. Nicht aus Sorge um die
  // Datenbank – die Übernahme ist idempotent –, sondern weil zwei Durchläufe
  // sich beim Aufräumen des Browserspeichers gegenseitig die Liste unter den
  // Füssen wegziehen würden.
  const laeuft = React.useRef(false)

  const uebernehmen = React.useCallback(async () => {
    if (laeuft.current) return
    const entwuerfe = zurUebernahme()
    if (entwuerfe.length === 0) return

    laeuft.current = true
    setStand({ art: 'laeuft', anzahl: entwuerfe.length })

    let uebernommen = 0

    for (const entwurf of entwuerfe) {
      const ergebnis = await gastreiseUebernehmen(alsNutzlast(entwurf))

      if (!ergebnis.ok) {
        laeuft.current = false
        setStand({
          art: 'fehler',
          meldung: ergebnis.meldung,
          offen: entwuerfe.length - uebernommen,
        })
        // Abbrechen und nicht weiterlaufen: Ist der Grund die Sitzung oder die
        // Erreichbarkeit der Datenbank, scheitert jeder weitere Entwurf
        // genauso. Der Browserspeicher bleibt, wie er ist.
        if (uebernommen > 0) router.refresh()
        return
      }

      uebernommen += 1
      uebernommenStreichen(entwurf.clientRef ?? entwurf.id)
    }

    laeuft.current = false
    setStand({ art: 'fertig', anzahl: uebernommen })
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
