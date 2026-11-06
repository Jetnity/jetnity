// Synthetic identity fixtures only. No network, legal observation or source admission.
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, test } from 'node:test'
import ts from 'typescript'
import { AA_VISA_TABLE_IDENTITY_CANDIDATE as profile } from './official-truth-aa-visa-table-identity-candidate'

type Input = Parameters<typeof profile.verify>[0]
const URL = 'https://www.auswaertiges-amt.de/de/service/visa-und-aufenthalt/staatenliste-zur-visumpflicht-207820'
const TITLE = 'Übersicht zur Visumpflicht bzw. -freiheit bei Einreise in die Bundesrepublik Deutschland'
const ID = '<!-- ID : 207820 / Version : 44 -->'
const HEADING = `<h1 class="heading__title"><span class="heading__title-text">${TITLE}</span></h1>`
const CANONICAL = `<link rel="canonical" href="${URL}">`
const META = [
  '<meta name="author" content="Auswärtiges Amt">',
  `<meta property="og:url" content="${URL}">`,
  '<meta property="og:site_name" content="Auswärtiges Amt ">',
  '<meta property="og:type" content="article">',
  '<meta property="og:locale" content="de">',
  `<meta property="og:title" content="${TITLE}">`,
]
const INVALID = { ok: false, reason: 'invalid_response' }
const MISMATCH = { ok: false, reason: 'identity_mismatch' }

function fixture(): string {
  return `<!doctype html><html lang="de"><head><title>${TITLE} - Auswärtiges Amt</title>${CANONICAL}${META.join('')}</head>`
    + `<body><div><main id="main"><h1 class="is-aural">Willkommen</h1><header>${HEADING}</header>`
    + '<p class="heading__meta">03.06.2026 - Artikel</p><p id="padding"></p></main>'
    + `${ID}</div></body></html>`
}
function input(responseText = fixture()): Input {
  return {
    item: { sourceId: 'synthetic-aa', contentItemId: 'synthetic-document', contentItemVersion: 7, current: true,
      externalIdNamespace: 'aa-content-id', externalContentId: '207820',
      expectedPublisherIds: ['auswaertiges-amt'], expectedAuthorityIds: ['auswaertiges-amt'] },
    representation: { sourceId: 'synthetic-aa', contentItemId: 'synthetic-document', contentItemVersion: 7,
      representationId: 'synthetic-html-de', representationVersion: 11, current: true,
      requestUrls: [URL], expectedFinalUrl: URL, expectedMediaType: 'text/html', expectedLocale: 'de', expectedSchema: 'article',
      identityProfileId: profile.identityProfileId, identityProfileVersion: 1 },
    responseText, finalUrl: URL, mediaType: 'text/html',
  }
}
function rejects(responseText: string, name: string): void {
  assert.equal(profile.verify(input(responseText)).ok, false, name)
}

