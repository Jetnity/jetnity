import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { MFATotpDialog } from '@/components/auth/MFATotpDialog'
import { istKeinTotpFaktorFehler } from '@/lib/auth/admin-aal'
import {
  getAAL,
  MFA_API_FEHLT,
  MFA_CHALLENGE_ID_FEHLT,
  MFA_TOTP_FEHLT,
  startTotpChallenge,
  type BrowserSupabase,
} from '@/lib/auth/mfa'
import type { MfaFaktor, MfaListFactorsData } from '@/lib/auth/account-security-faktoren'

const KEINE_TOTP_MELDUNG = MFA_TOTP_FEHLT

const SYNTHETIC_VERIFIED_ID = 'synthetic-factor'
const SYNTHETIC_CHALLENGE_ID = 'synthetic-challenge'

const AKTUELLER_VERIFIZIERTER_TOTP: MfaFaktor = {
  id: SYNTHETIC_VERIFIED_ID,
  factor_type: 'totp',
  status: 'verified',
}

const AKTUELLE_SDK_ANTWORT: MfaListFactorsData = {
  all: [AKTUELLER_VERIFIZIERTER_TOTP],
  totp: [AKTUELLER_VERIFIZIERTER_TOTP],
  phone: [],
}

type ChallengeAufruf = { factorId: string }

function supabaseAttrappe(eingabe: {
  listFactors?: () => Promise<{ data?: unknown; error?: Error | null }> | { data?: unknown; error?: Error | null }
  challenge?: (args: ChallengeAufruf) => Promise<{
    data?: { id?: string; challenge_id?: string } | null
    error?: Error | null
  }>
  getAal?: () => Promise<{
    data?: { currentLevel?: string | null; nextLevel?: string | null } | null
    error?: Error | null
  }>
  ohneMfa?: boolean
  ohneListFactors?: boolean
  ohneChallenge?: boolean
}): { client: BrowserSupabase; listCount: { n: number }; challengeCount: { n: number }; challenges: ChallengeAufruf[] } {
  const listCount = { n: 0 }
  const challengeCount = { n: 0 }
  const challenges: ChallengeAufruf[] = []

  const listFactors =
    eingabe.listFactors ??
    (async () => ({ data: AKTUELLE_SDK_ANTWORT, error: null }))
  const challenge =
    eingabe.challenge ??
    (async () => ({ data: { id: SYNTHETIC_CHALLENGE_ID }, error: null }))

  const mfa: Record<string, unknown> = {}
  if (!eingabe.ohneListFactors) {
    mfa.listFactors = async () => {
      listCount.n += 1
      return listFactors()
    }
  }
  if (!eingabe.ohneChallenge) {
    mfa.challenge = async (args: ChallengeAufruf) => {
      challengeCount.n += 1
      challenges.push(args)
      return challenge(args)
    }
  }
  if (eingabe.getAal) {
    mfa.getAuthenticatorAssuranceLevel = eingabe.getAal
  }

  const client = {
    auth: eingabe.ohneMfa ? {} : { mfa },
  } as unknown as BrowserSupabase

  return { client, listCount, challengeCount, challenges }
}

async function erwartetFehler(lauf: () => Promise<unknown>, meldung: string | RegExp) {
  await assert.rejects(lauf, (err: unknown) => {
    assert.ok(err instanceof Error)
    if (typeof meldung === 'string') {
      assert.equal(err.message, meldung)
    } else {
      assert.match(err.message, meldung)
    }
    return true
  })
}

