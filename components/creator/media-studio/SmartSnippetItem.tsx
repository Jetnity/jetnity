// components/creator/media-studio/SmartSnippetItem.tsx
'use client'

import * as React from 'react'
import { Copy, Check, MoreVertical, Pencil, Trash2, Share2 } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

export type SnippetType = 'text' | 'idea' | 'hashtag' | 'cta' | 'script' | 'note'

type Props = {
  content: string
  type?: SnippetType
  createdAt?: string | Date
  /** Anzahl angezeigter Zeilen im kompakten Zustand (CSS line-clamp, siehe globals.css). */
  maxLines?: number
  /** Fallback, falls du kein line-clamp willst – dann wird über Zeichen begrenzt. */
  maxChars?: number
  /** Optional: Aktionen ein-/ausblenden */
  allowCopy?: boolean
  allowShare?: boolean
  /** Callbacks (optional) */
  onCopy?: (text: string) => void
  onEdit?: () => void
  onDelete?: () => void
  onShare?: (text: string) => void
  className?: string
}

export default function SmartSnippetItem({
  content,
  type = 'text',
  createdAt,
  maxLines = 6,
  maxChars = 140,
  allowCopy = true,
  allowShare = true,
  onCopy,
  onEdit,
  onDelete,
  onShare,
  className,
}: Props) {
  const [expanded, setExpanded] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const createdLabel = React.useMemo(() => {
    if (!createdAt) return ''
    const d = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
    return Number.isNaN(+d) ? '' : d.toLocaleDateString('de-DE')
  }, [createdAt])

  const badgeCls = typeBadge(type)

  const visibleText = React.useMemo(() => {
    if (expanded) return content
    if (maxLines && maxLines > 0) return content // per CSS line-clamp
    // Fallback: Zeichenweise kürzen
    return content.length > maxChars ? `${content.slice(0, maxChars)} …` : content
  }, [content, expanded, maxLines, maxChars])

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      onCopy?.(content)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = content
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        onCopy?.(content)
        setTimeout(() => setCopied(false), 1200)
      } finally {
        document.body.removeChild(ta)
      }
    }
  }

  return (
    <article
      className={cn(
        'rounded-lg border bg-card p-4 shadow-sm transition hover:shadow-md',
        className
      )}
    >
      {/* Kopfzeile */}
      <header className="mb-2 flex items-center justify-between gap-2">
        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', badgeCls)}>
          {type}
        </span>
        <div className="flex items-center gap-2">
          {createdLabel && <time className="text-xs text-muted-foreground">{createdLabel}</time>}
          {(onEdit || onDelete) && (
            <div className="relative">
              {/* Simple inline actions; ersetze gern durch Dropdown */}
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                  title="Bearbeiten"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                  title="Löschen"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {!onEdit && !onDelete && (
                <button
                  type="button"
                  className="rounded-md border p-1 text-xs hover:bg-accent"
                  title="Mehr"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Inhalt */}
      <p
        className={cn(
          'text-sm text-foreground whitespace-pre-wrap',
          !expanded && maxLines > 0 && 'smart-snippet--clamp'
        )}
        style={!expanded && maxLines > 0 ? ({ ['--snippet-lines' as any]: String(maxLines) } as React.CSSProperties) : undefined}
      >
        {visibleText}
      </p>

      {/* Aktionen */}
      <footer className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {allowCopy && (
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
              title="In Zwischenablage kopieren"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Kopiert' : 'Kopieren'}
            </button>
          )}
          {allowShare && (
            <button
              type="button"
              onClick={() => onShare?.(content)}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
              title="Teilen"
              disabled={!onShare}
            >
              <Share2 className="h-3.5 w-3.5" /> Teilen
            </button>
          )}
        </div>

        {content.length > maxChars && (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
          </button>
        )}
      </footer>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function typeBadge(t: SnippetType) {
  switch (t) {
    case 'idea':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-200/20 dark:text-amber-200'
    case 'hashtag':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-200/20 dark:text-sky-200'
    case 'cta':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-200/20 dark:text-emerald-200'
    case 'script':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-200/20 dark:text-purple-200'
    case 'note':
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-200/20 dark:text-zinc-200'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

