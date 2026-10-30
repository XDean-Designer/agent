import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
for (const [w, h, tag] of [[760, 1000, '760'], [680, 1000, '680'], [390, 900, '390']]) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 700));
  await (await page.$('.card[data-variant="E"]')).screenshot({ path: `D:/AI agent/.motion/bp-card-${tag}.png` });
  const s = await page.evaluate(() => {
    const st = document.querySelector('.card[data-variant="E"] .strip');
    return { w: Math.round(st.getBoundingClientRect().width), beats: +(st._w / st._beatPx).toFixed(2) };
  });
  console.log(tag, JSON.stringify(s));
}
await browser.close();
