// Browser checks for the static site. Pages are opened straight from disk, so there is
// nothing to build or serve first: `npm test` is enough.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 20000,
  use: { browserName: 'chromium' },
});
