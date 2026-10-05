import { HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_UNTERSCHIEDE } from '@/lib/seo/final-homepage'

export function HomeUnterschied() {
  const [erster, ...weitere] = HOMEPAGE_UNTERSCHIEDE
  return (
    <section className="px-3 py-2 sm:px-5 sm:py-4" aria-labelledby="unterschied-titel">
      <div className="mx-auto max-w-[1450px] rounded-[28px] bg-brand-800 px-5 py-10 text-white sm:rounded-[36px] sm:px-12 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-citrus-400">Unterschied</p>
        <div className="mt-4 grid items-start gap-10 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-6">
            <h2
              id="unterschied-titel"
              className="max-w-xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
            >
              {HOMEPAGE_UEBERSCHRIFTEN.unterschied}
            </h2>
            <h3 className="mt-8 max-w-md text-2xl font-semibold tracking-[-0.03em] text-balance sm:text-3xl">
              {erster.titel}
            </h3>
            <p className="mt-3 max-w-md text-base leading-7 text-ink-300">{erster.text}</p>
          </div>
          <ul className="min-w-0 border-t border-white/15 pt-6 lg:col-span-5 lg:col-start-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-2">
            {weitere.map((punkt) => (
              <li key={punkt.titel} className="border-t border-white/15 py-5 first:border-t-0 first:pt-0">
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-balance">{punkt.titel}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-300">{punkt.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
