import { test, expect } from './fixtures.js'

test('localhost app renders and basic UI interaction works', async({ page }) => {
  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('#app')).toBeVisible()
  await expect(page.locator('.v-select__experiences')).toBeVisible()
  await expect(page.locator('.v-select__bubbles')).toBeVisible()

  await page.locator('.v-select__experiences').click()
  await expect(page.locator('.v-menu__content .v-list-item').first()).toBeVisible()
  await page.keyboard.press('Escape')
})
