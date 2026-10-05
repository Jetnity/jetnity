export const dynamic = 'force-dynamic'

import AdminFolgtSeite from '@/components/admin/AdminFolgtSeite'

export default async function ContentPage() {
  return (
    <AdminFolgtSeite
      titel="Content"
      satz="Keine Inhaltsverwaltung. Listen, Filter und Status folgen später und sind hier nicht vorhanden."
    />
  )
}
