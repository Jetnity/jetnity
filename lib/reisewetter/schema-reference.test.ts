import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { WEATHER_LOCAL_UNAPPLIED_RPCS, pruefe } from '../../scripts/db/verwendung.mjs'

// Independent exact registry contract; existing Admin/entry registry tests remain intact.
test('only this unapplied weather RPC, caller and SQL are admitted by schema scanning', () => {
  const name = ['reisewetter','reservieren','v1'].join('_')
  const sourcePath = 'lib/reisewetter/global-quota-server.ts'
  const sqlPath = 'scripts/db/reisewetter-global-1/quota-candidate.sql'
  assert.deepEqual(WEATHER_LOCAL_UNAPPLIED_RPCS,[{name,sourcePath,sqlPath}])
  const sql=readFileSync(new URL('../../'+sqlPath,import.meta.url),'utf8')
  const actual=readFileSync(new URL('../../'+sourcePath,import.meta.url),'utf8')
  const examine=(path:string,contents:string,present=true,text=sql)=>pruefe({
    dateien:[path],lese:()=>contents,typenInhalt:'    Functions: {\n    }\n',
    sqlVorhanden:(p:string)=>present && p===sqlPath,sqlInhalt:()=>text,
  })
  const positive=examine(sourcePath,actual)
  assert.equal(positive.befunde.length,0)
  assert.equal(positive.lokaleUnapplied.length,1)
  assert.equal(positive.lokaleUnapplied[0].classification,'LOCAL/UNAPPLIED')
  assert.equal(examine('lib/other.ts',actual).befunde[0].grund,'wrong-source')
  assert.equal(examine(sourcePath,actual,false).befunde[0].grund,'missing-sql')
  assert.equal(examine(sourcePath,actual,true,'SELECT 1').befunde[0].grund,'missing-sql')
  assert.equal(examine(sourcePath,`.rpc('${name}_unexpected')`).befunde.length,1)
  assert.equal(examine(sourcePath,`.from('missing_weather_table')`).befunde.length,1)
})
