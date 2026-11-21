// app/not-found.tsx
import NotFoundView from '@/components/layout/NotFoundView'
import PublicChrome from '@/components/workspace/PublicChrome'

// Unbekannte Adressen landen ausserhalb von app/(public); ohne den Rahmen gäbe
// es weder Kopfzeile noch Fusszeile, um weiterzukommen.
export default function NotFound() {
  return (
    <PublicChrome>
      <NotFoundView />
    </PublicChrome>
  )
}
