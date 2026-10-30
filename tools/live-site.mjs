import puppeteer from 'puppeteer-core';

const URL = 'https://xdean-designer.github.io/agent/';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--proxy-server=http://127.0.0.1:15236', '--ignore-certificate-errors',
         '--force-color-profile=srgb'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (e) => { if (e.type() === 'error') errs.push('CONSOLE ' + e.text()); });
page.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url() + ' ' + r.failure()?.errorText));

const resp = await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
console.log('http', resp.status());
await new Promise((r) => setTimeout(r, 1200));

const info = await page.evaluate(() => ({
  title: document.title,
  cards: [...document.querySelectorAll('.card')].map((c) => c.dataset.variant),
  cur: document.getElementById('curName').textContent,
  onRow: [...document.querySelectorAll('.stack .bubble.on')].map((b) => b.dataset.variant),
  seg: !!document.getElementById('stateSeg'),
  labels: document.querySelectorAll('.bubble-label').length,
  robotLoaded: [...document.images].every((i) => i.complete && i.naturalWidth > 0),
  dotCx: document.querySelector('.card[data-variant="E"] .dot')?.getAttribute('cx'),
  beats: (() => { const s = document.querySelector('.card[data-variant="E"] .strip'); return s && s._beatPx ? +(s._w / s._beatPx).toFixed(2) : null; })(),
}));
console.log('info', JSON.stringify(info));

// 切卡
await page.click('.card[data-variant="A"]');
await new Promise((r) => setTimeout(r, 400));
console.log('click A ->', await page.evaluate(() => document.getElementById('curName').textContent));
await page.click('.card[data-variant="E"]');
await new Promise((r) => setTimeout(r, 400));

await page.screenshot({ path: 'D:/AI agent/docs/preview.png', fullPage: true });
console.log('errors', errs);

const perf = await page.evaluate(async () => {
  const t0 = performance.now(); let n = 0;
  await new Promise((res) => { const step = () => { n++; performance.now() - t0 > 1000 ? res() : requestAnimationFrame(step); }; requestAnimationFrame(step); });
  return n;
});
console.log('fps', perf);
await browser.close();
