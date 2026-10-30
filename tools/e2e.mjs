import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (e) => { if (e.type() === 'error') errs.push('CONSOLE ' + e.text()); });

await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 500));

const snap = () => page.evaluate(() => ({
  pressed: [...document.querySelectorAll('.card')].map((c) => c.dataset.variant + ':' + c.getAttribute('aria-pressed')),
  on: [...document.querySelectorAll('.stack .bubble')].filter((b) => b.classList.contains('on')).map((b) => b.dataset.variant),
  cur: document.getElementById('curName').textContent,
  paramsCol: [...document.querySelectorAll('#paramTable thead th')].map((t) => t.textContent.trim() + ':' + t.classList.contains('col-sel')),
  labels: [...new Set([...document.querySelectorAll('.bubble-label')].map((l) => l.textContent))],
  seg: !!document.getElementById('stateSeg'),
  stackW: Math.round(document.querySelector('.stack').getBoundingClientRect().width),
}));

console.log('init  ', JSON.stringify(await snap()));

for (const v of ['D', 'E', 'A']) {
  await page.click(`.card[data-variant="${v}"]`);
  await new Promise((r) => setTimeout(r, 350));
  console.log('click ' + v, JSON.stringify(await snap()));
  await page.screenshot({ path: `D:/AI agent/.motion/sel-${v}.png` });
}

await page.click('#replyBtn');
await new Promise((r) => setTimeout(r, 300));
const mid = await page.evaluate(() => ({
  answered: document.getElementById('chat').classList.contains('answered'),
  stackOpacity: getComputedStyle(document.getElementById('stack')).opacity,
}));
await new Promise((r) => setTimeout(r, 1900));
const end = await page.evaluate(() => ({
  answered: document.getElementById('chat').classList.contains('answered'),
  replyOpacity: getComputedStyle(document.getElementById('reply')).opacity,
}));
console.log('reply mid', JSON.stringify(mid), 'end', JSON.stringify(end));

const perf = await page.evaluate(async () => {
  const t0 = performance.now();
  let n = 0;
  await new Promise((res) => {
    const step = () => { n++; if (performance.now() - t0 > 1000) res(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  return { fps: n };
});
console.log('fps', JSON.stringify(perf));
console.log('errors', errs);
await browser.close();
