// app/search/loading.tsx
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 space-y-8">
      <section className="space-y-3">
        <div className="h-8 w-72 rounded bg-muted animate-pulse" />
        <div className="h-4 w-96 rounded bg-muted animate-pulse" />
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-9 w-28 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </section>

      <section aria-label="Suchergebnisse (lädt)">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card/60">
              <div className="aspect-[4/3] w-full bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-muted" />
                  <div className="h-6 w-14 rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
