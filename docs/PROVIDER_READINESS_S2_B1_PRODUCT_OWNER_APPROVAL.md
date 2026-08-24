# Jetnity – Product-Owner-Freigabe S2-B1

Stand: 24. August 2026  
Draft-PR: `#51`  
Branch: `feat/provider-flight-evidence-s2`  
Cursor-Agent: `Provider S2 flugnachweis`

## Freigabe

Der Product Owner hat am 24. August 2026 ausdrücklich freigegeben:

> „Freigegeben für S2-B1: neue Migration nur auf Supabase Development. Production bleibt unverändert.“

## Exakter Scope

Freigegeben sind ausschließlich:

- der minimale S2-B1-Fix für den Direct-RPC-Bypass in `public.reise_anlegen(jsonb)`;
- eine neue additive Migration im Repository;
- Anwendung dieser neuen Migration ausschließlich auf Supabase Development;
- die dafür notwendigen automatisierten Regressionen und DB-/CI-/Vercel-Gates;
- Dokumentation und Handoff dieses Fixes.

Nicht freigegeben sind:

- irgendeine Production-Migration;
- Mark Ready;
- Merge;
- S3 oder spätere Provider-Readiness-Slices;
- Provideraktivierung;
- Secrets/API-Keys;
- Verträge oder kostenpflichtige Provider-Calls;
- Service-Role-, Auth-, MFA-, AAL- oder Capability-Ausweitungen.

## Stop-Regel

Nach Implementierung, Development-Anwendung und vollständigen Exact-Head-Gates: **STOPP für unabhängigen ChatGPT/Technical-Lead-Re-Review.**

Production bleibt bis zu einer späteren separaten ausdrücklichen Product-Owner-Freigabe unverändert.