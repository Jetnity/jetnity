export const TRIP_PACES = ['ruhig', 'ausgewogen', 'intensiv'] as const

export type TripPace = (typeof TRIP_PACES)[number]

export const TRIP_INTERESTS = [
  'Kultur',
  'Natur',
  'Kulinarik',
  'Strand',
  'Abenteuer',
  'Wellness',
] as const

export type TripInterest = (typeof TRIP_INTERESTS)[number]

export type TripPlanItem = {
  id: string
  title: string
  note?: string
  time?: string
  createdAt: string
}

export type TripDay = {
  id: string
  date: string
  items: TripPlanItem[]
}

export type GuestTrip = {
  id: string
  title: string
  destination: string
  origin: string
  startDate: string
  endDate: string
  travelers: number
  pace: TripPace
  budget?: number
  interests: TripInterest[]
  travelWish?: string
  days: TripDay[]
  createdAt: string
  updatedAt: string
}

export type CreateGuestTripInput = Omit<
  GuestTrip,
  'id' | 'days' | 'createdAt' | 'updatedAt'
>
