'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { CircleUserRound } from 'lucide-react'
import FooterSitzung from '@/components/layout/FooterSitzung'
import DarstellungWahl from './DarstellungWahl'
import useWorkspaceTheme from './useWorkspaceTheme'

function DarstellungImMenue() {
  const { theme, setTheme } = useWorkspaceTheme()
  return (
    <DarstellungWahl
      theme={theme}
      onWahl={setTheme}
      hinweis="Gilt für Planung, Reisen und Konto. Öffentliche Seiten bleiben hell."
    />
  )
}

/**
 * Kontomenü der gemeinsamen Kopfzeile. Auf öffentlichen Seiten gibt es keine Seitenleiste, in der die
 * Darstellung wohnt; dort steht die Wahl hier (`darstellung`). Im Arbeitsbereich bleibt sie in der Seitenleiste.
 */
export default function WorkspaceAccountMenu({ darstellung = false }: { darstellung?: boolean }) {
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) ref.current?.removeAttribute('open')
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  return (
    <details ref={ref} className="workspace-account" onKeyDown={(e) => {
      if (e.key === 'Escape') { ref.current?.removeAttribute('open'); ref.current?.querySelector('summary')?.focus() }
    }}>
      <summary className="kopf-profil" aria-label="Kontomenü" title="Konto">
        <CircleUserRound aria-hidden="true" />
      </summary>
      <div className="workspace-account-panel" onClick={(e) => {
        if ((e.target as HTMLElement).closest('a')) ref.current?.removeAttribute('open')
      }}>
        <p>Konto &amp; Einstellungen</p>
        <ul>
          <li><Link href="/account/merkliste">Meine Merkliste</Link></li>
          <li><Link href="/account/settings">Einstellungen</Link></li>
          <li><Link href="/account/bookings">Bestätigte Buchungen</Link></li>
        </ul>
        {darstellung && <DarstellungImMenue />}
        <p>Jetnity</p>
        <ul>
          <li><a href="mailto:info@jetnity.ch">Kontakt</a></li>
          <li><Link href="/privacy">Datenschutzerklärung</Link></li>
          <li><Link href="/terms">Nutzungsbedingungen / AGB</Link></li>
          <li><Link href="/impressum">Impressum</Link></li>
          <li><Link href="/datenquellen">Datenquellen &amp; Lizenzen</Link></li>
        </ul>
        <ul className="workspace-session"><FooterSitzung workspace /></ul>
      </div>
    </details>
  )
}
