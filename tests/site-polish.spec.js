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
    await expect(embedded.locator('header')).toBeVisible();
    await expect(embedded.locator('.legend')).toBeVisible();
    await expect(embedded.locator('.ticker')).toBeVisible();
    // The page is laid out 1,200px wide and scaled to the box, so its edges line up with the
    // inside of the box's 1px border.
    const box = await page.locator('.featured-map').evaluate((el) => ({ width: el.clientWidth, height: el.clientHeight }));
    const shown = await frame.boundingBox();
    expect(Math.abs(shown.width - box.width)).toBeLessThan(1);
    expect(Math.abs(shown.height - box.height)).toBeLessThan(1);
    // The frame is sized after boot, so the map must stay centred in it.
    const mapFrame = page.frames().find((f) => f.url().includes('embed'));
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.waitForTimeout(400);
    const centred = await mapFrame.evaluate(() => {
      const nodes = window.__mapNodes();
      const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      // Positions are canvas-relative; the map centres itself in the canvas area above the
      // event stream, as on the full page.
      const cv = document.getElementById('cv').getBoundingClientRect();
      const h = cv.height - document.querySelector('.ticker').offsetHeight;
      return { dx: Math.abs(cx - cv.width / 2) / cv.width, dy: Math.abs(cy - h / 2) / h };
    });
    expect(centred.dx).toBeLessThan(.08);
    expect(centred.dy).toBeLessThan(.08);
    // The map only draws while it is on screen, so scrolling elsewhere stays smooth.
    const frames = () => mapFrame.evaluate(() => window.__mapFrames || 0);
    await page.locator('.featured').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    expect(await frames()).toBeGreaterThan(5);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(300);
    const parked = await frames();
    await page.waitForTimeout(500);
    expect(await frames()).toBe(parked);
    await page.locator('.featured').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    expect(await frames()).toBeGreaterThan(parked);
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
