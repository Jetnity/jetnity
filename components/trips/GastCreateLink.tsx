'use client'

// components/trips/GastCreateLink.tsx
//
// Generische Create-CTAs. Nach dem Mount gilt der Gastspeicher: existiert die
// eine Reise, führt der Link dorthin. Zielkarten bleiben bewusst unangetastet.

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'

import { genericCreateHrefFuerGast } from '@/lib/trips/create-entry'
import { gastspeicherLaden } from '@/lib/trips/gastspeicher'

type GastCreateLinkProps = {
  createHref?: string
  createLabel: string
  /** Konten dürfen viele Reisen anlegen – dann bleibt der Create-Href. */
  nurCreate?: boolean
  className?: string
  onClick?: () => void
  children?: React.ReactNode
}

export default function GastCreateLink({
  createHref = '/planen',
  createLabel,
  nurCreate = false,
  className,
  onClick,
  children,
}: GastCreateLinkProps) {
  const [href, setHref] = React.useState(createHref)
  const [label, setLabel] = React.useState(createLabel)
  const [ersetzen, setErsetzen] = React.useState(false)

  React.useEffect(() => {
    if (nurCreate) {
      setHref(createHref)
      setErsetzen(false)
      setLabel(createLabel)
      return
    }
    const ziel = genericCreateHrefFuerGast(createHref, gastspeicherLaden().aktiv)
    setHref(ziel.href)
    setErsetzen(ziel.labelErsetzen)
    setLabel(ziel.labelErsetzen ? 'Reise fortsetzen' : createLabel)
  }, [createHref, createLabel, nurCreate])

  return (
    <Link href={href as Route} className={className} onClick={onClick}>
      {ersetzen ? label : (children ?? label)}
    </Link>
  )
}
