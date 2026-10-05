// lib/auth/register-meldung.ts
//
// Öffentliche Register-Antworten dürfen Kontoexistenz nicht unnötig leaken
// und keine unbewiesene Mail behaupten.

export const REGISTER_NEUTRALE_ANTWORT =
  'Wenn die Angaben angenommen wurden, prüfe als Nächstes dein E-Mail-Postfach.'

function nenntBestandskonto(meldung: string): boolean {
  const text = meldung.toLowerCase()
  return (
    text.includes('already registered') ||
    text.includes('already been registered') ||
    text.includes('user already exists') ||
    text.includes('already exists')
  )
}

export function registerOeffentlicheFehlercopy(meldung: string): string | null {
  if (nenntBestandskonto(meldung)) return null
  return meldung
}

export function registerNeutraleAntwort(): string {
  return REGISTER_NEUTRALE_ANTWORT
}

/** Gemeinsames Ziel für den Success-Hinweis. Beide neutralen Pfade fokussieren dasselbe. */
export const REGISTER_ERFOLG_ID = 'register-erfolg'

export type RegisterOeffentlicherErfolg = {
  success: true
  infoMsg: typeof REGISTER_NEUTRALE_ANTWORT
  errorMsg: null
  name: ''
  email: ''
  password: ''
  password2: ''
  feldfehler: Record<string, never>
  loading: false
  fokus: typeof REGISTER_ERFOLG_ID
}

export function registerOeffentlicherErfolg(): RegisterOeffentlicherErfolg {
  return {
    success: true,
    infoMsg: REGISTER_NEUTRALE_ANTWORT,
    errorMsg: null,
    name: '',
    email: '',
    password: '',
    password2: '',
    feldfehler: {},
    loading: false,
    fokus: REGISTER_ERFOLG_ID,
  }
}

export type RegisterSignupAntwort = {
  errorMessage?: string | null
  sessionVorhanden?: boolean
}

export type RegisterOeffentlichesErgebnis =
  | { art: 'neutraler-erfolg'; stand: RegisterOeffentlicherErfolg }
  | { art: 'session' }
  | { art: 'fehler'; meldung: string }

/**
 * Öffentliche Register-Semantik. Bestandskonto und neuer Signup ohne Session
 * müssen denselben beobachtbaren Erfolg erzeugen.
 */
export function registerSignupOeffentlichAuswerten(
  antwort: RegisterSignupAntwort,
): RegisterOeffentlichesErgebnis {
  if (antwort.errorMessage) {
    const oeffentlich = registerOeffentlicheFehlercopy(antwort.errorMessage)
    if (!oeffentlich) return { art: 'neutraler-erfolg', stand: registerOeffentlicherErfolg() }
    return { art: 'fehler', meldung: oeffentlich }
  }
  if (antwort.sessionVorhanden) return { art: 'session' }
  return { art: 'neutraler-erfolg', stand: registerOeffentlicherErfolg() }
}
