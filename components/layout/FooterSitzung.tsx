'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFormStatus } from 'react-dom'

import { signOutAction } from '@/app/auth/sign-out'
import GlobalesAbmeldenForm from '@/components/auth/GlobalesAbmeldenForm'
import {
  sitzungseintraege,
  standAusSitzung,
  type Navigationseintrag,
  type Sitzungsstand,
} from '@/lib/auth/oeffentliche-navigation'
import { createBrowserClient } from '@/lib/supabase/client'

const footerLinkClass =
  'inline-flex min-h-10 items-center text-sm text-white/70 transition hover:text-white pointer-fine:min-h-0'

export default function FooterSitzung() {
  const pathname = usePathname()
  const [sitzung, setSitzung] = React.useState<Sitzungsstand>('unbekannt')

  const clientHolen = () => {
    try {
      return createBrowserClient()
    } catch {
      return null
    }
  }

  const lebt = React.useRef(true)
  React.useEffect(() => {
    lebt.current = true
    return () => {
      lebt.current = false
    }
  }, [])

  const sitzungLesen = React.useCallback(async () => {
    const client = clientHolen()
    if (!client) return
    const { data } = await client.auth.getSession()
    if (lebt.current) setSitzung(standAusSitzung(Boolean(data.session)))
  }, [])

  React.useEffect(() => {
    void sitzungLesen()
  }, [pathname, sitzungLesen])

  React.useEffect(() => {
    const client = clientHolen()
    if (!client) return
    const { data: beobachter } = client.auth.onAuthStateChange((_ereignis, aktuelleSitzung) => {
      if (lebt.current) setSitzung(standAusSitzung(Boolean(aktuelleSitzung)))
    })
    return () => beobachter.subscription.unsubscribe()
  }, [])

  const eintraege = sitzungseintraege(sitzung)
  if (eintraege.length === 0) return null

  return (
    <>
      {eintraege.map((eintrag) => (
        <li key={eintrag.label}>
          <FooterSitzungseintrag eintrag={eintrag} onNachlesen={sitzungLesen} />
        </li>
      ))}
    </>
  )
}

function FooterSitzungseintrag({
  eintrag,
  onNachlesen,
}: {
  eintrag: Navigationseintrag
  onNachlesen: () => void
}) {
  if (eintrag.art === 'link') {
    return (
      <Link href={eintrag.href} className={footerLinkClass}>
        {eintrag.label}
      </Link>
    )
  }

  return (
    <GlobalesAbmeldenForm
      action={signOutAction}
      fehlerClassName="max-w-[16rem] text-xs text-red-200"
    >
      <FooterAbmelden label={eintrag.label} onNachlesen={onNachlesen} />
    </GlobalesAbmeldenForm>
  )
}

function FooterAbmelden({
  label,
  onNachlesen,
}: {
  label: string
  onNachlesen: () => void
}) {
  const { pending } = useFormStatus()
  const lief = React.useRef(false)

  React.useEffect(() => {
    if (pending) {
      lief.current = true
      return
    }
    if (lief.current) {
      lief.current = false
      onNachlesen()
    }
  }, [pending, onNachlesen])

  return (
    <button type="submit" className={footerLinkClass}>
      {label}
    </button>
  )
}
