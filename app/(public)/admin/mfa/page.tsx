import { redirect } from 'next/navigation'

import { evaluateAdminAccess } from '@/lib/auth/admin-guard'
import { erlaubtesAdminZiel } from '@/lib/auth/admin-aal'
import { leseOptionalRequestParam, type PageRequestParam } from '@/lib/next/request-api'
import { AdminMfaStepUp } from './AdminMfaStepUp'

export const dynamic = 'force-dynamic'

type AdminMfaSearchParams = { next?: string }

export default async function AdminMfaPage({
  searchParams,
}: {
  searchParams?: PageRequestParam<AdminMfaSearchParams>
}) {
  const params = await leseOptionalRequestParam(searchParams)
  const ziel = erlaubtesAdminZiel(params?.next)
  const decision = await evaluateAdminAccess({ surface: 'admin-mfa' })

  if (decision.allowed) redirect(ziel)

  if (!decision.user || decision.denial === 'unauthenticated') {
    redirect('/admin/login')
  }

  if (decision.denial === 'aal2-required' || decision.denial === 'aal-lookup-failed') {
    return (
      <AdminMfaStepUp
        ziel={ziel}
        lookupFailed={decision.denial === 'aal-lookup-failed'}
      />
    )
  }

  const grund = decision.denial === 'lookup-failed' ? 'lookup-failed' : 'forbidden'
  redirect(`/unauthorized?grund=${grund}`)
}
