import { adminFolgtSeitenhinweis } from '@/lib/admin/ehrliche-zustaende'

export default function AdminFolgtSeite({
  titel,
  satz,
}: {
  titel: string
  satz: string
}) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">folgt</p>
      <h1 className="mt-2 text-lg font-semibold">{titel}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{satz}</p>
      <p className="mt-4 text-sm text-muted-foreground">{adminFolgtSeitenhinweis(titel)}</p>
    </section>
  )
}
