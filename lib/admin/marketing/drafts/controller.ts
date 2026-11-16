import { parseMarketingDraftCommand, type MarketingDraftCommand, type MarketingDraftRead, type MarketingDraftRevision } from './contract'
import { draftOperation, parseDraftConfirm, type DraftConfirm, type DraftFailure, type DraftOutcome, type DraftPort } from './runtime-contract'

type DraftPayload = Extract<MarketingDraftCommand, { action: 'create' | 'save' }>['payload']
type DraftList = Extract<MarketingDraftRead, { action: 'list' }>
export type DraftView = Readonly<{
  status: 'idle' | 'loading' | 'ready' | 'unavailable' | 'denied'
  busy: 'read' | 'write' | 'confirm' | null
  items: readonly MarketingDraftRevision[]; nextList: DraftList['cursor'] | null
  filter: 'draft' | 'archived' | 'all'
  current: MarketingDraftRevision | null
  editor: Readonly<{ draftId: string; payload: DraftPayload }> | null
  dirty: boolean
  history: readonly MarketingDraftRevision[]; nextHistory: string | null
  pending: Readonly<{ identity: DraftConfirm; command: MarketingDraftCommand | null }> | null
  error: DraftFailure | null
  notice: 'confirmed' | 'confirmed_later' | 'unresolved' | 'blocked' | null
}>
const INITIAL: DraftView = {
  status: 'idle', busy: null, items: [], nextList: null, filter: 'draft', current: null, editor: null,
  dirty: false, history: [], nextHistory: null, pending: null, error: null, notice: null,
}
const denial = (code: DraftFailure) => code === 'forbidden' || code === 'unauthenticated'
const order = (a: MarketingDraftRevision, b: MarketingDraftRevision) => a.savedAt === b.savedAt
  ? (a.draftId < b.draftId ? 1 : -1) : (a.savedAt < b.savedAt ? 1 : -1)
async function safely<T>(call: () => Promise<DraftOutcome<T>>): Promise<DraftOutcome<T>> {
  try { return await call() } catch { return { ok: false, code: 'unknown' } }
}

/** One operation in flight. Persistent truth and confirmation come only from the
 * admitted server; this object holds transient editor state, never a store. */