describe('AA identity candidate: representation consistency without origin or legal authority', () => {
  test('exact observed anchors return only an immutable descriptor-owned identity copy', () => {
    const request = input(), before = structuredClone(request), result = profile.verify(request)
    assert.equal(profile.current, false)
    assert.equal(profile.identityProfileId, 'de-aa-visa-table-html-de-candidate')
    assert.equal(profile.identityProfileVersion, 1)
    assert(Object.isFrozen(profile))
    assert.deepEqual(result, { ok: true, identity: {
      sourceId: 'synthetic-aa', contentItemId: 'synthetic-document', contentItemVersion: 7,
      representationId: 'synthetic-html-de', representationVersion: 11,
      identityProfileId: profile.identityProfileId, identityProfileVersion: 1,
    } })
    assert(result.ok && Object.isFrozen(result.identity) && Object.isFrozen(result))
    assert.deepEqual(request, before)
    assert(!Object.isFrozen(request.item))
    assert(!Object.isFrozen(request.representation.requestUrls))
    assert.notEqual(result.identity, request.representation)
    assert.deepEqual(Object.keys(profile).sort(), ['current', 'identityProfileId', 'identityProfileVersion', 'verify'])
  })

  test('coherent local IDs and versions are preserved without inventing external IDs', () => {
    const request = input()
    const result = profile.verify({ ...request,
      item: { ...request.item, sourceId: 'another-local-source', contentItemId: 'another-local-item', contentItemVersion: 8 },
      representation: { ...request.representation, sourceId: 'another-local-source', contentItemId: 'another-local-item',
        contentItemVersion: 8, representationId: 'another-local-representation', representationVersion: 12 },
    })
    assert(result.ok)
    assert.equal(result.identity.sourceId, 'another-local-source')
    assert.equal(result.identity.contentItemId, 'another-local-item')
    assert.equal(result.identity.contentItemVersion, 8)
    assert.equal(result.identity.representationId, 'another-local-representation')
    assert.equal(result.identity.representationVersion, 12)
  })

  test('publication/version/legal-body changes do not become visa or validity judgments', () => {
    for (const body of ['<p>Schweiz Nein</p>', '<p>Schweiz Ja</p>', '<p>Unbekannter neuer Inhalt.</p>']) {
      const html = fixture().replace('<p id="padding"></p>', body)
        .replace('03.06.2026', '01.01.2030').replace('Version : 44', 'Version : 91')
      assert.deepEqual(profile.verify(input(html)), profile.verify(input()))
    }
  })

  test('HTML entities and observed whitespace normalize text, not URLs or locale', () => {
    const html = fixture().replaceAll('Auswärtiges Amt', 'Ausw&auml;rtiges\nAmt')
      .replace('<span class="heading__title-text">', '<span class="heading__title-text">\n ')
    assert(profile.verify(input(html)).ok)
    rejects(fixture().replace(META[1]!, `<meta property="og:url" content=" ${URL}">`), 'URL whitespace')
    rejects(fixture().replace('content="de"', 'content=" de "'), 'locale whitespace')
  })

  test('each identity anchor is required and contradictory anchors fail closed', () => {
    const anchors = [CANONICAL, ...META, ID, HEADING]
    for (const anchor of anchors) rejects(fixture().replace(anchor, ''), `missing ${anchor.slice(0, 70)}`)
    for (const [from, to] of [
      ['lang="de"', 'lang="en"'], ['207820', '207821'], ['og:type" content="article', 'og:type" content="website'],
      ['og:locale" content="de', 'og:locale" content="en'], ['name="author" content="Auswärtiges Amt', 'name="author" content="Andere Behörde'],
      ['og:site_name" content="Auswärtiges Amt ', 'og:site_name" content="Andere Behörde'],
      ['<title>', '<title>Andere Seite '], ['class="heading__title"', 'class="other-title"'],
      ['id="main"', 'id="other-main"'], ['ID : 207820', 'ID : 207821'],
    ]) rejects(fixture().replace(from!, to!), `${from} drift`)
  })

  test('identical and conflicting duplicate metadata, canonical links and IDs are rejected', () => {
    for (const anchor of [CANONICAL, ...META]) {
      rejects(fixture().replace('</head>', `${anchor}</head>`), 'same head anchor twice')
      rejects(fixture().replace('</body>', `${anchor}</body>`), 'anchor outside head')
      rejects(fixture().replace('</body>', `<template>${anchor}</template></body>`), 'inert duplicate')
    }
    rejects(fixture().replace('</head>', `<link rel="canonical" href="https://example.org/"></head>`), 'conflicting canonical')
    rejects(fixture().replace(ID, ID + ID), 'duplicate native ID')
    rejects(fixture().replace(ID, ID + '<!-- ID : 207821 / Version : 45 -->'), 'conflicting native ID')
    rejects(fixture().replace(HEADING, HEADING + HEADING), 'duplicate article heading')
    rejects(fixture().replace(HEADING, HEADING + `<h1>${TITLE}</h1>`), 'same title without article class')
  })

  test('a second different accessibility H1 is valid; hidden article headings or ancestors are not', () => {
    assert(profile.verify(input()).ok)
    for (const attrs of ['hidden', 'inert', 'aria-hidden="true"', 'aria-hidden="unknown"',
      'style="display:none"', 'style="display:/**/none"', 'style="visibility:hidden"', 'class="sr-only"', 'class="is-aural"']) {
      rejects(fixture().replace('<header>', `<header ${attrs}>`), `ancestor ${attrs}`)
      rejects(fixture().replace('<span class="heading__title-text">', `<span ${attrs}>`), `child ${attrs}`)
    }
    rejects(fixture().replace('<h1 class="heading__title">', '<h1 class="heading__title" hidden>'), 'heading hidden')
    rejects(fixture().replace('<body>', '<body style="opacity:0">'), 'body styled')
    rejects(fixture().replace('<header>', '<details>').replace('</header>', '</details>'), 'closed details')
    rejects(fixture().replace('<header>', '<dialog>').replace('</header>', '</dialog>'), 'closed dialog')
  })

  test('script, comment and template strings cannot substitute identity anchors', () => {
    for (const [open, close] of [['<script>', '</script>'], ['<!--', '-->'], ['<template>', '</template>'], ['<noscript>', '</noscript>']]) {
      rejects(fixture().replace(HEADING, `${open}${HEADING}${close}`), `${open} heading`)
      rejects(fixture().replace(CANONICAL, `${open}${CANONICAL}${close}`), `${open} canonical`)
    }
    rejects(fixture().replace(ID, `<script>"${ID}"</script>`), 'native ID as JS string')
    rejects(fixture().replace(ID, `<template>${ID}</template>`), 'native ID in template')
    // Token observation must respect parse5's script/comment states.
    const inertStrings = '<script>const x="<html><head><body><main><title><svg hidden><div></div></svg><math></math>";</script><!-- <html><body><svg><math> -->'
    assert(profile.verify(input(fixture().replace(ID, inertStrings + ID))).ok)
  })

  test('foreign-namespace and hidden native-ID lookalikes cannot establish document identity', () => {
    for (const [open, close] of [['<svg>', '</svg>'], ['<svg hidden>', '</svg>'], ['<svg><g hidden>', '</g></svg>'],
      ['<math>', '</math>'], ['<div hidden>', '</div>'],
      ['<div aria-hidden="true">', '</div>'], ['<div class="is-aural">', '</div>'], ['<details>', '</details>']]) {
      rejects(fixture().replace(ID, `${open}${ID}${close}`), `${open} ID`)
      rejects(fixture().replace(HEADING, `${open}${HEADING}${close}`), `${open} heading`)
    }
    rejects(fixture().replace(HEADING, `<svg><foreignObject>${HEADING}</foreignObject></svg>`), 'HTML integration point under SVG')
    rejects(fixture().replace(CANONICAL, `<svg>${CANONICAL}</svg>`), 'foreign canonical')
  })

  test('the observed HTML-only contract rejects foreign entry before any nonidentity breakout', () => {
    for (const foreign of [
      `<svg hidden><div>${HEADING}</div></svg>`,
      `<svg hidden><span>${HEADING}</span></svg>`,
      `<math hidden><div>${HEADING}</div></math>`,
      `<svg hidden><p>Earlier nonidentity breakout</p>${HEADING}</svg>`,
    ]) rejects(fixture().replace(HEADING, foreign), foreign)
    // This source-specific candidate deliberately does not admit even unrelated
    // genuine foreign graphics. A publisher markup change requires review.
    rejects(fixture().replace(ID, '<svg><path d="M0 0"></path></svg>' + ID), 'unrelated SVG')
    rejects(fixture().replace(ID, '<math><mi>x</mi></math>' + ID), 'unrelated MathML')
  })

  test('discarded document tags and foster-parented anchors cannot be concealed by tree repair', () => {
    for (const tag of ['html', 'head', 'body', 'main', 'title']) {
      rejects(fixture().replace('<header>', `<${tag}><header>`), `extra ${tag} start`)
      rejects(fixture().replace('<header>', `</${tag}><header>`), `extra ${tag} end`)
    }
    rejects(fixture().replace(CANONICAL, '').replace('</head>', `</head>${CANONICAL}`), 'canonical reparented into head')
    rejects(fixture().replace(HEADING, `<table>${HEADING}</table>`), 'foster-parented H1')
    rejects(fixture().replace('</span>', ''), 'unclosed heading child')
  })

  test('duplicate identity attributes reject both first-value and last-value interpretations', () => {
    for (const [from, to] of [
      ['lang="de"', 'lang="de" lang="en"'],
      ['rel="canonical"', 'rel="canonical" rel="other"'],
      ['name="author"', 'name="author" name="other"'],
      ['og:locale" content="de"', 'og:locale" content="de" content="en"'],
      ['class="heading__title"', 'class="heading__title" class="hidden"'],
      ['<header>', '<header class="visible" class="hidden">'],
      ['<body>', '<body id="first" id="second">'],
    ]) rejects(fixture().replace(from!, to!), `duplicate ${from}`)
    // The first attribute must not conceal a discarded identity-bearing one.
    for (const contradictory of [
      '<link rel="stylesheet" rel="canonical" href="https://evil.test/">',
      '<meta name="description" name="author" content="Other authority">',
      '<meta property="description" property="og:url" content="https://evil.test/">',
    ]) rejects(fixture().replace('</head>', contradictory + '</head>'), contradictory)
    const navigation = '<nav><h2 class="nav-primary__headline" data-js-atom="navigation-heading" data-js-atom="navigation-heading" tabindex="-1">Menü</h2></nav>'
    assert(profile.verify(input(fixture().replace('<main', navigation + '<main'))).ok)
  })

  test('fragments, missing explicit document boundaries and malformed UTF-16 fail closed', () => {
    for (const html of ['', ' ', HEADING, fixture().replace('<!doctype html>', ''),
      fixture().replace('</html>', ''), fixture().replace('</body>', ''), fixture().replace('</head>', ''),
      fixture().replace('</main>', ''), fixture().replace('</title>', ''), fixture() + '\ud800', fixture() + '\udc00',
      '\ufeff' + fixture(), fixture() + '\0']) rejects(html, JSON.stringify(html.slice(0, 30)))
    for (const value of [null, {}, [], 7]) {
      assert.deepEqual(profile.verify({ ...input(), responseText: value } as unknown as Input), INVALID)
    }
  })

  test('the 128 KiB candidate bound counts UTF-8 bytes and is not a transport allowance', () => {
    const base = fixture(), spare = 131_072 - Buffer.byteLength(base)
    for (const padding of ['x'.repeat(spare), 'é'.repeat(Math.floor(spare / 2)) + (spare % 2 ? 'x' : '')]) {
      const exact = base.replace('<p id="padding">', '<p id="padding">' + padding)
      assert.equal(Buffer.byteLength(exact), 131_072)
      assert(profile.verify(input(exact)).ok)
      assert.deepEqual(profile.verify(input(exact + ' ')), INVALID)
    }
    assert.deepEqual(profile.verify(input(base + 'x'.repeat(131_072))), INVALID)
  })

  test('DOM node/depth and parse-error ceilings fail closed before unlimited traversal', () => {
    assert.deepEqual(profile.verify(input(fixture().replace('<p id="padding"></p>', '<i>x</i>'.repeat(5_100)))), INVALID)
    const nested = '<section>'.repeat(65) + HEADING + '</section>'.repeat(65)
    assert.deepEqual(profile.verify(input(fixture().replace(HEADING, nested))), INVALID)
    const malformed = '<a href="x" href="y">nav</a>'.repeat(65)
    assert.deepEqual(profile.verify(input(fixture().replace('<main', malformed + '<main'))), INVALID)
  })

  test('item identity, authority pins and representation identity must exactly agree', () => {
    const request = input()
    const itemChanges = [
      { sourceId: 'other' }, { contentItemId: 'other' }, { contentItemVersion: 8 }, { current: false },
      { externalIdNamespace: 'foreign-id' }, { externalContentId: '207821' }, { expectedPublisherIds: [] },
      { expectedPublisherIds: ['other'] }, { expectedPublisherIds: ['auswaertiges-amt', 'auswaertiges-amt'] },
      { expectedAuthorityIds: ['Auswärtiges Amt'] }, { expectedAuthorityIds: ['auswaertiges-amt', 'other'] },
      { contentItemVersion: 0 }, { contentItemVersion: 2_147_483_648 }, { contentItemVersion: NaN }, { sourceId: '__proto__' },
    ]
    for (const delta of itemChanges) assert.deepEqual(profile.verify({ ...request, item: { ...request.item, ...delta } }), MISMATCH)
    const repChanges = [
      { sourceId: 'other' }, { contentItemId: 'other' }, { contentItemVersion: 8 }, { current: false },
      { representationId: '' }, { representationVersion: 0 }, { representationVersion: Infinity },
      { identityProfileId: 'other' }, { identityProfileVersion: 2 }, { requestUrls: [] }, { requestUrls: [URL, URL] },
      { requestUrls: [URL + '?query=1'] }, { expectedFinalUrl: URL + '/' }, { expectedMediaType: 'text/html;charset=UTF-8' },
      { expectedLocale: 'de-DE' }, { expectedLocale: null }, { expectedSchema: null }, { expectedSchema: 'other' },
    ]
    for (const delta of repChanges) assert.deepEqual(profile.verify({ ...request, representation: { ...request.representation, ...delta } }), MISMATCH)
  })

  test('request/final URL aliases and unnormalized media types never inherit this binding', () => {
    for (const finalUrl of [URL + '/', URL + '#section', URL + '?query=1', URL.replace('-207820', '/207820'),
      URL.replace('https:', 'http:'), URL.replace('www.', ''), 'https://example.org/']) {
      assert.deepEqual(profile.verify({ ...input(), finalUrl }), MISMATCH)
    }
    for (const mediaType of ['TEXT/HTML', 'text/html;charset=UTF-8', 'application/json', '']) {
      assert.deepEqual(profile.verify({ ...input(), mediaType }), MISMATCH)
    }
  })

  test('malformed data records, symbol/extra fields, getters and proxies cannot supply authority', () => {
    const request = input()
    for (const value of [null, [], { ...request, originVerified: true }, { ...request, [Symbol('approval')]: true },
      Object.assign(Object.create({ approved: true }), request), new Proxy(request, {})]) {
      assert.deepEqual(profile.verify(value as Input), INVALID)
    }
    const revoked = Proxy.revocable(request, {}); revoked.revoke()
    assert.deepEqual(profile.verify(revoked.proxy), INVALID)
    let calls = 0
    const getterInput = { ...request }
    Object.defineProperty(getterInput, 'responseText', { enumerable: true, get() { calls++; return fixture() } })
    assert.deepEqual(profile.verify(getterInput), INVALID)
    const publishers = [...request.item.expectedPublisherIds]
    Object.defineProperty(publishers, '0', { enumerable: true, get() { calls++; return 'auswaertiges-amt' } })
    assert.deepEqual(profile.verify({ ...request, item: { ...request.item, expectedPublisherIds: publishers } }), MISMATCH)
    assert.equal(calls, 0)
    assert.deepEqual(profile.verify({ ...request, item: { ...request.item, approved: true } } as unknown as Input), INVALID)
    assert.deepEqual(profile.verify({ ...request, representation: { ...request.representation, approved: true } } as unknown as Input), INVALID)
  })
})

