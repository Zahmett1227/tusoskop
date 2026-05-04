import { test, expect } from '@playwright/test'

test('ana sayfa yüklenir ve başlık Tusoskop içerir', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Tusoskop/i)
  await expect(page.locator('#root')).toBeVisible()
})
