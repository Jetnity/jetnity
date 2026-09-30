import { Faehigkeitskennzeichen } from '@/components/home/Faehigkeitskennzeichen'
import { HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_WERKZEUGE } from '@/lib/seo/final-homepage'

export function HomeWerkzeuge() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="werkzeuge-titel">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Zusammenhang</p>
      <h2
        id="werkzeuge-titel"
        className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
      >
        {HOMEPAGE_UEBERSCHRIFTEN.werkzeuge}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-ink-800">
        Flug, Unterkunft, Aktivitäten, Mobilität und Tagesplan gehören zu derselben Reise. Du hältst sie
        nicht in fünf getrennten Tools nebeneinander.
      </p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HOMEPAGE_WERKZEUGE.map((werkzeug) => (
          <li key={werkzeug.titel} className="min-w-0 rounded-[24px] border border-black/5 bg-white p-5">
            <Faehigkeitskennzeichen kennzeichnung={werkzeug.kennzeichnung} />
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em]">{werkzeug.titel}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-800">{werkzeug.text}</p>
          </li>
        ))}
      </ul>
      <aside className="mt-4 rounded-[24px] border border-line-200 bg-surface-0 p-5 sm:p-6">
        <Faehigkeitskennzeichen kennzeichnung="Produktvorschau" />
        <h3 className="mt-4 text-lg font-semibold tracking-[-0.03em]">
          Eine Änderung kann andere Bereiche betreffen.
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-800">
          Wenn sich die Route ändert, können Unterkunft, Wege und Tagesplan mitbetroffen sein. Das zeigt
          Jetnity hier als Richtung. Eine automatische Umsetzung mit echten Anbieterdaten ist in
          Vorbereitung.
        </p>
      </aside>
    </section>
  )
}
