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
