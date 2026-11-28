'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu, Plus, X } from 'lucide-react'
import type { ReactNode, Ref } from 'react'

import GastCreateLink from '@/components/trips/GastCreateLink'
import WorkspaceAccountMenu from '@/components/workspace/WorkspaceAccountMenu'
import { cn } from '@/lib/utils'

/**
 * Der gemeinsame Baustein der Kopfzeile: öffentliche Seiten und Arbeitsbereich teilen
 * Rahmen, Menüknopf, Marke, «Reise planen» und Kontomenü. Er bringt keine eigene
 * Navigation, keine Sitzungslogik und keinen Abmeldeweg mit. Was sich unterscheidet,
 * kommt über Slots herein:
 *
 * - `mitte`: Hauptnavigation, nur öffentlich (ab 48 rem sichtbar);
 * - `aktionen`: kontextabhängige Aktionen links von «Reise planen» (Arbeitsbereich: Portal-Ziel);
 * - `darunter`: Fläche unterhalb der Zeile (öffentliches Menü für schmale Breiten).
 *
 * Variante `oeffentlich`: Das Menü schaltet um und zeigt Menü und Schliessen.
 * Variante `arbeitsbereich`: Das Menü öffnet die Seitenleiste als Dialog.
 * Die weisse Kopfzeile ist in beiden Darstellungen gleich (Marken-Chrome).
 */
export type KopfVariante = 'oeffentlich' | 'arbeitsbereich'

export type KopfMenue = {
  offen: boolean
  steuert: string
  onKlick: () => void
}

type KopfLeisteProps = {
  variante: KopfVariante
  menue: KopfMenue
  menueRef?: Ref<HTMLButtonElement>
  mitte?: ReactNode
  aktionen?: ReactNode
  darunter?: ReactNode
  className?: string
  innenClassName?: string
  kopfRef?: Ref<HTMLElement>
  inert?: boolean
}

export default function KopfLeiste({
  variante,
  menue,
  menueRef,
  mitte,
  aktionen,
  darunter,
  className,
  innenClassName,
  kopfRef,
  inert,
}: KopfLeisteProps) {
  const oeffentlich = variante === 'oeffentlich'

  return (
    <header
      ref={kopfRef}
      data-kopf-variante={variante}
      inert={inert}
      className={cn('kopf', oeffentlich ? 'kopf-oeffentlich' : 'workspace-header', className)}
    >
      <div className={cn('kopf-innen', innenClassName)} data-mitte={mitte ? '' : undefined}>
        <div className="kopf-links">
          <button
            ref={menueRef}
            type="button"
            aria-label="Menü"
            aria-expanded={menue.offen}
            aria-controls={menue.steuert}
            onClick={menue.onKlick}
            className={cn('kopf-menue', oeffentlich ? 'kopf-menue-oeffentlich' : 'workspace-menu-button')}
          >
            {oeffentlich && menue.offen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
          <Link href="/" aria-label="Jetnity Startseite" className={cn('kopf-marke', !oeffentlich && 'workspace-header-brand')}>
            {/* Der Link trägt den Namen. Das Bild bleibt dekorativ, damit der Name nicht doppelt vorgelesen wird. */}
            <Image
              src="/brand/jetnity-logo.png"
              alt=""
              width={384}
              height={128}
              priority
              unoptimized
              sizes="144px"
              className="h-[48px] w-auto max-w-full object-contain"
              style={{ width: 'auto' }}
            />
          </Link>
        </div>
        {mitte}
        <div className="kopf-rechts">
          {aktionen}
          <GastCreateLink createLabel="Reise planen" className="kopf-planen workspace-button workspace-primary">
            <Plus aria-hidden="true" />
            <span>Reise planen</span>
          </GastCreateLink>
          <WorkspaceAccountMenu darstellung={oeffentlich} />
        </div>
      </div>
      {darunter}
    </header>
  )
}
