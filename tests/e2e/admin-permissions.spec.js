import { test, expect } from '@playwright/test';

test('admin access page handles unauthorized state cleanly', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('FirebaseError: Missing or insufficient permissions');
  await expect(page.locator('body')).not.toContainText('Unhandled Runtime Error');
});
