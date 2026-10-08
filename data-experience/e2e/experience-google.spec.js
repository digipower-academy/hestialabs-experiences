import { test, expect } from './fixtures.js'

test('experience-google', async({ page }) => {
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

  await page.getByRole('option', { name: 'google' }).getByText('google').click()

  await page.getByRole('button', { name: /Select sample data|Selectionner des données de test/i }).click()

  await page.getByRole('option', { name: 'google-takeout.zip' }).locator('div:has-text("google-takeout.zip")').first().click()

  await page.getByRole('button', { name: /Explore your data|Explorer vos données/i }).click()

  await page.getByText('Nous avons trouvé 54 endroits visités dans votre/vos fichier(s).').click()

  await page.getByRole('tab', { name: 'Un endroit particulier' }).click()

  await page.getByText('Temps total passé à Rue du Petit-Saint-Jean 5: 513h29m22s. Temps moyen passé à R').click()

  await page.getByRole('button', { name: 'Endroit Rue du Petit-Saint-Jean 5' }).click()

  await page.getByRole('tab', { name: 'Autres candidats' }).click()

  await page.getByRole('tab', { name: 'Trajets' }).click()

  await page.getByRole('tab', { name: 'Historique' }).click()

  await page.getByRole('tab', { name: 'Wifi' }).click()

  // Check that there is no error during the test
  expect(messages).toStrictEqual([])
})
