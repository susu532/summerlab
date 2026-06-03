const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://docs.crazygames.com/sdk/game/');
  const textGame = await page.evaluate(() => document.body.innerText);
  console.log("GAME MODULE:");
  console.log(textGame.substring(0, 5000));
  
  await page.goto('https://docs.crazygames.com/requirements/multiplayer/');
  const textMulti = await page.evaluate(() => document.body.innerText);
  console.log("MULTIPLAYER REQS:");
  console.log(textMulti.substring(0, 5000));
  
  await browser.close();
})().catch(console.error);
