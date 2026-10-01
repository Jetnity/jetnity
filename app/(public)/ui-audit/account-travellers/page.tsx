// app/(public)/ui-audit/account-travellers/page.tsx
//
// Lokale Sichtprüfung der Reisenden-Registry. Production immer 404.
// Fixtures nie im Produktspeicher. Keine Trip-Materialisierung.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import AccountNavigation from '@/components/account/AccountNavigation'
import AccountReisende from '@/components/account/AccountReisende'
import type { Problem } from '@/lib/api/datenbank-lesen'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'

export const metadata: Metadata = {
  title: 'Reisende-Audit',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const ZEIT = '2026-01-15T10:00:00.000Z'

function staat(
  id: string,
  clientRef: string,
  countryCode: string,
): AccountRegistryTraveller['facts']['citizenships'][number] {
  return { id, clientRef, countryCode, createdAt: ZEIT, updatedAt: ZEIT }
}

function dokument(
  id: string,
  clientRef: string,
  documentType: AccountRegistryTraveller['facts']['documents'][number]['documentType'],
  issuingCountryCode: string | null,
  citizenshipClientRef: string | null,
  expiresOn: string | null,
): AccountRegistryTraveller['facts']['documents'][number] {
  return {
    id,
    clientRef,
    documentType,
    issuingCountryCode,
    citizenshipClientRef,
    expiresOn,
    createdAt: ZEIT,
    updatedAt: ZEIT,
  }
}

function person(
  id: string,
  clientRef: string,
  label: string,
  residenceCountryCode: string,
  citizenships: AccountRegistryTraveller['facts']['citizenships'],
  documents: AccountRegistryTraveller['facts']['documents'],
): AccountRegistryTraveller {
  return {
    authority: 'account_registry',
    id,
    clientRef,
    createdAt: ZEIT,
    updatedAt: ZEIT,
    facts: { label, residenceCountryCode, citizenships, documents },
  }
}

const ZWEI: AccountRegistryTraveller[] = [
  person(
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'Alex',
    'CH',
    [
      staat(
        '22222222-2222-4222-8222-222222222221',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
        'DE',
      ),
      staat(
        '22222222-2222-4222-8222-222222222222',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
        'CH',
      ),
    ],
    [
      dokument(
        '33333333-3333-4333-8333-333333333331',
        'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
        'passport',
        'DE',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
        '2020-01-15',
      ),
      dokument(
        '33333333-3333-4333-8333-333333333332',
        'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
        'national_id',
        'CH',
        null,
        '2030-06-01',
      ),
    ],
  ),
  person(
    '11111111-1111-4111-8111-111111111112',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'Sam',
    'IT',
    [
      staat(
        '22222222-2222-4222-8222-222222222223',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
        'IT',
      ),
      staat(
        '22222222-2222-4222-8222-222222222224',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4',
        'FR',
      ),
    ],
    [
      dokument(
        '33333333-3333-4333-8333-333333333333',
        'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
        'passport',
        'GB',
        null,
        '2028-03-01',
      ),
      dokument(
        '33333333-3333-4333-8333-333333333334',
        'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
        'unknown',
        null,
        null,
        null,
      ),
    ],
  ),
]

const FEHLER: Problem = {
  status: 500,
  message: 'Audit-Lesefehler, nicht sichtbar.',
}

export default async function AccountReisendeAuditSeite({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (
    !uiAuditSeiteAktiv({
      VERCEL_ENV: process.env.VERCEL_ENV,
      JETNITY_UI_AUDIT: process.env.JETNITY_UI_AUDIT,
    })
  ) {
    notFound()
  }

  const parameter = await searchParams
  const zustand = typeof parameter.zustand === 'string' ? parameter.zustand : 'zwei'
  const problem = zustand === 'fehler' ? FEHLER : null
  const travellers = zustand === 'leer' ? [] : zustand === 'fehler' ? null : ZWEI

  return (
    <>
      <AccountNavigation />
      <main className="px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto w-full min-w-0 max-w-6xl">
          <div id="registry-messflaeche">
            <AccountReisende problem={problem} travellers={travellers} />
          </div>
        </div>
      </main>
    </>
  )
}
