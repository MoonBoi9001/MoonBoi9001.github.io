// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const page_ = (name) => 'file://' + path.resolve(__dirname, '..', name);

test('the network diagram is announced as a figure with its description', async ({ page }) => {
  await page.goto(page_('network-edge.html'));
  await expect(page.getByRole('figure', { name: /^Network diagram: internet to modem to firewall/ })).toHaveCount(1);
});

test('the contract panel heading has text before and after a contract is picked', async ({ page }) => {
  await page.goto(page_('graph.html'));
  const heading = page.locator('#pName');
  await expect(heading).toHaveText('Contract details');
  const first = await page.evaluate(() => { select(DATA.nodes[0].id); return DATA.nodes[0].name; });
  await expect(heading).toHaveText(first);
});
