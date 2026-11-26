'use client'

import { Moon, Sun } from 'lucide-react'

import type { WorkspaceTheme } from './useWorkspaceTheme'

const WAHL = [
  { wert: 'light', label: 'Hell', symbol: Sun },
  { wert: 'dark', label: 'Dunkel', symbol: Moon },
] as const

/**
 * Hell oder Dunkel. Wohnt im Menü statt in der Kopfzeile. Die Wahl bleibt eine reine
 * Anzeige dieses Browsers (derselbe Speicher wie zuvor, kein Konto-Feld).
 */
export default function DarstellungWahl({ theme, onWahl }: {
  theme: WorkspaceTheme
  onWahl: (wert: WorkspaceTheme) => void
}) {
  return (
    <section className="workspace-nav-group" data-darstellung-wahl>
      <p className="workspace-kicker" aria-hidden="true">Darstellung</p>
      <div role="group" aria-label="Darstellung" className="workspace-darstellung">
        {WAHL.map(({ wert, label, symbol: Symbol }) => (
          <button
            key={wert}
            type="button"
            className="workspace-nav-link workspace-darstellung-knopf"
            aria-pressed={theme === wert}
            onClick={() => onWahl(wert)}
          >
            <Symbol aria-hidden="true" />
            <span className="workspace-nav-label">{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
