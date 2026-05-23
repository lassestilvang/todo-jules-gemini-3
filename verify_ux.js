const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to the local app
  await page.goto('http://localhost:3000/');

  // Wait for the page to load
  await page.waitForTimeout(2000);

  // Click on "Create Label" in the sidebar
  await page.getByText('Create Label').click();

  // Wait for dialog to open
  await page.waitForTimeout(1000);

  // Take screenshot
  await page.screenshot({ path: 'dialog.png' });

  await browser.close();
})();
