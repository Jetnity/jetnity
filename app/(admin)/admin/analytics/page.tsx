export const dynamic = 'force-dynamic'

import AdminFolgtSeite from '@/components/admin/AdminFolgtSeite'

export default async function AnalyticsPage() {
  return (
    <AdminFolgtSeite
      titel="Analytics"
      satz="Berichte und Charts sind nicht gebaut. Es gibt keine operative Auswertung hinter dieser Fläche."
    />
  )
}
