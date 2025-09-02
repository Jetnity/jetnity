'use client'

import * as React from 'react'
import Link from 'next/link'
import { Compass, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { buttonVariants } from '@/components/ui/button'

export type CopilotSuggestion = {
  title: string
  description?: string
  action?: { type?: 'link' | 'external'; href: string; label?: string }
  priority?: number
}

export default function CreatorDashboardWelcome({
  suggestions,
  className,
}: {
  suggestions: CopilotSuggestion[]
  className?: string
}) {
  const items =
    Array.isArray(suggestions) ? [...suggestions].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).slice(0, 6) : []

  return (
    <Card
      className={cn(
        // sehr kompakt, professionell, dezenter Look
        'border-border/70 shadow-sm overflow-hidden',
        'bg-gradient-to-br from-primary/5 via-background to-background',
        className
      )}
    >
      {/* Kopfzeile – klein & sachlich */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md border bg-background text-primary">
            <Compass className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">Copilot – Empfehlungen</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Kuratierte Next-Steps für deinen Creator-Flow
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Liste der Vorschläge – kompakte Rows */}
      <ul className="divide-y">
        {items.length === 0 ? (
          <li className="px-4 py-6 sm:px-5">
            <p className="text-sm text-muted-foreground">
              Noch keine Vorschläge. Starte eine Session oder vervollständige dein Profil.
            </p>
          </li>
        ) : (
          items.map((s, i) => (
            <SuggestionRow key={`${s.title}-${i}`} suggestion={s} />
          ))
        )}
      </ul>
    </Card>
  )
}

/* ---------- Subkomponente ---------- */

function SuggestionRow({ suggestion }: { suggestion: CopilotSuggestion }) {
  const href = suggestion.action?.href ?? '#'
  const isExternal = suggestion.action?.type === 'external'

  return (
    <li>
      <Link
        href={href}
        {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
        className={cn(
          'group block px-4 py-3 sm:px-5 sm:py-3.5 transition',
          'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <div className="flex items-start gap-3">
          {/* kleiner Bullet */}
          <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary/70" />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h4 className="truncate text-sm font-medium leading-5">
                {suggestion.title}
              </h4>

              <span
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'h-7 px-2 text-xs gap-1 shrink-0 text-primary hover:text-primary'
                )}
              >
                {suggestion.action?.label ?? 'Öffnen'}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>

            {suggestion.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {suggestion.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    </li>
  )
}
