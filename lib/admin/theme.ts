/**
 * Dunkelthema des Admin-Bereichs.
 *
 * Das Dunkelthema gilt nur fuer den Admin. Die oeffentlichen V2-Seiten sind
 * hell: Ihre Farbwelt ist als warme Palette festgelegt, ein dunkler Zustand
 * ist dafuer nicht gestaltet (ADR-0025).
 *
 * Die Klasse sitzt trotzdem auf <html>, denn nur dort faerbt sie auch die
 * Flaechen ausserhalb der Seite mit – Bildlaufleisten, native Steuerelemente
 * und den Untergrund beim Ueberdehnen des Scrollbereichs. Damit sie den
 * Admin-Bereich nicht verlaesst, wird sie beim Verlassen wieder entfernt;
 * darum liegt das Anwenden im Admin-Layout, das genau dann abgebaut wird.
 */
const THEME_LS_KEY = 'jetnity:theme'

export type ThemeMode = 'light' | 'dark' | 'system'

export function readThemeMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_LS_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* Speicher nicht verfuegbar (privater Modus, blockierte Cookies) */
  }
  return 'system'
}

export function storeThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_LS_KEY, mode)
  } catch {
    /* Nicht speichern zu koennen darf das Umschalten nicht verhindern. */
  }
}

/** Loest 'system' gegen die Einstellung des Betriebssystems auf. */
export function resolveDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function applyDark(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark)
}
