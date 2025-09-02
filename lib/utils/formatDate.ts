// lib/utils/formatDate.ts

export type DateLike = string | number | Date | null | undefined

export type FormatDateOptions = {
  mode?: 'date' | 'time' | 'datetime' | 'relative' | 'auto'
  dateStyle?: Intl.DateTimeFormatOptions['dateStyle']
  timeStyle?: Intl.DateTimeFormatOptions['timeStyle']
  hour12?: boolean
  timeZone?: string
  locale?: string
  /** für mode:'auto' – bis zu so vielen Tagen relativ anzeigen (Default 6) */
  relativeThresholdDays?: number
  /** „Jetzt“-Zeitpunkt überschreiben (z. B. Tests) */
  now?: DateLike
}

/* ───────────────────────── Locale & Caches ───────────────────────── */

const localeAlias: Record<string, string> = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
  pt: 'pt-PT',
  nl: 'nl-NL',
  sv: 'sv-SE',
  pl: 'pl-PL',
  tr: 'tr-TR',
  ru: 'ru-RU',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
}

function detectLocale(): string {
  const env = (process?.env?.NEXT_PUBLIC_DEFAULT_LOCALE || '').trim()
  if (env) return localeAlias[env] || env
  if (typeof navigator !== 'undefined' && navigator.language) return navigator.language
  return 'de-DE'
}

