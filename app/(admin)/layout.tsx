// app/(admin)/layout.tsx
//
// Zentraler Schutz für den Administrationsbereich.
//
// Der Gate sitzt im Layout der Routengruppe, nicht in den einzelnen Seiten:
// Damit ist jede Seite unter `(admin)` geschützt, auch eine neu angelegte.
// Vorher trug jede Seite ihren eigenen Aufruf – wer ihn vergass, lieferte eine
// offene Seite aus.
//
// Die Admin-Loginseite liegt bewusst unter `(public)`, damit sie nicht in
// diesen Gate läuft.

import NotzugangHinweis from '@/components/admin/NotzugangHinweis'
import { requireAdminPage } from '@/lib/auth/admin-guard'

export const dynamic = 'force-dynamic'

export default async function AdminAreaLayout({ children }: { children: React.ReactNode }) {
  const { grant } = await requireAdminPage({ surface: 'admin-bereich' })

  return (
    <>
      {/* Über der gesamten Shell, nicht in einer Seite: Die Einschränkung gilt
          für jede Seite des Bereichs, nicht für eine bestimmte. */}
      {grant === 'break-glass' ? <NotzugangHinweis /> : null}
      {children}
    </>
  )
}
