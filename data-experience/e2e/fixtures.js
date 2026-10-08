import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { test as base, expect } from '@playwright/test'

const require = createRequire(import.meta.url)

// The app loads these assets from public CDNs at runtime.
// Serve the same files from node_modules so the e2e tests don't depend on network access.
const cdnAssets = [
  {
    url: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/sql\.js\/[^/]+\/sql-wasm\.wasm$/,
    path: () => require.resolve('sql.js/dist/sql-wasm.wasm'),
    contentType: 'application/wasm'
  },
  {
    url: /^https:\/\/cdn\.jsdelivr\.net\/npm\/d3-time-format@4\/locale\/([\w-]+)\.json$/,
    path: ([, iso]) => require.resolve(`d3-time-format/locale/${iso}`),
    contentType: 'application/json'
  }
]

// Third-party resources the tests don't check (icon font, embedded tutorial videos): answer with an empty body.
const stubbedUrls = [
  { url: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@mdi\/font@[^/]+\/css\//, contentType: 'text/css' },
  { url: /^https:\/\/player\.vimeo\.com\//, contentType: 'text/html' }
]

export const test = base.extend({
  page: async({ page }, use) => {
    for (const { url, path, contentType } of cdnAssets) {
      await page.route(url, route => route.fulfill({
        body: readFileSync(path(route.request().url().match(url))),
        contentType,
        headers: { 'access-control-allow-origin': '*' }
      }))
    }
    for (const { url, contentType } of stubbedUrls) {
      await page.route(url, route => route.fulfill({ body: '', contentType }))
    }
    await use(page)
  }
})

export { expect }
