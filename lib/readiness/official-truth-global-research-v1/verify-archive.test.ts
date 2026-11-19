import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
const code=readFileSync(new URL('../../../scripts/db/official-truth-global-research-dev-1/verify-archive.py',import.meta.url),'utf8')
test('whole original 206×50 research archive audit is hash-pinned and runs offline single pass',()=>{
 assert.match(code,/ARCHIVE_SHA = "4d8e9804598788a1070016f69ecd6e28c72dfdee78b56aafbd647d23e4243e9d"/)
 assert.match(code,/PRIORITY_SHA = "4515324024236916142857bf16d67590a7a1ca11c31fd1263e8b7979fd6eb358"/)
 assert.match(code,/TRACKER_SHA = "33aba1b3640541c2cabe4ec3e7dd569a6db8ed24ce83ef866ebad9255612c153"/)
 assert.match(code,/COUNTRY_SHA = "cbd520a6793b5534156ab4597db83536460b5b5f13254ba21e36ba81a4495123"/)
 assert.match(code,/tarfile.open\(path, mode="r\|\*"\)/)
 assert.match(code,/record_identity_mismatch/)
 assert.match(code,/pairs != \{\(country, code\) for country in frames for code in codes\}/)
 assert.match(code,/len\(extras\) != 9/)
 assert.match(code,/10300/)
 assert.match(code,/member.issym\(\) or member.islnk\(\)/)
 assert.doesNotMatch(code,/subprocess|requests|urllib|extractall|remove\(|unlink\(|sql|connect\(/i)
})
