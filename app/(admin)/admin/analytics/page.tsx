export const dynamic = 'force-dynamic'

import TravelAnalytics from '@/components/admin/analytics/TravelAnalytics'
import { analyticsRange, readTravelAnalytics } from '@/lib/admin/analytics/report'
import { requireAdminPage } from '@/lib/auth/admin-guard'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { PageRequestParam } from '@/lib/next/request-api'

export default async function AnalyticsPage({ searchParams }: {
  searchParams?: PageRequestParam<{ tage?: string | string[] }>
}) {
  await requireAdminPage({ surface: 'analytics', capability: 'betrieb-lesen' })
  const selection = analyticsRange((await searchParams)?.tage)
  const supabase = await createServerComponentClient()
  const report = await readTravelAnalytics({
    metrics: () => supabase.rpc('admin_reisen_kennzahlen'),
    series: (range) => supabase.rpc('admin_reisen_zeitreihe', { _tage: range }),
  }, selection.range)
  return <TravelAnalytics report={report} invalidRange={!selection.valid} />
}
