'use client'

import { useId } from 'react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'
import './suchauswahl.css'

/** DOM-based menu: anchored to the field even at browser zoom, with keyboard navigation. */
export default function Suchauswahl<T extends string>({ label, wert, optionen, setzen }: {
  label: string
  wert: T
  optionen: readonly { wert: T; text: string }[]
  setzen: (wert: T) => void
}) {
  const id = useId()
  return <div className="reise-auswahl">
    <span id={id}>{label}</span>
    <Menu.Root modal={false}>
      <Menu.Trigger className="reise-auswahl-trigger" aria-labelledby={`${id} ${id}-wert`}>
        <span id={`${id}-wert`}>{optionen.find(o => o.wert === wert)?.text}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content className="reise-auswahl-menu" align="start" sideOffset={7} collisionPadding={12} aria-label={label}>
          <Menu.RadioGroup value={wert} onValueChange={v => {
            const option = optionen.find(o => o.wert === v)
            if (option) setzen(option.wert)
          }}>
            {optionen.map(o => <Menu.RadioItem className="reise-auswahl-option" key={o.wert} value={o.wert}>
              <span>{o.text}</span><Menu.ItemIndicator><Check size={17} aria-hidden="true" /></Menu.ItemIndicator>
            </Menu.RadioItem>)}
          </Menu.RadioGroup>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  </div>
}
