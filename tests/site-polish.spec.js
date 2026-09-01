// @ts-check
const { test, expect, devices } = require('@playwright/test');
const path = require('path');

const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
const { defaultBrowserType, ...phone } = devices['iPhone 13'];

test.describe('wide screen with a mouse', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('cards below the fold still raise on hover after they have scrolled into view', async ({ page }) => {
    await page.goto(url);
    const cards = page.locator('.work-grid .card:not(.card-flagship)');
    const last = cards.last();
    await last.scrollIntoViewIfNeeded();
    // Wait for the scroll-in reveal to finish and hand control back to the hover rule.
    await expect(last).not.toHaveClass(/reveal/, { timeout: 5000 });
    const before = await last.evaluate((el) => getComputedStyle(el).transform);
    expect(before).toBe('none');
    await last.hover();
    await expect
      .poll(() => last.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).f))
      .toBeCloseTo(-3, 0);
  });

  test('shows the live contract map instead of the picture', async ({ page }) => {
    await page.goto(url);
    const frame = page.locator('.featured-map iframe');
    await expect(frame).toHaveAttribute('src', 'graph.html?embed');
    await expect(frame).toHaveClass(/ready/, { timeout: 10000 });
    const embedded = page.frameLocator('.featured-map iframe');
    await expect(embedded.locator('canvas#cv')).toBeVisible();
    await expect(embedded.locator('header')).toBeHidden();
    await expect(embedded.locator('.ticker')).toBeHidden();
  });
});

test.describe('phone', () => {
  test.use(phone);

  test('keeps the still picture of the map', async ({ page }) => {
    await page.goto(url);
    const picture = page.locator('.featured-map img');
    await picture.scrollIntoViewIfNeeded();
    await expect(picture).toBeVisible();
    await expect(page.locator('.featured-map iframe')).toHaveCount(0);
  });
});
