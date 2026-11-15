import 'server-only'

import {
  createServerActionClient,
  createServerComponentClient,
  getServerSupabaseUrl,
} from '@/lib/supabase/server'
import {
  uiEinstellungenImPortSpeichern,
  uiEinstellungenVomPortLesen,
  type UiEinstellungenAuthPort,
} from './speicher'
import {
  uiEinstellungenEingabeLesen,
  type UiEinstellungenLesen,
  type UiEinstellungenSpeichernErgebnis,
} from './vertrag'

const DEV_URL = 'https://yfvbxvijcorffwxbxahl.supabase.co'
const PROD_URL = 'https://qscbgcdmivbbnzrcyegn.supabase.co'
const VERCEL_PROJEKT = 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'

type Umgebung = {
  factoryUrl: string | undefined
  laufzeitUrl: string | undefined
  oeffentlicherSchluesselVorhanden: boolean
  vercel: string | undefined
  vercelUmgebung: string | undefined
  vercelZiel: string | undefined
  vercelProjekt: string | undefined
  nodeUmgebung: string | undefined
  uiAudit: string | undefined
}

function loopbackFixture(url: string): boolean {
  try {
    const ziel = new URL(url)
    return ziel.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(ziel.hostname)
      && ziel.port !== '' && ziel.username === '' && ziel.password === ''
      && ziel.pathname === '/' && ziel.search === '' && ziel.hash === ''
  } catch {
    return false
  }
}

/** Target configuration only; owner deployment approval is a release decision. */
export function uiEinstellungenZielErlaubt(umgebung: Umgebung): boolean {
  if (!umgebung.oeffentlicherSchluesselVorhanden || !umgebung.factoryUrl
    || umgebung.factoryUrl !== umgebung.laufzeitUrl) return false
  if (umgebung.vercel === '1') {
    if (umgebung.vercelProjekt !== VERCEL_PROJEKT) return false
    if (umgebung.vercelUmgebung === 'preview' && umgebung.vercelZiel === 'preview') {
      return umgebung.factoryUrl === DEV_URL
    }
    if (umgebung.vercelUmgebung === 'production' && umgebung.vercelZiel === 'production') {
      return umgebung.factoryUrl === PROD_URL
    }
    return false
  }
  // No implicit local access to either hosted project. This branch exists only
  // for an explicitly enabled local UI-audit process backed by loopback fixtures.
  return umgebung.vercel === undefined && umgebung.vercelUmgebung === undefined
    && umgebung.vercelZiel === undefined && umgebung.vercelProjekt === undefined
    && ['development', 'test'].includes(umgebung.nodeUmgebung ?? '')
    && umgebung.uiAudit === '1' && loopbackFixture(umgebung.factoryUrl)
}

type SessionClient = { auth: Pick<UiEinstellungenAuthPort, 'getUser' | 'updateUser'> }
type ServerPorts = {
  umgebung: () => Umgebung
  rscClient: () => Promise<SessionClient>
  actionClient: () => Promise<SessionClient>
}

/** Production adapter with an explicit test seam; never a remotely callable API. */
export function uiEinstellungenServerMitPorts(ports: ServerPorts) {
  const verfuegbar = () => uiEinstellungenZielErlaubt(ports.umgebung())

  async function authPort(art: 'seite' | 'aktion'): Promise<UiEinstellungenAuthPort | null> {
    try {
      if (!verfuegbar()) return null
      const client = await (art === 'seite' ? ports.rscClient() : ports.actionClient())
      if (!verfuegbar()) return null
      return {
        istVerfuegbar: verfuegbar,
        getUser: () => client.auth.getUser(),
        updateUser: (eingabe) => client.auth.updateUser(eingabe),
      }
    } catch {
      return null
    }
  }

  async function lesen(art: 'seite' | 'aktion'): Promise<UiEinstellungenLesen> {
    const port = await authPort(art)
    return port ? uiEinstellungenVomPortLesen(port) : { status: 'nicht_verfuegbar' }
  }

  return {
    fuerSeite: () => lesen('seite'),
    neuLaden: () => lesen('aktion'),
    async speichern(eingabe: unknown): Promise<UiEinstellungenSpeichernErgebnis> {
      const wert = uiEinstellungenEingabeLesen(eingabe)
      if (!wert) return { ok: false, code: 'eingabe' }
      const port = await authPort('aktion')
      return port ? uiEinstellungenImPortSpeichern(port, wert) : { ok: false, code: 'nicht_verfuegbar' }
    },
  }
}

function laufzeitUmgebung(): Umgebung {
  // Read the runtime object separately from the factory's captured public URL.
  const env = process.env
  return {
    factoryUrl: getServerSupabaseUrl(),
    laufzeitUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    oeffentlicherSchluesselVorhanden: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
    vercel: env.VERCEL,
    vercelUmgebung: env.VERCEL_ENV,
    vercelZiel: env.VERCEL_TARGET_ENV,
    vercelProjekt: env.VERCEL_PROJECT_ID,
    nodeUmgebung: env.NODE_ENV,
    uiAudit: env.JETNITY_UI_AUDIT,
  }
}

const anwendung = uiEinstellungenServerMitPorts({
  umgebung: laufzeitUmgebung,
  rscClient: () => createServerComponentClient(),
  actionClient: () => createServerActionClient(),
})

export async function uiEinstellungenFuerSeite(): Promise<UiEinstellungenLesen> {
  return anwendung.fuerSeite()
}

export async function uiEinstellungenFuerAktionLesen(): Promise<UiEinstellungenLesen> {
  return anwendung.neuLaden()
}

export async function uiEinstellungenFuerAktionSpeichern(eingabe: unknown): Promise<UiEinstellungenSpeichernErgebnis> {
  return anwendung.speichern(eingabe)
}
