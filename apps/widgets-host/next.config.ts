import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import contract from './inert-contract.json'

const hostRoot = path.dirname(fileURLToPath(import.meta.url))
const headers = Object.entries(contract.headers).map(([key, value]) => ({ key, value }))

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  outputFileTracingRoot: hostRoot,
  turbopack: {
    root: hostRoot,
  },
  async redirects() {
    return []
  },
  async headers() {
    return [
      { source: '/:path*', headers },
      { source: '/', headers },
    ]
  },
}

export default nextConfig
