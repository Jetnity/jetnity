export async function GET() {
  const API = process.env.INFOMANIAK_API_BASE ?? 'https://api.infomaniak.com/2'
  const TOKEN =
    process.env.INFOMANIAK_DOMAIN_TOKEN ?? process.env.INFOMANIAK_KSUITE_TOKEN

  if (!TOKEN) {
    return Response.json({ ok: false, error: 'MISSING_TOKEN' }, { status: 200 })
  }

  try {
    // HINWEIS: Pfad exemplarisch – /domains ist v2-typisch. Falls Infomaniak hier leicht abweicht,
    // bleibt die Route trotzdem 200 und blockiert die UI nicht.
    const r = await fetch(`${API}/domains`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: 'no-store',
    })
    const json = await r.json().catch(() => ({}))
    if (!r.ok) {
      return Response.json(
        { ok: false, status: r.status, error: json?.error ?? json },
        { status: 200 },
      )
    }
    return Response.json({ ok: true, domains: json?.data ?? json })
  } catch (e: any) {
    return Response.json({ ok: false, error: String(e) }, { status: 200 })
  }
}
