import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'

import AccountBesuche from '@/components/account/AccountBesuche'
import type { Besuch } from '@/lib/account/besuche'
import { weltBesuchtAbleiten } from '@/lib/account/welt-ansicht'
import { weltLaenderAbleiten } from '@/lib/account/welt-laender'
import { worldMapAbleiten } from '@/lib/account/world-map'
import type { Problem } from '@/lib/api/datenbank-lesen'

type Props = {
  problem: Problem | null
  besuche: readonly Besuch[]
  tripProblem: Problem | null
}

declare global {
  interface Window {
    __visitSetzen: (props: Props) => void
    __visitKarten: { lage: string; besucht: string } | null
  }
}

const anfang: Props = { problem: null, besuche: [], tripProblem: null }

function Harness() {
  const [props, setProps] = useState<Props>(anfang)
  const welt = useMemo(
    () => worldMapAbleiten({ problem: props.tripProblem, reisen: [] }),
    [props.tripProblem],
  )
  const besucht = useMemo(
    () => weltBesuchtAbleiten({ besuche: props.besuche, problem: props.problem }),
    [props.besuche, props.problem],
  )
  const laender = useMemo(
    () => weltLaenderAbleiten({ besucht: besucht.laenderCodes, geplant: [], geometrie: {} }),
    [besucht],
  )
  useEffect(() => {
    window.__visitSetzen = (next) => setProps(next)
    window.__visitKarten = { lage: welt.lage, besucht: besucht.lage }
  }, [welt.lage, besucht.lage])
  return (
    <AccountBesuche
      welt={welt}
      besucht={besucht}
      laender={laender}
      besuche={props.besuche}
      problem={props.problem}
    />
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('root fehlt')
createRoot(root).render(<Harness />)