describe('startTotpChallenge – bestehende verifizierte Faktoren', () => {
  test('aktuelle SDK-Form factor_type=totp + verified startet genau eine Challenge', async () => {
    const { client, listCount, challengeCount, challenges } = supabaseAttrappe({})
    const ergebnis = await startTotpChallenge(client)
    assert.deepEqual(ergebnis, { factorId: SYNTHETIC_VERIFIED_ID, challengeId: SYNTHETIC_CHALLENGE_ID })
    assert.equal(listCount.n, 1)
    assert.equal(challengeCount.n, 1)
    assert.deepEqual(challenges, [{ factorId: SYNTHETIC_VERIFIED_ID }])
  })

  test('legacy type=totp ohne factor_type bleibt unterstützter Fallback', async () => {
    const faktor: MfaFaktor = {
      id: 'legacy-type-factor',
      factor_type: '' as MfaFaktor['factor_type'],
      type: 'totp',
      status: 'verified',
    }
    const { client, challengeCount, challenges } = supabaseAttrappe({
      listFactors: async () => ({
        data: { factors: [faktor] },
        error: null,
      }),
    })
    const ergebnis = await startTotpChallenge(client)
    assert.equal(ergebnis.factorId, 'legacy-type-factor')
    assert.equal(ergebnis.challengeId, SYNTHETIC_CHALLENGE_ID)
    assert.equal(challengeCount.n, 1)
    assert.deepEqual(challenges, [{ factorId: 'legacy-type-factor' }])
  })

  test('factor_type schlägt widersprüchliches legacy type; phone wird kein TOTP', async () => {
    const { client, challengeCount } = supabaseAttrappe({
      listFactors: async () => ({
        data: {
          all: [
            {
              id: 'phone-not-totp',
              factor_type: 'phone',
              type: 'totp',
              status: 'verified',
            },
          ],
          totp: [],
          phone: [
            {
              id: 'phone-not-totp',
              factor_type: 'phone',
              type: 'totp',
              status: 'verified',
            },
          ],
        },
        error: null,
      }),
    })
    await erwartetFehler(() => startTotpChallenge(client), KEINE_TOTP_MELDUNG)
    assert.equal(challengeCount.n, 0)
  })

  test('unverified zuerst, verified danach wählt nur den verified TOTP', async () => {
    const unverified: MfaFaktor = {
      id: 'unverified-first',
      factor_type: 'totp',
      status: 'unverified',
    }
    const verified: MfaFaktor = {
      id: 'verified-second',
      factor_type: 'totp',
      status: 'verified',
    }
    const { client, challengeCount, challenges } = supabaseAttrappe({
      listFactors: async () => ({
        data: { all: [unverified, verified], totp: [verified], phone: [] },
        error: null,
      }),
    })
    const ergebnis = await startTotpChallenge(client)
    assert.equal(ergebnis.factorId, 'verified-second')
    assert.equal(challengeCount.n, 1)
    assert.deepEqual(challenges, [{ factorId: 'verified-second' }])
  })

  test('nur unverified TOTP ist echter no-factor-Pfad ohne Challenge', async () => {
    const { client, listCount, challengeCount } = supabaseAttrappe({
      listFactors: async () => ({
        data: {
          all: [{ id: 'only-unverified', factor_type: 'totp', status: 'unverified' }],
          totp: [],
          phone: [],
        },
        error: null,
      }),
    })
    await erwartetFehler(() => startTotpChallenge(client), KEINE_TOTP_MELDUNG)
    assert.equal(listCount.n, 1)
    assert.equal(challengeCount.n, 0)
  })

  test('leere gültige Liste ist no-factor ohne Challenge', async () => {
    const { client, challengeCount } = supabaseAttrappe({
      listFactors: async () => ({
        data: { all: [], totp: [], phone: [] },
        error: null,
      }),
    })
    await erwartetFehler(() => startTotpChallenge(client), KEINE_TOTP_MELDUNG)
    assert.equal(challengeCount.n, 0)
  })

  test('nur Phone-Faktor ist no-factor ohne Challenge', async () => {
    const { client, challengeCount } = supabaseAttrappe({
      listFactors: async () => ({
        data: {
          all: [{ id: 'phone-only', factor_type: 'phone', status: 'verified' }],
          totp: [],
          phone: [{ id: 'phone-only', factor_type: 'phone', status: 'verified' }],
        },
        error: null,
      }),
    })
    await erwartetFehler(() => startTotpChallenge(client), KEINE_TOTP_MELDUNG)
    assert.equal(challengeCount.n, 0)
  })

  test('fehlende SDK-Methode ist Fehler, nicht no-factor, ohne Challenge', async () => {
    const { client, challengeCount } = supabaseAttrappe({ ohneListFactors: true })
    await erwartetFehler(() => startTotpChallenge(client), MFA_API_FEHLT)
    assert.equal(challengeCount.n, 0)
    assert.equal(istKeinTotpFaktorFehler(new Error(MFA_API_FEHLT)), false)
  })

  test('abgelehnte listFactors bleibt Fehler und ruft challenge nicht', async () => {
    const listFehler = new Error('listFactors rejected')
    const { client, challengeCount } = supabaseAttrappe({
      listFactors: async () => ({ data: null, error: listFehler }),
    })
    await assert.rejects(() => startTotpChallenge(client), listFehler)
    assert.equal(challengeCount.n, 0)
    assert.equal(istKeinTotpFaktorFehler(listFehler), false)
  })

  test('geworfene listFactors bleibt Fehler und ruft challenge nicht', async () => {
    const listFehler = new Error('listFactors threw')
    const { client, challengeCount } = supabaseAttrappe({
      listFactors: async () => {
        throw listFehler
      },
    })
    await assert.rejects(() => startTotpChallenge(client), listFehler)
    assert.equal(challengeCount.n, 0)
  })

  test('unlesbare Antwort ist Fehler, nicht no-factor, ohne Challenge', async () => {
    for (const data of [null, undefined, {}, { all: 'nope' }, { totp: { id: SYNTHETIC_VERIFIED_ID } }]) {
      const { client, challengeCount } = supabaseAttrappe({
        listFactors: async () => ({ data, error: null }),
      })
      await assert.rejects(async () => startTotpChallenge(client), (err: unknown) => {
        assert.ok(err instanceof Error)
        assert.equal(istKeinTotpFaktorFehler(err), false)
        assert.notEqual(err.message, KEINE_TOTP_MELDUNG)
        return true
      })
      assert.equal(challengeCount.n, 0)
    }
  })

  test('verified TOTP ohne gültige ID ist no-factor ohne Challenge', async () => {
    const { client, challengeCount } = supabaseAttrappe({
      listFactors: async () => ({
        data: {
          all: [{ id: '', factor_type: 'totp', status: 'verified' }],
          totp: [{ id: '', factor_type: 'totp', status: 'verified' }],
          phone: [],
        },
        error: null,
      }),
    })
    await erwartetFehler(() => startTotpChallenge(client), KEINE_TOTP_MELDUNG)
    assert.equal(challengeCount.n, 0)
  })

  test('Challenge-Fehler bleibt Fehler und liefert keine Fake-ID', async () => {
    const challengeFehler = new Error('challenge rejected')
    const { client, listCount, challengeCount } = supabaseAttrappe({
      challenge: async () => ({ data: null, error: challengeFehler }),
    })
    await assert.rejects(() => startTotpChallenge(client), challengeFehler)
    assert.equal(listCount.n, 1)
    assert.equal(challengeCount.n, 1)
  })

  test('fehlende challengeId bleibt Fehler', async () => {
    const { client, challengeCount } = supabaseAttrappe({
      challenge: async () => ({ data: {}, error: null }),
    })
    await erwartetFehler(() => startTotpChallenge(client), MFA_CHALLENGE_ID_FEHLT)
    assert.equal(challengeCount.n, 1)
  })

  test('challenge_id bleibt unterstützte Challenge-Antwort', async () => {
    const { client } = supabaseAttrappe({
      challenge: async () => ({ data: { challenge_id: 'legacy-challenge' }, error: null }),
    })
    const ergebnis = await startTotpChallenge(client)
    assert.equal(ergebnis.challengeId, 'legacy-challenge')
    assert.equal(ergebnis.factorId, SYNTHETIC_VERIFIED_ID)
  })
})

