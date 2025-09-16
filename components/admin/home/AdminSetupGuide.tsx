// components/admin/home/AdminSetupGuide.tsx
import Link from 'next/link'

const items: { title: string; desc: string; href: string; done?: boolean }[] = [
  { title: 'CoPilot Pro konfigurieren', desc: 'API-Key & Policies prüfen, Aktionen testen.', href: '/admin/control-center' },
  { title: 'Virtuelle Creator aktivieren', desc: 'Generierungspipeline einschalten (Bilder/Clips).', href: '/admin/control-center' },
  { title: 'Security-Policies prüfen', desc: 'RLS & Zugriffspfade checken.', href: '/admin' },
  { title: 'Payments verifizieren', desc: 'Webhooks/Status & Payouts testen.', href: '/admin' },
]

export default function AdminSetupGuide() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Nächste Schritte</h2>
      <ul className="grid sm:grid-cols-2 gap-3">
        {items.map((it) => (
          <li key={it.title} className="rounded-xl border border-border p-4 bg-background">
            <div className="flex items-center justify-between">
              <p className="font-medium">{it.title}</p>
              {it.done ? (
                <span className="text-xs rounded-md px-2 py-0.5 border border-emerald-400/30 bg-emerald-400/10 text-emerald-500">fertig</span>
              ) : (
                <span className="text-xs rounded-md px-2 py-0.5 border border-amber-400/30 bg-amber-400/10 text-amber-500">offen</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{it.desc}</p>
            <Link href={it.href} className="text-sm mt-2 inline-block underline hover:no-underline">Öffnen</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
