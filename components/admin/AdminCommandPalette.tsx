// components/admin/AdminCommandPalette.tsx
'use client'

import * as React from 'react'

export default function AdminCommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes('mac')
      if ((isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function run(mode: 'assist' | 'auto' | 'simulate') {
    try {
      const res = await fetch('/api/admin/copilot/actions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      if (!res.ok) throw new Error('Fehler')
      setOpen(false)
    } catch {
      alert('Aktion fehlgeschlagen.')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <div className="mx-auto mt-24 max-w-xl rounded-2xl border border-border bg-card p-2 shadow-lg">
        <input
          autoFocus
          placeholder="CoPilot Aktion auswählen …"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
        />
        <ul className="mt-2 divide-y divide-border">
          <PaletteItem label="Assist – Kontextuelle Hilfe & nächste Schritte" onClick={() => run('assist')} />
          <PaletteItem label="Auto – Automatisch ausführen (sicher)" onClick={() => run('auto')} />
          <PaletteItem label="Simulate – Simulation ohne Änderungen" onClick={() => run('simulate')} />
        </ul>
      </div>
    </div>
  )
}

function PaletteItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg transition"
      >
        {label}
      </button>
    </li>
  )
}
