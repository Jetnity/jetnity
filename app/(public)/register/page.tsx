// app/(public)/register/page.tsx
import { redirect } from 'next/navigation'

import RegisterForm from '@/components/auth/RegisterForm'
import { anmeldeSeiteZiel } from '@/lib/auth/naechstes-ziel'
import { oauthFreigabeLesen } from '@/lib/auth/oauth-anbieter-lesen'
import { leseRequestParam } from '@/lib/next/request-api'
import { createServerComponentClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Registrieren – Jetnity',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RegisterSearchParams = { next?: string }

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: RegisterSearchParams | Promise<RegisterSearchParams>
}) {
  const supabase = await createServerComponentClient()
  const { data } = await supabase.auth.getUser()
  const params = await leseRequestParam(searchParams)
  const ziel = anmeldeSeiteZiel(data.user, params.next)
  if (ziel) redirect(ziel)

  return (
    <main className="min-h-[70dvh] container mx-auto px-4 py-10 flex items-center justify-center">
      <RegisterForm next={params.next ?? null} oauth={oauthFreigabeLesen()} />
    </main>
  )
}
