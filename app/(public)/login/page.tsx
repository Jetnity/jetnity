// app/(public)/login/page.tsx
import { redirect } from 'next/navigation'

import LoginForm from '@/components/auth/LoginForm'
import { anmeldeSeiteZiel } from '@/lib/auth/naechstes-ziel'
import { oauthFreigabeLesen } from '@/lib/auth/oauth-anbieter-lesen'
import { leseRequestParam } from '@/lib/next/request-api'
import { createServerComponentClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Login – Jetnity',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

type LoginSearchParams = { next?: string }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams | Promise<LoginSearchParams>
}) {
  const supabase = await createServerComponentClient()
  const { data } = await supabase.auth.getUser()
  const params = await leseRequestParam(searchParams)
  const ziel = anmeldeSeiteZiel(data.user, params.next)
  if (ziel) redirect(ziel)

  return (
    <main className="min-h-[70dvh] container mx-auto px-4 py-10 flex items-center justify-center">
      <LoginForm next={params.next ?? null} oauth={oauthFreigabeLesen()} />
    </main>
  )
}
