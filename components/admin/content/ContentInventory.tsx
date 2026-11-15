import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import AdminSnapshotRefresh from '@/components/admin/AdminSnapshotRefresh'
import { SUCHLAENGE, THEMEN, entdeckerHref } from '@/lib/inspiration/explorer-1/katalog'
import type { ContentInventoryModel } from '@/lib/admin/content/inventory'

const actionClass = 'inline-flex min-h-11 max-w-full items-center rounded-lg border border-border px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted'

export default function ContentInventory({ inventory, observedAt }: {
  inventory: ContentInventoryModel
  observedAt: string
}) {
  const { selection, entries, total } = inventory
  return (
    <div className="mx-auto grid min-w-0 max-w-7xl grid-cols-1 gap-5 [overflow-wrap:anywhere]">
      <header className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">Content · Jetnity</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Content-Inventar</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Prüfe die vorhandenen Reiseideen, ihre Originaltexte und Bilder. Die Vorschau zeigt, wie Kunden die Inspiration finden.</p>
      </header>

      <AdminSnapshotRefresh observedAt={observedAt} />

      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="content-filter">
        <h2 id="content-filter" className="text-lg font-semibold">Reiseideen finden</h2>
        <form key={JSON.stringify([selection.q, selection.thema])} method="get" action="/admin/content" className="mt-4 grid min-w-0 gap-4">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label htmlFor="content-query" className="mb-2 block text-sm font-medium">Suche im Katalog</label>
              <Input id="content-query" name="q" type="search" defaultValue={selection.q} maxLength={SUCHLAENGE}
                placeholder="Ziel, Land, Thema oder Text" containerClassName="min-w-0 [&>div:last-child]:hidden" />
            </div>
            <div className="min-w-0">
              <label htmlFor="content-topic" className="mb-2 block text-sm font-medium">Thema</label>
              <select id="content-topic" name="thema" defaultValue={selection.thema}
                className="min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {THEMEN.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" className="h-auto min-h-11 max-w-full whitespace-normal pointer-fine:h-auto pointer-fine:min-h-11">Katalog filtern</Button>
            <a href="/admin/content" className={actionClass}>Filter zurücksetzen</a>
          </div>
        </form>
        <p role="status" className="mt-4 text-sm text-muted-foreground">{entries.length} von {total} Reiseideen im aktuellen Katalog</p>
      </section>

      <section className="grid min-w-0 gap-4 lg:grid-cols-2" aria-label="Reiseideen im Inventar">
        {entries.length === 0 ? (
          <div className="min-w-0 rounded-2xl border border-border bg-card p-5 lg:col-span-2">
            <h2 className="text-lg font-semibold">Keine passende Reiseidee</h2>
            <p className="mt-2 text-sm text-muted-foreground">Für diese Kombination aus Suchtext und Thema gibt es keinen Treffer. Ändere die Suche oder setze die Filter zurück.</p>
          </div>
        ) : entries.map((entry) => (
          <article key={entry.placeId} className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby={`content-${entry.placeId}`}>
            <p className="text-sm text-muted-foreground">{entry.country}</p>
            <h2 id={`content-${entry.placeId}`} className="mt-1 text-xl font-semibold">{entry.name}</h2>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Themen für ${entry.name}`}>
              {entry.themen.map((id) => <li key={id} className="max-w-full rounded-lg bg-muted px-2 py-1 text-xs">{THEMEN.find((topic) => topic.id === id)?.label}</li>)}
            </ul>
            <dl className="mt-4 grid gap-4 text-sm">
              <div><dt className="font-medium">Beschreibung im Katalog</dt><dd className="mt-1 text-muted-foreground">{entry.beschreibung}</dd></div>
              <div><dt className="font-medium">Reiseidee für die Planung</dt><dd className="mt-1 text-muted-foreground">{entry.idea}</dd></div>
              <div><dt className="font-medium">Inhaltstyp und Zuordnung</dt><dd className="mt-1 text-muted-foreground">Kuratierte Inspiration · {entry.placeId}</dd></div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={entdeckerHref({ q: entry.name, thema: 'alle' })} target="_blank" rel="noopener noreferrer" className={actionClass}
                aria-label={`${entry.name}: Öffentliche Vorschau (neuer Tab)`}>Öffentliche Vorschau</a>
              {entry.href ? <a href={entry.href} target="_blank" rel="noopener noreferrer" className={actionClass}
                aria-label={`${entry.name}: Planung öffnen (neuer Tab)`}>Planung öffnen</a>
                : <p className="text-sm text-muted-foreground">Für dieses Ziel ist kein bestätigter Planungslink verfügbar.</p>}
              <a href={entry.image} target="_blank" rel="noopener noreferrer" className={actionClass}
                aria-label={`${entry.name}: Katalogbild öffnen (neuer Tab)`}>Katalogbild öffnen</a>
            </div>
          </article>
        ))}
      </section>

      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="content-evidence">
        <h2 id="content-evidence" className="text-lg font-semibold">Quelle und offene Nachweise</h2>
        <p className="mt-2 text-sm text-muted-foreground">Diese Ansicht liest den bestehenden Inspirationskatalog dieser Anwendungsversion. Sie umfasst die Reiseideen auf der Startseite und unter /entdecken, nicht alle Seiten von Jetnity. Die Momentaufnahme oben ist der Anzeigezeitpunkt, keine redaktionelle Prüfung.</p>
        <dl className="mt-4 grid min-w-0 gap-4 text-sm sm:grid-cols-2">
          <div><dt className="font-medium">Originalquellen</dt><dd className="mt-1 text-muted-foreground [overflow-wrap:anywhere]">lib/places/inspiration.ts<br />lib/inspiration/explorer-1/katalog.ts</dd></div>
          <div><dt className="font-medium">Sprache und Markt</dt><dd className="mt-1 text-muted-foreground">Deutsch. Ein redaktioneller Zielmarkt ist nicht erfasst; das Land des Reiseziels ist keine Markteinstellung.</dd></div>
          <div><dt className="font-medium">Verantwortung und Zeitangaben</dt><dd className="mt-1 text-muted-foreground">Redaktioneller Owner sowie Veröffentlichungs-, Änderungs- und Prüfdatum sind im Katalog nicht erfasst.</dd></div>
          <div><dt className="font-medium">Bildrechte und Aktualität</dt><dd className="mt-1 text-muted-foreground">Rechtebeleg, fachliche Quellenprüfung und redaktionelle Aktualität sind im Katalog nicht erfasst. Ein vorhandenes Bild ist kein Rechtebeleg.</dd></div>
          <div><dt className="font-medium">Traffic und Conversion</dt><dd className="mt-1 text-muted-foreground">Für diese Inhalte liegen hier keine Messdaten vor. Fehlende Messdaten bedeuten nicht null Aufrufe oder Buchungen.</dd></div>
          <div><dt className="font-medium">Indexierung</dt><dd className="mt-1 text-muted-foreground">/entdecken ist in der Seitenkonfiguration als noindex/nofollow angelegt. Der tatsächliche Suchmaschinenindex wurde hier nicht geprüft. Technische SEO-Informationen findest du unter <a href="/admin/system-health" className="underline underline-offset-2">System Health</a>.</dd></div>
        </dl>
        <p className="mt-5 text-sm text-muted-foreground">Inhalte werden derzeit im Quellbestand gepflegt. Diese Ansicht speichert, genehmigt und veröffentlicht keine Änderungen.</p>
      </section>
    </div>
  )
}
