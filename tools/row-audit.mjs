import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 500));

for (const v of ['A', 'D', 'E']) {
  await page.click(`.card[data-variant="${v}"]`);
  await new Promise((r) => setTimeout(r, 320));
  const d = await page.evaluate(() => {
    const row = document.querySelector('.stack .bubble.on');
    const strip = row.querySelector('.strip');
    const bars = [...row.querySelectorAll('.wave i')].map((b) => b.getBoundingClientRect().width);
    const sr = strip.getBoundingClientRect();
    const hex = row.querySelector('svg.hex');
    return {
      rowW: Math.round(row.getBoundingClientRect().width),
      stripW: Math.round(sr.width), stripH: Math.round(sr.height),
      bars: bars.length, barW: bars[0] ? Math.round(bars[0] * 10) / 10 : null,
      hex: hex ? hex.getAttribute('viewBox') : null,
      bubbleH: Math.round(row.getBoundingClientRect().height),
      overflow: row.scrollWidth > row.clientWidth + 1,
    };
  });
  console.log(v, JSON.stringify(d));
}
await browser.close();
