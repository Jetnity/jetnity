import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  MFA_STEP_UP_ANFANG,
  MFA_STEP_UP_DIALOG_TEXT,
  MFA_STEP_UP_ERFOLG_TEXT,
  aalIstAusreichendFuerVerifiedUnenroll,
  aalStandLesen,
  darfMfaStepUpStarten,
  darfStepUpCodeSenden,
  faktorIstVerifiziert,
  mfaStepUpChallengeIdLesen,
  mfaStepUpCodePruefen,
  mfaStepUpDialogOffen,
  mfaStepUpErfolgBehaupten,
  mfaStepUpFehler,
  mfaStepUpFehlerEinordnen,
  mfaStepUpFehlerIstDicht,
  mfaStepUpIstBeschaeftigt,
  mfaStepUpStatusText,
  mfaStepUpUndUnenroll,
  mfaStepUpWeiter,
  mfaUnenrollDirekt,
  mfaUnenrollPlanen,
  mfaUnenrollVorbereiten,
  nutzbarerChallengeFaktor,
  type MfaStepUpAuth,
  type MfaStepUpZustand,
} from '@/lib/auth/account-mfa-step-up'
import type { MfaListFactorsData } from '@/lib/auth/account-security-faktoren'

const VERIFIZIERT = {
  id: '3c1a0d2e-1111-2222-3333-444444444444',
  status: 'verified',
  friendly_name: 'Telefon',
  created_at: '2026-08-28T10:00:00.000Z',
}

const UNVERIFIZIERT = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  status: 'unverified',
  friendly_name: null,
  created_at: null,
}

const ROH = [
  'AAL2 required to unenroll verified factor factor_id=3c1a0d2e-1111-2222-3333-444444444444',
  'Invalid TOTP code entered challenge_id=ch_123 otp=654321',
  'unexpected GoTrue error access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb',
  'session_id=12 authorization: Bearer abc',
  'otpauth://totp/Jetnity:user@example.com?secret=JBSWY3DPEHPK3PXP',
]

function lauf(start: MfaStepUpZustand, ...ereignisse: Parameters<typeof mfaStepUpWeiter>[1][]): MfaStepUpZustand {
  return ereignisse.reduce((zustand, ereignis) => mfaStepUpWeiter(zustand, ereignis), start)
}

function liste(faktoren: Array<{ id: string; status: string; friendly_name?: string | null; created_at?: string | null }>): MfaListFactorsData {
  return {
    all: faktoren.map((faktor) => ({
      id: faktor.id,
      factor_type: 'totp',
      status: faktor.status as 'verified' | 'unverified',
      friendly_name: faktor.friendly_name ?? null,
      created_at: faktor.created_at ?? null,
    })),
    totp: faktoren.map((faktor) => ({
      id: faktor.id,
      factor_type: 'totp',
      status: faktor.status as 'verified' | 'unverified',
      friendly_name: faktor.friendly_name ?? null,
      created_at: faktor.created_at ?? null,
    })),
  }
}

function authAttrappe(teil: Partial<MfaStepUpAuth> & { mfa?: Partial<NonNullable<MfaStepUpAuth['mfa']>> } = {}): MfaStepUpAuth {
  return {
    getUser: teil.getUser ?? (async () => ({ data: { user: { id: 'user-1' } }, error: null })),
    mfa: {
      listFactors: async () => ({ data: liste([VERIFIZIERT]), error: null }),
      getAuthenticatorAssuranceLevel: async () => ({
        data: { currentLevel: 'aal1', nextLevel: 'aal2' },
        error: null,
      }),
      challenge: async () => ({ data: { id: 'challenge-intern' }, error: null }),
      verify: async () => ({ error: null }),
      unenroll: async () => ({ error: null }),
      ...teil.mfa,
    },
  }
}

