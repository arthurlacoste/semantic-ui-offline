const path = require('node:path');
const { test, expect } = require('@playwright/test');

const root = path.resolve(__dirname, '../..');

test('dropdown and modal work with the supported jQuery version', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  await page.setContent(`
    <main class="ui container">
      <h1 class="ui header">Semantic UI offline smoke test</h1>
      <div class="ui selection dropdown">
        <input type="hidden">
        <i class="dropdown icon"></i>
        <div class="default text">Select</div>
        <div class="menu"><div class="item" data-value="ok">OK</div></div>
      </div>
      <div class="ui modal">
        <div class="header">Smoke test</div>
        <div class="content">Runtime OK</div>
      </div>
    </main>
  `);
  await page.addStyleTag({ path: path.join(root, 'semantic.css') });
  await page.addScriptTag({ path: path.join(root, 'node_modules/jquery/dist/jquery.js') });
  await page.addScriptTag({ path: path.join(root, 'semantic.js') });

  const result = await page.evaluate(() => {
    $('.ui.dropdown').dropdown('set selected', 'ok');
    $('.ui.modal').modal({ detachable: false, duration: 0 }).modal('show');

    return {
      jquery: $.fn.jquery,
      dropdownValue: $('.ui.dropdown input').val(),
      dropdownText: $('.ui.dropdown .text').text()
    };
  });

  expect(result).toEqual({
    jquery: '3.7.1',
    dropdownValue: 'ok',
    dropdownText: 'OK'
  });
  await expect(page.locator('.ui.modal')).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({
    path: process.env.SCREENSHOT_PATH || 'test-results/semantic-ui-smoke.png',
    fullPage: true
  });
});
