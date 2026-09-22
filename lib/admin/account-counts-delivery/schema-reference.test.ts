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

describe('Admin account-counts schema-reference LOCAL/UNAPPLIED classification', () => {
  test('registers only the reviewed wrapper from the exact reader path', () => {
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
      ],
    )

    const result = pruefeMit(
      { [READER]: rpcCall(WRAPPER_NAME) },
      { [SQL]: `create function public.${WRAPPER_NAME}()` },
    )
    assert.equal(result.befunde.length, 0)
    assert.equal(result.lokaleUnapplied.length, 1)
    assert.equal(result.lokaleUnapplied[0]?.classification, 'LOCAL/UNAPPLIED')
    assert.equal(result.lokaleUnapplied[0]?.name, WRAPPER_NAME)
    assert.equal(result.bekannteFunktionen.has(WRAPPER_NAME), false)
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
    const result = pruefeMit(
      {
        [READER]: rpcCall(WRAPPER_NAME),
        'lib/other.ts': rpcCall(WRAPPER_NAME),
      },
      { [SQL]: `create function public.${WRAPPER_NAME}()` },
    )
    assert.equal(result.befunde.some((befund) => befund.name === WRAPPER_NAME), true)
    assert.equal(result.befunde.find((befund) => befund.name === WRAPPER_NAME)?.grund, 'wrong-source')
  })

  test('missing local SQL fails the registered wrapper', () => {
    const result = pruefeMit({ [READER]: rpcCall(WRAPPER_NAME) }, {})
    assert.equal(result.lokaleUnapplied.length, 0)
    assert.equal(result.befunde.some((befund) => befund.name === WRAPPER_NAME), true)
    assert.equal(result.befunde.find((befund) => befund.name === WRAPPER_NAME)?.grund, 'missing-sql')
  })
})
