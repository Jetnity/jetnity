// app/api/og/story/[id]/route.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Jetnity Story'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const title = (searchParams.get('t') || 'Jetnity Story').slice(0, 120)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background:
            'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 35%, #a78bfa 70%, #f472b6 100%)',
          padding: 48,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(1000px 400px at 0% 0%, rgba(255,255,255,.15), transparent), radial-gradient(800px 300px at 100% 100%, rgba(0,0,0,.15), transparent)',
          }}
        />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(255,255,255,.9)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 40,
            }}
          >
            🌍
          </div>
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,.9)' }}>Jetnity</div>
        </div>

        <div
          style={{
            fontSize: 72,
            lineHeight: 1.05,
            fontWeight: 800,
            color: 'white',
            textShadow: '0 4px 24px rgba(0,0,0,.25)',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: 'rgba(255,255,255,.9)',
            fontSize: 26,
          }}
        >
          <div>Story • {params.id.slice(0, 8)}</div>
          <div>jetnity.com</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
