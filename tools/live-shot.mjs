import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--proxy-server=http://127.0.0.1:15236', '--ignore-certificate-errors',
         '--force-color-profile=srgb'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
const bad = [];
page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
page.on('pageerror', (e) => bad.push('ERR ' + e.message));
await page.goto('https://xdean-designer.github.io/agent/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((r) => setTimeout(r, 1400));
await page.screenshot({ path: 'D:/AI agent/out/live-page.png', fullPage: true });
await (await page.$('.card[data-variant="E"]')).screenshot({ path: 'D:/AI agent/out/live-card-E.png' });
console.log('bad', JSON.stringify(bad));
await browser.close();
