// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const page_ = (name) => 'file://' + path.resolve(__dirname, '..', name);

test('the contract panel heading has text before and after a contract is picked', async ({ page }) => {
  await page.goto(page_('graph.html'));
  const heading = page.locator('#pName');
  await expect(heading).toHaveText('Contract details');
  const first = await page.evaluate(() => { select(DATA.nodes[0].id); return DATA.nodes[0].name; });
  await expect(heading).toHaveText(first);
});
