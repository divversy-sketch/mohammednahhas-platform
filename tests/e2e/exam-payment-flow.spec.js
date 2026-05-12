import { test, expect } from '@playwright/test';

const STUDENT_EMAIL = process.env.E2E_STUDENT_EMAIL;
const STUDENT_PASSWORD = process.env.E2E_STUDENT_PASSWORD;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function login(page, email, password) {
  await page.goto('/');
  const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="بريد"], input[placeholder*="email" i]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.locator('button[type="submit"], button:has-text("دخول"), button:has-text("تسجيل")').first().click();
  await expect(page.locator('body')).toBeVisible();
}

test.describe('student exam and payment scenarios', () => {
  test.skip(!STUDENT_EMAIL || !STUDENT_PASSWORD, 'Set E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD to run authenticated student flows.');

  test('student can open exams area without client crash', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.getByText(/امتحان|الامتحانات/).first().click({ timeout: 15000 }).catch(() => page.goto('/student?tab=exams'));
    await expect(page.locator('body')).not.toContainText('ReferenceError');
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });

  test('student can open payment/subscription area without client crash', async ({ page }) => {
    await login(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.getByText(/اشتراك|الدفع|تفعيل/).first().click({ timeout: 15000 }).catch(() => page.goto('/student?tab=subscription'));
    await expect(page.locator('body')).not.toContainText('ReferenceError');
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });
});

test.describe('admin payment scenario', () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run authenticated admin flows.');

  test('admin can open payment requests panel without client crash', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/admin');
    await page.getByText(/طلبات الدفع|الدفع/).first().click({ timeout: 15000 }).catch(() => {});
    await expect(page.locator('body')).not.toContainText('ReferenceError');
    await expect(page.locator('body')).not.toContainText('Cannot read properties');
  });
});