describe('AP-5-S4 AAL- und Faktor-Semantik', () => {
  test('nur currentLevel aal2 ist ausreichend; nextLevel allein nicht', () => {
    assert.equal(
      aalIstAusreichendFuerVerifiedUnenroll(aalStandLesen({ currentLevel: 'aal2', nextLevel: 'aal2' })),
      true,
    )
    assert.equal(
      aalIstAusreichendFuerVerifiedUnenroll(aalStandLesen({ currentLevel: 'aal1', nextLevel: 'aal2' })),
      false,
    )
    assert.equal(
      aalIstAusreichendFuerVerifiedUnenroll(aalStandLesen({ currentLevel: null, nextLevel: 'aal2' })),
      false,
    )
    assert.equal(faktorIstVerifiziert('verified'), true)
    assert.equal(faktorIstVerifiziert('unverified'), false)
    assert.equal(faktorIstVerifiziert('unbekannt'), 'unbekannt')
  })

  test('bereits AAL2 plant direkten Unenroll ohne Step-up', () => {
    const plan = mfaUnenrollPlanen({
      zielFaktorId: VERIFIZIERT.id,
      faktoren: [VERIFIZIERT],
      aal: { currentLevel: 'aal2', nextLevel: 'aal2' },
      aalLesbar: true,
      apis: { listFactors: true, getAal: true, challenge: true, verify: true, unenroll: true },
      sitzungVorhanden: true,
    })
    assert.deepEqual(plan, { art: 'direkt_unenroll', grund: 'bereits_aal2' })
  })

  test('AAL1 plus verifizierter TOTP plant Challenge/Verify vor Unenroll', () => {
    const plan = mfaUnenrollPlanen({
      zielFaktorId: VERIFIZIERT.id,
      faktoren: [VERIFIZIERT],
      aal: { currentLevel: 'aal1', nextLevel: 'aal2' },
      aalLesbar: true,
      apis: { listFactors: true, getAal: true, challenge: true, verify: true, unenroll: true },
      sitzungVorhanden: true,
    })
    assert.deepEqual(plan, {
      art: 'step_up',
      grund: 'verified_braucht_aal2',
      challengeFaktorId: VERIFIZIERT.id,
    })
    assert.equal(nutzbarerChallengeFaktor([VERIFIZIERT, UNVERIFIZIERT], VERIFIZIERT.id), VERIFIZIERT.id)
  })

  test('unverified Unenroll bleibt ohne Step-up, auch ohne AAL-API', () => {
    const plan = mfaUnenrollPlanen({
      zielFaktorId: UNVERIFIZIERT.id,
      bekannterStatus: 'unverified',
      faktoren: [UNVERIFIZIERT],
      aal: null,
      aalLesbar: false,
      apis: { listFactors: true, getAal: false, challenge: false, verify: false, unenroll: true },
      sitzungVorhanden: true,
    })
    assert.deepEqual(plan, { art: 'direkt_unenroll', grund: 'unverified' })
  })

  test('unbekannter Status ist fail-closed und fordert AAL2 oder Step-up', () => {
    const unbekannt = { ...VERIFIZIERT, status: 'pending' }
    const aal2 = mfaUnenrollPlanen({
      zielFaktorId: unbekannt.id,
      faktoren: [unbekannt],
      aal: { currentLevel: 'aal2', nextLevel: 'aal2' },
      aalLesbar: true,
      apis: { listFactors: true, getAal: true, challenge: true, verify: true, unenroll: true },
      sitzungVorhanden: true,
    })
    assert.equal(aal2.art, 'direkt_unenroll')

    const aal1OhneVerified = mfaUnenrollPlanen({
      zielFaktorId: unbekannt.id,
      faktoren: [unbekannt],
      aal: { currentLevel: 'aal1', nextLevel: 'aal2' },
      aalLesbar: true,
      apis: { listFactors: true, getAal: true, challenge: true, verify: true, unenroll: true },
      sitzungVorhanden: true,
    })
    assert.deepEqual(aal1OhneVerified, { art: 'unavailable', grund: 'kein_verifizierter_totp' })
  })

  test('fehlende listFactors-API ist für verified Faktoren unsupported', () => {
    const plan = mfaUnenrollPlanen({
      zielFaktorId: VERIFIZIERT.id,
      bekannterStatus: 'verified',
      faktoren: [],
      aal: { currentLevel: 'aal1', nextLevel: 'aal2' },
      aalLesbar: true,
      apis: { listFactors: false, getAal: true, challenge: true, verify: true, unenroll: true },
      sitzungVorhanden: true,
    })
    assert.deepEqual(plan, { art: 'unsupported', grund: 'api_fehlt' })
  })

  test('stale oder fehlende Ziel-ID plant keinen Unenroll', () => {
    const plan = mfaUnenrollPlanen({
      zielFaktorId: 'stale-id',
      faktoren: [VERIFIZIERT],
      aal: { currentLevel: 'aal1', nextLevel: 'aal2' },
      aalLesbar: true,
      apis: { listFactors: true, getAal: true, challenge: true, verify: true, unenroll: true },
      sitzungVorhanden: true,
    })
    assert.deepEqual(plan, { art: 'fehler', grund: 'faktor_stale' })
  })
})

