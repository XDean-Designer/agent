import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 1440, height: 1100, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 700));

const layout = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.card')].map((c) => {
    const r = c.getBoundingClientRect();
    return { v: c.dataset.variant, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
  });
  const cols = getComputedStyle(document.querySelector('.cards')).gridTemplateColumns.split(' ').length;
  return { cols, cards };
});
console.log('layout', JSON.stringify(layout));

await page.click('.card[data-variant="B"]');
await new Promise((r) => setTimeout(r, 400));
await (await page.$('.card[data-variant="B"]')).screenshot({ path: 'D:/AI agent/.motion/card-B.png' });
await (await page.$('.demo')).screenshot({ path: 'D:/AI agent/.motion/demo-B.png' });
await page.screenshot({ path: 'D:/AI agent/out/page.png', fullPage: true });
await browser.close();