export class DraftController {
  private view: DraftView = INITIAL
  private listeners = new Set<() => void>()
  private generation = 0
  constructor(private port: DraftPort, private uuid: () => string, private remember: (value: DraftConfirm | null) => void) {}
  snapshot = (): DraftView => this.view
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private set(patch: Partial<DraftView>) { this.view = { ...this.view, ...patch }; for (const listener of this.listeners) listener() }
  detach() { this.generation += 1 }
  blocked = () => this.view.dirty || this.view.pending !== null
  navigationBlocked = () => this.set({ notice: 'blocked' })
  private available() { return this.view.status === 'ready' && this.view.busy === null }
  private preserveRecovery(identity: DraftConfirm | null): boolean {
    try { this.remember(identity); return true } catch { this.set({ error: 'unavailable' }); return false }
  }
  private failed(code: DraftFailure) {
    if (denial(code)) this.set({ status: 'denied', busy: null, items: [], nextList: null, current: null,
      editor: null, history: [], nextHistory: null, dirty: false, error: code, notice: this.view.pending ? 'unresolved' : null })
    else this.set({ busy: null, error: code, ...(this.view.pending ? { notice: 'unresolved' as const } : {}) })
  }
  async start(recovery: DraftConfirm | null = null) {
    this.generation += 1
    if (recovery) {
      this.set({ ...INITIAL, status: 'ready', pending: { identity: recovery, command: null }, notice: 'unresolved' })
      await this.confirm()
      return
    }
    this.set({ ...INITIAL, status: 'loading' })
    await this.list(false)
  }
  async list(more = false, filter: DraftView['filter'] = this.view.filter) {
    if (this.view.busy || this.blocked()) { this.navigationBlocked(); return }
    const cursor = more ? this.view.nextList : null
    if (more && !cursor) return
    const generation = this.generation
    this.set({ busy: 'read', error: null })
    const result = await safely(() => this.port.read({ schemaVersion: 1, action: 'list', limit: 20,
      ...(filter === 'all' ? {} : { state: filter }), ...(cursor ? { cursor } : {}) }))
    if (generation !== this.generation) return
    if (!result.ok) { this.failed(result.code); if (!denial(result.code)) this.set({ status: 'unavailable' }); return }
    if (result.value.action !== 'list') { this.failed('unavailable'); return }
    const merged = new Map<string, MarketingDraftRevision>()
    for (const item of [...(more ? this.view.items : []), ...result.value.items]) {
      const existing = merged.get(item.draftId)
      if (!existing || BigInt(item.version) > BigInt(existing.version)) merged.set(item.draftId, item)
    }
    this.set({ status: 'ready', busy: null, items: [...merged.values()].sort(order), nextList: result.value.nextCursor, filter })
  }
  async select(draftId: string) {
    if (!this.available() || this.blocked()) { this.navigationBlocked(); return }
    const generation = this.generation
    this.set({ busy: 'read', error: null, notice: null })
    const result = await safely(() => this.port.read({ schemaVersion: 1, action: 'get', draftId }))
    if (generation !== this.generation) return
    if (!result.ok) { this.failed(result.code); return }
    if (result.value.action !== 'get' || !result.value.draft) { this.failed('missing'); return }
    const current = result.value.draft
    this.set({ busy: null, current, editor: { draftId, payload: current.payload }, dirty: false, history: [], nextHistory: null })
    await this.loadHistory()
  }
  newDraft() {
    if (!this.available() || this.blocked()) { this.navigationBlocked(); return }
    let draftId: string
    try { draftId = this.uuid() } catch { this.failed('unavailable'); return }
    if (!parseDraftConfirm({ draftId, requestId: draftId, expectedVersion: '0' })) { this.failed('invalid'); return }
    this.set({ current: null, editor: { draftId, payload: { label: '', destination: 'home', channel: 'newsletter', contentId: null } },
      dirty: false, history: [], nextHistory: null, notice: null, error: null })
  }
  edit(patch: Partial<DraftPayload>) {
    if (!this.available() || this.view.pending || !this.view.editor || this.view.current?.state === 'archived') return
    const payload = { ...this.view.editor.payload, ...patch }
    const dirty = !this.view.current || JSON.stringify(payload) !== JSON.stringify(this.view.current.payload)
    const stale = this.view.error && ['conflict', 'request_conflict', 'state', 'missing'].includes(this.view.error)
    this.set({ editor: { ...this.view.editor, payload }, dirty, error: stale ? this.view.error : null, notice: null })
  }
  variant() {
    try { this.edit({ contentId: `cnt-${this.uuid()}` }) } catch { this.failed('unavailable') }
  }
  async discard() {
    if (this.view.pending || this.view.busy) { this.navigationBlocked(); return }
    const id = this.view.current?.draftId
    this.set({ editor: null, current: null, dirty: false, history: [], nextHistory: null, error: null, notice: null })
    if (id) await this.select(id)
  }
  async loadHistory(more = false) {
    if (!this.available() || this.view.pending || !this.view.current) return
    const generation = this.generation, id = this.view.current.draftId, cursor = more ? this.view.nextHistory : null
    if (more && !cursor) return
    this.set({ busy: 'read', error: null })
    const result = await safely(() => this.port.read({ schemaVersion: 1, action: 'history', draftId: id, limit: 20, ...(cursor ? { cursor } : {}) }))
    if (generation !== this.generation) return
    if (!result.ok) { this.failed(result.code); return }
    if (result.value.action !== 'history') { this.failed('unavailable'); return }
    this.set({ busy: null, history: more ? [...this.view.history, ...result.value.items] : result.value.items, nextHistory: result.value.nextCursor })
  }
  async save() { await this.command(this.view.current ? 'save' : 'create') }
  async archive() { await this.command('archive') }
  async restore(revision: string) { await this.command('restore', revision) }
  private async command(action: MarketingDraftCommand['action'], revision?: string) {
    if (!this.available() || this.view.pending || !this.view.editor) return
    if (['conflict', 'request_conflict', 'state', 'missing'].includes(this.view.error ?? '')) { this.navigationBlocked(); return }
    if ((action === 'archive' || action === 'restore') && this.view.dirty) { this.navigationBlocked(); return }
    let requestId: string
    try { requestId = this.uuid() } catch { this.failed('unavailable'); return }
    const command = parseMarketingDraftCommand({ schemaVersion: 1, requestId, draftId: this.view.editor.draftId,
      expectedVersion: this.view.current?.version ?? '0', action,
      payload: action === 'archive' ? {} : action === 'restore' ? { revision } : this.view.editor.payload })
    const identity = command ? parseDraftConfirm(draftOperation(command)) : null
    if (!command || !identity) { this.failed('invalid'); return }
    if (!this.preserveRecovery(identity)) return // Do not send if reload recovery cannot be retained.
    this.set({ pending: { identity, command }, busy: 'write', error: null, notice: null })
    await this.send(command, false)
  }
  private async send(command: MarketingDraftCommand, alreadyUncertain: boolean) {
    const generation = this.generation
    const result = await safely(() => this.port.apply(command))
    if (generation !== this.generation) return
    if (!result.ok) {
      // A definite first transaction rejection may be corrected. A later retry
      // rejection can never erase uncertainty about the original transaction.
      if (!alreadyUncertain && ['invalid', 'conflict', 'request_conflict', 'state', 'missing'].includes(result.code)) {
        this.set({ pending: null, busy: null }); this.preserveRecovery(null)
      }
      this.failed(result.code)
      return
    }
    this.set({ busy: null })
    await this.confirm() // ACK alone cannot display a saved status.
  }
  async retry() {
    const pending = this.view.pending
    if (!pending?.command || this.view.busy || this.view.status === 'denied') return
    this.set({ busy: 'write', error: null, notice: null })
    await this.send(pending.command, true)
  }
  async confirm() {
    const pending = this.view.pending
    if (!pending || this.view.busy) return
    const generation = this.generation
    this.set({ busy: 'confirm', error: null })
    const result = await safely(() => this.port.confirm(pending.identity))
    if (generation !== this.generation) return
    if (!result.ok) { this.failed(result.code); return }
    if (result.value.status !== 'confirmed') { this.set({ status: 'ready', busy: null, notice: 'unresolved' }); return }
    const { current, receipt } = result.value
    const items = this.view.items.filter(item => item.draftId !== current.draftId)
    if (this.view.filter === 'all' || this.view.filter === current.state) items.push(current)
    this.set({ status: 'ready', busy: null, current, editor: { draftId: current.draftId, payload: current.payload },
      pending: null, dirty: false, error: null, items: items.sort(order), history: [], nextHistory: null,
      notice: current.version === receipt.version ? 'confirmed' : 'confirmed_later' })
    this.preserveRecovery(null)
    await this.loadHistory()
  }
}
