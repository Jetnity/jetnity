import { cmsReference, parseCmsCommand, type CmsCommand } from '../cms/contract'
import { cmsEditable, cmsReadback, cmsRecoveredReadback, parseCmsConfirmation, parseCmsRead, parseCmsReceipt, parseCmsRecoveryConfirmation, type CmsEditable, type CmsRead, type CmsRevision } from './responses'
import type { CmsFailure, CmsPort, CmsPortResult } from './port'
import { parseCmsRecoveryMarker, type CmsRecoveryMarker } from './request'

export type CmsIssue = CmsFailure | 'invalid_response' | 'unconfirmed' | 'unsaved' | 'random'
export type CmsNotice = 'saved' | 'published' | 'archived' | 'restored' | 'recorded_changed' | null
type Form = Readonly<{ beschreibung: string; idea: string; themen: CmsEditable['themen'] }>
type Pending = Readonly<{ command: CmsCommand; transportOpen: boolean; uncertainOutcome: boolean }>
export type CmsEditorState = Readonly<{
  entryId: string; phase: 'loading' | 'ready' | 'busy' | 'unconfirmed' | 'conflict' | 'unavailable'
  snapshot: CmsRead | null; form: Form; dirty: boolean; issue: CmsIssue | null; notice: CmsNotice
  pending: Pending | null; recovery: CmsRecoveryMarker | null; selectedRevision: string | null; loadingHistory: boolean
}>
const EMPTY: Form = { beschreibung: '', idea: '', themen: [] }
const ACTION_NOTICE: Record<CmsCommand['action'], Exclude<CmsNotice, 'recorded_changed' | null>> = {
  save_draft: 'saved', publish: 'published', archive: 'archived', restore_draft: 'restored',
}
const DEFINITE_REJECTION: readonly CmsFailure[] = ['conflict', 'request_conflict', 'invalid', 'state', 'missing', 'forbidden', 'unauthenticated', 'rate_limit']

function formOf(snapshot: CmsRead): Form {
  const content = snapshot.preview?.content
  return content ? { beschreibung: content.beschreibung, idea: content.idea, themen: [...content.themen] } : { ...EMPTY }
}
function equalForm(a: Form, b: Form) {
  return a.beschreibung === b.beschreibung && a.idea === b.idea && a.themen.join(',') === b.themen.join(',')
}
function freezeCommand(command: CmsCommand): CmsCommand {
  if (command.action === 'save_draft') Object.freeze(command.payload.themen)
  Object.freeze(command.payload)
  return Object.freeze(command)
}

/** One entry and one explicit intent at a time. Unknown outcomes retain the
 * exact immutable command; there is no automatic write retry or replacement ID. */
