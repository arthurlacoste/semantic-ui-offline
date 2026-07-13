const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test/browser',
  outputDir: './test-results',
  use: {
    browserName: 'chromium',
    headless: true
  }
});
