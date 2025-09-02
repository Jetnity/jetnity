// app/auth/callback/CallbackClient.tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

export default function CallbackClient() {
  const router = useRouter()
  const [state, setState] = React.useState<'processing' | 'ok' | 'error'>('processing')
  const [message, setMessage] = React.useState<string>('Authentifiziere…')

  React.useEffect(() => {
    let cancelled = false

    const finish = (nextState: 'ok' | 'error', msg: string, redirectTo?: string) => {
      if (cancelled) return
      setState(nextState)
      setMessage(msg)
      if (nextState === 'ok' && redirectTo) {
        // kleine Verzögerung für UI-Feedback
        setTimeout(() => router.replace(redirectTo), 600)
      }
    }

    ;(async () => {
      try {
        // 1) Prüfe Magic-Link / Recovery (Token im Hash-Fragment #access_token=…)
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        if (hash?.startsWith('#')) {
          const params = new URLSearchParams(hash.substring(1))
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          const type = params.get('type') // z.B. 'recovery'
          const error_description = params.get('error_description')

          if (error_description) {
            return finish('error', error_description)
          }

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token })
            if (error) throw error

            const redirect = type === 'recovery'
              ? '/auth/update-password'
              : '/creator/creator-dashboard'
            return finish('ok', 'Erfolgreich angemeldet.', redirect)
          }
        }

        // 2) OAuth Code Flow (?code=…)
        const qs = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
        const code = qs?.get('code')
        const oauthError = qs?.get('error') || qs?.get('error_description')
        if (oauthError) {
          return finish('error', String(oauthError))
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          return finish('ok', 'Erfolgreich angemeldet.', '/creator/creator-dashboard')
        }

        // 3) Fallback: gibt es bereits eine Session?
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (data.session) {
          return finish('ok', 'Erfolgreich angemeldet.', '/creator/creator-dashboard')
        }

        // Nichts gefunden → Fehler
        return finish('error', 'Ungültiger Callback: Kein Token/Code gefunden.')
      } catch (e: any) {
        return finish('error', e?.message ?? 'Anmeldung fehlgeschlagen.')
      }
    })()

    return () => {
      cancelled = true
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
