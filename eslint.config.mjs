import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * Offizieller Next-16-Flat-Config-Vertrag:
 * Core Web Vitals + TypeScript-Recommended, plus die Default-Ignores.
 *
 * Neu gegenüber Jetnitys bisherigem `.eslintrc.json` (`next/core-web-vitals`):
 * `eslint-plugin-react-hooks` v7 (Compiler-orientierte Regeln) und
 * `typescript-eslint` recommended. Diese neuen Regeln bleiben sichtbar.
 * Sie werden in S2 nicht auf `off` gesetzt. Severity `warn` statt `error`
 * gilt nur dort, wo ein Error-Level eine produktweite Umschreibung
 * erzwingen würde: React-Compiler-Effektmuster (Compiler ist Hard Non-Scope)
 * und `no-explicit-any` (S1 bewahrt bewusst `as any` auf Admin-Users).
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['*.config.js', 'next.config.js', 'tailwind.config.js', 'postcss.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
