// lib/auth/admin-access.test.ts
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  decideAdminAccess,
  isBreakGlassEmail,
  messageForDenial,
  parseBreakGlassAllowlist,
  reachesDatabase,
  statusForDenial,
  type RoleLookup,
} from '@/lib/auth/admin-access'
import { CAPABILITIES, ROLES, minimumRoleFor, type Role } from '@/lib/auth/roles'

const USER = { id: 'konto-1', email: 'chef@jetnity.com' }
const OHNE_LISTE = new Set<string>()

const ok = (role: Role): RoleLookup => ({ status: 'ok', role })
const unbekannt: RoleLookup = { status: 'unknown' }
const kaputt: RoleLookup = { status: 'failed', reason: 'permission denied for table' }

describe('Break-Glass-Allowlist', () => {
  test('liest ausschliesslich exakte Adressen', () => {
    const liste = parseBreakGlassAllowlist('Chef@Jetnity.com , hilfe@example.org')
    assert.equal(liste.has('chef@jetnity.com'), true)
    assert.equal(liste.has('hilfe@example.org'), true)
    assert.equal(liste.size, 2)
  })

  test('eine Domain allein ist kein Eintrag', () => {
    // Der Kern der Entscheidung aus Phase 1.3: kein Domain-Fallback.
    const liste = parseBreakGlassAllowlist('@jetnity.com, jetnity.com, *@jetnity.com')
    assert.equal(liste.size, 0)
  })

  test('leer oder nicht gesetzt ergibt keinen Notzugang', () => {
    assert.equal(parseBreakGlassAllowlist(undefined).size, 0)
    assert.equal(parseBreakGlassAllowlist(null).size, 0)
    assert.equal(parseBreakGlassAllowlist('').size, 0)
    assert.equal(parseBreakGlassAllowlist('   ,  , ').size, 0)
  })

  test('kein Eintrag greift über die Domain', () => {
    const liste = parseBreakGlassAllowlist('chef@jetnity.com')
    assert.equal(isBreakGlassEmail('chef@jetnity.com', liste), true)
    assert.equal(isBreakGlassEmail('CHEF@JETNITY.COM', liste), true)
    assert.equal(isBreakGlassEmail('fremd@jetnity.com', liste), false)
    assert.equal(isBreakGlassEmail('chef@jetnity.com.angreifer.example', liste), false)
    assert.equal(isBreakGlassEmail(null, liste), false)
    assert.equal(isBreakGlassEmail('', liste), false)
  })
})

describe('Zugangsentscheidung', () => {
  test('ohne verifizierte Identität gibt es keinen Zugang', () => {
    const d = decideAdminAccess({ user: null, lookup: unbekannt, allowlist: OHNE_LISTE })
    assert.deepEqual(d, { allowed: false, denial: 'unauthenticated' })
  })

  test('auch eine Adresse auf der Notliste hilft ohne Anmeldung nicht', () => {
    const d = decideAdminAccess({
      user: null,
      lookup: unbekannt,
      allowlist: parseBreakGlassAllowlist('chef@jetnity.com'),
    })
    assert.equal(d.allowed, false)
  })

  test('die Datenbankrolle ist die reguläre Quelle', () => {
    for (const role of ROLES) {
      const d = decideAdminAccess({ user: USER, lookup: ok(role), allowlist: OHNE_LISTE })
      const erwartet = ['moderator', 'operator', 'admin', 'owner'].includes(role)
      assert.equal(d.allowed, erwartet, `Rolle ${role}`)
      if (d.allowed) assert.equal(d.grant, 'role')
    }
  })

  test('die Domain der E-Mail erteilt keine Berechtigung', () => {
    // Vor Phase 1.3 kam dieses Konto über `endsWith('@jetnity.com')` hinein.
    const d = decideAdminAccess({ user: USER, lookup: ok('user'), allowlist: OHNE_LISTE })
    assert.deepEqual(d, { allowed: false, denial: 'forbidden' })
  })

  test('ohne hinterlegte Rolle wird abgelehnt, nicht durchgelassen', () => {
    const d = decideAdminAccess({ user: USER, lookup: unbekannt, allowlist: OHNE_LISTE })
    assert.deepEqual(d, { allowed: false, denial: 'forbidden' })
  })

  test('eine fehlgeschlagene Rollenabfrage führt nie zu einer Freigabe', () => {
    // Der frühere Guard verschluckte den Fehler, sah `role = null` und fiel
    // auf die E-Mail-Prüfung zurück.
    const d = decideAdminAccess({ user: USER, lookup: kaputt, allowlist: OHNE_LISTE })
    assert.deepEqual(d, { allowed: false, denial: 'lookup-failed' })
  })

  test('der Notzugang greift genau für die eingetragene Adresse', () => {
    const allowlist = parseBreakGlassAllowlist('chef@jetnity.com')

    const erlaubt = decideAdminAccess({ user: USER, lookup: ok('user'), allowlist })
    assert.equal(erlaubt.allowed, true)
    assert.equal(erlaubt.allowed && erlaubt.grant, 'break-glass')

    const fremd = decideAdminAccess({
      user: { id: 'konto-2', email: 'andere@jetnity.com' },
      lookup: ok('user'),
      allowlist,
    })
    assert.equal(fremd.allowed, false)
  })

  test('der Notzugang wirkt auch, wenn die Rollenabfrage ausfällt', () => {
    // Genau dafür ist er gedacht – und der Aufrufer protokolliert es.
    const allowlist = parseBreakGlassAllowlist('chef@jetnity.com')
    const d = decideAdminAccess({ user: USER, lookup: kaputt, allowlist })
    assert.equal(d.allowed, true)
    assert.equal(d.allowed && d.grant, 'break-glass')
    assert.equal(d.allowed && d.role, null)
  })

  test('eine ausreichende Rolle geht dem Notzugang vor', () => {
    const allowlist = parseBreakGlassAllowlist('chef@jetnity.com')
    const d = decideAdminAccess({ user: USER, lookup: ok('admin'), allowlist })
    assert.equal(d.allowed && d.grant, 'role')
  })
})

