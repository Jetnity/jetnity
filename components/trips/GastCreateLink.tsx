'use client'

// components/trips/GastCreateLink.tsx
//
// Generische Create-CTAs. Die Sitzung kommt aus derselben Cookie-Wahrheit wie
// Navbar und Footer. Liegengebliebener Guest-LocalStorage darf ein Konto nicht
// zur Gastreise umbiegen. Zielkarten nutzen diesen Link bewusst nicht.

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'

import { standAusSitzung, type Sitzungsstand } from '@/lib/auth/oeffentliche-navigation'
import { genericCreateCtaFuerSitzung } from '@/lib/trips/create-entry'
import { gastspeicherLaden } from '@/lib/trips/gastspeicher'
import { createBrowserClient } from '@/lib/supabase/client'

type GastCreateLinkProps = {
  createHref?: string
  createLabel: string
  className?: string
  onClick?: () => void
  children?: React.ReactNode
}

function clientHolen() {
  try {
    return createBrowserClient()
  } catch {
    return null
  }
}

export default function GastCreateLink({
  createHref = '/planen',
  createLabel,
  className,
  onClick,
  children,
}: GastCreateLinkProps) {
  const [sitzung, setSitzung] = React.useState<Sitzungsstand>('unbekannt')
  const [href, setHref] = React.useState(createHref)
  const [label, setLabel] = React.useState(createLabel)
  const [ersetzen, setErsetzen] = React.useState(false)

  const lebt = React.useRef(true)
  React.useEffect(() => {
    lebt.current = true
    return () => {
      lebt.current = false
    }
  }, [])

  React.useEffect(() => {
    const client = clientHolen()
    if (!client) return

    void client.auth.getSession().then(({ data }) => {
      if (lebt.current) setSitzung(standAusSitzung(Boolean(data.session)))
    })

    const { data: beobachter } = client.auth.onAuthStateChange((_ereignis, aktuelleSitzung) => {
      if (lebt.current) setSitzung(standAusSitzung(Boolean(aktuelleSitzung)))
    })

    return () => beobachter.subscription.unsubscribe()
  }, [])

  React.useEffect(() => {
    const aktiv = sitzung === 'gast' ? gastspeicherLaden().aktiv : null
    const ziel = genericCreateCtaFuerSitzung({
      createHref,
      createLabel,
      sitzung,
      aktiv,
    })
    setHref(ziel.href)
    setErsetzen(ziel.labelErsetzen)
    setLabel(ziel.label)
  }, [createHref, createLabel, sitzung])

  return (
    <Link href={href as Route} className={className} onClick={onClick}>
      {ersetzen ? label : (children ?? label)}
    </Link>
  )
}
