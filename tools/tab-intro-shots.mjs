import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const outDir = 'D:/AI agent/.motion/tab-intro';
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 440, height: 920, deviceScaleFactor: 2 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text());
});

await page.goto('file:///D:/AI%20agent/tab-intro.html', { waitUntil: 'load', timeout: 60000 });

const wall0 = Date.now();
await page.waitForFunction(
  () => document.getElementById('stage').classList.contains('is-playing') && window.__introT0,
  { timeout: 8000 },
);

const layout = await page.evaluate(() => {
  const stage = document.getElementById('stage').getBoundingClientRect();
  const tab = document.getElementById('tabWrap').getBoundingClientRect();
  const shot = document.querySelector('.home-shot');
  return {
    stage: { w: Math.round(stage.width), h: Math.round(stage.height) },
    tab: {
      w: Math.round(tab.width),
      h: Math.round(tab.height),
      bottomGap: Math.round(stage.bottom - tab.bottom),
      left: Math.round(tab.left - stage.left),
    },
    shotOk: !!(shot && shot.naturalWidth > 0),
  };
});
console.log('layout', JSON.stringify(layout));

const snapAt = async (label, atMs) => {
  await page.waitForFunction((t) => performance.now() - window.__introT0 >= t, { timeout: 10000 }, atMs);
  const m = await page.evaluate(() => {
    const orb = document.getElementById('orb').getBoundingClientRect();
    const img = document.getElementById('clip').getBoundingClientRect();
    return {
      elapsed: Math.round(performance.now() - window.__introT0),
      orb: Math.round(orb.width),
      img: Math.round(img.width),
      ratio: +(orb.width / 152).toFixed(3),
      phaseOut: document.getElementById('orb').classList.contains('phase-out'),
    };
  });
  console.log(label, JSON.stringify(m));
  await page.screenshot({ path: path.join(outDir, `v5-${label}.png`) });
  return m;
};

await snapAt('early', 200);
await snapAt('mid', 1200);

await page.waitForFunction(
  () => document.getElementById('orb').classList.contains('phase-out'),
  { timeout: 10000 },
);
// ~100ms into 280ms fast-out → mid-size
await new Promise((r) => setTimeout(r, 100));
const retracting = await page.evaluate(() => {
  const orb = document.getElementById('orb').getBoundingClientRect();
  return {
    elapsed: Math.round(performance.now() - window.__introT0),
    orb: Math.round(orb.width),
    phaseOut: document.getElementById('orb').classList.contains('phase-out'),
  };
});
console.log('retracting', JSON.stringify(retracting));
await page.screenshot({ path: path.join(outDir, 'v5-retracting.png') });

await page.waitForFunction(
  () => !document.getElementById('stage').classList.contains('is-playing'),
  { timeout: 10000 },
);
console.log('closeAfter', Date.now() - wall0);
await new Promise((r) => setTimeout(r, 200));
await page.screenshot({ path: path.join(outDir, 'v5-done.png') });

const done = await page.evaluate(() => {
  const ai = document.getElementById('aiBtn').getBoundingClientRect();
  return { aiVisible: getComputedStyle(document.getElementById('aiBtn')).opacity !== '0', aiW: Math.round(ai.width) };
});
console.log('done', JSON.stringify(done));

await browser.close();
