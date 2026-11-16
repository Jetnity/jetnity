'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { DraftController } from '@/lib/admin/marketing/drafts/controller'
import { createDraftTransport } from '@/lib/admin/marketing/drafts/transport'
import { draftRecoveryFromUrl, draftRecoveryUrl, type DraftPort } from '@/lib/admin/marketing/drafts/runtime-contract'
import { marketingDraftLink, type MarketingDraftRevision } from '@/lib/admin/marketing/drafts/contract'
import { MARKETING_DRAFT_TEXT, type DraftTextKey } from '@/lib/admin/marketing/drafts/texts'
import { protectCmsNavigation } from '@/lib/admin/content/cms-editor-2/navigation'
import { MARKETING_KANAELE, MARKETING_ZIELE, type MarketingKanal, type MarketingZiel } from '@/lib/admin/marketing/links'
import { marketingText } from '@/lib/localization/marketing-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

type Props = { sprache: UiSprache; enabled: boolean; port?: DraftPort; uuid?: () => string }
type Confirmation = { kind: 'archive' | 'discard' } | { kind: 'restore'; revision: MarketingDraftRevision }
const button = 'inline-flex min-h-11 min-w-0 max-w-full items-center justify-center whitespace-normal rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground [overflow-wrap:anywhere] hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50'
const field = 'mt-2 min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30'
const panel = 'min-w-0 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6'