describe('AP-5-S4 Zustände', () => {
  test('trennt idle, working, success, error, unavailable und unsupported', () => {
    const gestartet = mfaStepUpWeiter(MFA_STEP_UP_ANFANG, { typ: 'starte', faktorId: VERIFIZIERT.id })
    assert.equal(gestartet.lage, 'working')
    assert.equal(gestartet.phase, 'pruefen')
    assert.equal(mfaStepUpErfolgBehaupten(gestartet), false)
    assert.equal(mfaStepUpIstBeschaeftigt(gestartet), true)

    const stepUp = mfaStepUpWeiter(gestartet, { typ: 'plan_step_up' })
    assert.equal(stepUp.lage, 'idle')
    assert.equal(stepUp.phase, 'warte_auf_code')
    assert.equal(stepUp.brauchtStepUp, true)
    assert.equal(mfaStepUpDialogOffen(stepUp), true)
    assert.equal(mfaStepUpErfolgBehaupten(stepUp), false)

    const bestaetigt = lauf(stepUp, { typ: 'code_bereit' }, { typ: 'ausfuehren_ok' })
    assert.equal(bestaetigt.lage, 'success')
    assert.equal(mfaStepUpErfolgBehaupten(bestaetigt), true)
    assert.equal(mfaStepUpStatusText(bestaetigt), MFA_STEP_UP_ERFOLG_TEXT)
  })

  test('bereits AAL2 erzwingt keinen Dialog und Erfolg erst nach Unenroll', () => {
    const direkt = lauf(MFA_STEP_UP_ANFANG, { typ: 'starte', faktorId: VERIFIZIERT.id }, { typ: 'plan_direkt' })
    assert.equal(direkt.phase, 'entfernen')
    assert.equal(direkt.brauchtStepUp, false)
    assert.equal(mfaStepUpDialogOffen(direkt), false)
    assert.equal(mfaStepUpErfolgBehaupten(direkt), false)

    const fertig = mfaStepUpWeiter(direkt, { typ: 'ausfuehren_ok' })
    assert.equal(fertig.lage, 'success')
  })

  test('Abbruch und Fehler laufen nicht still zum Unenroll weiter', () => {
    const dialog = lauf(MFA_STEP_UP_ANFANG, { typ: 'starte', faktorId: VERIFIZIERT.id }, { typ: 'plan_step_up' })
    assert.equal(mfaStepUpWeiter(dialog, { typ: 'abbrechen' }).lage, 'idle')
    assert.equal(mfaStepUpWeiter(dialog, { typ: 'abbrechen' }).phase, 'idle')

    const busy = lauf(dialog, { typ: 'code_bereit' })
    assert.equal(mfaStepUpWeiter(busy, { typ: 'abbrechen' }).phase, 'bestaetigen')
    assert.equal(darfMfaStepUpStarten(dialog), false)
    assert.equal(darfStepUpCodeSenden(dialog), true)
  })

  test('Verify- oder Challenge-Fehler behaupten keinen Erfolg', () => {
    const fehler = lauf(
      MFA_STEP_UP_ANFANG,
      { typ: 'starte', faktorId: VERIFIZIERT.id },
      { typ: 'plan_step_up' },
      { typ: 'code_bereit' },
      { typ: 'ausfuehren_fehler', fehler: mfaStepUpFehler('verify_invalid') },
    )
    assert.equal(fehler.lage, 'error')
    assert.equal(mfaStepUpErfolgBehaupten(fehler), false)
    assert.equal(mfaStepUpDialogOffen(fehler), true)
    assert.equal(darfStepUpCodeSenden(fehler), true)
  })

  test('Unenroll-Fehler nach Step-up ist kein Gesamterfolg', () => {
    const fehler = lauf(
      MFA_STEP_UP_ANFANG,
      { typ: 'starte', faktorId: VERIFIZIERT.id },
      { typ: 'plan_step_up' },
      { typ: 'code_bereit' },
      { typ: 'ausfuehren_fehler', fehler: mfaStepUpFehler('unenroll_failed_nach_step_up') },
    )
    assert.equal(fehler.lage, 'error')
    assert.equal(mfaStepUpErfolgBehaupten(fehler), false)
    assert.match(mfaStepUpStatusText(fehler), /trotzdem nicht entfernt/i)
    assert.doesNotMatch(mfaStepUpStatusText(fehler), /entfernt\.$/)
  })

  test('unsupported und unavailable bleiben eigene Lagen', () => {
    const fehlt = lauf(MFA_STEP_UP_ANFANG, { typ: 'starte', faktorId: VERIFIZIERT.id }, { typ: 'client_unbekannt' })
    assert.equal(fehlt.lage, 'unsupported')
    assert.equal(darfMfaStepUpStarten(fehlt), false)

    const sitzung = lauf(MFA_STEP_UP_ANFANG, { typ: 'starte', faktorId: VERIFIZIERT.id }, { typ: 'client_ohne_sitzung' })
    assert.equal(sitzung.lage, 'unavailable')
    assert.match(mfaStepUpStatusText(sitzung), /Sitzung/i)
  })
})

