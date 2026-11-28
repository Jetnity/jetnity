import { createRoot } from 'react-dom/client'

import AccountNavigation from '@/components/account/AccountNavigation'
import ArbeitsbereichDarstellung from '@/components/account/ui-einstellungen-1/ArbeitsbereichDarstellung'
import { Seitenkopf } from '@/components/ui/seitenkopf'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'

const wurzel = typeof document !== 'undefined' ? document.getElementById('root') : null

if (wurzel) {
  createRoot(wurzel).render(
    <WorkspaceShell contentId="account-content">
      <AccountNavigation />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Seitenkopf kicker="Konto" titel="Einstellungen">
          <p>Sprache und Darstellung dieses Geräts.</p>
        </Seitenkopf>
        <ArbeitsbereichDarstellung sprache="de" />
      </div>
    </WorkspaceShell>,
  )
}
