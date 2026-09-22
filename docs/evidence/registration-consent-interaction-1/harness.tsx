// Disposable hydrated harness for registration consent interaction.
// Label/consent-row harness — not the full Next /register route.
// No Auth/signup/email. Compiled product Checkbox + Label + CSS.

import * as React from 'react'
import { createRoot } from 'react-dom/client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

declare global {
  interface Window {
    __consentCallbacks?: Record<string, boolean[]>
    __registerSubmitCount?: number
  }
}

function recordCallback(id: string, next: boolean) {
  window.__consentCallbacks ??= {}
  window.__consentCallbacks[id] ??= []
  window.__consentCallbacks[id].push(next)
}

function LegalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className="break-words text-primary hover:underline [overflow-wrap:anywhere]"
      onClick={(event) => {
        // Same as RegisterForm: stop label activation, do not preventDefault.
        event.stopPropagation()
      }}
    >
      {children}
    </a>
  )
}

function ControlledBox({
  id,
  initial = false,
  disabled = false,
}: {
  id: string
  initial?: boolean
  disabled?: boolean
}) {
  const [checked, setChecked] = React.useState(initial)
  return (
    <div data-fixture={id}>
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => {
          recordCallback(id, next)
          setChecked(next)
        }}
      />
    </div>
  )
}

function ControlledIndeterminate({ id }: { id: string }) {
  const [checked, setChecked] = React.useState<boolean | 'indeterminate'>('indeterminate')
  return (
    <div data-fixture={id}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => {
          recordCallback(id, next)
          setChecked(next)
        }}
      />
    </div>
  )
}

function UncontrolledBox({
  id,
  defaultChecked = false,
}: {
  id: string
  defaultChecked?: boolean
}) {
  return (
    <div data-fixture={id}>
      <Checkbox
        id={id}
        defaultChecked={defaultChecked}
        onCheckedChange={(next) => recordCallback(id, next)}
      />
    </div>
  )
}

function RegisterConsentRow() {
  const [accept, setAccept] = React.useState(false)
  return (
    <form
      data-fixture="register-consent"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        window.__registerSubmitCount = (window.__registerSubmitCount ?? 0) + 1
      }}
      className="space-y-5"
    >
      <input
        data-tab-start="1"
        type="text"
        aria-label="Vorfeld für echten Tab"
        className="block w-full rounded-md border border-input px-3 py-2 text-sm"
      />
      <div className="flex items-start gap-3" data-fixture="terms">
        <Checkbox
          id="terms"
          checked={accept}
          onCheckedChange={(next) => {
            recordCallback('terms', next)
            setAccept(Boolean(next))
          }}
        />
        <Label
          htmlFor="terms"
          multiline
          className="min-w-0 flex-1 break-words text-sm font-normal leading-6 text-muted-foreground [overflow-wrap:anywhere]"
        >
          Ich akzeptiere die{' '}
          <LegalLink href="/terms">Nutzungsbedingungen</LegalLink>
          {' '}
          und die{' '}
          <LegalLink href="/privacy">Datenschutzerklärung</LegalLink>
          .
        </Label>
      </div>
      <button
        type="submit"
        disabled={!accept}
        data-register-submit="1"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        Konto erstellen
      </button>
    </form>
  )
}

function IsolatedConsent() {
  return (
    <main className="w-full max-w-full bg-background px-4 py-8 text-foreground">
      <p className="mb-4 text-xs text-muted-foreground" data-harness-banner="1">
        SYNTHETIC CONSENT LAYOUT — isolated consent row, not /register Preview.
      </p>
      <RegisterConsentRow />
    </main>
  )
}

function FullHarness() {
  return (
    <main className="mx-auto w-full max-w-full space-y-8 bg-background px-4 py-8 text-foreground">
      <p className="text-xs text-muted-foreground" data-harness-banner="1">
        SYNTHETIC CONSENT HARNESS — label/consent-row only, not /register Preview. No signup.
      </p>
      <section>
        <h2 className="mb-2 text-sm font-medium">controlled-unchecked</h2>
        <ControlledBox id="controlled-unchecked" />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">controlled-checked</h2>
        <ControlledBox id="controlled-checked" initial />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">uncontrolled-default-false</h2>
        <UncontrolledBox id="uncontrolled-default-false" />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">uncontrolled-default-true</h2>
        <UncontrolledBox id="uncontrolled-default-true" defaultChecked />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">indeterminate</h2>
        <ControlledIndeterminate id="indeterminate" />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">disabled-unchecked</h2>
        <ControlledBox id="disabled-unchecked" disabled />
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">with-label</h2>
        <div data-fixture="with-label">
          <Checkbox
            id="with-label"
            label="Mit Label-Text"
            onCheckedChange={(next) => recordCallback('with-label', next)}
          />
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-medium">register-consent</h2>
        <RegisterConsentRow />
      </section>
    </main>
  )
}

const isolated = new URLSearchParams(window.location.search).get('layout') === 'consent'
const mount = document.getElementById('root')
if (!mount) throw new Error('missing #root')
createRoot(mount).render(isolated ? <IsolatedConsent /> : <FullHarness />)
