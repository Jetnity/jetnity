'use client'
import * as React from 'react'
import { createClient } from '@supabase/supabase-js'

export default function Presence({ sessionId, userId }:{ sessionId:string; userId:string }){
  const [count,setCount]=React.useState(1)
  React.useEffect(()=>{
    const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const channel = supa.channel(`session:${sessionId}`, { config: { presence: { key: userId }}})
    channel.on('presence', { event:'sync' }, () => {
      const state = channel.presenceState()
      const peers = Object.values(state || {}).flat()
      setCount(peers.length || 1)
    })
    channel.subscribe(async (status)=>{
      if(status === 'SUBSCRIBED'){
        await channel.track({ online: true, ts: Date.now() })
      }
    })
    return ()=>{ channel.unsubscribe() }
  },[sessionId, userId])
  return <span className="inline-flex items-center rounded-md border px-2 py-1 text-xs">👥 {count} online</span>
}
