'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createDraftSession } from '@/lib/supabase/actions/session'
import { Button } from '@/components/ui/button'
import { Loader2, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Destination = 'media-studio' | 'creator-dashboard'

type Props = {
  to?: Destination
  /** Button-Text */
  label?: string
  /** Zusätzliche Klassen */
  className?: string
  /** Button-Variant gem. deiner Button-Komponente (z.B. primary/secondary/...) */
  variant?: string
  /** Button-Größe gem. deiner Button-Komponente */
  size?: string
  /** Vollbreite */
  fullWidth?: boolean
  /** Optionaler Callback bei Erfolg */
  onStarted?: (sessionId: string) => void
  /** Optional: zusätzliche Tracking-Infos */
  tracking?: { source?: string; campaign?: string }
  /** Deaktivieren */
  disabled?: boolean
}

export default function StartSessionCTA({
  to = 'media-studio',
  label = 'Jetzt Session starten',
  className,
  variant = 'primary',
  size,
  fullWidth = true,
  onStarted,
  tracking,
  disabled,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const inFlight = React.useRef(false)

  // Zielrouten für Prefetch & Navigation
  const baseTarget = to === 'media-studio' ? '/creator/media-studio' : '/creator/creator-dashboard'

  // Prefetch verbessert „snappiness“
  React.useEffect(() => {
    try {
      router.prefetch(baseTarget)
    } catch {
      // prefetch ist best-effort
    }
  }, [router, baseTarget])

  const handleClick = React.useCallback(() => {
    if (inFlight.current || isPending || disabled) return
    inFlight.current = true

    startTransition(async () => {
      try {
        // Idempotency-Key (falls Server-Action ihn nutzt – Extra-Args sind in JS unkritisch)
        const idempotencyKey =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`

        // Versuche erst mit optionalem Objekt (falls unterstützt), sonst ohne
        let res: any
        try {
          res = await (createDraftSession as any)({ idempotencyKey, tracking })
        } catch {
          res = await (createDraftSession as any)()
        }

        const sessionId = res?.sessionId ?? res?.data?.sessionId
        if (!sessionId || typeof sessionId !== 'string') {
          throw new Error('Unerwartete Server-Antwort (keine sessionId).')
        }

        onStarted?.(sessionId)

        const target = `${baseTarget}?session=${encodeURIComponent(sessionId)}&new=1`
        router.push(target)
      } catch (e: any) {
        const msg = String(e?.message || e) || 'Konnte Session nicht starten'
        // Auth-Fehler: zur Anmeldung lotsen
        if (/not authenticated|unauthorized|401/i.test(msg)) {
          const next = encodeURIComponent(baseTarget)
          router.push(`/auth/sign-in?next=${next}`)
          toast.message('Bitte anmelden', { description: 'Melde dich an, um eine Session zu starten.' })
        } else {
          toast.error('Fehler beim Starten der Session', { description: msg })
        }
      } finally {
        inFlight.current = false
      }
    })
  }, [baseTarget, disabled, isPending, onStarted, tracking, router])

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      variant={variant as any}
      size={size as any}
      className={cn(fullWidth && 'w-full', 'rounded-xl font-semibold shadow', className)}
      aria-busy={isPending || undefined}
      aria-live="polite"
      data-tracking-source={tracking?.source}
      data-tracking-campaign={tracking?.campaign}
    >
      {isPending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Wird erstellt…
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <PlayCircle className="h-4 w-4" aria-hidden />
          {label}
        </span>
      )}
      {/* SR-only Status für Screenreader */}
      <span className="sr-only" aria-live="assertive">
        {isPending ? 'Session wird erstellt' : 'Session starten'}
      </span>
    </Button>
  )
}
