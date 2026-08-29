import { Users } from 'lucide-react'

import { REGISTRY_COPY } from '@/lib/traveller/account-registry-copy'

export default function AccountReisendeLaden() {
  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          {REGISTRY_COPY.seitenEyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
          {REGISTRY_COPY.seitenTitel}
        </h1>
        <section
          aria-busy="true"
          aria-live="polite"
          className="mt-10 rounded-[30px] border border-black/5 bg-white px-6 py-14 text-center sm:px-10"
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">
            {REGISTRY_COPY.ladenTitel}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">{REGISTRY_COPY.ladenText}</p>
        </section>
      </div>
    </main>
  )
}
