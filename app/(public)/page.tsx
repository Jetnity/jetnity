import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BellRing,
  Check,
  Compass,
  FileCheck2,
  Map,
  MapPin,
  MessageCircle,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

import { ScrollRow } from '@/components/ui/scroll-row'

export const metadata: Metadata = {
  title: 'Deine ganze Reise. Intelligent begleitet.',
  description:
    'Plane, organisiere und erlebe deine Reise an einem Ort – übersichtlich, persönlich und sicher mit Jetnity.',
}

const destinations = [
  {
    name: 'Bali',
    country: 'Indonesien',
    image: '/images/bali.jpg',
    idea: 'Zwei Wochen Bali mit Ubud, ruhigen Stränden, Natur und lokaler Küche',
  },
  {
    name: 'Lissabon',
    country: 'Portugal',
    image: '/images/lisbon.jpg',
    idea: 'Fünf Tage Lissabon mit Aussichtspunkten, gutem Essen und einem Tagesausflug ans Meer',
  },
  {
    name: 'Zermatt',
    country: 'Schweiz',
    image: '/images/zermatt.jpg',
    idea: 'Ein verlängertes Wochenende in Zermatt mit Wandern, Wellness und Matterhornblick',
  },
  {
    name: 'Amsterdam',
    country: 'Niederlande',
    image: '/images/amsterdam.jpg',
    idea: 'Vier Tage Amsterdam mit Grachten, Museen, Fahrradtour und besonderen Restaurants',
  },
]

const steps = [
  {
    icon: Compass,
    eyebrow: 'Entdecken',
    title: 'Eine Idee wird zur Reise.',
    text: 'Beschreibe, was du erleben möchtest. Jetnity bringt Route, Zeit und Interessen in eine klare Form.',
  },
  {
    icon: Route,
    eyebrow: 'Planen',
    title: 'Alles bleibt an einem Ort.',
    text: 'Tagesplan, Karte, Buchungen und Mitreisende arbeiten in einer einzigen Reiseübersicht zusammen.',
  },
  {
    icon: BellRing,
    eyebrow: 'Reisen',
    title: 'Wichtige Hilfe im richtigen Moment.',
    text: 'Später begleiten dich Live-Hinweise zu Flügen, Dokumenten, Wetter und sinnvollen nächsten Schritten.',
  },
]

const cockpitBenefits = [
  { label: 'Tagesplan und Karte bleiben synchron', icon: Map },
  { label: 'Mitreisende planen gemeinsam', icon: Users },
  { label: 'Dokumente werden passend zugeordnet', icon: FileCheck2 },
  { label: 'Hinweise erscheinen genau zur richtigen Zeit', icon: BellRing },
]