const dtfCache = new Map<string, Intl.DateTimeFormat>()
function getDTF(locale: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(opts)}`
  let fmt = dtfCache.get(key)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, opts)
    dtfCache.set(key, fmt)
  }
  return fmt
}

const rtfCache = new Map<string, Intl.RelativeTimeFormat>()
function getRTF(locale: string): Intl.RelativeTimeFormat {
  let fmt = rtfCache.get(locale)
  if (!fmt) {
    fmt = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'long' })
    rtfCache.set(locale, fmt)
  }
  return fmt
}

/* ───────────────────────── Parsing ───────────────────────── */

export function parseDateSafe(input: DateLike): Date | null {
  if (input == null) return null
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input

  // Numeric: Sekunden oder Millisekunden
  if (typeof input === 'number' || /^\d+$/.test(String(input))) {
    const n = Number(input)
    const ms = n < 1e12 ? n * 1000 : n
    const d = new Date(ms)
    return isNaN(d.getTime()) ? null : d
  }

  const s = String(input).trim()
  if (!s) return null

  // Reines YYYY-MM-DD → als lokale Mitternacht interpretieren
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map((x) => parseInt(x, 10))
    const date = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0)
    return isNaN(date.getTime()) ? null : date
  }

  // ISO / mit Offset
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/* ───────────────────────── Relative ───────────────────────── */

function formatRelativeImpl(target: Date, locale: string, now: Date) {
  const diffMs = target.getTime() - now.getTime()
  const abs = Math.abs(diffMs)

  const sec = Math.round(diffMs / 1000)
  const min = Math.round(diffMs / (60 * 1000))
  const hr = Math.round(diffMs / (60 * 60 * 1000))
  const day = Math.round(diffMs / (24 * 60 * 60 * 1000))
  const week = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
  const month = Math.round(diffMs / (30 * 24 * 60 * 60 * 1000))
  const year = Math.round(diffMs / (365 * 24 * 60 * 60 * 1000))

  const rtf = getRTF(locale)

  if (abs < 45 * 1000) return rtf.format(sec, 'second')
  if (abs < 45 * 60 * 1000) return rtf.format(min, 'minute')
  if (abs < 22 * 60 * 60 * 1000) return rtf.format(hr, 'hour')
  if (abs < 7 * 24 * 60 * 60 * 1000) return rtf.format(day, 'day')
  if (abs < 4 * 7 * 24 * 60 * 60 * 1000) return rtf.format(week, 'week')
  if (abs < 12 * 30 * 24 * 60 * 60 * 1000) return rtf.format(month, 'month')
  return rtf.format(year, 'year')
}

/* ───────────────────────── Public API ───────────────────────── */

export function formatRelative(dateLike: DateLike, locale?: string, now?: DateLike): string {
  const d = parseDateSafe(dateLike)
  if (!d) return '–'
  const l = locale || detectLocale()
  const n = parseDateSafe(now ?? new Date())!
  return formatRelativeImpl(d, l, n)
}

export function formatDateOnly(dateLike: DateLike, opts: Omit<FormatDateOptions, 'mode' | 'timeStyle'> = {}): string {
  return formatDate(dateLike, { ...opts, mode: 'date' })
}
export function formatTimeOnly(dateLike: DateLike, opts: Omit<FormatDateOptions, 'mode' | 'dateStyle'> = {}): string {
  return formatDate(dateLike, { ...opts, mode: 'time' })
}
export function formatDateTime(dateLike: DateLike, opts: Omit<FormatDateOptions, 'mode'> = {}): string {
  return formatDate(dateLike, { ...opts, mode: 'datetime' })
}

/**
 * Hauptfunktion – rückwärtskompatibel zu deiner alten `formatDate`.
 * Default: 'datetime' + dateStyle 'medium' + timeStyle 'short'
 */
export function formatDate(dateLike: DateLike, options: FormatDateOptions = {}): string {
  const d = parseDateSafe(dateLike)
  if (!d) return '–'

  const {
    mode = 'datetime',
    dateStyle = 'medium',
    timeStyle = 'short',
    hour12,
    timeZone,
    locale = detectLocale(),
    relativeThresholdDays = 6,
    now = new Date(),
  } = options

  if (mode === 'relative') {
    return formatRelativeImpl(d, locale, parseDateSafe(now)!)
  }

  if (mode === 'auto') {
    const n = parseDateSafe(now)!
    const diffDays = Math.abs(d.getTime() - n.getTime()) / 86_400_000
    if (diffDays <= relativeThresholdDays) {
      return formatRelativeImpl(d, locale, n)
    }
    // sonst normal als datetime
  }

  if (mode === 'date') {
    const opts: Intl.DateTimeFormatOptions = { dateStyle, timeZone }
    const fmt: Intl.DateTimeFormat = getDTF(locale, opts)
    return fmt.format(d)
  }
  if (mode === 'time') {
    const opts: Intl.DateTimeFormatOptions = { timeStyle, hour12, timeZone }
    const fmt: Intl.DateTimeFormat = getDTF(locale, opts)
    return fmt.format(d)
  }

  // 'datetime'
  const opts: Intl.DateTimeFormatOptions = { dateStyle, timeStyle, hour12, timeZone }
  const fmt: Intl.DateTimeFormat = getDTF(locale, opts)
  return fmt.format(d)
}

/* ───────────────────────── Date Range ───────────────────────── */

type DTFWithRange = Intl.DateTimeFormat & {
  formatRange: (start: Date, end: Date) => string
}
function hasFormatRange(fmt: Intl.DateTimeFormat): fmt is DTFWithRange {
  return typeof (fmt as any).formatRange === 'function'
}

/** Bereichsformatierung (nutzt formatRange, wenn verfügbar) */
export function formatDateRange(
  start: DateLike,
  end: DateLike,
  opts: Omit<FormatDateOptions, 'mode'> = {}
): string {
  const s = parseDateSafe(start)
  const e = parseDateSafe(end)
  if (!s || !e) return '–'

  const {
    dateStyle = 'medium',
    timeStyle,
    hour12,
    timeZone,
    locale = detectLocale(),
  } = opts

  const baseOpts: Intl.DateTimeFormatOptions = { dateStyle, timeStyle, hour12, timeZone }
  const fmt: Intl.DateTimeFormat = getDTF(locale, baseOpts)

  if (hasFormatRange(fmt)) {
    return (fmt as DTFWithRange).formatRange(s, e)
  }

  // Fallback: getrennt formatieren (klar getypter Formatter)
  const fallbackFmt: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, baseOpts)
  const startStr = fallbackFmt.format(s)
  const endStr = fallbackFmt.format(e)
  return `${startStr} – ${endStr}`
}
