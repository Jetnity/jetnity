import { BuchungenLadeanzeige } from '@/components/account/AccountBuchungen'
import { kontoAnzeigesprache } from '@/lib/localization/konto-anzeigesprache'

export default async function AccountBuchungenLaden() {
  return <BuchungenLadeanzeige sprache={await kontoAnzeigesprache()} />
}
