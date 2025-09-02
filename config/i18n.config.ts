/* config/i18n.config.ts
 * Leichtgewichtige i18n-Konfiguration (public-safe).
 * Beinhaltet gängige Sprachen, Default, RTL-Support, Namen & Fallback-Reihen.
 */

export const locales = [
  'de', // Deutsch
  'en', // English
  'fr', // Français
  'it', // Italiano
  'es', // Español
  'pt', // Português
  'nl', // Nederlands
  'pl', // Polski
  'tr', // Türkçe
  'ru', // Русский
  'ar', // العربية  (RTL)
  'zh', // 中文
  'ja', // 日本語
  'ko', // 한국어
  'hi', // हिन्दी
] as const
export type Locale = (typeof locales)[number]

/** Default aus ENV, sonst Deutsch. */
export const defaultLocale: Locale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale) || 'de'

/** RTL-Sprachen (für dir="rtl"). */
export const rtlLocales = ['ar', 'he', 'fa', 'ur'] as const

/** Anzeigenamen – z. B. für Sprache-Switcher. */
export const localeNames: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  es: 'Español',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  ru: 'Русский',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  hi: 'हिन्दी',
} as const

/** Fallback-Ketten pro Sprache (kurz halten!). */
export const localeFallbacks: Partial<Record<Locale, Locale[]>> = {
  de: ['en'],
  fr: ['en'],
  it: ['en'],
  es: ['en'],
  pt: ['es', 'en'],
  nl: ['en'],
  pl: ['en'],
  tr: ['en'],
  ru: ['en'],
  ar: ['en'],
  zh: ['en'],
  ja: ['en'],
  ko: ['en'],
  hi: ['en'],
  en: ['de'],
} as const

export function isLocale(input: string): input is Locale {
  return (locales as readonly string[]).includes(input as Locale)
}

export function resolveLocale(preferred: string | null | undefined): Locale {
  const lower = (preferred || '').split('-')[0].toLowerCase()
  return isLocale(lower) ? (lower as Locale) : defaultLocale
}

export function direction(locale: string): 'ltr' | 'rtl' {
  return (rtlLocales as readonly string[]).includes(locale) ? 'rtl' : 'ltr'
}

/** Kompaktobjekt für einfache Imports. */
export const i18n = Object.freeze({
  locales,
  defaultLocale,
  localeNames,
  rtlLocales,
  localeFallbacks,
  resolveLocale,
  direction,
})
export type I18nConfig = typeof i18n
