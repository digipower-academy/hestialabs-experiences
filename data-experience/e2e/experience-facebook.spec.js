import { test, expect } from './fixtures.js'

test('experience-facebook', async({ page }) => {
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

  await page.getByRole('option', { name: /^facebook$/i }).click()

  await page.getByRole('button', { name: /Select sample data|Selectionner des données de test/i }).click()

  await page.getByRole('option', { name: /^facebook\.zip$/i }).click()

  await page.getByRole('button', { name: /Explore your data|Explorer vos données/i }).click()

  await page.getByText('Mario Kart Tour').click()

  await page.getByText('Au total nous avons trouvé 1804 pubs entre 23 novembre 2019 et 30 octobre 2021').click()

  await page.getByRole('tab', { name: 'Types d\'activités hors Facebook' }).click()

  await page.locator('g > g > path').first().click()

  await page.getByText('Zoom arrière').click()

  await page.getByRole('tab', { name: 'Interactions avec des publicités' }).click()

  await page.getByRole('tab', { name: 'Intérêts supposés' }).click()

  await page.getByRole('tab', { name: 'Liste de contacts' }).click()

  await page.getByRole('tab', { name: 'Publicitaire utilisant vos données' }).click()

  await page.getByRole('row', { name: 'Francis, Tran and Hebert Oui Non Oui' }).getByRole('cell', { name: 'Non' }).click()

  await page.getByRole('tab', { name: 'Chronologie' }).click()

  await page.getByRole('row', { name: 'Facebook-fake-data/apps_and_websites_off_of_facebook/your_off-facebook_activity.json 2021-10-30 21:30:00 Off Facebook Activity V 2 > Events > [Id : 1352425571809883, Type : CUSTOM]' }).getByRole('cell', { name: 'Off Facebook Activity V 2 > Events > [Id : 1352425571809883, Type : CUSTOM]' }).click()

  await page.getByRole('tab', { name: 'Observations de localisation' }).click()

  // Check that there is no error during the test
  expect(messages).toStrictEqual([])
})
