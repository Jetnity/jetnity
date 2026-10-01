import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import {
  LOCAL_UNAPPLIED_RPCS,
  pruefe,
} from '../../../scripts/db/verwendung.mjs'

const TYPEN = [
  '    Tables: {',
  '      trips: {',
  '      }',
  '    }',
  '    Views: {',
  '    }',
  '    Functions: {',
  '      existing_fn: {',
  '      }',
  '    }',
].join('\n')

const READER = 'lib/admin/account-counts-delivery/reader.ts'
const SQL = 'scripts/db/admin-account-counts-delivery-1-rpc.sql'
const WRAPPER_NAME = ['admin', 'account', 'counts', 'v1'].join('_')
const STORE_SOURCE = 'lib/readiness/official-truth-store-server.ts'
const STORE_SQL = 'supabase/migrations/20261001180549_official_truth_trusted_store_writer_1.sql'
const STORE_RPC = ['official', 'truth', 'store', 'accepted', 'v1'].join('_')
const UNKNOWN_TABLE = ['missing', 'table'].join('_')
const UNKNOWN_RPC = ['totally', 'unknown', 'rpc'].join('_')

function rpcCall(name: string): string {
  return `.rpc(${JSON.stringify(name)})`
}

function fromCall(name: string): string {
  return `.from(${JSON.stringify(name)})`
}

function pruefeMit(files: Record<string, string>, sqlFiles: Record<string, string>) {
  return pruefe({
    dateien: Object.keys(files),
    lese: (datei: string) => {
      if (files[datei] === undefined) throw new Error(`unexpected read ${datei}`)
      return files[datei]
    },
    typenInhalt: TYPEN,
    sqlVorhanden: (pfad: string) => Object.hasOwn(sqlFiles, pfad),
    sqlInhalt: (pfad: string) => sqlFiles[pfad],
  })
}

describe('schema-reference LOCAL/UNAPPLIED classification', () => {
  test('registers exactly the two reviewed local RPCs', () => {
    assert.deepEqual(
      LOCAL_UNAPPLIED_RPCS.map((regel) => ({
        name: regel.name,
        sourcePath: regel.sourcePath,
        sqlPath: regel.sqlPath,
      })),
      [
        {
          name: 'admin_account_counts_v1',
          sourcePath: READER,
          sqlPath: SQL,
        },
        {
          name: STORE_RPC,
          sourcePath: STORE_SOURCE,
          sqlPath: STORE_SQL,
        },
      ],
    )

    const result = pruefeMit(
      {
        [READER]: rpcCall(WRAPPER_NAME),
        [STORE_SOURCE]: rpcCall(STORE_RPC),
      },
      {
        [SQL]: `create function public.${WRAPPER_NAME}()`,
        [STORE_SQL]: `create function public.${STORE_RPC}(payload jsonb)`,
      },
    )
    assert.equal(result.befunde.length, 0)
    assert.equal(result.lokaleUnapplied.length, 2)
    assert.deepEqual(
      result.lokaleUnapplied.map((eintrag) => eintrag.name),
      [WRAPPER_NAME, STORE_RPC],
    )
    for (const eintrag of result.lokaleUnapplied) {
      assert.equal(eintrag.classification, 'LOCAL/UNAPPLIED')
    }
    assert.equal(result.bekannteFunktionen.has(WRAPPER_NAME), false)
    assert.equal(result.bekannteFunktionen.has(STORE_RPC), false)
  })

  test('unknown RPC names and unknown tables stay fail-closed', () => {
    const result = pruefeMit(
      {
        [READER]: rpcCall(WRAPPER_NAME),
        'lib/other.ts': `${fromCall(UNKNOWN_TABLE)}${rpcCall(UNKNOWN_RPC)}`,
      },
      { [SQL]: `create function public.${WRAPPER_NAME}()` },
    )
    assert.equal(result.befunde.some((befund) => befund.name === UNKNOWN_TABLE), true)
    assert.equal(result.befunde.some((befund) => befund.name === UNKNOWN_RPC), true)
    assert.equal(result.befunde.some((befund) => befund.name === WRAPPER_NAME), false)
  })

  test('the same local name in another runtime file fails', () => {
    const admin = pruefeMit(
      {
        [READER]: rpcCall(WRAPPER_NAME),
        'lib/other.ts': rpcCall(WRAPPER_NAME),
      },
      { [SQL]: `create function public.${WRAPPER_NAME}()` },
    )
    assert.equal(admin.befunde.some((befund) => befund.name === WRAPPER_NAME), true)
    assert.equal(admin.befunde.find((befund) => befund.name === WRAPPER_NAME)?.grund, 'wrong-source')

    const store = pruefeMit(
      {
        [STORE_SOURCE]: rpcCall(STORE_RPC),
        'lib/other.ts': rpcCall(STORE_RPC),
      },
      { [STORE_SQL]: `create function public.${STORE_RPC}(payload jsonb)` },
    )
    assert.equal(store.befunde.some((befund) => befund.name === STORE_RPC), true)
    assert.equal(store.befunde.find((befund) => befund.name === STORE_RPC)?.grund, 'wrong-source')
  })

  test('missing local SQL fails the registered wrapper', () => {
    const admin = pruefeMit({ [READER]: rpcCall(WRAPPER_NAME) }, {})
    assert.equal(admin.lokaleUnapplied.length, 0)
    assert.equal(admin.befunde.some((befund) => befund.name === WRAPPER_NAME), true)
    assert.equal(admin.befunde.find((befund) => befund.name === WRAPPER_NAME)?.grund, 'missing-sql')

    const store = pruefeMit({ [STORE_SOURCE]: rpcCall(STORE_RPC) }, {})
    assert.equal(store.lokaleUnapplied.length, 0)
    assert.equal(store.befunde.some((befund) => befund.name === STORE_RPC), true)
    assert.equal(store.befunde.find((befund) => befund.name === STORE_RPC)?.grund, 'missing-sql')
  })
})
