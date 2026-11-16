'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { cmsReference } from '@/lib/admin/content/cms/contract'
import { cmsEditable } from '@/lib/admin/content/cms-editor-2/responses'
import { CMS_UNAVAILABLE_PORT, type CmsPort } from '@/lib/admin/content/cms-editor-2/port'
import { createCmsHttpPort } from '@/lib/admin/content/cms-editor-2/http'
import { writeCmsIntentLocation } from '@/lib/admin/content/cms-editor-2/location'
import type { CmsRecoveryMarker } from '@/lib/admin/content/cms-editor-2/request'
import { createCmsEditor, type CmsIssue, type CmsNotice } from '@/lib/admin/content/cms-editor-2/state'
import { protectCmsNavigation } from '@/lib/admin/content/cms-editor-2/navigation'
import { cmsText, type CmsTextKey } from '@/lib/localization/cms-editor-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

const BUTTON = 'inline-flex min-h-11 max-w-full items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium whitespace-normal text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed'
const INPUT = 'min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60'
const THEMES = ['stadt-kultur', 'natur', 'strand', 'erholung'] as const
const THEME_WORDS: Record<(typeof THEMES)[number], CmsTextKey> = { 'stadt-kultur': 'themeCity', natur: 'themeNature', strand: 'themeBeach', erholung: 'themeRelax' }
const ISSUES: Record<CmsIssue, CmsTextKey> = {
  conflict: 'conflict', request_conflict: 'requestConflict', invalid: 'invalid', state: 'state', missing: 'missing',
  forbidden: 'forbidden', unauthenticated: 'unauthenticated', rate_limit: 'rateLimit', timeout: 'timeout', unavailable: 'unavailableDetail',
  invalid_response: 'invalidResponse', unconfirmed: 'unconfirmed', unsaved: 'unsaved', random: 'random',
}
const NOTICES: Record<Exclude<CmsNotice, null>, CmsTextKey> = { saved: 'saved', published: 'published', archived: 'archived', restored: 'restored', recorded_changed: 'recordedChanged' }

/** The server-provided runtime selects a transport, never an authorization.
 * Every request repeats the deployment, current identity and authority gates. */
