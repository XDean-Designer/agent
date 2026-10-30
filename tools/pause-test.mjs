import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });

const read = () => page.evaluate(() => {
  const s = document.querySelector('.card[data-variant="E"] .strip');
  const dot = s.querySelector('.dot');
  const tA = s.querySelector('.tA');
  return {
    dotCx: dot && dot.getAttribute('cx'),
    tAx: tA && tA.getAttribute('x'),
    svgCount: s.querySelectorAll('svg').length,
    playing: document.getElementById('motionBtn').textContent,
  };
});

await new Promise((r) => setTimeout(r, 800));
console.log('before pause', JSON.stringify(await read()));

await page.click('#motionBtn');
await new Promise((r) => setTimeout(r, 100));
console.log('just after pause', JSON.stringify(await read()));

await new Promise((r) => setTimeout(r, 500));
console.log('500ms after pause', JSON.stringify(await read()));

// now simulate a resize event to see if rebuild wipes it
await page.setViewport({ width: 1439, height: 1000, deviceScaleFactor: 1 });
await new Promise((r) => setTimeout(r, 400));
console.log('after resize while paused', JSON.stringify(await read()));

await browser.close();