describe('AP-5-S4 Ausführung', () => {
  test('AAL2 unenrollt ohne Challenge und Verify', async () => {
    const aufrufe: string[] = []
    const auth = authAttrappe({
      mfa: {
        getAuthenticatorAssuranceLevel: async () => {
          aufrufe.push('aal')
          return { data: { currentLevel: 'aal2', nextLevel: 'aal2' }, error: null }
        },
        challenge: async () => {
          aufrufe.push('challenge')
          return { data: { id: 'ch' }, error: null }
        },
        verify: async () => {
          aufrufe.push('verify')
          return { error: null }
        },
        unenroll: async ({ factorId }) => {
          aufrufe.push(`unenroll:${factorId}`)
          return { error: null }
        },
      },
    })

    const vorbereitung = await mfaUnenrollVorbereiten(auth, VERIFIZIERT.id, 'verified')
    assert.equal(vorbereitung.typ, 'plan_direkt')
    const fertig = await mfaUnenrollDirekt(auth, VERIFIZIERT.id)
    assert.deepEqual(fertig, { typ: 'ausfuehren_ok' })
    assert.equal(aufrufe.includes('challenge'), false)
    assert.equal(aufrufe.includes('verify'), false)
    assert.equal(aufrufe.includes(`unenroll:${VERIFIZIERT.id}`), true)
  })

  test('AAL1 challenge/verify/AAL-Recheck vor Unenroll', async () => {
    const aufrufe: string[] = []
    let aal = 'aal1'
    const auth = authAttrappe({
      mfa: {
        getAuthenticatorAssuranceLevel: async () => {
          aufrufe.push(`aal:${aal}`)
          return { data: { currentLevel: aal, nextLevel: 'aal2' }, error: null }
        },
        challenge: async ({ factorId }) => {
          aufrufe.push(`challenge:${factorId}`)
          return { data: { id: 'challenge-intern' }, error: null }
        },
        verify: async ({ factorId, challengeId, code }) => {
          aufrufe.push(`verify:${factorId}:${challengeId}:${code}`)
          aal = 'aal2'
          return { error: null }
        },
        unenroll: async ({ factorId }) => {
          aufrufe.push(`unenroll:${factorId}`)
          return { error: null }
        },
      },
    })

    const vorbereitung = await mfaUnenrollVorbereiten(auth, VERIFIZIERT.id, 'verified')
    assert.equal(vorbereitung.typ, 'plan_step_up')
    const fertig = await mfaStepUpUndUnenroll(auth, { faktorId: VERIFIZIERT.id, code: '123456' })
    assert.equal(fertig.typ, 'ausfuehren_ok')
    assert.equal(aufrufe.includes(`challenge:${VERIFIZIERT.id}`), true)
    assert.equal(aufrufe.includes(`verify:${VERIFIZIERT.id}:challenge-intern:123456`), true)
    assert.equal(aufrufe.includes('aal:aal2'), true)
    assert.equal(aufrufe.includes(`unenroll:${VERIFIZIERT.id}`), true)
  })

  test('falscher Code, Challenge-Fehler und Verify-Fehler unenrollen nicht', async () => {
    const unenroll = async () => {
      throw new Error('unenroll darf nicht laufen')
    }

    const lokal = await mfaStepUpUndUnenroll(authAttrappe({ mfa: { unenroll } }), {
      faktorId: VERIFIZIERT.id,
      code: '12',
    })
    assert.equal(lokal.typ, 'ausfuehren_fehler')
    if (lokal.typ === 'ausfuehren_fehler') assert.equal(lokal.fehler.code, 'code_ungueltig')

    const challenge = await mfaStepUpUndUnenroll(
      authAttrappe({
        mfa: {
          challenge: async () => ({
            data: null,
            error: { message: 'challenge failed', status: 500 },
          }),
          unenroll,
        },
      }),
      { faktorId: VERIFIZIERT.id, code: '123456' },
    )
    assert.equal(challenge.typ, 'ausfuehren_fehler')
    if (challenge.typ === 'ausfuehren_fehler') assert.equal(challenge.fehler.code, 'challenge_failed')

    const verify = await mfaStepUpUndUnenroll(
      authAttrappe({
        mfa: {
          verify: async () => ({ error: { message: 'Invalid TOTP code entered', code: 'invalid' } }),
          unenroll,
        },
      }),
      { faktorId: VERIFIZIERT.id, code: '123456' },
    )
    assert.equal(verify.typ, 'ausfuehren_fehler')
    if (verify.typ === 'ausfuehren_fehler') assert.equal(verify.fehler.code, 'verify_invalid')
  })

  test('Verify-Erfolg ohne AAL2 unenrollt nicht', async () => {
    let unenroll = 0
    const fertig = await mfaStepUpUndUnenroll(
      authAttrappe({
        mfa: {
          getAuthenticatorAssuranceLevel: async () => ({
            data: { currentLevel: 'aal1', nextLevel: 'aal2' },
            error: null,
          }),
          unenroll: async () => {
            unenroll += 1
            return { error: null }
          },
        },
      }),
      { faktorId: VERIFIZIERT.id, code: '123456' },
    )
    assert.equal(fertig.typ, 'ausfuehren_fehler')
    if (fertig.typ === 'ausfuehren_fehler') assert.equal(fertig.fehler.code, 'aal_nicht_bestaetigt')
    assert.equal(unenroll, 0)
  })

  test('Unenroll-Fehler nach erfolgreichem Step-up bleibt Fehler', async () => {
    let aal = 'aal1'
    const fertig = await mfaStepUpUndUnenroll(
      authAttrappe({
        mfa: {
          getAuthenticatorAssuranceLevel: async () => ({
            data: { currentLevel: aal, nextLevel: 'aal2' },
            error: null,
          }),
          verify: async () => {
            aal = 'aal2'
            return { error: null }
          },
          unenroll: async () => ({ error: { message: 'unenroll failed', status: 500 } }),
        },
      }),
      { faktorId: VERIFIZIERT.id, code: '123456' },
    )
    assert.equal(fertig.typ, 'ausfuehren_fehler')
    if (fertig.typ === 'ausfuehren_fehler') {
      assert.equal(fertig.fehler.code, 'unenroll_failed_nach_step_up')
      assert.match(fertig.fehler.text, /trotzdem nicht entfernt/i)
    }
  })

  test('stale Faktor-ID unenrollt keinen anderen Faktor', async () => {
    const fertig = await mfaStepUpUndUnenroll(authAttrappe(), {
      faktorId: 'andere-id',
      code: '123456',
    })
    assert.equal(fertig.typ, 'ausfuehren_fehler')
    if (fertig.typ === 'ausfuehren_fehler') assert.equal(fertig.fehler.code, 'faktor_stale')

    const direkt = await mfaUnenrollDirekt(
      authAttrappe({
        mfa: {
          unenroll: async ({ factorId }) => {
            if (factorId !== VERIFIZIERT.id) throw new Error('fremde ID')
            return { error: null }
          },
        },
      }),
      'andere-id',
    )
    assert.equal(direkt.typ, 'ausfuehren_fehler')
  })

  test('unverified Enroll-Abbruch geht ohne AAL-API', async () => {
    const vorbereitung = await mfaUnenrollVorbereiten(
      authAttrappe({
        mfa: {
          listFactors: async () => ({ data: liste([UNVERIFIZIERT]), error: null }),
          getAuthenticatorAssuranceLevel: undefined,
        },
      }),
      UNVERIFIZIERT.id,
      'unverified',
    )
    assert.equal(vorbereitung.typ, 'plan_direkt')
  })
})

