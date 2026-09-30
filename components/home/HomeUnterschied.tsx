import { HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_UNTERSCHIEDE } from '@/lib/seo/final-homepage'

export function HomeUnterschied() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-4 sm:px-8 sm:py-6" aria-labelledby="unterschied-titel">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Unterschied</p>
      <h2
        id="unterschied-titel"
        className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
      >
        {HOMEPAGE_UEBERSCHRIFTEN.unterschied}
      </h2>
      <ul className="mt-8 grid gap-3 md:grid-cols-3">
        {HOMEPAGE_UNTERSCHIEDE.map((punkt) => (
          <li key={punkt.titel} className="min-w-0 rounded-[24px] bg-brand-800 p-5 text-white sm:p-6">
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-balance">{punkt.titel}</h3>
            <p className="mt-3 text-sm leading-6 text-ink-300">{punkt.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
