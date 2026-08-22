'use client'

// components/trips/TripWorkspaceAuditClient.tsx
//
// Dünne Hülle für den Workspace-UI-Audit. Die Reise kommt aus sessionStorage,
// gesetzt vom Harness – nicht aus einem produktiven Fake-Katalog.

import * as React from 'react'

import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import MobilitaetBereich from '@/components/trips/MobilitaetBereich'
import FlugSuche from '@/components/trips/FlugSuche'
import HotelBereich from '@/components/trips/HotelBereich'
import TripWorkspace from '@/components/trips/TripWorkspace'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import type { Arbeitsbereich } from '@/lib/trips/arbeitsbereich'
import type { Trip, TripSource } from '@/types/trips'

const SPEICHER = 'jetnity:ui-audit:workspace'

type AuditNutzlast = {
  reise: Trip
  quelle?: TripSource
  anfangsBereich?: Arbeitsbereich
  mitSuche?: boolean
  mitAenderung?: boolean
  gastHinweis?: boolean
  officialEvaluations?: OfficialEvaluation[]
}

export default function TripWorkspaceAuditClient() {
  const [daten, setDaten] = React.useState<AuditNutzlast | null>(null)
  const [fehlend, setFehlend] = React.useState(false)

  React.useEffect(() => {
    try {
      const roh = sessionStorage.getItem(SPEICHER)
      if (!roh) {
        setFehlend(true)
        return
      }
      setDaten(JSON.parse(roh) as AuditNutzlast)
    } catch {
      setFehlend(true)
    }
  }, [])

  if (fehlend) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-semibold text-brand-800">Trip-Workspace-Audit</h1>
        <p className="mt-3 text-sm text-ink-800">Audit-Reise fehlt.</p>
      </main>
    )
  }

  if (!daten) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16" aria-busy="true">
        <p className="text-sm text-ink-800">Trip-Workspace-Audit wird vorbereitet.</p>
      </main>
    )
  }

  const { reise } = daten
  const quelle = daten.quelle ?? 'guest'

  return (
    <TripWorkspace
      reise={reise}
      quelle={quelle}
      ohneTag={reise.ohneTag}
      officialEvaluations={daten.officialEvaluations}
      anfangsBereich={daten.anfangsBereich}
      onPunktAnlegen={async () => null}
      onPunktEntfernen={async () => null}
      onBuchungsstatus={async () => null}
      onTravellerSetzen={async () => null}
      hinweis={
        daten.gastHinweis ? (
          <p className="mt-5 rounded-2xl border border-line-200 bg-white px-4 py-3 text-sm leading-6 text-ink-800">
            Dieser Entwurf liegt nur in diesem Browser.
          </p>
        ) : null
      }
      aenderung={
        daten.mitAenderung ? (
          <form aria-label="Reise ändern" className="mt-6 rounded-[28px] border border-black/5 bg-white p-5">
            <label className="grid gap-2 text-sm font-medium text-brand-800">
              Dein Änderungswunsch
              <textarea
                rows={3}
                className="w-full min-w-0 rounded-2xl border border-line-200 px-4 py-3 text-base"
                placeholder="Mach die Reise zwei Tage länger."
              />
            </label>
            <button
              type="button"
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white"
            >
              Änderung vorschlagen
            </button>
          </form>
        ) : null
      }
      flugsuche={daten.mitSuche ? <FlugSuche reise={reise} tagId={reise.days[0]?.id ?? null} onUebernehmen={async () => null} /> : null}
      hotelsuche={daten.mitSuche ? <HotelBereich reise={reise} /> : null}
      aktivitaetensuche={daten.mitSuche ? <AktivitaetenBereich reise={reise} /> : null}
      mobilitaetssuche={
        <MobilitaetBereich
          reise={reise}
          ohneTag={reise.ohneTag}
          onBuchungsstatus={async () => null}
          onMietwagenAnlegen={async () => null}
        />
      }
    />
  )
}