export default function HomePage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <main className="bg-surface-75 text-brand-800">
      <section className="px-3 pb-16 pt-3 sm:px-5 sm:pb-24">
        <div className="relative mx-auto min-h-[520px] max-w-[1500px] overflow-hidden rounded-[32px] bg-brand-800 shadow-[0_28px_90px_rgba(15,46,42,0.18)] sm:min-h-[600px] sm:rounded-[40px] lg:min-h-[720px] short:min-h-0">
          <Image
            src="/images/hero-bali.png"
            alt="Reisterrassen und Palmen bei Sonnenuntergang auf Bali"
            fill
            priority
            sizes="(max-width: 1500px) 100vw, 1500px"
            className="object-cover object-center"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,27,23,0.92)_0%,rgba(7,27,23,0.78)_42%,rgba(7,27,23,0.18)_78%,rgba(7,27,23,0.28)_100%)]" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,27,23,0.52)_0%,transparent_46%)]" />

          <div className="relative z-10 mx-auto grid min-h-[520px] max-w-7xl items-center gap-10 px-5 py-12 sm:min-h-[600px] sm:px-10 sm:py-16 lg:min-h-[720px] lg:grid-cols-[minmax(0,650px)_minmax(0,1fr)] lg:px-14 xl:px-16 short:min-h-0">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-ink-300 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Eine Reise. Ein intelligenter Begleiter.
              </span>
              <h1 className="mt-6 max-w-3xl text-[clamp(34px,7vw,78px)] font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:leading-[0.98]">
                Deine ganze Reise. Einfach an einem Ort.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                Von der ersten Idee bis zur Rückkehr: Jetnity plant, ordnet und begleitet deine Reise persönlich und übersichtlich.
              </p>

              <form
                action="/planen"
                method="get"
                className="mt-8 max-w-2xl rounded-[24px] border border-white/15 bg-white p-2 shadow-[0_22px_60px_rgba(0,0,0,0.22)]"
              >
                <label htmlFor="travel-idea" className="sr-only">
                  Beschreibe deine Reiseidee
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
                    <MapPin className="h-5 w-5 shrink-0 text-brand-600" />
                    <input
                      id="travel-idea"
                      name="ziel"
                      required
                      minLength={3}
                      maxLength={1000}
                      placeholder="Wohin möchtest du reisen?"
                      className="h-11 w-full min-w-0 flex-1 bg-transparent text-base text-brand-800 outline-none placeholder:text-ink-650"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-citrus-400 px-5 text-sm font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:bg-citrus-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-citrus-400/40"
                  >
                    Reise planen
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/65">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-citrus-500" /> Kostenlos starten
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-citrus-500" /> Kein Konto nötig
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-citrus-500" /> Privat gespeichert
                </span>
              </div>
            </div>

            <div className="hidden justify-end lg:flex">
              <div className="w-full max-w-[390px] rotate-[1.5deg] rounded-[30px] border border-white/15 bg-white/95 p-4 text-brand-800 shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                <div className="rounded-[22px] bg-surface-75 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Dein Entwurf</p>
                      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Bali · 14 Tage</h2>
                      <p className="mt-1 text-xs text-ink-700">2 Reisende · ausgewogen</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-800 text-white">
                      <Map className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-5 space-y-2.5">
                    {[
                      ['01–04', 'Ubud', 'Natur · Kulinarik'],
                      ['05–08', 'Nusa Lembongan', 'Strand · Erholung'],
                      ['09–14', 'Uluwatu', 'Küste · Sonnenuntergänge'],
                    ].map(([days, place, tags]) => (
                      <div key={place} className="flex items-center gap-3 rounded-2xl bg-white p-3">
                        <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-surface-100 text-[10px] font-bold text-brand-600">{days}</span>
                        <span className="min-w-0">
                          <strong className="block text-sm font-semibold">{place}</strong>
                          <span className="block truncate text-[11px] text-ink-700">{tags}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-[20px] bg-brand-800 px-4 py-3 text-white">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <Sparkles className="h-4 w-4 text-citrus-400" />
                    Bereit zum Verfeinern
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/70" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="so-funktionierts" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Ein klarer Weg</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Nicht mehr Apps. Weniger Reisestress.
          </h2>
          <p className="mt-4 text-base leading-7 text-ink-700">
            Jetnity zeigt nur, was für den nächsten Schritt wichtig ist. Alle Funktionen bleiben mit deiner Reise verbunden.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <article key={step.title} className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_16px_50px_rgba(15,46,42,0.05)] sm:p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-100 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">{step.eyebrow}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-700">{step.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="px-3 py-10 sm:px-5 sm:py-16">
        <div className="mx-auto max-w-[1450px] overflow-hidden rounded-[36px] bg-surface-100 px-5 py-12 sm:px-10 sm:py-16 lg:px-16">
          <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="min-w-0 max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Das geplante Reise-Cockpit</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Eine Ansicht, die deine Reise versteht.
              </h2>
              <p className="mt-5 text-base leading-7 text-ink-800">
                Tagesplan, Karte, Buchungen und Hinweise erscheinen nicht als getrennte Produkte, sondern im Zusammenhang deiner Reise.
              </p>
              <ul className="mt-7 space-y-3 text-sm text-ink-950">
                {cockpitBenefits.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <li key={benefit.label} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      {benefit.label}
                    </li>
                  )
                })}
              </ul>
              <Link
                href="/planen"
                className="-mx-2 mt-6 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-brand-800 underline decoration-ink-500 underline-offset-4 transition hover:decoration-brand-800"
              >
                Eigenen Entwurf erstellen
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>

            <div className="min-w-0 rounded-[30px] border border-white/70 bg-surface-0 p-3 shadow-[0_30px_80px_rgba(15,46,42,0.13)] sm:p-4">
              <div className="grid min-h-[420px] overflow-hidden rounded-[23px] border border-line-200 bg-white sm:min-h-[500px] md:grid-cols-[210px_minmax(0,1fr)]">
                <div className="min-w-0 border-b border-line-200 bg-surface-25 p-4 md:border-b-0 md:border-r">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700">Portugal · 8 Tage</p>
                  <ScrollRow
                    label="Reiseabschnitte Portugal"
                    className="mt-4"
                    fadeFromClassName="from-surface-25"
                    viewportClassName="snap-x snap-mandatory gap-2 pb-1 md:block md:space-y-2 md:overflow-x-visible md:pb-0"
                  >
                    {['Lissabon', 'Sintra', 'Porto', 'Douro'].map((place, index) => (
                      <div key={place} className={`min-w-[140px] shrink-0 snap-start rounded-2xl px-3 py-3 md:min-w-0 md:shrink ${index === 1 ? 'bg-brand-800 text-white' : 'bg-white text-ink-800'}`}>
                        <span className="block text-[10px] opacity-65">Tag {index * 2 + 1}–{index * 2 + 2}</span>
                        <strong className="mt-0.5 block text-sm font-semibold">{place}</strong>
                      </div>
                    ))}
                  </ScrollRow>
                </div>
                <div className="grid min-w-0 grid-rows-[1fr_auto] sm:min-h-[390px]">
                  <div className="relative min-h-[220px] overflow-hidden bg-surface-200">
                    <div aria-hidden="true" className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_30%,#ffffff_0_2px,transparent_3px),radial-gradient(circle_at_65%_58%,#ffffff_0_2px,transparent_3px),linear-gradient(120deg,transparent_0_42%,rgba(29,113,94,.35)_43%_45%,transparent_46%)] [background-size:70px_70px,90px_90px,100%_100%]" />
                    <div className="absolute left-[20%] top-[28%] flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-brand-600 text-xs font-bold text-white shadow-lg">1</div>
                    <div className="absolute left-[61%] top-[54%] flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-citrus-400 text-xs font-bold text-brand-800 shadow-lg">2</div>
                    <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur sm:inset-x-auto sm:left-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-600">Heute sinnvoll</p>
                      <p className="mt-1 text-sm font-semibold">Sintra früh starten</p>
                      <p className="mt-0.5 text-[11px] text-ink-700">Weniger Andrang vor 09:30 Uhr</p>
                    </div>
                  </div>
                  <div className="grid gap-3 border-t border-line-200 p-4 sm:grid-cols-3">
                    {[
                      ['09:10', 'Zug nach Sintra'],
                      ['10:00', 'Palácio da Pena'],
                      ['15:30', 'Altstadt & Café'],
                    ].map(([time, event]) => (
                      <div key={event} className="rounded-2xl bg-surface-75 p-3">
                        <span className="text-[10px] font-semibold text-brand-600">{time}</span>
                        <strong className="mt-1 block text-xs font-semibold">{event}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="entdecken" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Entdecken</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Eine gute Reise beginnt mit dem richtigen Gefühl.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-ink-700">
            Ausgewählte Ideen statt endlosem Scrollen. Jede Inspiration lässt sich direkt in einen privaten Entwurf verwandeln.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((destination) => (
            <Link
              key={destination.name}
              href={`/planen?ziel=${encodeURIComponent(destination.name)}&idee=${encodeURIComponent(destination.idea)}`}
              className="group relative min-h-[340px] overflow-hidden rounded-[28px] bg-brand-800 text-white sm:min-h-[420px] short:min-h-[240px]"
            >
              <Image
                src={destination.image}
                alt={`${destination.name}, ${destination.country}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="text-xs text-white/65">{destination.country}</span>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <h3 className="text-2xl font-semibold tracking-[-0.03em]">{destination.name}</h3>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 transition group-hover:bg-white group-hover:text-brand-800">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="pro" className="px-3 pb-16 sm:px-5 sm:pb-24">
        <div className="relative mx-auto max-w-[1450px] overflow-hidden rounded-[36px] bg-brand-800 px-5 py-12 text-white sm:px-12 sm:py-20 lg:px-16">
          <div aria-hidden="true" className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-citrus-400/10 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0 max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-ink-300">
                <MessageCircle className="h-3.5 w-3.5" /> Jetnity Pro
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em] sm:text-6xl">
                Unterwegs einen Schritt voraus.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
                Live-Flughinweise, Offline-Zugriff, Dokumentenerinnerungen und persönliche Unterstützung werden später zu einem einzigen Schutzpaket verbunden.
              </p>
            </div>
            <Link
              href="/planen"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-citrus-400 px-6 text-sm font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:bg-citrus-300"
            >
              Kostenlos beginnen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Jetnity',
            url: appUrl,
            applicationCategory: 'TravelApplication',
            operatingSystem: 'Web',
            description: 'Eine persönliche Plattform für Reiseplanung und Reisebegleitung.',
          }),
        }}
      />
    </main>
  )
}
