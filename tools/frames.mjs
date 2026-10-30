import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split('=')));
const variant = args.variant || 'E';
const w = +(args.w || 560);
const pad = +(args.pad || 36);
const fps = +(args.fps || 60);

const dir = `D:/AI agent/.motion/frames/${variant}`;
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb', '--disable-lcd-text'],
  defaultViewport: { width: w + pad * 2, height: 120 + pad * 2, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto(`file:///D:/AI%20agent/index.html?record=${variant}&w=${w}&bot=76&sh=34`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 20000 });

const T = await page.evaluate(() => window.__T);
const total = Math.round(T * fps);

for (let i = 0; i < total; i++) {
  const t = i / fps;
  await page.evaluate((tt) => window.__seek(tt), t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.png`), optimizeForSpeed: true });
  if (i % 40 === 0) process.stdout.write(`\r${variant} ${i}/${total}`);
}
process.stdout.write(`\r${variant} ${total}/${total} done\n`);
console.log(JSON.stringify({ variant, T, total, fps, dir }));
await browser.close();
