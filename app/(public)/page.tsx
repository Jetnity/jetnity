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
    <main className="overflow-hidden bg-[#f5f4ee] text-[#153a33]">
      <section className="px-3 pb-16 pt-3 sm:px-5 sm:pb-24">
        <div className="relative mx-auto min-h-[720px] max-w-[1500px] overflow-hidden rounded-[32px] bg-[#153a33] shadow-[0_28px_90px_rgba(15,46,42,0.18)] sm:rounded-[40px]">
          <Image
            src="/images/hero-bali.png"
            alt="Reisterrassen und Palmen bei Sonnenuntergang auf Bali"
            fill
            priority
            sizes="(max-width: 1500px) 100vw, 1500px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,27,23,0.92)_0%,rgba(7,27,23,0.78)_42%,rgba(7,27,23,0.18)_78%,rgba(7,27,23,0.28)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,27,23,0.52)_0%,transparent_46%)]" />

          <div className="relative z-10 mx-auto grid min-h-[720px] max-w-7xl items-center gap-10 px-6 py-16 sm:px-10 lg:grid-cols-[minmax(0,650px)_1fr] lg:px-14 xl:px-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#ddf4e9] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Eine Reise. Ein intelligenter Begleiter.
              </span>
              <h1 className="mt-6 max-w-3xl text-[clamp(42px,7vw,78px)] font-semibold leading-[0.98] tracking-[-0.055em] text-white">
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
                    <MapPin className="h-5 w-5 shrink-0 text-[#1d715e]" />
                    <input
                      id="travel-idea"
                      name="ziel"
                      required
                      minLength={3}
                      maxLength={1000}
                      placeholder="Wohin möchtest du reisen?"
                      className="h-11 min-w-0 flex-1 bg-transparent text-base text-[#153a33] outline-none placeholder:text-[#82928d]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#dff47a] px-5 text-sm font-semibold text-[#153a33] transition hover:-translate-y-0.5 hover:bg-[#e8fa91] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#dff47a]/40"
                  >
                    Reise planen
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/65">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#cfe99a]" /> Kostenlos starten
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-[#cfe99a]" /> Kein Konto nötig
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#cfe99a]" /> Privat gespeichert
                </span>
              </div>
            </div>

            <div className="hidden justify-end lg:flex">
              <div className="w-full max-w-[390px] rotate-[1.5deg] rounded-[30px] border border-white/15 bg-white/95 p-4 text-[#153a33] shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl">
                <div className="rounded-[22px] bg-[#f1f5ef] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1d715e]">Dein Entwurf</p>
                      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Bali · 14 Tage</h2>
                      <p className="mt-1 text-xs text-[#71827c]">2 Reisende · ausgewogen</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#153a33] text-white">
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
                        <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-[#e3f1eb] text-[10px] font-bold text-[#1d715e]">{days}</span>
                        <span className="min-w-0">
                          <strong className="block text-sm font-semibold">{place}</strong>
                          <span className="block truncate text-[11px] text-[#788983]">{tags}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-[20px] bg-[#153a33] px-4 py-3 text-white">
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <Sparkles className="h-4 w-4 text-[#dff47a]" />
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d715e]">Ein klarer Weg</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Nicht mehr Apps. Weniger Reisestress.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#637771]">
            Jetnity zeigt nur, was für den nächsten Schritt wichtig ist. Alle Funktionen bleiben mit deiner Reise verbunden.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <article key={step.title} className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_16px_50px_rgba(15,46,42,0.05)] sm:p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e5f2ec] text-[#1d715e]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#1d715e]">{step.eyebrow}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6b7d77]">{step.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="px-3 py-10 sm:px-5 sm:py-16">
        <div className="mx-auto max-w-[1450px] overflow-hidden rounded-[36px] bg-[#e6efe9] px-5 py-12 sm:px-10 sm:py-16 lg:px-16">
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d715e]">Das geplante Reise-Cockpit</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Eine Ansicht, die deine Reise versteht.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#5f756d]">
                Tagesplan, Karte, Buchungen und Hinweise erscheinen nicht als getrennte Produkte, sondern im Zusammenhang deiner Reise.
              </p>
              <ul className="mt-7 space-y-3 text-sm text-[#39534b]">
                {cockpitBenefits.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <li key={benefit.label} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1d715e]">
                        <Icon className="h-4 w-4" />
                      </span>
                      {benefit.label}
                    </li>
                  )
                })}
              </ul>
              <Link href="/planen" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#153a33] underline decoration-[#9db8ad] underline-offset-4 transition hover:decoration-[#153a33]">
                Eigenen Entwurf erstellen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-[30px] border border-white/70 bg-[#f9faf7] p-3 shadow-[0_30px_80px_rgba(15,46,42,0.13)] sm:p-4">
              <div className="grid min-h-[500px] overflow-hidden rounded-[23px] border border-[#e2e8e3] bg-white md:grid-cols-[210px_1fr]">
                <div className="border-b border-[#e7ece8] bg-[#f4f7f3] p-4 md:border-b-0 md:border-r">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b8c86]">Portugal · 8 Tage</p>
                  <div className="mt-4 flex gap-2 overflow-x-auto md:block md:space-y-2">
                    {['Lissabon', 'Sintra', 'Porto', 'Douro'].map((place, index) => (
                      <div key={place} className={`min-w-[150px] rounded-2xl px-3 py-3 md:min-w-0 ${index === 1 ? 'bg-[#153a33] text-white' : 'bg-white text-[#546b63]'}`}>
                        <span className="block text-[10px] opacity-65">Tag {index * 2 + 1}–{index * 2 + 2}</span>
                        <strong className="mt-0.5 block text-sm font-semibold">{place}</strong>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid min-h-[390px] grid-rows-[1fr_auto]">
                  <div className="relative overflow-hidden bg-[#d8e4dc]">
                    <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_30%,#ffffff_0_2px,transparent_3px),radial-gradient(circle_at_65%_58%,#ffffff_0_2px,transparent_3px),linear-gradient(120deg,transparent_0_42%,rgba(29,113,94,.35)_43%_45%,transparent_46%)] [background-size:70px_70px,90px_90px,100%_100%]" />
                    <div className="absolute left-[20%] top-[28%] flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#1d715e] text-xs font-bold text-white shadow-lg">1</div>
                    <div className="absolute left-[61%] top-[54%] flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#dff47a] text-xs font-bold text-[#153a33] shadow-lg">2</div>
                    <div className="absolute bottom-5 left-5 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1d715e]">Heute sinnvoll</p>
                      <p className="mt-1 text-sm font-semibold">Sintra früh starten</p>
                      <p className="mt-0.5 text-[11px] text-[#73857f]">Weniger Andrang vor 09:30 Uhr</p>
                    </div>
                  </div>
                  <div className="grid gap-3 border-t border-[#e5eae6] p-4 sm:grid-cols-3">
                    {[
                      ['09:10', 'Zug nach Sintra'],
                      ['10:00', 'Palácio da Pena'],
                      ['15:30', 'Altstadt & Café'],
                    ].map(([time, event]) => (
                      <div key={event} className="rounded-2xl bg-[#f5f7f3] p-3">
                        <span className="text-[10px] font-semibold text-[#1d715e]">{time}</span>
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
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d715e]">Entdecken</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Eine gute Reise beginnt mit dem richtigen Gefühl.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#6a7c76]">
            Ausgewählte Ideen statt endlosem Scrollen. Jede Inspiration lässt sich direkt in einen privaten Entwurf verwandeln.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((destination) => (
            <Link
              key={destination.name}
              href={`/planen?ziel=${encodeURIComponent(destination.name)}&idee=${encodeURIComponent(destination.idea)}`}
              className="group relative min-h-[420px] overflow-hidden rounded-[28px] bg-[#153a33] text-white"
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
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 transition group-hover:bg-white group-hover:text-[#153a33]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="pro" className="px-3 pb-16 sm:px-5 sm:pb-24">
        <div className="relative mx-auto max-w-[1450px] overflow-hidden rounded-[36px] bg-[#153a33] px-6 py-14 text-white sm:px-12 sm:py-20 lg:px-16">
          <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-[#dff47a]/10 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#ddf4e9]">
                <MessageCircle className="h-3.5 w-3.5" /> Jetnity Pro
              </span>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                Unterwegs einen Schritt voraus.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
                Live-Flughinweise, Offline-Zugriff, Dokumentenerinnerungen und persönliche Unterstützung werden später zu einem einzigen Schutzpaket verbunden.
              </p>
            </div>
            <Link
              href="/planen"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#dff47a] px-6 text-sm font-semibold text-[#153a33] transition hover:-translate-y-0.5 hover:bg-[#e8fa91]"
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
