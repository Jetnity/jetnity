import type { OfficialEvaluation } from '../official'
export type AcceptedStoreTripResult={
  status:'current'|'unavailable'|'unsupported_context'|'context_changed';
  tripId:string;revision:number;contextFingerprint:string;
  receiptFingerprint:string|null;evidenceVersionId:string|null;
  sourceCheckedAt:string|null;acceptedAt:string|null;readAt:string|null;expiresAt:string|null;
  /** Total monotonic deadline offset from the server reader invocation start,
   * bounded by 45s. The client anchors at its earlier HTTP REQUEST START, so
   * transport and response delays consume the SAME window exactly once. The
   * underlying deadline still includes the final DB display ceiling (<=15s). */
  deadlineFromRequestStartMs:number;evaluations:OfficialEvaluation[];
}
export const acceptedStoreMessages:Record<AcceptedStoreTripResult['status'],string>={
  current:'Die gespeicherte Visumprüfung wurde für diese Reise erneut bestätigt. Weitere Anforderungen bleiben ungeprüft. Dies ist keine Einreisegarantie.',
  unavailable:'Die gespeicherte Einreiseprüfung ist derzeit nicht verfügbar. Ein früheres Ergebnis wird nicht weiter angezeigt.',
  unsupported_context:'Für diese Reiseangaben liegt keine passende gespeicherte Prüfung vor.',
  context_changed:'Deine Reiseangaben haben sich geändert. Bitte bestätige sie erneut und prüfe anschließend den gespeicherten Stand.',
}
