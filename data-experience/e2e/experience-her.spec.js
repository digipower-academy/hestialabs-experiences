import { test, expect } from './fixtures.js'

test('experience-her', async({ page }) => {
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

  await page.getByRole('option', { name: 'her' }).getByText('her').click()

  await page.getByRole('button', { name: /Select sample data|Selectionner des données de test/i }).click()

  await page.getByText('her.zip').click()

  await page.getByRole('button', { name: /Explore your data|Explorer vos données/i }).click()

  await page.getByRole('tab', { name: 'Likes and Passes' }).click()

  await page.getByRole('tab', { name: 'Notifications' }).click()

  await page.getByRole('tab', { name: 'Matches' }).click()

  await page.locator('#hour-chart > svg > g > .brush > .overlay').click()

  await page.getByText('dim').click()

  await page.getByText('TRUE (43.92%)').click()

  await page.getByText('Reset All').click()

  await page.getByRole('tab', { name: 'Messages' }).click()

  await page.getByText('In total you exchanged 900 messages with 391 users.').click()

  await page.locator('.calendars > g > g:nth-child(94) > rect').first().click()

  await page.getByRole('tab', { name: 'Blocks' }).click()

  await page.getByRole('cell', { name: 'Kristy Wolfe' }).click()

  await page.getByRole('tab', { name: 'Reported' }).click()

  await page.getByRole('cell', { name: '2020-05-20 17:36:46' }).click()

  // Check that there is no error during the test
  expect(messages).toStrictEqual([])
})
