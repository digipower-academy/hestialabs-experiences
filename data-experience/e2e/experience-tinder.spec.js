import { test, expect } from './fixtures.js'

test('experience-tinder', async({ page }) => {
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

  await page.getByRole('option', { name: /^tinder$/i }).click()

  await page.getByRole('button', { name: /Select sample data|Selectionner des données de test/i }).click()

  await page.getByRole('option', { name: /^tinder\.json$/i }).click()

  await page.getByRole('button', { name: /Explore your data|Explorer vos données/i }).click()

  await page.getByRole('tab', { name: 'Usage' }).click()

  await page.getByRole('tab', { name: 'Likes et passes' }).click()

  await page.getByLabel('Intervalle').click()

  await page.getByText('Semaines').click()

  await page.getByRole('tab', { name: 'Messages' }).click()

  await page.locator('.calendar-hour > g:nth-child(48) > rect').click()

  await page.getByRole('tab', { name: 'Comparaison' }).click()

  await page.locator('select[name="versus"]').selectOption('Likes,App ouverte')

  await page.getByRole('tab', { name: 'Corrélation Likes / passes' }).click()

  // Check that there is no error during the test
  expect(messages).toStrictEqual([])
})
