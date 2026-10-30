import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 4 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 800));

const geo = await page.evaluate(() => {
  const out = {};
  for (const v of ['A', 'D', 'E']) {
    const st = document.querySelector(`.card[data-variant="${v}"] .strip`);
    const r = st.getBoundingClientRect();
    out[v] = { w: Math.round(r.width), h: Math.round(r.height) };
  }
  const row = document.querySelector('.stack .bubble.on .strip').getBoundingClientRect();
  out.row = { w: Math.round(row.width), h: Math.round(row.height) };
  return out;
});
console.log('geometry', JSON.stringify(geo));

// strip-only crops at 4x, several moments
for (let i = 0; i < 3; i++) {
  const el = await page.$('.card[data-variant="E"] .strip');
  await el.screenshot({ path: `D:/AI agent/.motion/cz-E${i}.png` });
  await new Promise((r) => setTimeout(r, 420));
}
await browser.close();
