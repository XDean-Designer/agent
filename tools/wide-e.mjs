import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 700, height: 900, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 700));
const el = await page.$('.card[data-variant="E"] .strip');
await el.screenshot({ path: 'D:/AI agent/.motion/wide-E.png' });
await browser.close();
