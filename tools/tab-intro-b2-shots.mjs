import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const outDir = 'D:/AI agent/.motion/tab-intro-b2';
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

await page.goto('file:///D:/AI%20agent/tab-intro-b2.html', { waitUntil: 'load', timeout: 60000 });
await page.waitForFunction(() => typeof window.__botBox === 'function', { timeout: 5000 });

const start = await page.evaluate(() => {
  const box = window.__botBox();
  const m = document.getElementById('mascot');
  return {
    phase: window.__introPhase || m.dataset.phase,
    w: box.w,
    h: box.h,
    dx: Math.abs(box.cx - box.aiCx),
    dy: Math.abs(box.cy - box.aiCy),
    playing: document.getElementById('stage').classList.contains('is-playing'),
  };
});
console.log('icon-start', JSON.stringify(start));
await page.screenshot({ path: path.join(outDir, 'b2-icon.png') });

await page.waitForFunction(() => window.__introPhase === 'icon-start', { timeout: 8000 }).catch(() => {});
await page.waitForFunction(() => window.__introPhase === 'rest', { timeout: 8000 });
await new Promise((r) => setTimeout(r, 200));
const rest = await page.evaluate(() => {
  const box = window.__botBox();
  const m = document.getElementById('mascot');
  const s = document.getElementById('stage').getBoundingClientRect();
  const b = m.getBoundingClientRect();
  const a = document.getElementById('aiBtn').getBoundingClientRect();
  return {
    phase: window.__introPhase,
    w: box.w,
    h: box.h,
    visible: b.bottom > s.top && b.top < s.bottom,
    dx: Math.abs(box.cx - box.aiCx),
    dy: Math.abs((b.top + b.height / 2) - (a.top + a.height / 2)),
    aiHidden: document.getElementById('stage').classList.contains('ai-hidden'),
    veilOn: document.getElementById('stage').classList.contains('is-playing'),
  };
});
console.log('rest-160', JSON.stringify(rest));
await page.screenshot({ path: path.join(outDir, 'b2-rest.png') });

await page.waitForFunction(() => window.__introPhase === 'icon-end', { timeout: 12000 });
await new Promise((r) => setTimeout(r, 80));
const end = await page.evaluate(() => {
  const box = window.__botBox();
  const m = document.getElementById('mascot');
  return {
    phase: window.__introPhase,
    w: box.w,
    h: box.h,
    dx: Math.abs(box.cx - box.aiCx),
    dy: Math.abs(box.cy - box.aiCy),
    playing: document.getElementById('stage').classList.contains('is-playing'),
    aiHidden: document.getElementById('stage').classList.contains('ai-hidden'),
    open: m.classList.contains('is-open'),
  };
});
console.log('icon-end', JSON.stringify(end));
await page.screenshot({ path: path.join(outDir, 'b2-end.png') });

const iconOk = (w) => w >= 40 && w <= 55;
const aligned = (d) => d <= 6;
const startOk = iconOk(start.w) && aligned(start.dx) && aligned(start.dy);
const restOk = rest.w >= 150 && rest.w <= 170 && rest.visible && rest.aiHidden && aligned(rest.dx) && rest.dy >= 28 && rest.dy <= 48;
const endOk = iconOk(end.w) && !end.playing && !end.open && !end.aiHidden && aligned(end.dx) && aligned(end.dy);
const ok = startOk && restOk && endOk;
console.log('PASS', ok, { startOk, restOk, endOk, startW: start.w, restW: rest.w, endW: end.w });

fs.copyFileSync(path.join(outDir, 'b2-icon.png'), 'D:/AI agent/out/tab-intro-b2-icon.png');
fs.copyFileSync(path.join(outDir, 'b2-rest.png'), 'D:/AI agent/out/tab-intro-b2-rest.png');
fs.copyFileSync(path.join(outDir, 'b2-end.png'), 'D:/AI agent/out/tab-intro-b2-end.png');

await browser.close();
if (!ok) process.exit(1);
