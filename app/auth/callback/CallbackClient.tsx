// app/auth/callback/CallbackClient.tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { schliesseAuthCallbackAb } from '@/lib/auth/callback-abschluss'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

const WEITERLEITUNG_MS = 600

export default function CallbackClient() {
  const router = useRouter()
  const [state, setState] = React.useState<'processing' | 'ok' | 'error'>('processing')
  const [message, setMessage] = React.useState<string>('Authentifiziere…')

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

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center text-center">
      {state === 'processing' && (
        <>
          <Loader2 className="h-6 w-6 animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </>
      )}

      {state === 'ok' && (
        <>
          <CheckCircle2 className="h-6 w-6 mb-3 text-emerald-600" />
          <p className="text-sm">Erfolgreich angemeldet – weiterleiten …</p>
        </>
      )}

      {state === 'error' && (
        <>
          <AlertTriangle className="h-6 w-6 text-destructive mb-3" />
          <p className="text-sm text-destructive">{message}</p>
        </>
      )}
    </div>
  )
}
