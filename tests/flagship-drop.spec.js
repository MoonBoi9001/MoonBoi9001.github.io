// The flagship card on the home page drops in from above and cracks the ground when it
// scrolls into view, but only on a wide screen driven by a mouse. These checks pin down
// both halves: the animation runs and cleans up after itself where it should, and it never
// arms on phones or for people who asked the browser for reduced motion.
const { test, expect, devices } = require('@playwright/test');
const path = require('path');

const page_url = 'file://' + path.resolve(__dirname, '..', 'index.html');
const desktop = { viewport: { width: 1440, height: 900 } };

async function scrollFlagshipIntoView(page) {
  await page.evaluate(() => {
    document.querySelector('.card-flagship').scrollIntoView({ block: 'center' });
  });
}

test.describe('wide screen with a mouse', () => {
  test.use(desktop);

  test('drops in, cracks the ground, then settles back to a plain card', async ({ page }) => {
    await page.goto(page_url);
    const card = page.locator('.card-flagship');
    const slot = page.locator('.flagship-slot');
    const wrap = page.locator('.wrap');
    const shatter = page.locator('.shatter');

    await expect(card).toHaveClass(/drop-armed/);
    await scrollFlagshipIntoView(page);
    await expect(card).toHaveClass(/dropping/);
    await expect(slot).toHaveClass(/cracked/);
    await expect(wrap).toHaveClass(/quake/);
    await expect(shatter).toHaveClass(/on/);

    // Once landed, every temporary class is gone and the card sits flat in its slot, so
    // the ordinary hover lift can take over again.
    await expect(card).not.toHaveClass(/dropping|drop-armed/, { timeout: 5000 });
    await expect(wrap).not.toHaveClass(/quake/);
    await expect(shatter).not.toHaveClass(/on/, { timeout: 5000 });
    await expect(slot).not.toHaveClass(/cracked/, { timeout: 5000 });
    const settled = await card.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { transform: cs.transform, opacity: cs.opacity, border: cs.borderTopWidth };
    });
    expect(settled).toEqual({ transform: 'none', opacity: '1', border: '3px' });

    const [cardBox, slotBox] = await Promise.all([card.boundingBox(), slot.boundingBox()]);
    expect(cardBox).toEqual(slotBox);
  });

  test('never arms when the browser asks for reduced motion', async ({ browser }) => {
    const ctx = await browser.newContext({ ...desktop, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(page_url);
    await scrollFlagshipIntoView(page);
    await page.waitForTimeout(600);
    const card = page.locator('.card-flagship');
    await expect(card).not.toHaveClass(/drop-armed|dropping/);
    await expect(card).toHaveCSS('opacity', '1');
    await ctx.close();
  });
});

test.describe('phone', () => {
  const { defaultBrowserType, ...phone } = devices['iPhone 13'];
  test.use(phone);

  test('shows the card straight away with no animation', async ({ page }) => {
    await page.goto(page_url);
    await scrollFlagshipIntoView(page);
    await page.waitForTimeout(600);
    const card = page.locator('.card-flagship');
    await expect(card).not.toHaveClass(/drop-armed|dropping/);
    await expect(card).toHaveCSS('opacity', '1');
    await expect(page.locator('.flagship-slot')).not.toHaveClass(/cracked/);
    await expect(page.locator('.shatter')).toHaveCSS('opacity', '0');
  });
});
