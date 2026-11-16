import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { composeDevAccountCountsInstallation } from './installation'
import { ADMIN_ACCOUNT_COUNTS_DEV_PROJECT } from '@/lib/admin/account-counts-delivery/dev-activation'

const producer = readFileSync('scripts/db/admin-account-counts-1-candidate.sql', 'utf8')
const wrapper = readFileSync('scripts/db/admin-account-counts-delivery-1-rpc.sql', 'utf8')
const digest = (value: string) => createHash('sha256').update(value).digest('hex')

test('Dev package is deterministic and refuses every other target before reading sources', () => {
  const result = composeDevAccountCountsInstallation(ADMIN_ACCOUNT_COUNTS_DEV_PROJECT)
  assert.equal(result.sha256, digest(result.sql))
  assert.equal(readFileSync('scripts/db/admin-account-counts-dev-20261115/install.sql', 'utf8'), result.sql)
  assert.equal(result.sql, composeDevAccountCountsInstallation(ADMIN_ACCOUNT_COUNTS_DEV_PROJECT).sql)
  for (const project of ['', 'qscbgcdmivbbnzrcyegn', 'develop', `${ADMIN_ACCOUNT_COUNTS_DEV_PROJECT} `]) {
    assert.throws(() => composeDevAccountCountsInstallation(project, { producer: '', wrapper: '' }), /target_not_allowed/)
  }
})

test('any change to either accepted SQL source is refused', () => {
  assert.throws(() => composeDevAccountCountsInstallation(ADMIN_ACCOUNT_COUNTS_DEV_PROJECT, { producer: `${producer}\n`, wrapper }), /source_changed/)
  assert.throws(() => composeDevAccountCountsInstallation(ADMIN_ACCOUNT_COUNTS_DEV_PROJECT, { producer, wrapper: wrapper.replace('security invoker', 'security definer') }), /source_changed/)
})

test('derived package changes exactly the three CREATE heads and preserves function bodies', () => {
  const result = composeDevAccountCountsInstallation(ADMIN_ACCOUNT_COUNTS_DEV_PROJECT)
  const derivedProducer = result.sql.split('$counts_producer_source$')[1]
  const derivedWrapper = result.sql.split('$counts_wrapper_source$')[1]
  assert.equal(derivedProducer, producer.replace('create schema if not exists jetnity_reporting;', 'create schema jetnity_reporting;')
    .replace('create or replace function jetnity_reporting.account_counts_v1()', 'create function jetnity_reporting.account_counts_v1()'))
  assert.equal(derivedWrapper, wrapper.replace('create or replace function public.admin_account_counts_v1()', 'create function public.admin_account_counts_v1()'))
  assert.equal(digest(derivedProducer.match(/as \$\$([\s\S]*?)\$\$;/)![1]), 'eaedfdc58cc572164f2bffd8dd8429e074afdd3aef9033afcfdffb3929e70e16')
  assert.equal(digest(derivedWrapper.match(/as \$\$([\s\S]*?)\$\$;/)![1]), 'aed37c6c5abd5fa8c05918e345226a0712adbe60d72f01b191f91141660c5f9c')
  assert.doesNotMatch(result.sql, /^\s*(?:create|alter) role\b|^\s*create table\b|^\s*drop\b|^\s*grant select\b/im)
})

test('isolated fixture uses the exact observed profile guard without changing the installer sources', () => {
  const fixture = readFileSync('lib/admin/account-counts-dev/fixtures/authority.sql', 'utf8')
  const guard = fixture.split('CREATE OR REPLACE FUNCTION public.profil_autoritaet_integritaet_pruefen_v1()')[1]
  assert.equal(digest(guard.match(/AS \$function\$([\s\S]*?)\$function\$/)![1]), 'b513eca8cc5d7b3981d9b9eb1473428e628410dcb0f4b718290d4cc314756a8d')
  assert.equal(digest(producer), '612f755c12f1817e129226648b6c6fd2c1eba19b57bd163102a2eb5e344c12de')
  assert.equal(digest(wrapper), '13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb')
})
