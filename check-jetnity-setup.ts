import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

const mustExist = [
  'tsconfig.json',
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  'types/supabase.ts',
  'types/supabase.types.ts',
]

const forbiddenImports = [
  '@supabase/auth-helpers-react',
  'createServerComponentClient',
]

const validPaths = {
  baseUrl: '.',
  '@/*': ['./*'],
}

function checkFileExists(file: string) {
  const exists = fs.existsSync(path.join(ROOT, file))
  console.log(`${exists ? '✅' : '❌'} ${file} ${exists ? 'gefunden' : 'FEHLT'}`)
}

function checkForbiddenImports(dir: string) {
  const files = fs.readdirSync(path.join(ROOT, dir))
  files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).forEach((file) => {
    const fullPath = path.join(ROOT, dir, file)
    const content = fs.readFileSync(fullPath, 'utf-8')
    forbiddenImports.forEach((imp) => {
      if (content.includes(imp)) {
        console.log(`❌ Veralteter Import in ${dir}/${file}: "${imp}"`)
      }
    })
  })
}

function checkTsconfig() {
  const tsconfigPath = path.join(ROOT, 'tsconfig.json')
  const content = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
  const configPaths = content.compilerOptions?.paths
  const baseUrl = content.compilerOptions?.baseUrl

  console.log(
    baseUrl === validPaths.baseUrl
      ? '✅ tsconfig.json baseUrl ist korrekt'
      : '❌ baseUrl sollte "." sein'
  )

  if (!configPaths || configPaths['@/*']?.[0] !== './*') {
    console.log('❌ tsconfig.json: Pfadalias "@/..." fehlt oder ist falsch')
  } else {
    console.log('✅ tsconfig.json: Pfadalias @/* ist korrekt')
  }
}

console.log('\n🔍 Jetnity Setup-Check startet...\n')

mustExist.forEach(checkFileExists)
checkForbiddenImports('lib/supabase')
checkForbiddenImports('types')
checkForbiddenImports('components')
checkTsconfig()

console.log('\n✅ Fertig – überprüfe rot markierte Punkte oben.\n')
