'use client'

// components/trips/useTripArchiveWorkflow.ts
//
// Dieselbe Runde blockiert über eine Ref, nicht über einen Reducer.

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

import { previousStatusAusReise } from '@/lib/account/reise-archiv'
import type { Problem } from '@/lib/api/datenbank-lesen'
import { reiseArchivLebenszyklus } from '@/lib/trips/archiv-aktionen'
import {
  archivKlasse,
  beobachtungAnwenden,
  rueckmeldungAnwenden,
  sperreLoesen,
  sperreSetzen,
  type ArchivSperre,
  type ArchivVorgang,
} from '@/lib/trips/trip-archive-workflow'
import type { TripSummary } from '@/types/trips'

export type ArchivAufruf = (eingabe: {
  tripId: string
  aktion: 'archivieren' | 'wiederherstellen'
}) => Promise<unknown>

export type ArchivSteuerung = {
  collectionId: string
  vorgaenge: readonly ArchivVorgang[]
  ausfuehren: (reise: TripSummary, aktion: 'archivieren' | 'wiederherstellen') => void
}

export function useTripArchiveWorkflow(
  zeilen: readonly TripSummary[],
  problem: Problem | null,
  aufrufen: ArchivAufruf = reiseArchivLebenszyklus,
): ArchivSteuerung {
  const router = useRouter()
  const collectionId = useId()
  const sperre = useRef<ArchivSperre>(null)
  const montiert = useRef(true)
  const [vorgaenge, setVorgaenge] = useState<ArchivVorgang[]>([])
  const [beobachtet, setBeobachtet] = useState({ zeilen, problem })

  if (zeilen !== beobachtet.zeilen || problem !== beobachtet.problem) {
    setBeobachtet({ zeilen, problem })
    setVorgaenge((aktuell) => beobachtungAnwenden(aktuell, zeilen, problem))
  }

  useEffect(() => {
    montiert.current = true
    return () => {
      montiert.current = false
    }
  }, [])

  function ausfuehren(reise: TripSummary, aktion: 'archivieren' | 'wiederherstellen') {
    if (aktion === 'wiederherstellen' && !previousStatusAusReise(reise)) return
    const operationId = crypto.randomUUID()
    const gesetzt = sperreSetzen(sperre.current, { operationId, tripId: reise.id, collectionId })
    if (gesetzt === 'belegt') return
    sperre.current = gesetzt
    const vorgang: ArchivVorgang = {
      operationId,
      tripId: reise.id,
      collectionId,
      aktion,
      status: reise.status,
      updatedAt: reise.updatedAt,
      archivePreviousStatus: previousStatusAusReise(reise),
      write: 'pending',
      meldung: '',
      observation: 'unread',
      observedStatus: null,
    }
    setVorgaenge((aktuell) => [...aktuell, vorgang])
    void (async () => {
      let klasse: ReturnType<typeof archivKlasse> = 'unknown'
      let meldung = ''
      try {
        const ergebnis = await aufrufen({ tripId: reise.id, aktion })
        klasse = archivKlasse(ergebnis)
        if (klasse === 'returned-negative' && ergebnis && typeof ergebnis === 'object' && 'meldung' in ergebnis) {
          const text = (ergebnis as { meldung?: unknown }).meldung
          meldung = typeof text === 'string' ? text : ''
        }
      } catch {
        klasse = 'unknown'
      } finally {
        sperre.current = sperreLoesen(sperre.current, operationId)
        if (montiert.current) {
          setVorgaenge((aktuell) =>
            rueckmeldungAnwenden(aktuell, {
              mounted: true,
              collectionId,
              operationId,
              klasse,
              meldung,
            }),
          )
          if (klasse === 'acknowledged') router.refresh()
        }
      }
    })()
  }

  return { collectionId, vorgaenge, ausfuehren }
}
