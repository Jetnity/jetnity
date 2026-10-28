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

/** Schedule hint for one option and date. Empty times are not a live availability claim. */
export function viatorStartzeiten(option: ViatorKalenderOption | undefined, datum: string): string[] | null {
  if (!option || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) return null
  const zeiten = new Set<string>()
  let imZeitraum = false
  for (const season of option.seasons) {
    if (datum < season.startDate) continue
    if (season.endDate && datum > season.endDate) continue
    imZeitraum = true
    const eintraege = season.timedEntries && season.timedEntries.length > 0
      ? season.timedEntries
      : season.startTimes.map((startTime) => ({ startTime, unavailableDates: season.unavailableDates }))
    for (const eintrag of eintraege) {
      if (!eintrag.unavailableDates.includes(datum)) zeiten.add(eintrag.startTime)
    }
  }
  if (!imZeitraum) return null
  return [...zeiten]
}
