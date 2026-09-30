import { HOMEPAGE_SCHRITTE, HOMEPAGE_UEBERSCHRIFTEN } from '@/lib/seo/final-homepage'

export function HomeBegleitung() {
  return (
    <section
      id="so-funktionierts"
      className="mx-auto max-w-7xl scroll-mt-28 px-5 py-14 sm:px-8 sm:py-20"
      aria-labelledby="begleitung-titel"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Ablauf</p>
      <h2
        id="begleitung-titel"
        className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
      >
        {HOMEPAGE_UEBERSCHRIFTEN.begleitung}
      </h2>
      <ol className="mt-8 grid gap-3 md:grid-cols-3">
        {HOMEPAGE_SCHRITTE.map((schritt, index) => (
          <li key={schritt.titel} className="min-w-0 rounded-[24px] border border-black/5 bg-white p-5 sm:p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-100 text-sm font-semibold text-brand-800">
              {index + 1}
            </span>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em]">{schritt.titel}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-800">{schritt.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
