import { createRoot } from 'react-dom/client'

import Reisebegleiter from '@/components/trips/Reisebegleiter'
import ReiseAenderung from '@/components/trips/ReiseAenderung'
import TripWorkspace from '@/components/trips/TripWorkspace'
import WorkspaceShell from '@/components/workspace/WorkspaceShell'
import type { Trip } from '@/types/trips'

const wurzel = typeof document !== 'undefined' ? document.getElementById('root') : null
const reise = (globalThis as unknown as { __REISE__?: Trip }).__REISE__

if (wurzel && reise) {
  createRoot(wurzel).render(
    <WorkspaceShell>
      <TripWorkspace
        reise={reise}
        quelle="account"
        ohneTag={reise.ohneTag}
        onPunktAnlegen={async () => null}
        onPunktEntfernen={async () => null}
        onBuchungsstatus={async () => null}
        aenderung={<ReiseAenderung reise={reise} quelle="account" onGespeichert={() => undefined} />}
        begleiter={<Reisebegleiter reise={reise} />}
      />
    </WorkspaceShell>,
  )
}
