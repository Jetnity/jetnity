import { n12Punkt, n12Reise } from '@/lib/trips/n12-chronology-1/fixture'
import type { Trip, TripDay, TripItem, TripStage } from '@/types/trips'

const JETZT = '2026-10-28T00:00:00.000Z'

function plusTage(start: string, offset: number): string {
  const zeit = new Date(`${start}T00:00:00Z`)
  zeit.setUTCDate(zeit.getUTCDate() + offset)
  return zeit.toISOString().slice(0, 10)
}

function etappe(teil: Partial<TripStage> & Pick<TripStage, 'id' | 'name' | 'position'>): TripStage {
  return {
    countryCode: null,
    arrivalDate: null,
    departureDate: null,
    latitude: null,
    longitude: null,
    placeId: null,
    ...teil,
  }
}

function tag(teil: Partial<TripDay> & Pick<TripDay, 'id' | 'dayIndex'>): TripDay {
  return { stageId: null, dayDate: null, title: null, items: [], ...teil }
}

function reiseAus(teil: Pick<Trip, 'id' | 'title' | 'stages' | 'days'> & Partial<Trip>): Trip {
  const basis = n12Reise()
  return {
    ...basis,
    clientRef: teil.id,
    origin: 'Zürich',
    originPlaceId: 'geonames:2657896',
    startDate: teil.days[0]?.dayDate ?? basis.startDate,
    endDate: teil.days[teil.days.length - 1]?.dayDate ?? basis.endDate,
    dayStageAssignmentMode: 'explicit',
    ohneTag: [],
    createdAt: JETZT,
    updatedAt: JETZT,
    ...teil,
  }
}

/** Assigned Bangkok, Ko Chang and Phuket, with the first and last dates unassigned. */
export function referenzReise(): Trip {
  const stages = [
    etappe({ id: 'stage-bkk', name: 'Bangkok', countryCode: 'TH', position: 1 }),
    etappe({ id: 'stage-kc', name: 'Ko Chang', countryCode: 'TH', position: 2 }),
    etappe({ id: 'stage-hkt', name: 'Phuket', countryCode: 'TH', position: 3 }),
  ]
  const days: TripDay[] = []
  for (let index = 0; index < 22; index += 1) {
    const id = `day-${index + 1}`
    const stageId = index >= 1 && index <= 7
      ? 'stage-bkk'
      : index >= 8 && index <= 14
        ? 'stage-kc'
        : index >= 15 && index <= 20
          ? 'stage-hkt'
          : null
    days.push(tag({
      id,
      dayIndex: index + 1,
      dayDate: plusTage('2026-11-15', index),
      stageId,
    }))
  }
  return reiseAus({
    id: 'trip-u1c-referenz',
    title: 'Bangkok, Ko Chang, Phuket',
    startDate: '2026-11-15',
    endDate: '2026-12-06',
    stages,
    days,
  })
}

/** Same stage ids recur. The A→B edge is not unique. */
export function wiederholteEtappenReise(): Trip {
  const stages = [
    etappe({ id: 'stage-a', name: 'A', countryCode: 'TH', position: 1 }),
    etappe({ id: 'stage-b', name: 'B', countryCode: 'TH', position: 2 }),
  ]
  const zuordnung = ['stage-a', 'stage-a', 'stage-b', 'stage-b', 'stage-a', 'stage-a', 'stage-b', 'stage-b']
  const days = zuordnung.map((stageId, index) => tag({
    id: `day-${index + 1}`,
    dayIndex: index + 1,
    dayDate: plusTage('2026-11-01', index),
    stageId,
  }))
  return reiseAus({ id: 'trip-u1c-abab', title: 'A B A B', stages, days })
}

/** Two Bangkok visits keep distinct stage ids. */
export function wiederholterNameReise(): Trip {
  const stages = [
    etappe({ id: 'stage-bkk-1', name: 'Bangkok', countryCode: 'TH', position: 1 }),
    etappe({ id: 'stage-cnx', name: 'Chiang Mai', countryCode: 'TH', position: 2 }),
    etappe({ id: 'stage-bkk-2', name: 'Bangkok', countryCode: 'TH', position: 3 }),
  ]
  const zuordnung = [
    ['stage-bkk-1', 2],
    ['stage-cnx', 2],
    ['stage-bkk-2', 2],
  ] as const
  const days: TripDay[] = []
  let index = 0
  for (const [stageId, anzahl] of zuordnung) {
    for (let offset = 0; offset < anzahl; offset += 1) {
      index += 1
      days.push(tag({
        id: `day-${index}`,
        dayIndex: index,
        dayDate: plusTage('2026-11-01', index - 1),
        stageId,
      }))
    }
  }
  return reiseAus({ id: 'trip-u1c-namen', title: 'Bangkok zweimal', stages, days })
}

/** Saved ferry plus a same-date flight. Canonical coverage stays unknown. */
export function unklareVerbindungReise(): Trip {
  const reise = referenzReise()
  const koChang = reise.stages.find((etappe) => etappe.id === 'stage-kc')
  const tag = reise.days.find((eintrag) => eintrag.id === 'day-9')
  if (koChang) koChang.arrivalDate = '2026-11-23'
  if (tag) {
    tag.items = [
      transferPunkt({ id: 'ferry-unklar', dayId: tag.id, stageId: 'stage-kc' }),
      transferPunkt({
        id: 'flight-unklar',
        dayId: tag.id,
        stageId: 'stage-kc',
        kind: 'flight',
        title: 'Gleicher Tag',
        startsAt: '08:00',
        endsAt: '09:00',
      }),
    ]
  }
  return reise
}

export function transferPunkt(teil: Partial<TripItem> & Pick<TripItem, 'id' | 'dayId'>): TripItem {
  return n12Punkt({
    kind: 'transfer',
    title: 'Fähre',
    position: 1,
    startsOn: '2026-11-23',
    startsAt: '09:00',
    endsOn: '2026-11-23',
    endsAt: '11:30',
    mobilityMode: 'ferry',
    mobilityEvidence: 'user',
    originName: 'Bangkok',
    destinationName: 'Ko Chang',
    bookingStatus: 'booked',
    bookingSource: 'user',
    bookingConfirmedAt: JETZT,
    ...teil,
  })
}
