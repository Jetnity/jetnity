export type WetterZeit = {
  zeit: string
  temperatur: number
  regen: number
  wind: number
  sicht: number | null
  beschreibung: string
}
export type Vorhersage = { zeiten: WetterZeit[]; sonnenuntergang: string | null }

function objekt(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}
function zahl(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
function ortszeit(unix: unknown, offset: number): string | null {
  if (!zahl(unix) || unix <= 0 || unix > 4102444800) return null
  return new Date((unix + offset) * 1000).toISOString().slice(0, 16)
}

// OpenWeather supplies one local offset and one sunset for the whole response.
export function vorhersageLesen(raw: unknown): Vorhersage | null {
  const { city, list } = objekt(raw)
  const { timezone, sunset } = objekt(city)
  if (!zahl(timezone) || Math.abs(timezone) > 14 * 3600 || !Array.isArray(list)) return null
  const zeiten: WetterZeit[] = []
  for (const item of list.slice(0, 40)) {
    const { dt, main, pop, wind, visibility, weather } = objekt(item)
    const zeit = ortszeit(dt, timezone)
    const temp = objekt(main).temp
    const speed = objekt(wind).speed
    if (!zeit || !zahl(temp) || !zahl(pop) || pop < 0 || pop > 1 || !zahl(speed) || speed < 0) continue
    const text = Array.isArray(weather) ? objekt(weather[0]).description : null
    zeiten.push({ zeit, temperatur: Math.round(temp), regen: Math.round(pop * 100),
      wind: Math.round(speed * 3.6), sicht: zahl(visibility) && visibility >= 0 ? visibility : null,
      beschreibung: typeof text === 'string' ? text.slice(0, 100) : '' })
  }
  return zeiten.length ? { zeiten, sonnenuntergang: ortszeit(sunset, timezone) } : null
}

export function wetterAmTag(prognose: Vorhersage, datum: string | null) {
  const tag = datum || prognose.zeiten[0]?.zeit.slice(0, 10)
  const zeiten = prognose.zeiten.filter(z => z.zeit.slice(0, 10) === tag)
  const untergang = prognose.sonnenuntergang
  return { tag, zeiten, untergang: untergang?.slice(0, 10) === tag ? untergang.slice(11) : null }
}

/** Match the nearest three-hour slot on this day only, within half a forecast step. */
export function wetterZurUhrzeit(zeiten: WetterZeit[], uhrzeit: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(uhrzeit)) return null
  const minuten = (zeit: string) => Number(zeit.slice(0, 2)) * 60 + Number(zeit.slice(3, 5))
  const ziel = minuten(uhrzeit)
  let abstand = 91
  let passend: WetterZeit | null = null
  for (const zeit of zeiten) {
    const differenz = Math.abs(minuten(zeit.zeit.slice(11)) - ziel)
    if (differenz < abstand) { abstand = differenz; passend = zeit }
  }
  return passend
}
