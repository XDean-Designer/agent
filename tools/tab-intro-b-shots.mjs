import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const outDir = 'D:/AI agent/.motion/tab-intro-b';
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync('D:/AI agent/out', { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 440, height: 920, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));

await page.goto('file:///D:/AI%20agent/tab-intro-b.html', { waitUntil: 'load', timeout: 60000 });

// Before autoplay starts — first frame must be fully offscreen
await page.waitForFunction(() => typeof window.__orbFullyOffscreen === 'function', { timeout: 5000 });
const start = await page.evaluate(() => ({
  phase: window.__introPhase || document.getElementById('orb').dataset.phase,
  off: window.__orbFullyOffscreen(),
  orbTop: Math.round(document.getElementById('orb').getBoundingClientRect().top),
  stageBottom: Math.round(document.getElementById('stage').getBoundingClientRect().bottom),
}));
console.log('start', JSON.stringify(start));
await page.screenshot({ path: path.join(outDir, 'b-start.png') });

await page.waitForFunction(
  () => window.__introPhase === 'rest' || document.getElementById('orb').dataset.phase === 'rest',
  { timeout: 8000 },
);
await new Promise((r) => setTimeout(r, 200));
const rest = await page.evaluate(() => {
  const o = document.getElementById('orb').getBoundingClientRect();
  const s = document.getElementById('stage').getBoundingClientRect();
  return {
    phase: window.__introPhase,
    orb: Math.round(o.width),
    visible: o.bottom > s.top && o.top < s.bottom,
    off: window.__orbFullyOffscreen(),
  };
});
console.log('rest', JSON.stringify(rest));
await page.screenshot({ path: path.join(outDir, 'b-rest.png') });

await page.waitForFunction(() => window.__introPhase === 'exiting', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 120));
const exiting = await page.evaluate(() => ({
  phase: window.__introPhase,
  off: window.__orbFullyOffscreen(),
}));
console.log('exiting', JSON.stringify(exiting));
await page.screenshot({ path: path.join(outDir, 'b-exiting.png') });

await page.waitForFunction(() => window.__introPhase === 'hidden-end', { timeout: 5000 });
const end = await page.evaluate(() => ({
  phase: window.__introPhase,
  off: window.__orbFullyOffscreen(),
  orbTop: Math.round(document.getElementById('orb').getBoundingClientRect().top),
  stageBottom: Math.round(document.getElementById('stage').getBoundingClientRect().bottom),
}));
console.log('end', JSON.stringify(end));
await page.screenshot({ path: path.join(outDir, 'b-end.png') });

const ok = start.off === true && end.off === true && rest.visible === true && rest.off === false;
console.log('PASS', ok);

fs.copyFileSync(path.join(outDir, 'b-start.png'), 'D:/AI agent/out/tab-intro-b-start.png');
fs.copyFileSync(path.join(outDir, 'b-rest.png'), 'D:/AI agent/out/tab-intro-b-rest.png');
fs.copyFileSync(path.join(outDir, 'b-end.png'), 'D:/AI agent/out/tab-intro-b-end.png');

await browser.close();
if (!ok) process.exit(1);
