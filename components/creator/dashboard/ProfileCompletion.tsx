'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  User,
  Type,
  AtSign,
  FileText,
  UploadCloud,
  Share2,
  Globe,
  Info,
} from 'lucide-react'
import type { Tables } from '@/types/supabase'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type Profile = Tables<'creator_profiles'> & { facebook?: string | null }
type SectionKey = 'name' | 'username' | 'bio' | 'avatar' | 'socials' | 'website'

export interface ProfileCompletionProps {
  profile: Profile | null
  minBioLen?: number
  requireWebsite?: boolean
  requireAnySocial?: boolean
  onNavigate?: (section: SectionKey) => void
  anchors?: Partial<Record<SectionKey, string>>
  /** erzwingt Kompaktmodus (sonst automatisch bei schmalen Breiten) */
  compact?: boolean
  className?: string
}

/* ——— Utility: Element-Breite messen (für Container-Adaptivität) ——— */
function useElementWidth<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null)
  const [w, setW] = React.useState(0)
  React.useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export default function ProfileCompletion({
  profile,
  minBioLen = 40,
  requireWebsite = true,
  requireAnySocial = true,
  onNavigate,
  anchors,
  compact,
  className,
}: ProfileCompletionProps) {
  if (!profile) return null

  const [rootRef, width] = useElementWidth<HTMLDivElement>()
  const isNarrow = width > 0 && width < 380
  const isVeryNarrow = width > 0 && width < 320
  const autoCompact = compact ?? isNarrow

  const hasText = (s?: string | null) => !!s && s.trim().length > 0
  const isValidUsername = (u?: string | null) =>
    !!u && /^[a-z0-9._-]{3,30}$/i.test(u.trim())
  const isLikelyUrl = (u?: string | null) => {
    if (!u) return false
    const t = u.trim()
    try {
      const url = new URL(t.startsWith('http') ? t : `https://${t}`)
      return !!url.hostname && url.hostname.includes('.')
    } catch {
      return false
    }
  }

  const socialsCount =
    Number(Boolean(hasText(profile.instagram))) +
    Number(Boolean(hasText(profile.tiktok))) +
    Number(Boolean(hasText(profile.youtube))) +
    Number(Boolean(hasText(profile.twitter))) +
    Number(Boolean(hasText((profile as any).facebook)))

  const triggerAvatarPicker = () => {
    const el =
      (document.querySelector('input[type="file"][title="Avatar ändern"]') as HTMLInputElement | null) ??
      (document.querySelector('#avatar-input') as HTMLInputElement | null)
    el?.click()
    if (!el && anchors?.avatar) scrollToAnchor('avatar')
  }

  const scrollToAnchor = (section: SectionKey) => {
    const id = anchors?.[section]
    if (!id) return
    if (id.startsWith('#')) {
      document.querySelector(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      window.location.href = id
    }
  }

  const go = (section: SectionKey) => {
    if (section === 'avatar') return triggerAvatarPicker()
    if (onNavigate) onNavigate(section)
    else scrollToAnchor(section)
  }

  type Check = {
    key: SectionKey
    label: string
    tip: string
    actionLabel: string
    ok: boolean
    weight: number
    icon: React.ReactNode
  }

  const baseChecks: Check[] = [
    { key: 'name', label: 'Name', tip: 'Gib deinen vollen Namen an.', actionLabel: 'Name eingeben', ok: hasText(profile.name), weight: 12, icon: <Type className="h-4 w-4" /> },
    { key: 'username', label: 'Benutzername', tip: 'Kurz & eindeutig (3–30 Zeichen).', actionLabel: 'Benutzername wählen', ok: isValidUsername(profile.username), weight: 18, icon: <AtSign className="h-4 w-4" /> },
    { key: 'bio', label: `Bio (≥ ${minBioLen} Zeichen)`, tip: `Erzähle kurz, wer du bist (mind. ${minBioLen} Zeichen).`, actionLabel: 'Bio ergänzen', ok: !!profile.bio && profile.bio.trim().length >= minBioLen, weight: 20, icon: <FileText className="h-4 w-4" /> },
    { key: 'avatar', label: 'Avatar', tip: 'Quadratisches Bild (z. B. 512×512) hochladen.', actionLabel: 'Avatar hochladen', ok: hasText(profile.avatar_url), weight: 20, icon: <UploadCloud className="h-4 w-4" /> },
    { key: 'socials', label: 'Mind. 1 Social', tip: 'Verbinde Instagram, TikTok, YouTube oder X.', actionLabel: 'Social verbinden', ok: socialsCount >= 1 || !requireAnySocial, weight: 18, icon: <Share2 className="h-4 w-4" /> },
    { key: 'website', label: 'Website', tip: 'Füge deine Website hinzu (https://…).', actionLabel: 'Website eintragen', ok: isLikelyUrl(profile.website) || !requireWebsite, weight: 12, icon: <Globe className="h-4 w-4" /> },
  ]

  const active = baseChecks.filter((c) => {
    if (c.key === 'website' && !requireWebsite) return false
    if (c.key === 'socials' && !requireAnySocial) return false
    return true
  })
  const totalWeight = active.reduce((s, c) => s + c.weight, 0)
  const doneWeight = active.reduce((s, c) => s + (c.ok ? c.weight : 0), 0)
  const pct = Math.round((doneWeight / Math.max(1, totalWeight)) * 100)
  const doneCount = active.filter((c) => c.ok).length

  return (
    <section
      ref={rootRef}
      className={cn(
        'w-full rounded-2xl border border-border bg-background/70 p-4 shadow-sm',
        className
      )}
      aria-label="Profil-Vervollständigung"
    >
      {/* Kopf */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
          <h4 className={cn('truncate font-semibold', isVeryNarrow ? 'text-[13px]' : 'text-sm')}>
            Profil-Vervollständigung
          </h4>
          <TooltipProvider delayDuration={120}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 shrink-0 cursor-pointer text-muted-foreground" aria-hidden />
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                <p className="max-w-[260px] text-[13px] leading-snug">
                  Gewichtete Checks ergeben 100 %. Vollständige Profile performen besser in Feeds &amp; Suche.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div
          className={cn('tabular-nums text-muted-foreground', isVeryNarrow ? 'text-[11px]' : 'text-sm')}
          aria-live="polite"
        >
          {pct}% ({doneCount}/{active.length})
        </div>
      </header>

      {/* Progress */}
      <div className={cn('mt-2', isVeryNarrow && 'mt-1')}>
        <Progress value={pct} aria-label={`Profil zu ${pct}% vollständig`} />
      </div>

      {/* Checkliste – Grid-Layout verhindert Überlappungen */}
      <ul
        className={cn(
          'mt-3 grid gap-2',
          // dynamische Spaltenzahl: bei zu wenig Platz 1 Spalte
          isNarrow ? 'grid-cols-1' : 'grid-cols-2'
        )}
        role="list"
      >
        {active.map((c) => {
          const Action = anchors?.[c.key]
            ? (props: React.ComponentProps<'a'>) => (
                <Link
                  {...props}
                  href={anchors![c.key]!}
                  onClick={(e) => {
                    if (anchors![c.key]!.startsWith('#')) {
                      e.preventDefault()
                      scrollToAnchor(c.key)
                    }
                  }}
                />
              )
            : (props: React.ComponentProps<'button'>) => <button {...props} type="button" onClick={() => go(c.key)} />

          return (
            <li
              key={c.key}
              className={cn(
                // 3-Spalten-Grid: Icon | Text | Aktion – stabil auf schmal
                'grid grid-cols-[auto_1fr_auto] items-start gap-x-2 gap-y-1 rounded-lg border px-2.5 py-2',
                c.ok ? 'border-emerald-200/60 dark:border-emerald-900/40' : 'border-border'
              )}
            >
              <div className="mt-0.5">
                {c.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" aria-hidden />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'truncate',
                      c.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground',
                      isVeryNarrow ? 'text-[12px] font-medium' : 'text-sm font-medium'
                    )}
                    title={c.label}
                  >
                    {c.label}
                  </span>
                  {!c.ok && (
                    <span className={cn('text-muted-foreground', isVeryNarrow ? 'text-[10px]' : 'text-[11px]')}>
                      · {c.weight}%
                    </span>
                  )}
                </div>

                {!c.ok && !autoCompact && (
                  <div className="mt-0.5 flex items-start gap-1.5 text-xs leading-tight text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="break-words">{c.tip}</span>
                  </div>
                )}
              </div>

              {!c.ok && (
                <Action
                  className={cn(
                    'shrink-0 rounded-md border px-2 py-1 text-xs hover:bg-muted',
                    // in sehr schmalen Spalten kleinere Buttons
                    isVeryNarrow && 'px-1.5 py-0.5 text-[11px]'
                  )}
                >
                  {c.actionLabel}
                </Action>
              )}
            </li>
          )
        })}
      </ul>

      {!autoCompact && (
        <p className={cn('mt-3 text-[11px] text-muted-foreground', isVeryNarrow && 'mt-2')}>
          Tipp: Ein gutes Profilbild &amp; eine aussagekräftige Bio erhöhen deinen{' '}
          <strong>Impact&nbsp;Score</strong> messbar.
        </p>
      )}
    </section>
  )
}
