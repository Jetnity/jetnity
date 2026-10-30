/** Synthetic guest data only. No account, provider or external reservation. */
export function fixture() {
  return {
    id: 'trip-unified-workspace-audit', clientRef: 'trip-unified-workspace-audit',
    title: 'Thailand-Rundreise', origin: 'Zürich', originPlaceId: 'geonames:2657896',
    startDate: '2026-11-15', endDate: '2026-12-06', travellers: 2,
    currency: 'CHF', budgetAmount: 4000, status: 'draft', pace: 'balanced',
    interests: [], revision: 1, travelWish: null, lastMutationId: null,
    stages: [
      { id: 'stage-bkk', position: 1, name: 'Bangkok', countryCode: 'TH', arrivalDate: '2026-11-16', departureDate: '2026-11-22', placeId: 'geonames:1609350' },
      { id: 'stage-kc', position: 2, name: 'Ko Chang', countryCode: 'TH', arrivalDate: '2026-11-23', departureDate: '2026-11-29', placeId: 'geonames:1611026' },
      { id: 'stage-hkt', position: 3, name: 'Phuket', countryCode: 'TH', arrivalDate: '2026-11-30', departureDate: '2026-12-05', placeId: 'geonames:1151254' },
    ],
    days: Array.from({ length: 22 }, (_, i) => ({
      id: `day-${i + 1}`, dayIndex: i + 1,
      dayDate: new Date(Date.UTC(2026, 10, 15 + i)).toISOString().slice(0, 10),
      stageId: i === 0 || i === 21 ? null : i < 8 ? 'stage-bkk' : i < 15 ? 'stage-kc' : 'stage-hkt',
      title: i === 0 ? 'Hinreise' : i === 21 ? 'Rückreise' : null, items: [],
    })),
    ohneTag: [], party: [], readinessItems: [],
    createdAt: '2026-10-30T10:00:00.000Z', updatedAt: '2026-10-30T10:00:00.000Z',
  }
}
