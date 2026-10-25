// Private helper for run.py. No Next app, dotenv, npm lifecycle, browser or network client.
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const [repoArgument, outputArgument] = process.argv.slice(2)
if (!repoArgument || !outputArgument || process.argv.length !== 4) {
  throw new Error('Use run.py REPO FULL_HEAD FULL_TREE NEW_OUTPUT_DIRECTORY')
}
const repo = path.resolve(repoArgument)
const output = path.resolve(outputArgument)
if (process.cwd() !== repo) throw new Error('Working directory must be the exact repository root')
if (output === repo || output.startsWith(repo + path.sep)) throw new Error('CSS output must be outside the repository')
const requireFromRepo = createRequire(path.join(repo, 'package.json'))
const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const lock = JSON.parse(readFileSync(path.join(repo, 'package-lock.json'), 'utf8'))
const expectedPipeline = ['tailwindcss/nesting', 'tailwindcss', 'autoprefixer']
const configPath = path.join(repo, 'postcss.config.js')
const config = requireFromRepo(configPath)
if (!config || typeof config !== 'object' || JSON.stringify(Object.keys(config)) !== '["plugins"]') {
  throw new Error('PostCSS config shape changed; requires a narrow Technical-Lead preparation review')
}
if (JSON.stringify(Object.keys(config.plugins ?? {})) !== JSON.stringify(expectedPipeline)) {
  throw new Error('PostCSS pipeline changed; no fallback or substituted pipeline is permitted')
}

const packageNames = ['postcss', 'tailwindcss', 'autoprefixer', 'tailwind-scrollbar-hide', 'tailwindcss-animate']
const packages = packageNames.map((name) => {
  // Some installed packages deliberately do not export the package.json subpath.
  // Read metadata from the required repo node_modules and bind the actual entry
  // to that same physical package directory, rather than adding a fallback.
  const packagePath = path.join(repo, 'node_modules', name, 'package.json')
  const packageDirectory = realpathSync(path.dirname(packagePath))
  const entryPath = realpathSync(requireFromRepo.resolve(name))
  if (!entryPath.startsWith(packageDirectory + path.sep)) throw new Error('Dependency resolves outside its repository package: ' + name)
  const raw = readFileSync(packagePath)
  const installed = JSON.parse(raw)
  const locked = lock.packages?.['node_modules/' + name]?.version
  if (!locked || installed.version !== locked) throw new Error('Dependency version differs from the source lockfile: ' + name)
  return { name, version: installed.version, lockedVersion: locked, packagePath, packageDirectory, entryPath, packageJsonSha256: sha256(raw) }
})
const modules = ['postcss', ...expectedPipeline].map((name) => {
  const resolved = requireFromRepo.resolve(name)
  return { name, resolved, entrySha256: sha256(readFileSync(resolved)) }
})
const plugins = Object.entries(config.plugins).map(([name, options]) => {
  if (options === false || options === null || typeof options !== 'object') throw new Error('Unsupported configured plugin options: ' + name)
  const loaded = requireFromRepo(name)
  const factory = loaded.default ?? loaded
  if (typeof factory !== 'function') throw new Error('Configured plugin factory is not callable: ' + name)
  return factory(options)
})
const inputPath = path.join(repo, 'styles/globals.css')
const input = readFileSync(inputPath)
const result = await requireFromRepo('postcss')(plugins).process(input.toString('utf8'), {
  from: inputPath,
  to: output,
  map: false,
})
const css = Buffer.from(result.css, 'utf8')
if (css.length === 0) throw new Error('CSS compiler returned empty output')
writeFileSync(output, css, { flag: 'wx', mode: 0o600 })
process.stdout.write(JSON.stringify({
  kind: 'LOCAL_PROJECT_POSTCSS_COMPILATION',
  nextBuildClaim: false,
  actualWorkingDirectory: process.cwd(),
  nodeVersion: process.version,
  nodeExecutable: process.execPath,
  configPath,
  configSha256: sha256(readFileSync(configPath)),
  pipeline: Object.entries(config.plugins).map(([name, options]) => ({ name, options })),
  packages,
  modules,
  inputPath,
  inputSha256: sha256(input),
  outputPath: output,
  cssBytes: css.length,
  cssSha256: sha256(css),
  warnings: result.warnings().map((warning) => ({ plugin: warning.plugin, text: warning.text, line: warning.line, column: warning.column })),
}) + '\n')
