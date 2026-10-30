import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 600));

for (const w of [1440, 1280, 1100, 1024, 900, 760, 680, 560, 390]) {
  await page.setViewport({ width: w, height: 950, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 260));
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')].map((c) => Math.round(c.getBoundingClientRect().width));
    const rows = [...document.querySelectorAll('.params tr')].map((tr) => Math.round(tr.getBoundingClientRect().width));
    return {
      cards, rows: rows[0], docW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      cols: getComputedStyle(document.querySelector('.cards')).gridTemplateColumns.split(' ').length,
      eStrip: Math.round(document.querySelector('.card[data-variant="E"] .strip').getBoundingClientRect().width),
    };
  });
  const bad = r.docW > r.clientW || r.cards.some((x) => x < 150) || r.rows < 40;
  console.log(`${String(w).padStart(4)}  cols=${r.cols} cards=[${r.cards}] paramsRow=${r.rows} eStrip=${r.eStrip} docW=${r.docW} clientW=${r.clientW} ${bad ? '<<< PROBLEM' : 'ok'}`);
}
await browser.close();
