import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SICHERHEIT_ZIEL_44 } from '@/lib/auth/account-security-premium-ux-1'
import type { PasskeyEintrag, PasskeyListeErgebnis } from '@/lib/auth/passkey-port'
import { sicherheitText, type SicherheitTextSchluessel } from '@/lib/localization/account-security-texte'
import type { UiSprache } from '@/lib/localization/ui-sprache'

export type PasskeyVerwaltungAnsicht = {
  liste: PasskeyListeErgebnis | { art: 'laden' }
  kontoBestaetigt: boolean
  meldung: SicherheitTextSchluessel | null
  beschaeftigt: boolean
  entfernenFuer: string | null
  umbenennenFuer: string | null
  nameEntwurf: string
}

export function PasskeyManagement({
  sprache,
  ansicht,
  onRegistrieren,
  onUmbenennenStart,
  onName,
  onUmbenennenSpeichern,
  onUmbenennenAbbrechen,
  onEntfernenStart,
  onEntfernenBestaetigen,
  onEntfernenAbbrechen,
}: {
  sprache: UiSprache
  ansicht: PasskeyVerwaltungAnsicht
  onRegistrieren: () => void
  onUmbenennenStart: (id: string, name: string) => void
  onName: (wert: string) => void
  onUmbenennenSpeichern: () => void
  onUmbenennenAbbrechen: () => void
  onEntfernenStart: (id: string) => void
  onEntfernenBestaetigen: () => void
  onEntfernenAbbrechen: () => void
}) {
  const eintraege: PasskeyEintrag[] = ansicht.liste.art === 'liste' ? ansicht.liste.eintraege : []
  const verwalten = ansicht.kontoBestaetigt && (ansicht.liste.art === 'leer' || ansicht.liste.art === 'liste')

  return (
    <div className="mt-4 space-y-3" data-passkey-entwurf="bereit">
      <p className="text-sm leading-6 text-ink-700">{sicherheitText(sprache, 'passkey.registerHint')}</p>
      {ansicht.liste.art === 'laden' ? (
        <p role="status" className="text-sm leading-6 text-ink-700">
          {sicherheitText(sprache, 'passkey.loading')}
        </p>
      ) : null}
      {ansicht.liste.art === 'fehler' ? (
        <p role="alert" className="text-sm leading-6 text-ink-700">
          {sicherheitText(sprache, 'passkey.listError')}
        </p>
      ) : null}
      {ansicht.liste.art === 'leer' ? (
        <p role="status" className="text-sm leading-6 text-ink-700">
          {sicherheitText(sprache, 'passkey.status.empty')}
        </p>
      ) : null}
      {eintraege.length > 0 ? (
        <ul className="space-y-3">
          {eintraege.map((eintrag) => (
            <li key={eintrag.id} className="rounded-xl border border-black/5 p-3" data-passkey-id={eintrag.id}>
              <p className="text-sm font-medium text-brand-800">
                {eintrag.anzeigename === 'Passkey' ? sicherheitText(sprache, 'passkey.fallbackName') : eintrag.anzeigename}
              </p>
              {eintrag.erstelltAm ? (
                <p className="text-sm leading-6 text-ink-700">
                  {sicherheitText(sprache, 'passkey.created', { date: eintrag.erstelltAm })}
                </p>
              ) : null}
              {verwalten && ansicht.umbenennenFuer === eintrag.id ? (
                <div className="mt-3 space-y-2">
                  <Label htmlFor={`passkey-name-${eintrag.id}`}>{sicherheitText(sprache, 'passkey.renameLabel')}</Label>
                  <Input
                    id={`passkey-name-${eintrag.id}`}
                    value={ansicht.nameEntwurf}
                    maxLength={120}
                    autoComplete="off"
                    onChange={(event) => onName(event.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" className={`${SICHERHEIT_ZIEL_44} min-h-11`} disabled={ansicht.beschaeftigt} onClick={onUmbenennenSpeichern}>
                      {sicherheitText(sprache, 'passkey.renameSave')}
                    </Button>
                    <Button type="button" variant="ghost" className={`${SICHERHEIT_ZIEL_44} min-h-11`} disabled={ansicht.beschaeftigt} onClick={onUmbenennenAbbrechen}>
                      {sicherheitText(sprache, 'common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : verwalten && ansicht.entfernenFuer === eintrag.id ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm leading-6 text-ink-700">{sicherheitText(sprache, 'passkey.removeConfirm')}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="destructive" className={`${SICHERHEIT_ZIEL_44} min-h-11`} disabled={ansicht.beschaeftigt} onClick={onEntfernenBestaetigen}>
                      {sicherheitText(sprache, 'passkey.removeDo')}
                    </Button>
                    <Button type="button" variant="ghost" className={`${SICHERHEIT_ZIEL_44} min-h-11`} disabled={ansicht.beschaeftigt} onClick={onEntfernenAbbrechen}>
                      {sicherheitText(sprache, 'common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : verwalten ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className={`${SICHERHEIT_ZIEL_44} min-h-11`}
                    disabled={ansicht.beschaeftigt}
                    onClick={() => onUmbenennenStart(eintrag.id, eintrag.anzeigename)}
                  >
                    {sicherheitText(sprache, 'passkey.rename')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className={`${SICHERHEIT_ZIEL_44} min-h-11`}
                    disabled={ansicht.beschaeftigt}
                    onClick={() => onEntfernenStart(eintrag.id)}
                  >
                    {sicherheitText(sprache, 'passkey.remove')}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {verwalten ? (
        <Button type="button" className={`${SICHERHEIT_ZIEL_44} min-h-11`} disabled={ansicht.beschaeftigt} onClick={onRegistrieren}>
          {sicherheitText(sprache, 'passkey.register')}
        </Button>
      ) : ansicht.liste.art === 'leer' || ansicht.liste.art === 'liste' ? (
        <p role="status" className="text-sm leading-6 text-ink-700">
          {sicherheitText(sprache, 'passkey.accountRequired')}
        </p>
      ) : null}
      {ansicht.meldung ? (
        <p role="alert" className="text-sm leading-6 text-ink-700">
          {sicherheitText(sprache, ansicht.meldung)}
        </p>
      ) : null}
    </div>
  )
}
