import { test, expect } from './fixtures.js'

test('experience-tracker-control', async({ page }) => {
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

  await page.getByLabel('Experience').click()

  await page.getByRole('option', { name: 'tracker-control' }).getByText('tracker-control').click()

  await page.getByText('Install and enable TrackerControl to monitor the behaviour of the apps on your A').click()

  await page.getByRole('button', { name: /Select sample data|Selectionner des données de test/i }).click()

  await page.getByText('tracker-control.csv').click()

  await page.getByRole('button', { name: /Explore your data|Explorer vos données/i }).click()

  await page.locator('text:has-text("Google")').click()

  await page.locator('.pie-slice-group > g:nth-child(2) > path').click()

  await page.locator('text:has-text("Facebook")').click()

  await page.locator('#category-chart').getByText(/reset|réinitialiser/i).click()

  await page.getByText(/Reset All|Réinitialiser tout/i).click()

  const firstDataCell = page.locator('tbody td').first()
  await expect(firstDataCell).toBeVisible()
  await firstDataCell.click()

  // Check that there is no error during the test
  expect(messages).toStrictEqual([])
})
