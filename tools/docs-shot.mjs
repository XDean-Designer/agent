import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

fs.mkdirSync('D:/AI agent/docs', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 900));

// 整页预览（2x，供 README 用）
await page.screenshot({ path: 'D:/AI agent/docs/preview.png', fullPage: true });

// 三方案并排条（1x 裁切）
const cards = await page.$$('.card .bubble');
const shot = [];
for (const c of cards) shot.push(await c.screenshot({ encoding: 'base64' }));
await browser.close();

console.log('docs/preview.png', (fs.statSync('D:/AI agent/docs/preview.png').size / 1024).toFixed(0) + ' KB');
