import { test, expect } from './fixtures.js'

test('experience-uber-driver', async({ page }) => {
  test.setTimeout(180000)

  const messages = []
  const ignoredConsoleErrorPatterns = [
    'Missing required prop: "viewBlockTranslationPrefix"'
  ]
  page.on('console', (msg) => {
    // Ignore regular log messages; we are only interested in errors.
    if (msg.type() === 'error') {
      const messageText = msg.text()
      const shouldIgnore = ignoredConsoleErrorPatterns.some(pattern => messageText.includes(pattern))
      if (!shouldIgnore) {
        messages.push(`[${msg.type()}] ${messageText}`)
      }
    }
  })
  // Uncaught (in promise) TypeError + friends are page errors.
  page.on('pageerror', (error) => {
    messages.push(`[${error.name}] ${error.message}`)
  })

  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' })

  await page.getByRole('button', { name: /Experience|Expérience/i }).first().click()

  await page.getByRole('option', { name: /^uber-driver$/i }).click()

  await expect(page.locator('#app')).toBeVisible()

  // Check that there is no error during the test
  expect(messages).toStrictEqual([])
})
