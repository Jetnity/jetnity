// app/(admin)/admin/localization/page.tsx
export const dynamic = 'force-dynamic'
export default async function LocalizationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Localization</h1>
      <p className="text-sm text-muted-foreground">Sprachen, Übersetzungen & hreflang – folgt.</p>
    </div>
  )
}
