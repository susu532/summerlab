const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://docs.crazygames.com/sdk/game/');
  const textGame = await page.evaluate(() => document.body.innerText);
  console.log(textGame.substring(7000, 15000));
  
  await browser.close();
})().catch(console.error);
