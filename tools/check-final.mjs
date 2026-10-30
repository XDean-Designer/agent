import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 500));

const contrast = await page.evaluate(() => {
  const lum = (c) => {
    const [r, g, b] = c.match(/\d+/g).map(Number).map((v) => v / 255);
    const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const out = {};
  const bgc = getComputedStyle(document.body).backgroundColor;
  for (const sel of ['.brand', '.bar-sub', '.name', '.card-foot', '.bubble-label', '.msg .bubble', '.params td', '.params tbody th', '.demo-head h2']) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const l1 = lum(getComputedStyle(el).color), l2 = lum(bgc);
    out[sel] = +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05))).toFixed(2);
  }
  return out;
});
console.log('contrast', JSON.stringify(contrast));

// mobile
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await new Promise((r) => setTimeout(r, 500));
const mob = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  cards: [...document.querySelectorAll('.card')].map((c) => Math.round(c.getBoundingClientRect().width)),
  overflow: [...document.querySelectorAll('.bubble,.params,.chat')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.className),
}));
console.log('mobile', JSON.stringify(mob));
await page.screenshot({ path: 'D:/AI agent/.motion/mobile.png', fullPage: true });

// reduced motion
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.reload({ waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 400));
const rm = await page.evaluate(() => ({
  btn: document.getElementById('motionBtn').textContent,
  head: document.querySelector('.card .head').style.transform,
}));
console.log('reduced', JSON.stringify(rm));
await browser.close();
