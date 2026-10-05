import * as React from 'react'
import { createRoot } from 'react-dom/client'

import AdminLayout from '@/app/(admin)/admin/layout'
import AdminSessionProvider from '@/components/admin/AdminSessionProvider'
import type { AdminGrant } from '@/lib/auth/admin-access'
import type { Role } from '@/lib/auth/roles'

type HarnessWindow = Window & {
  __hydrateReady?: boolean
  __routerPushes?: string[]
  __fetchCalls?: string[]
  __linkPrefetch?: Array<{ href: string; prefetch: boolean | undefined }>
}

const params = new URLSearchParams(window.location.search)
const roleParam = params.get('role')
const grantParam = params.get('grant')
const role = (roleParam === 'none' ? null : (roleParam as Role | null) ?? 'operator') as Role | null
const grant = (grantParam as AdminGrant | null) ?? 'role'
const fremd = params.get('foreignModal') === '1'

const originalFetch = window.fetch.bind(window)
const win = window as HarnessWindow
win.__fetchCalls = []
win.__routerPushes = []
win.__linkPrefetch = []
window.fetch = async (input, init) => {
  win.__fetchCalls!.push(String(input))
  return originalFetch(input, init)
}

function Harness() {
  return (
    <AdminSessionProvider role={role} grant={grant}>
      <AdminLayout>
        <p>Harness-Inhalt für Bereichssuche.</p>
      </AdminLayout>
      {fremd ? (
        <div role="dialog" aria-modal="true" aria-label="Fremdes Modal" className="fixed inset-0 z-[80] bg-black/20">
          <button id="foreign-focus" type="button" className="m-8 rounded border bg-white px-3 py-2">
            Fremdes Feld
          </button>
        </div>
      ) : null}
    </AdminSessionProvider>
  )
}

createRoot(document.getElementById('root')!).render(<Harness />)
win.__hydrateReady = true
