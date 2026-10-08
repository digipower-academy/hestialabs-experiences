import { test, expect } from '@playwright/test'

test('simple smoke test runs and validates', async({ page }) => {
  await page.goto('data:text/html,<html><head><title>Simple Playwright Smoke</title></head><body><h1 id="status">ok</h1></body></html>')

  await expect(page).toHaveTitle('Simple Playwright Smoke')
  await expect(page.locator('#status')).toHaveText('ok')
})
