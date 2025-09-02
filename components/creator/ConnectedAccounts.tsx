'use client'

import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CheckCircle2, Link2, Loader2, Youtube, Twitter } from 'lucide-react'

type Identity = {
  identity_id: string
  provider: string
}

type Variant = 'auto' | 'cards' | 'chips'

export default function ConnectedAccounts({
  variant = 'auto',
  className,
}: {
  /** 'auto' (empfohlen): schaltet bei schmalen Sidebars auf Chips */
  variant?: Variant
  className?: string
}) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [origin, setOrigin] = useState<string>('')
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState<number>(0)

  // ---- Breite beobachten (für auto-Layout)
  useEffect(() => {
    if (!rootRef.current) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(rootRef.current)
    return () => ro.disconnect()
  }, [])

  const useChips = useMemo(() => {
    if (variant === 'chips') return true
    if (variant === 'cards') return false
    // auto: unter ~380px Chips verwenden (Safari-Engstellen)
    return width > 0 && width < 380
  }, [width, variant])

  const refreshIdentities = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const list: Identity[] = (user?.identities ?? []).map((i: any) => ({
        identity_id: i.identity_id ?? i.id ?? `${i.provider}-unknown`,
        provider: i.provider,
      }))
      setIdentities(list)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '')
    ;(async () => { await refreshIdentities() })()

    const onFocus = () => refreshIdentities()
    const onVis = () => { if (document.visibilityState === 'visible') refreshIdentities() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [refreshIdentities])

  const isConnected = useCallback(
    (p: string) => identities.some(i => i.provider === p),
    [identities]
  )

  const connectGoogle = useCallback(async () => {
    setLoadingKey('google')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'openid email profile https://www.googleapis.com/auth/youtube.readonly',
          redirectTo: `${origin}/creator?connected=google`,
        },
      })
      if (error) throw error
    } catch (e: any) {
      console.error(e)
      toast.error('Google/YouTube-Verbindung fehlgeschlagen')
    } finally {
      setLoadingKey(null)
    }
  }, [origin])

  const connectTwitter = useCallback(async () => {
    setLoadingKey('twitter')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          scopes: 'tweet.read users.read offline.access',
          redirectTo: `${origin}/creator?connected=twitter`,
        },
      })
      if (error) throw error
    } catch (e: any) {
      console.error(e)
      toast.error('X/Twitter-Verbindung fehlgeschlagen')
    } finally {
      setLoadingKey(null)
    }
  }, [origin])

  const items = useMemo(
    () => [
      {
        key: 'google',
        label: 'Google / YouTube',
        icon: <Youtube className="h-4 w-4" />,
        connected: isConnected('google'),
        onConnect: connectGoogle,
      },
      {
        key: 'twitter',
        label: 'X (Twitter)',
        icon: <Twitter className="h-4 w-4" />,
        connected: isConnected('twitter'),
        onConnect: connectTwitter,
      },
    ],
    [connectGoogle, connectTwitter, isConnected]
  )

  return (
    <div ref={rootRef} className={cn('rounded-2xl border bg-background/70 p-4', className)}>
      <h4 className="mb-3 text-sm font-semibold">Verbundene Konten</h4>

      {/* Chips-Layout: perfekt für enge Sidebars */}
      {useChips ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const busy = loadingKey === item.key
            return item.connected ? (
              <span
                key={item.key}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300"
                title={`${item.label} verbunden`}
              >
                {item.icon}
                {item.label}
                <CheckCircle2 className="h-4 w-4" />
              </span>
            ) : (
              <button
                key={item.key}
                onClick={item.onConnect}
                disabled={busy}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs hover:bg-muted',
                  busy && 'opacity-60'
                )}
                aria-label={`${item.label} verbinden`}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {item.icon}
                Verbinden
              </button>
            )
          })}
        </div>
      ) : (
        // Karten-Layout: großzügiger auf breiteren Sidebars
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const busy = loadingKey === item.key
            return (
              <div key={item.key} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="min-w-0 flex-1 truncate">
                  <div className="flex items-center gap-2 truncate">
                    {item.icon}
                    <span className="truncate text-sm">{item.label}</span>
                  </div>
                </div>

                {item.connected ? (
                  <div
                    className="shrink-0 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-emerald-600"
                    title="Bereits verbunden"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">verbunden</span>
                  </div>
                ) : (
                  <button
                    onClick={item.onConnect}
                    disabled={busy}
                    className={cn(
                      'shrink-0 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 hover:bg-muted',
                      busy && 'opacity-60'
                    )}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Verbinden
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-3 break-words text-xs leading-snug text-muted-foreground">
        Hinweis: Instagram &amp; TikTok benötigen eigene OAuth-Apps und werden separat integriert.
      </p>
    </div>
  )
}
