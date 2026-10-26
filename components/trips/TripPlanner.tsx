'use client'

// components/trips/TripPlanner.tsx
//
// Das Formular, aus dem eine Reise entsteht.
//
// Es hat zwei Ausgänge, und der Unterschied ist die Ablage, nicht das Formular:
//
//   · Ohne Konto entsteht die Reise im `localStorage`. Genau eine – die
//     Produktregel steht in `lib/trips/gastspeicher.ts` und wird dort
//     durchgesetzt, nicht hier.
//   · Mit Konto entsteht sie in der Datenbank, über `public.reise_anlegen()`.
//
// Beide Wege schicken dieselbe geprüfte Eingabe. Die Prüfung selbst liegt in
// `lib/trips/schema.ts`: Dieselben Bedingungen gelten im Browser, in der Server
// Action und in der Datenbank, und formuliert sind sie einmal.
//
// `clientRef` entsteht beim ersten Absenden und bleibt, bis das Formular
// verlassen wird. Dadurch ist ein zweiter Anlauf nach einem Netzwerkabbruch
// derselbe Vorgang und keine zweite Reise. Ein abgelehnter Aufruf ersetzt
// die Kennung nicht.
//
// Solange der Versuch läuft, bleibt der abgeschickte Entwurf stehen. Ein
// schon an das Konto gesendeter Aufruf wird nicht als abgebrochen behandelt.

