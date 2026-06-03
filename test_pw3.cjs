const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://docs.crazygames.com/');
  const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href));
  console.log(hrefs.join('\n'));
  await browser.close();
})().catch(console.error);
