// app/auth/callback/CallbackClient.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { schliesseAuthCallbackAb } from '@/lib/auth/callback-abschluss'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

import { Statuskarte, statusAktionHaupt, statusFussLink } from '@/components/ui/statuskarte'

const WEITERLEITUNG_MS = 600

export default function CallbackClient() {
  const router = useRouter()
  const [state, setState] = React.useState<'processing' | 'ok' | 'error'>('processing')
  const [message, setMessage] = React.useState<string>('Einen Moment, bitte.')

  React.useEffect(() => {
    let cancelled = false
    let timer: number | undefined

    const finish = (nextState: 'ok' | 'error', msg: string, redirectTo?: string) => {
      if (cancelled) return
      setState(nextState)
      setMessage(msg)
      if (nextState === 'ok' && redirectTo) {
        timer = window.setTimeout(() => {
          if (!cancelled) router.replace(redirectTo)
        }, WEITERLEITUNG_MS)
      }
    }

    void (async () => {
      const ergebnis = await schliesseAuthCallbackAb({
        suche: window.location.search,
        hash: window.location.hash,
        cookieHeader: document.cookie,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        hrefLesen: () => window.location.href,
        adresseSchreiben: (href) => {
          window.history.replaceState(window.history.state, '', href)
        },
        client: () => supabase,
      })
      if (ergebnis.art === 'ok') {
        finish('ok', 'Erfolgreich angemeldet.', ergebnis.ziel)
        return
      }
      finish('error', ergebnis.meldung)
    })()

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [router])

  if (state === 'processing') {
    return (
      <Statuskarte symbol={Loader2} ton="laedt" titel="Anmeldung wird abgeschlossen" data-anmeldung-abschluss="laedt">
        <p role="status">{message}</p>
      </Statuskarte>
    )
  }

  if (state === 'ok') {
    return (
      <Statuskarte symbol={CheckCircle2} titel="Erfolgreich angemeldet" data-anmeldung-abschluss="ok">
        <p role="status">Du wirst weitergeleitet …</p>
      </Statuskarte>
    )
  }

  return (
    <Statuskarte
      symbol={AlertTriangle}
      ton="fehler"
      titel="Anmeldung nicht abgeschlossen"
      data-anmeldung-abschluss="fehler"
      aktionen={
        <Link href="/login" className={statusAktionHaupt}>
          Zur Anmeldung
        </Link>
      }
      fuss={
        <Link href="/" className={statusFussLink}>
          Zur Startseite
        </Link>
      }
    >
      <p role="alert">{message}</p>
    </Statuskarte>
  )
}
