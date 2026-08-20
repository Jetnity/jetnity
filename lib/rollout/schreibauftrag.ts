// lib/rollout/schreibauftrag.ts
//
// Welches Ziel darf beschrieben werden?
// Rein, ohne Netzwerk. Die Management-API-Prüfung liegt in scripts/auth/ziel.ts.
//
// Default ist Probe. Development braucht --schreiben --entwicklung.
// Production braucht --schreiben --produktion und den exakten Project-Ref.
// Kein Production-Ref als stilles Default.

export type ImportModus = 'probe' | 'entwicklung' | 'produktion'

export type ImportAuftrag =
  | { modus: 'probe' }
  | { modus: 'entwicklung'; bereinigen: boolean }
  | { modus: 'produktion'; bestaetigterRef: string }

export type AnwendenAuftrag =
  | { modus: 'entwicklung' }
  | { modus: 'produktion'; bestaetigterRef: string }

function argument(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  if (i < 0) return undefined
  const wert = argv[i + 1]
  if (!wert || wert.startsWith('--')) return undefined
  return wert
}

function hatFlag(argv: readonly string[], name: string): boolean {
  return argv.includes(`--${name}`)
}

type Umgebung = { SUPABASE_PROJECT_REF?: string | undefined }

export function refsStimmenUeberein(
  umgebung: string | undefined,
  bestaetigt: string | undefined,
): string {
  const envRef = umgebung?.trim() ?? ''
  const genannt = bestaetigt?.trim() ?? ''
  if (!envRef) {
    throw new Error('SUPABASE_PROJECT_REF fehlt. Production bekommt keinen stillen Default.')
  }
  if (!genannt) {
    throw new Error('Production braucht --projekt-ref mit dem exakten Ziel-Project-Ref.')
  }
  if (envRef !== genannt) {
    throw new Error(
      'Der bestätigte --projekt-ref stimmt nicht mit SUPABASE_PROJECT_REF überein. Abgebrochen.',
    )
  }
  return envRef
}

export function importAuftragLesen(
  argv: readonly string[],
  umgebung: Umgebung | NodeJS.ProcessEnv = process.env,
): ImportAuftrag {
  const schreiben = hatFlag(argv, 'schreiben')
  const entwicklung = hatFlag(argv, 'entwicklung')
  const produktion = hatFlag(argv, 'produktion')
  const bereinigen = hatFlag(argv, 'bereinigen')

  if (entwicklung && produktion) {
    throw new Error('--entwicklung und --produktion schliessen einander aus.')
  }
  if (!schreiben) {
    if (produktion) {
      throw new Error('Production-Schreiben braucht --schreiben --produktion --projekt-ref.')
    }
    return { modus: 'probe' }
  }
  if (produktion) {
    if (bereinigen) {
      throw new Error(
        'Production-Import bereinigt nicht. --bereinigen ist im Production-Modus abgelehnt.',
      )
    }
    const bestaetigterRef = refsStimmenUeberein(umgebung.SUPABASE_PROJECT_REF, argument(argv, 'projekt-ref'))
    return { modus: 'produktion', bestaetigterRef }
  }
  if (!entwicklung) {
    throw new Error(
      'Schreiben braucht --schreiben --entwicklung oder --schreiben --produktion --projekt-ref.',
    )
  }
  return { modus: 'entwicklung', bereinigen }
}

export function anwendenAuftragLesen(
  argv: readonly string[],
  umgebung: Umgebung | NodeJS.ProcessEnv = process.env,
): AnwendenAuftrag {
  const entwicklung = hatFlag(argv, 'entwicklung')
  const produktion = hatFlag(argv, 'produktion')
  if (entwicklung && produktion) {
    throw new Error('--entwicklung und --produktion schliessen einander aus.')
  }
  if (produktion) {
    const bestaetigterRef = refsStimmenUeberein(umgebung.SUPABASE_PROJECT_REF, argument(argv, 'projekt-ref'))
    return { modus: 'produktion', bestaetigterRef }
  }
  return { modus: 'entwicklung' }
}

export function pruefenAuftragLesen(
  argv: readonly string[],
  umgebung: Umgebung | NodeJS.ProcessEnv = process.env,
): AnwendenAuftrag {
  const entwicklung = hatFlag(argv, 'entwicklung')
  const produktion = hatFlag(argv, 'produktion')
  if (entwicklung && produktion) {
    throw new Error('--entwicklung und --produktion schliessen einander aus.')
  }
  if (!entwicklung && !produktion) {
    throw new Error(
      'Der Check braucht --entwicklung oder --produktion --projekt-ref. Kein stilles Default-Ziel.',
    )
  }
  if (produktion) {
    const bestaetigterRef = refsStimmenUeberein(umgebung.SUPABASE_PROJECT_REF, argument(argv, 'projekt-ref'))
    return { modus: 'produktion', bestaetigterRef }
  }
  return { modus: 'entwicklung' }
}