import * as React from 'react'
import type { Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Cloud,
  MapPin,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from 'lucide-react'

import OrtSuche from '@/components/places/OrtSuche'
import { Feld, FELD_FEHLER_RAHMEN, FormularZusammenfassung } from '@/components/ui/feld'
import {
  FORMULAR_ZUSAMMENFASSUNG,
  REISE_FORMULAR_FELDER,
  erstesFehlerfeld,
  feldFehlerId,
  feldfehlerLoeschen,
  reiseFormularPruefen,
  zusaetzlicheZielePruefen,
  zusaetzlichesZielFeld,
  type Feldfehler,
  type ReiseFormularFeld,
} from '@/lib/formular/feldfehler'
import { feldInSichtNehmen } from '@/lib/formular/sicht'
import { reiseorteBestaetigen } from '@/lib/places/aktionen'
import { type OrtAuswahl } from '@/lib/places/auswahl'
import { ORT_MELDUNG } from '@/lib/places/pruefen'
import {
  tripPlannerPrimaerMitWeiteremTauschen,
  tripPlannerRouteVorbelegen,
} from '@/lib/places/route-einstieg'
import TripStageDayAllocation, {
  type TageszuordnungAnspruch,
} from '@/components/trips/TripStageDayAllocation'
import { reiseAnlegen } from '@/lib/trips/aktionen'
import { createDayPositions, tageszuordnungAngleichen } from '@/lib/trips/create-day-assignment'
import { ZEITRAUM_ZU_LANG, reisetageBauen, zeitraumIstZuLang } from '@/lib/trips/tage'
import {
  CREATE_PERSISTENZ_INTERESSEN,
  CREATE_PERSISTENZ_TEMPO,
  gastCreateGateMeldung,
  gastCreateJetztPruefen,
} from '@/lib/trips/create-entry'
import {
  GastreiseBelegtOhneKennungFehler,
  GastreiseBestehtFehler,
  GastreiseUnbrauchbarFehler,
  GastspeicherUnlesbarFehler,
  SpeicherFehler,
  gastreiseAnlegen,
  kennungErzeugen,
} from '@/lib/trips/gastspeicher'
import { GRENZEN, neueReiseSchema } from '@/lib/trips/schema'
import { cn } from '@/lib/utils'
import { usePlanningCreationLifecycle } from '@/components/trips/usePlanningCreationLifecycle'

const TRANSPORT =
  'Die Reise konnte gerade nicht erstellt werden. Deine Angaben bleiben hier. Bitte versuche es erneut.'

type ZusaetzlichesZiel = {
  key: string
  ort: OrtAuswahl | null
  text: string
}

type TripPlannerProps = {
  /** Kommt aus der Server-Komponente: `auth.getUser()` auf dem Server, nicht geraten. */
  angemeldet: boolean
  initialDestination?: string
  initialDestinationId?: string
  initialIdea?: string
  initialWeitereZiele?: { id: string; name: string }[]
}

/**
 * Feldgestaltung aller Eingaben dieses Formulars.
 * `min-w-0` ist notwendig, weil die Felder in Grid-Spuren liegen: ohne die
 * Angabe waechst die Spur auf die inhaltsbasierte Mindestbreite des nativen
 * Steuerelements, was auf schmalen Geraeten das Layout sprengt.
 */
const fieldClass =
  'h-12 w-full min-w-0 max-w-full rounded-2xl border border-line-200 bg-surface-0 pl-10 pr-4 text-base ' +
  'outline-none transition placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10'

const fieldIconClass =
  'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700'

/**
 * Oversized-text reflow: Feld already has `min-w-0`, but its implicit grid
 * column still sizes to the label min-content. The optional marker is an
 * adjacent inline span without a wrap opportunity, so
 * `Gesamtbudget(optional)` stays one 330px sequence and overflows a 268px
 * track. Constrain the column and allow the label/marker to wrap. Do not
 * clip, shrink text, or hide the marker.
 */
const feldReflowClass =
  'grid-cols-[minmax(0,1fr)] [&_label]:min-w-0 [&_label]:max-w-full [&_label]:break-words [&_label>span]:inline-block'

function Planungsgruppe({
  id,
  titel,
  children,
}: {
  id: string
  titel: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="grid min-w-0 max-w-full gap-4">
      <h3
        id={id}
        className="min-w-0 max-w-full break-words border-b border-line-200 pb-2 text-base font-semibold tracking-[-0.02em] text-brand-900"
      >
        {titel}
      </h3>
      {children}
    </section>
  )
}

function heuteIso() {
  const jetzt = new Date()
  const lokal = new Date(jetzt.getTime() - jetzt.getTimezoneOffset() * 60_000)
  return lokal.toISOString().slice(0, 10)
}

export default function TripPlanner({
  angemeldet,
  initialDestination = '',
  initialDestinationId = '',
  initialIdea = '',
  initialWeitereZiele = [],
}: TripPlannerProps) {
  const router = useRouter()
  const lifecycle = usePlanningCreationLifecycle()
  const { laeuft } = lifecycle
  const handoff = tripPlannerRouteVorbelegen({
    destinationId: initialDestinationId,
    destination: initialDestination,
    weitereZiele: initialWeitereZiele,
  })
  const [primaerKey, setPrimaerKey] = React.useState(handoff.primaerKey)
  const [destination, setDestination] = React.useState(handoff.primaer?.name ?? initialDestination)
  const [destinationOrt, setDestinationOrt] = React.useState<OrtAuswahl | null>(handoff.primaer)
  const [zusaetzlicheZiele, setZusaetzlicheZiele] = React.useState<ZusaetzlichesZiel[]>(
    handoff.weitere.map((ziel) => ({ key: ziel.key, ort: ziel.ort, text: ziel.text })),
  )
  const [origin, setOrigin] = React.useState('')
  const [originOrt, setOriginOrt] = React.useState<OrtAuswahl | null>(null)
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [travellers, setTravellers] = React.useState<number | ''>(2)
  const [budget, setBudget] = React.useState('')
  const [travelWish, setTravelWish] = React.useState(initialIdea)
  const [zuordnungAktiv, setZuordnungAktiv] = React.useState(false)
  const [zuordnung, setZuordnung] = React.useState<TageszuordnungAnspruch[]>([])
  const [zuordnungHinweis, setZuordnungHinweis] = React.useState('')
  const [meldung, setMeldung] = React.useState('')
  const [feldfehler, setFeldfehler] = React.useState<Feldfehler<string>>({})
  const [bestehendeReise, setBestehendeReise] = React.useState('')
  const felder = React.useRef<Partial<Record<ReiseFormularFeld, HTMLInputElement | null>>>({})
  const zusaetzlicheFelder = React.useRef<Record<string, HTMLInputElement | null>>({})
  const anvisiert = React.useRef<string | null>(null)
  const naechsterExtraKey = React.useRef(handoff.weitere.length + 1)
  const fokusNachTausch = React.useRef<'primaer-runter' | 'extra-hoch' | null>(null)
  const primaerRunter = React.useRef<HTMLButtonElement>(null)
  const extraHoch = React.useRef<HTMLButtonElement>(null)

  // Bleibt über einen erneuten Anlauf hinweg gleich. Das ist der ganze Zweck:
  // dieselbe Kennung, dieselbe Reise.
  const clientRef = React.useRef('')

  const zuordnungZiele = React.useMemo(() => {
    const liste: { key: string; position: number; label: string }[] = []
    if (destinationOrt) liste.push({ key: primaerKey, position: 1, label: destinationOrt.name })
    for (const ziel of zusaetzlicheZiele) {
      if (!ziel.ort) continue
      liste.push({ key: ziel.key, position: liste.length + 1, label: ziel.ort.name })
    }
    return liste
  }, [destinationOrt, primaerKey, zusaetzlicheZiele])
  const zuordnungSchluessel = zuordnungZiele.map((ziel) => ziel.key).join('\u0000')
  const abgleichSignatur = `${zuordnungSchluessel}\u0001${startDate}\u0001${endDate}`
  const [geseheneSignatur, setGeseheneSignatur] = React.useState(abgleichSignatur)
  if (geseheneSignatur !== abgleichSignatur) {
    setGeseheneSignatur(abgleichSignatur)
    if (zuordnungZiele.length < 2) {
      if (zuordnung.length > 0) {
        setZuordnung([])
        setZuordnungHinweis(
          'Bei einem Reiseziel gehören alle Tage zu diesem Ziel. Die Aufteilung wurde zurückgesetzt.',
        )
      }
      if (zuordnungAktiv) setZuordnungAktiv(false)
    } else {
      const angeglichen = tageszuordnungAngleichen({
        claims: zuordnung,
        occurrenceKeys: zuordnungZiele.map((ziel) => ziel.key),
        startDate,
        endDate,
      })
      if (angeglichen.hinweis) setZuordnungHinweis(angeglichen.hinweis)
      if (JSON.stringify(angeglichen.claims) !== JSON.stringify(zuordnung)) {
        setZuordnung(angeglichen.claims)
      }
    }
  }

  const zeitraumZuLang = Boolean(startDate && endDate && startDate <= endDate && zeitraumIstZuLang(startDate, endDate))

  const zuordnungStand = React.useMemo(() => {
    const tage =
      startDate && endDate && startDate <= endDate && !zeitraumIstZuLang(startDate, endDate)
        ? reisetageBauen(startDate, endDate)
        : []
    const leer = {
      zugeordnet: 0,
      ohneZiel: tage.length,
      reisetage: tage.length,
      fehler: '',
      focusId: null as string | null,
      claims: null as { occurrence: number; startDate: string; endDate: string }[] | null,
    }
    if (!zuordnungAktiv || zuordnungZiele.length < 2) return leer
    const unvollstaendig = zuordnung.find((eintrag) => (eintrag.startDate === '') !== (eintrag.endDate === ''))
    if (unvollstaendig) {
      return {
        ...leer,
        fehler: 'Bitte gib für die Tageszuordnung beide Daten an.',
        focusId: `zuordnung-${unvollstaendig.occurrenceKey}-${unvollstaendig.startDate === '' ? 'von' : 'bis'}`,
      }
    }
    const claims = zuordnung.flatMap((eintrag) => {
      if (!eintrag.startDate || !eintrag.endDate) return []
      const ziel = zuordnungZiele.find((kandidat) => kandidat.key === eintrag.occurrenceKey)
      return ziel ? [{ occurrence: ziel.position, startDate: eintrag.startDate, endDate: eintrag.endDate }] : []
    })
    const pruefung = createDayPositions({
      stageCount: zuordnungZiele.length,
      startDate,
      endDate,
      allocation: { claims },
    })
    if (!pruefung.ok) {
      const ziel = zuordnungZiele.find((eintrag) => eintrag.position === pruefung.focusOccurrence)
      return {
        ...leer,
        fehler: pruefung.message,
        focusId: ziel ? `zuordnung-${ziel.key}-von` : 'zuordnung-aktiv',
      }
    }
    return {
      zugeordnet: pruefung.assigned,
      ohneZiel: pruefung.unassigned,
      reisetage: tage.length,
      fehler: '',
      focusId: null,
      claims,
    }
  }, [zuordnungAktiv, zuordnung, zuordnungZiele, startDate, endDate])

  React.useEffect(() => {
    if (!anvisiert.current) return
    const feld = anvisiert.current
    anvisiert.current = null
    if (feld.startsWith('zuordnung-')) {
      const knoten = document.getElementById(feld)
      if (knoten instanceof HTMLElement) feldInSichtNehmen(knoten)
      return
    }
    if (feld.startsWith('zusaetzlichesZiel-')) {
      feldInSichtNehmen(zusaetzlicheFelder.current[feld])
      return
    }
    feldInSichtNehmen(felder.current[feld as ReiseFormularFeld])
  }, [feldfehler])

  React.useLayoutEffect(() => {
    const ziel = fokusNachTausch.current
    if (!ziel) return
    fokusNachTausch.current = null
    if (ziel === 'primaer-runter') feldInSichtNehmen(primaerRunter.current)
    if (ziel === 'extra-hoch') feldInSichtNehmen(extraHoch.current)
  }, [primaerKey, destination, destinationOrt, zusaetzlicheZiele])

  const feldKorrigieren = (feld: string) => {
    setFeldfehler((bisher) => feldfehlerLoeschen(bisher, feld))
  }

  const extraHinzufuegen = () => {
    if (lifecycle.gesperrt()) return
    if (!destinationOrt) return
    if (zusaetzlicheZiele.length >= GRENZEN.etappenJeReise - 1) return
    const key = String(naechsterExtraKey.current)
    naechsterExtraKey.current += 1
    setZusaetzlicheZiele((bisher) => [...bisher, { key, ort: null, text: '' }])
  }

  const extraEntfernen = (key: string) => {
    if (lifecycle.gesperrt()) return
    setZusaetzlicheZiele((bisher) => bisher.filter((ziel) => ziel.key !== key))
    setFeldfehler((bisher) => feldfehlerLoeschen(bisher, zusaetzlichesZielFeld(key)))
    delete zusaetzlicheFelder.current[zusaetzlichesZielFeld(key)]
  }

  const extraNachOben = (index: number, fokus: 'mitgenommen' | 'zurueckgelassen' = 'mitgenommen') => {
    if (lifecycle.gesperrt()) return
    if (index === 0) {
      const extra = zusaetzlicheZiele[0]
      if (!extra) return
      const stand = tripPlannerPrimaerMitWeiteremTauschen(
        {
          primaerKey,
          primaerOrt: destinationOrt,
          primaerText: destination,
          weitere: zusaetzlicheZiele,
        },
        0,
      )
      setPrimaerKey(stand.primaerKey)
      setDestinationOrt(stand.primaerOrt)
      setDestination(stand.primaerText)
      setZusaetzlicheZiele(stand.weitere)
      setFeldfehler((bisher) => {
        const extraFeld = zusaetzlichesZielFeld(extra.key)
        const neuesExtra = stand.weitere[0]
        const naechste: Feldfehler<string> = { ...bisher }
        const destFehler = naechste.destination
        const extraFehler = naechste[extraFeld]
        delete naechste.destination
        delete naechste[extraFeld]
        if (extraFehler && !stand.primaerOrt) naechste.destination = extraFehler
        if (destFehler && neuesExtra) naechste[zusaetzlichesZielFeld(neuesExtra.key)] = destFehler
        if (stand.primaerOrt) delete naechste.destination
        return naechste
      })
      fokusNachTausch.current = fokus === 'mitgenommen' ? 'primaer-runter' : 'extra-hoch'
      return
    }
    setZusaetzlicheZiele((bisher) => {
      const naechste = [...bisher]
      const aktuell = naechste[index]
      naechste[index] = naechste[index - 1]
      naechste[index - 1] = aktuell
      return naechste
    })
  }

  const extraNachUnten = (index: number) => {
    if (lifecycle.gesperrt()) return
    if (index < 0 || index >= zusaetzlicheZiele.length - 1) return
    setZusaetzlicheZiele((bisher) => {
      const naechste = [...bisher]
      const aktuell = naechste[index]
      naechste[index] = naechste[index + 1]
      naechste[index + 1] = aktuell
      return naechste
    })
  }

  const primaerNachUnten = () => {
    extraNachOben(0, 'zurueckgelassen')
  }

  const absenden = async (ereignis: React.FormEvent<HTMLFormElement>) => {
    ereignis.preventDefault()
    if (lifecycle.gesperrt()) return

    const gate = gastCreateJetztPruefen(angemeldet)
    if (!gate.erlaubt) {
      setBestehendeReise(gate.grund === 'besteht' ? gate.bestehendeId : '')
      setMeldung(gastCreateGateMeldung(gate))
      return
    }

    setMeldung('')
    setBestehendeReise('')

    if (!clientRef.current) clientRef.current = kennungErzeugen('trip')

    const sichtbar = reiseFormularPruefen({
      destination,
      destinationPlaceId: destinationOrt?.id,
      origin,
      originPlaceId: originOrt?.id,
      startDate,
      endDate,
      travellers,
      budget,
    })
    const extraFehler = zusaetzlicheZielePruefen(
      zusaetzlicheZiele.map((ziel) => ({
        key: ziel.key,
        text: ziel.text,
        placeId: ziel.ort?.id,
      })),
    )
    const sichtbarFehler: Feldfehler<string> = { ...sichtbar.fehler, ...extraFehler }
    const erstesExtra = zusaetzlicheZiele.find((ziel) => extraFehler[zusaetzlichesZielFeld(ziel.key)])
    const erstes = sichtbar.erstes ?? (erstesExtra ? zusaetzlichesZielFeld(erstesExtra.key) : null)
    if (erstes) {
      anvisiert.current = erstes
      setFeldfehler(sichtbarFehler)
      return
    }
    if (zeitraumZuLang) {
      anvisiert.current = 'endDate'
      setFeldfehler({ endDate: ZEITRAUM_ZU_LANG })
      return
    }
    if (zuordnungAktiv && zuordnungStand.fehler) {
      anvisiert.current = zuordnungStand.focusId
      setFeldfehler({ dayAllocation: zuordnungStand.fehler })
      return
    }
    setFeldfehler({})

    const geprueft = neueReiseSchema.safeParse({
      clientRef: clientRef.current,
      title: destinationOrt?.name ?? destination,
      destination: destinationOrt?.name ?? destination,
      destinationPlaceId: destinationOrt?.id,
      weitereDestinationPlaceIds: zusaetzlicheZiele.map((ziel) => ziel.ort?.id).filter((id): id is string => Boolean(id)),
      origin: originOrt?.name ?? origin,
      originPlaceId: originOrt?.id,
      startDate,
      endDate,
      travellers: typeof travellers === 'number' ? travellers : 1,
      currency: 'CHF',
      budgetAmount: budget === '' ? null : Number(budget),
      pace: CREATE_PERSISTENZ_TEMPO,
      interests: CREATE_PERSISTENZ_INTERESSEN,
      travelWish,
      ...(zuordnungAktiv && zuordnungStand.claims && zuordnungStand.claims.length > 0
        ? { dayAllocation: { claims: zuordnungStand.claims } }
        : {}),
    })

    if (!geprueft.success) {
      const rest: Feldfehler<string> = {}
      for (const issue of geprueft.error.issues) {
        const pfad = issue.path[0]
        if (pfad === 'startDate' || pfad === 'endDate' || pfad === 'travellers') rest[String(pfad)] = issue.message
        if (pfad === 'budgetAmount') rest.budget = issue.message
        if (pfad === 'destinationPlaceId' || pfad === 'destination') rest.destination = issue.message
        if (pfad === 'originPlaceId' || pfad === 'origin') rest.origin = issue.message
        if (pfad === 'weitereDestinationPlaceIds') {
          const index = typeof issue.path[1] === 'number' ? issue.path[1] : 0
          const extra = zusaetzlicheZiele[index]
          if (extra) rest[zusaetzlichesZielFeld(extra.key)] = issue.message
        }
        if (pfad === 'dayAllocation') rest.dayAllocation = issue.message
      }
      const extraKey = zusaetzlicheZiele
        .map((ziel) => zusaetzlichesZielFeld(ziel.key))
        .find((feld) => rest[feld])
      anvisiert.current =
        (rest.dayAllocation ? zuordnungStand.focusId ?? 'zuordnung-aktiv' : null) ??
        erstesFehlerfeld(rest, REISE_FORMULAR_FELDER) ??
        extraKey ??
        null
      setFeldfehler(rest)
      return
    }

    const vorNetz = gastCreateJetztPruefen(angemeldet)
    if (!vorNetz.erlaubt) {
      setBestehendeReise(vorNetz.grund === 'besteht' ? vorNetz.bestehendeId : '')
      setMeldung(gastCreateGateMeldung(vorNetz))
      return
    }

    const lauf = lifecycle.beginnen()
    if (lauf === null) return
    const entwurf = geprueft.data

    try {
      const orte = await reiseorteBestaetigen({
        zielId: entwurf.destinationPlaceId,
        abreiseId: entwurf.originPlaceId,
        weitereZielIds: entwurf.weitereDestinationPlaceIds,
      })
      if (!lifecycle.aktuell(lauf)) return
      if (!orte.ok) {
        const extra =
          orte.feld === 'destination' && typeof orte.zielIndex === 'number' && orte.zielIndex > 0
            ? zusaetzlicheZiele[orte.zielIndex - 1]
            : null
        const amFeld: Feldfehler<string> = extra
          ? { [zusaetzlichesZielFeld(extra.key)]: orte.meldung }
          : orte.feld === 'origin' ||
              orte.meldung === ORT_MELDUNG.abreiseFehlt ||
              orte.meldung === ORT_MELDUNG.abreiseUnbekannt
            ? { origin: orte.meldung }
            : orte.feld === 'destination' ||
                orte.meldung === ORT_MELDUNG.zielFehlt ||
                orte.meldung === ORT_MELDUNG.zielUnbekannt
              ? { destination: orte.meldung }
              : {}
        if (Object.keys(amFeld).length > 0) {
          anvisiert.current = extra
            ? zusaetzlichesZielFeld(extra.key)
            : erstesFehlerfeld(amFeld, REISE_FORMULAR_FELDER)
          setFeldfehler(amFeld)
        } else {
          setMeldung(orte.meldung)
        }
        lifecycle.beenden(lauf)
        return
      }

      if (angemeldet) {
        const ergebnis = await reiseAnlegen({
          ...entwurf,
          title: orte.ziel.name,
          destination: orte.ziel.name,
          destinationPlaceId: orte.ziel.id,
          weitereDestinationPlaceIds: orte.weitereZiele.map((ziel) => ziel.id),
          origin: orte.abreise.name,
          originPlaceId: orte.abreise.id,
        })
        // Der Konto-Aufruf ist bereits unterwegs. Diese Oberfläche kann ihn
        // nicht zurücknehmen; sie wendet nur noch ein lebendes Ergebnis an.
        if (!lifecycle.aktuell(lauf)) return
        if (!ergebnis.ok) {
          setMeldung(ergebnis.meldung)
          lifecycle.beenden(lauf)
          return
        }
        router.push(`/reisen/${ergebnis.wert}` as Route)
        return
      }

      if (!lifecycle.aktuell(lauf)) return
      try {
        const reise = gastreiseAnlegen(entwurf, orte)
        if (!lifecycle.aktuell(lauf)) return
        router.push(`/reisen/${reise.id}` as Route)
      } catch (fehler) {
        if (!lifecycle.aktuell(lauf)) return
        lifecycle.beenden(lauf)
        if (fehler instanceof GastreiseBestehtFehler) {
          setBestehendeReise(fehler.bestehendeId)
          setMeldung(fehler.message)
          return
        }
        if (
          fehler instanceof GastreiseUnbrauchbarFehler ||
          fehler instanceof GastspeicherUnlesbarFehler ||
          fehler instanceof GastreiseBelegtOhneKennungFehler
        ) {
          setBestehendeReise('')
          setMeldung(fehler.message)
          return
        }

        // Auch der Speicherfehler bleibt hier stehen: Kein `router.push` in einen
        // Arbeitsbereich, dessen Reise nirgends liegt.
        if (fehler instanceof Error && fehler.message === ZEITRAUM_ZU_LANG) {
          anvisiert.current = 'endDate'
          setFeldfehler({ endDate: fehler.message })
          return
        }
        setMeldung(
          fehler instanceof SpeicherFehler
            ? fehler.message
            : 'Die Reise konnte auf diesem Gerät nicht gespeichert werden. Bitte prüfe den Browserspeicher.',
        )
      }
    } catch {
      if (!lifecycle.aktuell(lauf)) return
      setMeldung(TRANSPORT)
      lifecycle.beenden(lauf)
    }
  }

  return (
    <div className="grid w-full min-w-0 grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
      <form
        noValidate
        aria-busy={laeuft}
        onSubmit={absenden}
        className="min-w-0 max-w-full rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_24px_80px_rgba(15,46,42,0.08)] sm:p-8"
      >
        <div className="mb-8 min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex max-w-full break-words rounded-full border border-line-200 bg-surface-0 px-3 py-1 text-xs font-semibold text-brand-800">
              Selbst ausfüllen
            </span>
            <span className="inline-flex max-w-full break-words rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold text-brand-800">
              {angemeldet ? 'Reise in deinem Konto' : 'Privater Reiseentwurf'}
            </span>
          </div>
          <h2 className="mt-4 max-w-full break-words text-2xl font-semibold tracking-[-0.04em] text-brand-900 sm:text-3xl">
            Deine Reise Schritt für Schritt.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-900 sm:text-base">
            Ein paar Angaben genügen. Du kannst jeden Teil später gemeinsam mit deinen Mitreisenden verfeinern.
          </p>
          <p className="mt-4 max-w-full break-words rounded-2xl border border-line-200 bg-surface-50 px-4 py-3 text-sm leading-6 text-ink-800 xl:hidden">
            Dieses Formular funktioniert ohne die intelligente Planung. Beide Wege führen zur gleichen Reise.
          </p>
        </div>

        <div className="grid min-w-0 gap-8">
          <Planungsgruppe id="planen-gruppe-route" titel="Route & Ziele">
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="grid gap-3">
            <Feld
              id="feld-ziel"
              label="Reiseziel"
              className={feldReflowClass}
              fehler={feldfehler.destination}
              icon={<MapPin className={fieldIconClass} aria-hidden="true" />}
            >
              <OrtSuche
                key={primaerKey}
                rolle="ziel"
                variante="field"
                value={destinationOrt}
                initialText={destination}
                inputId="feld-ziel"
                disabled={laeuft}
                ungueltig={Boolean(feldfehler.destination)}
                describedBy={feldfehler.destination ? feldFehlerId('feld-ziel') : undefined}
                inputRef={(el) => {
                  felder.current.destination = el
                }}
                onChange={(wert, roh) => {
                  if (lifecycle.gesperrt()) return
                  setDestinationOrt(wert)
                  setDestination(wert?.name ?? roh)
                  if (wert) feldKorrigieren('destination')
                }}
                placeholder="z. B. Japan"
                inputClassName={cn(fieldClass, 'pr-10', feldfehler.destination && FELD_FEHLER_RAHMEN)}
              />
            </Feld>
            {zusaetzlicheZiele.length > 0 ? (
              <button
                type="button"
                ref={primaerRunter}
                id="ziel-reihenfolge-1-runter"
                onClick={primaerNachUnten}
                disabled={laeuft}
                aria-label={`${destinationOrt?.name || destination || 'Reiseziel'}, Ziel 1, nach unten`}
                className="inline-flex min-h-11 w-fit items-center justify-center gap-1 rounded-2xl border border-line-200 bg-surface-0 px-4 text-sm font-semibold text-brand-800 transition hover:border-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
                Nach unten
              </button>
            ) : null}
          </div>

          <Feld
            id="feld-abreiseort"
            label="Abreise ab"
            className={feldReflowClass}
            fehler={feldfehler.origin}
            icon={<MapPin className={fieldIconClass} aria-hidden="true" />}
          >
            <OrtSuche
              rolle="abreise"
              variante="field"
              value={originOrt}
              inputId="feld-abreiseort"
              disabled={laeuft}
              ungueltig={Boolean(feldfehler.origin)}
              describedBy={feldfehler.origin ? feldFehlerId('feld-abreiseort') : undefined}
              inputRef={(el) => {
                felder.current.origin = el
              }}
              onChange={(wert, roh) => {
                if (lifecycle.gesperrt()) return
                setOriginOrt(wert)
                setOrigin(wert?.name ?? roh)
                if (wert) feldKorrigieren('origin')
              }}
              placeholder="z. B. Zürich"
              inputClassName={cn(fieldClass, 'pr-10', feldfehler.origin && FELD_FEHLER_RAHMEN)}
            />
          </Feld>

          <div className="grid gap-4 sm:col-span-2">
            {zusaetzlicheZiele.map((ziel, index) => {
              const feld = zusaetzlichesZielFeld(ziel.key)
              const nummer = index + 1
              const fehler = feldfehler[feld]
              return (
                <div key={ziel.key} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <Feld
                    id={`feld-ziel-${ziel.key}`}
                    label={`Weiteres Ziel ${nummer}`}
                    optional
                    className={feldReflowClass}
                    fehler={fehler}
                    icon={<MapPin className={fieldIconClass} aria-hidden="true" />}
                  >
                    <OrtSuche
                      key={ziel.key}
                      rolle="ziel"
                      variante="field"
                      value={ziel.ort}
                      initialText={ziel.text}
                      inputId={`feld-ziel-${ziel.key}`}
                      disabled={laeuft}
                      ungueltig={Boolean(fehler)}
                      describedBy={fehler ? feldFehlerId(`feld-ziel-${ziel.key}`) : undefined}
                      inputRef={(el) => {
                        zusaetzlicheFelder.current[feld] = el
                      }}
                      onChange={(wert, roh) => {
                        if (lifecycle.gesperrt()) return
                        setZusaetzlicheZiele((bisher) =>
                          bisher.map((eintrag) =>
                            eintrag.key === ziel.key
                              ? { ...eintrag, ort: wert, text: wert?.name ?? roh }
                              : eintrag,
                          ),
                        )
                        if (wert) feldKorrigieren(feld)
                      }}
                      placeholder="z. B. Rom"
                      inputClassName={cn(fieldClass, 'pr-10', fehler && FELD_FEHLER_RAHMEN)}
                    />
                  </Feld>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      ref={index === 0 ? extraHoch : undefined}
                      id={index === 0 ? 'ziel-reihenfolge-2-hoch' : undefined}
                      onClick={() => extraNachOben(index)}
                      disabled={laeuft}
                      aria-label={`${ziel.ort?.name || ziel.text || `Weiteres Ziel ${nummer}`}, Ziel ${nummer + 1}, nach oben`}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-line-200 bg-surface-0 px-4 text-sm font-semibold text-brand-800 transition hover:border-brand-600 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      Nach oben
                    </button>
                    <button
                      type="button"
                      onClick={() => extraNachUnten(index)}
                      disabled={laeuft || index >= zusaetzlicheZiele.length - 1}
                      aria-label={`${ziel.ort?.name || ziel.text || `Weiteres Ziel ${nummer}`}, Ziel ${nummer + 1}, nach unten`}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-line-200 bg-surface-0 px-4 text-sm font-semibold text-brand-800 transition hover:border-brand-600 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      Nach unten
                    </button>
                    <button
                      type="button"
                      onClick={() => extraEntfernen(ziel.key)}
                      disabled={laeuft}
                      aria-label={`Weiteres Ziel ${nummer} entfernen`}
                      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-line-200 bg-surface-0 px-4 text-sm font-semibold text-brand-800 transition hover:border-brand-600 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-40"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Entfernen
                    </button>
                  </div>
                </div>
              )
            })}

            <div className="grid gap-2">
              <button
                type="button"
                onClick={extraHinzufuegen}
                disabled={laeuft || !destinationOrt || zusaetzlicheZiele.length >= GRENZEN.etappenJeReise - 1}
                aria-describedby="weitere-ziele-hinweis"
                className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-line-200 bg-white px-5 text-sm font-semibold text-brand-800 transition hover:border-brand-600 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-50"
              >
                Weiteres Ziel hinzufügen
              </button>
              <p id="weitere-ziele-hinweis" className="text-xs leading-5 text-ink-700">
                {destinationOrt
                  ? 'Optional. Die Reihenfolge bleibt die Eingabereihenfolge. Aufenthalte werden hier nicht festgelegt.'
                  : 'Zuerst das Reiseziel wählen. Weitere Ziele sind optional.'}
              </p>
            </div>
            </div>
            </div>
          </Planungsgruppe>

          <Planungsgruppe id="planen-gruppe-zeitraum" titel="Zeitraum">
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
          <Feld
            id="feld-start"
            label="Abreise"
            className={feldReflowClass}
            fehler={feldfehler.startDate}
            icon={<CalendarDays className={fieldIconClass} aria-hidden="true" />}
          >
            <input
              id="feld-start"
              ref={(el) => {
                felder.current.startDate = el
              }}
              type="date"
              min={heuteIso()}
              value={startDate}
              aria-invalid={Boolean(feldfehler.startDate) || undefined}
              aria-describedby={feldfehler.startDate ? feldFehlerId('feld-start') : undefined}
              aria-required="true"
              disabled={laeuft}
              onChange={(ereignis) => {
                if (lifecycle.gesperrt()) return
                setStartDate(ereignis.target.value)
                feldKorrigieren('startDate')
                if (endDate && ereignis.target.value > endDate) {
                  setEndDate('')
                  feldKorrigieren('endDate')
                } else if (endDate && ereignis.target.value <= endDate) {
                  feldKorrigieren('endDate')
                }
              }}
              className={cn(fieldClass, feldfehler.startDate && FELD_FEHLER_RAHMEN)}
            />
          </Feld>

          <Feld
            id="feld-ende"
            label="Rückreise"
            className={feldReflowClass}
            fehler={feldfehler.endDate || (zeitraumZuLang ? ZEITRAUM_ZU_LANG : undefined)}
            icon={<CalendarDays className={fieldIconClass} aria-hidden="true" />}
          >
            <input
              id="feld-ende"
              ref={(el) => {
                felder.current.endDate = el
              }}
              type="date"
              min={startDate || heuteIso()}
              value={endDate}
              aria-invalid={Boolean(feldfehler.endDate || zeitraumZuLang) || undefined}
              aria-describedby={feldfehler.endDate || zeitraumZuLang ? feldFehlerId('feld-ende') : undefined}
              aria-required="true"
              disabled={laeuft}
              onChange={(ereignis) => {
                if (lifecycle.gesperrt()) return
                setEndDate(ereignis.target.value)
                feldKorrigieren('endDate')
              }}
              className={cn(fieldClass, (feldfehler.endDate || zeitraumZuLang) && FELD_FEHLER_RAHMEN)}
            />
          </Feld>
            </div>
          </Planungsgruppe>

          {zuordnungZiele.length >= 2 ? (
            <TripStageDayAllocation
              ziele={zuordnungZiele}
              startDate={startDate}
              endDate={endDate}
              aktiv={zuordnungAktiv}
              ansprueche={zuordnung}
              zugeordnet={zuordnungStand.zugeordnet}
              ohneZiel={zuordnungStand.ohneZiel}
              reisetage={zuordnungStand.reisetage}
              zeitraumZuLang={zeitraumZuLang}
              fehler={zeitraumZuLang ? undefined : feldfehler.dayAllocation || zuordnungStand.fehler}
              hinweis={zuordnungHinweis}
              disabled={laeuft}
              onAktiv={(wert) => {
                if (lifecycle.gesperrt()) return
                setZuordnungAktiv(wert)
                setFeldfehler((bisher) => feldfehlerLoeschen(bisher, 'dayAllocation'))
              }}
              onAnspruch={(key, teil) => {
                if (lifecycle.gesperrt()) return
                setZuordnung((bisher) => {
                  const vorhanden = bisher.find((eintrag) => eintrag.occurrenceKey === key)
                  const naechster = {
                    occurrenceKey: key,
                    startDate: teil.startDate ?? vorhanden?.startDate ?? '',
                    endDate: teil.endDate ?? vorhanden?.endDate ?? '',
                  }
                  const ohne = bisher.filter((eintrag) => eintrag.occurrenceKey !== key)
                  if (!naechster.startDate && !naechster.endDate) return ohne
                  return [...ohne, naechster]
                })
                setZuordnungHinweis('')
                setFeldfehler((bisher) => feldfehlerLoeschen(bisher, 'dayAllocation'))
              }}
              onZuruecksetzen={() => {
                if (lifecycle.gesperrt()) return
                setZuordnungAktiv(false)
                setZuordnung([])
                setZuordnungHinweis('')
                setFeldfehler((bisher) => feldfehlerLoeschen(bisher, 'dayAllocation'))
              }}
            />
          ) : null}

          <Planungsgruppe id="planen-gruppe-reisende" titel="Reisende & Budget">
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
          <Feld
            id="feld-reisende"
            label="Reisende"
            className={feldReflowClass}
            fehler={feldfehler.travellers}
            icon={<Users className={fieldIconClass} aria-hidden="true" />}
          >
            <input
              id="feld-reisende"
              ref={(el) => {
                felder.current.travellers = el
              }}
              type="number"
              min={1}
              max={GRENZEN.reisende}
              inputMode="numeric"
              value={travellers}
              aria-invalid={Boolean(feldfehler.travellers) || undefined}
              aria-describedby={feldfehler.travellers ? feldFehlerId('feld-reisende') : undefined}
              aria-required="true"
              disabled={laeuft}
              onChange={(ereignis) => {
                if (lifecycle.gesperrt()) return
                const roh = ereignis.target.value
                if (roh === '') {
                  setTravellers('')
                  return
                }
                setTravellers(Number(roh))
                feldKorrigieren('travellers')
              }}
              className={cn(fieldClass, feldfehler.travellers && FELD_FEHLER_RAHMEN)}
            />
          </Feld>

          <Feld
            id="feld-budget"
            label="Ungefähres Gesamtbudget"
            optional
            className={feldReflowClass}
            fehler={feldfehler.budget}
            icon={<WalletCards className={fieldIconClass} aria-hidden="true" />}
          >
            <input
              id="feld-budget"
              ref={(el) => {
                felder.current.budget = el
              }}
              type="number"
              min={0}
              step={100}
              inputMode="numeric"
              value={budget}
              aria-invalid={Boolean(feldfehler.budget) || undefined}
              aria-describedby={feldfehler.budget ? feldFehlerId('feld-budget') : undefined}
              disabled={laeuft}
              onChange={(ereignis) => {
                if (lifecycle.gesperrt()) return
                setBudget(ereignis.target.value)
                feldKorrigieren('budget')
              }}
              placeholder="CHF, optional"
              className={cn(fieldClass, feldfehler.budget && FELD_FEHLER_RAHMEN)}
            />
          </Feld>
            </div>
          </Planungsgruppe>

          <Planungsgruppe id="planen-gruppe-wuensche" titel="Wünsche">
        <label className="grid min-w-0 max-w-full gap-2 break-words text-sm font-medium text-brand-800">
          Was ist dir bei dieser Reise besonders wichtig?
          <textarea
            value={travelWish}
            disabled={laeuft}
            onChange={(ereignis) => {
              if (lifecycle.gesperrt()) return
              setTravelWish(ereignis.target.value)
            }}
            rows={4}
            maxLength={GRENZEN.reisewunsch}
            placeholder="Zum Beispiel: lokale Restaurants, wenig Hotelwechsel und zwei ruhige Tage am Meer."
            className="w-full min-w-0 max-w-full resize-y rounded-2xl border border-line-200 bg-surface-0 px-4 py-3 text-base leading-6 outline-none transition placeholder:text-ink-600 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
          />
        </label>
          </Planungsgruppe>
        </div>

        <FormularZusammenfassung
          sichtbar={Object.keys(feldfehler).length > 0}
          text={FORMULAR_ZUSAMMENFASSUNG}
          extra={
            meldung || bestehendeReise ? (
              <div className={Object.keys(feldfehler).length > 0 ? 'mt-2' : undefined}>
                {meldung ? <p>{meldung}</p> : null}
                {bestehendeReise ? (
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    <Link
                      href={`/reisen/${bestehendeReise}` as Route}
                      className="font-semibold underline underline-offset-2"
                    >
                      Entwurf öffnen
                    </Link>
                    <Link href="/register" className="font-semibold underline underline-offset-2">
                      Konto erstellen
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null
          }
        />

        <div className="mt-7 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-line-200 pt-6 sm:flex-row sm:items-center">
          <p className="flex min-w-0 items-start gap-2 text-xs leading-5 text-ink-700">
            {angemeldet ? (
              <>
                <Cloud className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                Diese Reise wird in deinem Konto gespeichert.
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                Dieser Entwurf bleibt zunächst nur in deinem Browser.
              </>
            )}
          </p>
          <button
            type="submit"
            disabled={laeuft}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-800 px-6 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(21,58,51,0.18)] transition hover:-translate-y-0.5 hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 motion-reduce:transition-none motion-reduce:hover:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
          >
            {laeuft ? 'Reise wird erstellt …' : 'Reise erstellen'}
            {!laeuft && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </form>

      <aside className="hidden h-fit min-w-0 max-w-full rounded-[28px] bg-brand-800 p-6 text-white xl:sticky xl:top-[calc(var(--jet-header-h)+env(safe-area-inset-top)+1rem)] xl:block xl:max-h-[calc(100dvh-var(--jet-header-h)-env(safe-area-inset-top)-2rem)] xl:overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">So geht es weiter</p>
        <ol className="mt-6 space-y-6">
          {[
            ['01', 'Entwurf anlegen', 'Deine Eckdaten werden zu einer übersichtlichen Reise.'],
            ['02', 'Gemeinsam verfeinern', 'Füge Tagespunkte, Buchungen und Mitreisende hinzu.'],
            ['03', 'Entspannt reisen', 'Später begleiten dich Live-Hinweise und wichtige Erinnerungen.'],
          ].map(([nummer, titel, beschreibung]) => (
            <li key={nummer} className="grid grid-cols-[36px_1fr] gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-ink-300">
                {nummer}
              </span>
              <span>
                <strong className="block text-sm font-semibold">{titel}</strong>
                <span className="mt-1 block text-xs leading-5 text-white/65">{beschreibung}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
          <p className="text-xs leading-5 text-white/75">
            Dieses Formular funktioniert ohne die intelligente Planung. Beide Wege führen zur gleichen Reise.
          </p>
          {angemeldet ? null : (
            <p className="mt-2 text-xs leading-5 text-white/70">
              Ohne Konto lässt sich eine Reise planen. Für mehrere gespeicherte Reisen und den Zugriff von jedem Gerät genügt eine Registrierung.
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