describe('Login- und Admin-Verbraucherverträge', () => {
  const hier = dirname(fileURLToPath(import.meta.url))
  const login = readFileSync(join(hier, '../../components/auth/LoginForm.tsx'), 'utf8')
  const admin = readFileSync(join(hier, '../../app/(public)/admin/mfa/AdminMfaStepUp.tsx'), 'utf8')
  const adminSeite = readFileSync(join(hier, '../../app/(public)/admin/mfa/page.tsx'), 'utf8')
  const adminAction = readFileSync(join(hier, '../../app/(public)/admin/mfa/actions.ts'), 'utf8')

  test('frisches AAL1 mit verified TOTP öffnet den Code-Dialog, nicht Enrollment', async () => {
    const { client, challengeCount } = supabaseAttrappe({
      getAal: async () => ({
        data: { currentLevel: 'aal1', nextLevel: 'aal2' },
        error: null,
      }),
    })
    const aal = await getAAL(client)
    assert.equal(aal.currentLevel, 'aal1')
    assert.equal(aal.nextLevel, 'aal2')
    assert.equal(aal.currentLevel !== 'aal2' && aal.nextLevel === 'aal2', true)

    const ids = await startTotpChallenge(client)
    assert.equal(challengeCount.n, 1)
    const html = renderToStaticMarkup(
      createElement(MFATotpDialog, {
        open: true,
        onClose: () => undefined,
        supabase: client,
        factorId: ids.factorId,
        challengeId: ids.challengeId,
      }),
    )
    assert.match(html, /Bestätige deinen TOTP-Code/)
    assert.match(html, /6-stelligen Code/)
    assert.match(html, /htmlFor="mfa-totp"|for="mfa-totp"/)
    assert.equal(html.includes('einrichten'), false)
    assert.equal(html.includes('otpauth'), false)
    assert.equal(html.includes('QR'), false)
  })

  test('bereits AAL2 startet keine Challenge', async () => {
    const { client, challengeCount } = supabaseAttrappe({
      getAal: async () => ({
        data: { currentLevel: 'aal2', nextLevel: 'aal2' },
        error: null,
      }),
    })
    const aal = await getAAL(client)
    const brauchtStepUp = aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2'
    assert.equal(brauchtStepUp, false)
    assert.equal(challengeCount.n, 0)
    assert.match(login, /aal\?\.nextLevel === 'aal2' && aal\?\.currentLevel !== 'aal2'/)
    assert.match(adminSeite, /if \(decision\.allowed\) redirect\(ziel\)/)
  })

  test('echter no-factor-Pfad bleibt Setup, Lookup-Fehler nicht', async () => {
    const leer = supabaseAttrappe({
      listFactors: async () => ({ data: { all: [], totp: [], phone: [] }, error: null }),
    })
    await assert.rejects(async () => {
      try {
        await startTotpChallenge(leer.client)
      } catch (err) {
        assert.equal(istKeinTotpFaktorFehler(err), true)
        throw err
      }
    }, (err: unknown) => err instanceof Error && err.message === KEINE_TOTP_MELDUNG)
    assert.equal(leer.challengeCount.n, 0)

    const kaputt = supabaseAttrappe({
      listFactors: async () => ({ data: null, error: new Error('AAL lookup failed') }),
    })
    await assert.rejects(async () => {
      try {
        await startTotpChallenge(kaputt.client)
      } catch (err) {
        assert.equal(istKeinTotpFaktorFehler(err), false)
        throw err
      }
    })
    assert.equal(kaputt.challengeCount.n, 0)
    assert.match(admin, /istKeinTotpFaktorFehler/)
    assert.match(admin, /TOTP unter Sicherheit einrichten/)
    assert.match(admin, /lookupFailed/)
    assert.equal(admin.includes('Authenticator-App hinzufügen'), false)
  })

  test('Server-Nachprüfung bleibt evaluateAdminAccess / AAL2', () => {
    assert.match(adminAction, /bestaetigeAdminAal2Action/)
    assert.match(adminAction, /evaluateAdminAccess/)
    assert.match(adminAction, /aal2-required/)
    assert.match(admin, /bestaetigeAdminAal2Action/)
    assert.match(login, /startTotpChallenge/)
    assert.match(login, /MFATotpDialog/)
    assert.match(admin, /startTotpChallenge/)
    assert.match(admin, /MFATotpDialog/)
  })
})
