export const dynamic = 'force-dynamic'

import AdminFolgtSeite from '@/components/admin/AdminFolgtSeite'

export default async function SettingsPage() {
  return (
    <AdminFolgtSeite
      titel="Einstellungen"
      satz="Keine systemnahe Konfiguration. Infomaniak, Provider und Secrets werden hier nicht gesteuert."
    />
  )
}
