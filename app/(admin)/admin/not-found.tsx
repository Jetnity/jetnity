import Link from 'next/link'
import { Compass, LayoutDashboard } from 'lucide-react'
import { Statuskarte, statusAktionHaupt } from '@/components/ui/statuskarte'

export default function AdminNotFound() {
  return (
    <Statuskarte
      symbol={Compass}
      kicker="Administration"
      titel="Seite nicht gefunden"
      aktionen={
        <Link href="/admin" className={statusAktionHaupt}>
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          Zurück zum Dashboard
        </Link>
      }
    >
      <p>Diese Admin-Seite existiert (noch) nicht.</p>
    </Statuskarte>
  )
}
