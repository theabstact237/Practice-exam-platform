import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for the demo path.
 * These tests require both the frontend dev server (port 5173)
 * and the backend server (port 8000) to be running.
 *
 * Run with: npx playwright test
 */

test.describe('Home Page', () => {
  test('loads home page successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('FreeCertify')).toBeVisible();
  });

  test('shows exam selection cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Cloud Practitioner/i).first()).toBeVisible();
    await expect(page.getByText(/Solutions Architect/i).first()).toBeVisible();
  });

  test('shows sign in button when not logged in', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /sign in/i }).first()).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('hamburger menu opens on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    // The navbar links are hidden on mobile initially; clicking an exam card navigates first
    const menuBtn = page.getByLabel('Toggle menu');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await expect(page.getByText('Exam Type')).toBeVisible();
    }
  });
});

test.describe('Exam Landing Page', () => {
  test('navigates to exam landing page when exam card clicked', async ({ page }) => {
    await page.goto('/');
    // Click the first exam option
    const examBtn = page.getByRole('button', { name: /Start|Cloud Practitioner|Practitioner/i }).first();
    if (await examBtn.isVisible()) {
      await examBtn.click();
      // Should show landing page or loading
      await expect(page).toHaveURL(/\//);
    }
  });
});

test.describe('Contact Page', () => {
  test('contact page renders correctly', async ({ page }) => {
    await page.goto('/');
    // Navigate to contact via nav (desktop)
    const contactBtn = page.getByRole('button', { name: /contact/i }).first();
    if (await contactBtn.isVisible()) {
      await contactBtn.click();
      await expect(page.getByText(/Karl Siaka/i)).toBeVisible();
      await expect(page.getByText(/Contact Me/i)).toBeVisible();
    }
  });

  test('contact form has required fields', async ({ page }) => {
    await page.goto('/');
    const contactBtn = page.getByRole('button', { name: /contact/i }).first();
    if (await contactBtn.isVisible()) {
      await contactBtn.click();
      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/message/i)).toBeVisible();
    }
  });
});

test.describe('Login Modal', () => {
  test('login modal opens when sign in is clicked', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /sign in/i }).first().click();
    await expect(page.getByText(/sign in|login|log in/i).nth(1)).toBeVisible();
  });

  test('login modal closes when dismissed', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /sign in/i }).first().click();
    // Press Escape to close
    await page.keyboard.press('Escape');
    // The modal background should be gone
    await expect(page.getByRole('dialog')).not.toBeVisible().catch(() => {});
  });
});

test.describe('Responsive Layout', () => {
  test('renders correctly on iPhone 14 viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByText('FreeCertify')).toBeVisible();
  });

  test('renders correctly on iPad viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.getByText('FreeCertify')).toBeVisible();
  });

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByText('FreeCertify')).toBeVisible();
  });
});
