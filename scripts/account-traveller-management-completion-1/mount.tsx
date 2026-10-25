import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

import AccountReisende from '@/components/account/AccountReisende'
import type { Problem } from '@/lib/api/datenbank-lesen'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'

type Props = {
  problem: Problem | null
  travellers: AccountRegistryTraveller[] | null
}

declare global {
  interface Window {
    __registrySetzen: (props: Props) => void
  }
}

const anfang: Props = { problem: null, travellers: [] }

function Harness() {
  const [props, setProps] = useState<Props>(anfang)
  useEffect(() => {
    window.__registrySetzen = (next) => setProps(next)
  }, [])
  return <AccountReisende problem={props.problem} travellers={props.travellers} />
}

const root = document.getElementById('root')
if (!root) throw new Error('root fehlt')
createRoot(root).render(<Harness />)
