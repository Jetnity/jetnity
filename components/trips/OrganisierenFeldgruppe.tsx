import type { ReactNode } from 'react'

import { ORGANISIEREN_FELDGRUPPE_KLASSE } from '@/lib/trips/organize-premium-experience-6'

export default function OrganisierenFeldgruppe({
  titel,
  children,
}: {
  titel: string
  children: ReactNode
}) {
  return (
    <fieldset className={ORGANISIEREN_FELDGRUPPE_KLASSE}>
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{titel}</legend>
      <div className="mt-2 min-w-0">{children}</div>
    </fieldset>
  )
}
