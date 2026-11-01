import type { NextConfig } from 'next'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const hostRoot = path.dirname(fileURLToPath(import.meta.url))

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
}

export default nextConfig
