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
    // The frame is sized after boot, so the map must stay centred in it.
    const mapFrame = page.frames().find((f) => f.url().includes('embed'));
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForTimeout(400);
    const centred = await mapFrame.evaluate(() => {
      const nodes = window.__mapNodes();
      const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      return { dx: Math.abs(cx - innerWidth / 2) / innerWidth, dy: Math.abs(cy - innerHeight / 2) / innerHeight };
    });
    expect(centred.dx).toBeLessThan(.08);
    expect(centred.dy).toBeLessThan(.08);
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
