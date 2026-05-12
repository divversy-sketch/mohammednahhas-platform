import { test, expect } from '@playwright/test';

test('public app loads without raw skeleton', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('هذا الحساب ليس له صلاحية دخول لوحة الإدارة');
  const hasStyledElement = await page.locator('[class*="rounded"], [class*="bg-"], [class*="shadow"]').first().count();
  expect(hasStyledElement).toBeGreaterThan(0);
});

test('admin route renders access flow instead of crashing', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Cannot read properties');
  await expect(page.locator('body')).not.toContainText('ReferenceError');
});
