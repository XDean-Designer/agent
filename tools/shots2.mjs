import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 3 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (e) => { if (e.type() === 'error') console.log('CONSOLE', e.text()); });
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 600));

// freeze at a representative moment by seeking via record mode instead
await browser.close();

const b2 = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 960, height: 260, deviceScaleFactor: 3 },
});
const p2 = await b2.newPage();
for (const v of ['A', 'D', 'E', 'B']) {
  await p2.goto(`file:///D:/AI%20agent/index.html?record=${v}&w=560&bot=76&sh=34`, { waitUntil: 'load' });
  await p2.waitForFunction('window.__ready === true', { timeout: 20000 });
  const T = await p2.evaluate(() => window.__T);
  for (const [i, frac] of [0.08, 0.3, 0.55, 0.78].entries()) {
    await p2.evaluate((t) => window.__seek(t), T * frac);
    await p2.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const el = await p2.$('#recordStage .bubble');
    await el.screenshot({ path: `D:/AI agent/.motion/n-${v}${i}.png` });
  }
  console.log(v, 'T', T);
}
await b2.close();