describe('AP-5-S4 Fehlerhygiene', () => {
  test('bildet Roh-GoTrue auf dichte Produktcopy ab', () => {
    const aal2 = mfaStepUpFehlerEinordnen({
      vorgang: 'unenroll',
      code: 'insufficient_aal',
      status: 403,
      meldung: 'AAL2 required to unenroll verified factor',
    })
    assert.equal(aal2.code, 'unenroll_aal2_required')
    assert.equal(mfaStepUpFehlerIstDicht(aal2.text, 'AAL2 required to unenroll verified factor'), true)

    const otp = mfaStepUpFehlerEinordnen({
      vorgang: 'verify',
      meldung: 'Invalid TOTP code entered 654321',
    })
    assert.equal(otp.code, 'verify_invalid')
    assert.equal(mfaStepUpFehlerIstDicht(otp.text, 'Invalid TOTP code entered 654321'), true)
    assert.doesNotMatch(otp.text, /654321|factor_id|challenge/i)
  })

  test('Status- und Fehlertexte enthalten keine IDs, Tokens oder OTP', () => {
    const zustand = lauf(
      MFA_STEP_UP_ANFANG,
      { typ: 'starte', faktorId: VERIFIZIERT.id },
      { typ: 'plan_step_up' },
    )
    const texte = [
      mfaStepUpStatusText(zustand),
      MFA_STEP_UP_DIALOG_TEXT,
      MFA_STEP_UP_ERFOLG_TEXT,
      ...ROH.map((roh) =>
        mfaStepUpFehlerEinordnen({
          vorgang: 'verify',
          meldung: roh,
        }).text,
      ),
    ]
    for (const text of texte) {
      assert.equal(mfaStepUpFehlerIstDicht(text), true, text)
      assert.doesNotMatch(text, /3c1a0d2e|challenge-intern|eyJ|otpauth|654321|session_id/i)
    }
    assert.equal(mfaStepUpChallengeIdLesen({ id: 'ch_1' }), 'ch_1')
    assert.equal(mfaStepUpChallengeIdLesen({ challenge_id: 'ch_2' }), 'ch_2')
    assert.equal(mfaStepUpCodePruefen('123456'), null)
    assert.equal(mfaStepUpCodePruefen('12345')?.code, 'code_ungueltig')
    assert.equal(mfaStepUpCodePruefen('12345a')?.code, 'code_ungueltig')
  })
})
