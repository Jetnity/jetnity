import { HOMEPAGE_SCHRITTE, HOMEPAGE_UEBERSCHRIFTEN } from '@/lib/seo/final-homepage'

export function HomeBegleitung() {
  return (
    <section
      id="so-funktionierts"
      className="mx-auto max-w-[1450px] scroll-mt-28 px-3 py-12 sm:px-5 sm:py-20"
      aria-labelledby="begleitung-titel"
    >
      <div className="max-w-3xl px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Ablauf</p>
        <h2
          id="begleitung-titel"
          className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
        >
          {HOMEPAGE_UEBERSCHRIFTEN.begleitung}
        </h2>
      </div>
      <ol className="mt-8 grid gap-0 px-2 md:mt-14 md:grid-cols-3 md:gap-8 md:px-0">
        {HOMEPAGE_SCHRITTE.map((schritt, index) => (
          <li key={schritt.titel} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 md:block">
            {index < HOMEPAGE_SCHRITTE.length - 1 ? (
              <span
                className="absolute bottom-0 left-[1.3rem] top-11 w-px bg-brand-800/30 md:bottom-auto md:left-11 md:top-[1.35rem] md:h-px md:w-[calc(100%-0.5rem)]"
                aria-hidden="true"
              />
            ) : null}
            <div className="relative md:mb-5">
              <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-brand-800 text-sm font-semibold text-white">
                {index + 1}
              </span>
            </div>
            <div className="min-w-0 pb-8 md:pb-0">
              <h3 className="text-xl font-semibold tracking-[-0.03em]">{schritt.titel}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-ink-800">{schritt.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
