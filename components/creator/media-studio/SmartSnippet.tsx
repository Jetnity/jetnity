// components/creator/media-studio/SmartSnippet.tsx
'use client'

import * as React from 'react'
import { Clipboard, Check, ChevronDown, ChevronUp, FilePlus2, Share2 } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type Props = {
  /** Rohtext des Snippets. Tokens wie {{name}} werden ersetzt. */
  text: string
  /** Optionaler Titel links über dem Snippet. */
  label?: string
  /** Text- oder Code-Block Darstellung. */
  variant?: 'text' | 'code'
  /** Für Code-Highlighter (z. B. Prism): className="language-xyz". */
  language?: string
  /** Maximal angezeigte Zeilen vor "Mehr anzeigen". */
  maxLines?: number
  /** Vorbelegte Token-Werte. */
  vars?: Record<string, string>
  /** Wenn gesetzt, wird neben "Kopieren" ein "Einfügen" Button angezeigt. */
  onUse?: (finalText: string) => void
  /** Zusätzliche Klassen für das Wrapper-<li> oder <div>. */
  className?: string
}

export default function SmartSnippet({
  text,
  label,
  variant = 'text',
  language,
  maxLines = 6,
  vars,
  onUse,
  className,
}: Props) {
  const tokenNames = React.useMemo(() => {
    const set = new Set<string>()
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g
    for (const m of text.matchAll(re)) set.add(m[1])
    return Array.from(set)
  }, [text])

  const [fills, setFills] = React.useState<Record<string, string>>(() => ({ ...(vars || {}) }))
  const [expanded, setExpanded] = React.useState(false)
  const [copied, setCopied] = React.useState<'idle' | 'ok' | 'err'>('idle')

  const finalText = React.useMemo(() => interpolate(text, fills), [text, fills])

  async function copyToClipboard() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(finalText)
      } else {
        // Fallback ohne Permissions
        const ta = document.createElement('textarea')
        ta.value = finalText
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied('ok')
      setTimeout(() => setCopied('idle'), 1400)
    } catch {
      setCopied('err')
      setTimeout(() => setCopied('idle'), 1400)
    }
  }

  const canShare = typeof navigator !== 'undefined' && !!(navigator as any).share
  async function share() {
    try {
      await (navigator as any).share({ text: finalText })
    } catch {}
  }

  return (
    <div className={cn('rounded-xl border bg-background/60 p-3', className)}>
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          {label && <div className="truncate text-xs font-medium text-muted-foreground">{label}</div>}
          {tokenNames.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {tokenNames.map((t) => (
                <TokenChip key={t} name={t} value={fills[t]} onChange={(v) => setFills((s) => ({ ...s, [t]: v }))} />
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onUse && (
            <button
              type="button"
              onClick={() => onUse(finalText)}
              className="inline-flex items-center gap-1 rounded-md border bg-white/70 px-2 py-1 text-xs hover:bg-white"
              title="In Editor einsetzen"
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              Einfügen
            </button>
          )}
          <button
            type="button"
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
            title="In Zwischenablage kopieren"
          >
            {copied === 'ok' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clipboard className="h-3.5 w-3.5" />}
            {copied === 'ok' ? 'Kopiert' : copied === 'err' ? 'Fehler' : 'Kopieren'}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
              title="System-Share"
            >
              <Share2 className="h-3.5 w-3.5" />
              Teilen
            </button>
          )}
          {isClamped(finalText, maxLines) && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-accent"
              aria-expanded={expanded}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? 'Weniger' : 'Mehr'}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {variant === 'code' ? (
        <pre
          className={cn(
            'rounded-lg border bg-muted/40 p-3 text-xs leading-5 whitespace-pre-wrap',
            !expanded && lineClampClass(maxLines)
          )}
        >
          <code className={language ? `language-${language}` : undefined}>{finalText}</code>
        </pre>
      ) : (
        <div
          className={cn(
            'rounded-lg border bg-muted/30 p-3 text-sm leading-6 whitespace-pre-wrap',
            !expanded && lineClampClass(maxLines)
          )}
        >
          {finalText}
        </div>
      )}
    </div>
  )
}

/* ---------- kleine Helfer ---------- */

function interpolate(template: string, map: Record<string, string> = {}) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => (map[k] ?? `{{${k}}}`))
}

function lineClampClass(lines: number) {
  // Tailwind-unabhängige Clamping-Utility
  const clamp = {
    display: 'block',
    overflow: 'hidden',
    WebkitBoxOrient: 'vertical' as const,
    WebkitLineClamp: String(lines),
  }
  // Wir geben hier eine Class zurück, die via inline style ergänzt wird -> vereinfachen:
  return 'smart-snippet--clamp'
}

function isClamped(text: string, maxLines: number) {
  // simple Heuristik: mehr als maxLines Zeilen?
  const lines = text.split(/\r?\n/).length
  return lines > maxLines
}

function TokenChip({
  name,
  value,
  onChange,
}: {
  name: string
  value?: string
  onChange: (v: string) => void
}) {
  return (
    <label className="inline-flex items-center gap-1 rounded-full border bg-white/70 px-2 py-0.5 text-[11px]">
      <span className="font-medium text-muted-foreground">{name}</span>
      <input
        className="w-24 rounded border px-1 py-0.5 text-[11px] outline-none focus:ring-2 focus:ring-primary/30"
        placeholder="Wert…"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
