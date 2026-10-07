// Replay current working tree over a real local Git clone in an owned, networkless PG16/Node22 runtime.
import { execFileSync, spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import assert from 'node:assert/strict'
const root=process.cwd(),git=execFileSync('git',['rev-parse','--git-common-dir'],{encoding:'utf8'}).trim()
const evidence=resolve('docs/evidence/trip-plan-integrated-operating-experience-1/logs')
mkdirSync(evidence,{recursive:true})
assert.match(execFileSync('docker',['context','inspect','--format','{{.Endpoints.docker.Host}}'],{encoding:'utf8'}).trim(),/^unix:\/\//)
const result=spawnSync('docker',['run','--rm','--network','none','-e','GIT_CONFIG_COUNT=1','-e','GIT_CONFIG_KEY_0=safe.directory','-e','GIT_CONFIG_VALUE_0=/git','--mount',`type=bind,source=${root},target=/source,readonly`,
  '--mount',`type=bind,source=${resolve(git)},target=/git,readonly`,'--mount',`type=bind,source=${evidence},target=/evidence`,
  '--entrypoint','sh','jetnity-r2-validation:local','-c',
  "git -c safe.directory=/git clone --no-local -u 'git -c safe.directory=/git upload-pack' -b feat/trip-plan-integrated-operating-experience-1 /git /tmp/plan-tests >/tmp/clone.log 2>&1 || { cat /tmp/clone.log; exit 1; }; tar -C /source --exclude=node_modules --exclude=.git --exclude=.next -cf - . | tar -C /tmp/plan-tests -xf - && ln -s /test-deps/node_modules /tmp/plan-tests/node_modules && cd /tmp/plan-tests && npm test > /evidence/npm-test-full.log 2>&1"],{stdio:'inherit'})
process.exitCode=result.status??1
