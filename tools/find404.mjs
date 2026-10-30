import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox','--proxy-server=http://127.0.0.1:15236','--ignore-certificate-errors'],
});
const page = await browser.newPage();
page.on('response', (r) => { if (r.status() >= 400) console.log(r.status(), r.url()); });
await page.goto('https://xdean-designer.github.io/agent/', { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise(r => setTimeout(r, 1500));
await browser.close();
