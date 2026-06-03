const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://docs.crazygames.com/sdk/html5/modules/game/');
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 5000));
  await browser.close();
})().catch(console.error);
