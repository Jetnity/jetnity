import Link from 'next/link'
import { ADMIN_NAECHSTE_SCHRITTE } from '@/lib/admin/ehrliche-zustaende'

export default function AdminNaechsteSchritte() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Nächste Ops-Schritte</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Nur Flächen mit vorhandener Steuerung oder ausdrücklich später. Kein Setup-Guide, keine
        virtuellen Creator, kein Control-Center.
      </p>
      <ul className="grid sm:grid-cols-2 gap-3">
        {ADMIN_NAECHSTE_SCHRITTE.map((schritt) => (
          <li key={schritt.titel} className="rounded-xl border border-border p-4 bg-background">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{schritt.titel}</p>
              <span
                className={
                  schritt.stand === 'ready'
                    ? 'text-xs rounded-md px-2 py-0.5 border border-border bg-muted text-foreground'
                    : 'text-xs rounded-md px-2 py-0.5 border border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-400'
                }
              >
                {schritt.stand === 'ready' ? 'vorhanden' : 'folgt'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{schritt.satz}</p>
            {schritt.href ? (
              <Link href={schritt.href} className="text-sm mt-2 inline-block underline hover:no-underline">
                Öffnen
              </Link>
            ) : (
              <p className="text-sm mt-2 text-muted-foreground">Kein Ziel in diesem Slice.</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