export function createCmsEditor(port: CmsPort, entryId: string, options: {
  uuid?: () => unknown; timeoutMs?: number; recovery?: CmsRecoveryMarker | null
  intent?: (marker: CmsRecoveryMarker | null) => boolean
} = {}) {
  if (!cmsReference(entryId)) throw new Error('Unknown CMS reference')
  const recovery = options.recovery ? parseCmsRecoveryMarker(options.recovery) : null
  if (options.recovery && (!recovery || recovery.entryId !== entryId)) throw new Error('Invalid CMS recovery reference')
  const timeoutMs = options.timeoutMs ?? 10_000
  const listeners = new Set<() => void>()
  let generation = 0
  let authorityClosed = false
  let state: CmsEditorState = {
    entryId, phase: 'loading', snapshot: null, form: { ...EMPTY }, dirty: false, issue: null, notice: null,
    pending: null, recovery: recovery ? Object.freeze(recovery) : null, selectedRevision: null, loadingHistory: false,
  }
  const getSnapshot = () => state
  const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
  const update = (change: Partial<CmsEditorState>) => {
    state = { ...state, ...change }
    for (const listener of listeners) listener()
  }
  function remember(marker: CmsRecoveryMarker | null): boolean {
    try { return options.intent?.(marker) ?? true } catch { return false }
  }
  async function bounded(call: () => Promise<CmsPortResult>, settled?: () => void): Promise<CmsPortResult> {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const operation = Promise.resolve().then(call).catch((): CmsPortResult => ({ ok: false, code: 'unavailable' }))
      // Retain knowledge of a still-running write after the UI deadline. Late
      // transport output alone never confirms or updates an entry.
      void operation.then(() => settled?.())
      return await Promise.race([operation, new Promise<CmsPortResult>((resolve) => {
        timer = setTimeout(() => resolve({ ok: false, code: 'timeout' }), timeoutMs)
      })])
    } finally { if (timer) clearTimeout(timer) }
  }
  function accept(snapshot: CmsRead, notice: CmsNotice = null) {
    if ((state.pending || state.recovery) && !remember(null)) { uncertain('unavailable'); return }
    authorityClosed = false
    update({ phase: 'ready', snapshot, form: formOf(snapshot), dirty: false, issue: null, notice,
      pending: null, recovery: null, selectedRevision: null, loadingHistory: false })
  }
  function uncertain(issue: CmsIssue) {
    const pending = state.pending ? { ...state.pending, uncertainOutcome: true } : null
    if (issue === 'forbidden' || issue === 'unauthenticated') {
      authorityClosed = true
      // Authority is a property of the latest server decision. Hide the
      // privileged snapshot on every boundary, retaining the unresolved intent.
      update({ phase: 'unavailable', snapshot: null, selectedRevision: null, loadingHistory: false, pending, issue, notice: null })
    } else update({ phase: authorityClosed ? 'unavailable' : 'unconfirmed', pending, issue, notice: null })
  }
  async function load(id = state.entryId, discard = false): Promise<void> {
    if (state.recovery) { await recover(); return }
    if (!cmsReference(id) || state.pending || state.phase === 'busy') return
    if (state.dirty && !discard) { update({ issue: 'unsaved' }); return }
    const token = ++generation
    update({ entryId: id, phase: 'loading', snapshot: null, form: { ...EMPTY }, dirty: false,
      selectedRevision: null, issue: null, notice: null, loadingHistory: false })
    const query = { entryId: id }
    const result = await bounded(() => port.read(query))
    if (token !== generation) return
    const snapshot = result.ok ? parseCmsRead(result.value, query) : null
    if (snapshot) accept(snapshot)
    else update({ phase: 'unavailable', issue: result.ok ? 'invalid_response' : result.code })
  }
  async function recover() {
    const marker = state.recovery
    if (!marker || state.phase === 'busy') return
    update({ phase: 'busy', issue: null, notice: null })
    const confirmation = await bounded(() => port.confirm(marker.requestId))
    if (state.recovery !== marker) return
    if (!confirmation.ok) { uncertain(confirmation.code); return }
    const receipt = parseCmsRecoveryConfirmation(confirmation.value, marker)
    if (!receipt) { uncertain('invalid_response'); return }
    authorityClosed = false
    // Absence is never evidence that the earlier transaction failed. No
    // payload survived reload, so this branch has no retry/send operation.
    if (receipt.status === 'unknown') { uncertain('unconfirmed'); return }
    const query = { entryId: marker.entryId }
    const result = await bounded(() => port.read(query))
    if (state.recovery !== marker) return
    const snapshot = result.ok ? parseCmsRead(result.value, query) : null
    if (!snapshot) { uncertain(result.ok ? 'invalid_response' : result.code); return }
    const proof = cmsRecoveredReadback(snapshot, receipt)
    if (!proof) { uncertain('invalid_response'); return }
    ++generation
    accept(snapshot, proof === 'current' ? ACTION_NOTICE[receipt.action] : 'recorded_changed')
  }
  function edit(form: Form) {
    if (!state.snapshot || state.pending || state.phase !== 'ready' || state.snapshot.entry.archived) return
    const snapshot = { beschreibung: form.beschreibung, idea: form.idea, themen: [...form.themen] }
    update({ form: snapshot, dirty: !equalForm(snapshot, formOf(state.snapshot)), issue: null, notice: null })
  }
  function selectRevision(id: string) {
    if (!state.pending && state.phase === 'ready' && state.snapshot?.history.some(item => item.revision === id)) {
      update({ selectedRevision: id, notice: null })
    }
  }
  async function moreHistory() {
    const snapshot = state.snapshot
    const beforeRevision = snapshot?.nextBeforeRevision
    if (!snapshot || !beforeRevision || state.loadingHistory || state.pending || state.phase !== 'ready') return
    const token = generation
    update({ loadingHistory: true, issue: null })
    const query = { entryId: state.entryId, beforeRevision }
    const result = await bounded(() => port.read(query))
    if (token !== generation || state.snapshot !== snapshot) return
    const page = result.ok ? parseCmsRead(result.value, query) : null
    if (!page) {
      if (!result.ok && (result.code === 'forbidden' || result.code === 'unauthenticated')) uncertain(result.code)
      else update({ loadingHistory: false, issue: result.ok ? 'invalid_response' : result.code })
      return
    }
    if (page.entry.version !== snapshot.entry.version) {
      update({ loadingHistory: false, phase: 'conflict', issue: 'conflict' }); return
    }
    const revisions = new Set(snapshot.history.map(item => item.revision))
    if (page.history.some(item => revisions.has(item.revision))) {
      update({ loadingHistory: false, issue: 'invalid_response' }); return
    }
    update({ loadingHistory: false, snapshot: { ...snapshot, history: [...snapshot.history, ...page.history], nextBeforeRevision: page.nextBeforeRevision } })
  }
  async function reconcile() {
    if (state.recovery) { await recover(); return }
    const command = state.pending?.command
    if (!command || state.phase === 'busy') return
    update({ phase: 'busy', issue: null, notice: null })
    const confirmation = await bounded(() => port.confirm(command.requestId))
    if (state.pending?.command !== command) return
    if (!confirmation.ok) { uncertain(confirmation.code); return }
    const receipt = parseCmsConfirmation(confirmation.value, command)
    if (!receipt) { uncertain('invalid_response'); return }
    // The candidate confirmation wrapper itself enforces current authority.
    // An unavailable/timeout response never reopens a previously closed guard.
    authorityClosed = false
    if (receipt.status === 'unknown') { uncertain('unconfirmed'); return }
    const query = { entryId: command.entryId }
    const result = await bounded(() => port.read(query))
    if (state.pending?.command !== command) return
    const snapshot = result.ok ? parseCmsRead(result.value, query) : null
    if (!snapshot) { uncertain(result.ok ? 'invalid_response' : result.code); return }
    const proof = cmsReadback(snapshot, receipt, command)
    if (!proof) { uncertain('invalid_response'); return }
    ++generation
    accept(snapshot, proof === 'current' ? ACTION_NOTICE[command.action] : 'recorded_changed')
  }
  async function perform(command: CmsCommand) {
    if (!remember({ requestId: command.requestId, entryId: command.entryId, expectedVersion: command.expectedVersion })) {
      if (state.pending) uncertain('unavailable')
      else update({ issue: 'unavailable' })
      return
    }
    const uncertainOutcome = state.pending?.command === command && state.pending.uncertainOutcome
    update({ phase: 'busy', pending: { command, transportOpen: true, uncertainOutcome }, issue: null, notice: null })
    const result = await bounded(() => port.command(command), () => {
      if (state.pending?.command === command) update({ pending: { ...state.pending, transportOpen: false } })
    })
    if (state.pending?.command !== command) return
    if (!result.ok) {
      // A later rejected retry says nothing conclusive about an earlier
      // ambiguous attempt. Only confirmed receipt + readback may release it.
      if (state.pending.uncertainOutcome) { uncertain(result.code); return }
      if (DEFINITE_REJECTION.includes(result.code)) {
        if (!remember(null)) { uncertain(result.code); return }
        if (result.code === 'forbidden' || result.code === 'unauthenticated') {
          update({ pending: null }); uncertain(result.code)
        } else update({ pending: null, phase: ['conflict', 'request_conflict', 'state', 'missing'].includes(result.code) ? 'conflict' : 'ready', issue: result.code })
      } else uncertain(result.code)
      return
    }
    if (!parseCmsReceipt(result.value, command)) { uncertain('invalid_response'); return }
    // Receipt over a transport is not durable success. Confirm and readback
    // are separate operations after the candidate command transaction.
    update({ phase: 'unconfirmed' })
    await reconcile()
  }
  async function send(action: CmsCommand['action']) {
    const snapshot = state.snapshot
    if (!snapshot || state.phase !== 'ready' || state.pending || state.loadingHistory) return
    if (action !== 'save_draft' && state.dirty) { update({ issue: 'unsaved' }); return }
    let payload: unknown
    if (action === 'save_draft') {
      payload = cmsEditable(state.form, state.entryId)
      if (!payload || snapshot.entry.archived || !state.dirty) { update({ issue: 'invalid' }); return }
    } else if (action === 'publish') {
      if (snapshot.entry.archived || !snapshot.entry.draftRevision || snapshot.entry.publishedRevision === snapshot.entry.draftRevision) return
      payload = { revision: snapshot.entry.draftRevision }
    } else if (action === 'restore_draft') {
      const selected = snapshot.history.find(item => item.revision === state.selectedRevision)
      if (!selected) return
      payload = { revision: selected.revision }
    } else {
      if (snapshot.entry.archived || !snapshot.entry.draftRevision) return
      payload = {}
    }
    let requestId: unknown
    try { requestId = (options.uuid ?? (() => globalThis.crypto.randomUUID()))() } catch { /* No intent was issued. */ }
    const command = parseCmsCommand({ requestId, entryId: state.entryId, expectedVersion: snapshot.entry.version, action, payload })
    if (!command) { update({ issue: 'random' }); return }
    await perform(freezeCommand(command))
  }
  async function retry() {
    const pending = state.pending
    if (pending && !pending.transportOpen && state.phase === 'unconfirmed') await perform(pending.command)
  }
  function selectedRevision(): CmsRevision | null {
    return state.snapshot?.history.find(item => item.revision === state.selectedRevision) ?? null
  }
  return { getSnapshot, subscribe, load, edit, selectRevision, selectedRevision, moreHistory, send, reconcile, retry,
    discardAndReload: () => load(state.entryId, true) }
}

export type CmsEditorController = ReturnType<typeof createCmsEditor>