describe('Fähigkeiten einzelner Oberflächen', () => {
  test('eine Moderation erreicht einen Betriebseingriff nicht', () => {
    const d = decideAdminAccess({
      user: USER,
      lookup: ok('moderator'),
      allowlist: OHNE_LISTE,
      capability: 'betrieb-eingreifen',
    })
    assert.deepEqual(d, { allowed: false, denial: 'forbidden' })
  })

  test('eine Moderation darf den Betrieb lesen', () => {
    // Genau hier liefen Anwendung und Datenbank auseinander: Der Gate liess
    // durch, die Policy verlangte `admin`. Beide Seiten sagen jetzt moderator.
    const d = decideAdminAccess({
      user: USER,
      lookup: ok('moderator'),
      allowlist: OHNE_LISTE,
      capability: 'betrieb-lesen',
    })
    assert.equal(d.allowed && d.grant, 'role')
  })

  test('ab der geforderten Stufe ist die Aktion erlaubt', () => {
    for (const role of ['operator', 'admin', 'owner'] as const) {
      const d = decideAdminAccess({
        user: USER,
        lookup: ok(role),
        allowlist: OHNE_LISTE,
        capability: 'betrieb-eingreifen',
      })
      assert.equal(d.allowed, true, `Rolle ${role}`)
    }
  })

  test('jede Fähigkeit greift genau ab ihrer Mindestrolle', () => {
    for (const capability of CAPABILITIES) {
      const minimum = minimumRoleFor(capability)
      for (const role of ROLES) {
        const d = decideAdminAccess({
          user: USER,
          lookup: ok(role),
          allowlist: OHNE_LISTE,
          capability,
        })
        const erwartet = ROLES.indexOf(role) >= ROLES.indexOf(minimum)
        assert.equal(d.allowed, erwartet, `${capability} mit Rolle ${role}`)
      }
    }
  })
})

describe('Notzugang trägt nicht bis in die Datenbank', () => {
  const allowlist = parseBreakGlassAllowlist('chef@jetnity.com')

  test('er öffnet auch eine Oberfläche mit höherer Anforderung', () => {
    // Bewusst unverändert gegenüber Phase 1.3: Wer auf der Liste steht, kommt
    // in den Bereich. Neu ist nur, dass `grant` sagt, was das wert ist.
    const d = decideAdminAccess({
      user: USER,
      lookup: ok('user'),
      allowlist,
      capability: 'betrieb-eingreifen',
    })
    assert.equal(d.allowed && d.grant, 'break-glass')
  })

  test('nur eine Rolle reicht bis in die Datenbank', () => {
    const ueberDieRolle = decideAdminAccess({
      user: USER,
      lookup: ok('admin'),
      allowlist,
      capability: 'betrieb-lesen',
    })
    assert.equal(reachesDatabase(ueberDieRolle), true)

    const ueberDieListe = decideAdminAccess({
      user: USER,
      lookup: ok('user'),
      allowlist,
      capability: 'betrieb-lesen',
    })
    assert.equal(reachesDatabase(ueberDieListe), false)
  })

  test('auch bei ausgefallener Rollenabfrage bleibt die Datenbank zu', () => {
    const d = decideAdminAccess({ user: USER, lookup: kaputt, allowlist })
    assert.equal(d.allowed, true)
    assert.equal(reachesDatabase(d), false)
  })

  test('eine Ablehnung reicht ebenfalls nicht in die Datenbank', () => {
    const d = decideAdminAccess({ user: USER, lookup: ok('user'), allowlist: OHNE_LISTE })
    assert.equal(reachesDatabase(d), false)
  })
})

describe('Antworten für API-Routen', () => {
  test('jede Ablehnung hat einen Statuscode und keine Weiterleitung', () => {
    assert.equal(statusForDenial('unauthenticated'), 401)
    assert.equal(statusForDenial('forbidden'), 403)
    assert.equal(statusForDenial('aal2-required'), 403)
    // Ein Ausfall der Prüfung ist keine Aussage über die Berechtigung.
    assert.equal(statusForDenial('lookup-failed'), 503)
    assert.equal(statusForDenial('aal-lookup-failed'), 503)
  })

  test('die Meldungen verraten nichts über fremde Konten', () => {
    for (const denial of [
      'unauthenticated',
      'forbidden',
      'lookup-failed',
      'aal2-required',
      'aal-lookup-failed',
    ] as const) {
      const text = messageForDenial(denial)
      assert.ok(text.length > 0)
      assert.equal(/@/.test(text), false, 'keine Adresse in der Meldung')
      assert.equal(/allowlist|ADMIN_ALLOWED|break-glass/i.test(text), false)
    }
  })
})
