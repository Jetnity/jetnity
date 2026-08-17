// lib/api/antwort.ts
//
// Die eine Stelle, an der aus einem Datenbankproblem eine HTTP-Antwort wird.
//
// Getrennt von `datenbank-lesen.ts`, damit die Unterscheidung zwischen Fehler
// und echter Leere ohne Next-Laufzeit geprüft werden kann.

import { NextResponse } from 'next/server'

import type { Problem } from '@/lib/api/datenbank-lesen'

/**
 * Antwortet mit dem Status, den das Problem verlangt, und mit `message` –
 * demselben Feld, das `api/security/list` seit Phase 1.4 sendet und das
 * `SecurityWidget` der Bedienerin anzeigt. Eine Ablehnung, die niemand lesen
 * kann, ist von einer leeren Liste kaum zu unterscheiden.
 */
export function problemAntwort(problem: Problem): NextResponse {
  return NextResponse.json({ message: problem.message }, { status: problem.status })
}
