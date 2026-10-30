import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 3 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 800));

await (await page.$('header')).screenshot({ path: 'D:/AI agent/.motion/v2-hdr.png' });
await (await page.$('.demo')).screenshot({ path: 'D:/AI agent/.motion/v2-demo.png' });
await (await page.$('.card[data-variant="E"]')).screenshot({ path: 'D:/AI agent/.motion/v2-card-E.png' });
await (await page.$('#stack .bubble.on')).screenshot({ path: 'D:/AI agent/.motion/v2-row.png' });

// sanity: no leftover label nodes, no seg; beat count in card + row
const info = await page.evaluate(() => {
  const count = (sel) => document.querySelectorAll(sel).length;
  const st = (sel) => {
    const s = document.querySelector(sel);
    return s ? { w: Math.round(s.getBoundingClientRect().width), beats: s._beatPx ? +(s._w / s._beatPx).toFixed(2) : null } : null;
  };
  return {
    labels: count('.bubble-label'),
    seg: count('#stateSeg'),
    cardStrip: st('.card[data-variant="A"] .strip'),
    rowStrip: st('#stack .bubble.on .strip'),
    dotsInA: count('.card[data-variant="A"] .dots i'),
  };
});
console.log('info', JSON.stringify(info));
await browser.close();