export default function CampaignDrafts({ sprache, enabled, port, uuid }: Props) {
  const text = (key: DraftTextKey) => MARKETING_DRAFT_TEXT[sprache][key]
  const [controller] = useState(() => new DraftController(port ?? createDraftTransport(), uuid ?? (() => crypto.randomUUID()), identity => {
    const next = draftRecoveryUrl(window.location.href, identity)
    window.history.replaceState(window.history.state, '', next)
  }))
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [historical, setHistorical] = useState<MarketingDraftRevision | null>(null)
  const linkRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (!enabled) return
    void controller.start(draftRecoveryFromUrl(window.location.href))
    const release = protectCmsNavigation(window, controller.blocked, controller.navigationBlocked)
    return () => { release(); controller.detach() }
  }, [controller, enabled])

  const denied = state.status === 'denied'
  const busy = state.busy !== null
  const blocked = busy || state.pending !== null || confirmation !== null
  const editor = state.editor
  const savedLink = state.current ? marketingDraftLink(state.current) : null
  const historicalLink = historical ? marketingDraftLink(historical) : null
  const date = (instant: string) => new Intl.DateTimeFormat(sprache === 'de' ? 'de-CH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(new Date(instant))
  async function confirmAction() {
    const choice = confirmation
    setConfirmation(null); setHistorical(null)
    if (choice?.kind === 'archive') await controller.archive()
    else if (choice?.kind === 'discard') await controller.discard()
    else if (choice?.kind === 'restore') await controller.restore(choice.revision.version)
  }

  return <section data-campaign-drafts lang={sprache} aria-labelledby="campaign-drafts-title" className="min-w-0 space-y-5 text-foreground [overflow-wrap:anywhere]">
    <header className="space-y-2"><h2 id="campaign-drafts-title" className="text-2xl font-semibold">{text('title')}</h2><p className="leading-7">{text('intro')}</p><p className="text-sm text-muted-foreground">{text('scope')}</p></header>
    {(!enabled || state.status === 'unavailable') && <section role="status" className={panel}><h3 className="font-semibold">{text('unavailable')}</h3><p>{text('unavailableHint')}</p>{enabled && <button type="button" disabled={busy || !!state.pending} onClick={() => void controller.list()} className={button}>{text('refresh')}</button>}</section>}
    {denied && <section role="alert" className={panel}><h3 className="font-semibold">{text('denied')}</h3><p>{text('deniedHint')}</p></section>}
    {state.pending && <section aria-labelledby="campaign-pending-title" className={`${panel} border-primary/40`}>
      <h3 id="campaign-pending-title" className="font-semibold">{text('pending')}</h3><p>{text('pendingHint')}</p>
      {!state.pending.command && <p>{text('afterReload')}</p>}
      <dl className="space-y-2 text-sm"><div><dt>{text('operation')}</dt><dd className="break-all font-mono">{state.pending.identity.requestId}</dd></div><div><dt>{text('recoveredVersion')}</dt><dd>{state.pending.identity.expectedVersion}</dd></div></dl>
      <div className="grid gap-2 sm:grid-cols-2"><button type="button" disabled={busy} onClick={() => void controller.confirm()} className={button}>{text('check')}</button>{state.pending.command && !denied && <button type="button" disabled={busy} onClick={() => void controller.retry()} className={button}>{text('retry')}</button>}</div>
    </section>}
    {enabled && !denied && state.status !== 'unavailable' && <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)]">
      <section aria-labelledby="campaign-list-title" className={panel}>
        <h3 id="campaign-list-title" className="text-lg font-semibold">{text('list')}</h3>
        <label className="block text-sm font-medium" htmlFor="campaign-filter">{text('filter')}<select id="campaign-filter" disabled={blocked || state.dirty} value={state.filter} onChange={event => void controller.list(false, event.target.value as 'draft' | 'archived' | 'all')} className={field}>{(['draft', 'archived', 'all'] as const).map(value => <option key={value} value={value}>{text(value)}</option>)}</select></label>
        <div className="grid gap-2"><button type="button" disabled={blocked || state.dirty || state.status !== 'ready'} onClick={() => { setHistorical(null); controller.newDraft() }} className={button}>{text('create')}</button><button type="button" disabled={blocked || state.dirty} onClick={() => void controller.list()} className={button}>{text('refresh')}</button></div>
        {state.status === 'idle' || state.status === 'loading' ? <p role="status">{text('loading')}</p> : state.items.length === 0 ? <p>{text('empty')}</p> : <ul className="space-y-3">{state.items.map(item => <li key={item.draftId} className="min-w-0 space-y-2 rounded-xl border border-border p-3">
          <p className="font-semibold">{item.payload.label}</p><p className="text-sm text-muted-foreground">{text(item.state)} · {text('version')} {item.version}</p><p className="text-sm">{date(item.savedAt)}</p>
          <button type="button" disabled={blocked || state.dirty} aria-label={`${text('open')}: ${item.payload.label}`} onClick={() => { setHistorical(null); void controller.select(item.draftId) }} className={button}>{text('open')}</button>
        </li>)}</ul>}
        {state.nextList && <button type="button" disabled={blocked || state.dirty} onClick={() => void controller.list(true)} className={button}>{text('more')}</button>}
      </section>
      <section aria-labelledby="campaign-editor-title" className={panel}>
        <h3 id="campaign-editor-title" className="text-lg font-semibold">{text('editor')}</h3>
        {!editor ? <p>{text('choose')}</p> : <>
          <dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2"><div><dt>{text('campaignId')}</dt><dd className="break-all font-mono">cmp-{editor.draftId}</dd></div><div><dt>{text('version')}</dt><dd>{state.current?.version ?? text('unsaved')}</dd></div></dl>
          <form onSubmit={event => { event.preventDefault(); void controller.save() }} className="min-w-0 space-y-4">
            <fieldset disabled={blocked || state.current?.state === 'archived'} className="min-w-0 space-y-4">
              <div><label htmlFor="campaign-label" className="block text-sm font-medium">{text('label')}</label><input id="campaign-label" autoComplete="off" maxLength={160} value={editor.payload.label} aria-describedby="campaign-label-hint" onChange={event => controller.edit({ label: event.target.value })} className={field} /><p id="campaign-label-hint" className="mt-1 text-sm text-muted-foreground">{text('labelHint')} ({[...editor.payload.label].length}/80)</p></div>
              <div className="grid min-w-0 gap-4 sm:grid-cols-2"><div><label htmlFor="campaign-destination" className="block text-sm font-medium">{text('destination')}</label><select id="campaign-destination" value={editor.payload.destination} onChange={event => controller.edit({ destination: event.target.value as MarketingZiel })} className={field}>{MARKETING_ZIELE.map(value => <option key={value} value={value}>{marketingText(sprache, `marketing.destination.${value}`)}</option>)}</select></div>
                <div><label htmlFor="campaign-channel" className="block text-sm font-medium">{text('channel')}</label><select id="campaign-channel" value={editor.payload.channel} onChange={event => controller.edit({ channel: event.target.value as MarketingKanal })} className={field}>{MARKETING_KANAELE.map(value => <option key={value} value={value}>{marketingText(sprache, `marketing.channel.${value}`)}</option>)}</select></div></div>
              <div className="space-y-2"><p className="text-sm font-medium">{text('variant')}</p><p className="break-all font-mono text-sm">{editor.payload.contentId ?? text('noVariant')}</p><div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => controller.variant()} className={button}>{text('addVariant')}</button>{editor.payload.contentId && <button type="button" onClick={() => controller.edit({ contentId: null })} className={button}>{text('removeVariant')}</button>}</div></div>
            </fieldset>
            {state.dirty && <p role="status" className="text-sm font-medium">{text('dirty')}</p>}
            {state.current?.state === 'archived' && <p className="text-sm">{text('archivedHint')}</p>}
            <div className="grid gap-2 sm:grid-cols-2"><button type="submit" disabled={blocked || state.current?.state === 'archived' || (!state.dirty && !!state.current) || ['conflict', 'request_conflict', 'state', 'missing'].includes(state.error ?? '')} className={`${button} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}>{text('save')}</button><button type="button" disabled={blocked || !state.dirty} onClick={() => setConfirmation({ kind: 'discard' })} className={button}>{text('discard')}</button>
              {state.current?.state === 'draft' && <button type="button" disabled={blocked || state.dirty} onClick={() => setConfirmation({ kind: 'archive' })} className={button}>{text('archive')}</button>}</div>
          </form>
          {savedLink && <div className="min-w-0 space-y-2 border-t border-border pt-4"><label htmlFor="campaign-saved-link" className="block font-medium">{text('link')}</label><p className="text-sm text-muted-foreground">{text('linkHint')}</p><textarea ref={linkRef} id="campaign-saved-link" readOnly rows={3} value={savedLink} className={`${field} break-all font-mono text-sm`} /><button type="button" onClick={() => { linkRef.current?.focus(); linkRef.current?.select() }} className={button}>{text('selectLink')}</button></div>}
        </>}
        {confirmation && <section role="alertdialog" aria-modal="false" aria-labelledby="campaign-confirm-title" className="space-y-3 rounded-xl border border-primary/40 bg-muted p-4"><h4 id="campaign-confirm-title" className="font-semibold">{text(confirmation.kind === 'archive' ? 'archiveQuestion' : confirmation.kind === 'discard' ? 'discardQuestion' : 'restoreQuestion')}</h4><div className="grid gap-2 sm:grid-cols-2"><button type="button" disabled={busy} onClick={() => void confirmAction()} className={button}>{text(confirmation.kind === 'archive' ? 'archiveConfirm' : confirmation.kind === 'discard' ? 'discardConfirm' : 'restoreConfirm')}</button><button type="button" disabled={busy} onClick={() => setConfirmation(null)} className={button}>{text('cancel')}</button></div></section>}
        {state.current && <section aria-labelledby="campaign-history-title" className="min-w-0 space-y-3 border-t border-border pt-4"><h4 id="campaign-history-title" className="font-semibold">{text('history')}</h4><button type="button" disabled={blocked || state.dirty} onClick={() => void controller.loadHistory()} className={button}>{text('loadHistory')}</button>
          {state.history.length === 0 ? <p className="text-sm">{text('noHistory')}</p> : <ul className="space-y-2">{state.history.map(item => <li key={item.version} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3"><p className="text-sm">{text('version')} {item.version} · {text(item.state)} · {date(item.savedAt)}</p><button type="button" disabled={blocked} onClick={() => setHistorical(item)} className={button}>{text('historyView')} {item.version}</button></li>)}</ul>}
          {state.nextHistory && <button type="button" disabled={blocked || state.dirty} onClick={() => void controller.loadHistory(true)} className={button}>{text('moreHistory')}</button>}
          {historical && <section className="min-w-0 space-y-3 rounded-xl border border-border bg-muted p-4" aria-label={`${text('historyView')} ${historical.version}`}><h5 className="font-semibold">{text('version')} {historical.version}</h5><dl className="space-y-2 text-sm"><div><dt>{text('historyLabel')}</dt><dd>{historical.payload.label}</dd></div><div><dt>{text('destination')}</dt><dd>{marketingText(sprache, `marketing.destination.${historical.payload.destination}`)}</dd></div><div><dt>{text('channel')}</dt><dd>{marketingText(sprache, `marketing.channel.${historical.payload.channel}`)}</dd></div><div><dt>{text('savedAt')}</dt><dd>{date(historical.savedAt)}</dd></div></dl>{historicalLink && <p className="break-all font-mono text-sm">{historicalLink}</p>}<div className="grid gap-2 sm:grid-cols-2"><button type="button" disabled={blocked || state.dirty} onClick={() => setConfirmation({ kind: 'restore', revision: historical })} className={button}>{text('restore')}</button><button type="button" onClick={() => setHistorical(null)} className={button}>{text('closeHistory')}</button></div></section>}
        </section>}
      </section>
    </div>}
    {busy && <p role="status" className="text-sm">{text('busy')}</p>}
    {state.error && !denied && <p role="alert" className="rounded-xl border border-border bg-muted p-3 text-sm">{text(state.error)}</p>}
    {state.notice && <p role="status" className="rounded-xl border border-border bg-muted p-3 text-sm">{text(state.notice)}</p>}
  </section>
}
