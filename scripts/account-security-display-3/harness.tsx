// Mounted real components; synthetic IO only. This proves presentation and
// unchanged action contracts, never real sign-in or persisted preferences.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import SecurityPasswort from '@/components/account/SecurityPasswort'
import SecuritySitzung from '@/components/account/SecuritySitzung'
import SecurityLogout from '@/components/account/SecurityLogout'
import SecurityMFA from '@/components/account/SecurityMFA'
import type { UiSprache } from '@/lib/localization/ui-sprache'
import './auth-fixture'

function SecurityDisplayHarness() {
  const [sprache, setSprache] = useState<UiSprache>(window.__securityFixtureBoot.sprache)
  return <>
    <button type="button" data-fixture-language="" onClick={() => setSprache((value) => value === 'de' ? 'en' : 'de')}>Switch synthetic display language</button>
    <main lang={sprache} className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <SecurityPasswort sprache={sprache} />
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <SecuritySitzung sprache={sprache} />
          <SecurityLogout sprache={sprache} />
        </section>
        <SecurityMFA sprache={sprache} passkeysServerAktiviert={false} />
      </div>
    </main>
  </>
}

createRoot(document.getElementById('root')!).render(<SecurityDisplayHarness />)
