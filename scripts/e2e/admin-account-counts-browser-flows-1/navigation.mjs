#!/usr/bin/env node
// Carry the actual Playwright goto/reload Response. Do not invent Page fields.

import { parseAbsoluteHttpUrl, sameExactOrigin } from './contract.mjs'

function responseStatus(response) {
  if (response == null) return null
  const status = typeof response.status === 'function' ? response.status() : response.status
  return typeof status === 'number' ? status : null
}

function responseUrl(response) {
  if (response == null) return ''
  const url = typeof response.url === 'function' ? response.url() : response.url
  return typeof url === 'string' ? url : ''
}

function exactPath(url) {
  const parsed = parseAbsoluteHttpUrl(url)
  if (!parsed) return ''
  return parsed.pathname.replace(/\/+$/, '') || '/'
}

export function inspectNavigationResponse(response, { expectedOrigin, pageUrl } = {}) {
  if (response == null) return { ok: false, reason: 'missing-navigation', status: null, url: '' }
  const status = responseStatus(response)
  if (status == null) return { ok: false, reason: 'missing-navigation', status: null, url: '' }
  const url = responseUrl(response)
  if (status >= 400) {
    return { ok: false, reason: `navigation-${status}`, status, url }
  }
  if (expectedOrigin && url && !sameExactOrigin(url, expectedOrigin)) {
    return { ok: false, reason: 'foreign-origin', status, url }
  }
  if (pageUrl && url) {
    const pagePath = exactPath(pageUrl)
    const responsePath = exactPath(url)
    if (pagePath && responsePath && pagePath !== responsePath) {
      return { ok: false, reason: 'stale-navigation', status, url }
    }
    if (expectedOrigin && parseAbsoluteHttpUrl(pageUrl) && !sameExactOrigin(pageUrl, expectedOrigin)) {
      return { ok: false, reason: 'foreign-origin', status, url }
    }
  }
  return { ok: true, status, url }
}

export function requireReadyNavigation(response, options = {}) {
  const navigation = inspectNavigationResponse(response, options)
  if (!navigation.ok) {
    throw new Error(`navigation was not a ready application response (${navigation.reason})`)
  }
  return navigation
}

export async function navigateDocument(page, url, {
  waitUntil = 'domcontentloaded',
  timeout,
  expectedOrigin,
  requireReady = true,
} = {}) {
  if (!page || typeof page.goto !== 'function') {
    throw new Error('page.goto is required')
  }
  const response = await page.goto(url, { waitUntil, timeout })
  const pageUrl = typeof page.url === 'function' ? page.url() : undefined
  const navigation = inspectNavigationResponse(response, { expectedOrigin, pageUrl })
  if (requireReady && !navigation.ok) {
    throw new Error(`navigation was not a ready application response (${navigation.reason})`)
  }
  return { response, navigation }
}

export async function reloadDocument(page, {
  waitUntil = 'networkidle',
  timeout,
  fallbackUrl,
  expectedOrigin,
  requireReady = true,
} = {}) {
  let response
  if (typeof page.reload === 'function') {
    response = await page.reload({ waitUntil, timeout })
  } else if (fallbackUrl) {
    return navigateDocument(page, fallbackUrl, { waitUntil, timeout, expectedOrigin, requireReady })
  } else {
    throw new Error('page.reload is required when no fallback URL is provided')
  }
  const pageUrl = typeof page.url === 'function' ? page.url() : undefined
  const navigation = inspectNavigationResponse(response, { expectedOrigin, pageUrl })
  if (requireReady && !navigation.ok) {
    throw new Error(`navigation was not a ready application response (${navigation.reason})`)
  }
  return { response, navigation }
}
