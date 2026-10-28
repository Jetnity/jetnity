export type ViatorKalenderOption = {
  productOptionCode: string
  seasons: Array<{
    startDate: string
    endDate: string | null
    startTimes: string[]
    unavailableDates: string[]
    timedEntries?: Array<{ startTime: string; unavailableDates: string[] }>
  }>
}

/** Hint times only. A date inside a season is not a live availability result. */
export function viatorStartzeiten(
  option: ViatorKalenderOption | undefined,
  datum: string,
  heute: string,
): string[] | null {
  if (!option || !/^\d{4}-\d{2}-\d{2}$/.test(datum) || !/^\d{4}-\d{2}-\d{2}$/.test(heute)) return null
  const horizont = plusTage(heute, 384)
  if (!horizont) return null
  const zeiten = new Set<string>()
  let imZeitraum = false
  for (const season of option.seasons) {
    const ende = season.endDate ?? horizont
    if (datum < season.startDate || datum > ende) continue
    imZeitraum = true
    const eintraege =
      season.timedEntries && season.timedEntries.length > 0
        ? season.timedEntries
        : season.startTimes.map((startTime) => ({ startTime, unavailableDates: season.unavailableDates }))
    for (const eintrag of eintraege) {
      if (!eintrag.unavailableDates.includes(datum)) zeiten.add(eintrag.startTime)
    }
  }
  if (!imZeitraum) return null
  return [...zeiten]
}

function plusTage(iso: string, tage: number): string | null {
  const [jahr, monat, tag] = iso.split('-').map(Number)
  const datum = new Date(Date.UTC(jahr!, (monat ?? 1) - 1, tag))
  if (Number.isNaN(datum.getTime())) return null
  datum.setUTCDate(datum.getUTCDate() + tage)
  return datum.toISOString().slice(0, 10)
}
