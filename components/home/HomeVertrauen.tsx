import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

import { Faehigkeitskennzeichen } from '@/components/home/Faehigkeitskennzeichen'
import {
  HOMEPAGE_FAEHIGKEITEN,
  HOMEPAGE_UEBERSCHRIFTEN,
  HOMEPAGE_VERTRAUEN,
  homepageFaehigkeitenGruppiert,
} from '@/lib/seo/final-homepage'

const GRUPPEN = homepageFaehigkeitenGruppiert()

export function HomeVertrauen() {
  return (
    <section className="mx-auto max-w-[1450px] px-3 py-12 sm:px-5 sm:py-16" aria-labelledby="vertrauen-titel">
      <div className="rounded-[28px] bg-white px-5 py-8 sm:rounded-[36px] sm:px-10 sm:py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Vertrauen</p>
        <h2
          id="vertrauen-titel"
          className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
        >
          {HOMEPAGE_UEBERSCHRIFTEN.vertrauen}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-800">
          Jetnity ist zuerst auf die Schweiz ausgerichtet und für Reisen weltweit gedacht.
        </p>
        <ul className="mt-6 divide-y divide-line-200 border-y border-line-200">
          {HOMEPAGE_VERTRAUEN.map((satz) => (
            <li key={satz} className="py-3 text-sm leading-6 text-ink-950">
              {satz}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-6 text-ink-800">
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center font-semibold text-brand-800 underline decoration-ink-500 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
          >
            Datenschutz
          </Link>
        </p>

        <h3 className="mt-10 text-xl font-semibold tracking-[-0.03em]">Was heute gilt</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-800">
          Der Stand auf einen Blick. Jeder Satz dazu steht im Wortlaut darunter.
        </p>
        <ul className="mt-4 divide-y divide-line-200 border-y border-line-200">
          {GRUPPEN.map((gruppe) => (
            <li key={gruppe.kennzeichnung} className="grid gap-2 py-3 sm:grid-cols-[12.5rem_minmax(0,1fr)] sm:items-baseline">
              <Faehigkeitskennzeichen kennzeichnung={gruppe.kennzeichnung} />
              <p className="min-w-0 text-sm font-semibold leading-6 text-brand-800">
                {gruppe.eintraege.map((eintrag) => eintrag.titel).join(' · ')}
              </p>
            </li>
          ))}
        </ul>

        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){function oeffne(){var ziel=document.getElementById('pro');if(!ziel)return;var details=ziel.closest('details');if(details)details.open=true;var wurzel=document.documentElement;var vorher=wurzel.style.scrollBehavior;wurzel.style.scrollBehavior='auto';ziel.scrollIntoView({block:'start',behavior:'auto'});wurzel.style.scrollBehavior=vorher;}function vonHash(){if(location.hash==='#pro')oeffne();}document.addEventListener('click',function(event){var link=event.target&&event.target.closest?event.target.closest('a'):null;if(!link)return;var href=link.getAttribute('href')||'';if(href!=='/#pro'&&href!=='#pro')return;window.setTimeout(oeffne,0);});if(location.hash==='#pro')oeffne();window.addEventListener('hashchange',vonHash);})();",
          }}
        />
        <details className="group mt-4 rounded-2xl bg-surface-75 open:pb-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/25 [&::-webkit-details-marker]:hidden">
            Alle Fähigkeiten im Wortlaut
            <ChevronDown className="h-4 w-4 shrink-0 motion-safe:transition-transform motion-safe:group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul className="grid gap-3 px-4 pb-3">
            {HOMEPAGE_FAEHIGKEITEN.map((faehigkeit) => (
              <li
                key={faehigkeit.id}
                id={faehigkeit.id === 'jetnity-pro' ? 'pro' : undefined}
                data-faehigkeit={faehigkeit.id}
                data-stand={faehigkeit.stand}
                className="grid min-w-0 scroll-mt-28 gap-2 rounded-2xl bg-white px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
              >
                <div className="min-w-0">
                  <p className="font-semibold tracking-[-0.02em]">{faehigkeit.titel}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-800">{faehigkeit.text}</p>
                </div>
                <Faehigkeitskennzeichen kennzeichnung={faehigkeit.kennzeichnung} className="sm:mt-0.5" />
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  )
}
