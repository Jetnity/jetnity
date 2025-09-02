// components/feed/FeedCardActions.tsx
'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Share2,
  Link as LinkIcon,
  Flag,
} from 'lucide-react'

type Props = {
  sessionId: string
  title: string
  href?: string
  size?: 'sm' | 'md'
  className?: string
}

function sizeCls(size: 'sm' | 'md') {
  return size === 'sm'
    ? 'h-9 w-9 [&_svg]:h-4 [&_svg]:w-4'
    : 'h-10 w-10 [&_svg]:h-5 [&_svg]:w-5'
}

export default function FeedCardActions({
  sessionId,
  title,
  href,
  size = 'md',
  className,
}: Props) {
  const [open, setOpen] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [saved, setSaved] = React.useState<boolean | null>(null)

  const finalHref = href || `/story/${sessionId}`
  const wrapRef = React.useRef<HTMLDivElement | null>(null)
  const btnRef = React.useRef<HTMLButtonElement | null>(null)

  // Status initial laden
  React.useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const r = await fetch(`/api/sessions/${sessionId}/save`, { method: 'GET', cache: 'no-store' })
        if (!alive) return
        if (r.status === 401) { setSaved(false); return }
        const j = await r.json()
        setSaved(Boolean(j?.saved))
      } catch {
        setSaved(false)
      }
    })()
    return () => { alive = false }
  }, [sessionId])

  // Outside-Click / Escape
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    function onClick(e: MouseEvent) {
      if (!open) return
      const t = e.target as Node
      if (wrapRef.current && !wrapRef.current.contains(t) && btnRef.current && !btnRef.current.contains(t)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick, true)
    }
  }, [open])

  async function toggleSave() {
    try {
      setBusy(true)
      const r = await fetch(`/api/sessions/${sessionId}/save`, { method: 'POST' })
      if (r.status === 401) { toast.error('Bitte einloggen, um zu speichern.'); return }
      if (!r.ok) throw new Error(await r.text())
      const j = await r.json()
      setSaved(Boolean(j?.saved))
      toast.success(j?.saved ? 'Gespeichert' : 'Entfernt')
    } catch {
      toast.error('Konnte nicht gespeichert werden.')
    } finally {
      setBusy(false)
    }
  }

  async function nativeShare() {
    try {
      const nav = typeof window !== 'undefined' ? (window.navigator as any) : null
      if (nav?.share) {
        await nav.share({ title, url: finalHref })
        return
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(finalHref)
        toast.success('Link kopiert!')
        return
      }
      // Fallback
      window.prompt('Zum Kopieren (Strg/Cmd+C):', finalHref)
    } catch {
      window.prompt('Zum Kopieren (Strg/Cmd+C):', finalHref)
    }
  }

  async function copyLink() {
    try {
      const nav = typeof window !== 'undefined' ? (window.navigator as any) : null
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(finalHref)
        toast.success('Link kopiert!')
        return
      }
      window.prompt('Zum Kopieren (Strg/Cmd+C):', finalHref)
    } catch {
      window.prompt('Zum Kopieren (Strg/Cmd+C):', finalHref)
    }
  }

  return (
    <div className={cn('relative inline-flex items-center gap-1', className)} ref={wrapRef}>
      {/* Save */}
      <button
        type="button"
        onClick={toggleSave}
        disabled={busy || saved === null}
        aria-pressed={!!saved}
        title={saved ? 'Gespeichert' : 'Merken'}
        className={cn(
          'rounded-full border border-border bg-card shadow-sm hover:bg-muted/50 transition grid place-items-center',
          sizeCls(size),
          saved ? 'ring-2 ring-primary/40' : ''
        )}
      >
        {saved ? <BookmarkCheck /> : <Bookmark />}
      </button>

      {/* Share */}
      <button
        type="button"
        onClick={nativeShare}
        title="Teilen"
        className={cn(
          'rounded-full border border-border bg-card shadow-sm hover:bg-muted/50 transition grid place-items-center',
          sizeCls(size)
        )}
      >
        <Share2 />
      </button>

      {/* Menu */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Weitere Aktionen"
        className={cn(
          'rounded-full border border-border bg-card shadow-sm hover:bg-muted/50 transition grid place-items-center',
          sizeCls(size)
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <MoreHorizontal />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          className="absolute right-0 top-[120%] z-[100] w-56 rounded-2xl border border-border bg-card p-2 shadow-e3"
        >
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted/50"
          >
            <LinkIcon className="h-4 w-4" /> Link kopieren
          </button>
          <a
            href={`mailto:support@jetnity.com?subject=Story melden: ${encodeURIComponent(title)}&body=${encodeURIComponent(finalHref)}`}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted/50"
          >
            <Flag className="h-4 w-4" /> Melden
          </a>
        </div>
      )}
    </div>
  )
}
