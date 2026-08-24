// lib/provider-ops/cost-guard.ts
//
// Gemeinsames Cost-Guard-Interface. S1 bleibt in-memory und prozesslokal.
// Persistente globale Limits sind PR-S6. Bei internem Fehler: fail closed.
//
// `erlaubt` ist absichtlich async, damit S6 I/O einhängen kann, ohne
// Domain-Hüllen erneut umzuschneiden.

export type ProviderOpsCostGuardErgebnis =
  | { ok: true }
  | { ok: false; retryAfterSec: number }

export type ProviderOpsCostGuardGrenzen = {
  fensterMs: number
  anfragenJeFenster: number
  tagMs: number
  anfragenJeTag: number
}

export type ProviderOpsCostGuard = {
  erlaubt(kennung: string, uhr?: () => number): Promise<ProviderOpsCostGuardErgebnis>
  leeren(): void
}

type Eintrag = { fenster: number[]; tag: number[] }

function saeubern(liste: number[], ab: number): number[] {
  return liste.filter((zeit) => zeit >= ab)
}

function entscheiden(
  speicher: Map<string, Eintrag>,
  grenzen: ProviderOpsCostGuardGrenzen,
  kennung: string,
  ts: number,
): ProviderOpsCostGuardErgebnis {
  const key = kennung.trim()
  if (!key) {
    return { ok: false, retryAfterSec: 1 }
  }

  const bisher = speicher.get(key) ?? { fenster: [], tag: [] }
  const fenster = saeubern(bisher.fenster, ts - grenzen.fensterMs)
  const tag = saeubern(bisher.tag, ts - grenzen.tagMs)

  if (fenster.length >= grenzen.anfragenJeFenster) {
    const aelteste = fenster[0] ?? ts
    speicher.set(key, { fenster, tag })
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((aelteste + grenzen.fensterMs - ts) / 1000)),
    }
  }
  if (tag.length >= grenzen.anfragenJeTag) {
    const aelteste = tag[0] ?? ts
    speicher.set(key, { fenster, tag })
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((aelteste + grenzen.tagMs - ts) / 1000)),
    }
  }

  fenster.push(ts)
  tag.push(ts)
  speicher.set(key, { fenster, tag })
  return { ok: true }
}

/**
 * In-Memory-Fenster-/Tageszähler. Nicht production-global.
 * Fehler oder leere Kennung dürfen keinen Call freigeben.
 */
export function providerOpsInMemoryCostGuard(
  grenzen: ProviderOpsCostGuardGrenzen,
): ProviderOpsCostGuard {
  const speicher = new Map<string, Eintrag>()

  return {
    async erlaubt(kennung, uhr) {
      try {
        return entscheiden(speicher, grenzen, kennung, uhr ? uhr() : Date.now())
      } catch {
        return { ok: false, retryAfterSec: 1 }
      }
    },
    leeren() {
      speicher.clear()
    },
  }
}
