'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  MARKETING_KANAELE, MARKETING_ZIELE, marketingKennungErzeugen, marketingLinkErstellen,
  type MarketingKanal, type MarketingZiel,
} from '@/lib/admin/marketing/links'
import { marketingKopiertransportFuer } from '@/lib/admin/marketing/clipboard'
import { marketingText, type MarketingTextSchluessel } from '@/lib/localization/marketing-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

type CopyStatus = 'idle' | 'pending' | 'confirmed' | 'failed' | 'unavailable' | 'unconfirmed' | 'selected' | 'selectionFailed'
type Props = {
  sprache: UiSprache
  uuidErzeugen?: () => unknown
  clipboardSchreiben?: ((text: string) => Promise<void>) | null
}
const frei = () => false
const nichtBeobachten = () => () => {}
const button = 'inline-flex min-h-11 min-w-0 max-w-full items-center justify-center whitespace-normal rounded-xl border px-4 py-2 text-sm font-semibold [overflow-wrap:anywhere] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50'
const secondary = `${button} border-border bg-background text-foreground hover:bg-muted`

export default function MarketingLinks({ sprache, uuidErzeugen, clipboardSchreiben }: Props) {
  const text = (key: MarketingTextSchluessel) => marketingText(sprache, key)
  const [destination, setDestination] = useState<MarketingZiel>('home')
  const [channel, setChannel] = useState<MarketingKanal>('newsletter')
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [contentId, setContentId] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<'randomFailed' | 'invalid' | null>(null)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const generation = useRef(0)
  const mounted = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const urlElement = useRef<HTMLPreElement>(null)
  const transport = typeof document === 'undefined' ? null : marketingKopiertransportFuer(document)
  const busy = useSyncExternalStore(transport?.beobachten ?? nichtBeobachten, transport?.istBeschaeftigt ?? frei, frei)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      generation.current += 1
      if (timer.current !== null) clearTimeout(timer.current)
    }
  }, [])

  const invalidate = () => {
    generation.current += 1
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = null
    setUrl(null)
    setCopyStatus('idle')
    setError(null)
  }
  const newId = (prefix: 'cmp' | 'cnt') => marketingKennungErzeugen(prefix, uuidErzeugen ?? (() => crypto.randomUUID()))

  function createLink() {
    invalidate()
    const campaign = campaignId ?? newId('cmp')
    if (!campaign) { setError('randomFailed'); return }
    const next = marketingLinkErstellen({ destination, channel, campaignId: campaign, ...(contentId ? { contentId } : {}) })
    if (!next) { setError('invalid'); return }
    setCampaignId(campaign)
    setUrl(next)
  }

  function newCampaign() {
    invalidate()
    const next = newId('cmp')
    if (!next) { setError('randomFailed'); return }
    setCampaignId(next)
    setContentId(null)
  }

  function newContent() {
    invalidate()
    const next = newId('cnt')
    if (!next) { setError('randomFailed'); return }
    setContentId(next)
  }

  function copyLink() {
    if (!url || !transport || transport.istBeschaeftigt()) return
    let write: ((value: string) => Promise<void>) | null = clipboardSchreiben ?? null
    try {
      if (clipboardSchreiben === undefined && typeof navigator.clipboard?.writeText === 'function') {
        write = (value) => navigator.clipboard.writeText(value)
      }
    } catch { /* Unavailable browser permissions retain manual selection. */ }
    if (!write) { setCopyStatus('unavailable'); return }
    const currentGeneration = ++generation.current
    const currentUrl = url
    const start = transport.starten(() => write(currentUrl))
    if (start.status !== 'gestartet') return
    setCopyStatus('pending')
    timer.current = setTimeout(() => {
      timer.current = null
      if (mounted.current && generation.current === currentGeneration) setCopyStatus('unconfirmed')
    }, 10_000)
    void start.ergebnis.then((result) => {
      if (!mounted.current || generation.current !== currentGeneration) return
      if (timer.current !== null) clearTimeout(timer.current)
      timer.current = null
      setCopyStatus(result === 'kopiert' ? 'confirmed' : 'failed')
    })
  }

  function selectLink() {
    if (!url || !urlElement.current) return
    try {
      const field = urlElement.current
      field.focus()
      const selection = field.ownerDocument.getSelection()
      if (!selection) throw new Error('selection_unavailable')
      const range = field.ownerDocument.createRange()
      range.selectNodeContents(field)
      selection.removeAllRanges()
      selection.addRange(range)
      setCopyStatus(selection.toString() === url ? 'selected' : 'selectionFailed')
    } catch { setCopyStatus('selectionFailed') }
  }

  const parameters = url ? Array.from(new URL(url).searchParams.entries()) : []
  return (
    <section data-marketing-links lang={sprache} aria-labelledby="marketing-links-title" className="min-w-0 space-y-6 rounded-2xl border border-border bg-card p-4 text-card-foreground [overflow-wrap:anywhere] sm:p-6">
      <header className="min-w-0 max-w-3xl space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{text('marketing.eyebrow')}</p>
        <h1 id="marketing-links-title" className="text-2xl font-semibold">{text('marketing.title')}</h1>
        <p className="text-base leading-7">{text('marketing.intro')}</p>
        <p className="text-sm leading-6 text-muted-foreground">{text('marketing.scope')}</p>
        <p className="text-sm leading-6 text-muted-foreground">{text('marketing.origin')}</p>
        <p className="text-sm leading-6 text-muted-foreground">{text('marketing.language')}</p>
      </header>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0"><label htmlFor="marketing-destination" className="block text-sm font-medium">{text('marketing.destination')}</label><select id="marketing-destination" value={destination} onChange={(event) => { invalidate(); setDestination(event.target.value as MarketingZiel) }} className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30">{MARKETING_ZIELE.map((choice) => <option key={choice} value={choice}>{text(`marketing.destination.${choice}`)}</option>)}</select></div>
        <div className="min-w-0"><label htmlFor="marketing-channel" className="block text-sm font-medium">{text('marketing.channel')}</label><select id="marketing-channel" value={channel} onChange={(event) => { invalidate(); setChannel(event.target.value as MarketingKanal) }} className="mt-2 min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30">{MARKETING_KANAELE.map((choice) => <option key={choice} value={choice}>{text(`marketing.channel.${choice}`)}</option>)}</select></div>
      </div>
      <section aria-labelledby="marketing-identifiers" className="min-w-0 space-y-3 border-t border-border pt-5">
        <h2 id="marketing-identifiers" className="text-lg font-semibold">{text('marketing.identifiers')}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{text('marketing.identifiersHint')}</p>
        <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="min-w-0"><dt className="text-sm font-medium">{text('marketing.campaignId')}</dt><dd data-marketing-campaign className="mt-1 break-all font-mono text-sm">{campaignId ?? text('marketing.noCampaign')}</dd></div>
          <div className="min-w-0"><dt className="text-sm font-medium">{text('marketing.contentId')}</dt><dd data-marketing-content className="mt-1 break-all font-mono text-sm">{contentId ?? text('marketing.noContent')}</dd></div>
        </dl>
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button type="button" onClick={newCampaign} className={secondary}>{text('marketing.newCampaign')}</button>
          <button type="button" onClick={newContent} className={secondary}>{text(contentId ? 'marketing.newContent' : 'marketing.addContent')}</button>
          {contentId && <button type="button" onClick={() => { invalidate(); setContentId(null) }} className={secondary}>{text('marketing.removeContent')}</button>}
        </div>
      </section>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <button type="button" onClick={createLink} className={`${button} border-primary bg-primary text-primary-foreground hover:bg-primary/90`}>{text('marketing.create')}</button>
        <button type="button" onClick={() => { invalidate(); setDestination('home'); setChannel('newsletter'); setCampaignId(null); setContentId(null) }} className={secondary}>{text('marketing.reset')}</button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-border bg-muted p-3 text-sm leading-6">{text(`marketing.${error}`)}</p>}
      <section aria-labelledby="marketing-preview-title" className="min-w-0 space-y-3 border-t border-border pt-5">
        <h2 id="marketing-preview-title" className="text-lg font-semibold">{text('marketing.previewTitle')}</h2>
        <p id="marketing-preview-hint" className="text-sm leading-6 text-muted-foreground">{text('marketing.previewHint')}</p>
        {url ? <>
          <pre ref={urlElement} id="marketing-url" role="textbox" aria-label={text('marketing.url')} aria-readonly="true" aria-multiline="true" aria-describedby="marketing-preview-hint" tabIndex={0} className="m-0 min-h-11 min-w-0 max-w-full whitespace-pre-wrap break-all rounded-xl border border-border bg-background p-3 font-mono text-base leading-7 text-foreground [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30">{url}</pre>
          <div className="grid min-w-0 gap-2 sm:grid-cols-2">
            <button type="button" disabled={busy} onClick={copyLink} className={secondary}>{text('marketing.copy')}</button>
            <button type="button" onClick={selectLink} className={secondary}>{text('marketing.select')}</button>
          </div>
          <h3 className="text-base font-semibold">{text('marketing.parameters')}</h3>
          <dl data-marketing-parameters className="grid min-w-0 gap-3">{parameters.map(([key, value]) => <div key={key} className="grid min-w-0 gap-1 sm:grid-cols-[10rem_minmax(0,1fr)]"><dt className="min-w-0 break-all font-mono text-sm">{key}</dt><dd className="min-w-0 break-all font-mono text-sm">{value}</dd></div>)}</dl>
        </> : <p className="rounded-xl border border-dashed border-border p-3 text-sm leading-6">{text('marketing.previewEmpty')}</p>}
        {copyStatus !== 'idle' && <p id="marketing-copy-status" role="status" className="text-sm leading-6">{text(`marketing.copy.${copyStatus}`)}</p>}
        {busy && <p id="marketing-pending-warning" role="status" className="rounded-xl border border-border bg-muted p-3 text-sm leading-6">{text('marketing.copy.outstanding')}</p>}
        <p className="text-sm leading-6 text-muted-foreground">{text('marketing.reload')}</p>
      </section>
    </section>
  )
}
