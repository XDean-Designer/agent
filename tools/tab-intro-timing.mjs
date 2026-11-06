import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files'],
  defaultViewport: { width: 420, height: 860, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto('file:///D:/AI%20agent/tab-intro.html', { waitUntil: 'load' });

const t0 = Date.now();
await page.waitForFunction(() => document.getElementById('stage').classList.contains('is-playing'), { timeout: 5000 });
const tOpen = Date.now() - t0;
await page.waitForFunction(() => !document.getElementById('stage').classList.contains('is-playing'), { timeout: 10000 });
const tClose = Date.now() - t0;
console.log(JSON.stringify({ tOpen_ms: tOpen, tClose_ms: tClose, playSpan_ms: tClose - tOpen }));
await browser.close();
