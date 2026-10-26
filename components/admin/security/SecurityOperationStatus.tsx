'use client'

import { Button } from '@/components/ui/button'
import type { Vorgang } from '@/lib/admin/security/operation-lifecycle'

import styles from './security-widget.module.css'

function textFuer(vorgang: Vorgang): string {
  if (vorgang.lage === 'ausstehend' && vorgang.aktion === 'eintragen') {
    return `Eintrag für ${vorgang.ip} wird gesendet. Grund: ${vorgang.grund ?? ''}. Eine Rückmeldung steht noch aus.`
  }
  if (vorgang.lage === 'ausstehend') {
    return `Entfernen von ${vorgang.ip} wird gesendet. Eine Rückmeldung steht noch aus.`
  }
  if (vorgang.lage === 'rueckgemeldet' && vorgang.aktion === 'eintragen') {
    return `Rückmeldung für ${vorgang.ip}: der Eintrag wurde angenommen (nicht enforced). Das belegt nicht, dass die begrenzte Liste ihn enthält oder dass eine Sperre wirkt.`
  }
  if (vorgang.lage === 'rueckgemeldet') {
    return `Rückmeldung für ${vorgang.ip}: das Entfernen wurde angenommen (nicht enforced). Fehlt die IP in der begrenzten Liste, ist das kein Beleg, dass sie nirgends mehr steht.`
  }
  if (vorgang.lage === 'unbestaetigt') {
    return `Für ${vorgang.ip} kam nach dem Senden keine verwertbare Antwort. Das belegt nicht, dass nichts geschrieben wurde. Ein neuer Versuch startet nur, wenn er ausdrücklich ausgelöst wird.`
  }
  return `Der Vorgang für ${vorgang.ip} wurde nicht angenommen. Ein neuer Versuch startet nur auf ausdrückliche Entscheidung.`
}

export default function SecurityOperationStatus({
  vorgaenge,
  aktionenOffen,
  schreibenVerweigert,
  onErneut,
  onSchreibschutzAufheben,
}: {
  vorgaenge: Vorgang[]
  aktionenOffen: boolean
  schreibenVerweigert: boolean
  onErneut: (vorgang: Vorgang) => void
  onSchreibschutzAufheben: () => void
}) {
  if (vorgaenge.length === 0 && !schreibenVerweigert) return null
  return (
    <section className="rounded-2xl border bg-card p-4 sm:p-5" aria-labelledby="security-vorgaenge-titel">
      <h2 id="security-vorgaenge-titel" className="text-sm font-semibold">
        Blocklisten-Vorgänge
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Eine Rückmeldung und eine spätere Liste belegen nicht, dass ein Eintrag gespeichert oder entfernt wurde.
      </p>
      {schreibenVerweigert && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={styles.vorgang}>Schreiben ist abgewiesen. Ein neuer Versuch startet nicht von allein.</p>
          <Button
            type="button"
            variant="outline"
            className="whitespace-normal"
            onClick={onSchreibschutzAufheben}
            data-security-write-unlock="true"
          >
            Schreibschutz aufheben
          </Button>
        </div>
      )}
      <ul className="mt-3 space-y-3" aria-live="polite" data-security-operations={vorgaenge.length}>
        {vorgaenge.map((vorgang) => (
          <li
            key={vorgang.id}
            className={`${styles.vorgang} rounded-xl border px-3 py-3`}
            data-security-operation-ip={vorgang.ip}
            data-security-operation-state={vorgang.lage}
            data-security-operation-action={vorgang.aktion}
          >
            <p>{textFuer(vorgang)}</p>
            {vorgang.lage !== 'ausstehend' && vorgang.lage !== 'rueckgemeldet' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 whitespace-normal"
                disabled={!aktionenOffen}
                data-security-retry={vorgang.ip}
                onClick={() => onErneut(vorgang)}
              >
                Vorgang erneut senden
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
