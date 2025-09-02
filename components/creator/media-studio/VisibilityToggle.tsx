// components/creator/media-studio/VisibilityToggle.tsx
'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { updateSessionVisibility } from '@/lib/supabase/actions'
import { cn } from '@/lib/utils'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Globe2, Lock, Loader2, Copy, Check, ExternalLink } from 'lucide-react'

type Visibility = 'private' | 'public'

type Props = {
  sessionId: string
  currentVisibility: Visibility
  className?: string
  onChanged?: (next: Visibility) => void
}

export default function VisibilityToggle({
  sessionId,
  currentVisibility,
  className,
  onChanged,
}: Props) {
  const router = useRouter()
  const [visibility, setVisibility] = React.useState<Visibility>(currentVisibility)
  const [isPending, startTransition] = React.useTransition()
  const [copied, setCopied] = React.useState(false)
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  // Falls sich die Prop (SSR/Refresh) ändert, State synchron halten
  React.useEffect(() => setVisibility(currentVisibility), [currentVisibility])

  const isPublic = visibility === 'public'

  const origin =
    (typeof window !== 'undefined' && window.location?.origin) ||
    (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? '')

  const publicUrl = React.useMemo(() => {
    const base = origin || ''
    const path = `/story/${encodeURIComponent(sessionId)}`
    return base ? `${base}${path}` : path
  }, [origin, sessionId])

  const doUpdate = (next: Visibility) => {
    const prev = visibility
    setVisibility(next) // optimistic

    startTransition(() => {
      ;(async () => {
        try {
          const res = await updateSessionVisibility(sessionId, next)
          // Empfohlenes Rückgabeformat: { ok: boolean, error?: string }
          const ok = (res as any)?.ok !== false
          if (!ok) throw new Error((res as any)?.error || 'Update fehlgeschlagen')

          router.refresh()
          onChanged?.(next)
          toast.success(
            next === 'public'
              ? 'Die Session ist jetzt öffentlich.'
              : 'Die Session ist jetzt privat.'
          )
        } catch (e: any) {
          setVisibility(prev) // revert
          toast.error(e?.message || 'Sichtbarkeit konnte nicht aktualisiert werden.')
        }
      })()
    })
  }

  const toggle = () => {
    const next: Visibility = isPublic ? 'private' : 'public'
    if (next === 'public') {
      // Sicherstellen, dass der User bewusst zustimmt
      setConfirmOpen(true)
      return
    }
    doUpdate(next)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
      toast.success('Öffentlicher Link kopiert.')
    } catch {
      toast.error('Konnte Link nicht kopieren.')
    }
  }

  return (
    <TooltipProvider delayDuration={250}>
      <div className={cn('flex flex-wrap items-center gap-3', className)}>
        <span className="text-sm text-muted-foreground">Sichtbarkeit:</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-pressed={isPublic}
              aria-label={isPublic ? 'Öffentlich' : 'Privat'}
              variant={isPublic ? 'outline' : 'default'}
              onClick={toggle}
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPublic ? (
                <Globe2 className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {isPublic ? 'Öffentlich' : 'Privat'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isPublic
              ? 'Jeder mit dem Link kann die Story sehen.'
              : 'Nur du (und freigegebene Nutzer) können die Story sehen.'}
          </TooltipContent>
        </Tooltip>

        {/* Wenn öffentlich: Link zeigen, öffnen & kopieren */}
        {isPublic && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
              className="gap-1.5"
            >
              <ExternalLink className="h-4 w-4" />
              Öffnen
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={copyLink}
              className="gap-1.5"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Link kopieren
            </Button>
            <span className="text-xs text-muted-foreground select-all hidden sm:inline">
              {publicUrl}
            </span>
          </div>
        )}

        {/* Bestätigungsdialog für Öffentlich-Schalten */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>{/* wird programmgesteuert geöffnet */}</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Session öffentlich machen?</AlertDialogTitle>
              <AlertDialogDescription>
                Jeder mit dem Link kann diese Story sehen. Du kannst das jederzeit wieder auf <em>Privat</em> stellen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending} onClick={() => setConfirmOpen(false)}>
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={() => {
                  setConfirmOpen(false)
                  doUpdate('public')
                }}
              >
                Ja, veröffentlichen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
