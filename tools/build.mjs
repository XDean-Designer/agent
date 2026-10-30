import fs from 'node:fs';

// 把机器人头 SVG 内联成 data URI，产出真正单文件的 index.html
const svg = fs.readFileSync('D:/AI agent/assets/robot.svg', 'utf8');
const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');

let html = fs.readFileSync('D:/AI agent/src/app.html', 'utf8');
const before = (html.match(/"assets\/robot\.svg"/g) || []).length;
html = html.split('"assets/robot.svg"').join(`"${dataUri}"`);

fs.writeFileSync('D:/AI agent/index.html', html);
const kb = (fs.statSync('D:/AI agent/index.html').size / 1024).toFixed(1);
const left = (html.match(/"assets\//g) || []).length;
console.log(`index.html ${kb} KB  inlined=${before}  remainingExternalRefs=${left}`);
if (left > 0) { console.error('ERROR: still has external asset refs'); process.exit(1); }
