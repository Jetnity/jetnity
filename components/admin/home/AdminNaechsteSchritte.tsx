import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { ADMIN_NAECHSTE_SCHRITTE } from '@/lib/admin/ehrliche-zustaende'
import AdminEvidenceDetails from './AdminEvidenceDetails'

const BEREICHE: Record<string, { label: string; beschreibung: string; status: string }> = {
  Nutzer: { label: 'Nutzer verwalten', beschreibung: 'Konten, Rollen und Kontostatus', status: 'Aktiv' },
  Zahlungen: { label: 'Zahlungssicht öffnen', beschreibung: 'Lokale Einträge · kein Payment-Konto verbunden', status: 'Lokale Ansicht' },
  Security: { label: 'Security prüfen', beschreibung: 'Aufgezeichnete Ereignisse · Erfassung unvollständig', status: 'Lokale Ansicht' },
  'System Health': { label: 'System Health prüfen', beschreibung: 'Quellen, Prüfzeitpunkte und Abdeckung', status: 'Read-only' },
  'Provider & Kosten': { label: 'Provider & Kosten prüfen', beschreibung: 'Aufgezeichnete Nutzung · Kostenbild unvollständig', status: 'Read-only' },
}

export default function AdminNaechsteSchritte() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Nächste Ops-Schritte</h2>
        <p className="text-xs text-muted-foreground">Direkt zu den Betriebsbereichen</p>
      </div>
      <ul className="grid gap-x-6 sm:grid-cols-2">
        {ADMIN_NAECHSTE_SCHRITTE.filter((schritt) => schritt.href).map((schritt) => {
          const bereich = BEREICHE[schritt.titel]
          return (
            <li key={schritt.titel} className="min-w-0 border-t border-border">
              <Link href={schritt.href!} className="group flex min-h-11 items-center gap-3 rounded-lg py-4 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium">{bereich.label}</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{bereich.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{bereich.beschreibung}</p>
                </div>
                <ArrowUpRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="mt-3">
        <AdminEvidenceDetails>
          {ADMIN_NAECHSTE_SCHRITTE.filter((schritt) => schritt.href).map((schritt) => (
            <p key={schritt.titel}><span className="font-medium text-foreground">{schritt.titel}: </span>{schritt.satz}</p>
          ))}
        </AdminEvidenceDetails>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium">In Planung</span>
        <span>Copilot Pro · Automatik noch nicht verfügbar</span>
        <span>Domain & Mail · Nicht konfiguriert</span>
      </div>
    </div>
  )
}
