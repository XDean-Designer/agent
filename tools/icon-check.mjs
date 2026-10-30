import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox','--allow-file-access-from-files'],
});
const page = await browser.newPage();
const bad = [];
page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
page.on('pageerror', (e) => bad.push('ERR ' + e.message));
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise(r => setTimeout(r, 800));
console.log('bad', JSON.stringify(bad));
console.log('icon:', await page.evaluate(() => document.querySelector('link[rel=icon]')?.href.slice(0, 60)));
await browser.close();