test('AA candidate production isolation: no live importer, registration, transport or enablement', () => {
  const root = process.cwd(), stem = 'official-truth-aa-visa-table-identity-candidate'
  const candidatePath = `lib/readiness/${stem}.ts`
  const ownSource = readFileSync(join(root, candidatePath), 'utf8')
  const parsed = ts.createSourceFile(candidatePath, ownSource, ts.ScriptTarget.Latest, true)
  const imports = parsed.statements.filter(ts.isImportDeclaration)
  assert.deepEqual(imports.map(value => [
    (value.moduleSpecifier as ts.StringLiteral).text, value.importClause?.isTypeOnly ?? false,
  ]), [['node:util', false], ['parse5', false], ['./official-truth-content-identity', true]])
  assert.doesNotMatch(ownSource, /\bfetch\s*\(|https\.request|createClient|execute_sql|apply_migration|regelKandidatAkzeptieren\s*\(/)
  // Pin real checkout markers, then scan from root rather than assuming a
  // particular application-directory list covers all runtime importers.
  const rootDirectories = new Set(readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory()).map(entry => entry.name))
  for (const directory of ['app', 'apps', 'components', 'lib', 'scripts', 'tests', 'types']) {
    assert(rootDirectories.has(directory), `full repository source required: ${directory}`)
  }
  for (const file of ['AGENTS.md', 'package.json', 'tsconfig.json', 'lib/readiness/official-truth-content-identity.ts']) {
    assert(existsSync(join(root, file)), `full repository file required: ${file}`)
  }
  const files: string[] = []
  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && ['node_modules', '.git', '.next', '.vercel', 'dist', 'out'].includes(entry.name)) continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) visit(path)
      else if (/\.[cm]?[jt]sx?$/.test(entry.name)) files.push(path)
    }
  }
  visit(root)
  for (const file of files) {
    const path = relative(root, file)
    if (path === candidatePath || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path)) continue
    const source = readFileSync(file, 'utf8')
    if (!source.includes(stem)) continue
    const fileTree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true)
    function check(node: ts.Node): void {
      if (ts.isStringLiteralLike(node) && node.text.includes(stem)) assert.fail(`candidate referenced by production source: ${path}`)
      ts.forEachChild(node, check)
    }
    check(fileTree)
  }
  const registry = readFileSync(join(root, 'lib/readiness/official-truth-content-identity.ts'), 'utf8')
  assert(!registry.includes(profile.identityProfileId))
  assert.equal(profile.current, false)
})
