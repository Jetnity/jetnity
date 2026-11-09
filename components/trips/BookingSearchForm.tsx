'use client'

import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'

import type { BookingHandoff } from '@/lib/providers/booking/search'
import { ORGANISIEREN_PRIMAR_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import { PreviewNotice, PreviewSearchButton } from './kayak/PreviewShared'

type Props = {
  children: ReactNode
  handoff: BookingHandoff
  label: string
  startPage: string
  previewHint: string
  busy: boolean
  onChange: () => void
  onError: (error: string) => void
  onPreview: () => void
}

export default function BookingSearchForm({ children, handoff, label, startPage, previewHint, busy, onChange, onError, onPreview }: Props) {
  const ready = 'destination' in handoff
  return (
    <form
      className="mt-5 grid gap-4"
      action={ready ? handoff.action : undefined}
      method="get"
      target="_blank"
      rel="sponsored noopener noreferrer"
      onChange={onChange}
      onSubmit={event => {
        const button = (event.nativeEvent as SubmitEvent).submitter
        if (button instanceof HTMLButtonElement && button.value === 'kayak-preview') {
          event.preventDefault()
          onPreview()
        } else if ('error' in handoff) {
          event.preventDefault()
          onError(handoff.error)
        }
      }}
    >
      {children}
      {ready && <>
        <input type="hidden" name="sid" value={handoff.sid} />
        <input type="hidden" name="url" value={handoff.destination} />
      </>}
      <div className="grid justify-items-start gap-2">
        <button type="submit" className={ORGANISIEREN_PRIMAR_KLASSE}>
          {label} <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
        </button>
        <p className="max-w-prose text-xs leading-5 text-ink-600">Partnerlink über CJ. Deine Suchangaben öffnen sich bei Booking.com in einem neuen Tab. Bei einer Buchung kann Jetnity eine Provision erhalten.</p>
        {!ready && (
          <a href={startPage} target="_blank" rel="sponsored noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-medium text-brand-800 underline underline-offset-4">
            Ohne Suchangaben bei Booking.com starten
          </a>
        )}
      </div>
      <details className="border-t border-line-200 pt-2">
        <summary className="w-fit cursor-pointer py-3 text-sm font-medium text-brand-800">KAYAK-Testvorschau</summary>
        <div className="grid justify-items-start gap-3">
          <PreviewNotice />
          <p className="text-xs leading-5 text-ink-600">{previewHint}</p>
          <PreviewSearchButton busy={busy} />
        </div>
      </details>
    </form>
  )
}
