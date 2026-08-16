// app/(admin)/admin/settings/page.tsx
export const dynamic = 'force-dynamic'
export default async function SettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Einstellungen</h1>
      <p className="text-sm text-muted-foreground">Allgemeine & erweiterte Optionen – folgt.</p>
    </div>
  )
}
