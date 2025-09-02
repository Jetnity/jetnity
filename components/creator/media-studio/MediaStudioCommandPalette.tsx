'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  userId: string
}

/** Command-Palette (⌘K / Ctrl+K) – keine externen Dependencies */
export default function MediaStudioCommandPalette({ userId }: Props) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState('')
  const router = useRouter()

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const actions = React.useMemo(() => ([
    { id: 'new-session', label: 'Neue Session erstellen', run: () => router.push('/creator/media-studio?new=1') },
    { id: 'open-uploads', label: 'Uploads / Galerie öffnen', run: () => router.push('/creator/media-studio#uploads') },
    { id: 'open-analytics', label: 'Creator-Analytics öffnen', run: () => router.push('/creator/analytics') },
    { id: 'open-storybuilder', label: 'Storybuilder öffnen', run: () => router.push('/creator/media-studio?tool=storybuilder') },
    { id: 'open-smart-snippets', label: 'Smart Snippets öffnen', run: () => router.push('/creator/media-studio?tool=snippets') },
    { id: 'open-latest', label: 'Zuletzt bearbeitete Session', run: () => router.push('/creator/media-studio?last=1') },
  ]), [router])

  const filtered = q ? actions.filter(a => a.label.toLowerCase().includes(q.toLowerCase())) : actions

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-24 w-full max-w-xl rounded-2xl border bg-background p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Aktion suchen…"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
        />
        <div className="mt-2 max-h-64 overflow-auto">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => { setOpen(false); a.run() }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span>{a.label}</span>
              <span className="text-[10px] text-muted-foreground">↩︎</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Keine Treffer.
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Tipp: ⌘K / Ctrl+K zum Öffnen</span>
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Esc</kbd>
        </div>
      </div>
    </div>
  )
}
