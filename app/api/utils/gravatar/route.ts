// app/api/utils/gravatar/route.ts
import { NextResponse } from 'next/server'
import crypto from 'node:crypto'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const email = (searchParams.get('email') || '').trim().toLowerCase()
  const size = Math.min(Math.max(Number(searchParams.get('s') || 256), 40), 512)
  const def = searchParams.get('d') || 'mp' // mp, identicon, retro, robohash…

  if (!email) {
    return NextResponse.json({ url: `https://www.gravatar.com/avatar/00000000000000000000000000000000?s=${size}&d=${def}&r=g` })
  }

  const hash = crypto.createHash('md5').update(email).digest('hex')
  const url = `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${def}&r=g`
  return NextResponse.json({ url })
}
