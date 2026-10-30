import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 1440, height: 1050, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (e) => { if (e.type() === 'error') errs.push('CONSOLE ' + e.text()); });
page.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url().split('/').pop()));

await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 900));

const info = await page.evaluate(() => {
  const st = (s) => document.querySelector(s);
  const hexes = [...document.querySelectorAll('.strip svg.hex')].map((s) => {
    const r = s.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), vb: s.getAttribute('viewBox'), cells: s.querySelector('pattern path')?.getAttribute('d')?.length };
  });
  return {
    cards: [...document.querySelectorAll('.card')].map((c) => ({
      v: c.dataset.variant, pressed: c.getAttribute('aria-pressed'), w: Math.round(c.getBoundingClientRect().width),
    })),
    hexes,
    bars: [...document.querySelectorAll('.strip .wave')].map((w) => w.children.length),
    dots: document.querySelectorAll('.strip .dots i').length,
    onBubbles: [...document.querySelectorAll('.stack .bubble')].filter((b) => b.classList.contains('on')).map((b) => b.dataset.variant),
    bar0: [...document.querySelectorAll('.strip .wave i')].slice(0, 4).map((i) => i.style.transform),
    head0: st('.card .head').style.transform,
    shadow0: st('.card .shadow').style.opacity,
    scrollW: document.documentElement.scrollWidth,
    docH: document.body.scrollHeight,
    cur: st('#curName').textContent,
  };
});
console.log(JSON.stringify(info, null, 1));

await page.screenshot({ path: 'D:/AI agent/.motion/new-full.png', fullPage: true });
console.log('errors', errs);
await browser.close();
