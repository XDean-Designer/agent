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

await page.goto('file:///D:/AI%20agent/tab-intro.html', { waitUntil: 'load', timeout: 60000 });

const wall0 = Date.now();
await page.waitForFunction(
  () => document.getElementById('stage').classList.contains('is-playing') && window.__introT0,
  { timeout: 8000 },
);

const snapAt = async (label, atMs) => {
  await page.waitForFunction((t) => performance.now() - window.__introT0 >= t, { timeout: 10000 }, atMs);
  const m = await page.evaluate(() => {
    const orb = document.getElementById('orb').getBoundingClientRect();
    const clip = document.getElementById('clip').getBoundingClientRect();
    const v = document.getElementById('clip');
    return {
      elapsed: Math.round(performance.now() - window.__introT0),
      orb: Math.round(orb.width),
      clip: Math.round(clip.width),
      t: +(v.currentTime || 0).toFixed(2),
      phaseOut: document.getElementById('orb').classList.contains('phase-out'),
    };
  });
  console.log(label, JSON.stringify(m));
  await page.screenshot({ path: path.join(outDir, `v6-${label}.png`) });
  await (await page.$('#orb')).screenshot({ path: path.join(outDir, `v6-${label}-orb.png`) });
  return m;
};

// shortly after open: full orb, media already past preroll
await snapAt('open', 250);
await snapAt('mid', 900);

await page.waitForFunction(
  () => document.getElementById('orb').classList.contains('phase-out'),
  { timeout: 10000 },
);
await new Promise((r) => setTimeout(r, 100));
const retracting = await page.evaluate(() => ({
  elapsed: Math.round(performance.now() - window.__introT0),
  orb: Math.round(document.getElementById('orb').getBoundingClientRect().width),
}));
console.log('retracting', JSON.stringify(retracting));
await page.screenshot({ path: path.join(outDir, 'v6-retracting.png') });

await page.waitForFunction(
  () => !document.getElementById('stage').classList.contains('is-playing'),
  { timeout: 10000 },
);
console.log('closeAfter', Date.now() - wall0);
await new Promise((r) => setTimeout(r, 200));
await page.screenshot({ path: path.join(outDir, 'v6-done.png') });

await browser.close();