export default function CmsEditor({ sprache, initialEntryId, runtime, recovery, port, uuid }: {
  sprache: UiSprache; initialEntryId: string; runtime: 'development' | 'unavailable'
  recovery?: CmsRecoveryMarker | null; port?: CmsPort; uuid?: () => unknown
}) {
  const [controller] = useState(() => createCmsEditor(port ?? (runtime === 'development' ? createCmsHttpPort() : CMS_UNAVAILABLE_PORT), initialEntryId, {
    uuid, recovery, ...(runtime === 'development' ? { intent: writeCmsIntentLocation } : {}),
  }))
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot)
  const [discard, setDiscard] = useState(false)
  const [archive, setArchive] = useState(false)
  const [leaveWarning, setLeaveWarning] = useState(false)
  const statusRef = useRef<HTMLDivElement>(null)
  const t = (key: CmsTextKey) => cmsText(sprache, key)
  useEffect(() => { void controller.load() }, [controller])
  useEffect(() => protectCmsNavigation(window, () => {
    const current = controller.getSnapshot()
    return current.dirty || current.pending !== null || current.recovery !== null
  }, () => setLeaveWarning(true)), [controller])
  useEffect(() => {
    if (state.issue || state.notice || state.phase === 'unconfirmed') statusRef.current?.focus()
  }, [state.issue, state.notice, state.phase])

  const entry = state.snapshot?.entry
  const reference = cmsReference(state.entryId)!
  const revision = controller.selectedRevision()
  const locked = state.phase !== 'ready' || !!state.pending || !!state.recovery || state.loadingHistory
  const editable = !!entry && !locked && !entry.archived
  const valid = cmsEditable(state.form, state.entryId) !== null
  const textError = state.issue === 'invalid' || (state.dirty && !valid)
  const blockedLeave = state.dirty || !!state.pending || !!state.recovery
  const canPublish = !!entry?.draftRevision && entry.publishedRevision !== entry.draftRevision && !entry.archived && !state.dirty && !locked

  return <div data-cms-editor data-cms-runtime={runtime} lang={sprache} className="mx-auto grid min-w-0 max-w-6xl gap-5 [overflow-wrap:anywhere]">
    <header className="min-w-0">
      <a href="/admin/content" className={BUTTON}>{t('back')}</a>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t('intro')}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t('language')}</p>
    </header>
    {leaveWarning && blockedLeave ? <p role="alert" className="text-sm">{t('leave')}</p> : null}
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <label htmlFor="cms-entry" className="mb-2 block text-sm font-medium">{t('choose')}</label>
      <select id="cms-entry" className={INPUT} value={state.entryId} disabled={blockedLeave || state.phase === 'busy'}
        onChange={(event) => { setArchive(false); setDiscard(false); void controller.load(event.target.value) }}>
        {INSPIRATION_ZIELE.map(item => <option key={item.placeId} value={item.placeId}>{item.name} · {item.country}</option>)}
      </select>
      <h2 className="mt-4 font-semibold">{reference.name}</h2>
      <p className="mt-1 text-sm">{reference.country} · {t('contentLanguage')}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t('reference')}</p>
    </div>

    <div ref={statusRef} tabIndex={-1} role={state.issue ? 'alert' : 'status'} aria-live="polite" className="min-w-0 rounded-xl border border-border bg-card p-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {state.phase === 'loading' ? <p>{t('loading')}</p> : null}
      {state.phase === 'unavailable' ? <h2 className="font-semibold">{t('unavailable')}</h2> : null}
      {state.phase === 'busy' ? <p>{t('busy')}</p> : null}
      {state.issue ? <p id="cms-error" className="mt-1">{t(ISSUES[state.issue])}</p> : null}
      {state.notice ? <p>{t(NOTICES[state.notice])}</p> : null}
      {state.phase === 'ready' && !state.notice && !state.issue && entry ? <p>{entry.archived ? t('archivedState') : entry.draftRevision ? t('draftState') : t('empty')} · {entry.publishedRevision ? t('publishedState') : t('unpublishedState')}</p> : null}
      {state.pending || state.recovery ? <div className="mt-3 grid gap-3">
        <p>{t(state.recovery ? 'recovery' : 'pending')}</p>
        {state.pending?.transportOpen ? <p>{t('transportOpen')}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON} disabled={state.phase === 'busy'} onClick={() => void controller.reconcile()}>{t('confirm')}</button>
          {state.pending ? <button type="button" className={BUTTON} disabled={state.phase !== 'unconfirmed' || state.pending.transportOpen} onClick={() => void controller.retry()}>{t('retry')}</button> : null}
        </div>
      </div> : null}
      {!state.pending && !state.recovery && ['unavailable', 'conflict'].includes(state.phase) ? <button type="button" className={`${BUTTON} mt-3`} onClick={() => state.dirty ? setDiscard(true) : void controller.load()}>{state.dirty ? t('discard') : t('reload')}</button> : null}
    </div>

    {entry ? <>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <form className="grid min-w-0 gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6" onSubmit={(event) => { event.preventDefault(); void controller.send('save_draft') }}>
          <div className="min-w-0">
            <label htmlFor="cms-description" className="mb-2 block text-sm font-medium">{t('description')}</label>
            <textarea id="cms-description" rows={6} className={INPUT} value={state.form.beschreibung} disabled={!editable} aria-invalid={textError} aria-describedby={`cms-description-hint${textError ? ' cms-validation' : ''}`}
              onChange={(event) => controller.edit({ ...state.form, beschreibung: event.target.value })} />
            <p id="cms-description-hint" className="mt-2 text-sm text-muted-foreground">{t('descriptionHint')} {[...state.form.beschreibung].length}/800</p>
          </div>
          <div className="min-w-0">
            <label htmlFor="cms-idea" className="mb-2 block text-sm font-medium">{t('idea')}</label>
            <textarea id="cms-idea" rows={3} className={INPUT} value={state.form.idea} disabled={!editable} aria-invalid={textError} aria-describedby={`cms-idea-hint${textError ? ' cms-validation' : ''}`}
              onChange={(event) => controller.edit({ ...state.form, idea: event.target.value })} />
            <p id="cms-idea-hint" className="mt-2 text-sm text-muted-foreground">{t('ideaHint')} {[...state.form.idea].length}/300</p>
          </div>
          <fieldset disabled={!editable} aria-describedby="cms-themes-hint" className="min-w-0">
            <legend className="text-sm font-medium">{t('themes')}</legend>
            <p id="cms-themes-hint" className="mt-1 text-sm text-muted-foreground">{t('themesHint')}</p>
            <div className="mt-2 grid min-w-0 gap-1 sm:grid-cols-2">
              {THEMES.map(theme => <label key={theme} className="flex min-h-11 min-w-0 items-center gap-3 rounded-lg px-2 text-sm">
                <input type="checkbox" checked={state.form.themen.includes(theme)} className="h-5 w-5 shrink-0 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
                  onChange={(event) => controller.edit({ ...state.form, themen: THEMES.filter(item => item === theme ? event.target.checked : state.form.themen.includes(item)) })} />{t(THEME_WORDS[theme])}
              </label>)}
            </div>
          </fieldset>
          {textError ? <p id="cms-validation" className="text-sm">{t('invalid')}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={`${BUTTON} bg-primary text-primary-foreground hover:bg-primary/90`} disabled={!editable || !state.dirty || !valid}>{t('save')}</button>
            {state.dirty && !state.pending ? <button type="button" className={BUTTON} onClick={() => setDiscard(true)}>{t('discard')}</button> : null}
          </div>
        </form>
        <section className="min-w-0 self-start rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="cms-preview">
          <h2 id="cms-preview" className="text-lg font-semibold">{state.dirty ? t('preview') : t('savedPreview')}</h2>
          <div lang="de" className="mt-4 grid gap-4 text-sm">
            {state.form.beschreibung || state.form.idea ? <><p>{state.form.beschreibung}</p><p>{state.form.idea}</p></> : <p lang={sprache} className="text-muted-foreground">{t('previewEmpty')}</p>}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t('previewHint')}</p>
        </section>
      </div>
      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-label={t('publish')}>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={BUTTON} disabled={!canPublish} onClick={() => void controller.send('publish')}>{t('publish')}</button>
          <button type="button" className={BUTTON} disabled={locked || state.dirty || entry.archived || !entry.draftRevision} onClick={() => setArchive(true)}>{t('archive')}</button>
        </div>
        {archive ? <div className="mt-4 grid gap-3" role="group" aria-label={t('archiveConfirm')}>
          <p className="text-sm">{t('archiveQuestion')}</p>
          <div className="flex flex-wrap gap-2"><button type="button" className={BUTTON} disabled={locked || state.dirty} onClick={() => { setArchive(false); void controller.send('archive') }}>{t('archiveConfirm')}</button><button type="button" className={BUTTON} onClick={() => setArchive(false)}>{t('cancel')}</button></div>
        </div> : null}
      </section>
      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6" aria-labelledby="cms-history">
        <h2 id="cms-history" className="text-lg font-semibold">{t('history')}</h2>
        {state.snapshot!.history.length ? <ol className="mt-4 grid min-w-0 gap-3">
          {state.snapshot!.history.map(item => <li key={item.revision} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
            <span className="text-sm">{t('revision')} {item.revision} · <time dateTime={item.createdAt}>{new Intl.DateTimeFormat(sprache === 'de' ? 'de-CH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(item.createdAt))} UTC</time></span>
            <button type="button" className={BUTTON} disabled={locked} aria-pressed={state.selectedRevision === item.revision} onClick={() => controller.selectRevision(item.revision)}>{t('chooseRevision')} {item.revision}</button>
          </li>)}
        </ol> : <p className="mt-3 text-sm text-muted-foreground">{t('historyEmpty')}</p>}
        {state.snapshot!.nextBeforeRevision ? <button type="button" className={`${BUTTON} mt-4`} disabled={locked} onClick={() => void controller.moreHistory()}>{state.loadingHistory ? t('moreBusy') : t('more')}</button> : null}
        {revision ? <div className="mt-4 grid gap-3 rounded-xl bg-muted p-4">
          <h3 className="font-medium">{t('historical')} · {t('revision')} {revision.revision}</h3>
          <p lang="de" className="text-sm">{revision.content.beschreibung}</p><p lang="de" className="text-sm">{revision.content.idea}</p>
          <p className="text-sm text-muted-foreground">{t('restoreHint')}</p>
          <button type="button" className={BUTTON} disabled={locked || state.dirty} onClick={() => void controller.send('restore_draft')}>{t('restore')}</button>
        </div> : null}
      </section>
    </> : null}
    {discard && !state.pending ? <section className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-4" aria-label={t('discard')}>
      <p className="text-sm">{t('discardQuestion')}</p>
      <div className="flex flex-wrap gap-2"><button type="button" className={BUTTON} onClick={() => { setDiscard(false); setArchive(false); void controller.discardAndReload() }}>{t('discardConfirm')}</button><button type="button" className={BUTTON} onClick={() => setDiscard(false)}>{t('cancel')}</button></div>
    </section> : null}
  </div>
}
