import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--force-color-profile=srgb'],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 3 },
});
const page = await browser.newPage();
await page.goto('file:///D:/AI%20agent/index.html', { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => document.getElementById('motionBtn').click());
await new Promise((r) => setTimeout(r, 150));

await page.screenshot({ path: 'D:/AI agent/.motion/final-3x.png', fullPage: true });

await page.click('.card[data-variant="E"]');
await new Promise((r) => setTimeout(r, 400));
const chat = await page.$('#chat');
await chat.screenshot({ path: 'D:/AI agent/.motion/chat-E.png' });

await page.click('.card[data-variant="D"]');
await new Promise((r) => setTimeout(r, 400));
await chat.screenshot({ path: 'D:/AI agent/.motion/chat-D.png' });

const card = await page.$('.card[data-variant="E"]');
await card.screenshot({ path: 'D:/AI agent/.motion/card-E3x.png' });

console.log('ok');
await browser.close();
