// components/admin/NotzugangHinweis.tsx
//
// Sichtbarer Hinweis auf eine Sitzung, die über `ADMIN_ALLOWED_EMAILS`
// hereingekommen ist.
//
// Der Notzugang öffnet die Oberfläche, nicht die Datenbank (ADR-0036). Ohne
// diesen Hinweis wäre das nicht zu erkennen: Die Seiten laden, die Listen
// bleiben leer und Änderungen scheitern. Eine leere Sicherheitsübersicht
// sieht dann aus wie „nichts vorgefallen“, obwohl „nicht berechtigt“ gemeint
// ist – dieselbe Verwechslung, die Phase 1.4 an mehreren Stellen behoben hat.

import { ADMIN_AREA_MINIMUM } from '@/lib/auth/roles'

export default function NotzugangHinweis() {
  return (
    <div
      role="alert"
      className="bg-destructive px-4 py-3 text-destructive-foreground md:px-6"
    >
      <p className="text-sm font-semibold">Notzugang – ohne Rechte in der Datenbank</p>
      <p className="mt-1 max-w-3xl text-sm">
        Dieses Konto ist über die Notliste hereingekommen, nicht über eine Rolle. Die
        Datenbank kennt diese Liste nicht: Übersichten bleiben leer und jede Änderung wird
        abgelehnt. Damit der Bereich wirklich nutzbar wird, braucht das Konto in{' '}
        <code className="font-mono">creator_profiles.role</code> mindestens{' '}
        <code className="font-mono">{ADMIN_AREA_MINIMUM}</code>.
      </p>
    </div>
  )
}
