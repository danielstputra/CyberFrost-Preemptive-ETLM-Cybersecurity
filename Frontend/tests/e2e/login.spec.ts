/**
 * Login Page — E2E Smoke Test
 * =============================
 * Verifies login page renders and accepts input.
 *
 * Run: pnpm exec playwright test
 * View report: pnpm exec playwright show-report
 */

import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    // Wait for boot animation to finish
    await page.waitForSelector('text=CyberFrost', { timeout: 5000 });

    // Should see email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Should see password input
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Should see authenticate button
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(2000); // Wait for animations

    // Submit empty form
    await page.locator('button[type="submit"]').click();

    // Should show Zod validation error
    await expect(page.locator('text=Email is required')).toBeVisible({ timeout: 3000 });
  });
});
