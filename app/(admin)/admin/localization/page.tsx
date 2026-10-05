export const dynamic = 'force-dynamic'

import AdminFolgtSeite from '@/components/admin/AdminFolgtSeite'

export default async function LocalizationPage() {
  return (
    <AdminFolgtSeite
      titel="Lokalisierung"
      satz="Keine Sprach- oder Übersetzungssteuerung. hreflang und Locale-Verwaltung folgen später."
    />
  )
}
