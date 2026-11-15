// Actual editor and production styles; only its explicit future transport is
// controlled. This proves component behavior, never Admin login or hosted DDL.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import type { NextRouter } from 'next/router'
import CmsEditor from '@/components/admin/content/cms-editor-2/CmsEditor'
import AdminSidebar from '@/components/layout/AdminSidebar'
import AdminSessionProvider from '@/components/admin/AdminSessionProvider'
import { AdminNavigationSearchProvider, AdminNavigationSearchTrigger } from '@/components/admin/AdminNavigationSearch'
import type { CmsCommand } from '@/lib/admin/content/cms/contract'
import type { CmsFailure, CmsPort, CmsPortResult } from '@/lib/admin/content/cms-editor-2/port'
import type { UiSprache } from '@/lib/localization/ui-sprache'

export type CmsFixtureBoot = { language: UiSprache; entryId: string; snapshot: unknown; unavailable: boolean; dark: boolean; navigation?: boolean }
type Call = { value: CmsCommand | string; settled: boolean; resolve: (response: CmsPortResult) => void }
declare global {
  interface Window {
    __cmsBoot: CmsFixtureBoot
    __recordCmsViolation: (message: string) => Promise<void>
    __cmsViolations: string[]
    __cmsProof: {
      commands: () => CmsCommand[]; confirmations: () => string[]; uuidCalls: () => number
      setRead: (value: unknown) => void
      setReadFailure: (value: CmsFailure) => void; navigations: () => string[]
      settle: (kind: 'command' | 'confirm', index: number, value: CmsPortResult) => void
    }
  }
}
const boot = window.__cmsBoot
if (!boot || !['de', 'en'].includes(boot.language) || !Array.isArray(window.__cmsViolations)
  || typeof window.__recordCmsViolation !== 'function') throw new Error('CMS fixture isolation was not installed first')
document.documentElement.classList.toggle('dark', boot.dark)
let read: unknown = boot.snapshot
let readFailure: CmsFailure | null = null
let ids = 0
let navigated: string | null = null
const navigations: string[] = []
const commands: Call[] = [], confirmations: Call[] = []
const port: CmsPort = {
  async read() { return readFailure ? { ok: false, code: readFailure } : { ok: true, value: structuredClone(read) } },
  async command(value) { return new Promise<CmsPortResult>(resolve => { commands.push({ value, settled: false, resolve }) }) },
  async confirm(value) { return new Promise<CmsPortResult>(resolve => { confirmations.push({ value, settled: false, resolve }) }) },
}
window.__cmsProof = {
  commands: () => commands.map(call => structuredClone(call.value as CmsCommand)),
  confirmations: () => confirmations.map(call => call.value as string), uuidCalls: () => ids,
  setRead(value) { read = structuredClone(value); readFailure = null },
  setReadFailure(value) { readFailure = value }, navigations: () => [...navigations],
  settle(kind, index, value) {
    const call = (kind === 'command' ? commands : confirmations)[index]
    if (!call || call.settled) throw new Error('Invalid CMS fixture settlement')
    call.settled = true; call.resolve(value)
  },
}
const container = document.getElementById('root')
if (!container) throw new Error('Missing CMS root')
const root = createRoot(container)
const navigate: NextRouter['push'] = async href => {
  if (typeof href !== 'string') throw new Error('Expected a concrete Next Link destination')
  navigations.push(href); navigated = href; render(); return true
}
// Actual Next Link, Sidebar and navigation-search components; only the router
// transport is controlled. A successful link genuinely unmounts this editor.
const router: NextRouter = {
  pathname: '/admin/content/editor', route: '/admin/content/editor', asPath: '/admin/content/editor', query: {}, basePath: '',
  isLocaleDomain: false, isFallback: false, isReady: true, isPreview: false,
  push: navigate, replace: navigate, reload() {}, back() {}, forward() {}, async prefetch() {}, beforePopState() {},
  events: { on() {}, off() {}, emit() {} },
}
function render() {
  const content = navigated ? <p data-cms-navigated>{navigated}</p> : <CmsEditor sprache={boot.language} initialEntryId={boot.entryId} runtime="unavailable"
    port={boot.unavailable ? undefined : port} uuid={() => `${++ids}1111111-1111-4111-8111-111111111111`} />
  root.render(<StrictMode><RouterContext.Provider value={router}><PathnameContext.Provider value={navigated ?? '/admin/content/editor'}>
    <AdminSessionProvider role="owner" grant="role"><AdminNavigationSearchProvider drawerOpen={false} closeDrawer={() => {}}>
      <div className={boot.navigation ? 'grid min-w-0 grid-cols-[16rem_minmax(0,1fr)]' : 'min-w-0'}>
        {boot.navigation ? <aside><AdminSidebar /></aside> : null}
        <main className="min-w-0 bg-background p-3 text-foreground sm:p-6">
          {boot.navigation ? <AdminNavigationSearchTrigger surface="desktop" /> : null}{content}
        </main>
      </div>
    </AdminNavigationSearchProvider></AdminSessionProvider>
  </PathnameContext.Provider></RouterContext.Provider></StrictMode>)
}
render()
