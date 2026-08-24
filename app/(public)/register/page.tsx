// app/(public)/register/page.tsx
import { redirect } from 'next/navigation'

import RegisterForm from '@/components/auth/RegisterForm'
import { anmeldeSeiteZiel } from '@/lib/auth/naechstes-ziel'
import { oauthFreigabeLesen } from '@/lib/auth/oauth-anbieter-lesen'
import { createServerComponentClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Registrieren – Jetnity',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const supabase = createServerComponentClient()
  const { data } = await supabase.auth.getUser()
  const ziel = anmeldeSeiteZiel(data.user, searchParams.next)
  if (ziel) redirect(ziel)

  return (
    <main className="min-h-[70dvh] container mx-auto px-4 py-10 flex items-center justify-center">
      <RegisterForm next={searchParams.next ?? null} oauth={oauthFreigabeLesen()} />
    </main>
  )
}
