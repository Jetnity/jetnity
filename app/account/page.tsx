import type { Metadata } from 'next'

import KontoStart from '@/components/account/KontoStart'
import { begruessungName } from '@/lib/account/begruessung'
import { createServerComponentClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dein Jetnity',
  description: 'Deine Reise fortsetzen, eine neue Reise beginnen und dein Konto verwalten.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AccountSeite() {
  const supabase = await createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profilname = user?.user_metadata?.name ?? user?.user_metadata?.full_name
  const name = typeof profilname === 'string' ? profilname.trim() : ''

  const initiale = begruessungName({ name, email: user?.email })?.slice(0, 1).toLocaleUpperCase('de-CH') ?? null

  return <KontoStart name={name} email={user?.email ?? null} initiale={initiale} />
}
