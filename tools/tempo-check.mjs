import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 700));

const info = await page.evaluate(() => {
  const beatsOf = (s) => (s && s._beatPx ? +(s._w / s._beatPx).toFixed(2) : null);
  const hzOf = (v, s) => {
    const loop = { A: 3.4, D: 3.0, E: 1.8 }[v];
    return { loop, beats: beatsOf(s), hz: s && s._beatPx ? +(beatsOf(s) / loop).toFixed(2) : null };
  };
  return {
    cardE: hzOf('E', document.querySelector('.card[data-variant="E"] .strip')),
    rowE: hzOf('E', document.querySelector('#stack .bubble.on .strip')),
    // 三点轮播转速：A 的 reps=4，3.4s → 1.18 轮/s
    aDots: document.querySelectorAll('.card[data-variant="A"] .dots i').length,
  };
});
console.log(JSON.stringify(info));
await browser.close();
